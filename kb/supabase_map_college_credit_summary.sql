-- map_college_credit_summary — PUBLISHED per-college credit figures.
--
-- Schema of record for the table built live via the Supabase MCP, 2026-08-08
-- (SkyNaut, Session 128). The nightly promotion (kb/supabase_map_promote_custom_reports.sql)
-- rebuilds it through rebuild_map_college_credit_summary(), whose body below is
-- the same text. 2026-09-30: each figure suppresses on its own group, the
-- in-plan figures and the real statewide totals (map_college_credit_statewide)
-- are added (sheet 2026-09-30-sierra-credit-source items 1, 2 and 6).
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
create or replace function public.rebuild_map_college_credit_summary()
returns void language plpgsql security definer set search_path = public as $$
declare
  bad bigint;
begin
  drop table if exists public.map_college_credit_summary;
  create table public.map_college_credit_summary as
  -- ⚠ EACH FIGURE SUPPRESSES ON THE STUDENTS BEHIND IT (2026-09-30). Until then
  -- the only test was the college's total headcount, so a college with 400 CPL
  -- students and 1 student holding transcribed credit published that one
  -- student's transcribed total. Measured that day: 8 colleges published a
  -- transcribed figure from fewer than 10 students (3 from one), 3 an applied
  -- figure. adr-student-detail-aggregate-disclosure-control, amendment
  -- 2026-08-11: suppression is a property of the group behind each figure.
  with pop as (
    select college_id,
      count(distinct student_key)::int as students,
      count(distinct student_key) filter (where cpl_status_plan = 'Needs Action')::int as n_dormant,
      count(distinct student_key) filter (where cpl_status_plan = 'Needs Action'
                                            and articulated_credits > 0)::int as n_waiting,
      count(distinct student_key) filter (where coalesce(applied_credits, 0) > 0)::int as n_applied,
      count(distinct student_key) filter (where cpl_status_plan = 'Applied to CPL Plan'
                                            and coalesce(applied_credits, 0) > 0)::int as n_in_plan,
      count(distinct student_key) filter (where coalesce(transcribed_credits, 0) > 0)::int as n_transcribed,
      -- Applied on the CPL plan, and transcribed, from the STUDENT view (sheet
      -- 2026-09-30-sierra-credit-source item 2): the same rows the breakdown
      -- tables count, so a breakdown adds up to the total quoted beside it.
      coalesce(sum(applied_credits) filter (where cpl_status_plan = 'Applied to CPL Plan'), 0) as applied_in_plan,
      coalesce(sum(transcribed_credits), 0) as transcribed_student_view
    from public.map_student_credit group by 1
  ),
  credits as (
    -- ⚠ applied_credits is MAP's Applied Credits column over EVERY status, and
    -- MAP repeats the articulated credit in it on each Needs Action row, so it
    -- carries articulated_waiting inside it. Kept as the labeled second figure;
    -- applied_in_plan is the one to lead with (Sam, 2026-08-19: publish both
    -- and name the gap). A true zero is 0, never NULL: NULL means withheld.
    select college_id,
      coalesce(sum(sum_potential_credits)   filter (where cpl_status_plan = 'Needs Action'), 0) as dormant_credits,
      coalesce(sum(sum_articulated_credits) filter (where cpl_status_plan = 'Needs Action'), 0) as articulated_waiting,
      coalesce(sum(sum_applied_credits), 0)     as applied_credits,
      coalesce(sum(sum_transcribed_credits), 0) as transcribed_credits
    from public.map_college_cr_unit group by 1
  ),
  flags as (
    -- Thin = 1..9 students behind the figure, or units no student row accounts for.
    select p.*, c.dormant_credits, c.articulated_waiting, c.applied_credits, c.transcribed_credits,
      (p.n_dormant between 1 and 9 or (p.n_dormant = 0 and c.dormant_credits <> 0))         as t_dormant,
      (p.n_waiting between 1 and 9 or (p.n_waiting = 0 and c.articulated_waiting <> 0))     as t_waiting,
      (p.n_in_plan between 1 and 9)                                                         as t_in_plan,
      (p.n_applied between 1 and 9 or (p.n_applied = 0 and c.applied_credits <> 0))         as t_applied_own,
      (p.n_transcribed between 1 and 9
         or (p.n_transcribed = 0 and (c.transcribed_credits <> 0 or p.transcribed_student_view <> 0))) as t_transcribed
    from pop p join credits c on c.college_id = p.college_id
  ),
  final as (
    -- ⚠ THE COMPLEMENT. applied_credits = applied in plan + articulated_waiting
    -- + in process, to within the gap between MAP's two views, so publishing two
    -- of the three hands over the third by subtraction. When exactly one of in
    -- plan / waiting is withheld, applied_credits goes with it. When both are,
    -- applied_credits reveals only their sum, over its own 10 or more students.
    select *, (t_applied_own or (t_in_plan <> t_waiting)) as t_applied
    from flags
  )
  select college_id, students, (students < 10) as suppressed,
    case when students < 10 or t_dormant     then null else dormant_credits          end as dormant_credits,
    case when students < 10 or t_waiting     then null else articulated_waiting      end as articulated_waiting,
    case when students < 10 or t_applied     then null else applied_credits          end as applied_credits,
    case when students < 10 or t_transcribed then null else transcribed_credits      end as transcribed_credits,
    case when students < 10 or t_in_plan     then null else applied_in_plan          end as applied_in_plan,
    case when students < 10 or t_transcribed then null else transcribed_student_view end as transcribed_student_view,
    -- The figures withheld on this row, by name, so a reader can say "fewer than
    -- 10 students" instead of guessing why a value is missing.
    array_remove(array[
      case when students < 10 or t_dormant     then 'dormant_credits' end,
      case when students < 10 or t_waiting     then 'articulated_waiting' end,
      case when students < 10 or t_applied     then 'applied_credits' end,
      case when students < 10 or t_transcribed then 'transcribed_credits' end,
      case when students < 10 or t_in_plan     then 'applied_in_plan' end,
      case when students < 10 or t_transcribed then 'transcribed_student_view' end
    ], null)::text[] as withheld
  from final;

  alter table public.map_college_credit_summary add primary key (college_id);
  alter table public.map_college_credit_summary enable row level security;
  create policy map_college_credit_summary_select on public.map_college_credit_summary
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
  -- EXPLICIT GRANTS (2026-09-23). This body creates the table afresh on every
  -- run, and from 2026-10-30 Supabase stops granting the API roles on a NEW
  -- table in public. anon and authenticated read through the policy above;
  -- service_role reads it for the daily publishers. Nothing writes here but
  -- this function. Guarded by tests/supabase_table_grants_test.py.
  grant select on public.map_college_credit_summary to anon, authenticated, service_role;

  -- ⚠ THE PROPERTY, RE-MEASURED FROM THE STUDENT GRAIN, NOT READ OFF THE FLAGS.
  -- Raising here rolls back the whole nightly promotion that called this, the
  -- same fail-closed posture as G7: a published figure backed by 1..9 students,
  -- a withheld figure still carrying a number, a published row that withholds
  -- exactly one of in plan / waiting beside a published applied figure, or a
  -- NULL the withheld list does not name.
  select count(*) into bad
  from public.map_college_credit_summary s
  join (select college_id,
          count(distinct student_key) filter (where cpl_status_plan = 'Needs Action') nd,
          count(distinct student_key) filter (where cpl_status_plan = 'Needs Action' and articulated_credits > 0) nw,
          count(distinct student_key) filter (where coalesce(applied_credits, 0) > 0) na,
          count(distinct student_key) filter (where cpl_status_plan = 'Applied to CPL Plan'
                                                and coalesce(applied_credits, 0) > 0) np,
          count(distinct student_key) filter (where coalesce(transcribed_credits, 0) > 0) nt
        from public.map_student_credit group by 1) p on p.college_id = s.college_id
  where (s.dormant_credits          is not null and p.nd between 1 and 9)
     or (s.articulated_waiting      is not null and p.nw between 1 and 9)
     or (s.applied_credits          is not null and p.na between 1 and 9)
     or (s.applied_in_plan          is not null and p.np between 1 and 9)
     or (s.transcribed_credits      is not null and p.nt between 1 and 9)
     or (s.transcribed_student_view is not null and p.nt between 1 and 9)
     or (s.applied_credits is not null and ((s.applied_in_plan is null) <> (s.articulated_waiting is null)))
     or (s.dormant_credits          is null) <> ('dormant_credits'          = any(s.withheld))
     or (s.articulated_waiting      is null) <> ('articulated_waiting'      = any(s.withheld))
     or (s.applied_credits          is null) <> ('applied_credits'          = any(s.withheld))
     or (s.transcribed_credits      is null) <> ('transcribed_credits'      = any(s.withheld))
     or (s.applied_in_plan          is null) <> ('applied_in_plan'          = any(s.withheld))
     or (s.transcribed_student_view is null) <> ('transcribed_student_view' = any(s.withheld));
  if bad > 0 then
    raise exception 'credit summary: % row(s) publish a figure backed by fewer than 10 students, or leave one recoverable by subtraction. REFUSING to publish', bad;
  end if;

  -- ── REAL statewide totals (Sam, 2026-09-30: "I want Sierra to total for
  -- everyone using real numbers but when the totals (at any level) are below
  -- 10, to show \"<10\"") ──────────────────────────────────────────────────
  -- Summed over EVERY college, withheld ones included, so the total is the true
  -- one; readers used to add up only the published cells, which runs low. Safe
  -- because the residual (this total minus the published colleges) is spread
  -- across two or more withheld colleges: where exactly ONE college withholds a
  -- figure, this total would hand that college's figure over by subtraction,
  -- so the total goes NULL for that figure instead. Scoped to entity_kind =
  -- 'college', the number policy's scope (lanes/disposition-grain-student-detail).
  drop table if exists public.map_college_credit_statewide;
  create table public.map_college_credit_statewide as
  with scope as (
    select college_id from public.map_colleges where entity_kind = 'college'
  ),
  cr as (
    select
      coalesce(sum(sum_potential_credits)   filter (where cpl_status_plan = 'Needs Action'), 0) as dormant_credits,
      coalesce(sum(sum_articulated_credits) filter (where cpl_status_plan = 'Needs Action'), 0) as articulated_waiting,
      coalesce(sum(sum_applied_credits), 0)     as applied_credits,
      coalesce(sum(sum_transcribed_credits), 0) as transcribed_credits
    from public.map_college_cr_unit where college_id in (select college_id from scope)
  ),
  st as (
    select count(distinct student_key)::int as students,
      coalesce(sum(applied_credits) filter (where cpl_status_plan = 'Applied to CPL Plan'), 0) as applied_in_plan,
      coalesce(sum(transcribed_credits), 0) as transcribed_student_view
    from public.map_student_credit where college_id in (select college_id from scope)
  ),
  held as (
    select count(*)::int as colleges,
      count(*) filter (where 'dormant_credits'          = any(withheld))::int as h_dormant,
      count(*) filter (where 'articulated_waiting'      = any(withheld))::int as h_waiting,
      count(*) filter (where 'applied_credits'          = any(withheld))::int as h_applied,
      count(*) filter (where 'transcribed_credits'      = any(withheld))::int as h_transcribed,
      count(*) filter (where 'applied_in_plan'          = any(withheld))::int as h_in_plan,
      count(*) filter (where 'transcribed_student_view' = any(withheld))::int as h_transcribed_sv
    from public.map_college_credit_summary where college_id in (select college_id from scope)
  ),
  -- The students behind the residual (the withheld colleges together): a
  -- residual from fewer than 10 students is itself a small cell.
  res as (
    select
      count(distinct sc.student_key) filter (where sc.cpl_status_plan = 'Needs Action'
        and 'dormant_credits' = any(sm.withheld))::int as r_dormant,
      count(distinct sc.student_key) filter (where sc.cpl_status_plan = 'Needs Action' and sc.articulated_credits > 0
        and 'articulated_waiting' = any(sm.withheld))::int as r_waiting,
      count(distinct sc.student_key) filter (where coalesce(sc.applied_credits, 0) > 0
        and 'applied_credits' = any(sm.withheld))::int as r_applied,
      count(distinct sc.student_key) filter (where coalesce(sc.transcribed_credits, 0) > 0
        and 'transcribed_credits' = any(sm.withheld))::int as r_transcribed,
      count(distinct sc.student_key) filter (where sc.cpl_status_plan = 'Applied to CPL Plan'
        and coalesce(sc.applied_credits, 0) > 0 and 'applied_in_plan' = any(sm.withheld))::int as r_in_plan
    from public.map_student_credit sc
    join public.map_college_credit_summary sm on sm.college_id = sc.college_id
    where sc.college_id in (select college_id from scope)
  )
  select 'college'::text as scope, h.colleges, s.students,
    case when h.h_dormant        = 1 or r.r_dormant     between 1 and 9 then null else c.dormant_credits          end as dormant_credits,
    case when h.h_waiting        = 1 or r.r_waiting     between 1 and 9 then null else c.articulated_waiting      end as articulated_waiting,
    case when h.h_applied        = 1 or r.r_applied     between 1 and 9 then null else c.applied_credits          end as applied_credits,
    case when h.h_transcribed    = 1 or r.r_transcribed between 1 and 9 then null else c.transcribed_credits      end as transcribed_credits,
    case when h.h_in_plan        = 1 or r.r_in_plan     between 1 and 9 then null else s.applied_in_plan          end as applied_in_plan,
    case when h.h_transcribed_sv = 1 or r.r_transcribed between 1 and 9 then null else s.transcribed_student_view end as transcribed_student_view,
    -- How many colleges' own figure shows <10 inside each total, so a reader can
    -- say the total is real and includes colleges not shown one by one.
    jsonb_build_object(
      'dormant_credits', h.h_dormant, 'articulated_waiting', h.h_waiting,
      'applied_credits', h.h_applied, 'transcribed_credits', h.h_transcribed,
      'applied_in_plan', h.h_in_plan, 'transcribed_student_view', h.h_transcribed_sv) as colleges_withheld
  from cr c cross join st s cross join held h cross join res r;

  alter table public.map_college_credit_statewide add primary key (scope);
  alter table public.map_college_credit_statewide enable row level security;
  create policy map_college_credit_statewide_select on public.map_college_credit_statewide
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
  grant select on public.map_college_credit_statewide to anon, authenticated, service_role;
end $$;

-- Run once when this file is applied; the nightly promotion calls it after that.
select public.rebuild_map_college_credit_summary();
revoke all on function public.rebuild_map_college_credit_summary() from public, anon, authenticated;

-- ── Measured 2026-09-30, the first build with per-figure suppression ─────────
--   113 rows, 14 suppressed whole. Of the 99 published: transcribed withheld at
--   8 (three had been one student), applied_in_plan at 13, applied_credits at
--   15 (3 on their own group, 12 as the complement of applied_in_plan or
--   articulated_waiting), articulated_waiting and dormant_credits at 2 each.
--   Statewide (entity_kind = 'college', 108 colleges): every total publishes;
--   the smallest residual is 19 students (transcribed, across 18 colleges).
--   Chaffey: applied_credits 19,405 = applied_in_plan (cr_unit) 18,199 +
--   articulated_waiting 1,206; applied_in_plan (student view) 18,066.

-- ── Measured 2026-08-08, colleges only (entity_kind = 'college') ────────────
--   1,052,531  units of potential credit at Needs Action
--      64,074  of those ALREADY ARTICULATED  <-- the number to act on
--     111,779  applied  ->  60,246 transcribed (54% -- the next gap)
--   111 entities, 13 suppressed, 98 published
--
-- Of credit already dispositioned: ~65% Applied, ~30% Not Applicable. The
-- backlog figure is a CEILING, not an award forecast -- ruling a recommendation
-- out is legitimate work, and any public framing must say so.
