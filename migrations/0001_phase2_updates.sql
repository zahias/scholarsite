-- Phase 2 Migration: Add publication featuring, profile sections, and sync logs

-- Add isFeatured and pdfUrl columns to publications table
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN DEFAULT false;
ALTER TABLE "publications" ADD COLUMN IF NOT EXISTS "pdf_url" VARCHAR;

-- Create profile_sections table for custom content sections
CREATE TABLE IF NOT EXISTS "profile_sections" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" VARCHAR NOT NULL REFERENCES "researcher_profiles"("id"),
  "title" VARCHAR NOT NULL,
  "content" TEXT NOT NULL,
  "section_type" VARCHAR DEFAULT 'custom' NOT NULL,
  "sort_order" INTEGER DEFAULT 0 NOT NULL,
  "is_visible" BOOLEAN DEFAULT true NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create index on profile_id for faster lookups
CREATE INDEX IF NOT EXISTS "idx_profile_sections_profile_id" ON "profile_sections"("profile_id");

-- Create sync_logs table for tracking OpenAlex sync history
CREATE TABLE IF NOT EXISTS "sync_logs" (
  "id" VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" VARCHAR REFERENCES "tenants"("id"),
  "profile_id" VARCHAR REFERENCES "researcher_profiles"("id"),
  "sync_type" VARCHAR NOT NULL,
  "status" VARCHAR NOT NULL,
  "items_processed" INTEGER DEFAULT 0,
  "items_total" INTEGER,
  "error_message" TEXT,
  "started_at" TIMESTAMP DEFAULT NOW(),
  "completed_at" TIMESTAMP
);

-- Create indexes for sync_logs
CREATE INDEX IF NOT EXISTS "idx_sync_logs_profile_id" ON "sync_logs"("profile_id");
CREATE INDEX IF NOT EXISTS "idx_sync_logs_tenant_id" ON "sync_logs"("tenant_id");
