-- Rollback of 2026-11-16_s669_cpl_memory_rows.sql (by slug). Deletes only this file's create log rows.
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('sam-catalog-asks-relayed-2026-11-16','d-catalog-header-folds-s669','d-cplai-title-chips-s669','p-title-keyed-join-leaks-across-rows-s669'));
delete from public.cpl_memory where slug in ('sam-catalog-asks-relayed-2026-11-16','d-catalog-header-folds-s669','d-cplai-title-chips-s669','p-title-keyed-join-leaks-across-rows-s669');
