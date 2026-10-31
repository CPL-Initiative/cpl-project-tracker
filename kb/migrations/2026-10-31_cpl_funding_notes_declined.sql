-- cpl_funding_notes: a college's declined participation, beside the CO Monitor's note
-- (SkyHuckleberry, 2026-10-31).
--
-- Sam, 2026-10-31, at the funding tab's Nudge: "a few may want to refuse participation, in which
-- case we need to be able to note that on their college row and exclude them from nudges (or gray
-- them out with an option to override and nudge anyway)."
--
-- The mark lives on the notes row because its audience and writer are the notes': a signed-in
-- reviewer reads and writes it (is_allowed_reviewer(), the table's existing RLS), and nothing public
-- reads it. A row now holds a note, a decline, or both; the note may be empty while the decline
-- stands.
--
-- Governance: the table stays DR-09 in kb/governance_surface_map.json (same writer, same audience,
-- one more field).
--
-- Apply by pointing kb/migrations/.apply here, or through the Supabase MCP apply_migration:
--   file=kb/migrations/2026-10-31_cpl_funding_notes_declined.sql
--   name=cpl_funding_notes_declined
-- Rollback: kb/migrations/2026-10-31_cpl_funding_notes_declined_rollback.sql.

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
