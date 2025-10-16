import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { EventEmitter } from "events";
import { storage } from "./storage";
import { OpenAlexService } from "./services/openalexApi";
import { insertResearcherProfileSchema, updateResearcherProfileSchema, type ResearchTopic, type Publication, type Affiliation } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import path from "path";

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

// Login form HTML template
function generateLoginFormHTML(errorMessage?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Login - Research Profile Platform</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .form-container { backdrop-filter: blur(10px); background: rgba(255,255,255,0.95); }
        .input-focus:focus { transform: scale(1.02); transition: all 0.3s ease; }
    </style>
</head>
<body class="gradient-bg min-h-screen flex items-center justify-center p-4">
    <div class="form-container rounded-lg shadow-xl p-8 w-full max-w-md">
        <!-- Logo/Header -->
        <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <h1 class="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p class="text-gray-600 mt-2">Enter your admin token to access the dashboard</p>
        </div>

        <!-- Error Message -->
        ${errorMessage ? `
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            <div class="flex items-center">
                <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
                ${escapeHtml(errorMessage)}
            </div>
        </div>
        ` : ''}

        <!-- Login Form -->
        <form method="POST" action="/admin/login" class="space-y-6">
            <div>
                <label for="token" class="block text-sm font-medium text-gray-700 mb-2">
                    Admin Token
                </label>
                <input 
                    type="password" 
                    id="token" 
                    name="token" 
                    required
                    class="input-focus w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter your admin token"
                    data-testid="input-token"
                />
            </div>
            
            <button 
                type="submit" 
                class="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                data-testid="button-login"
            >
                <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                Sign In to Admin Dashboard
            </button>
        </form>

        <!-- Footer -->
        <div class="mt-8 text-center">
            <p class="text-sm text-gray-500">
                Research Profile Platform
            </p>
            <p class="text-xs text-gray-400 mt-2">
                Secure admin access required for this interface
            </p>
        </div>
    </div>

    <script>
        // Auto-focus the token input
        document.getElementById('token').focus();
        
        // Handle form submission with loading state
        document.querySelector('form').addEventListener('submit', function(e) {
            const button = document.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            
            button.disabled = true;
            button.innerHTML = \`
                <svg class="w-5 h-5 inline mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Signing in...
            \`;
            
            // Reset button state after 10 seconds (in case of network issues)
            setTimeout(() => {
                button.disabled = false;
                button.innerHTML = originalText;
            }, 10000);
        });
    </script>
</body>
</html>`;
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

export async function registerRoutes(app: Express): Promise<Server> {
  const openalexService = new OpenAlexService();

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

  // Public researcher data routes
  app.get('/api/researcher/:openalexId/data', async (req, res) => {
    try {
      const { openalexId } = req.params;
      
      // Get researcher profile (if public)
      const profile = await storage.getResearcherProfileByOpenalexId(openalexId);
      if (!profile || !profile.isPublic) {
        return res.status(404).json({ message: "Researcher not found or not public" });
      }

      // Get cached OpenAlex data
      const researcherData = await storage.getOpenalexData(openalexId, 'researcher');
      const researchTopics = await storage.getResearchTopics(openalexId);
      const publications = await storage.getPublications(openalexId);
      const affiliations = await storage.getAffiliations(openalexId);

      res.json({
        profile,
        researcher: researcherData?.data || null,
        topics: researchTopics,
        publications,
        affiliations,
        lastSynced: profile.lastSyncedAt
      });
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
      const profileData = insertResearcherProfileSchema.parse(req.body);
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

      await openalexService.syncResearcherData(profile.openalexId);
      
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
      const publications = await storage.getPublications(openalexId);
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

  // Admin login endpoint
  app.post('/admin/login', adminRateLimit, async (req, res) => {
    try {
      const { token } = req.body;
      const adminToken = process.env.ADMIN_API_TOKEN;
      
      if (!adminToken) {
        console.error('ADMIN_API_TOKEN environment variable not set');
        return res.status(500).send(generateLoginFormHTML('Admin authentication not configured'));
      }

      if (!token) {
        return res.status(400).send(generateLoginFormHTML('Please enter your admin token'));
      }

      // Verify the token
      if (token === adminToken) {
        // Set admin session
        (req.session as any).isAdmin = true;
        console.log(`Admin login successful from ${req.ip}`);
        
        // Redirect to admin interface
        return res.redirect('/admin');
      } else {
        console.warn(`Invalid admin login attempt from ${req.ip}`);
        return res.status(401).send(generateLoginFormHTML('Invalid admin token'));
      }
    } catch (error) {
      console.error('Error during admin login:', error);
      res.status(500).send(generateLoginFormHTML('Login failed. Please try again.'));
    }
  });

  // Admin logout endpoint
  app.post('/admin/logout', (req, res) => {
    console.log(`Admin logout from ${req.ip}`);
    (req.session as any).isAdmin = false;
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/admin');
    });
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

      // Initialize Replit Object Storage client (automatically authenticated)
      const objectStorage = new ObjectStorageClient();
      
      // Generate unique filename for public directory
      const filename = `public/cv/${openalexId}-cv-${Date.now()}.pdf`;

      // Upload file using Replit Object Storage
      const uploadResult = await objectStorage.uploadFromBytes(filename, req.file.buffer);
      
      if (!uploadResult.ok) {
        console.error('Object storage upload error:', uploadResult.error);
        return res.status(500).json({ message: 'Failed to upload file to storage' });
      }

      // Get public URL from Replit Object Storage
      const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
      const cvUrl = `https://storage.googleapis.com/${bucketId}/${filename}`;

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

  // Admin web interface (ADMIN ONLY)
  app.get('/admin', adminRateLimit, adminSessionAuthMiddleware, async (req, res) => {
    // Check if user is authenticated
    if (!isAuthenticated(req)) {
      // Show login form if not authenticated
      return res.send(generateLoginFormHTML());
    }
    try {
      // Get all public researcher profiles for the interface
      const profiles = await storage.getAllPublicResearcherProfiles();
      
      const adminHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Research Profile Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .loader { border: 2px solid #f3f3f3; border-top: 2px solid #3498db; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .success-flash { background: #d4edda !important; color: #155724 !important; border: 1px solid #c3e6cb !important; }
        .error-flash { background: #f8d7da !important; color: #721c24 !important; border: 1px solid #f5c6cb !important; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="container mx-auto px-4 py-8 max-w-6xl">
        <header class="mb-8 flex justify-between items-start">
            <div>
                <h1 class="text-4xl font-bold text-gray-800 mb-2">Research Profile Admin</h1>
                <p class="text-gray-600">Manage researcher profiles and data synchronization</p>
            </div>
            <div class="flex items-center gap-4">
                <div class="text-sm text-gray-600 text-right">
                    <div class="text-green-600 font-medium">✓ Authenticated</div>
                    <div class="text-xs">Session active</div>
                </div>
                <form method="POST" action="/admin/logout" class="inline">
                    <button 
                        type="submit" 
                        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        data-testid="button-logout"
                        onclick="return confirm('Are you sure you want to logout?')"
                    >
                        <svg class="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"></path>
                        </svg>
                        Logout
                    </button>
                </form>
            </div>
        </header>

        <!-- Status Messages -->
        <div id="messageContainer" class="mb-6 hidden">
            <div id="messageBox" class="p-4 rounded-lg"></div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 class="text-2xl font-semibold mb-4">Quick Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="showCreateForm()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors">
                    <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                    </svg>
                    Create New Profile
                </button>
                <button onclick="refreshProfiles()" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors">
                    <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
                    </svg>
                    Refresh List
                </button>
                <button onclick="bulkSync()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors">
                    <svg class="w-5 h-5 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732L14.146 12.8l-1.179 4.456a1 1 0 01-1.806.632L8.5 15.134l-2.354 2.754a1 1 0 01-1.806-.632L3.146 12.8.5 10.866a1 1 0 010-1.732L3.146 7.2l1.179-4.456A1 1 0 015.292 2H12z" clip-rule="evenodd" />
                    </svg>
                    Sync All Data
                </button>
            </div>
        </div>

        <!-- Researcher Profiles List -->
        <div class="bg-white rounded-lg shadow-sm">
            <div class="p-6 border-b border-gray-200">
                <h2 class="text-2xl font-semibold">Existing Profiles (${profiles.length})</h2>
            </div>
            <div id="profilesList" class="divide-y divide-gray-200">
                ${profiles.map(profile => `
                <div class="p-6 hover:bg-gray-50 transition-colors">
                    <div class="flex items-center justify-between">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <h3 class="text-xl font-semibold text-gray-900 mr-3">${escapeHtml(profile.displayName) || 'Unnamed Profile'}</h3>
                                <span class="px-2 py-1 text-xs rounded-full ${profile.isPublic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                    ${profile.isPublic ? 'Public' : 'Private'}
                                </span>
                            </div>
                            <p class="text-gray-600 mb-1">${escapeHtml(profile.title) || 'No title set'}</p>
                            <p class="text-sm text-gray-500">OpenAlex ID: ${escapeHtml(profile.openalexId)}</p>
                            <p class="text-sm text-gray-500">Last Synced: ${profile.lastSyncedAt ? new Date(profile.lastSyncedAt).toLocaleDateString() : 'Never'}</p>
                        </div>
                        <div class="flex space-x-3">
                            <button onclick="editProfile('${profile.openalexId}')" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors text-sm">
                                Edit
                            </button>
                            <button onclick="syncProfile('${profile.openalexId}')" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors text-sm">
                                Sync
                            </button>
                            <a href="/researcher/${profile.openalexId}" target="_blank" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors text-sm">
                                View
                            </a>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>

        <!-- Edit/Create Modal -->
        <div id="editModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div class="p-6 border-b border-gray-200">
                        <h3 id="modalTitle" class="text-2xl font-semibold">Edit Researcher Profile</h3>
                    </div>
                    <form id="profileForm" class="p-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <!-- Left Column -->
                            <div class="space-y-4">
                                <div>
                                    <label for="openalexId" class="block text-sm font-medium text-gray-700 mb-2">OpenAlex ID *</label>
                                    <input type="text" id="openalexId" name="openalexId" required 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="A1234567890">
                                    <p class="text-xs text-gray-500 mt-1">e.g., A1234567890 (from OpenAlex)</p>
                                </div>
                                
                                <div>
                                    <label for="displayName" class="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                    <input type="text" id="displayName" name="displayName" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="Dr. John Smith">
                                </div>
                                
                                <div>
                                    <label for="title" class="block text-sm font-medium text-gray-700 mb-2">Title/Position</label>
                                    <input type="text" id="title" name="title" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="Professor of Computer Science">
                                </div>
                                
                                <div>
                                    <label for="currentAffiliation" class="block text-sm font-medium text-gray-700 mb-2">Current Affiliation</label>
                                    <input type="text" id="currentAffiliation" name="currentAffiliation" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="Stanford University">
                                </div>
                                
                                <div>
                                    <label for="currentPosition" class="block text-sm font-medium text-gray-700 mb-2">Current Position</label>
                                    <input type="text" id="currentPosition" name="currentPosition" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="Senior Research Scientist">
                                </div>
                                
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Contact Email</label>
                                    <input type="email" id="email" name="email" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="researcher@university.edu">
                                    <p class="text-xs text-gray-500 mt-1">For "Get in Touch" button</p>
                                </div>
                            </div>
                            
                            <!-- Right Column -->
                            <div class="space-y-4">
                                <div>
                                    <label for="bio" class="block text-sm font-medium text-gray-700 mb-2">Biography</label>
                                    <textarea id="bio" name="bio" rows="4" 
                                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              placeholder="Brief description of research interests and background..."></textarea>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">CV/Resume</label>
                                    <div class="space-y-2">
                                        <input type="file" id="cvFile" name="cvFile" accept=".pdf"
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                               onchange="handleCVUpload(this)">
                                        <p class="text-xs text-gray-500">Upload PDF file (max 10MB) or enter URL below</p>
                                        <input type="url" id="cvUrl" name="cvUrl" 
                                               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                               placeholder="Or enter CV URL: https://example.com/cv.pdf">
                                        <div id="cvUploadStatus" class="text-sm hidden"></div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label for="currentAffiliationUrl" class="block text-sm font-medium text-gray-700 mb-2">Affiliation URL</label>
                                    <input type="url" id="currentAffiliationUrl" name="currentAffiliationUrl" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                           placeholder="https://stanford.edu">
                                </div>
                                
                                <div>
                                    <label for="currentAffiliationStartDate" class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                    <input type="date" id="currentAffiliationStartDate" name="currentAffiliationStartDate" 
                                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                </div>
                                
                                <div>
                                    <label class="flex items-center">
                                        <input type="checkbox" id="isPublic" name="isPublic" checked class="mr-2">
                                        <span class="text-sm text-gray-700">Make profile public</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                            <button type="button" onclick="closeModal()" class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                            <div class="space-x-3">
                                <button type="button" onclick="previewChanges()" class="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
                                    Preview
                                </button>
                                <button type="submit" class="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                                    <span id="saveButtonText">Save Profile</span>
                                    <div id="saveLoader" class="loader hidden"></div>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <script>
        let currentEditingProfile = null;

        // API helper function - uses session authentication instead of Bearer token
        async function apiRequest(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const response = await fetch(url, {
                ...defaultOptions,
                ...options,
                headers: { ...defaultOptions.headers, ...options.headers }
            });
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.message || 'API request failed');
            }
            
            return response.json();
        }

        // Show success message
        function showMessage(message, isError = false) {
            const container = document.getElementById('messageContainer');
            const box = document.getElementById('messageBox');
            
            box.textContent = message;
            box.className = \`p-4 rounded-lg \${isError ? 'error-flash' : 'success-flash'}\`;
            container.classList.remove('hidden');
            
            setTimeout(() => container.classList.add('hidden'), 5000);
        }

        // Handle CV file upload
        async function handleCVUpload(input) {
            const statusEl = document.getElementById('cvUploadStatus');
            const cvUrlInput = document.getElementById('cvUrl');
            
            if (!input.files || input.files.length === 0) {
                return;
            }
            
            const file = input.files[0];
            
            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                statusEl.textContent = 'File too large. Maximum size is 10MB.';
                statusEl.className = 'text-sm text-red-600';
                statusEl.classList.remove('hidden');
                input.value = '';
                return;
            }
            
            // Validate file type
            if (file.type !== 'application/pdf') {
                statusEl.textContent = 'Only PDF files are allowed.';
                statusEl.className = 'text-sm text-red-600';
                statusEl.classList.remove('hidden');
                input.value = '';
                return;
            }
            
            const openalexId = document.getElementById('openalexId').value;
            if (!openalexId) {
                statusEl.textContent = 'Please enter OpenAlex ID first before uploading CV.';
                statusEl.className = 'text-sm text-red-600';
                statusEl.classList.remove('hidden');
                input.value = '';
                return;
            }
            
            statusEl.textContent = 'Uploading CV...';
            statusEl.className = 'text-sm text-blue-600';
            statusEl.classList.remove('hidden');
            
            try {
                const formData = new FormData();
                formData.append('cv', file);
                
                const response = await fetch(\`/api/admin/researcher/\${openalexId}/upload-cv\`, {
                    method: 'POST',
                    body: formData
                });
                
                if (!response.ok) {
                    const error = await response.json().catch(() => ({ message: 'Upload failed' }));
                    throw new Error(error.message || 'Upload failed');
                }
                
                const result = await response.json();
                
                // Update CV URL input with the uploaded file URL
                cvUrlInput.value = result.cvUrl;
                
                statusEl.textContent = 'CV uploaded successfully!';
                statusEl.className = 'text-sm text-green-600';
                
                setTimeout(() => statusEl.classList.add('hidden'), 3000);
            } catch (error) {
                statusEl.textContent = \`Upload failed: \${error.message}\`;
                statusEl.className = 'text-sm text-red-600';
                input.value = '';
            }
        }

        // Show create form
        function showCreateForm() {
            currentEditingProfile = null;
            document.getElementById('modalTitle').textContent = 'Create New Researcher Profile';
            document.getElementById('profileForm').reset();
            document.getElementById('openalexId').readOnly = false; // Make sure it's editable for new profiles
            document.getElementById('editModal').classList.remove('hidden');
        }

        // Edit profile
        async function editProfile(openalexId) {
            try {
                // Fetch profile data from API
                const response = await apiRequest(\`/api/admin/researcher/profile/\${openalexId}\`);
                const profile = response;
                
                currentEditingProfile = openalexId;
                document.getElementById('modalTitle').textContent = 'Edit Researcher Profile';
                
                // Pre-populate form fields that exist in the HTML
                document.getElementById('openalexId').value = profile.openalexId || '';
                document.getElementById('openalexId').readOnly = true; // Don't allow changing ID for existing profiles
                document.getElementById('displayName').value = profile.displayName || '';
                document.getElementById('title').value = profile.title || '';
                document.getElementById('currentAffiliation').value = profile.currentAffiliation || '';
                document.getElementById('currentPosition').value = profile.currentPosition || '';
                document.getElementById('email').value = profile.email || '';
                document.getElementById('bio').value = profile.bio || '';
                document.getElementById('cvUrl').value = profile.cvUrl || '';
                document.getElementById('currentAffiliationUrl').value = profile.currentAffiliationUrl || '';
                document.getElementById('currentAffiliationStartDate').value = profile.currentAffiliationStartDate || '';
                document.getElementById('isPublic').checked = profile.isPublic === true;
                
                document.getElementById('editModal').classList.remove('hidden');
            } catch (error) {
                showMessage(\`Failed to load profile: \${error.message}\`, true);
            }
        }

        // Save profile
        document.getElementById('profileForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const saveButton = document.getElementById('saveButtonText');
            const saveLoader = document.getElementById('saveLoader');
            
            saveButton.classList.add('hidden');
            saveLoader.classList.remove('hidden');
            
            try {
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                data.isPublic = document.getElementById('isPublic').checked;
                
                let response;
                if (currentEditingProfile) {
                    // Update existing profile
                    response = await apiRequest(\`/api/admin/researcher/profile/\${currentEditingProfile}\`, {
                        method: 'PUT',
                        body: JSON.stringify(data)
                    });
                } else {
                    // Create new profile - need to add userId (for now, using a placeholder)
                    data.userId = 'admin-created'; // In real implementation, would use proper user management
                    response = await apiRequest('/api/admin/researcher/profile', {
                        method: 'POST',
                        body: JSON.stringify(data)
                    });
                }
                
                showMessage(\`Profile \${currentEditingProfile ? 'updated' : 'created'} successfully!\`);
                closeModal();
                refreshProfiles();
            } catch (error) {
                showMessage(\`Failed to save profile: \${error.message}\`, true);
            } finally {
                saveButton.classList.remove('hidden');
                saveLoader.classList.add('hidden');
            }
        });

        // Sync profile
        async function syncProfile(openalexId) {
            try {
                showMessage('Syncing data from OpenAlex...');
                await apiRequest(\`/api/admin/researcher/\${openalexId}/sync\`, {
                    method: 'POST'
                });
                showMessage('Data synced successfully!');
                refreshProfiles();
            } catch (error) {
                showMessage(\`Failed to sync profile: \${error.message}\`, true);
            }
        }

        // Preview changes
        function previewChanges() {
            const formData = new FormData(document.getElementById('profileForm'));
            const data = Object.fromEntries(formData.entries());
            const openalexId = data.openalexId;
            
            if (openalexId) {
                window.open(\`/researcher/\${openalexId}\`, '_blank');
            } else {
                alert('Please enter an OpenAlex ID to preview');
            }
        }

        // Close modal
        function closeModal() {
            document.getElementById('editModal').classList.add('hidden');
            document.getElementById('openalexId').readOnly = false;
            currentEditingProfile = null;
        }

        // Refresh profiles list
        function refreshProfiles() {
            window.location.reload();
        }

        // Bulk sync all profiles
        async function bulkSync() {
            if (!confirm('This will sync all profiles with OpenAlex. This may take a while. Continue?')) {
                return;
            }
            
            const profiles = Array.from(document.querySelectorAll('#profilesList > div'));
            let completed = 0;
            
            showMessage(\`Syncing \${profiles.length} profiles...\`);
            
            for (const profile of profiles) {
                const openalexIdMatch = profile.textContent.match(/OpenAlex ID: ([A-Za-z0-9]+)/);
                if (openalexIdMatch) {
                    try {
                        await syncProfile(openalexIdMatch[1]);
                        completed++;
                    } catch (error) {
                        console.error(\`Failed to sync \${openalexIdMatch[1]}:\`, error);
                    }
                }
            }
            
            showMessage(\`Bulk sync completed: \${completed}/\${profiles.length} profiles synced successfully!\`);
        }

        // Close modal when clicking outside
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('editModal')) {
                closeModal();
            }
        });
    </script>
</body>
</html>`;
      
      res.send(adminHTML);
    } catch (error) {
      console.error("Error serving admin interface:", error);
      res.status(500).json({ message: "Failed to load admin interface" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}