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
The platform comprises three main surfaces:
1.  **Marketing/Landing Site**: Public-facing entry point for showcasing the platform and enabling previews.
2.  **Researcher Profile Pages**: Individual, data-rich portfolio websites for researchers.
3.  **Admin Dashboard (Planned)**: Backend interface for managing customer sites.

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
-   **Primary Database**: PostgreSQL (configured for Neon serverless).
-   **Schema Management**: Drizzle Kit for migrations.
-   **Key Tables**: Users, sessions, researcher profiles, cached OpenAlex data (publications, topics, affiliations), and supporting tables.

## Authentication & Authorization
-   **Provider**: Replit OIDC authentication via Passport.js.
-   **Session Storage**: PostgreSQL-backed sessions.
-   **Authorization**: Route-level middleware.

## Data Integration
-   **OpenAlex API**: Core service for fetching academic data.
-   **Data Caching**: Local database caching with sync timestamps.
-   **Sync Strategy**: Supports manual and automated profile synchronization, including unlimited publication loading via pagination.

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
-   **Neon Database**: Serverless PostgreSQL hosting.
-   **Replit Auth**: OIDC authentication provider.
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