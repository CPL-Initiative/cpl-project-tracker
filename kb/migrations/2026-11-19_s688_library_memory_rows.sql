-- cpl_memory decision row for SkyLinnet (S688): a Library accessibility check binds to the url it checked (COBIx on
-- #3572, comment 7023899407). The conductor's decision, reversible. INSERT ... ON CONFLICT (slug) DO NOTHING; the row
-- lands proposed. Apply after kb/migrations/2026-11-19_library_check_binds_url.sql.
-- ROLLBACK: kb/migrations/2026-11-19_s688_library_memory_rows_rollback.sql
insert into public.cpl_memory (slug,kind,title,summary,tags,status,source,verified_by,verified_at,author,event_date) values
('d-library-check-binds-url-s688','decision','A Library accessibility check binds to the url it checked','SkyLinnet (S688), COBIx on #3572: cpl_library_checks.url names the page a check ran against. cpl_library_set_public() counts a pass only at the record''s current url and version key, and the trigger''s version branch does the same, so a url move cannot relist a piece on the old url''s pass. Old rows keep a null url, which matches no page. Part 2''s check run must write url on every check row.',array['library','public-library','a11y-gate'],'proposed','#3572 COBIx comment 7023899407','SkyLinnet (S688)',null,'SkyLinnet (S688)',date '2026-11-19')
on conflict (slug) do nothing;

select count(*) as rows from public.cpl_memory where author='SkyLinnet (S688)' and slug = 'd-library-check-binds-url-s688';
