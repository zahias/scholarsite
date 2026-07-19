import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { randomUUID, timingSafeEqual } from "crypto";
import { storage } from "./storage";
import { OpenAlexService } from "./services/openalexApi";
import { insertResearcherProfileSchema, updateResearcherProfileSchema, insertThemeSchema, updateThemeSchema, type ResearchTopic, type Publication, type Affiliation } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import path from "path";
import { authRouter } from "./auth";
import { adminRouter } from "./adminRoutes";
import tenantRouter from "./tenantRoutes";
import researcherRouter from "./researcherRoutes";
import checkoutRouter from "./checkoutRoutes";
import { tenantResolver } from "./tenantMiddleware";
import { getTenantAccessMessage, getTenantAccessState, tenantHasServiceAccess } from "./billing";
import fetch from "node-fetch";
import nodemailer from "nodemailer";
import { runScheduledSync } from "./services/syncScheduler";
import { checkDatabaseHealth } from "./dbHealth";
import { pool } from "./db";
import { renderIndexHtml } from "./renderIndexHtml";

type PublicProfileClaimState = "unclaimed" | "active" | "inactive" | "orphaned" | "database_unavailable";

function hasValidJobToken(req: Request): boolean {
  const configuredToken = process.env.SYNC_JOB_TOKEN;
  const authorization = req.get('authorization');
  const providedToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!configuredToken || !providedToken) return false;

  const configured = Buffer.from(configuredToken);
  const provided = Buffer.from(providedToken);
  return configured.length === provided.length && timingSafeEqual(configured, provided);
}

function tokensMatch(configured: string | undefined, provided: string | undefined): boolean {
  if (!configured || !provided) return false;
  const configuredBuf = Buffer.from(configured);
  const providedBuf = Buffer.from(provided);
  return configuredBuf.length === providedBuf.length && timingSafeEqual(configuredBuf, providedBuf);
}

// Admin authentication middleware (for API endpoints - requires Bearer token)
function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check for admin API token
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    console.error('ADMIN_API_TOKEN environment variable not set');
    return res.status(500).json({ message: 'Admin authentication not configured' });
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn(`Unauthorized admin access attempt from ${req.ip} to ${req.path}`);
    return res.status(401).json({ message: 'Bearer token required for admin endpoints' });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  if (!tokensMatch(adminToken, token)) {
    console.warn(`Invalid admin token attempt from ${req.ip} to ${req.path}`);
    return res.status(403).json({ message: 'Invalid admin token' });
  }

  // Optional: IP restriction (allow localhost and private networks)
  const clientIP = req.ip || req.connection.remoteAddress;
  const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
  const isPrivateNetwork = clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.') || (clientIP ? /^(?:::ffff:)?172\.(1[6-9]|2\d|3[01])\./.test(clientIP) : false);

  if (!isLocalhost && !isPrivateNetwork && process.env.NODE_ENV === 'production') {
    console.warn(`Admin access denied from non-local IP ${clientIP} to ${req.path}`);
    return res.status(403).json({ message: 'Admin endpoints restricted to local access' });
  }

  // Log admin operation for audit trail
  console.log(`Admin operation: ${req.method} ${req.path} from ${clientIP}`);
  next();
}

// Session-based admin authentication middleware (for web interface)
function adminSessionAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Check the shared UI auth session first.
  if (req.session?.userId && req.session?.isAuthenticated && req.session?.userRole === 'admin') {
    // Log admin operation for audit trail
    console.log(`Admin web access: ${req.method} ${req.path} from ${req.ip}`);
    return next();
  }

  if ((req.session as any)?.isAdmin) {
    console.log(`Admin legacy web access: ${req.method} ${req.path} from ${req.ip}`);
    return next();
  }

  // Check Authorization header as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const adminToken = process.env.ADMIN_API_TOKEN;
    if (!adminToken) {
      console.error('ADMIN_API_TOKEN environment variable not set');
      return res.status(500).json({ message: 'Admin authentication not configured' });
    }
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (tokensMatch(adminToken, token)) {
      // Set session for future requests
      (req.session as any).isAdmin = true;
      console.log(`Admin operation: ${req.method} ${req.path} from ${req.ip}`);
      return next();
    }
  }

  // Not authenticated - return 401
  return res.status(401).json({ message: 'Authentication required' });
}

// Helper function to check if request is authenticated
function isAuthenticated(req: Request): boolean {
  const adminToken = process.env.ADMIN_API_TOKEN;

  if (req.session?.userId && req.session?.isAuthenticated && req.session?.userRole === 'admin') {
    return true;
  }

  // Check session
  if ((req.session as any)?.isAdmin) {
    return true;
  }

  // Check Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    if (!adminToken) return false;
    const token = authHeader.substring(7);
    return tokensMatch(adminToken, token);
  }

  return false;
}

// Rate limiting for admin endpoints (simple in-memory implementation)
const adminRateLimit = (() => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 100; // per window

  // Periodic cleanup to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of Array.from(requests.entries())) {
      if (now > data.resetTime) requests.delete(ip);
    }
  }, 60 * 60 * 1000); // cleanup every hour

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || 'unknown';
    const now = Date.now();

    const clientData = requests.get(clientIP);
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientIP, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }

    if (clientData.count >= MAX_REQUESTS) {
      console.warn(`Admin rate limit exceeded for IP ${clientIP}`);
      return res.status(429).json({ message: 'Rate limit exceeded for admin operations' });
    }

    clientData.count++;
    next();
  };
})();

// Rate limiting for public write endpoints (contact, chat, report, analytics)
const publicWriteRateLimit = (() => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 20; // per window per IP

  // Periodic cleanup to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of Array.from(requests.entries())) {
      if (now > data.resetTime) requests.delete(ip);
    }
  }, 60 * 60 * 1000); // cleanup every hour

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || 'unknown';
    const now = Date.now();

    const clientData = requests.get(clientIP);
    if (!clientData || now > clientData.resetTime) {
      requests.set(clientIP, { count: 1, resetTime: now + WINDOW_MS });
      return next();
    }

    if (clientData.count >= MAX_REQUESTS) {
      console.warn(`Public write rate limit exceeded for IP ${clientIP} on ${req.path}`);
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    clientData.count++;
    next();
  };
})();

// OpenAlex researcher data interface
interface OpenAlexResearcherData {
  works_count?: number;
  cited_by_count?: number;
  summary_stats?: {
    h_index?: number;
    i10_index?: number;
  };
  [key: string]: any;
}

// Security utility functions for safe HTML generation
function escapeHtml(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeHtmlAttribute(unsafe: string | undefined | null): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\t/g, ' ');
}

function validateAndSanitizeUrl(url: string | undefined | null): string {
  if (!url) return '#';

  // Remove any potentially dangerous characters
  const sanitized = String(url).replace(/[<>"']/g, '');

  // Only allow http, https, and relative URLs
  try {
    const urlObj = new URL(sanitized, 'https://example.com');
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      return sanitized;
    }
  } catch {
    // If URL parsing fails, check if it's a relative URL
    if (sanitized.startsWith('/') || sanitized.startsWith('#')) {
      return sanitized;
    }
  }

  // Default to safe fallback
  return '#';
}


// Static HTML template for exported researcher profiles
function generateStaticHTML(data: any): string {
  const { profile, researcher, topics, publications, affiliations, exportedAt, exportUrl } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtmlAttribute(profile.displayName) || 'Researcher Profile'} - Academic Profile</title>
    <meta name="description" content="${escapeHtmlAttribute(profile.bio) || `Academic profile of ${escapeHtmlAttribute(profile.displayName) || 'researcher'} with publications, research topics, and career information.`}">
    <meta name="author" content="${escapeHtmlAttribute(profile.displayName) || 'Researcher'}">
    
    <!-- Open Graph meta tags -->
    <meta property="og:title" content="${escapeHtmlAttribute(profile.displayName) || 'Researcher Profile'} - Academic Profile">
    <meta property="og:description" content="${escapeHtmlAttribute(profile.bio) || `Academic profile with ${publications?.length || 0} publications and ${researcher?.cited_by_count || 0} citations.`}">
    <meta property="og:type" content="profile">
    <meta property="og:url" content="${validateAndSanitizeUrl(exportUrl)}">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .stats-card { backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); }
        .publication-card { transition: all 0.3s ease; }
        .publication-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        @media print { .no-print { display: none !important; } }
    </style>
</head>
<body class="bg-gray-50 text-gray-900">
    <!-- Header -->
    <header class="gradient-bg text-white py-20">
        <div class="max-w-6xl mx-auto px-6">
            <div class="text-center">
                <div class="w-32 h-32 bg-white/20 rounded-full mx-auto mb-6 flex items-center justify-center backdrop-blur-sm">
                    <span class="text-4xl font-bold text-white">${escapeHtml((profile.displayName || 'R').charAt(0))}</span>
                </div>
                <h1 class="text-5xl font-bold mb-4">${escapeHtml(profile.displayName) || 'Researcher Profile'}</h1>
                ${profile.title ? `<p class="text-xl mb-4 text-white/90">${escapeHtml(profile.title)}</p>` : ''}
                ${profile.currentAffiliation ? `<p class="text-lg text-white/80">${escapeHtml(profile.currentAffiliation)}</p>` : ''}
                ${profile.bio ? `<p class="mt-6 text-white/90 max-w-3xl mx-auto leading-relaxed">${escapeHtml(profile.bio)}</p>` : ''}
            </div>
        </div>
    </header>

    <!-- Stats Overview -->
    <section class="py-16 -mt-10 relative z-10">
        <div class="max-w-6xl mx-auto px-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${publications?.length || 0}</div>
                    <div class="text-sm opacity-80">Publications</div>
                </div>
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${researcher?.cited_by_count || 0}</div>
                    <div class="text-sm opacity-80">Citations</div>
                </div>
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${researcher?.summary_stats?.h_index || 0}</div>
                    <div class="text-sm opacity-80">h-index</div>
                </div>
                <div class="stats-card rounded-lg p-6 text-center text-white border border-white/20">
                    <div class="text-3xl font-bold">${researcher?.summary_stats?.i10_index || 0}</div>
                    <div class="text-sm opacity-80">i10-index</div>
                </div>
            </div>
        </div>
    </section>

    <!-- Research Topics -->
    ${topics && topics.length > 0 ? `
    <section class="py-16 bg-white">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold mb-8 text-center">Research Areas</h2>
            <div class="flex flex-wrap gap-3 justify-center">
                ${topics.slice(0, 15).map((topic: ResearchTopic) => `
                    <span class="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        ${escapeHtml(topic.displayName)} (${escapeHtml(String(topic.count))})
                    </span>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Publications -->
    ${publications && publications.length > 0 ? `
    <section class="py-16 bg-gray-50">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold mb-8 text-center">Recent Publications</h2>
            <div class="space-y-6">
                ${publications.slice(0, 10).map((pub: Publication) => `
                    <div class="publication-card bg-white rounded-lg p-6 shadow-sm border">
                        <h3 class="text-xl font-semibold mb-2 text-gray-900">${escapeHtml(pub.title)}</h3>
                        ${pub.authorNames ? `<p class="text-gray-600 mb-2">${escapeHtml(pub.authorNames)}</p>` : ''}
                        <div class="flex flex-wrap gap-4 text-sm text-gray-500">
                            ${pub.journal ? `<span>📖 ${escapeHtml(pub.journal)}</span>` : ''}
                            ${pub.publicationYear ? `<span>📅 ${escapeHtml(String(pub.publicationYear))}</span>` : ''}
                            ${pub.citationCount ? `<span>📊 ${escapeHtml(String(pub.citationCount))} citations</span>` : ''}
                            ${pub.isOpenAccess ? '<span class="text-green-600">🔓 Open Access</span>' : ''}
                        </div>
                        ${pub.doi ? `<p class="mt-2 text-xs text-gray-400">DOI: ${escapeHtml(pub.doi)}</p>` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Affiliations -->
    ${affiliations && affiliations.length > 0 ? `
    <section class="py-16 bg-white">
        <div class="max-w-6xl mx-auto px-6">
            <h2 class="text-3xl font-bold mb-8 text-center">Institutional Affiliations</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${affiliations.map((aff: Affiliation) => `
                    <div class="bg-gray-50 rounded-lg p-6">
                        <h3 class="font-semibold text-lg mb-2">${escapeHtml(aff.institutionName)}</h3>
                        ${aff.institutionType ? `<p class="text-gray-600 mb-2">${escapeHtml(aff.institutionType)}</p>` : ''}
                        ${aff.countryCode ? `<p class="text-sm text-gray-500">📍 ${escapeHtml(aff.countryCode)}</p>` : ''}
                        ${aff.startYear || aff.endYear ? `
                            <p class="text-sm text-gray-500 mt-2">
                                ${escapeHtml(String(aff.startYear || '?'))} - ${escapeHtml(String(aff.endYear || 'Present'))}
                            </p>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </section>
    ` : ''}

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12">
        <div class="max-w-6xl mx-auto px-6 text-center">
            <p class="text-gray-400 mb-4">
                This profile was generated from OpenAlex data on ${escapeHtml(new Date(exportedAt).toLocaleDateString())}.
            </p>
            <p class="text-gray-500 text-sm">
                Data sourced from <a href="https://openalex.org" class="text-blue-400 hover:underline">OpenAlex</a> • 
                Generated by Research Profile Platform
            </p>
            <div class="mt-6 no-print">
                <a href="${validateAndSanitizeUrl(exportUrl)}" class="text-blue-400 hover:underline">View Live Profile</a>
            </div>
        </div>
    </footer>

    <script>
        // Add some interactivity
        document.addEventListener('DOMContentLoaded', function() {
            // Smooth scroll for any anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function (e) {
                    e.preventDefault();
                    document.querySelector(this.getAttribute('href')).scrollIntoView({
                        behavior: 'smooth'
                    });
                });
            });
        });
    </script>
</body>
</html>`;
}

// Bibliography export format generators
function generateBibTeX(publications: Publication[]): string {
  // Map OpenAlex publication types to valid BibTeX entry types
  const bibtexTypeMap: Record<string, string> = {
    'article': 'article',
    'journal-article': 'article',
    'review': 'article',
    'letter': 'article',
    'editorial': 'article',
    'book': 'book',
    'book-chapter': 'inbook',
    'monograph': 'book',
    'proceedings': 'proceedings',
    'proceedings-article': 'inproceedings',
    'conference-paper': 'inproceedings',
    'dataset': 'misc',
    'preprint': 'unpublished',
    'report': 'techreport',
    'dissertation': 'phdthesis',
    'patent': 'misc',
    'other': 'misc',
    'erratum': 'misc',
    'paratext': 'misc',
  };

  return publications.map((pub, index) => {
    const openalexType = pub.publicationType?.toLowerCase() || 'article';
    const bibtexType = bibtexTypeMap[openalexType] || 'misc';
    const key = `${bibtexType}${pub.publicationYear || 'unknown'}${index + 1}`;
    const authors = pub.authorNames?.replace(/,/g, ' and') || 'Unknown Author';
    const title = pub.title || 'Untitled';
    const year = pub.publicationYear || '';
    const journal = pub.journal || '';
    const doi = pub.doi || '';

    return `@${bibtexType}{${key},
  author = {${authors}},
  title = {${title}},
  journal = {${journal}},
  year = {${year}},
  doi = {${doi}},
  url = {https://doi.org/${doi}}
}`;
  }).join('\n\n');
}

function generateRIS(publications: Publication[]): string {
  return publications.map(pub => {
    const typeMap: Record<string, string> = {
      'article': 'JOUR',
      'book': 'BOOK',
      'book-chapter': 'CHAP',
      'preprint': 'UNPB',
      'review': 'JOUR',
      'letter': 'JOUR',
      'editorial': 'JOUR',
    };

    const type = typeMap[pub.publicationType?.toLowerCase() || ''] || 'GEN';
    const authors = (pub.authorNames || '').split(',').map(a => a.trim()).filter(a => a);

    let ris = `TY  - ${type}\n`;

    authors.forEach(author => {
      ris += `AU  - ${author}\n`;
    });

    if (pub.title) ris += `TI  - ${pub.title}\n`;
    if (pub.journal) ris += `JO  - ${pub.journal}\n`;
    if (pub.publicationYear) ris += `PY  - ${pub.publicationYear}\n`;
    if (pub.doi) ris += `DO  - ${pub.doi}\n`;
    if (pub.doi) ris += `UR  - https://doi.org/${pub.doi}\n`;

    ris += `ER  - \n`;

    return ris;
  }).join('\n');
}

function generateCSV(publications: Publication[]): string {
  const headers = ['Title', 'Authors', 'Journal', 'Year', 'Type', 'Citations', 'DOI', 'Open Access', 'Topics'];
  const rows = publications.map(pub => {
    return [
      escapeCSV(pub.title || ''),
      escapeCSV(pub.authorNames || ''),
      escapeCSV(pub.journal || ''),
      pub.publicationYear || '',
      escapeCSV(pub.publicationType || ''),
      pub.citationCount || 0,
      escapeCSV(pub.doi || ''),
      pub.isOpenAccess ? 'Yes' : 'No',
      escapeCSV(Array.isArray(pub.topics) ? pub.topics.join('; ') : '')
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const openalexService = new OpenAlexService();
  const PREVIEW_CACHE_TTL_MS = 15 * 60 * 1000;
  const PREVIEW_CACHE_MAX_ENTRIES = 100;
  const previewResponseCache = new Map<string, { expiresAt: number; data: any }>();
  const previewRequestsInFlight = new Map<string, Promise<any>>();

  const normalizeOpenAlexAuthorId = (value: string) => {
    const trimmed = value.trim().toUpperCase();
    return trimmed.startsWith('A') ? trimmed : `A${trimmed}`;
  };

  const getCachedPreview = (key: string) => {
    const entry = previewResponseCache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) {
      previewResponseCache.delete(key);
      return null;
    }
    // Refresh insertion order so the Map acts as a small LRU cache.
    previewResponseCache.delete(key);
    previewResponseCache.set(key, entry);
    return entry.data;
  };

  const cachePreview = (key: string, data: any) => {
    previewResponseCache.delete(key);
    previewResponseCache.set(key, { expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS, data });
    while (previewResponseCache.size > PREVIEW_CACHE_MAX_ENTRIES) {
      const oldestKey = previewResponseCache.keys().next().value;
      if (!oldestKey) break;
      previewResponseCache.delete(oldestKey);
    }
  };

  const buildPreviewResponse = async (openalexId: string) => {
    const [researcher, works] = await Promise.all([
      openalexService.getResearcher(openalexId),
      openalexService.getResearcherWorks(openalexId),
    ]);

    const topics = (researcher.topics || []).slice(0, 10).map((topic: any) => ({
      displayName: topic.display_name,
      subfield: topic.subfield?.display_name || null,
      field: topic.field?.display_name || null,
      domain: topic.domain?.display_name || null,
    }));
    const affiliations = (researcher.affiliations || []).slice(0, 5).map((aff: any) => ({
      institutionName: aff.institution?.display_name || 'Unknown Institution',
      years: aff.years || [],
    }));
    const normalizeTitle = (title: string | null | undefined): string => {
      if (!title) return 'Untitled';
      const cleaned = title
        .replace(/<[^>]*>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#?\w+;/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned || 'Untitled';
    };
    const publications = works.results.map((work: any) => ({
      id: work.id || '',
      title: normalizeTitle(work.display_name || work.title),
      authorNames: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean).join(', ') || null,
      journal: work.primary_location?.source?.display_name || null,
      publicationYear: work.publication_year,
      citationCount: work.cited_by_count || 0,
      topics: work.topics?.slice(0, 5).map((topic: any) => topic.display_name) || [],
      doi: work.doi || null,
      isOpenAccess: work.open_access?.is_oa || false,
      publicationType: work.type || 'article',
      openAccessUrl: work.open_access?.oa_url || null,
    }));
    const institution = researcher.last_known_institutions?.[0];
    const orcid = researcher.orcid || null;

    return {
      profile: {
        openalexId,
        displayName: researcher.display_name,
        title: null,
        currentAffiliation: null,
        department: null,
        bio: null,
        profileImageUrl: null,
        cvUrl: null,
        contactEmail: null,
        phone: null,
        officeLocation: null,
        location: null,
        countryCode: institution?.country_code || null,
        orcidId: orcid,
        orcidUrl: orcid ? `https://orcid.org/${orcid.replace('https://orcid.org/', '')}` : null,
        googleScholarUrl: null,
        linkedinUrl: null,
        twitterUrl: null,
        websiteUrl: null,
        researchInterests: topics.slice(0, 5).map((topic: any) => topic.displayName),
        isPublic: true,
        isPreview: true,
      },
      researcher,
      topics,
      publications,
      affiliations,
      lastSynced: new Date().toISOString(),
      isPreview: true,
      claimState: "unclaimed" as PublicProfileClaimState,
    };
  };

  const getPreviewResponse = async (openalexId: string) => {
    const cacheKey = normalizeOpenAlexAuthorId(openalexId);
    const cached = getCachedPreview(cacheKey);
    if (cached) return { data: cached, cacheStatus: "HIT" };

    let request = previewRequestsInFlight.get(cacheKey);
    const coalesced = Boolean(request);
    if (!request) {
      request = buildPreviewResponse(cacheKey)
        .then((data) => {
          cachePreview(cacheKey, data);
          return data;
        })
        .finally(() => {
          previewRequestsInFlight.delete(cacheKey);
        });
      previewRequestsInFlight.set(cacheKey, request);
    }

    return { data: await request, cacheStatus: coalesced ? "COALESCED" : "MISS" };
  };

  const sendPreviewResponse = async (
    req: Request,
    res: Response,
    openalexId: string,
    claimState: PublicProfileClaimState,
    accessState?: string,
  ) => {
    const requestId = req.get("x-request-id") || randomUUID();
    try {
      const { data, cacheStatus } = await getPreviewResponse(openalexId);
      res.set(
        "Cache-Control",
        claimState === "unclaimed" ? "public, max-age=300, stale-while-revalidate=600" : "private, no-cache",
      );
      res.set("Vary", "Accept-Encoding");
      res.set("X-Preview-Cache", cacheStatus);
      res.set("X-Profile-Source", "openalex");
      res.set("X-Request-Id", requestId);
      console.log(`[ProfileResolution] request=${requestId} openalex=${openalexId} source=openalex claim=${claimState}`);
      return res.json({ ...data, claimState, accessState: accessState || null });
    } catch (error) {
      const notFound = error instanceof Error && error.message.includes("OpenAlex API error: 404");
      console.error(
        `[ProfileResolution] request=${requestId} openalex=${openalexId} source=openalex claim=${claimState} error=${notFound ? "not_found" : "source_unavailable"}`,
      );
      return res.status(notFound ? 404 : 503).json({
        message: notFound ? "Researcher not found" : "Research profile temporarily unavailable",
        category: notFound ? "not_found" : "source_unavailable",
        requestId,
      });
    }
  };

  // Dynamic sitemap — the previous static client/public/sitemap.xml was
  // hand-maintained and missing /pricing, /features, /faq, and every blog
  // post. Regenerated per-request from the route list + live public tenants;
  // traffic is far too low for this to be a performance concern.
  app.get('/sitemap.xml', async (_req, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const staticUrls: Array<{ loc: string; priority: string; changefreq: string }> = [
      { loc: "https://scholar.name/", priority: "1.0", changefreq: "weekly" },
      { loc: "https://scholar.name/features", priority: "0.8", changefreq: "monthly" },
      { loc: "https://scholar.name/pricing", priority: "0.8", changefreq: "monthly" },
      { loc: "https://scholar.name/faq", priority: "0.6", changefreq: "monthly" },
      { loc: "https://scholar.name/contact", priority: "0.6", changefreq: "monthly" },
      { loc: "https://scholar.name/blog", priority: "0.7", changefreq: "weekly" },
      { loc: "https://scholar.name/blog/google-scholar-vs-scholar-name", priority: "0.6", changefreq: "monthly" },
      { loc: "https://scholar.name/blog/what-is-h-index", priority: "0.6", changefreq: "monthly" },
      { loc: "https://scholar.name/blog/how-to-create-academic-portfolio", priority: "0.6", changefreq: "monthly" },
      { loc: "https://scholar.name/blog/best-website-builders-researchers", priority: "0.6", changefreq: "monthly" },
      { loc: "https://scholar.name/blog/academic-cv-vs-research-portfolio", priority: "0.6", changefreq: "monthly" },
      { loc: "https://scholar.name/privacy", priority: "0.3", changefreq: "monthly" },
      { loc: "https://scholar.name/terms", priority: "0.3", changefreq: "monthly" },
    ];

    const tenantUrls: Array<{ loc: string; priority: string; changefreq: string }> = [];
    try {
      if (pool) {
        const tenants = await storage.getAllTenants();
        for (const tenant of tenants) {
          if (!tenantHasServiceAccess(tenant)) continue;
          const profile = await storage.getResearcherProfileByTenant(tenant.id).catch(() => null);
          if (!profile?.isPublic || !profile.openalexId) continue;
          const domains = await storage.getDomainsByTenant(tenant.id).catch(() => []);
          const primary = domains.find((d) => d.isPrimary) || domains[0];
          if (!primary) continue;
          tenantUrls.push({ loc: `https://${primary.hostname}/`, priority: "0.7", changefreq: "weekly" });
        }
      }
    } catch (error) {
      console.error("Error building tenant URLs for sitemap:", error);
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...[...staticUrls, ...tenantUrls].map((u) =>
        `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
      ),
      '</urlset>',
    ].join('\n');

    res.set('Content-Type', 'application/xml').send(xml);
  });

  // Tenant resolution middleware
  app.use(tenantResolver);

  // Server-rendered <head> for the two profile-sharing surfaces — link-preview
  // bots (LinkedIn, X, Slack, WhatsApp, iMessage) and most crawlers don't run
  // the client-side SEO.tsx useEffect, so without this every shared profile
  // link showed the generic marketing title/description/image. Falls through
  // to the plain SPA shell (unchanged behavior) on any lookup failure.
  app.get('/researcher/:openalexId', async (req, res, next) => {
    try {
      const { openalexId } = req.params;
      const profile = pool ? await storage.getResearcherProfileByOpenalexId(openalexId).catch(() => null) : null;
      const researcherData = await storage.getOpenalexData(openalexId, 'researcher').catch(() => null);
      let liveResearcher: any = researcherData?.data;
      if (!liveResearcher) {
        const preview: any = await getPreviewResponse(openalexId).catch(() => null);
        liveResearcher = preview?.data?.researcher;
      }
      const displayName = profile?.displayName || liveResearcher?.display_name;

      if (!profile && !liveResearcher) {
        res.status(404);
      }

      const description = profile?.bio
        || (liveResearcher ? `${displayName || "Researcher"} — ${liveResearcher.works_count || 0} publications, ${liveResearcher.cited_by_count || 0} citations` : "Research Profile");
      const image = profile?.profileImageUrl
        ? (profile.profileImageUrl.startsWith('http') ? profile.profileImageUrl : `https://scholar.name${profile.profileImageUrl}`)
        : undefined;

      const html = renderIndexHtml({
        title: `${displayName || "Researcher"} - Research Profile`,
        description,
        image,
        url: `https://scholar.name/researcher/${openalexId}`,
        type: 'profile',
      });
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next();
    }
  });

  const KNOWN_MARKETING_HOSTNAMES = ["localhost", "127.0.0.1", "scholar.name", "www.scholar.name", "scholarname.com", "www.scholarname.com"];
  app.get('/', async (req, res, next) => {
    try {
      const hostname = (req.hostname || "").toLowerCase();
      const isUnclaimedSubdomain = req.isMarketingSite
        && !KNOWN_MARKETING_HOSTNAMES.includes(hostname)
        && !hostname.endsWith(".replit.dev") && !hostname.endsWith(".replit.app") && !hostname.endsWith(".repl.co");
      if (isUnclaimedSubdomain) {
        const html = renderIndexHtml({
          title: "No portfolio here yet — Scholar.name",
          description: "This address hasn't been claimed as a Scholar.name profile yet.",
          url: `https://${hostname}/`,
        });
        res.status(404).set('Content-Type', 'text/html').send(html);
        return;
      }
      if (!req.tenant || req.isMarketingSite) return next();
      const profile = await storage.getResearcherProfileByTenant(req.tenant.id).catch(() => null);
      if (!profile || !profile.openalexId || !profile.isPublic) return next();

      const researcherData = await storage.getOpenalexData(profile.openalexId, 'researcher').catch(() => null);
      const liveResearcher: any = researcherData?.data;
      const displayName = profile.displayName || liveResearcher?.display_name || req.tenant.name || "Researcher";
      const description = profile.bio
        || (liveResearcher ? `${displayName} — ${liveResearcher.works_count || 0} publications, ${liveResearcher.cited_by_count || 0} citations` : `${displayName}'s research profile`);
      const image = profile.profileImageUrl
        ? (profile.profileImageUrl.startsWith('http') ? profile.profileImageUrl : `https://${req.hostname}${profile.profileImageUrl}`)
        : undefined;

      const html = renderIndexHtml({
        title: `${displayName} - Research Profile`,
        description,
        image,
        url: `https://${req.hostname}/`,
        type: 'profile',
      });
      res.set('Content-Type', 'text/html');
      res.send(html);
    } catch (error) {
      next();
    }
  });

  // Authentication routes
  app.use("/api/auth", authRouter);

  // Admin routes for user management
  app.use("/api/admin", adminRouter);

  // Tenant management routes (admin only)
  app.use("/api/admin", tenantRouter);

  // Researcher routes (for customer dashboard)
  app.use("/api/researcher", researcherRouter);

  // Checkout routes for payment processing
  app.use("/api/checkout", checkoutRouter);

  // Public objects endpoint - serves files from object storage public directories
  app.get('/public-objects/:filePath(*)', async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error('Error serving public object:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: 'File not found' });
      }
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  // QR Code generation endpoint
  app.get('/api/researcher/:openalexId/qr-code', async (req, res) => {
    try {
      const { openalexId } = req.params;
      const { url } = req.query;

      // Use provided URL or construct default profile URL
      const qrUrl = url || `${req.protocol}://${req.get('host')}/researcher/${openalexId}`;

      // Generate QR code
      const QRCode = (await import('qrcode')).default;
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl as string, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Return as PNG image
      const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (error) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: "Failed to generate QR code" });
    }
  });

  // Site context - tells frontend if this is a tenant site or marketing site
  app.get('/api/site-context', async (req, res) => {
    try {
      if (req.tenantResolutionFailed) {
        return res.status(503).json({
          message: "Tenant profile temporarily unavailable",
          category: "database_unreachable",
        });
      }
      const tenant = (req as any).tenant;
      const isMarketingSite = (req as any).isMarketingSite;

      if (isMarketingSite || !tenant) {
        return res.json({
          isTenantSite: false,
          isMarketingSite: true,
          tenant: null
        });
      }

      const accessState = getTenantAccessState(tenant);

      // Get the researcher profile for this tenant
      const profile = await storage.getResearcherProfileByTenant(tenant.id);

      return res.json({
        isTenantSite: true,
        isMarketingSite: false,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
        },
        hasProfile: !!profile?.openalexId,
        openalexId: profile?.openalexId || null,
        accessState,
        accessMessage: getTenantAccessMessage(accessState),
      });
    } catch (error) {
      console.error("Error getting site context:", error);
      return res.status(503).json({
        message: "Tenant profile temporarily unavailable",
        category: "database_unreachable",
      });
    }
  });

  // Tenant-based profile route (when accessed via custom domain)
  app.get('/api/profile', async (req, res) => {
    try {
      if (req.tenantResolutionFailed) {
        return res.status(503).json({
          message: "Tenant profile temporarily unavailable",
          category: "database_unreachable",
        });
      }
      const tenant = (req as any).tenant;

      if (!tenant) {
        return res.status(404).json({ message: "No tenant found for this domain" });
      }

      const accessState = getTenantAccessState(tenant);
      const profile = await storage.getResearcherProfileByTenant(tenant.id);

      if (!profile || !profile.openalexId) {
        return res.status(404).json({
          message: "Profile not configured",
          tenantName: tenant.name,
          tenantStatus: tenant.status
        });
      }

      if (!tenantHasServiceAccess(tenant) || !profile.isPublic) {
        return sendPreviewResponse(req, res, profile.openalexId, "inactive", accessState);
      }

      // Get cached data
      const researcherData = await storage.getOpenalexData(profile.openalexId, 'researcher');
      const researchTopics = await storage.getResearchTopics(profile.openalexId);
      const publications = await storage.getPublications(profile.openalexId);
      const affiliations = await storage.getAffiliations(profile.openalexId);
      // Phase 3: Get custom profile sections
      const profileSections = await storage.getProfileSections(profile.id);

      // Sort publications: featured first, then by year/citations
      const sortedPublications = [...publications].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if ((b.publicationYear || 0) !== (a.publicationYear || 0)) {
          return (b.publicationYear || 0) - (a.publicationYear || 0);
        }
        return (b.citationCount || 0) - (a.citationCount || 0);
      });

      return res.json({
        profile: {
          ...profile,
        },
        researcher: researcherData?.data || null,
        topics: researchTopics,
        publications: sortedPublications,
        affiliations,
        profileSections: profileSections.filter((s: any) => s.isVisible),
        lastSynced: profile.lastSyncedAt,
        tenant: {
          name: tenant.name,
          plan: tenant.plan,
          hostname: req.hostname,
        },
        isPreview: false,
        claimState: "active" as PublicProfileClaimState,
        accessState,
      });
    } catch (error) {
      console.error("Error fetching tenant profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Public researcher data routes
  app.get('/api/researcher/:openalexId/data', async (req, res) => {
    const { openalexId } = req.params;
    const requestId = req.get("x-request-id") || randomUUID();
    let profile;

    if (!pool) {
      console.error(`[ProfileResolution] request=${requestId} openalex=${openalexId} database=unavailable stage=configuration`);
      return sendPreviewResponse(req, res, openalexId, "database_unavailable");
    }

    try {
      profile = await storage.getResearcherProfileByOpenalexId(openalexId);
    } catch (error) {
      console.error(`[ProfileResolution] request=${requestId} openalex=${openalexId} database=unavailable stage=profile_lookup`);
      return sendPreviewResponse(req, res, openalexId, "database_unavailable");
    }

    if (!profile) {
      return sendPreviewResponse(req, res, openalexId, "unclaimed");
    }

    if (!profile.tenantId) {
      return sendPreviewResponse(req, res, openalexId, "orphaned");
    }

    try {
      const tenant = await storage.getTenant(profile.tenantId);
      if (!tenant) {
        return sendPreviewResponse(req, res, openalexId, "orphaned");
      }

      const accessState = getTenantAccessState(tenant);
      if (!profile.isPublic || !tenantHasServiceAccess(tenant)) {
        return sendPreviewResponse(req, res, openalexId, "inactive", accessState);
      }

      const [researcherData, researchTopics, publications, affiliations, profileSections] = await Promise.all([
        storage.getOpenalexData(openalexId, 'researcher'),
        storage.getResearchTopics(openalexId),
        storage.getPublications(openalexId),
        storage.getAffiliations(openalexId),
        storage.getProfileSections(profile.id),
      ]);
      const liveFallback = researcherData?.data ? null : (await getPreviewResponse(openalexId)).data;
      const sortedPublications = [...(liveFallback?.publications || publications)].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if ((b.publicationYear || 0) !== (a.publicationYear || 0)) {
          return (b.publicationYear || 0) - (a.publicationYear || 0);
        }
        return (b.citationCount || 0) - (a.citationCount || 0);
      });

      res.set("Cache-Control", "private, no-cache");
      res.set("X-Profile-Source", liveFallback ? "database+openalex" : "database");
      res.set("X-Request-Id", requestId);
      console.log(`[ProfileResolution] request=${requestId} openalex=${openalexId} source=${liveFallback ? "database+openalex" : "database"} claim=active`);
      return res.json({
        profile,
        researcher: researcherData?.data || liveFallback?.researcher || null,
        topics: liveFallback?.topics || researchTopics,
        publications: sortedPublications,
        affiliations: liveFallback?.affiliations || affiliations,
        profileSections: profileSections.filter((s: any) => s.isVisible),
        lastSynced: profile.lastSyncedAt,
        isPreview: false,
        claimState: "active" as PublicProfileClaimState,
        accessState,
      });
    } catch (error) {
      console.error(`[ProfileResolution] request=${requestId} openalex=${openalexId} database=unavailable stage=claimed_profile`);
      return sendPreviewResponse(req, res, openalexId, "database_unavailable");
    }
  });

  // SECURE ADMIN ENDPOINTS - Requires Bearer token authentication
  // These endpoints are protected and can only be accessed with valid admin token

  // Create researcher profile (ADMIN ONLY)
  app.post('/api/admin/researcher/profile', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    // Check if user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      // Get or create system admin user for admin-created profiles
      let systemUser = await storage.getUserByEmail('system@admin.local');
      if (!systemUser) {
        try {
          systemUser = await storage.createUser({
            email: 'system@admin.local',
            passwordHash: 'SYSTEM_USER_NO_LOGIN',
            firstName: 'System',
            lastName: 'Admin',
            role: 'admin',
          });
        } catch (e: any) {
          if (e?.code !== '23505') throw e; // re-throw non-unique-constraint errors
          systemUser = (await storage.getUserByEmail('system@admin.local'))!;
        }
      }

      const profileData = insertResearcherProfileSchema.parse({
        ...req.body,
        userId: systemUser.id
      });
      const profile = await storage.upsertResearcherProfile(profileData);

      if (profile.openalexId) {
        // Trigger initial data sync from OpenAlex (non-blocking)
        openalexService.syncResearcherData(profile.openalexId).catch(error => {
          console.error(`Failed to sync OpenAlex data for ${profile.openalexId}:`, error);
        });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error creating researcher profile:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create researcher profile" });
      }
    }
  });

  // Update researcher profile (ADMIN ONLY)
  app.put('/api/admin/researcher/profile/:openalexId', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    // Check if user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      const { openalexId } = req.params;

      // Find profile by OpenAlex ID
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }

      const updates = updateResearcherProfileSchema.parse({
        ...req.body,
        id: profile.id
      });

      const updatedProfile = await storage.updateResearcherProfile(profile.id, updates);

      res.json(updatedProfile);
    } catch (error) {
      console.error("Error updating researcher profile:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update researcher profile" });
      }
    }
  });

  // Get researcher profile for editing (ADMIN ONLY)
  app.get('/api/admin/researcher/profile/:openalexId', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    // Check if user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);

      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }

      res.json(profile);
    } catch (error) {
      console.error("Error fetching researcher profile:", error);
      res.status(500).json({ message: "Failed to fetch researcher profile" });
    }
  });

  // Sync researcher data (ADMIN ONLY)
  app.post('/api/admin/researcher/:openalexId/sync', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    // Check if user is authenticated
    if (!isAuthenticated(req)) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);

      if (!profile) {
        return res.status(404).json({ message: "Researcher profile not found" });
      }

      if (profile.openalexId) {
        await openalexService.syncResearcherData(profile.openalexId);
      }

      // Update last synced timestamp
      await storage.updateResearcherProfile(profile.id, {
        lastSyncedAt: new Date()
      });

      res.json({ message: "Data sync completed successfully" });
    } catch (error) {
      console.error("Error syncing researcher data:", error);
      res.status(500).json({ message: "Failed to sync researcher data" });
    }
  });

  // Search researchers by OpenAlex ID (public)
  app.get('/api/openalex/search/:openalexId', async (req, res) => {
    try {
      const { openalexId } = req.params;
      const data = await openalexService.getResearcher(openalexId);
      res.json(data);
    } catch (error) {
      console.error("Error searching OpenAlex:", error);
      res.status(500).json({ message: "Failed to search OpenAlex" });
    }
  });

  // Get author preview for landing page (public - no auth required)
  app.get('/api/openalex/author/:openalexId', async (req, res) => {
    try {
      const { openalexId } = req.params;
      const data = await openalexService.getResearcher(openalexId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching OpenAlex author:", error);
      if (error instanceof Error && (error instanceof Error ? error.message : "Unknown error").includes('404')) {
        return res.status(404).json({ message: "Researcher not found in OpenAlex" });
      }
      res.status(500).json({ message: "Failed to fetch author data" });
    }
  });

  // Search authors by name using OpenAlex full search API (public - for landing page search)
  app.get('/api/openalex/autocomplete', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      // OpenAlex's /authors?search= is a full-text search across the whole
      // author record (including affiliations), so "Marie Curie" could return
      // unrelated people at unrelated institutions ahead of the real match.
      // /autocomplete/authors is purpose-built for name-prefix lookups and
      // ranks by name relevance first — preserve that ordering, then promote
      // exact normalized name matches on top of it.
      const response = await fetch(
        `https://api.openalex.org/autocomplete/authors?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`);
      }

      const data = await response.json() as { results: any[] };

      const normalizeName = (value: string) => value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');

      const normalizedQuery = normalizeName(query);
      const queryTokens = normalizedQuery.split(' ').filter(Boolean);

      const results = data.results
        .map((author: any, relevanceIndex: number) => {
          const normalizedName = normalizeName(author.display_name || '');
          const nameTokens = new Set(normalizedName.split(' ').filter(Boolean));
          const isExact = normalizedName === normalizedQuery;
          const containsAllTokens = queryTokens.length > 0 && queryTokens.every((token) => nameTokens.has(token));

          return {
            id: author.id.replace('https://openalex.org/', ''),
            display_name: author.display_name,
            hint: author.hint || author.last_known_institutions?.[0]?.display_name || '',
            works_count: author.works_count || 0,
            cited_by_count: author.cited_by_count || 0,
            rank: isExact ? 0 : containsAllTokens ? 1 : 2,
            relevanceIndex,
          };
        })
        .sort((a, b) => {
          if (a.rank !== b.rank) return a.rank - b.rank;
          if (a.rank === 0 && a.works_count !== b.works_count) return b.works_count - a.works_count;
          return a.relevanceIndex - b.relevanceIndex;
        })
        .map(({ rank: _rank, relevanceIndex: _relevanceIndex, ...author }) => author);

      res.json({ results });
    } catch (error) {
      console.error("Error searching OpenAlex authors:", error);
      res.status(500).json({ message: "Failed to search authors" });
    }
  });

  // Health check endpoint (public, for monitoring)
  app.get('/api/health', async (_req, res) => {
    const database = await checkDatabaseHealth();
    if (!database.connected || !database.schemaReady) {
      if (database.missingColumns.length > 0) {
        console.error(`[DatabaseHealth] Missing required columns: ${database.missingColumns.join(", ")}`);
      }
      if (database.missingConstraints.length > 0) {
        console.error(`[DatabaseHealth] Missing required unique constraints: ${database.missingConstraints.join(", ")}`);
      }
      if (database.missingPrivileges.length > 0) {
        console.error(`[DatabaseHealth] Missing required table privileges: ${database.missingPrivileges.join(", ")}`);
      }
      return res.status(503).json({
        status: 'error',
        category: database.category,
        timestamp: new Date().toISOString(),
        database: {
          connected: database.connected,
          schemaReady: database.schemaReady,
        },
      });
    }
    return res.json({
      status: 'ok',
      category: database.category,
      timestamp: new Date().toISOString(),
      database: { connected: true, schemaReady: true },
    });
  });

  app.post('/api/internal/jobs/openalex-sync', async (req, res) => {
    if (!process.env.SYNC_JOB_TOKEN) {
      console.error('[SyncJob] SYNC_JOB_TOKEN is not configured');
      return res.status(503).json({ message: 'Scheduled synchronization is not configured' });
    }

    if (!hasValidJobToken(req)) {
      return res.status(401).json({ message: 'Invalid job token' });
    }

    try {
      const stats = await runScheduledSync();
      if (stats.alreadyRunning) {
        return res.status(409).json({ message: 'Synchronization already running', ...stats });
      }
      return res.json({ message: 'Scheduled synchronization completed', ...stats });
    } catch (error) {
      console.error('[SyncJob] Scheduled synchronization failed:', error);
      return res.status(500).json({ message: 'Scheduled synchronization failed' });
    }
  });

  // Contact form submission (public)
  app.post('/api/contact', publicWriteRateLimit, async (req, res) => {
    console.log("[Contact] Received contact form submission");
    try {
      const {
        fullName, email, role, planInterest, researchField, openalexId, preferredTheme,
        institution: institutionRaw, institutionName,
        estimatedProfiles: estimatedProfilesRaw, teamSize,
        biography: biographyRaw, message,
      } = req.body;
      const institution = institutionRaw || institutionName;
      const estimatedProfiles = estimatedProfilesRaw || teamSize;
      const biography = biographyRaw || message;
      console.log("[Contact] Form data:", { fullName, email, planInterest });

      if (!fullName || !email || !planInterest || !biography) {
        console.log("[Contact] Missing required fields");
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate SMTP configuration
      if (!process.env.SMTP_PASSWORD) {
        console.log("[Contact] SMTP_PASSWORD environment variable not configured");
        console.log("[Contact] Available env vars:", Object.keys(process.env).filter(k => !k.includes('npm') && !k.includes('PATH')).join(', '));
        return res.status(500).json({
          message: "Email service not configured. Please add SMTP_PASSWORD to environment variables in A2 Hosting cPanel.",
          hint: "In cPanel Node.js Selector, add environment variable: SMTP_PASSWORD=your_email_password"
        });
      }
      console.log("[Contact] SMTP password configured, creating transporter...");

      // Configure SMTP transporter for A2 Hosting
      // A2 Hosting typically uses localhost for SMTP, but can also use mail server hostname
      const smtpHost = process.env.SMTP_HOST || "localhost";
      const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
      const smtpUser = process.env.SMTP_USER || "info@scholar.name";

      console.log(`[Contact] SMTP Config: host=${smtpHost}, port=${smtpPort}, user=${smtpUser}`);

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        },
      });
      console.log("[Contact] Transporter created, verifying connection...");

      // Format email content
      const emailContent = [
        "New ScholarName Inquiry",
        "",
        "Contact Information:",
        `- Name: ${fullName}`,
        `- Email: ${email}`,
        `- Institution: ${institution || 'Not provided'}`,
        `- Role: ${role || 'Not provided'}`,
        "",
        `Plan Interest: ${planInterest}`,
        estimatedProfiles ? `Estimated Profiles: ${estimatedProfiles}` : null,
        "",
        "Research Details:",
        `- Field: ${researchField || 'Not provided'}`,
        `- OpenAlex ID: ${openalexId || 'Not provided'}`,
        preferredTheme ? `- Preferred Theme: ${preferredTheme}` : null,
        "",
        "Biography:",
        biography,
        "",
        "---",
        `Submitted: ${new Date().toISOString()}`,
      ].filter(line => line !== null).join("\n");

      // Verify SMTP connection first
      try {
        await transporter.verify();
        console.log("[Contact] SMTP connection verified successfully");
      } catch (verifyError: any) {
        const errorMsg = verifyError.message || String(verifyError);
        console.log(`[Contact] SMTP connection verification failed: ${errorMsg}`);
        console.log(`[Contact] Error code: ${verifyError.code || 'N/A'}`);
        console.log(`[Contact] Error command: ${verifyError.command || 'N/A'}`);

        // Provide helpful error message based on common issues
        let userMessage = "Email service connection failed";
        if (errorMsg.includes("Invalid login") || errorMsg.includes("authentication")) {
          userMessage = "Email authentication failed. Please check SMTP_PASSWORD in environment variables.";
        } else if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ENOTFOUND")) {
          userMessage = "Cannot connect to email server. Please check SMTP_HOST setting (try 'localhost' for A2 Hosting).";
        } else if (errorMsg.includes("ETIMEDOUT")) {
          userMessage = "Email server connection timed out. Please check SMTP settings.";
        }

        return res.status(500).json({
          message: userMessage,
          error: process.env.NODE_ENV === 'development' ? errorMsg : undefined
        });
      }

      // Send email
      console.log("[Contact] Sending email...");
      const adminEmail = await transporter.sendMail({
        from: `"ScholarName" <${smtpUser}>`,
        to: "info@scholar.name",
        replyTo: email,
        subject: `New Inquiry: ${planInterest} Plan - ${fullName}`,
        text: emailContent,
      });
      console.log(`[Contact] Admin email sent: ${adminEmail.messageId}`);
      console.log(`[Contact] Admin response: ${JSON.stringify(adminEmail)}`);

      const escapeHtml = (value: string) =>
        value
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

      const safeFullName = escapeHtml(fullName);
      const safePlan = escapeHtml(planInterest);
      const safeEmail = escapeHtml(email);
      const safeInstitution = institution ? escapeHtml(institution) : "Not provided";
      const safeRole = role ? escapeHtml(role) : "Not provided";

      const userMessage = [
        `Hi ${fullName},`,
        "",
        "Thanks for contacting ScholarName. We've received your request and our team will review it shortly.",
        "",
        "Summary:",
        `- Name: ${fullName}`,
        `- Email: ${email}`,
        `- Plan: ${planInterest}`,
        institution ? `- Institution: ${institution}` : "- Institution: Not provided",
        role ? `- Role: ${role}` : "- Role: Not provided",
        "",
        "What happens next:",
        "- We will respond within 1-2 business days.",
        "- Reply to this email if you want to add more details or attachments.",
        "",
        "Best,",
        "The ScholarName Team",
      ].join("\n");

      const userHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ScholarName Inquiry</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#1a2332;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f5f7fb;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(11,31,58,0.08);">
            <tr>
              <td style="background-color:#0b1f3a;color:#ffffff;padding:24px 32px;">
                <div style="font-size:20px;font-weight:700;letter-spacing:0.5px;">ScholarName</div>
                <div style="font-size:14px;opacity:0.9;">Inquiry received</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px;">
                <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Hi ${safeFullName},</div>
                <div style="font-size:14px;line-height:1.6;margin-bottom:20px;">
                  Thanks for contacting ScholarName. We have received your request and our team will review it shortly.
                </div>
                <div style="background-color:#f7f9fc;border:1px solid #e3e8f0;border-radius:10px;padding:16px 18px;margin-bottom:20px;">
                  <div style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#4a5b72;margin-bottom:10px;">
                    Your summary
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size:14px;line-height:1.6;">
                    <tr><td style="width:140px;color:#4a5b72;">Name</td><td style="font-weight:600;">${safeFullName}</td></tr>
                    <tr><td style="color:#4a5b72;">Email</td><td style="font-weight:600;">${safeEmail}</td></tr>
                    <tr><td style="color:#4a5b72;">Plan</td><td style="font-weight:600;">${safePlan}</td></tr>
                    <tr><td style="color:#4a5b72;">Institution</td><td>${safeInstitution}</td></tr>
                    <tr><td style="color:#4a5b72;">Role</td><td>${safeRole}</td></tr>
                  </table>
                </div>
                <div style="font-size:14px;line-height:1.6;margin-bottom:18px;">
                  <strong>What happens next:</strong><br />
                  We will respond within 1-2 business days. If you want to add more details, simply reply to this email.
                </div>
                <div style="font-size:13px;color:#4a5b72;line-height:1.6;">
                  Need to reach us sooner? Email <a href="mailto:info@scholar.name" style="color:#0b1f3a;text-decoration:none;">info@scholar.name</a>.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background-color:#f7f9fc;font-size:12px;color:#6b778a;text-align:center;">
                ScholarName · Research portfolio websites for academics
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
      `.trim();

      const userEmail = await transporter.sendMail({
        from: `"ScholarName" <${smtpUser}>`,
        to: email,
        replyTo: "info@scholar.name",
        subject: `Thanks for reaching out to ScholarName`,
        text: userMessage,
        html: userHtml,
      });

      console.log(`[Contact] Auto-reply sent to user: ${userEmail.messageId}`);
      console.log(`[Contact] User response: ${JSON.stringify(userEmail)}`);

      res.json({
        success: true,
        message: "Inquiry submitted successfully"
      });
    } catch (error: unknown) {
      const errorMsg = (error instanceof Error ? error.message : "Unknown error") || String(error);
      console.log(`[Contact] Error processing contact form: ${errorMsg}`);
      console.log(`[Contact] Error code: ${(error as any)?.code || 'N/A'}`);
      console.log(`[Contact] Full error: ${JSON.stringify(error, Object.getOwnPropertyNames(error as any))}`);

      // Provide more helpful error messages
      let userMessage = "Failed to process inquiry";
      if (errorMsg.includes("Invalid login") || errorMsg.includes("authentication")) {
        userMessage = "Email authentication failed. Please check SMTP credentials.";
      } else if (errorMsg.includes("ECONNREFUSED") || errorMsg.includes("ENOTFOUND")) {
        userMessage = "Cannot connect to email server. Please check SMTP settings.";
      }

      res.status(500).json({
        message: userMessage,
        error: process.env.NODE_ENV === 'development' ? errorMsg : undefined
      });
    }
  });

  // Export bibliography in various formats (public)
  app.get('/api/researcher/:openalexId/export-bibliography', async (req, res) => {
    try {
      const { openalexId } = req.params;
      const format = (req.query.format as string) || 'bibtex';

      if (!/^A\d+$/.test(openalexId)) {
        return res.status(400).json({ message: "Invalid OpenAlex author ID" });
      }

      // Get researcher profile - allow if public OR if accessed from tenant domain
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      const tenant = (req as any).tenant;

      // Allow access if: profile is public OR request comes from a tenant site with matching profile
      const isAuthorized = profile && (profile.isPublic || (tenant && profile.tenantId === tenant.id));

      if (profile && !isAuthorized) {
        return res.status(404).json({ message: "Researcher not found or not public" });
      }

      let publications: Publication[];
      let displayName = profile?.displayName || 'researcher';

      if (isAuthorized) {
        publications = await storage.getPublications(openalexId);
      } else {
        const [researcher, works] = await Promise.all([
          openalexService.getResearcher(openalexId),
          openalexService.getResearcherWorks(openalexId),
        ]);
        displayName = researcher.display_name || displayName;
        publications = works.results
          .filter((work: any) => work.title && work.title.trim() !== '')
          .map((work: any) => ({
            id: work.id,
            openalexId,
            workId: work.id,
            title: work.title,
            authorNames: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean).join(', ') || null,
            journal: work.primary_location?.source?.display_name || null,
            publicationYear: work.publication_year || null,
            citationCount: work.cited_by_count || 0,
            topics: work.topics?.map((topic: any) => topic.display_name) || null,
            doi: work.doi || null,
            isOpenAccess: work.open_access?.is_oa || false,
            publicationType: work.type?.split('/').pop() || 'article',
            isReviewArticle: work.type?.split('/').pop() === 'review',
            isFeatured: false,
            pdfUrl: null,
          }));
      }

      if (publications.length === 0) {
        return res.status(404).json({ message: "No publications found" });
      }

      let content: string;
      let filename: string;
      let contentType: string;
      const sanitizedName = displayName.replace(/[^a-zA-Z0-9-_]/g, '_');

      switch (format.toLowerCase()) {
        case 'bibtex':
          content = generateBibTeX(publications);
          filename = `${sanitizedName}_bibliography.bib`;
          contentType = 'application/x-bibtex';
          break;
        case 'ris':
          content = generateRIS(publications);
          filename = `${sanitizedName}_bibliography.ris`;
          contentType = 'application/x-research-info-systems';
          break;
        case 'csv':
          content = generateCSV(publications);
          filename = `${sanitizedName}_bibliography.csv`;
          contentType = 'text/csv';
          break;
        case 'json':
          content = JSON.stringify(publications, null, 2);
          filename = `${sanitizedName}_bibliography.json`;
          contentType = 'application/json';
          break;
        default:
          return res.status(400).json({ message: "Invalid format. Supported formats: bibtex, ris, csv, json" });
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(content);
    } catch (error) {
      console.error("Error exporting bibliography:", error);
      res.status(500).json({ message: "Failed to export bibliography" });
    }
  });

  // Export researcher website as static HTML (public)
  app.get('/api/researcher/:openalexId/export', async (req, res) => {
    try {
      const { openalexId } = req.params;

      // Get researcher profile (must be public)
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile || !profile.isPublic) {
        return res.status(404).json({ message: "Researcher not found or not public" });
      }

      // Get all researcher data
      const researcherData = await storage.getOpenalexData(openalexId, 'researcher');
      const researchTopics = await storage.getResearchTopics(openalexId);
      const publications = await storage.getPublications(openalexId); // Get all publications (no limit) for complete data
      const affiliations = await storage.getAffiliations(openalexId);

      const exportData = {
        profile,
        researcher: researcherData?.data || null,
        topics: researchTopics,
        publications,
        affiliations,
        lastSynced: profile.lastSyncedAt,
        exportedAt: new Date().toISOString(),
        exportUrl: `${req.protocol}://${req.get('host')}/researcher/${openalexId}`
      };

      // Generate static HTML
      const staticHTML = generateStaticHTML(exportData);

      // Set headers for file download
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="${profile.displayName || 'researcher'}-profile.html"`);
      res.send(staticHTML);
    } catch (error) {
      console.error("Error exporting researcher profile:", error);
      res.status(500).json({ message: "Failed to export researcher profile" });
    }
  });

  // Configure multer for file upload
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (_req, file, cb) => {
      // Only allow PDF files
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    },
  });

  // CV/Resume upload endpoint (ADMIN ONLY)
  app.post('/api/admin/researcher/:openalexId/upload-cv', adminRateLimit, adminSessionAuthMiddleware, upload.single('cv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);

      if (!profile) {
        return res.status(404).json({ message: 'Researcher profile not found' });
      }

      // Initialize Replit Object Storage client with bucket ID
      const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!storageBucketId) {
        return res.status(500).json({ message: 'Object storage not configured' });
      }

      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });

      // Generate unique filename for public directory
      const filename = `public/cv/${openalexId}-cv-${Date.now()}.pdf`;

      // Upload file using Replit Object Storage
      const uploadResult = await objectStorage.uploadFromBytes(filename, req.file.buffer);

      if (!uploadResult.ok) {
        console.error('Object storage upload error:', uploadResult.error);
        return res.status(500).json({ message: 'Failed to upload file to storage' });
      }

      // Generate public URL using the /public-objects endpoint
      // Extract just the path after 'public/' for the public URL
      const publicPath = filename.replace('public/', '');
      const cvUrl = `/public-objects/${publicPath}`;

      // Update profile with CV URL
      await storage.updateResearcherProfile(profile.id, {
        cvUrl: cvUrl,
      });

      res.json({
        message: 'CV uploaded successfully',
        cvUrl: cvUrl,
      });
    } catch (error) {
      console.error('Error uploading CV:', error);
      res.status(500).json({
        message: error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Failed to upload CV',
      });
    }
  });

  // Configure multer for profile image upload
  // Explicit whitelist — do not accept image/svg+xml: an uploaded SVG is served
  // back to browsers and can carry inline <script>, making "any image/* mimetype"
  // a stored-XSS vector.
  const IMAGE_MIME_EXTENSIONS: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for images
    },
    fileFilter: (_req, file, cb) => {
      if (Object.prototype.hasOwnProperty.call(IMAGE_MIME_EXTENSIONS, file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, WEBP, and GIF images are allowed'));
      }
    },
  });

  // Profile image upload endpoint (ADMIN ONLY)
  app.post('/api/admin/researcher/:openalexId/upload-profile-image', adminRateLimit, adminSessionAuthMiddleware, uploadImage.single('profileImage'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const { openalexId } = req.params;
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);

      if (!profile) {
        return res.status(404).json({ message: 'Researcher profile not found' });
      }

      // Initialize Replit Object Storage client with bucket ID
      const storageBucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      if (!storageBucketId) {
        return res.status(500).json({ message: 'Object storage not configured' });
      }

      const objectStorage = new ObjectStorageClient({ bucketId: storageBucketId });

      // Generate unique filename for public directory with proper extension
      // fileFilter above already rejects anything not in IMAGE_MIME_EXTENSIONS
      const fileExtension = IMAGE_MIME_EXTENSIONS[req.file.mimetype] || 'jpg';
      const filename = `public/profile-images/${openalexId}-profile-${Date.now()}.${fileExtension}`;

      // Upload file using Replit Object Storage
      const uploadResult = await objectStorage.uploadFromBytes(filename, req.file.buffer);

      if (!uploadResult.ok) {
        console.error('Object storage upload error:', uploadResult.error);
        return res.status(500).json({ message: 'Failed to upload file to storage' });
      }

      // Generate public URL using the /public-objects endpoint
      // Extract just the path after 'public/' for the public URL
      const publicPath = filename.replace('public/', '');
      const profileImageUrl = `/public-objects/${publicPath}`;

      // Update profile with profile image URL
      await storage.updateResearcherProfile(profile.id, {
        profileImageUrl: profileImageUrl,
      });

      res.json({
        message: 'Profile image uploaded successfully',
        profileImageUrl: profileImageUrl,
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({
        message: error instanceof Error ? (error instanceof Error ? error.message : "Unknown error") : 'Failed to upload profile image',
      });
    }
  });

  // Get all site settings (public)
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap = settings.reduce((acc: any, setting: any) => {
        acc[setting.settingKey] = setting.settingValue;
        return acc;
      }, {} as Record<string, string>);
      res.json(settingsMap);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  });

  // Update site settings (ADMIN ONLY)
  app.put('/api/admin/settings', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const settings = req.body;

      for (const [key, value] of Object.entries(settings)) {
        if (typeof value === 'string') {
          await storage.upsertSetting(key, value);
        }
      }

      res.json({ message: 'Settings updated successfully' });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ message: 'Failed to update settings' });
    }
  });

  // ================== THEME ROUTES ==================

  // Get all active themes (public)
  app.get('/api/themes', async (req, res) => {
    try {
      const activeThemes = await storage.getActiveThemes();
      res.json(activeThemes);
    } catch (error) {
      console.error('Error fetching themes:', error);
      res.status(500).json({ message: 'Failed to fetch themes' });
    }
  });

  // Get default theme (public)
  app.get('/api/themes/default', async (req, res) => {
    try {
      const defaultTheme = await storage.getDefaultTheme();
      res.json(defaultTheme || null);
    } catch (error) {
      console.error('Error fetching default theme:', error);
      res.status(500).json({ message: 'Failed to fetch default theme' });
    }
  });

  // Get single theme by ID (public)
  app.get('/api/themes/:id', async (req, res) => {
    try {
      const theme = await storage.getTheme(req.params.id);
      if (!theme) {
        return res.status(404).json({ message: 'Theme not found' });
      }
      res.json(theme);
    } catch (error) {
      console.error('Error fetching theme:', error);
      res.status(500).json({ message: 'Failed to fetch theme' });
    }
  });

  // Get all themes including inactive (ADMIN ONLY)
  app.get('/api/admin/themes', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const allThemes = await storage.getAllThemes();
      res.json(allThemes);
    } catch (error) {
      console.error('Error fetching all themes:', error);
      res.status(500).json({ message: 'Failed to fetch themes' });
    }
  });

  // Create new theme (ADMIN ONLY)
  app.post('/api/admin/themes', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const themeData = insertThemeSchema.parse({
        ...req.body,
        name: typeof req.body?.name === 'string' ? req.body.name.trim() : req.body?.name,
      });
      const newTheme = await storage.createTheme(themeData);
      res.status(201).json(newTheme);
    } catch (error) {
      console.error('Error creating theme:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid theme data', errors: error.errors });
      }
      if ((error as { code?: string })?.code === '23505') {
        return res.status(409).json({ message: 'Theme name already exists' });
      }
      res.status(500).json({ message: 'Failed to create theme' });
    }
  });

  // Update theme (ADMIN ONLY)
  app.patch('/api/admin/themes/:id', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = updateThemeSchema.parse({
        ...req.body,
        id,
        name: typeof req.body?.name === 'string' ? req.body.name.trim() : req.body?.name,
      });
      const updatedTheme = await storage.updateTheme(id, updates);
      if (!updatedTheme) {
        return res.status(404).json({ message: 'Theme not found' });
      }
      res.json(updatedTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid theme data', errors: error.errors });
      }
      if ((error as { code?: string })?.code === '23505') {
        return res.status(409).json({ message: 'Theme name already exists' });
      }
      res.status(500).json({ message: 'Failed to update theme' });
    }
  });

  // Set default theme (ADMIN ONLY)
  app.post('/api/admin/themes/:id/set-default', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedTheme = await storage.setDefaultTheme(id);
      if (!updatedTheme) {
        return res.status(404).json({ message: 'Theme not found' });
      }
      res.json(updatedTheme);
    } catch (error) {
      console.error('Error setting default theme:', error);
      res.status(500).json({ message: 'Failed to set default theme' });
    }
  });

  // Delete theme (ADMIN ONLY)
  app.delete('/api/admin/themes/:id', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const theme = await storage.getTheme(id);
      if (!theme) {
        return res.status(404).json({ message: 'Theme not found' });
      }
      if (theme.isDefault) {
        return res.status(400).json({ message: 'Cannot delete the default theme' });
      }
      await storage.deleteTheme(id);
      res.json({ message: 'Theme deleted successfully' });
    } catch (error) {
      console.error('Error deleting theme:', error);
      res.status(500).json({ message: 'Failed to delete theme' });
    }
  });

  // Get tenants with their current theme info (ADMIN ONLY)
  app.get('/api/admin/themes/tenants', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const tenantsWithThemes = await storage.getTenantsWithThemeInfo();
      res.json(tenantsWithThemes);
    } catch (error) {
      console.error('Error fetching tenants with theme info:', error);
      res.status(500).json({ message: 'Failed to fetch tenants' });
    }
  });

  // Bulk apply theme to tenants (ADMIN ONLY)
  app.post('/api/admin/themes/:id/apply-bulk', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { tenantIds } = req.body; // Optional array of tenant IDs, if empty applies to all

      const theme = await storage.getTheme(id);
      if (!theme) {
        return res.status(404).json({ message: 'Theme not found' });
      }

      const result = await storage.bulkApplyThemeToTenants(id, tenantIds);
      res.json({
        message: `Theme "${theme.name}" applied successfully`,
        updated: result.updated
      });
    } catch (error) {
      console.error('Error applying theme to tenants:', error);
      res.status(500).json({ message: 'Failed to apply theme' });
    }
  });

  // ========================================
  // Analytics Routes
  // ========================================

  // Track analytics event (public - for profile pages)
  app.post('/api/analytics/track', publicWriteRateLimit, async (req, res) => {
    try {
      const { openalexId, eventType, eventTarget, visitorId, referrer, userAgent, country, city } = req.body;

      if (!openalexId || !eventType) {
        return res.status(400).json({ message: 'openalexId and eventType are required' });
      }

      // Get profileId if it exists
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);

      const event = await storage.trackAnalyticsEvent({
        profileId: profile?.id || null,
        openalexId,
        eventType,
        eventTarget: eventTarget || null,
        visitorId: visitorId || null,
        referrer: referrer || req.get('referer') || null,
        userAgent: userAgent || req.get('user-agent') || null,
        country: country || null,
        city: city || null,
      });

      res.json({ success: true, eventId: event.id });
    } catch (error) {
      console.error('Error tracking analytics event:', error);
      res.status(500).json({ message: 'Failed to track event' });
    }
  });

  // Get analytics summary for a profile (requires authentication)
  app.get('/api/analytics/:openalexId', async (req, res) => {
    try {
      const { openalexId } = req.params;
      const days = parseInt(req.query.days as string) || 30;

      // Check if user is authenticated and owns this profile or is admin
      const session = req.session as any;
      if (!session?.userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get user and check ownership or admin
      const user = await storage.getUser(session.userId);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Allow admin or profile owner
      if (user.role !== 'admin') {
        const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
        if (!profile || profile.tenantId !== user.tenantId) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const summary = await storage.getAnalyticsSummary(openalexId, days);
      res.json(summary);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Report Issue endpoint (for profile data issues)
  app.post('/api/report-issue', publicWriteRateLimit, async (req, res) => {
    try {
      const { openalexId, issueType, email, description } = req.body;

      if (!openalexId || !issueType || !email || !description) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      const issueTypeLabels: Record<string, string> = {
        'wrong_person': 'Wrong person / Not me',
        'wrong_publications': 'Wrong publications listed',
        'missing_publications': 'Missing publications',
        'wrong_affiliation': 'Wrong affiliation',
        'other': 'Other issue',
      };

      // Send email notification to admin
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

      if (adminEmail && process.env.SMTP_USER && process.env.SMTP_PASS) {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: adminEmail,
          subject: `[Scholar.name] Data Issue Report: ${issueTypeLabels[issueType] || issueType}`,
          html: `
            <h2>🚨 Data Issue Report</h2>
            <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Issue Type</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(issueTypeLabels[issueType] || issueType)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>OpenAlex ID</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <a href="https://openalex.org/authors/${escapeHtmlAttribute(openalexId)}">${escapeHtml(openalexId)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Profile URL</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">
                  <a href="https://scholar.name/researcher/${openalexId}">View Profile</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Reporter Email</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(email)}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Description</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${escapeHtml(description).replace(/\n/g, '<br>')}</td>
              </tr>
            </table>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Respond to this user at ${escapeHtml(email)}. If the issue is with source data, 
              guide them to submit a correction to OpenAlex.
            </p>
          `,
          replyTo: email,
        });
      }

      res.json({
        success: true,
        message: 'Report submitted successfully'
      });
    } catch (error) {
      console.error('Error handling issue report:', error);
      res.status(500).json({ message: 'Failed to submit report' });
    }
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ message: 'API endpoint not found' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
