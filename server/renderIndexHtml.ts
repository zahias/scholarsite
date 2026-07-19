import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cachedTemplate: string | null = null;

function loadTemplate(): string {
  if (cachedTemplate) return cachedTemplate;
  const distPath = path.resolve(__dirname, "public", "index.html");
  cachedTemplate = fs.readFileSync(distPath, "utf-8");
  return cachedTemplate;
}

export interface PageMeta {
  title: string;
  description: string;
  image?: string;
  url: string;
  type?: "website" | "profile";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Server-side <head> templating for the handful of routes that need
// per-request meta (tenant profiles, the researcher preview) — link-preview
// bots and most crawlers don't execute the client-side SEO.tsx useEffect, so
// without this every shared profile link showed the generic marketing card.
// Client-side SEO.tsx still runs on top of this and updates the same tags in
// place (same selectors), so there's no duplication once JS loads.
export function renderIndexHtml(meta: PageMeta): string {
  let html = loadTemplate();
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(meta.url);
  const type = meta.type || "website";

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  html = html.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${description}" />`);
  html = html.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${url}" />`);

  const tags = [
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:site_name" content="Scholar.name" />`,
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
  ];
  if (meta.image) {
    const image = escapeHtml(meta.image);
    tags.push(`<meta property="og:image" content="${image}" />`);
    tags.push(`<meta property="og:image:width" content="1200" />`);
    tags.push(`<meta property="og:image:height" content="630" />`);
    tags.push(`<meta name="twitter:image" content="${image}" />`);
  }

  return html.replace("</head>", `${tags.join("\n    ")}\n  </head>`);
}
