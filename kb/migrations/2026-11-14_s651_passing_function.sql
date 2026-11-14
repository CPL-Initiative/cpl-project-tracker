-- S651 (SkyDunlin's worker), 2026-11-14: the one migration for the passing-function changes
-- (d-one-rescore-for-three-rules-s649; p-degree-electives-fill-false-pass-s650). DRAFT, NOT APPLIED:
-- it is not listed in kb/migrations/.apply, and it waits on COBIx's review of the dry run on #3111
-- (kb/program_requirements_passing_dryrun/passing_s651.md).
--
-- What changes where. The server's passing function reads a row's flat checks (coverage, invented,
-- arithmetic). Two of the four changes move a row's checks, not the function, so they ride the one
-- rescore after this migration (a guarded UPDATE of checks.arithmetic with before-values, Rule 10 a2):
--   1. noncredit Total Hours: the scorer reads the total at every college (kb/_program_requirements_score.py
--      total_hours_printed, under PASSING_S651), so a row read as 'incomplete' may rescore to 'equal'.
--   4. the degree electives-fill guard: a degree's major total is never filled by electives
--      (program_total_fill), so a row passing on that fill rescores to 'unequal'.
-- One change is the function's, and it is this file:
--   3. the GE-pattern certificate rule (COBIx, #3229 comment 6869816372, accepted with three amendments):
--      a row checked against its GE pattern (checks.checked_against = 'ge_pattern') passes on the quoted
--      catalog words (checks.pattern_evidence = 'quoted'), since the state's file lists no courses for it.
--      No such row exists today; the branch is inert until a reviewed load writes one.
-- The own-list rule (sam-headline-counts-own-list-2026-11-13) is NOT here: what a pass against a college's
-- own course list checks is not written down, and no record exists for such a program.
--
-- The mirrors that move with it, in the same PR as the apply: kb/_program_requirements_score.py
-- counts_passing_on_tab (written, under PASSING_S651) and program_requirements.js machineFails (not yet).
-- Rollback: 2026-11-14_s651_passing_function_rollback.sql (the function as
-- chatbox/supabase_program_record_verdicts.sql defines it).
create or replace function public.program_record_machine_pass(c jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select case
    when coalesce(c->>'checked_against', '') = 'ge_pattern'
      then coalesce(c->>'pattern_evidence', '') = 'quoted'
    else coalesce(c->>'coverage', '') = 'true'
     and coalesce(c->>'invented', '') = 'true'
     and coalesce(c->>'arithmetic', '') in ('equal', 'unstated')
  end;
$$;
revoke all on function public.program_record_machine_pass(jsonb) from public, anon;
grant execute on function public.program_record_machine_pass(jsonb) to authenticated, service_role;
