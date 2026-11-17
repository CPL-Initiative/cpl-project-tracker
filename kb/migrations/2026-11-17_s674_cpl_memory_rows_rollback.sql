-- Rollback of 2026-11-17_s674_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-printed-total-test-out-step-s674','d-rcc-social-justice-degree-total-stays-s674','f-los-rios-profile-filed-s674'));
delete from public.cpl_memory where slug in ('d-printed-total-test-out-step-s674','d-rcc-social-justice-degree-total-stays-s674','f-los-rios-profile-filed-s674');
