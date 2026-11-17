-- Rollback of 2026-11-17_s671_cpl_memory_rows.sql (by slug). Deletes only this file's create log rows.
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-rccd-pilot-no-blind-force-s671','f-rccd-area7-basic-training-s671','p-repeated-course-row-undercounts-s671','p-capture-can-lose-passing-page-s671'));
delete from public.cpl_memory where slug in ('d-rccd-pilot-no-blind-force-s671','f-rccd-area7-basic-training-s671','p-repeated-course-row-undercounts-s671','p-capture-can-lose-passing-page-s671');
