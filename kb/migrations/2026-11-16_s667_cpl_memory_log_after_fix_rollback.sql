-- Rollback of 2026-11-16_s667_cpl_memory_log_after_fix.sql: puts the log row's `after` back to what the fix file wrote
-- (equal to its `before`), only for that one row.
update public.cpl_memory_log
set after = before
where id = '61e8c09a-d756-4db7-a3c2-27dc02188d1d' and actor = 'SkyPlover (S667)' and action = 'update';
