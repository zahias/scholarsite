-- ScholarSite Database Schema for A2 Hosting PostgreSQL
-- Run this script in phpPgAdmin or via psql command line

-- Enable UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tenants table - each paying customer
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  plan VARCHAR DEFAULT 'starter' NOT NULL,
  status VARCHAR DEFAULT 'pending' NOT NULL,
  subscription_start_date TIMESTAMP,
  subscription_end_date TIMESTAMP,
  last_sync_at TIMESTAMP,
  sync_frequency VARCHAR DEFAULT 'monthly',
  primary_color VARCHAR DEFAULT '#0B1F3A',
  accent_color VARCHAR DEFAULT '#F2994A',
  logo_url VARCHAR,
  contact_email VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Domains table - map custom domains to tenants
CREATE TABLE IF NOT EXISTS domains (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  hostname VARCHAR UNIQUE NOT NULL,
  is_primary BOOLEAN DEFAULT false NOT NULL,
  is_subdomain BOOLEAN DEFAULT false NOT NULL,
  ssl_status VARCHAR DEFAULT 'pending',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR REFERENCES tenants(id),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'researcher' NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Researcher profiles table
CREATE TABLE IF NOT EXISTS researcher_profiles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  tenant_id VARCHAR NOT NULL REFERENCES tenants(id),
  openalex_id VARCHAR UNIQUE,
  display_name TEXT,
  title TEXT,
  bio TEXT,
  profile_image_url VARCHAR,
  cv_url VARCHAR,
  current_affiliation TEXT,
  current_position TEXT,
  current_affiliation_url VARCHAR,
  current_affiliation_start_date DATE,
  email VARCHAR,
  is_public BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- OpenAlex researcher data cache
CREATE TABLE IF NOT EXISTS openalex_data (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  openalex_id VARCHAR NOT NULL,
  data_type VARCHAR NOT NULL,
  data JSONB NOT NULL,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(openalex_id, data_type)
);

-- Research topics cache
CREATE TABLE IF NOT EXISTS research_topics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  openalex_id VARCHAR NOT NULL,
  topic_id VARCHAR NOT NULL,
  display_name TEXT NOT NULL,
  count INTEGER NOT NULL,
  subfield TEXT,
  field TEXT,
  domain TEXT,
  value VARCHAR
);

-- Publications cache
CREATE TABLE IF NOT EXISTS publications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  openalex_id VARCHAR NOT NULL,
  work_id VARCHAR NOT NULL,
  title TEXT NOT NULL,
  author_names TEXT,
  journal TEXT,
  publication_year INTEGER,
  citation_count INTEGER DEFAULT 0,
  topics JSONB,
  doi VARCHAR,
  is_open_access BOOLEAN DEFAULT false,
  publication_type VARCHAR,
  is_review_article BOOLEAN DEFAULT false
);

-- Affiliations cache
CREATE TABLE IF NOT EXISTS affiliations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  openalex_id VARCHAR NOT NULL,
  institution_id VARCHAR NOT NULL,
  institution_name TEXT NOT NULL,
  institution_type VARCHAR,
  country_code VARCHAR,
  years JSONB,
  start_year INTEGER,
  end_year INTEGER
);

-- Site settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  setting_key VARCHAR UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Session table for express-session (connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" VARCHAR NOT NULL COLLATE "default",
  "sess" JSON NOT NULL,
  "expire" TIMESTAMP(6) NOT NULL,
  PRIMARY KEY ("sid")
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_domains_tenant ON domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON researcher_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_openalex ON researcher_profiles(openalex_id);
CREATE INDEX IF NOT EXISTS idx_openalex_data_id ON openalex_data(openalex_id);
CREATE INDEX IF NOT EXISTS idx_topics_openalex ON research_topics(openalex_id);
CREATE INDEX IF NOT EXISTS idx_publications_openalex ON publications(openalex_id);
CREATE INDEX IF NOT EXISTS idx_affiliations_openalex ON affiliations(openalex_id);

-- Insert default admin user (password: Admin123!)
-- Password hash for 'Admin123!' using bcrypt with 12 rounds
INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
VALUES (
  'admin@scholarsite.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VxHHFe4W9oA.Pu',
  'admin',
  'Platform',
  'Admin',
  true
) ON CONFLICT (email) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'ScholarSite database schema created successfully!';
  RAISE NOTICE 'Default admin: admin@scholarsite.com / Admin123!';
END $$;
