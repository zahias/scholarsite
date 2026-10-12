// Server-rendered <head> for the marketing site. Crawlers and link-preview
// bots read the HTML Express sends, not what SEO.tsx sets after React mounts,
// so every public route needs its own title/description/canonical here —
// otherwise they all inherit index.html's homepage tags and Google folds them
// into the homepage as duplicates. Keep titles/descriptions in step with the
// <SEO> / <BlogPostLayout> props on each page.

export const SITE_ORIGIN = "https://scholar.name";
export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-image.jpg`;

export interface RouteMeta {
  title: string;
  description: string;
  /** Include in sitemap.xml */
  sitemap?: { priority: string; changefreq: string };
  /** Keep out of search results (auth, dashboards, checkout) */
  noindex?: boolean;
}

const PUBLIC_ROUTES: Record<string, RouteMeta> = {
  "/": {
    title: "Scholar.name — Academic Portfolio Website for Researchers",
    description: "Professional research portfolios for academics. Showcase publications, citations & impact — auto-updated from OpenAlex.",
    sitemap: { priority: "1.0", changefreq: "weekly" },
  },
  "/features": {
    title: "Features — Scholar.name",
    description: "Auto-syncing publications, citation analytics, customizable themes, and more. See everything Scholar.name offers researchers.",
    sitemap: { priority: "0.8", changefreq: "monthly" },
  },
  "/pricing": {
    title: "Pricing — Scholar.name",
    description: "Simple, transparent pricing for professional research portfolios.",
    sitemap: { priority: "0.8", changefreq: "monthly" },
  },
  "/faq": {
    title: "FAQ — Scholar.name",
    description: "Frequently asked questions about Scholar.name — data sources, pricing, custom domains, cancellation, and more.",
    sitemap: { priority: "0.6", changefreq: "monthly" },
  },
  "/about": {
    title: "About Scholar.name — Our Mission & Team",
    description: "Learn about Scholar.name, our mission to help researchers showcase their work, how we source data, and our commitment to accuracy and privacy.",
    sitemap: { priority: "0.5", changefreq: "monthly" },
  },
  "/contact": {
    title: "Enterprise & Institutions — Scholar.name",
    description: "Bring Scholar.name to your entire department or institution. Contact us for group and enterprise pricing.",
    sitemap: { priority: "0.6", changefreq: "monthly" },
  },
  "/demo": {
    title: "Demo Profile — Scholar.name",
    description: "See what a Scholar.name research portfolio looks like. Preview publication analytics, career timeline, and more.",
    sitemap: { priority: "0.5", changefreq: "monthly" },
  },
  "/blog": {
    title: "Blog — Scholar.name | Research Portfolio & Academic Career Resources",
    description: "Practical guides on academic portfolios, research metrics, career visibility, and how to stand out as a researcher online.",
    sitemap: { priority: "0.7", changefreq: "weekly" },
  },
  "/blog/google-scholar-vs-scholar-name": {
    title: "Google Scholar Profile vs. Scholar.name: Which Is Better for Researchers?",
    description: "Google Scholar is the default for academics — but it was never designed as a portfolio. Here's what it can't do, and how Scholar.name fills the gap.",
    sitemap: { priority: "0.6", changefreq: "monthly" },
  },
  "/blog/what-is-h-index": {
    title: "What Is an H-Index and How Do You Track It?",
    description: "The h-index is one of the most cited metrics in academic hiring and grant evaluation. Here's what it means, how it's calculated, and how to monitor yours automatically.",
    sitemap: { priority: "0.6", changefreq: "monthly" },
  },
  "/blog/how-to-create-academic-portfolio": {
    title: "How to Create an Academic Portfolio Website (Step by Step)",
    description: "A complete guide to building a professional academic portfolio — what to include, which tools to choose, and how to keep it updated without spending hours on maintenance.",
    sitemap: { priority: "0.6", changefreq: "monthly" },
  },
  "/blog/best-website-builders-researchers": {
    title: "Best Personal Website Builders for Researchers in 2026",
    description: "Comparing WordPress, Squarespace, Google Sites, ORCID, and Scholar.name — across setup time, cost, design quality, and the one feature most tools miss.",
    sitemap: { priority: "0.6", changefreq: "monthly" },
  },
  "/blog/academic-cv-vs-research-portfolio": {
    title: "Academic CV vs. Research Portfolio Website: What's the Difference?",
    description: "Your CV and your portfolio website serve different audiences at different moments. Here's how to think about both — and why every researcher needs each one.",
    sitemap: { priority: "0.6", changefreq: "monthly" },
  },
  "/privacy": {
    title: "Privacy Policy — Scholar.name",
    description: "Learn how Scholar.name collects, uses, and protects your personal information.",
    sitemap: { priority: "0.3", changefreq: "monthly" },
  },
  "/terms": {
    title: "Terms of Service — Scholar.name",
    description: "Terms and conditions governing your use of Scholar.name research portfolio service.",
    sitemap: { priority: "0.3", changefreq: "monthly" },
  },
};

const PRIVATE_ROUTES: Record<string, string> = {
  "/signup": "Sign Up — Scholar.name",
  "/login": "Sign In — Scholar.name",
  "/forgot-password": "Forgot Password — Scholar.name",
  "/reset-password": "Reset Password — Scholar.name",
  "/verify-email": "Verify Email — Scholar.name",
  "/dashboard": "Dashboard — Scholar.name",
  "/dashboard/login": "Sign In — Scholar.name",
  "/checkout": "Checkout — Scholar.name",
  "/checkout/success": "Payment Successful — Scholar.name",
  "/checkout/cancel": "Payment Cancelled — Scholar.name",
  "/admin": "Admin — Scholar.name",
  "/admin/login": "Admin Sign In — Scholar.name",
  "/admin/themes": "Admin — Scholar.name",
  "/admin/users": "Admin — Scholar.name",
  "/admin/customers": "Admin — Scholar.name",
  "/admin/payments": "Admin — Scholar.name",
  "/admin/sync": "Admin — Scholar.name",
};

const PRIVATE_PATTERNS = [/^\/admin\/customers\/[^/]+$/];

export const NOT_FOUND_META: RouteMeta = {
  title: "Page Not Found — Scholar.name",
  description: "The page you're looking for doesn't exist.",
  noindex: true,
};

export function normalizePath(path: string): string {
  const clean = path.split("?")[0].split("#")[0];
  return clean.length > 1 ? clean.replace(/\/+$/, "") : "/";
}

/** Meta for a marketing-site path, or null if the SPA has no such route. */
export function getMarketingRouteMeta(path: string): RouteMeta | null {
  const p = normalizePath(path);
  if (PUBLIC_ROUTES[p]) return PUBLIC_ROUTES[p];
  if (PRIVATE_ROUTES[p] || PRIVATE_PATTERNS.some((re) => re.test(p))) {
    return {
      title: PRIVATE_ROUTES[p] || "Admin — Scholar.name",
      description: PUBLIC_ROUTES["/"].description,
      noindex: true,
    };
  }
  return null;
}

export function getSitemapRoutes(): Array<{ path: string; priority: string; changefreq: string }> {
  return Object.entries(PUBLIC_ROUTES)
    .filter(([, meta]) => meta.sitemap)
    .map(([path, meta]) => ({ path, ...meta.sitemap! }));
}
