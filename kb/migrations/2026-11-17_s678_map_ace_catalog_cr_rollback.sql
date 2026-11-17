-- Rollback of 2026-11-17_s678_map_ace_catalog_cr.sql (S678).
--
-- The table holds a copy of ACE catalog text the nightly pull re-sends every night, so the next load after a
-- re-apply refills every pair still in the catalog. What a refill cannot restore is first_seen, and the pairs the
-- catalog has since stopped sending, so the rows are copied to a backup table first. The backup grants nothing to
-- the API roles and is dropped by hand once read. Dropping the table drops its policy.
--
-- Run the loader change's revert (or leave it: kb/_sync_map_custom_reports.py treats a missing
-- map_ace_catalog_cr_load as "not applied yet" and the nightly load goes on).
create table public.map_ace_catalog_cr_backup as table public.map_ace_catalog_cr;
alter table public.map_ace_catalog_cr_backup enable row level security;
revoke all on public.map_ace_catalog_cr_backup from anon, authenticated;
grant select on public.map_ace_catalog_cr_backup to service_role;
drop view if exists public.map_exhibit_cr_side_by_side;
drop function if exists public.map_ace_catalog_cr_load(jsonb);
drop table public.map_ace_catalog_cr;
