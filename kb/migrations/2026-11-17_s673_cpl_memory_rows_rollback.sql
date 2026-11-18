-- Rollback of 2026-11-17_s673_cpl_memory_rows.sql. Deletes only this file's create log rows and rows (by slug), and restores
-- the S672 row's status only while it is superseded by this session.
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('d-norco-option-heading-counts-s673','d-mvc-38758-total-is-20-s673','f-ccn-renumber-shows-as-catalog-addition-s673'));
delete from public.cpl_memory where slug in ('d-norco-option-heading-counts-s673','d-mvc-38758-total-is-20-s673','f-ccn-renumber-shows-as-catalog-addition-s673');
update public.cpl_memory set status = 'proposed', updated_at = now()
where slug = 'f-norco-mis-performance-options-ungrouped-s672' and author = 'SkyWren (S672)' and status = 'superseded';
