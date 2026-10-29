-- cpl_library_projects_2026-10-29_s509.sql — one card per project (Library lane NEXT ①).
--
-- Sam, 2026-10-28 (mockup Version 20, https://claude.ai/artifact/DNzaPRUD1qsrBTAhbn29kR):
-- one card for a whole project, the ELL IET visual and its document his example; he
-- approved the project card. This adds the project column (the same text as the schema
-- file's section) and files the pieces already made as pairs under one project each:
-- the ELL IET visual and its document, and each college's CPL Opportunity visual and
-- workbook (the pair Make a visual writes, which now sets project itself).
--
-- Guarded: only rows whose project is null, by slug. Before-values: project was null on
-- every row (the column is new). ROLLBACK:
--   update public.cpl_library set project = null, updated_by = 'library-s509@bot'
--   where updated_by = 'library-s509@bot' and project is not null;
-- The history trigger files each row as it was before the update.
--
-- APPLIED 2026-10-29 by the Supabase MCP (apply_migration cpl_library_projects_2026_10_29_s509).
-- Read back: 13 projects, 2 pieces each (ELL IET and 12 colleges whose visual and workbook
-- are both on file), 26 rows.

alter table public.cpl_library add column if not exists project text;
alter table public.cpl_library drop constraint if exists cpl_library_project_ck;
alter table public.cpl_library add constraint cpl_library_project_ck check (
  project is null or char_length(btrim(project)) between 1 and 200);

update public.cpl_library set project = 'ELL IET CPL', updated_by = 'library-s509@bot'
where project is null and retired_at is null
  and slug in ('ell-iet-cpl-starting-points', 'ell-iet-cpl-ideas-mvlcfx9k');

-- Each college whose visual AND workbook are both on file.
update public.cpl_library l
set project = v.title, updated_by = 'library-s509@bot'
from public.cpl_library v
where l.project is null and l.retired_at is null and v.retired_at is null
  and v.slug like 'cpl-opportunity-%-visual'
  and l.slug in (v.slug, regexp_replace(v.slug, '-visual$', '-workbook'))
  and exists (select 1 from public.cpl_library w
              where w.slug = regexp_replace(v.slug, '-visual$', '-workbook') and w.retired_at is null);
