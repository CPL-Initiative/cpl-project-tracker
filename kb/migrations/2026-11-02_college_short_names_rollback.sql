-- Rollback of kb/migrations/2026-11-02_college_short_names.sql (S545). Before running it, read the log
-- (select * from public.college_short_names_log order by changed_at) and carry any short changed since the seed back
-- into kb/_seed_college_short_names.py, with its prior short in EXTRA_ALIASES, or the change is lost with the table.
-- The committed kb/college_short_names.json and college_short_names.js keep working without the table: the daily
-- sync skips when it cannot read it and leaves both files as they are.
drop trigger if exists college_short_names_guard on public.college_short_names;
drop function if exists public.college_short_names_guard();
drop table if exists public.college_short_names_log;
drop table if exists public.college_short_names;
