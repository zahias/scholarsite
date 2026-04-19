-- Migration 0003: auth improvements
-- Adds password reset tokens table and email verification columns to users

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" varchar(64) UNIQUE NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "prt_token_idx" ON "password_reset_tokens"("token");
CREATE INDEX IF NOT EXISTS "prt_user_idx" ON "password_reset_tokens"("user_id");

-- Email verification columns on users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified_at" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_token" varchar(64);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verification_expires_at" timestamp;
