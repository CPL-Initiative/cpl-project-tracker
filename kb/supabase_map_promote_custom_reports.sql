-- map_promote_custom_reports() — staging → live, gated, in ONE transaction.
--
-- WHY THIS EXISTS
-- ---------------
-- Sam, 2026-08-19: "This will run in the daily cron so just making sure I don't
-- have to do a staging to live approval every day."
--
-- So the human gate goes and the protections stay. Each one the human was
-- providing is replaced by something a machine does, and every check FAILS
-- CLOSED: a raised exception rolls the whole transaction back and live is
-- exactly as it was.
--
--   half-finished insert blanking a live tab
--     -> ONE TRANSACTION. Live is fully old or fully new, never partial.
--        Postgres DDL is transactional, so even the aggregate rebuilds roll back.
--
--   the RLS-restore trap — map_college_cr_unit takes the team phrase,
--   map_student_credit is REVIEWER-ONLY, and restoring the wrong one hands
--   537k student-grain rows to every phrase holder while looking normal
--     -> ELIMINATED BY CONSTRUCTION. This replaces table CONTENTS (delete +
--        insert), never the table. Policies, grants and indexes are never
--        dropped, so there is nothing to restore and nothing to get wrong.
--        The two aggregates DO drop/recreate, so they re-declare their own
--        policies inside their own functions, exactly as their .sql files did.
--
--   a bad pull silently overwriting good data
--     -> gates G1..G6 below, all measured against the LIVE table it is about
--        to replace, so "much smaller than what we already have" is caught.
--
--   the published headline moving without the unsuppressed half
--     -> both aggregates rebuild in the SAME transaction as the swap, so
--        published and unsuppressed can never disagree (the number policy).
--        map_cleanup_worklist rebuilds in the same transaction for the same
--        reason: the team must never be working a list that describes a
--        different day from the dashboard beside it.
--
-- WHAT BLOCKS AND WHAT ONLY WARNS
-- -------------------------------
-- Blocking is for data that would be WRONG OR UNSAFE: a truncated pull, a
-- broken surrogate key, a violated suppression property. Warning is for data
-- that is INCOMPLETE BUT HONEST — a course_type MAP has newly invented lands in
-- the goal2 'UNKNOWN' bucket, which exists precisely so it stays countable
-- rather than folded into a legitimate one. Blocking there would freeze every
-- figure in the system over one mis-bucketed cell, which is the worse failure.

-- ── The two aggregate rebuilds, as functions ───────────────────────────────
-- Bodies are VERBATIM from kb/supabase_map_college_goal2.sql and
-- kb/supabase_map_college_credit_summary.sql, which remain the schema of record
-- and the place the reasoning lives. They are functions now only so the
-- promotion can call them inside its transaction.

create or replace function public.rebuild_map_college_goal2()
returns void language plpgsql security definer set search_path = public as $$
begin
  drop table if exists public.map_college_goal2;
  create table public.map_college_goal2 as
  with classed as (
    select college_id, student_key,
      case
        when course_type in ('Course credit','Course credit (1)','Course credit (2)',
                             'Course credit (3)','Course credit (4)',
                             'Credit for Basic Military Service-Course')   then 'COURSE'
        when course_type in ('Area credit','Credit for Basic Military Service-Area')  then 'AREA'
        when course_type in ('Elective credit','Elective credit (1)',
                             'Credit for Basic Military Service-Elective') then 'ELECTIVE'
        when course_type = ''                                              then 'NONE'
        else 'UNKNOWN' end as dest
    from public.map_student_credit
  ),
  cells as (
    select college_id, dest,
           count(distinct student_key)::int as students,
           count(*)::int                    as rows_n
    from classed where dest <> 'NONE'
    group by 1,2
  ),
  flagged as (select *, (students < 10) as below_k from cells),
  complement_target as (
    select distinct on (college_id) college_id, dest
    from flagged
    where not below_k
      and college_id in (
        select college_id from flagged group by college_id
        having count(*) filter (where below_k) = 1
           and count(*) filter (where not below_k) > 0)
    order by college_id, students asc, dest asc
  )
  select f.college_id, f.dest,
    case when f.below_k or ct.dest is not null then null else f.students end as students,
    case when f.below_k or ct.dest is not null then null else f.rows_n  end as rows_n,
    (f.below_k or ct.dest is not null) as suppressed,
    case when f.below_k then 'below_k'
         when ct.dest is not null then 'complement'
         else null end as reason
  from flagged f
  left join complement_target ct
    on ct.college_id = f.college_id and ct.dest = f.dest;

  alter table public.map_college_goal2 add primary key (college_id, dest);
  comment on table public.map_college_goal2 is
    'PUBLISHED per-college Sprint goal 2 (COURSE vs AREA vs ELECTIVE), suppression '
    'already applied at write time. k=10 on DISTINCT STUDENTS; a suppressed cell '
    'nulls BOTH students and rows_n. Complementary suppression applied so a hidden '
    'cell is not recoverable by subtraction. Rebuilt nightly by '
    'map_promote_custom_reports(). NEVER rank colleges publicly.';
  alter table public.map_college_goal2 enable row level security;
  create policy map_college_goal2_select on public.map_college_goal2
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
  -- EXPLICIT GRANTS (2026-09-23). This body creates the table afresh on every
  -- run, and from 2026-10-30 Supabase stops granting the API roles on a NEW
  -- table in public. anon and authenticated read through the policy above;
  -- service_role reads it for the daily publishers. Nothing writes here but
  -- this function. Guarded by tests/supabase_table_grants_test.py.
  grant select on public.map_college_goal2 to anon, authenticated, service_role;
end $$;

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

-- ── The promotion ─────────────────────────────────────────────────────────

create or replace function public.map_promote_custom_reports()
returns jsonb language plpgsql security definer
  set search_path = public
  -- The whole promotion is one transaction over ~800k rows plus two aggregate
  -- rebuilds; it does not fit in a 60s default. Set on the FUNCTION so it holds
  -- whatever the caller's role default is — the runner reaches this through
  -- PostgREST, which inherits the role setting, not the client's patience.
  set statement_timeout = '900s'
as $$
declare
  s_cr    bigint; s_st   bigint; s_stud bigint;
  l_cr    bigint; l_st   bigint; l_stud bigint;
  s_coll  bigint; l_coll bigint;
  sk_min  int;    sk_max int;    sk_null bigint;
  s_title bigint;
  bad     bigint; unknown_dest bigint; ungated int;
  warnings text[] := '{}';
begin
  select count(*) into s_cr   from stg_map_college_cr_unit;
  select count(*) into s_st   from stg_map_student_credit;
  select count(*) into l_cr   from map_college_cr_unit;
  select count(*) into l_st   from map_student_credit;
  select count(distinct student_key) into s_stud from stg_map_student_credit;
  select count(distinct student_key) into l_stud from map_student_credit;
  select count(distinct college_id) into s_coll from stg_map_student_credit;
  select count(distinct college_id) into l_coll from map_student_credit;

  -- G1 · staging is populated at all. An empty staging table replacing a live
  -- one is the single worst outcome available here.
  if s_cr = 0 or s_st = 0 then
    raise exception 'G1 staging is empty (cr_unit=%, student=%) — refusing to promote', s_cr, s_st;
  end if;

  -- G2/G3 · the pull is not truncated. A partial insert leaves staging short,
  -- and short-but-plausible is exactly what a row count catches and eyeballing
  -- does not. 10% is deliberately loose: the legitimate movement so far is
  -- upward (+3.07%, +10.02%), and a real drop that large deserves a human.
  if s_cr < l_cr * 0.90 then
    raise exception 'G2 cr_unit staging % is >10%% below live % — refusing to promote', s_cr, l_cr;
  end if;
  if s_st < l_st * 0.90 then
    raise exception 'G3 student staging % is >10%% below live % — refusing to promote', s_st, l_st;
  end if;

  -- G4 · the student population did not collapse. Row count and student count
  -- can move independently, so both are checked.
  if s_stud < l_stud * 0.90 then
    raise exception 'G4 distinct students % is >10%% below live % — refusing to promote', s_stud, l_stud;
  end if;

  -- G5 · THE PRIVACY TRIPWIRE, from docs/map_student_credit_reload.md. The
  -- surrogate must be dense 1..N with no nulls. A max in the millions means a
  -- MAP identifier reached the database instead of a counting surrogate.
  select min(student_key), max(student_key), count(*) filter (where student_key is null)
    into sk_min, sk_max, sk_null from stg_map_student_credit;
  if sk_null > 0 or sk_min <> 1 or sk_max <> s_stud then
    raise exception 'G5 surrogate key is not dense 1..N (min=%, max=%, distinct=%, nulls=%) — refusing to promote',
      sk_min, sk_max, s_stud, sk_null;
  end if;

  -- G6 · colleges did not vanish. One appearing is normal; several disappearing
  -- is a keying change, not a refresh.
  if s_coll < l_coll - 2 then
    raise exception 'G6 college count fell % -> % — refusing to promote', l_coll, s_coll;
  end if;

  -- ── Swap CONTENTS, never the table. Policies and grants are untouched. ──
  -- TRUNCATE, not DELETE: it is fully transactional in Postgres (it rolls back
  -- with everything else) and does not write ~800k dead tuples, which is what
  -- pushed the first attempt past a minute. It takes a stronger lock, so
  -- readers block for the length of the transaction rather than seeing the old
  -- snapshot throughout — acceptable because the run is nightly and short, and
  -- because a reader blocking briefly is better than a reader served a table
  -- mid-rewrite.
  truncate map_college_cr_unit;
  insert into map_college_cr_unit (
    college_id, source_code, exhibit_id, credit_rec, college_course,
    cpl_status_plan, catalog_year, course_type, distinct_students,
    sum_potential_credits, sum_articulated_credits, sum_applied_credits,
    sum_transcribed_credits)
  select college_id, source_code, exhibit_id, credit_rec, college_course,
    cpl_status_plan, catalog_year, course_type, distinct_students,
    sum_potential_credits, sum_articulated_credits, sum_applied_credits,
    sum_transcribed_credits
  from stg_map_college_cr_unit;

  truncate map_student_credit;
  insert into map_student_credit (
    source_row_id, student_key, college_id, exhibit_id, course_type, catalog_year,
    credit_rec, cpl_status_plan, status, cpl_plan_status, potential_credits,
    credits_in_review, applied_credits, transcribed_credits, articulated_credits,
    military_credits, non_military_credits, apprenticeship_credits)
  select source_row_id, student_key, college_id, exhibit_id, course_type, catalog_year,
    credit_rec, cpl_status_plan, status, cpl_plan_status, potential_credits,
    credits_in_review, applied_credits, transcribed_credits, articulated_credits,
    military_credits, non_military_credits, apprenticeship_credits
  from stg_map_student_credit;

  -- ── ACE exhibit titles: enrichment, so a SKIP not a BLOCK ────────────────
  -- What MOS-42A-001 actually is. Swapped only when staging has rows: an empty
  -- title pull is a bad parse or a renamed upstream column, and replacing live
  -- titles with nothing would turn that into a silent data loss. Losing today's
  -- titles is recoverable; a titleless guidance list that looks complete is not.
  select count(*) into s_title from stg_map_ace_exhibit_titles;
  if s_title > 0 then
    truncate map_ace_exhibit_titles;
    insert into map_ace_exhibit_titles (exhibit_id, title)
    select exhibit_id, title from stg_map_ace_exhibit_titles;
  else
    warnings := warnings || 'no ACE exhibit titles in staging - live titles left untouched; the Cx guidance list will show blanks where a title is missing'::text;
  end if;

  -- ── Rebuild the published aggregates in the SAME transaction ─────────────
  perform rebuild_map_college_goal2();
  perform rebuild_map_college_credit_summary();
  -- The Customer Success clean-up list. Rebuilt here rather than on its own
  -- schedule so it can never describe a different day's data from the tables it
  -- is derived from — a worklist that disagrees with the dashboard costs more
  -- trust than one that is a few hours old.
  perform rebuild_map_cleanup_worklist();
  -- The follow-up detail behind clean-up priority 2, at the grain a college can
  -- search on. Same transaction, same reason: a follow-up list that describes a
  -- different day from the worklist above it is worse than no list.
  perform rebuild_map_transcribed_gap();
  -- The Credit-by-Exam guidance list. Depends on BOTH the swap above (for the
  -- exhibit titles) and map_college_cr_unit (for what peers named), so it must
  -- rebuild after both and inside the same transaction.
  perform rebuild_map_cx_exhibit_guidance();

  -- G7 · THE SUPPRESSION PROPERTY. Blocking, and the most important gate here:
  -- one hidden cell alongside a visible sibling is recoverable by subtraction,
  -- so this is a disclosure, not an inconvenience. Tests the PROPERTY, not the
  -- flag — checking `suppressed = true` would pass on a broken implementation.
  select count(*) into bad from (
    select college_id
    from map_college_goal2
    group by college_id
    having count(*) filter (where suppressed) = 1
       and count(*) filter (where not suppressed) > 0) x;
  if bad > 0 then
    raise exception 'G7 % college(s) have exactly one suppressed cell beside a visible sibling — the hidden cell is recoverable by subtraction. REFUSING to publish', bad;
  end if;

  -- G8 · a suppressed cell must carry no numbers at all.
  select count(*) into bad from map_college_goal2
   where suppressed and (students is not null or rows_n is not null);
  if bad > 0 then
    raise exception 'G8 % suppressed cell(s) still carry students/rows_n — REFUSING to publish', bad;
  end if;

  -- G9 · every team-facing table rebuilt above is DROP/CREATEd, so its policy is
  -- re-declared each night and a mistake would be SILENT: the table would simply
  -- be readable, and nothing about a readable table looks wrong. Checked as a
  -- LIST rather than one name, so adding a rebuild without gating it fails here
  -- instead of shipping quietly.
  select count(*) into ungated from (values
      ('map_cleanup_worklist'),('map_transcribed_gap')) t(name)
   where not exists (
     select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = t.name
        and p.qual = '(is_allowed_reviewer() OR team_pass_ok())');
  if ungated > 0 then
    raise exception 'G9 % rebuilt table(s) lost the team-phrase gate - REFUSING to publish', ungated;
  end if;

  -- WARN (never block) · a course_type MAP has newly invented. UNKNOWN exists
  -- so it stays countable; freezing every figure in the system over one
  -- mis-bucketed cell is the worse failure.
  select coalesce(sum(rows_n), 0) into unknown_dest
    from map_college_goal2 where dest = 'UNKNOWN';
  if unknown_dest > 0 then
    warnings := warnings || format('%s row(s) landed in goal2 dest=UNKNOWN — a new course_type value; extend the vocabulary in rebuild_map_college_goal2()', unknown_dest);
  end if;
  if s_cr < l_cr then
    warnings := warnings || format('cr_unit shrank %s -> %s; expected cause is the catalog-year roll-forward, confirm if large', l_cr, s_cr);
  end if;

  insert into map_data_loads (table_name, source_rows, loaded_rows, reconciled, note)
  values ('map_custom_report_promote', s_cr + s_st, s_cr + s_st, true,
          format('promoted cr_unit %s and student %s (%s students) from staging; aggregates, cleanup worklist and transcribed gap rebuilt',
                 s_cr, s_st, s_stud));

  return jsonb_build_object(
    'promoted', true,
    'cr_unit',  jsonb_build_object('was', l_cr,   'now', s_cr),
    'student',  jsonb_build_object('was', l_st,   'now', s_st),
    'students', jsonb_build_object('was', l_stud, 'now', s_stud),
    'cleanup_items', (select count(*) from map_cleanup_worklist),
    'transcribed_gap_rows', (select count(*) from map_transcribed_gap),
    'warnings', to_jsonb(warnings));
end $$;

revoke all on function public.map_promote_custom_reports()          from public, anon, authenticated;
revoke all on function public.rebuild_map_college_goal2()           from public, anon, authenticated;
revoke all on function public.rebuild_map_college_credit_summary()  from public, anon, authenticated;
