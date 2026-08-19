-- Staging tables for the MAP Custom Report load (session 171, SkyLoad).
--
-- WHY STAGING AND NOT A DIRECT WRITE
-- ----------------------------------
-- `map_college_cr_unit` and `map_student_credit` are reviewer-gated, feed the
-- 🎓 Course Credit tab, the College Action page and both published aggregates,
-- and `map_student_credit` is 537,908 rows at STUDENT GRAIN. A loader that
-- replaced them in place would put a destructive step on a runner, where a
-- half-finished insert leaves a live tab blank.
--
-- So the runner only ever fills these staging tables — nothing reads them — and
-- the swap is a separate, gated SQL step run by a human or a session through the
-- MCP. Same separation `docs/map_student_credit_reload.md` established: nothing
-- live is touched until the counts have been looked at.
--
-- Staging carries no RLS and no policies BY DESIGN: with RLS off and no grants,
-- PostgREST exposes nothing to `anon` or `authenticated`, and only the service
-- key (runner) and the SQL editor can see them. Revoking is belt-and-braces.

-- ── A · the by-catalog-year articulation grain ──────────────────────────────
-- Exactly the 13 columns of map_college_cr_unit, same order, same types. This
-- view IS Dataset A of docs/map_dataset_sql_for_malone.md coming back.
drop table if exists public.stg_map_college_cr_unit;
create table public.stg_map_college_cr_unit (
  college_id              integer,
  source_code             text,
  exhibit_id              text,
  credit_rec              text,
  college_course          text,
  cpl_status_plan         text,
  catalog_year            text,
  course_type             text,
  distinct_students       integer,
  sum_potential_credits   numeric,
  sum_articulated_credits numeric,
  sum_applied_credits     numeric,
  sum_transcribed_credits numeric
);

-- ── B · the student × credit-recommendation grain ──────────────────────────
-- The 16 columns map_student_credit already holds, PLUS the two dimensions
-- nothing we hold carries. Sam's definitions, 2026-08-19:
--
--   status           — the ARTICULATION APPROVAL STAGE the row sits at
--                      (e.g. "Initiator" — a MAP approval-cascade role).
--   cpl_status_plan  — the action taken on the CR ("Needs Action",
--                      "Not Applicable"). The disposition. Already held.
--   cpl_plan_status  — NOT a status: the LIFECYCLE CHECKS, and there can be
--                      MULTIPLE, pipe-delimited ("CPL Docs |Transcribed").
--
-- cpl_plan_status is stored VERBATIM, pipes and all. Splitting it here would
-- decide its grain before anyone has measured it; a checklist that can hold
-- several values is not a column you filter on until it has been given fields.
drop table if exists public.stg_map_student_credit;
create table public.stg_map_student_credit (
  source_row_id          bigint,
  student_key            integer,
  college_id             integer,
  exhibit_id             text,
  course_type            text,
  catalog_year           text,
  credit_rec             text,
  cpl_status_plan        text,
  status                 text,
  cpl_plan_status        text,
  potential_credits      numeric,
  credits_in_review      numeric,
  applied_credits        numeric,
  transcribed_credits    numeric,
  articulated_credits    numeric,
  military_credits       numeric,
  non_military_credits   numeric,
  apprenticeship_credits numeric
);

-- ── C · the salt-rotation detector ─────────────────────────────────────────
-- Pedro Campos (ITPI), via Sam 2026-08-19: the salt does NOT rotate. This
-- exists to catch that changing, not to answer it — the failure is SILENT by
-- construction (a rotated salt raises no error; distinct-student counts simply
-- stop being comparable across pulls, and nothing anywhere says so).
--
-- It is a MIN-HASH SKETCH, not a student map, and that is deliberate. The spec
-- we sent MAP says "we only ever count distinct students — we never look one
-- up", so holding a hash per student would be holding more than the stated
-- need. The N lexicographically-smallest hashes of a pull are a uniform sample
-- of its key set, so their overlap with the previous pull's estimates the
-- Jaccard similarity: a stable salt gives near-1, a rotated salt gives ~0.
--
-- Nothing joins to this and no student row references it.
create table if not exists public.map_student_key_sketch (
  pull_date   date not null,
  sample_hash text not null,
  primary key (pull_date, sample_hash)
);

-- Staging holds student-grain rows between load and swap, so close the door on
-- the API roles explicitly rather than relying on the absence of a grant.
revoke all on public.stg_map_college_cr_unit  from anon, authenticated;
revoke all on public.stg_map_student_credit   from anon, authenticated;
revoke all on public.map_student_key_sketch   from anon, authenticated;
