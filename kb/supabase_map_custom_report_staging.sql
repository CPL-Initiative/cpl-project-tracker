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

-- ── D · clearing staging, server-side ──────────────────────────────────────
-- WHY THIS FUNCTION EXISTS (session 172, 2026-08-19)
--
-- The loader used to empty these two tables with a PostgREST mass DELETE
-- (`?college_id=not.is.null`, then `?college_id=is.null`). On 2026-08-19 that
-- step FAILED for the first time against a FULL stg_map_student_credit: run 4
-- of the load workflow raised a bare `HTTP Error 500`, and the Postgres log for
-- that second says `canceling statement due to statement timeout`. Deleting
-- 591,820 rows writes 591,820 dead tuples and does not fit the role's default
-- timeout.
--
-- It failed at the step BEFORE the gated one, so no gate could have caught it,
-- and it would have failed EVERY night from the first full staging table on —
-- the earlier runs passed only because staging was still small.
--
-- map_promote_custom_reports() had ALREADY learned this for the live swap and
-- says so in its own comments: "TRUNCATE, not DELETE: ... does not write ~800k
-- dead tuples, which is what pushed the first attempt past a minute." The fix
-- never travelled the few lines up to the staging half.
--
-- TRUNCATE is O(1) here and takes an ACCESS EXCLUSIVE lock, which costs nothing:
-- nothing reads staging, by design.
--
-- Every staging table the loader fills must be named here. A staging table that
-- is filled but never cleared accumulates across runs, and because the promotion
-- reads staging wholesale that shows up as duplicates in LIVE, not in staging.
--
-- THE FUNCTION TAKES NO ARGUMENT, and that is the safety property. The loader
-- used to pass a table name and defend itself with an `assert` on the "stg_"
-- prefix — the live student-grain table was one bad string away from the one
-- destructive call in the pipeline. The two staging tables are written into the
-- body here, so there is no argument to get wrong. cpl_memory:
-- the-safest-version-of-a-dangerous-step-is-one-that-does-not-exist.
create or replace function public.map_clear_custom_report_staging()
returns jsonb language plpgsql security definer
  set search_path = public
  -- Instant in practice; the timeout is here so a lock wait fails fast and
  -- loudly rather than hanging the runner. Set on the FUNCTION because
  -- PostgREST inherits the role setting, not the client's patience.
  set statement_timeout = '120s'
as $$
declare was_cr bigint; was_st bigint;
begin
  select count(*) into was_cr from stg_map_college_cr_unit;
  select count(*) into was_st from stg_map_student_credit;
  truncate table stg_map_college_cr_unit, stg_map_student_credit,
                 stg_map_ace_exhibit_titles;
  return jsonb_build_object('cr_unit_was', was_cr, 'student_was', was_st);
end $$;

revoke all on function public.map_clear_custom_report_staging() from public, anon, authenticated;
