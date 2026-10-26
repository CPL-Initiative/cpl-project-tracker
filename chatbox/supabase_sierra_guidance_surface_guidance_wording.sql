-- S491 (SkySalmonberry), 2026-10-26: the Sierra Training tab's Suggest wording calls cpl-chat as the
-- `guidance-wording` drafting caller (Sam, Open Asks Sheet 132 card 1, "build"). The surface constraint
-- mirrors cpl-chat's KNOWN_SURFACES (tests/sierra_surface.test.js), so it allows the new name too.
-- Widening only: every row that passed the old constraint passes this one (all 26 rows read 17:20Z carry
-- null, my-college, or none). Rollback: the same statement without 'guidance-wording'.
alter table public.sierra_guidance drop constraint if exists sierra_guidance_surface_ck;
alter table public.sierra_guidance add constraint sierra_guidance_surface_ck check (surface is null or surface in (
  'my-college', 'cobi-assistant', 'public', 'fact-sheet', 'memory-autogen', 'memory-briefing',
  'gr-analysis', 'skyview-ask', 'guidance-wording'
));
select pg_get_constraintdef(oid) from pg_constraint where conname = 'sierra_guidance_surface_ck';
