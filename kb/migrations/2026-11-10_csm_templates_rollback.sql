-- Rollback of kb/migrations/2026-11-10_csm_templates.sql (S626b). Drops the dashboard's saved email templates; the
-- dashboard falls back to the wording it ships with. Export the rows first (select * from public.csm_templates, under
-- the service role) if any version should be kept.
drop trigger if exists csm_templates_stamp on public.csm_templates;
drop function if exists public.csm_templates_stamp();
drop table if exists public.csm_templates;
