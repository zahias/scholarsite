import { pool } from "./db";

/**
 * Runs all pending schema migrations idempotently on server startup.
 * Uses IF NOT EXISTS guards so it is safe to run multiple times.
 */
export async function runMigrations(): Promise<void> {
  if (!pool) {
    console.log("[migrations] No DB connection — skipping migrations.");
    return;
  }

  const client = await pool.connect();
  try {
    console.log("[migrations] Running schema migrations…");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token" varchar(64) UNIQUE NOT NULL,
        "expires_at" timestamp NOT NULL,
        "used_at" timestamp,
        "created_at" timestamp DEFAULT now()
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS "prt_token_idx" ON "password_reset_tokens"("token");`);
    await client.query(`CREATE INDEX IF NOT EXISTS "prt_user_idx" ON "password_reset_tokens"("user_id");`);

    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(64);`);
    await client.query(`ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" timestamp;`);

    console.log("[migrations] Schema migrations complete.");
  } catch (err) {
    console.error("[migrations] Migration error:", err);
    // Do not crash the server on migration errors — log and continue
  } finally {
    client.release();
  }
}
