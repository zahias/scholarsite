-- Profile Analytics Table
-- Tracks individual events: views, clicks, shares, downloads
CREATE TABLE IF NOT EXISTS "profile_analytics" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" varchar REFERENCES "researcher_profiles"("id"),
  "openalex_id" varchar NOT NULL,
  "event_type" varchar NOT NULL,
  "event_target" varchar,
  "visitor_id" varchar,
  "referrer" varchar,
  "user_agent" varchar,
  "country" varchar,
  "city" varchar,
  "created_at" timestamp DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS "profile_analytics_profile_id_idx" ON "profile_analytics"("profile_id");
CREATE INDEX IF NOT EXISTS "profile_analytics_openalex_id_idx" ON "profile_analytics"("openalex_id");
CREATE INDEX IF NOT EXISTS "profile_analytics_created_at_idx" ON "profile_analytics"("created_at");

-- Daily Analytics Aggregates Table
-- Pre-computed daily stats for fast dashboard loading
CREATE TABLE IF NOT EXISTS "profile_analytics_daily" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "profile_id" varchar REFERENCES "researcher_profiles"("id"),
  "openalex_id" varchar NOT NULL,
  "date" date NOT NULL,
  "views" integer DEFAULT 0,
  "unique_visitors" integer DEFAULT 0,
  "clicks" integer DEFAULT 0,
  "shares" integer DEFAULT 0,
  "downloads" integer DEFAULT 0,
  UNIQUE("openalex_id", "date")
);
