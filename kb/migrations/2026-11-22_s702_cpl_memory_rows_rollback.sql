-- Rollback for kb/migrations/2026-11-22_s702_cpl_memory_rows.sql: removes the four rows S702 wrote and their log rows.
delete from public.cpl_memory_log where memory_id in (select id from public.cpl_memory where author = 'SkyRazorbill (S702)');
delete from public.cpl_memory where author = 'SkyRazorbill (S702)';
