import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static";
import { startSyncScheduler, stopSyncScheduler } from "./services/syncScheduler";
import { pool } from "./db";

const app = express();

// Trust proxy for A2 Hosting (behind cPanel reverse proxy)
app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Warn loudly if SESSION_SECRET is not set in production
if (!process.env.SESSION_SECRET) {
  console.error('⚠️  WARNING: SESSION_SECRET not set — using insecure fallback. Set SESSION_SECRET env var ASAP!');
}

const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: false
  }),
  secret: process.env.SESSION_SECRET || 'research-profile-admin-secret-key',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
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
    console.error('Unhandled route error:', err);
  });

  // Production only - serve static files
  serveStatic(app);

  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen(port, () => {
    log(`serving on port ${port}`);
    
    startSyncScheduler(1);
    log('Sync scheduler started - checking tenants hourly');
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    log(`${signal} received — shutting down gracefully`);
    stopSyncScheduler();
    server.close(() => {
      pool?.end?.();
      log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
})().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
