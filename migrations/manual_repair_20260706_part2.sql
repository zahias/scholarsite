-- Manual repair, part 2 — run as the OWNER of the tables (same as
-- migrations/manual_repair_20260706.sql — via cPanel phpPgAdmin, logged in
-- as the account that created the tables, NOT the app's DATABASE_URL user).
--
-- Diagnosed 2026-07-06 (later in the day): OpenAlex sync silently fails on
-- every researcher profile. Researcher metadata, topics, and affiliations
-- sync fine, but publications never save — the "no unique or exclusion
-- constraint matching the ON CONFLICT specification" error in stderr.log
-- traces to server/storage.ts upsertPublications(), which relies on
-- Drizzle's onConflictDoUpdate targeting (openalex_id, work_id). That
-- constraint was never present on the live "publications" table (it
-- pre-existed under a different owner, so the app's own migrations could
-- never add it — see the "must be owner of relation publications" lines
-- already in stderr.log for the same reason the earlier repair was needed).

-- If this fails with "could not create unique index ... duplicate key",
-- there are already duplicate (openalex_id, work_id) rows to dedupe first:
--   DELETE FROM publications a USING publications b
--   WHERE a.id < b.id AND a.openalex_id = b.openalex_id AND a.work_id = b.work_id;
-- Run that once, then retry the ALTER below.

ALTER TABLE "publications"
  ADD CONSTRAINT "publications_openalex_id_work_id_key" UNIQUE ("openalex_id", "work_id");
