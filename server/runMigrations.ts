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
    console.log("[migrations] Running schema migrations…");

    // ── 1. users table — MUST run first (Drizzle SELECTs these columns on every query) ──
    await run("users.email_verified_at", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;`);
    await run("users.email_verification_token", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(64);`);
    await run("users.email_verification_expires_at", `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" timestamp;`);

    // ── 2. tenants table — trial support ──
    await run("tenants.trial_ends_at", `ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp;`);

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
    client.release();
  }
}
