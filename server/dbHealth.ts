import { pool } from "./db";

const REQUIRED_COLUMNS: Record<string, string[]> = {
  tenants: [
    "id", "name", "plan", "status", "subscription_start_date", "subscription_end_date", "last_sync_at",
    "sync_frequency", "primary_color", "accent_color", "logo_url", "selected_theme_id", "trial_ends_at",
    "contact_email", "notes", "created_at", "updated_at",
  ],
  users: [
    "id", "tenant_id", "email", "password_hash", "role", "first_name", "last_name", "profile_image_url",
    "is_active", "email_verified_at", "email_verification_token", "email_verification_expires_at", "created_at", "updated_at",
  ],
  researcher_profiles: [
    "id", "tenant_id", "openalex_id", "display_name", "title", "bio", "profile_image_url", "cv_url",
    "current_affiliation", "current_position", "current_affiliation_url", "current_affiliation_start_date", "email",
    "orcid_url", "google_scholar_url", "research_gate_url", "linkedin_url", "website_url", "twitter_url",
    "selected_theme_id", "is_public", "last_synced_at", "created_at", "updated_at",
  ],
  domains: [
    "id", "tenant_id", "hostname", "is_primary", "is_subdomain", "ssl_status", "verified_at", "created_at",
  ],
  openalex_data: ["id", "openalex_id", "data_type", "data", "last_updated"],
  research_topics: ["id", "openalex_id", "topic_id", "display_name", "count", "subfield", "field", "domain", "value"],
  publications: [
    "id", "openalex_id", "work_id", "title", "author_names", "journal", "publication_year", "citation_count",
    "topics", "doi", "is_open_access", "publication_type", "is_review_article", "is_featured", "pdf_url",
  ],
  affiliations: [
    "id", "openalex_id", "institution_id", "institution_name", "institution_type", "country_code", "years", "start_year", "end_year",
  ],
  profile_sections: ["id", "profile_id", "title", "content", "section_type", "sort_order", "is_visible", "created_at", "updated_at"],
};

// Tables whose upsert logic relies on Drizzle's onConflictDoUpdate — Postgres
// requires an actual unique constraint/index on these columns for that to work.
// A table created before the constraint existed (or under a different owner
// that blocked later ALTERs) can pass the column check above yet still fail
// every upsert with "no unique or exclusion constraint matching the ON
// CONFLICT specification" — this caught OpenAlex sync silently failing on
// every publication for exactly that reason.
const REQUIRED_UNIQUE_CONSTRAINTS: Record<string, string[]> = {
  publications: ["openalex_id", "work_id"],
  openalex_data: ["openalex_id", "data_type"],
};

export type DatabaseHealth = {
  connected: boolean;
  schemaReady: boolean;
  category: "ok" | "database_unreachable" | "schema_incomplete";
  missingColumns: string[];
  missingConstraints: string[];
};

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  if (!pool) {
    return {
      connected: false,
      schemaReady: false,
      category: "database_unreachable",
      missingColumns: [],
      missingConstraints: [],
    };
  }

  let client: any;
  try {
    client = await pool.connect();
    await client.query("SELECT 1");
    const tableNames = Object.keys(REQUIRED_COLUMNS);
    const result = await client.query(
      `SELECT table_name, column_name
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [tableNames],
    );
    const rows = result.rows as Array<{ table_name: string; column_name: string }>;
    const available = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));
    const missingColumns = Object.entries(REQUIRED_COLUMNS).flatMap(([table, columns]) =>
      columns
        .filter((column) => !available.has(`${table}.${column}`))
        .map((column) => `${table}.${column}`),
    );

    const constraintTables = Object.keys(REQUIRED_UNIQUE_CONSTRAINTS);
    const constraintResult = await client.query(
      `SELECT t.relname AS table_name, array_agg(a.attname ORDER BY a.attname) AS columns
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       JOIN unnest(c.conkey) AS colnum ON true
       JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = colnum
       WHERE n.nspname = 'public' AND t.relname = ANY($1::text[]) AND c.contype IN ('u', 'p')
       GROUP BY t.relname, c.oid`,
      [constraintTables],
    );
    const constraintRows = constraintResult.rows as Array<{ table_name: string; columns: string[] }>;
    const constraintSets = new Set(
      constraintRows.map((row) => `${row.table_name}:${[...row.columns].sort().join(",")}`),
    );
    const missingConstraints = Object.entries(REQUIRED_UNIQUE_CONSTRAINTS)
      .filter(([table, columns]) => !constraintSets.has(`${table}:${[...columns].sort().join(",")}`))
      .map(([table, columns]) => `${table}(${columns.join(", ")})`);

    const schemaReady = missingColumns.length === 0 && missingConstraints.length === 0;

    return {
      connected: true,
      schemaReady,
      category: schemaReady ? "ok" : "schema_incomplete",
      missingColumns,
      missingConstraints,
    };
  } catch (error) {
    console.error("[DatabaseHealth] Connectivity check failed:", error instanceof Error ? error.message : error);
    return {
      connected: false,
      schemaReady: false,
      category: "database_unreachable",
      missingColumns: [],
      missingConstraints: [],
    };
  } finally {
    client?.release();
  }
}
