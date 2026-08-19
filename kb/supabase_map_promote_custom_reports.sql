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
end $$;

create or replace function public.rebuild_map_college_credit_summary()
returns void language plpgsql security definer set search_path = public as $$
begin
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
  select s.college_id, s.students, (s.students < 10) as suppressed,
    case when s.students < 10 then null else c.dormant_credits     end as dormant_credits,
    case when s.students < 10 then null else c.articulated_waiting end as articulated_waiting,
    case when s.students < 10 then null else c.applied_credits     end as applied_credits,
    case when s.students < 10 then null else c.transcribed_credits end as transcribed_credits
  from students s join credits c on c.college_id = s.college_id;

  alter table public.map_college_credit_summary add primary key (college_id);
  alter table public.map_college_credit_summary enable row level security;
  create policy map_college_credit_summary_select on public.map_college_credit_summary
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
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

revoke all on function public.map_promote_custom_reports()          from anon, authenticated;
revoke all on function public.rebuild_map_college_goal2()           from anon, authenticated;
revoke all on function public.rebuild_map_college_credit_summary()  from anon, authenticated;
