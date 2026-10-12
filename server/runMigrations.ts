import { pool } from "./db";

/**
 * Runs all pending schema migrations idempotently on server startup.
 * Each statement has its own try/catch so a single failure does not abort
 * the remaining migrations.  User-column ALTERs run first because they are
 * referenced by every user query via Drizzle.
 */
export async function runMigrations(): Promise<void> {
  if (!pool) {
    console.log("[migrations] No DB connection — skipping migrations.");
    return;
  }

  const client = await pool.connect();
  const migrationLockKey = 193648267;
  let migrationLockAcquired = false;

  const run = async (label: string, sql: string) => {
    try {
      await client.query(sql);
      console.log(`[migrations] ✓ ${label}`);
    } catch (err: any) {
      // Ignore "already exists" errors (code 42701 = duplicate_column, 42P07 = duplicate_table)
      if (["42701", "42P07"].includes(err.code)) {
        console.log(`[migrations] ~ ${label} (already applied)`);
      } else {
        console.error(`[migrations] ✗ ${label}:`, err.message);
      }
    }
  };

  try {
    await client.query("SELECT pg_advisory_lock($1, $2)", [migrationLockKey, 2]);
    migrationLockAcquired = true;
    console.log("[migrations] Running schema migrations…");

    await run("pgcrypto extension", `CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // ── 1. core tables — tenant/user/profile tables are required by auth and dashboards ──
    await run("create tenants", `
      CREATE TABLE IF NOT EXISTS "tenants" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "plan" varchar DEFAULT 'starter' NOT NULL,
        "status" varchar DEFAULT 'pending' NOT NULL,
        "subscription_start_date" timestamp,
        "subscription_end_date" timestamp,
        "last_sync_at" timestamp,
        "sync_frequency" varchar DEFAULT 'monthly',
        "primary_color" varchar DEFAULT '#0B1F3A',
        "accent_color" varchar DEFAULT '#F2994A',
        "logo_url" varchar,
        "selected_theme_id" varchar,
        "trial_ends_at" timestamp,
        "contact_email" varchar,
        "notes" text,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    await run("create users", `
      CREATE TABLE IF NOT EXISTS "users" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" varchar REFERENCES "tenants"("id"),
        "email" varchar UNIQUE NOT NULL,
        "password_hash" varchar NOT NULL,
        "role" varchar DEFAULT 'researcher' NOT NULL,
        "first_name" varchar,
        "last_name" varchar,
        "profile_image_url" varchar,
        "is_active" boolean DEFAULT true NOT NULL,
        "email_verified_at" timestamp,
        "email_verification_token" varchar(64),
        "email_verification_expires_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    await run("create domains", `
      CREATE TABLE IF NOT EXISTS "domains" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" varchar NOT NULL REFERENCES "tenants"("id"),
        "hostname" varchar UNIQUE NOT NULL,
        "is_primary" boolean DEFAULT false NOT NULL,
        "is_subdomain" boolean DEFAULT false NOT NULL,
        "ssl_status" varchar DEFAULT 'pending',
        "verified_at" timestamp,
        "created_at" timestamp DEFAULT now()
      );
    `);
    await run("create researcher_profiles", `
      CREATE TABLE IF NOT EXISTS "researcher_profiles" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" varchar NOT NULL REFERENCES "tenants"("id"),
        "openalex_id" varchar UNIQUE,
        "display_name" text,
        "title" text,
        "bio" text,
        "profile_image_url" varchar,
        "cv_url" varchar,
        "current_affiliation" text,
        "current_position" text,
        "current_affiliation_url" varchar,
        "current_affiliation_start_date" date,
        "email" varchar,
        "orcid_url" varchar,
        "google_scholar_url" varchar,
        "research_gate_url" varchar,
        "linkedin_url" varchar,
        "website_url" varchar,
        "twitter_url" varchar,
        "selected_theme_id" varchar,
        "is_public" boolean DEFAULT true,
        "last_synced_at" timestamp,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    await run("create openalex_data", `
      CREATE TABLE IF NOT EXISTS "openalex_data" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "openalex_id" varchar NOT NULL,
        "data_type" varchar NOT NULL,
        "data" jsonb NOT NULL,
        "last_updated" timestamp DEFAULT now(),
        UNIQUE("openalex_id", "data_type")
      );
    `);
    await run("create research_topics", `
      CREATE TABLE IF NOT EXISTS "research_topics" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "openalex_id" varchar NOT NULL,
        "topic_id" varchar NOT NULL,
        "display_name" text NOT NULL,
        "count" integer NOT NULL,
        "subfield" text,
        "field" text,
        "domain" text,
        "value" varchar
      );
    `);
    await run("create publications", `
      CREATE TABLE IF NOT EXISTS "publications" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "openalex_id" varchar NOT NULL,
        "work_id" varchar NOT NULL,
        "title" text NOT NULL,
        "author_names" text,
        "journal" text,
        "publication_year" integer,
        "citation_count" integer DEFAULT 0,
        "topics" jsonb,
        "doi" varchar,
        "is_open_access" boolean DEFAULT false,
        "publication_type" varchar,
        "is_review_article" boolean DEFAULT false,
        "is_featured" boolean DEFAULT false,
        "pdf_url" varchar,
        UNIQUE("openalex_id", "work_id")
      );
    `);
    await run("create affiliations", `
      CREATE TABLE IF NOT EXISTS "affiliations" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "openalex_id" varchar NOT NULL,
        "institution_id" varchar NOT NULL,
        "institution_name" text NOT NULL,
        "institution_type" varchar,
        "country_code" varchar,
        "years" jsonb,
        "start_year" integer,
        "end_year" integer
      );
    `);
    await run("users.email_verified_at", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;`);
    await run("users.email_verification_token", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(64);`);
    await run("users.email_verification_expires_at", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" timestamp;`);
    await run("users.tenant_id", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" varchar REFERENCES "tenants"("id");`);
    await run("users.email", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" varchar;`);
    await run("users.password_hash", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar;`);
    await run("users.role", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" varchar DEFAULT 'researcher' NOT NULL;`);
    await run("users.is_active", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;`);
    await run("users.first_name", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "first_name" varchar;`);
    await run("users.last_name", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_name" varchar;`);
    await run("users.profile_image_url", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_image_url" varchar;`);
    await run("users.created_at", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();`);
    await run("users.updated_at", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();`);
    await run("users.id_default", `ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`);

    // ── 1b. sessions table — required by connect-pg-simple for auth login/signup ──
    await run("create sessions", `
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar PRIMARY KEY NOT NULL,
        "sess" jsonb NOT NULL,
        "expire" timestamp NOT NULL
      );
    `);
    await run("sessions_expire_idx", `CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions"("expire");`);

    // ── 2. tenants table — trial support ──
    await run("tenants.name", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "name" varchar;`);
    await run("tenants.plan", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "plan" varchar DEFAULT 'starter';`);
    await run("tenants.status", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "status" varchar DEFAULT 'pending';`);
    await run("tenants.trial_ends_at", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;`);
    await run("tenants.subscription_start_date", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_start_date" timestamp;`);
    await run("tenants.subscription_end_date", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "subscription_end_date" timestamp;`);
    await run("tenants.last_sync_at", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "last_sync_at" timestamp;`);
    await run("tenants.selected_theme_id", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "selected_theme_id" varchar;`);
    await run("tenants.contact_email", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "contact_email" varchar;`);
    await run("tenants.notes", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "notes" text;`);
    await run("tenants.sync_frequency", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "sync_frequency" varchar DEFAULT 'monthly';`);
    await run("tenants.primary_color", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "primary_color" varchar DEFAULT '#0B1F3A';`);
    await run("tenants.accent_color", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "accent_color" varchar DEFAULT '#F2994A';`);
    await run("tenants.logo_url", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "logo_url" varchar;`);
    await run("tenants.created_at", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();`);
    await run("tenants.updated_at", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();`);
    await run("tenants.id_default", `ALTER TABLE "tenants" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`);
    await run("tenants.monthly_sync_frequency", `UPDATE "tenants" SET "sync_frequency" = 'monthly' WHERE "sync_frequency" IS DISTINCT FROM 'monthly';`);

    // ── 2b. profile/publication additions used by researcher dashboards ──
    await run("researcher_profiles.openalex_id", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "openalex_id" varchar;`);
    await run("researcher_profiles.display_name", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "display_name" text;`);
    await run("researcher_profiles.title", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "title" text;`);
    await run("researcher_profiles.bio", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "bio" text;`);
    await run("researcher_profiles.cv_url", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "cv_url" varchar;`);
    await run("researcher_profiles.is_public", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT true;`);
    await run("researcher_profiles.last_synced_at", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "last_synced_at" timestamp;`);
    await run("researcher_profiles.current_affiliation", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "current_affiliation" text;`);
    await run("researcher_profiles.tenant_id", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "tenant_id" varchar REFERENCES "tenants"("id");`);
    await run("researcher_profiles.profile_image_url", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "profile_image_url" varchar;`);
    await run("researcher_profiles.current_position", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "current_position" text;`);
    await run("researcher_profiles.current_affiliation_url", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "current_affiliation_url" varchar;`);
    await run("researcher_profiles.current_affiliation_start_date", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "current_affiliation_start_date" date;`);
    await run("researcher_profiles.email", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "email" varchar;`);
    await run("researcher_profiles.social_links", `
      ALTER TABLE "researcher_profiles"
      ADD COLUMN IF NOT EXISTS "orcid_url" varchar,
      ADD COLUMN IF NOT EXISTS "google_scholar_url" varchar,
      ADD COLUMN IF NOT EXISTS "research_gate_url" varchar,
      ADD COLUMN IF NOT EXISTS "linkedin_url" varchar,
      ADD COLUMN IF NOT EXISTS "website_url" varchar,
      ADD COLUMN IF NOT EXISTS "twitter_url" varchar;
    `);
    await run("researcher_profiles.selected_theme_id", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "selected_theme_id" varchar;`);
    await run("researcher_profiles.created_at", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();`);
    await run("researcher_profiles.updated_at", `ALTER TABLE "researcher_profiles" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now();`);
    await run("researcher_profiles.id_default", `ALTER TABLE "researcher_profiles" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`);
    await run("domains.is_primary", `ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "is_primary" boolean DEFAULT false NOT NULL;`);
    await run("domains.tenant_id", `ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "tenant_id" varchar REFERENCES "tenants"("id");`);
    await run("domains.hostname", `ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "hostname" varchar;`);
    await run("domains.is_subdomain", `ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "is_subdomain" boolean DEFAULT false NOT NULL;`);
    await run("domains.ssl_status", `ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "ssl_status" varchar DEFAULT 'pending';`);
    await run("domains.verified_at", `ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "verified_at" timestamp;`);
    await run("domains.created_at", `ALTER TABLE "domains" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now();`);
    await run("domains.id_default", `ALTER TABLE "domains" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();`);
    await run("legacy profile user links", `
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'researcher_profiles' AND column_name = 'user_id'
        ) THEN
          EXECUTE '
            UPDATE researcher_profiles rp
            SET tenant_id = u.tenant_id
            FROM users u
            WHERE rp.tenant_id IS NULL
              AND rp.user_id = u.id
              AND u.tenant_id IS NOT NULL
          ';
        END IF;
      END $$;
    `);
    await run("legacy profile unique email links", `
      WITH unique_matches AS (
        SELECT rp.id AS profile_id, min(t.id::text) AS tenant_id
        FROM researcher_profiles rp
        JOIN tenants t ON lower(t.contact_email) = lower(rp.email)
        WHERE rp.tenant_id IS NULL AND rp.email IS NOT NULL
        GROUP BY rp.id
        HAVING count(DISTINCT t.id) = 1
      )
      UPDATE researcher_profiles rp
      SET tenant_id = unique_matches.tenant_id
      FROM unique_matches
      WHERE rp.id = unique_matches.profile_id;
    `);
    try {
      const repairSummary = await client.query(`
        SELECT
          count(*) FILTER (WHERE tenant_id IS NOT NULL)::integer AS linked,
          count(*) FILTER (WHERE tenant_id IS NULL)::integer AS unresolved
        FROM researcher_profiles
      `);
      const summary = repairSummary.rows[0] || { linked: 0, unresolved: 0 };
      console.log(`[migrations] Legacy profile links: ${summary.linked} linked, ${summary.unresolved} unresolved`);
    } catch (error) {
      console.error("[migrations] Could not summarize legacy profile links:", error instanceof Error ? error.message : error);
    }
    await run("publications.featured_pdf", `
      ALTER TABLE "publications"
      ADD COLUMN IF NOT EXISTS "is_featured" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "pdf_url" varchar;
    `);
    await run("publications.type_fields", `
      ALTER TABLE "publications"
      ADD COLUMN IF NOT EXISTS "publication_type" varchar,
      ADD COLUMN IF NOT EXISTS "is_review_article" boolean DEFAULT false;
    `);

    // ── 2c. custom sections, sync logs, themes, analytics, and payments ──
    await run("create profile_sections", `
      CREATE TABLE IF NOT EXISTS "profile_sections" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "profile_id" varchar NOT NULL REFERENCES "researcher_profiles"("id"),
        "title" varchar NOT NULL,
        "content" text NOT NULL,
        "section_type" varchar DEFAULT 'custom' NOT NULL,
        "sort_order" integer DEFAULT 0 NOT NULL,
        "is_visible" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    await run("profile_sections_profile_idx", `CREATE INDEX IF NOT EXISTS "idx_profile_sections_profile_id" ON "profile_sections"("profile_id");`);
    await run("create sync_logs", `
      CREATE TABLE IF NOT EXISTS "sync_logs" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" varchar REFERENCES "tenants"("id"),
        "profile_id" varchar REFERENCES "researcher_profiles"("id"),
        "sync_type" varchar NOT NULL,
        "status" varchar NOT NULL,
        "items_processed" integer DEFAULT 0,
        "items_total" integer,
        "error_message" text,
        "started_at" timestamp DEFAULT now(),
        "completed_at" timestamp
      );
    `);
    await run("sync_logs_profile_idx", `CREATE INDEX IF NOT EXISTS "idx_sync_logs_profile_id" ON "sync_logs"("profile_id");`);
    await run("sync_logs_tenant_idx", `CREATE INDEX IF NOT EXISTS "idx_sync_logs_tenant_id" ON "sync_logs"("tenant_id");`);
    await run("create site_settings", `
      CREATE TABLE IF NOT EXISTS "site_settings" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "setting_key" varchar UNIQUE NOT NULL,
        "setting_value" text NOT NULL,
        "updated_at" timestamp DEFAULT now()
      );
    `);
    await run("create themes", `
      CREATE TABLE IF NOT EXISTS "themes" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar UNIQUE NOT NULL,
        "description" text,
        "config" jsonb NOT NULL,
        "preview_image_url" varchar,
        "is_active" boolean DEFAULT true NOT NULL,
        "is_default" boolean DEFAULT false NOT NULL,
        "sort_order" integer DEFAULT 0,
        "created_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now()
      );
    `);
    await run("create profile_analytics", `
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
    `);
    await run("profile_analytics_profile_idx", `CREATE INDEX IF NOT EXISTS "profile_analytics_profile_id_idx" ON "profile_analytics"("profile_id");`);
    await run("profile_analytics_openalex_idx", `CREATE INDEX IF NOT EXISTS "profile_analytics_openalex_id_idx" ON "profile_analytics"("openalex_id");`);
    await run("profile_analytics_created_idx", `CREATE INDEX IF NOT EXISTS "profile_analytics_created_at_idx" ON "profile_analytics"("created_at");`);
    await run("create profile_analytics_daily", `
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
    `);
    await run("create payments", `
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
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
    `);

    // ── 3. password_reset_tokens table ──
    await run("create password_reset_tokens", `
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" varchar(64) UNIQUE NOT NULL,
        "expires_at" timestamp NOT NULL,
        "used_at" timestamp,
        "created_at" timestamp DEFAULT now()
      );
    `);
    await run("prt_token_idx", `CREATE INDEX IF NOT EXISTS "prt_token_idx" ON "password_reset_tokens"("token");`);
    await run("prt_user_idx", `CREATE INDEX IF NOT EXISTS "prt_user_idx" ON "password_reset_tokens"("user_id");`);

    console.log("[migrations] Schema migrations complete.");
  } finally {
    if (migrationLockAcquired) {
      try {
        await client.query("SELECT pg_advisory_unlock($1, $2)", [migrationLockKey, 2]);
      } catch (error) {
        console.error("[migrations] Failed to release migration lock:", error);
      }
    }
    client.release();
  }
}
