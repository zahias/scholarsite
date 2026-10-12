import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { renderIndexHtml } from "./renderIndexHtml";
import { getMarketingRouteMeta, normalizePath, NOT_FOUND_META, SITE_ORIGIN } from "@shared/siteMeta";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve uploaded files (profile photos, CVs, PDFs)
  // Use process.cwd() which is the scholarsite directory on A2 Hosting
  const uploadsPath = path.resolve(process.cwd(), "uploads");
  console.log(`[Static] Serving uploads from: ${uploadsPath}`);
  if (!fs.existsSync(uploadsPath)) {
    // Create uploads directory if it doesn't exist
    try {
      fs.mkdirSync(uploadsPath, { recursive: true });
      console.log(`[Static] Created uploads directory: ${uploadsPath}`);
    } catch (err) {
      console.error(`[Static] Failed to create uploads directory:`, err);
    }
  }
  app.use("/uploads", express.static(uploadsPath));

  // index:false so "/" also goes through the per-route <head> below instead of
  // express.static handing back the raw template.
  app.use(express.static(distPath, { index: false }));

  app.use("*", (req, res) => {
    const pathname = normalizePath(req.originalUrl);

    // A missing asset (favicon, image, old bundle) must 404, not return the
    // SPA shell with a 200 — browsers and crawlers treat that as real content.
    if (path.extname(pathname)) {
      return res.status(404).type("text/plain").send("Not found");
    }

    if (req.tenant) {
      const tenantRoutes = ["/", "/dashboard", "/dashboard/login", "/privacy", "/terms"];
      const known = tenantRoutes.includes(pathname);
      const html = renderIndexHtml({
        title: known ? req.tenant.name : NOT_FOUND_META.title,
        description: known ? `${req.tenant.name} — research portfolio` : NOT_FOUND_META.description,
        url: `https://${req.hostname}${pathname === "/" ? "/" : pathname}`,
        noindex: !known || pathname.startsWith("/dashboard"),
      });
      return res.status(known ? 200 : 404).type("html").send(html);
    }

    const isProfilePath = /^\/researcher\/[^/]+$/.test(pathname);
    const meta = isProfilePath
      ? { title: "Research Profile — Scholar.name", description: NOT_FOUND_META.description, noindex: true }
      : getMarketingRouteMeta(pathname);
    const html = renderIndexHtml({
      ...(meta || NOT_FOUND_META),
      url: `${SITE_ORIGIN}${pathname}`,
    });
    return res.status(meta ? 200 : 404).type("html").send(html);
  });
}
