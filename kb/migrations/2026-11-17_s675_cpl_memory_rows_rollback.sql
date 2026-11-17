-- Rollback of 2026-11-17_s675_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-rcc-social-justice-catalog-unequal-s675','d-butte-31950-keeps-its-reading-s675'));
delete from public.cpl_memory where slug in ('d-rcc-social-justice-catalog-unequal-s675','d-butte-31950-keeps-its-reading-s675');
