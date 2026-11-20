-- cpl_memory rows for the plain session with Sam of 2026-11-20 (the Commons outline fixes, the first slice of his work
-- order's page fixes). NOT pointed at by kb/migrations/.apply: the session applies it with one execute_sql call after
-- the PR merges. INSERT ... ON CONFLICT (slug) DO NOTHING. One row is Sam's ruling in his words (verified); the other
-- is the session's decision (proposed). No person's contact detail in any row.
-- ROLLBACK: kb/migrations/2026-11-20_commons_outline_fixes_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('r-commons-page-fixes-sam-2026-11-20','decision','Commons page fixes: name the work, link the addresses, name the 12 courses','Sam, 2026-11-20, his work order as he gave it to the plain session: "Needs you should name the real work (e.g. "Course Outline and Catalog Fixes Needed"), not just "Rows waiting on a person."" "Outline addresses should be links that open in a new tab, with one line: "Send the PDF to COBIx in your Grok Bot chat."" "Name those 12 on the page instead of "TBA."" The new-tab links are his exception to d-data-collection-links-open-in-panel-s649.',array['commons','college-data-collection','needs-you','sam-ruling'],'verified','Sam, in session 2026-11-20 (the plain session); docs/reference/sam_rulings.md','Sam (in session)',now(),'Sky (plain session, 2026-11-20)',date '2026-11-20'),
('d-hunt-only-still-taught-colleges-2026-11-20','decision','The outline hunt keeps a college only while it has a still-taught course','Plain session, 2026-11-20, under Sam''s work order (blocked outlines are a priority only for the 12 still-taught courses): kb/reference/blocked_catalog_hunt.json lists the 12 (COBIx on #3584, comment 7039460536; all in the Fall 2025 term file), and kb/_blocked_catalogs.py hunts a college only while it has one. 4 colleges are on the to-do; El Camino and Fullerton are set aside. Both pages read this one count. Undo: git revert.',array['commons','college-data-collection','needs-you','course-outlines'],'proposed','cpl-project-tracker PR for claude/laughing-hawking-9u66zr; tests/commons_outline_fixes.test.js',null,null,'Sky (plain session, 2026-11-20)',date '2026-11-20')
on conflict (slug) do nothing;

insert into public.cpl_memory_log (memory_id, actor, action, note, after)
select id, 'Sky (plain session, 2026-11-20)', 'create', 'Plain session (2026-11-20): the Commons outline fixes', to_jsonb(m)
from public.cpl_memory m where m.slug in ('r-commons-page-fixes-sam-2026-11-20','d-hunt-only-still-taught-colleges-2026-11-20')
  and not exists (select 1 from public.cpl_memory_log l where l.memory_id = m.id and l.action = 'create');
