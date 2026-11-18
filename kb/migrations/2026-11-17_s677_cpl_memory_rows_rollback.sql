-- Rollback of 2026-11-17_s677_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-chaffey-18435-not-found-no-live-row-s677','f-skyline-self-test-miss-38299-pace-s677'));
delete from public.cpl_memory where slug in ('d-chaffey-18435-not-found-no-live-row-s677','f-skyline-self-test-miss-38299-pace-s677');
