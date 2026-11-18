-- Rollback of 2026-11-17_s676b_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('p-two-writers-one-lane-refetch-main-s676b','f-crafton-hills-11766-on-master-teacher-page-s676b'));
delete from public.cpl_memory where slug in ('p-two-writers-one-lane-refetch-main-s676b','f-crafton-hills-11766-on-master-teacher-page-s676b');
