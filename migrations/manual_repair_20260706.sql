-- Manual repair — run as the OWNER of the tables (e.g. via cPanel → phpPgAdmin,
-- logged in with the database owner account), because the app's DB user gets
-- "must be owner of relation" on every ALTER TABLE.
--
-- Diagnosed 2026-07-06: trial signup returns "Registration failed" because these
-- columns were never added (startup migrations fail on ownership), and several
-- newer tables were never created (gen_random_uuid()/pgcrypto unavailable on
-- this PostgreSQL server).

-- ── 1. Launch-critical: fixes "Registration failed" on trial signup ──
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(64);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" timestamp;

-- ── 2. Missing tables (creation failed because gen_random_uuid() does not exist
--       on this server and the app user may not create extensions).
--       The app supplies its own UUIDs for payments/analytics inserts; the
--       md5-based default below covers rows where no id is passed
--       (password_reset_tokens and daily analytics rely on the DB default). ──

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" varchar PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" varchar(64) UNIQUE NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "prt_token_idx" ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "prt_user_idx" ON "password_reset_tokens"("user_id");

CREATE TABLE IF NOT EXISTS "payments" (
  "id" varchar PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  "tenant_id" varchar REFERENCES "tenants"("id"),
  "order_number" varchar UNIQUE NOT NULL,
  "amount" varchar NOT NULL,
  "currency" varchar DEFAULT 'USD' NOT NULL,
  "status" varchar DEFAULT 'pending' NOT NULL,
  "plan" varchar NOT NULL,
  "billing_period" varchar DEFAULT 'monthly' NOT NULL,
  "customer_email" varchar NOT NULL,
  "customer_name" varchar NOT NULL,
  "montypay_session_id" varchar,
  "montypay_transaction_id" varchar,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now(),
  "completed_at" timestamp
);

CREATE TABLE IF NOT EXISTS "profile_analytics" (
  "id" varchar PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
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
CREATE INDEX IF NOT EXISTS "profile_analytics_profile_id_idx" ON "profile_analytics"("profile_id");
CREATE INDEX IF NOT EXISTS "profile_analytics_openalex_id_idx" ON "profile_analytics"("openalex_id");
CREATE INDEX IF NOT EXISTS "profile_analytics_created_at_idx" ON "profile_analytics"("created_at");

CREATE TABLE IF NOT EXISTS "profile_analytics_daily" (
  "id" varchar PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
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

-- ── 3. Recommended: transfer ownership to the user in DATABASE_URL so the
--       app's startup migrations can self-heal in the future.
--       Replace APP_DB_USER with the username from DATABASE_URL
--       (cPanel → PostgreSQL Databases shows it), then uncomment and run:
--
-- DO $$
-- DECLARE t record;
-- BEGIN
--   FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
--     EXECUTE format('ALTER TABLE public.%I OWNER TO APP_DB_USER', t.tablename);
--   END LOOP;
-- END $$;
