-- Rollback of 2026-11-21_s698_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug and
-- author, so a row another session filed under the same slug first stays).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-possible-duplicate-shares-a-word-s698','d-term-reports-named-term-s698','d-dependency-map-hourly-s698','p-a11y-sweep-browser-dies-s698','m-page-followups-merged-s698') and author = 'SkyAuklet (S698)');
delete from public.cpl_memory where slug in ('d-possible-duplicate-shares-a-word-s698','d-term-reports-named-term-s698','d-dependency-map-hourly-s698','p-a11y-sweep-browser-dies-s698','m-page-followups-merged-s698') and author = 'SkyAuklet (S698)';
