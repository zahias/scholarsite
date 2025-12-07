# Overview

ScholarSite is a SaaS platform designed to empower academics and researchers with professional, automatically-updated online portfolios. Leveraging the OpenAlex API, it showcases publications, impact metrics, research topics, and affiliations. The platform aims to provide researchers with a high-quality, customizable web presence to enhance their visibility and academic impact.

Key capabilities include:
- **OpenAlex Integration**: Automated data fetching and synchronization with OpenAlex.
- **Live Preview**: Instant portfolio previews based on an OpenAlex ID.
- **Publication Analytics**: Comprehensive charts, metrics, and visualizations of research impact.
- **Mobile-First Design**: Responsive layouts with Progressive Web App (PWA) support.
- **SEO Optimization**: Dynamic meta tags, Open Graph, and Schema.org structured data for discoverability.
- **Contact-Based Sales**: A streamlined sales model focusing on direct engagement for personalized plans.

The platform's ambition is to become the leading tool for academics to manage and display their research profiles, offering individual and institutional plans to cater to a broad academic market.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Platform Structure
The platform comprises four main surfaces:
1.  **Marketing/Landing Site**: Public-facing entry point for showcasing the platform and enabling previews.
2.  **Researcher Profile Pages**: Individual, data-rich portfolio websites for researchers.
3.  **Admin Dashboard**: Backend interface for platform owner to manage customer sites (tenants), domains, and users.
4.  **Researcher Dashboard**: Customer-facing interface for researchers to configure their OpenAlex ID, customize their profile, and manage settings.

## Multi-Tenant Architecture
-   **Tenants Table**: Each customer is a tenant with unique ID, name, plan (starter/professional/institution), status (pending/active/suspended/cancelled).
-   **Domains Table**: Custom domains linked to tenants, with primary domain flag and subdomain support.
-   **Domain Routing**: Tenant resolver middleware detects domain from request and attaches tenant context.
-   **User-Tenant Association**: Users are linked to tenants via tenantId foreign key.

## Frontend Architecture
-   **Framework**: React with TypeScript, using Vite for building.
-   **UI Components**: Shadcn/UI built on Radix UI primitives.
-   **Styling**: Tailwind CSS with custom design tokens.
-   **State Management**: TanStack Query for server state.
-   **Routing**: Wouter for client-side routing.
-   **Forms**: React Hook Form with Zod for validation.
-   **UI/UX Decisions**:
    -   **Premium Visuals**: Navy gradient navigation with glassmorphism, layered hero sections with mesh patterns and floating orbs, premium button styles, and glassmorphic stats cards.
    -   **Typography**: Inter for UI, Source Serif 4 for headings.
    -   **Color System**: Navy primary (#0B1F3A to #233F5F gradient), warm orange accent (#F2994A), sage green metrics.
    -   **Loading Experience**: Premium skeleton loading state with animations for profile previews.
    -   **Mobile-First**: Responsive design, PWA support, and a fixed bottom navigation for mobile.
    -   **SEO**: Dynamic meta tags, Open Graph, Twitter Cards, and Schema.org JSON-LD.
    -   **Micro-interactions**: Animated stat counters, scroll-spy navigation, smooth transitions, and hover effects.

## Backend Architecture
-   **Runtime**: Node.js with Express.js.
-   **Language**: TypeScript (ES modules).
-   **Database ORM**: Drizzle ORM for type-safe operations.
-   **API Design**: RESTful API endpoints.
-   **File Uploads**: Uppy.js for integrations with cloud storage.
-   **Session Management**: Express sessions with PostgreSQL store.
-   **Publication Title Normalization**: Server-side processing to strip MathML/XML and decode HTML entities from titles.

## Database Architecture
-   **Primary Database**: PostgreSQL (standard pg driver for A2 Hosting compatibility).
-   **Schema Management**: Drizzle Kit for migrations.
-   **Key Tables**: Users, sessions, researcher profiles, cached OpenAlex data (publications, topics, affiliations), and supporting tables.
-   **UUID Generation**: All UUIDs are generated application-side using `crypto.randomUUID()` in `server/storage.ts`. This is required because A2 Hosting's PostgreSQL lacks the `pgcrypto` extension for `gen_random_uuid()`.

## Authentication & Authorization
-   **Provider**: Custom email/password authentication with bcryptjs.
-   **Password Security**: bcryptjs with 12 salt rounds (pure JS, compatible with Node 16).
-   **Session Storage**: PostgreSQL-backed sessions with express-session.
-   **Session Security**: Session regeneration on login, registration, and password changes to prevent fixation attacks.
-   **Authorization**: Role-based access control (admin, researcher) via isAuthenticated and isAdmin middleware.

## User Management
-   **User Schema**: id (UUID), email, passwordHash, role, firstName, lastName, isActive, createdAt, updatedAt.
-   **Roles**: admin (full access), researcher (standard access).
-   **Admin Endpoints**: List users, update users, reset passwords, delete users (with self-protection).

## Data Integration
-   **OpenAlex API**: Core service for fetching academic data.
-   **Data Caching**: Local database caching with sync timestamps.
-   **Sync Strategy**: Supports manual and automated profile synchronization, including unlimited publication loading via pagination.

## Automated Sync Scheduler
-   **Background Job**: Runs every hour to check tenant sync requirements.
-   **Plan-Based Frequency**:
    -   **Starter Plan**: Monthly data refresh
    -   **Professional Plan**: Weekly data refresh
    -   **Institution Plan**: Daily data refresh
-   **Sync Logic**: Checks lastSyncedAt against plan frequency, only syncs when due.
-   **Admin API Endpoints**:
    -   `GET /api/admin/sync/logs` - View sync activity logs
    -   `POST /api/admin/sync/run` - Manually trigger sync check for all tenants
    -   `POST /api/admin/tenants/:id/sync` - Force sync a specific tenant
-   **Logging**: All sync activity logged with tenant name, status, and timestamps.

## Project Structure
-   **Monorepo**: Shared types and schemas between client and server.
-   **Client**: React SPA (`/client`).
-   **Server**: Express API (`/server`).
-   **Shared**: Common schemas and types (`/shared`).

## Feature Specifications
-   **Contact-Based Sales Model**: Implemented a `/contact` page with an inquiry form and dedicated API endpoint (`POST /api/contact`).
-   **Pricing Plans**: Defined Starter, Professional, and Institution plans.
-   **Consistent Profile Preview Structure**: Standardized banner elements, fallback content using OpenAlex data, and clear distinction between preview and production profiles.
-   **Search API**: Switched to OpenAlex full search API (`/works`) for researcher discovery, prioritizing prolific researchers.
-   **Routing**: Root path (`/`) for landing page, researcher profiles at `/researcher/:id` supporting both database and OpenAlex previews.
-   **Social Sharing**: Integrated dynamic meta tags, Open Graph, Twitter Cards, Schema.org, and share buttons.
-   **QR Code Generator**: Server-side QR code generation for profiles.

# External Dependencies

## Core Services
-   **PostgreSQL**: Standard pg driver (compatible with A2 Hosting and Node 16).
-   **Custom Auth**: Email/password authentication with bcryptjs.
-   **OpenAlex API**: Primary source for academic data.

## Cloud Storage
-   **Google Cloud Storage**: Used for file uploads.
-   **AWS S3**: Alternative cloud storage integration via Uppy.js.

## Development & Deployment
-   **Replit Platform**: Development environment and hosting.
-   **Vite**: Frontend build tool and dev server.
-   **TypeScript**: Language for type-safe development.

## UI & Styling
-   **Radix UI**: Accessible component primitives.
-   **Lucide Icons**: Icon library.
-   **Google Fonts**: For typography (Inter, Source Serif 4).
-   **Tailwind CSS**: Utility-first CSS framework.

## Additional Libraries/Integrations
-   **Uppy.js**: File upload handling.
-   **TanStack Query (React Query)**: Data fetching and caching.
-   **Wouter**: Lightweight React router.
-   **Zod**: Runtime type validation.
-   **QRCode**: Server-side QR code generation.
-   **React Icons**: Additional icon sets (e.g., FaXTwitter).