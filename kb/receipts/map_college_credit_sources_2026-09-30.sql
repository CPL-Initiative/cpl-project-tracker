-- RECEIPT — items 4 and 5 of sheet 2026-09-30-sierra-credit-source: the
-- military / non-military split and the exhibits behind applied and transcribed
-- credit. 2026-09-30. Authority: Sam's verdicts "build" (items 4 and 5), his
-- item 6 ruling (real totals, "<10", no Governance gate), and his "Go ahead
-- with items 4 and 5" in session, 2026-09-30.
--
-- WHAT CHANGES LIVE, in this order:
--   A. kb/supabase_map_college_credit_sources.sql, whole: two nullable columns
--      (cpl_type_code on stg_map_ace_exhibit_titles and map_ace_exhibit_titles),
--      the new function rebuild_map_college_credit_sources(), one call of it,
--      which creates map_college_credit_bucket and map_college_exhibit_credit.
--   B. map_promote_custom_reports() re-created from its LIVE text with three
--      edits and nothing else (the live text differs from the repo copy in
--      comments and log strings only, and those stay as they are live):
--        1. the title swap carries cpl_type_code;
--        2. `perform rebuild_map_college_credit_sources();` after the summary;
--        3. G9 also checks the two new tables keep the team-phrase gate.
--
-- ── ROLLBACK ─────────────────────────────────────────────────────────────
-- B first (the promotion calls the new function, so it goes back before the
-- function is dropped), then A in reverse:
--   1. re-apply the BEFORE text below;
--   2. drop function public.rebuild_map_college_credit_sources();
--      drop table if exists public.map_college_credit_bucket, public.map_college_exhibit_credit;
--   3. alter table public.map_ace_exhibit_titles drop column if exists cpl_type_code;
--      alter table public.stg_map_ace_exhibit_titles drop column if exists cpl_type_code;
--      (only after the sync change is reverted too, or the nightly staging insert fails)
--
-- BEFORE — map_promote_custom_reports(), live, read 2026-09-30 ~16:25 UTC.
-- md5(pg_get_functiondef) = 73c14d785ab4a869f432bc0e37d2ab03, and the text
-- below hashes to the same value (checked before applying).
CREATE OR REPLACE FUNCTION public.map_promote_custom_reports()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
 SET statement_timeout TO '900s'
AS $function$
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

  if s_cr = 0 or s_st = 0 then
    raise exception 'G1 staging is empty (cr_unit=%, student=%) - refusing to promote', s_cr, s_st;
  end if;
  if s_cr < l_cr * 0.90 then
    raise exception 'G2 cr_unit staging % is >10%% below live % - refusing to promote', s_cr, l_cr;
  end if;
  if s_st < l_st * 0.90 then
    raise exception 'G3 student staging % is >10%% below live % - refusing to promote', s_st, l_st;
  end if;
  if s_stud < l_stud * 0.90 then
    raise exception 'G4 distinct students % is >10%% below live % - refusing to promote', s_stud, l_stud;
  end if;

  select min(student_key), max(student_key), count(*) filter (where student_key is null)
    into sk_min, sk_max, sk_null from stg_map_student_credit;
  if sk_null > 0 or sk_min <> 1 or sk_max <> s_stud then
    raise exception 'G5 surrogate key is not dense 1..N (min=%, max=%, distinct=%, nulls=%) - refusing to promote',
      sk_min, sk_max, s_stud, sk_null;
  end if;

  if s_coll < l_coll - 2 then
    raise exception 'G6 college count fell % -> % - refusing to promote', l_coll, s_coll;
  end if;

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

  select count(*) into s_title from stg_map_ace_exhibit_titles;
  if s_title > 0 then
    truncate map_ace_exhibit_titles;
    insert into map_ace_exhibit_titles (exhibit_id, title)
    select exhibit_id, title from stg_map_ace_exhibit_titles;
  else
    warnings := warnings || 'no ACE exhibit titles in staging - live titles left untouched; the Cx guidance list will show blanks where a title is missing'::text;
  end if;

  perform rebuild_map_college_goal2();
  perform rebuild_map_college_credit_summary();
  perform rebuild_map_cleanup_worklist();
  perform rebuild_map_transcribed_gap();
  perform rebuild_map_cx_exhibit_guidance();

  select count(*) into bad from (
    select college_id from map_college_goal2 group by college_id
    having count(*) filter (where suppressed) = 1
       and count(*) filter (where not suppressed) > 0) x;
  if bad > 0 then
    raise exception 'G7 % college(s) have exactly one suppressed cell beside a visible sibling - the hidden cell is recoverable by subtraction. REFUSING to publish', bad;
  end if;

  select count(*) into bad from map_college_goal2
   where suppressed and (students is not null or rows_n is not null);
  if bad > 0 then
    raise exception 'G8 % suppressed cell(s) still carry students/rows_n - REFUSING to publish', bad;
  end if;

  -- G9 · every team-facing table rebuilt above is DROP/CREATEd, so its policy is
  -- re-declared each night and a mistake would be SILENT - the table would simply
  -- be readable, and nothing about a readable table looks wrong.
  select count(*) into ungated from (values
      ('map_cleanup_worklist'),('map_transcribed_gap')) t(name)
   where not exists (
     select 1 from pg_policies p
      where p.schemaname = 'public' and p.tablename = t.name
        and p.qual = '(is_allowed_reviewer() OR team_pass_ok())');
  if ungated > 0 then
    raise exception 'G9 % rebuilt table(s) lost the team-phrase gate - REFUSING to publish', ungated;
  end if;

  select coalesce(sum(rows_n), 0) into unknown_dest
    from map_college_goal2 where dest = 'UNKNOWN';
  if unknown_dest > 0 then
    warnings := warnings || format('%s row(s) landed in goal2 dest=UNKNOWN - a new course_type value; extend the vocabulary in rebuild_map_college_goal2()', unknown_dest);
  end if;
  if s_cr < l_cr then
    warnings := warnings || format('cr_unit shrank %s -> %s; expected cause is the catalog-year roll-forward, confirm if large', l_cr, s_cr);
  end if;

  insert into map_data_loads (table_name, source_rows, loaded_rows, reconciled, note)
  values ('map_custom_report_promote', s_cr + s_st, s_cr + s_st, true,
          format('promoted cr_unit %s and student %s (%s students); aggregates, cleanup worklist and transcribed gap rebuilt',
                 s_cr, s_st, s_stud));

  return jsonb_build_object(
    'promoted', true,
    'cr_unit',  jsonb_build_object('was', l_cr,   'now', s_cr),
    'student',  jsonb_build_object('was', l_st,   'now', s_st),
    'students', jsonb_build_object('was', l_stud, 'now', s_stud),
    'cleanup_items', (select count(*) from map_cleanup_worklist),
    'transcribed_gap_rows', (select count(*) from map_transcribed_gap),
    'warnings', to_jsonb(warnings));
end $function$
;

-- ── AFTER (applied 2026-09-30 ~16:40 UTC, on Sam's "Go ahead with items 4 and 5") ──
-- A went in as two migrations: credit_sources_function_2026_09_30 (columns +
-- function) and credit_sources_first_build_2026_09_30 (one run). A first
-- single-migration attempt ran past two minutes and rolled back with nothing
-- committed (its last check scanned the student rows once per group); the
-- applied version indexes the working tables and runs that check as one join.
--   rebuild_map_college_credit_sources()  md5 01bfeff53dc0c448c522039d669d3efa
--   map_promote_custom_reports()          md5 fd9d88de6bf710e6cee64046c9e40ee6 (was 73c14d78…)
--   map_college_credit_bucket   228 rows (113 colleges x 2 + 2 statewide)
--   map_college_exhibit_credit  2,263 exhibit rows + 79 roll-up rows
--   Chaffey: military applied 674 (123 students), non-military 17,392 (1,177);
--   transcribed 70 / 263; waiting 1,206 military, 0 non-military. Statewide
--   applied on the plan: military 69,267 + non-military 93,336 = 162,603.
--   anon cannot execute the function; both tables carry the team-phrase gate.
