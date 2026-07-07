-- Manual repair — run as the OWNER of the tables (cPanel -> phpPgAdmin,
-- logged in as the account that created the tables, NOT the app's
-- DATABASE_URL user "bannwebs_admin").
--
-- Diagnosed 2026-07-07: deleting a tenant and loading a customer's
-- payments/analytics tabs both fail with 500s. stderr.log shows the real
-- cause: "permission denied for relation payments" / "permission denied
-- for relation profile_analytics" (Postgres error 42501).
--
-- Root cause: payments, profile_analytics, and profile_analytics_daily
-- were created by the table-owner role during the 2026-07-06 manual
-- repair (via phpPgAdmin), not by the app's own role. In Postgres,
-- creating a table does NOT grant other roles any access to it, even
-- within the same database — so the app's role could see these tables
-- exist (schema/column checks passed) but was never allowed to actually
-- read or write them. This is the same "must be owner of relation" class
-- of bug that's caused nearly every issue this session, just surfacing
-- as a permissions error instead of a blocked ALTER/CREATE this time.
--
-- Fix: grant the app's role full DML access to every table in the public
-- schema (covers payments/profile_analytics/profile_analytics_daily plus
-- anything else already affected the same way), and set default
-- privileges so any table the owner creates in the future grants access
-- automatically — closing this entire class of bug going forward.

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bannwebs_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bannwebs_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bannwebs_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO bannwebs_admin;
