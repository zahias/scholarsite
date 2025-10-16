# Overview

This is a research profile platform that creates beautiful, automatically-updated academic profiles powered by the OpenAlex API. The application allows researchers to showcase their publications, impact metrics, research topics, affiliations, and academic journey in a unified dashboard. It features authentication, profile management, data synchronization with OpenAlex, and public profile viewing capabilities.

# Recent Changes (October 16, 2025)

## Bug Fixes
- **Export Bibliography**: Fixed export functionality by adding proper onClick handler to navigate to download endpoint
- **Publication Analytics Accuracy**: Removed publication query limit to ensure all publications are included in charts (previously limited to 50, now unlimited)
- **Publication Type Classification**: Fixed publication type chart to use actual `publicationType` field from database instead of inferring from journal names
- **Data Integrity**: Added unique constraint on `[openalex_id, data_type]` in openalexData table to prevent duplicate entries
- **CV Upload**: Fixed ObjectStorageClient initialization with proper bucketId parameter
- **Delete Researcher**: Implemented atomic transaction support for cascading deletes to maintain data integrity

## Performance Considerations
- Publication queries now return all records without limit for accurate analytics
- For researchers with >10,000 publications, consider implementing pagination or server-side aggregation in the future
- Current implementation prioritizes accuracy over performance for analytics features

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