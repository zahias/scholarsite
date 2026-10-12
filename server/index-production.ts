import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./static";
import { seedThemesIfEmpty } from "./services/themeSeed";
import { runMigrations } from "./runMigrations";
import { pool } from "./db";
import crypto from "crypto";

const app = express();

// Trust proxy for A2 Hosting (behind cPanel reverse proxy)
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Canonical origin: https, no www. LiteSpeed forwards X-Forwarded-Proto on
// https (secure session cookies depend on it), so only redirect when it
// explicitly says "http" — a missing header must never cause a redirect loop.
app.use((req, res, next) => {
  const host = (req.headers.host || '').toLowerCase();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (host === 'www.scholar.name' || forwardedProto === 'http') {
    const targetHost = host === 'www.scholar.name' ? 'scholar.name' : host;
    return res.redirect(301, `https://${targetHost}${req.originalUrl}`);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers
app.use((_req, res, next) => {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Enforced: directives that can't break legitimate page behavior.
  res.setHeader('Content-Security-Policy', "frame-ancestors 'self'; base-uri 'self'; object-src 'none'");
  // Full policy in report-only until it's been watched in production (browser
  // console shows violations); promote to the enforced header once clean.
  res.setHeader(
    'Content-Security-Policy-Report-Only',
    [
      "default-src 'self'",
      "script-src 'self' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join('; '),
  );
  next();
});

// The repo is public, so a hard-coded fallback secret would let anyone forge
// session cookies (including admin). Without SESSION_SECRET, use a random
// per-process secret instead: sessions reset on restart, but can't be forged.
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(48).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.error('⚠️  WARNING: SESSION_SECRET not set — using a random per-process secret; all sessions will reset on restart. Set SESSION_SECRET.');
}

const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'sessions',
    createTableIfMissing: true
  }),
  secret: sessionSecret,
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
  await runMigrations();
  const server = await registerRoutes(app);

  await seedThemesIfEmpty();

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    // Client errors (bad JSON, payload too large, upload filter) carry a
    // user-facing message; server errors may leak internals (SQL, paths).
    const message = status < 500 ? (err.message || "Bad Request") : "Internal Server Error";

    res.status(status).json({ message });
    console.error('Unhandled route error:', err);
  });

  // Production only - serve static files
  serveStatic(app);

  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen(port, () => {
    log(`serving on port ${port}`);
  });

  // Graceful shutdown
  const shutdown = (signal: string) => {
    log(`${signal} received — shutting down gracefully`);
    server.close(() => {
      pool?.end?.();
      log('HTTP server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
  });
})().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
