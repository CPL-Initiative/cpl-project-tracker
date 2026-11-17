-- Rollback of 2026-11-17_s668_cpl_memory_rows_2.sql (by slug). Deletes only this file's create log rows.
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-bcc-41778-keeps-current-s668'));
delete from public.cpl_memory where slug in ('d-bcc-41778-keeps-current-s668');
