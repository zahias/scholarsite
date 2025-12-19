import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static";
import { startSyncScheduler } from "./services/syncScheduler";

// Log environment configuration status at startup
console.log("[Config] Environment check:");
console.log("[Config] - SMTP_PASSWORD:", process.env.SMTP_PASSWORD ? "configured" : "NOT SET");
console.log("[Config] - DATABASE_URL:", process.env.DATABASE_URL ? "configured" : "NOT SET");

const app = express();

// Trust proxy for proper HTTPS detection behind reverse proxy
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Changed to true for form parsing

// Set up PostgreSQL-backed session store
const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'sessions', // Managed by connect-pg-simple
    createTableIfMissing: true // Allow connect-pg-simple to manage the sessions table
  }),
  secret: process.env.SESSION_SECRET || 'research-profile-admin-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: 'auto',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Dynamic import of Vite - only in development
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Port configuration:
  // - Replit: Uses PORT env var, defaults to 5000
  // - A2 Hosting Passenger: Uses PORT env var set by Passenger
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // For Passenger compatibility, use simpler listen() when in production
  if (process.env.NODE_ENV === 'production') {
    server.listen(port, () => {
      log(`serving on port ${port}`);
      
      // Start the automated sync scheduler (checks every hour)
      startSyncScheduler(1);
      log('Sync scheduler started - checking tenants hourly');
    });
  } else {
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
      // Start the automated sync scheduler (checks every hour)
      startSyncScheduler(1);
      log('Sync scheduler started - checking tenants hourly');
    });
  }
})();
