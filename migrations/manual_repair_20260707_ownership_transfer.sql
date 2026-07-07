-- Manual repair — run ONCE as the OWNER of the tables (cPanel -> phpPgAdmin,
-- logged in as the account that created the tables, NOT the app's
-- DATABASE_URL user "bannwebs_admin").
--
-- This is the permanent fix for the entire class of bug this project has
-- hit repeatedly: "must be owner of relation X" on the app's own startup
-- migrations, and "permission denied for relation X" at runtime (payments,
-- profile_analytics). Both come from the same root cause — tables in this
-- database are owned by a role other than the one in DATABASE_URL, and
-- ownership in Postgres is never implied by being "the same database";
-- it has to be granted or transferred explicitly.
--
-- Transferring ownership of every table (and sequence) to bannwebs_admin
-- means the app's own migration runner (server/runMigrations.ts) can
-- CREATE/ALTER/GRANT on these tables itself going forward — no more manual
-- phpPgAdmin round trips for future schema changes.
--
-- Safe to run: ALTER ... OWNER TO does not touch data or drop anything.
-- If a table is already owned by bannwebs_admin, the statement is a no-op
-- for that table (Postgres allows re-setting the same owner).

DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I OWNER TO bannwebs_admin', t.tablename);
  END LOOP;
END $$;

DO $$
DECLARE s record;
BEGIN
  FOR s IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I OWNER TO bannwebs_admin', s.sequencename);
  END LOOP;
END $$;

-- Note: this does NOT grant CREATE EXTENSION privileges (pgcrypto is still
-- unavailable to bannwebs_admin — that requires either superuser or a
-- database-level CREATE grant from a superuser, which is out of scope for
-- an ownership transfer). This is a known, accepted limitation: the app
-- already generates its own UUIDs in code (see generateUUID() usages in
-- server/storage.ts) rather than relying on the database's
-- gen_random_uuid() default, so it isn't actually blocked by this.
