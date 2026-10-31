-- ⚠️ NARROWED 2026-08-28 (Sam): curating funding requires a magic-link
-- reviewer, NOT the team phrase. Live policies were altered to match; this
-- file is the SQL of record and must state the same gate.
-- ─────────────────────────────────────────────────────────────────────────
-- cpl_funding_notes — CO Monitor's per-college notes on the Implementation
-- Funding tab (2026-07-06, migration cpl_funding_notes).
--
-- Internal working commentary ("met with college 6/15; coordinator hire in
-- progress") attached to a college's drill-in row. The dashboard is PUBLIC,
-- and candid monitor commentary about a college is not — so RLS gates BOTH
-- read and write to reviewer/team-phrase (the map_college_contacts posture,
-- not the anon-read overlay posture). Anonymous visitors get zero rows; a
-- phrase-holder sees the notes read-only; team-editing-on shows the editable
-- textarea + Save in the drill-in. Empty note = the row is deleted. The tab
-- re-fetches after every write (#598 — the re-read is the confirmation).
--
-- If the team later decides these notes should be public status lines, it's
-- a one-policy change (cfn_select → using(true)) — the UI already renders
-- whatever it can read.
--
-- Applied live via the Supabase MCP; this file is the schema of record.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.cpl_funding_notes (
  college    text primary key,
  note       text not null check (char_length(note) between 1 and 4000),
  updated_by text,
  updated_at timestamptz not null default now()
);

create or replace function public.cfn_touch() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists cfn_touch on public.cpl_funding_notes;
create trigger cfn_touch before insert or update on public.cpl_funding_notes
  for each row execute function public.cfn_touch();

alter table public.cpl_funding_notes enable row level security;

drop policy if exists cfn_select on public.cpl_funding_notes;
create policy cfn_select on public.cpl_funding_notes for select
  to anon, authenticated
  using (is_allowed_reviewer());

drop policy if exists cfn_insert on public.cpl_funding_notes;
create policy cfn_insert on public.cpl_funding_notes for insert
  to anon, authenticated
  with check (is_allowed_reviewer());

drop policy if exists cfn_update on public.cpl_funding_notes;
create policy cfn_update on public.cpl_funding_notes for update
  to anon, authenticated
  using (is_allowed_reviewer())
  with check (is_allowed_reviewer());

drop policy if exists cfn_delete on public.cpl_funding_notes;
create policy cfn_delete on public.cpl_funding_notes for delete
  to anon, authenticated
  using (is_allowed_reviewer());

-- Declined participation (2026-10-31): declined_at and declined_by ride this row, the note may be
-- null while a decline stands, and a row holds one or both. Applied as
-- kb/migrations/2026-10-31_cpl_funding_notes_declined.sql (rollback beside it).
alter table public.cpl_funding_notes add column if not exists declined_at timestamptz;
alter table public.cpl_funding_notes add column if not exists declined_by text
  check (declined_by is null or char_length(declined_by) <= 160);
alter table public.cpl_funding_notes alter column note drop not null;
alter table public.cpl_funding_notes drop constraint if exists cpl_funding_notes_note_check;
alter table public.cpl_funding_notes add constraint cpl_funding_notes_note_check
  check (note is null or char_length(note) between 1 and 4000);
alter table public.cpl_funding_notes drop constraint if exists cpl_funding_notes_holds_something;
alter table public.cpl_funding_notes add constraint cpl_funding_notes_holds_something
  check (note is not null or declined_at is not null);
