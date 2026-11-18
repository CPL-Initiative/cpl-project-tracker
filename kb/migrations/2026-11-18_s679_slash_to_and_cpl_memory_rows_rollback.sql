-- Rollback of 2026-11-18_s679_slash_to_and_cpl_memory_rows.sql. Deletes only this file's create log row and row (by slug).
delete from public.cpl_memory_log where action = 'create' and memory_id in (select id from public.cpl_memory where slug in ('sam-slash-joining-words-is-and-2026-11-18'));
delete from public.cpl_memory where slug in ('sam-slash-joining-words-is-and-2026-11-18');
