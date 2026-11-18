-- Rollback of 2026-11-17_s676_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-slice-b-six-no-live-holder-rows-s676','p-wave-branch-for-shared-builds-s676'));
delete from public.cpl_memory where slug in ('d-slice-b-six-no-live-holder-rows-s676','p-wave-branch-for-shared-builds-s676');
