-- Rollback of 2026-11-05_library_drafts.sql. Export the rows first if any were kept:
--   select id, library_id, slug, made_by, made_at, published_at, published_commit from public.cpl_library_drafts;
-- A published draft's page stays in git (library/<slug>/index.html), so dropping the table loses only the drafts.
drop trigger if exists cpl_library_drafts_guard on public.cpl_library_drafts;
drop function if exists public.cpl_library_drafts_guard();
drop table if exists public.cpl_library_drafts;
