import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { EventEmitter } from "events";
import { storage } from "./storage";
import { OpenAlexService } from "./services/openalexApi";
import { insertResearcherProfileSchema, updateResearcherProfileSchema, type ResearchTopic, type Publication, type Affiliation } from "@shared/schema";
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
import fetch from "node-fetch";
import nodemailer from "nodemailer";

// Event emitter for real-time updates
const updateEmitter = new EventEmitter();

// SSE connection management
interface SSEConnection {
  res: Response;
  openalexId?: string;
}

const sseConnections = new Set<SSEConnection>();

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
  if (token !== adminToken) {
    console.warn(`Invalid admin token attempt from ${req.ip} to ${req.path}`);
    return res.status(403).json({ message: 'Invalid admin token' });
  }

  // Optional: IP restriction (allow localhost and private networks)
  const clientIP = req.ip || req.connection.remoteAddress;
  const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
  const isPrivateNetwork = clientIP?.startsWith('192.168.') || clientIP?.startsWith('10.') || clientIP?.startsWith('172.');
  
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
  // Check for admin API token
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) {
    console.error('ADMIN_API_TOKEN environment variable not set');
    return res.status(500).json({ message: 'Admin authentication not configured' });
  }

  // Check session first
  if ((req.session as any)?.isAdmin) {
    // Log admin operation for audit trail
    console.log(`Admin web access: ${req.method} ${req.path} from ${req.ip}`);
    return next();
  }

  // Check Authorization header as fallback
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    if (token === adminToken) {
      // Set session for future requests
      (req.session as any).isAdmin = true;
      console.log(`Admin operation: ${req.method} ${req.path} from ${req.ip}`);
      return next();
    }
  }

  // Not authenticated - this will be handled by route to show login form
  return next();
}

// Helper function to check if request is authenticated
function isAuthenticated(req: Request): boolean {
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!adminToken) return false;

  // Check session
  if ((req.session as any)?.isAdmin) {
    return true;
  }

  // Check Bearer token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    return token === adminToken;
  }

  return false;
}

// Rate limiting for admin endpoints (simple in-memory implementation)
const adminRateLimit = (() => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  const MAX_REQUESTS = 100; // per window
  
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

// Helper function to broadcast data updates
function broadcastResearcherUpdate(openalexId: string, updateType: 'profile' | 'sync' | 'create') {
  // Emit to event listeners
  updateEmitter.emit('researcher-update', { openalexId, updateType, timestamp: new Date().toISOString() });
  
  // Send SSE to connected clients
  const message = JSON.stringify({ openalexId, updateType, timestamp: new Date().toISOString() });
  
  for (const connection of Array.from(sseConnections)) {
    try {
      connection.res.write(`data: ${message}\n\n`);
    } catch (error) {
      // Remove failed connections
      sseConnections.delete(connection);
    }
  }
}

// Clean up closed SSE connections
function cleanupSSEConnections() {
  for (const connection of Array.from(sseConnections)) {
    if (connection.res.destroyed || connection.res.finished) {
      sseConnections.delete(connection);
    }
  }
}

// Clean up connections every 30 seconds
setInterval(cleanupSSEConnections, 30000);

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

  // Tenant resolution middleware
  app.use(tenantResolver);

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

  // Server-Sent Events endpoint for real-time updates
  app.get('/api/events', (req, res) => {
    console.log('📡 New SSE connection request from:', req.ip);
    
    try {
      // Set proper SSE headers - minimal approach
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      });

      // Send initial connection message immediately
      res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
      console.log('✅ SSE connection established, sent initial message');

      // Store connection
      const connection: SSEConnection = { res };
      sseConnections.add(connection);
      console.log(`📊 Total SSE connections: ${sseConnections.size}`);

      // Keep connection alive with heartbeat  
      const heartbeat = setInterval(() => {
        try {
          if (!res.destroyed && !res.finished) {
            res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
          } else {
            console.log('🧹 Cleaning up dead SSE connection');
            clearInterval(heartbeat);
            sseConnections.delete(connection);
          }
        } catch (error) {
          console.error('❌ SSE heartbeat error:', error);
          clearInterval(heartbeat);
          sseConnections.delete(connection);
        }
      }, 15000); // More frequent heartbeat

      // Handle client disconnect
      req.on('close', () => {
        console.log('🔌 SSE client disconnected');
        clearInterval(heartbeat);
        sseConnections.delete(connection);
        console.log(`📊 Remaining SSE connections: ${sseConnections.size}`);
      });

      req.on('error', (error) => {
        console.error('❌ SSE request error:', error);
        clearInterval(heartbeat);
        sseConnections.delete(connection);
      });

    } catch (error) {
      console.error('❌ Failed to establish SSE connection:', error);
      res.status(500).end();
    }
  });

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
      const tenant = (req as any).tenant;
      const isMarketingSite = (req as any).isMarketingSite;
      
      if (isMarketingSite || !tenant) {
        return res.json({
          isTenantSite: false,
          isMarketingSite: true,
          tenant: null
        });
      }
      
      // Get the researcher profile for this tenant
      const profile = await storage.getResearcherProfileByTenant(tenant.id);
      
      return res.json({
        isTenantSite: true,
        isMarketingSite: false,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          plan: tenant.plan,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor,
        },
        hasProfile: !!profile?.openalexId,
        openalexId: profile?.openalexId || null
      });
    } catch (error) {
      console.error("Error getting site context:", error);
      res.json({
        isTenantSite: false,
        isMarketingSite: true,
        tenant: null
      });
    }
  });

  // Tenant-based profile route (when accessed via custom domain)
  app.get('/api/profile', async (req, res) => {
    try {
      const tenant = (req as any).tenant;
      
      if (!tenant) {
        return res.status(404).json({ message: "No tenant found for this domain" });
      }

      const profile = await storage.getResearcherProfileByTenant(tenant.id);
      
      if (!profile || !profile.openalexId) {
        return res.status(404).json({ 
          message: "Profile not configured",
          tenantName: tenant.name,
          tenantStatus: tenant.status
        });
      }

      // Get cached data
      const researcherData = await storage.getOpenalexData(profile.openalexId, 'researcher');
      const researchTopics = await storage.getResearchTopics(profile.openalexId);
      const publications = await storage.getPublications(profile.openalexId);
      const affiliations = await storage.getAffiliations(profile.openalexId);

      return res.json({
        profile: {
          ...profile,
        },
        researcher: researcherData?.data || null,
        topics: researchTopics,
        publications,
        affiliations,
        lastSynced: profile.lastSyncedAt,
        tenant: {
          name: tenant.name,
          plan: tenant.plan,
          primaryColor: tenant.primaryColor,
          accentColor: tenant.accentColor,
        },
        isPreview: false
      });
    } catch (error) {
      console.error("Error fetching tenant profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // Public researcher data routes
  app.get('/api/researcher/:openalexId/data', async (req, res) => {
    try {
      const { openalexId } = req.params;
      const preview = req.query.preview === 'true';
      
      // Get researcher profile (if public)
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      
      // If profile exists and is public, use cached data
      if (profile && profile.isPublic) {
        const researcherData = await storage.getOpenalexData(openalexId, 'researcher');
        const researchTopics = await storage.getResearchTopics(openalexId);
        const publications = await storage.getPublications(openalexId);
        const affiliations = await storage.getAffiliations(openalexId);

        return res.json({
          profile,
          researcher: researcherData?.data || null,
          topics: researchTopics,
          publications,
          affiliations,
          lastSynced: profile.lastSyncedAt,
          isPreview: false
        });
      }
      
      // If no profile exists, fetch directly from OpenAlex for preview
      try {
        const researcher = await openalexService.getResearcher(openalexId);
        const works = await openalexService.getResearcherWorks(openalexId);
        
        // Extract topics from researcher data
        const topics = (researcher.topics || []).slice(0, 10).map((topic: any) => ({
          displayName: topic.display_name,
          subfield: topic.subfield?.display_name || null,
          field: topic.field?.display_name || null,
          domain: topic.domain?.display_name || null
        }));
        
        // Extract affiliations from researcher data
        const affiliations = (researcher.affiliations || []).slice(0, 5).map((aff: any) => ({
          institutionName: aff.institution?.display_name || 'Unknown Institution',
          years: aff.years || []
        }));
        
        // Helper function to strip MathML and other XML/HTML markup from titles
        const normalizeTitle = (title: string | null | undefined): string => {
          if (!title) return 'Untitled';
          // First, remove all XML/HTML tags including self-closing ones
          let cleaned = title
            .replace(/<[^>]*>/g, '') // Remove ALL tags (opening, closing, self-closing)
            .replace(/&lt;/g, '<')   // Decode common HTML entities
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#?\w+;/g, '') // Remove any remaining HTML entities
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
          return cleaned || 'Untitled';
        };

        // Transform publications to match expected format (matching the Publication interface in frontend)
        // Limit to 500 for preview mode to avoid very large payloads (full data available after profile creation)
        const publications = works.results.slice(0, 500).map((work: any) => ({
          id: work.id || '',
          title: normalizeTitle(work.display_name || work.title),
          authorNames: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean).join(', ') || null,
          journal: work.primary_location?.source?.display_name || null,
          publicationYear: work.publication_year,
          citationCount: work.cited_by_count || 0,
          topics: work.topics?.slice(0, 5).map((t: any) => t.display_name) || [],
          doi: work.doi || null,
          isOpenAccess: work.open_access?.is_oa || false,
          publicationType: work.type || 'article',
          openAccessUrl: work.open_access?.oa_url || null
        }));
        
        // Get institution info for the profile
        const institution = researcher.last_known_institutions?.[0];
        const orcid = researcher.orcid || null;
        
        // Generate a realistic title based on publication count
        const getAcademicTitle = (worksCount: number): string => {
          if (worksCount > 500) return 'Distinguished Professor';
          if (worksCount > 200) return 'Full Professor';
          if (worksCount > 100) return 'Associate Professor';
          if (worksCount > 50) return 'Assistant Professor';
          if (worksCount > 20) return 'Research Scientist';
          return 'Researcher';
        };
        
        // Create a virtual profile for preview - leave customizable fields empty for placeholders
        const previewProfile = {
          displayName: researcher.display_name,
          title: null, // Leave empty so frontend shows "Position" placeholder
          currentAffiliation: null, // Leave empty so frontend shows "Institution" placeholder
          department: null,
          bio: null, // Leave empty so frontend shows bio placeholder
          profileImageUrl: null, // Will be handled on frontend with initials avatar
          cvUrl: null,
          contactEmail: null, // Leave empty - no fake contact info in preview
          phone: null,
          officeLocation: null,
          location: null,
          countryCode: institution?.country_code || null, // Keep country code if available
          orcidId: orcid, // Keep ORCID if available from OpenAlex
          orcidUrl: orcid ? `https://orcid.org/${orcid.replace('https://orcid.org/', '')}` : '#', // Show ORCID button
          googleScholarUrl: '#', // Show button but doesn't navigate
          linkedinUrl: '#', // Show button but doesn't navigate
          twitterUrl: null,
          websiteUrl: '#', // Show button but doesn't navigate
          researchInterests: topics.slice(0, 5).map((t: any) => t.displayName),
          isPublic: true,
          isPreview: true
        };

        return res.json({
          profile: previewProfile,
          researcher,
          topics,
          publications,
          affiliations,
          lastSynced: new Date().toISOString(),
          isPreview: true
        });
      } catch (openAlexError) {
        console.error("Error fetching from OpenAlex for preview:", openAlexError);
        return res.status(404).json({ message: "Researcher not found" });
      }
    } catch (error) {
      console.error("Error fetching researcher data:", error);
      res.status(500).json({ message: "Failed to fetch researcher data" });
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
        systemUser = await storage.createUser({
          email: 'system@admin.local',
          passwordHash: 'SYSTEM_USER_NO_LOGIN',
          firstName: 'System',
          lastName: 'Admin',
          role: 'admin',
        });
      }

      const profileData = insertResearcherProfileSchema.parse({
        ...req.body,
        userId: systemUser.id
      });
      const profile = await storage.upsertResearcherProfile(profileData);
      
      // Broadcast update to connected clients
      if (profile.openalexId) {
        broadcastResearcherUpdate(profile.openalexId, 'create');
        
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
      
      // Broadcast update to connected clients
      broadcastResearcherUpdate(openalexId, 'profile');
      
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

      // Broadcast sync update to connected clients
      broadcastResearcherUpdate(openalexId, 'sync');

      res.json({ message: "Data sync completed successfully" });
    } catch (error) {
      console.error("Error syncing researcher data:", error);
      res.status(500).json({ message: "Failed to sync researcher data" });
    }
  });

  // Delete researcher profile and all related data
  app.delete('/api/admin/researcher/:openalexId', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
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

      // Delete the profile and all related data
      await storage.deleteResearcherProfile(openalexId);

      res.json({ message: "Researcher profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting researcher profile:", error);
      res.status(500).json({ message: "Failed to delete researcher profile" });
    }
  });

  // Test endpoint to manually trigger SSE updates (for debugging)
  app.post('/api/test/broadcast/:openalexId', (req, res) => {
    const { openalexId } = req.params;
    console.log(`🧪 Test broadcast triggered for researcher: ${openalexId}`);
    
    // Broadcast test update
    broadcastResearcherUpdate(openalexId, 'profile');
    
    res.json({ 
      message: `Test broadcast sent for researcher ${openalexId}`,
      connectionsNotified: sseConnections.size,
      timestamp: new Date().toISOString()
    });
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
      if (error instanceof Error && error.message.includes('404')) {
        return res.status(404).json({ message: "Researcher not found in OpenAlex" });
      }
      res.status(500).json({ message: "Failed to fetch author data" });
    }
  });

  // Search authors by name using OpenAlex full search API (public - for landing page search)
  // Uses full search with works_count sorting to show prolific researchers first
  app.get('/api/openalex/autocomplete', async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ results: [] });
      }

      // Use full search API with sorting by works_count to show prolific researchers first
      const response = await fetch(
        `https://api.openalex.org/authors?search=${encodeURIComponent(query)}&sort=works_count:desc&per_page=10`
      );
      
      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`);
      }
      
      const data = await response.json() as { results: any[] };
      
      // Transform results to a simpler format
      const results = data.results.map((author: any) => ({
        id: author.id.replace('https://openalex.org/', ''),
        display_name: author.display_name,
        hint: author.last_known_institutions?.[0]?.display_name || '',
        works_count: author.works_count || 0,
        cited_by_count: author.cited_by_count || 0,
      }));
      
      res.json({ results });
    } catch (error) {
      console.error("Error searching OpenAlex authors:", error);
      res.status(500).json({ message: "Failed to search authors" });
    }
  });

  // Contact form submission (public)
  app.post('/api/contact', async (req, res) => {
    console.log("[Contact] Received contact form submission");
    try {
      const { fullName, email, institution, role, planInterest, researchField, openalexId, estimatedProfiles, biography, preferredTheme } = req.body;
      console.log("[Contact] Form data:", { fullName, email, planInterest });
      
      if (!fullName || !email || !planInterest || !biography) {
        console.log("[Contact] Missing required fields");
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate SMTP configuration
      if (!process.env.SMTP_PASSWORD) {
        console.error("[Contact] SMTP_PASSWORD environment variable not configured");
        console.error("[Contact] Available env vars:", Object.keys(process.env).filter(k => !k.includes('npm') && !k.includes('PATH')).join(', '));
        return res.status(500).json({ 
          message: "Email service not configured. Please add SMTP_PASSWORD to .env file.",
          hint: "Create .env file in app root with: SMTP_PASSWORD=your_password"
        });
      }
      console.log("[Contact] SMTP password configured, creating transporter...");

      // Configure SMTP transporter for A2 Hosting
      const transporter = nodemailer.createTransport({
        host: "az1-ts112.a2hosting.com",
        port: 465,
        secure: true,
        auth: {
          user: "info@scholar.name",
          pass: process.env.SMTP_PASSWORD,
        },
        tls: {
          rejectUnauthorized: false
        },
        debug: true,
        logger: true,
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
      } catch (verifyError) {
        console.error("[Contact] SMTP connection verification failed:", verifyError);
        return res.status(500).json({ message: "Email service connection failed" });
      }

      // Send email
      console.log("[Contact] Sending email...");
      const info = await transporter.sendMail({
        from: '"ScholarName" <info@scholar.name>',
        to: "info@scholar.name",
        replyTo: email,
        subject: `New Inquiry: ${planInterest} Plan - ${fullName}`,
        text: emailContent,
      });

      console.log("[Contact] Email sent successfully:", info.messageId);

      res.json({ 
        success: true, 
        message: "Inquiry submitted successfully" 
      });
    } catch (error: any) {
      console.error("[Contact] Error processing contact form:", error.message || error);
      console.error("[Contact] Full error:", error);
      res.status(500).json({ message: "Failed to process inquiry" });
    }
  });

  // Export bibliography in various formats (public)
  app.get('/api/researcher/:openalexId/export-bibliography', async (req, res) => {
    try {
      const { openalexId } = req.params;
      const format = (req.query.format as string) || 'bibtex';
      
      // Get researcher profile - allow if public OR if accessed from tenant domain
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      const tenant = (req as any).tenant;
      
      // Allow access if: profile is public OR request comes from a tenant site with matching profile
      const isAuthorized = profile && (profile.isPublic || (tenant && profile.tenantId === tenant.id));
      
      if (!isAuthorized) {
        return res.status(404).json({ message: "Researcher not found or not public" });
      }

      // Get all publications
      const publications = await storage.getPublications(openalexId);
      
      if (publications.length === 0) {
        return res.status(404).json({ message: "No publications found" });
      }

      let content: string;
      let filename: string;
      let contentType: string;
      const sanitizedName = (profile.displayName || 'researcher').replace(/[^a-zA-Z0-9-_]/g, '_');

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

      // Broadcast update to connected clients
      broadcastResearcherUpdate(openalexId, 'profile');

      res.json({ 
        message: 'CV uploaded successfully',
        cvUrl: cvUrl,
      });
    } catch (error) {
      console.error('Error uploading CV:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to upload CV',
      });
    }
  });

  // Configure multer for profile image upload
  const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit for images
    },
    fileFilter: (_req, file, cb) => {
      // Only allow image files
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
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
      const fileExtension = req.file.mimetype.split('/')[1];
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

      // Broadcast update to connected clients
      broadcastResearcherUpdate(openalexId, 'profile');

      res.json({ 
        message: 'Profile image uploaded successfully',
        profileImageUrl: profileImageUrl,
      });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to upload profile image',
      });
    }
  });

  // Get all site settings (public)
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getAllSettings();
      const settingsMap = settings.reduce((acc, setting) => {
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
      const themeData = req.body;
      const newTheme = await storage.createTheme(themeData);
      res.status(201).json(newTheme);
    } catch (error) {
      console.error('Error creating theme:', error);
      res.status(500).json({ message: 'Failed to create theme' });
    }
  });

  // Update theme (ADMIN ONLY)
  app.patch('/api/admin/themes/:id', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedTheme = await storage.updateTheme(id, updates);
      if (!updatedTheme) {
        return res.status(404).json({ message: 'Theme not found' });
      }
      res.json(updatedTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
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

  const httpServer = createServer(app);
  return httpServer;
}
