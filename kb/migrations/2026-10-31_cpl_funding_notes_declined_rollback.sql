-- Rollback for 2026-10-31_cpl_funding_notes_declined.sql. A row that holds only a decline has no note
-- to keep, so it goes; every other row keeps its note. Read the declines out first if they matter:
--   select college, declined_at, declined_by from public.cpl_funding_notes where declined_at is not null;
delete from public.cpl_funding_notes where note is null;
alter table public.cpl_funding_notes drop constraint if exists cpl_funding_notes_holds_something;
alter table public.cpl_funding_notes drop constraint if exists cpl_funding_notes_note_check;
alter table public.cpl_funding_notes add constraint cpl_funding_notes_note_check
  check (char_length(note) between 1 and 4000);
alter table public.cpl_funding_notes alter column note set not null;
alter table public.cpl_funding_notes drop column if exists declined_by;
alter table public.cpl_funding_notes drop column if exists declined_at;
