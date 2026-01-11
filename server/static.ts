import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

  app.use(express.static(distPath));

  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
