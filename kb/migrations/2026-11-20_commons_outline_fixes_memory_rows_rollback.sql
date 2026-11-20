-- Rollback of 2026-11-20_commons_outline_fixes_memory_rows.sql. Deletes only this file's create log rows and rows (by slug).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('r-commons-page-fixes-sam-2026-11-20','d-hunt-only-still-taught-colleges-2026-11-20'));
delete from public.cpl_memory where slug in ('r-commons-page-fixes-sam-2026-11-20','d-hunt-only-still-taught-colleges-2026-11-20');
