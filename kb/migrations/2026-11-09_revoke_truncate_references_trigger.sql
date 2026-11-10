-- 2026-11-09 (SkyCigar): revoke TRUNCATE, REFERENCES and TRIGGER from anon and authenticated on every table and
-- view in public, and stop the default privileges from granting them to new tables.
-- Sam's go (relayed by COBIx on cpl-project-tracker#2967 item 1, confirmed by Sam in session 2026-11-09).
-- RLS does not govern TRUNCATE: before this, anyone holding the public key and a SQL path could empty 91 tables,
-- among them cpl_funding_participation, cpl_funding_notes, cpl_funding_config, allowed_reviewers and
-- map_college_contacts. The same hole the per-table revokes of 2026-11-07..09 closed one table at a time.
-- SELECT / INSERT / UPDATE / DELETE are untouched (RLS governs them; a per-table pass is separate).
-- service_role and postgres keep every privilege, so the crons and appliers are unaffected.
-- Snapshot before apply (row counts, 2026-11-09 ~14:48Z): allowed_reviewers 13, budget_funding 45,
-- cpl_adoption_interest 0, cpl_funding_college_map 129, cpl_funding_config 1, cpl_funding_district_domains 1,
-- cpl_funding_nc_attestation 10, cpl_funding_notes 5, cpl_funding_participation 18, cpl_funding_reports 0,
-- csm_log 0, team_members 43, kb_curation 38,108. A revoke moves no row.
-- Rollback: 2026-11-09_revoke_truncate_references_trigger_rollback.sql (the exact prior grants).
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke truncate, references, trigger on tables from anon, authenticated;
do $$
begin
  execute 'alter default privileges for role supabase_admin in schema public revoke truncate, references, trigger on tables from anon, authenticated';
exception when insufficient_privilege then
  raise notice 'supabase_admin default privileges left as they are (not a member); tables here are created by postgres';
end $$;
-- Read-back (expect 0 rows):
-- select grantee, privilege_type, count(*) from information_schema.role_table_grants
--  where table_schema = 'public' and grantee in ('anon','authenticated')
--    and privilege_type in ('TRUNCATE','REFERENCES','TRIGGER') group by 1, 2;
-- Applied 2026-11-09 ~14:52Z through the Supabase MCP (apply_migration revoke_truncate_references_trigger).
-- Read back: 0 TRUNCATE / REFERENCES / TRIGGER grants to anon or authenticated in public; postgres's default
-- privileges now read anon=arwdm, authenticated=arwdm; service_role keeps TRUNCATE (128 relations);
-- cpl_funding_participation still 18 rows, allowed_reviewers 13. supabase_admin's default privileges are unchanged
-- (postgres is not a member of that role); tables in public are created by postgres.
