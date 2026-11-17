-- Rollback of 2026-11-17_s678_map_ace_catalog_cr.sql (S678).
--
-- The table holds a copy of ACE catalog text the nightly pull re-sends every night, so the next load after a
-- re-apply refills every pair still in the catalog. What a refill cannot restore is first_seen, and the pairs the
-- catalog has since stopped sending, so the rows are copied to a backup table first. The backup grants nothing to
-- the API roles and is dropped by hand once read. Dropping the table drops its policy.
--
-- It runs twice safely. A second run, after the table is gone, keeps the backup the first run made and changes
-- nothing (every step is guarded by existence). A run after a re-apply copies the newer table over an older
-- backup: the older backup is dropped first, on purpose, because the table being dropped is the newer record.
--
-- Run the loader change's revert (or leave it: kb/_sync_map_custom_reports.py treats a missing
-- map_ace_catalog_cr_load as "not applied yet" and the nightly load goes on).
--
-- Restore from the backup, after re-applying the migration (first_seen and pairs the catalog stopped sending come
-- back; a pair the next load sends again keeps the backup's first_seen and moves last_seen forward):
--   insert into public.map_ace_catalog_cr (exhibit_id, credit_recommendation, typo_key, first_seen, last_seen)
--   select exhibit_id, credit_recommendation, typo_key, first_seen, last_seen from public.map_ace_catalog_cr_backup
--   on conflict (exhibit_id, cr_md5) do nothing;
--   drop table public.map_ace_catalog_cr_backup;
do $$
begin
  if to_regclass('public.map_ace_catalog_cr') is not null then
    drop table if exists public.map_ace_catalog_cr_backup;
    create table public.map_ace_catalog_cr_backup as table public.map_ace_catalog_cr;
    alter table public.map_ace_catalog_cr_backup enable row level security;
    revoke all on public.map_ace_catalog_cr_backup from anon, authenticated;
    grant select on public.map_ace_catalog_cr_backup to service_role;
  end if;
end $$;
drop view if exists public.map_exhibit_cr_side_by_side;
drop function if exists public.map_ace_catalog_cr_load(jsonb);
drop table if exists public.map_ace_catalog_cr;
