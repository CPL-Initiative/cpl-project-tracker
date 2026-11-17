-- Rollback of 2026-11-17_s672_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug), and restores
-- the S671 row's summary only while it holds the corrected text.
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-rccd-repeat-rows-reconcile-steps-s672','f-norco-mis-performance-options-ungrouped-s672'));
delete from public.cpl_memory where slug in ('d-rccd-repeat-rows-reconcile-steps-s672','f-norco-mis-performance-options-ungrouped-s672');
update public.cpl_memory set summary = replace(summary, 'fixed none (31892''s apparent pass dropped its one-course-from-each-cluster rule, and main''s reading was restored, COBIx on #3438)', 'fixed one (31892)'), updated_at = now()
where slug = 'd-rccd-pilot-no-blind-force-s671' and author = 'SkyKinglet (S671)' and summary like '%fixed none (31892''s apparent pass%';
