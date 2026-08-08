-- map_college_credit_summary — PUBLISHED per-college credit figures.
--
-- Schema of record for the table built live via the Supabase MCP, 2026-08-08
-- (SkyNaut, Session 128). RE-RUN AFTER EVERY map_college_cr_unit LOAD.
--
-- WHAT IT ANSWERS: how many units of credit students have ALREADY EARNED that
-- nobody has awarded, per college -- and how much of that is already articulated,
-- i.e. everything built and only a college's action missing.
--
-- ⚠ THE STUDENT COUNT COMES FROM THE STUDENT GRAIN, NOT FROM SUMMING
-- map_college_cr_unit.distinct_students. That column does not sum: a student
-- persists across catalog years and holds several CRs, so adding it up
-- double-counts people and would inflate the suppression denominator -- making
-- thin colleges look publishable.
--
-- Suppression per docs/kb-notes/adr-student-detail-aggregate-disclosure-control.md:
-- k=10 on distinct students; a suppressed college nulls EVERY credit measure,
-- because a 4-student college publishing its credit total discloses those four.
-- Publishing the statewide total alongside is safe: 13 colleges are suppressed,
-- so there are 13 unknowns against one equation.
--
-- ⚠ NEVER RANK COLLEGES PUBLICLY.
drop table if exists public.map_college_credit_summary;

create table public.map_college_credit_summary as
with students as (
  select college_id, count(distinct student_key)::int as students
  from public.map_student_credit group by 1
),
credits as (
  select college_id,
    sum(sum_potential_credits)   filter (where cpl_status_plan = 'Needs Action')        as dormant_credits,
    sum(sum_articulated_credits) filter (where cpl_status_plan = 'Needs Action')        as articulated_waiting,
    sum(sum_potential_credits)   filter (where cpl_status_plan = 'Applied to CPL Plan') as applied_potential,
    sum(sum_applied_credits)     as applied_credits,
    sum(sum_transcribed_credits) as transcribed_credits
  from public.map_college_cr_unit group by 1
)
select
  s.college_id,
  s.students,
  (s.students < 10)                                                   as suppressed,
  case when s.students < 10 then null else c.dormant_credits     end  as dormant_credits,
  case when s.students < 10 then null else c.articulated_waiting end  as articulated_waiting,
  case when s.students < 10 then null else c.applied_credits     end  as applied_credits,
  case when s.students < 10 then null else c.transcribed_credits end  as transcribed_credits
from students s join credits c on c.college_id = s.college_id;

alter table public.map_college_credit_summary add primary key (college_id);

alter table public.map_college_credit_summary enable row level security;
create policy map_college_credit_summary_select on public.map_college_credit_summary
  for select to anon, authenticated
  using (is_allowed_reviewer() or team_pass_ok());

-- ── Measured 2026-08-08, colleges only (entity_kind = 'college') ────────────
--   1,052,531  units of potential credit at Needs Action
--      64,074  of those ALREADY ARTICULATED  <-- the number to act on
--     111,779  applied  ->  60,246 transcribed (54% -- the next gap)
--   111 entities, 13 suppressed, 98 published
--
-- Of credit already dispositioned: ~65% Applied, ~30% Not Applicable. The
-- backlog figure is a CEILING, not an award forecast -- ruling a recommendation
-- out is legitimate work, and any public framing must say so.
