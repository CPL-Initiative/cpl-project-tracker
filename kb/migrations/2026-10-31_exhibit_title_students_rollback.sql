-- Rollback for 2026-10-31_exhibit_title_students.sql: the Exhibits tab is its only caller, and it reads
-- "Students could not be read" without it.
drop function if exists public.exhibit_title_students(text[], text[]);
