-- Rollback for kb/migrations/2026-11-22_s705_cpl_memory_rows.sql (SkyTystie, S705).
update public.cpl_memory set status = 'proposed' where slug = 'd-subjects-several-colleges-one-press-each-s702' and status = 'superseded';
delete from public.cpl_memory_log where actor = 'SkyTystie (S705)';
delete from public.cpl_memory where author = 'SkyTystie (S705)';
