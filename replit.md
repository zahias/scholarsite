# Overview

ScholarSite is a SaaS platform that creates beautiful, automatically-updated academic portfolio websites powered by the OpenAlex API. The platform allows researchers to showcase their publications, impact metrics, research topics, and affiliations through professional, customizable websites.

## Platform Architecture

The platform consists of three main surfaces:
1. **Marketing/Landing Site** (`/`): Public-facing page where researchers can preview their potential portfolio by entering their OpenAlex ID
2. **Researcher Profile Pages** (`/researcher/:id`): Individual researcher portfolio websites with full publication analytics
3. **Admin Dashboard** (planned): Backend management for creating and managing customer sites

## Key Features
- **OpenAlex Integration**: Automatic data fetching and synchronization
- **Live Preview**: Enter any OpenAlex ID to see an instant preview of a potential portfolio
- **Publication Analytics**: Charts, metrics, and visualizations of research impact
- **Mobile-First Design**: Responsive layouts with PWA support
- **SEO Optimization**: Dynamic meta tags, Open Graph, Schema.org structured data

# Recent Changes (December 2, 2025)

## Premium Design System Upgrade
- **New Color Palette**: Scholarly aesthetic with Midnight Blue (#0B1F3A), Oxford Blue (#142850), Platinum (#E4E9F7), Sage Green (#7AA874), Warm Accent (#F2994A)
- **Typography**: Font pairing of Inter (UI) and Source Serif Pro (headings/names) for elevated academic feel
- **Glassmorphism**: backdrop-blur effects on navigation and cards for modern premium look
- **Premium CSS Classes**: .hero-banner, .glass, .glass-dark, .btn-premium, .card-premium
- **Dark Mode Enhancements**: Refined gradients and contrast for dark theme

## Landing Page Redesign
- **Premium Hero Section**: Full-width gradient hero with serif typography, glassmorphism stat cards
- **Enhanced Navigation**: Glassmorphism navbar with uppercase tracking links
- **Features Section**: Premium cards with gradient icon backgrounds and hover lift effects
- **Preview Section**: Improved search with badge headers and section dividers
- **Pricing Section**: Elevated cards with accent borders and "Most Popular" badges
- **Premium CTA Section**: Full-width gradient banner with decorative elements
- **Footer**: Dark blue footer with improved link hierarchy

## Search API Changes
- Switched from OpenAlex autocomplete to full search API (`/works`) with `sort=works_count:desc`
- Shows most prolific researchers first for better relevance
- `GET /api/openalex/search?q=query` - Full text search for researchers

## API Additions
- `GET /api/openalex/autocomplete?q=query` - Search authors by name using OpenAlex autocomplete
- `GET /api/openalex/author/:openalexId` - Public endpoint for author preview
- `GET /api/researcher/:id/data` - Now supports preview mode (fetches from OpenAlex if no DB profile exists)

## Routing Changes
- Root path `/` now shows the landing page instead of redirecting to a researcher profile
- Researcher profiles at `/researcher/:id` work for both database profiles AND OpenAlex-only previews

# Previous Changes (October 17, 2025)

## Major Enhancements - UI/UX Enhancement Suite

### SEO & Social Sharing
- **Dynamic Meta Tags**: Researcher-specific page titles and descriptions
- **Open Graph Integration**: Facebook and LinkedIn preview cards with custom images
- **Twitter Cards**: Beautiful Twitter sharing with large image cards
- **Schema.org Structured Data**: JSON-LD for Google Scholar and search engine indexing
- **Social Share Buttons**: LinkedIn, Twitter, Email, and Copy Link functionality

### Mobile-First Refinements
- **Mobile Bottom Navigation**: Fixed bottom nav with smooth scroll to sections (Overview, Analytics, Research, Publications)
- **PWA Manifest**: Progressive Web App support for installability on mobile devices
- **Responsive Design**: Mobile-optimized spacing and touch-friendly interactions
- **Theme Integration**: Mobile meta tags for iOS and Android

### Engagement Features
- **QR Code Generator**: Server-side QR code generation for conference poster sharing
- **Clipboard Integration**: One-click link copying with toast notifications
- **Social Sharing Workflow**: Seamless sharing to major platforms

### Micro-interactions
- **Animated Stat Counters**: Numbers animate from 0 to actual value on scroll
- **Scroll-Spy Navigation**: Active section highlighting in desktop navigation
- **Smooth Transitions**: Enhanced hover effects and visual feedback
- **Intersection Observer**: Performance-optimized scroll animations

### Technical Improvements
- **Accessibility**: All share buttons include aria-labels for screen readers
- **Static Asset Serving**: PWA manifest properly served from client/public directory
- **QR Code API**: `/api/researcher/:id/qr-code` endpoint generates 300x300px PNG QR codes
- **Component Architecture**: Reusable SEO, ShareButtons, MobileBottomNav, and AnimatedCounter components

## Previous Enhancements
- **Unlimited Publication Loading**: Implemented page-based pagination in OpenAlex API sync to fetch ALL publications
  - Previously limited to 200 publications per researcher
  - Now fetches all publications using page-based pagination (200 per page)
  - Logs sync progress: "Fetched X of Y publications (page N)"
  - Handles edge case: filters out publications without valid titles (rare)
  - Example: Researcher A5072237761 now has 833 publications (was 200)

## Bug Fixes (October 16, 2025)
- **Export Bibliography**: Fixed export functionality by adding proper onClick handler to navigate to download endpoint
- **Publication Analytics Accuracy**: Removed publication query limit to ensure all publications are included in charts
- **Publication Type Classification**: Fixed publication type chart to use actual `publicationType` field from database instead of inferring from journal names
- **Data Integrity**: Added unique constraint on `[openalex_id, data_type]` in openalexData table to prevent duplicate entries
- **CV Upload**: Fixed ObjectStorageClient initialization with proper bucketId parameter
- **Delete Researcher**: Implemented atomic transaction support for cascading deletes to maintain data integrity

## Performance Considerations
- OpenAlex sync now fetches all publications via pagination, no artificial limits
- Publication queries return complete dataset without limit for accurate analytics
- For researchers with >10,000 publications, may need server-side aggregation in future
- Current implementation prioritizes accuracy over performance for analytics features
- In-memory publication loading acceptable for typical researcher publication counts (hundreds to low thousands)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/UI component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with type-safe database operations
- **API Design**: RESTful API endpoints with Express route handlers
- **File Uploads**: Uppy.js with support for AWS S3 and Google Cloud Storage
- **Session Management**: Express sessions with PostgreSQL store

## Database Architecture
- **Primary Database**: PostgreSQL (configured for Neon serverless)
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Tables**: 
  - Users and sessions for authentication
  - Researcher profiles with OpenAlex integration
  - Cached OpenAlex data (publications, topics, affiliations)
  - Research topics, publications, and institutional affiliations

## Authentication & Authorization
- **Provider**: Replit OIDC authentication with Passport.js
- **Session Storage**: PostgreSQL-backed sessions with connect-pg-simple
- **Authorization**: Route-level authentication middleware
- **User Management**: Automatic user creation and profile linking

## Data Integration
- **OpenAlex API**: Service layer for fetching researcher data, publications, and academic metrics
- **Data Caching**: Local database caching of OpenAlex data with sync timestamps
- **Sync Strategy**: Manual and automated synchronization of researcher profiles

## Project Structure
- **Monorepo**: Shared types and schemas between client and server
- **Client**: React SPA in `/client` directory
- **Server**: Express API in `/server` directory  
- **Shared**: Common schemas and types in `/shared` directory
- **Build**: Separate build processes for client (Vite) and server (esbuild)

# Environment Variables

## Required Environment Variables
- **DATABASE_URL**: PostgreSQL connection string for Neon database
- **ADMIN_API_TOKEN**: Bearer token for admin endpoint authentication (high entropy random string)

## Optional Environment Variables  
- **NODE_ENV**: Set to 'production' for production deployment (enables stricter IP restrictions)

# External Dependencies

## Core Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit Auth**: OIDC authentication provider for user management
- **OpenAlex API**: Academic publication and researcher data source

## Cloud Storage
- **Google Cloud Storage**: File upload and storage service
- **AWS S3**: Alternative cloud storage option via Uppy.js

## Development & Deployment
- **Replit Platform**: Development environment and hosting
- **Vite Dev Server**: Development server with HMR and middleware integration
- **TypeScript**: Type checking and compilation across the stack

## UI & Styling
- **Radix UI**: Accessible component primitives
- **Lucide Icons**: Icon library for consistent iconography
- **Google Fonts**: Web fonts (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Tailwind CSS**: Utility-first CSS framework with custom configuration

## Additional Integrations
- **Uppy.js**: File upload handling with multiple storage backends
- **React Query**: Data fetching, caching, and synchronization
- **Wouter**: Lightweight routing for React applications
- **Zod**: Runtime type validation and schema parsing
- **QRCode**: Server-side QR code generation for profile sharing
- **React Icons**: Additional icon sets (FaXTwitter for Twitter/X branding)

## Key Components

### Frontend Components
- **SEO.tsx**: Dynamic meta tags, Open Graph, Twitter Cards, Schema.org JSON-LD
- **ShareButtons.tsx**: Social sharing with LinkedIn, Twitter, Email, Copy Link, QR Code
- **MobileBottomNav.tsx**: Fixed bottom navigation for mobile devices with Overview, Analytics, Research, and Publications sections
- **AnimatedCounter.tsx**: Scroll-triggered number animations
- **Navigation.tsx**: Desktop navigation with scroll-spy highlighting for Overview, Analytics, Research, and Publications
- **ResearcherProfile.tsx**: Main profile page integrating all components
- **StatsOverview.tsx**: Publication metrics and impact statistics
- **PublicationAnalytics.tsx**: Charts and visualizations of publication data
- **ResearchTopics.tsx**: Research areas and topics
- **Publications.tsx**: Complete publication list with search and filtering