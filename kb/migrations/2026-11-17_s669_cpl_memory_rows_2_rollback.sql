-- Rollback of 2026-11-17_s669_cpl_memory_rows_2.sql (by slug). Deletes only this file's create log rows.
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('sam-3412-asks-relayed-2026-11-16','d-3412-built-s669','d-align-lexical-held-off-s669','p-lexical-cover-rule-overmatches-s669'));
delete from public.cpl_memory where slug in ('sam-3412-asks-relayed-2026-11-16','d-3412-built-s669','d-align-lexical-held-off-s669','p-lexical-cover-rule-overmatches-s669');
