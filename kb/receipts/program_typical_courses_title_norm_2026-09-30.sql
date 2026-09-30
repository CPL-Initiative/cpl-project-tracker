-- RECEIPT — the stored title_norm column behind program_typical_courses().
-- 2026-09-30, S308/S309 merged session (SkyBracket, SkyCensus). Authority:
-- Sam in session, 2026-09-30: "Go ahead with the stored column".
--
-- WHY: the smoke's 7c probe calls program_typical_courses() with the anon key,
-- whose statement_timeout is 3 s. The function normalized every matching
-- title per call (cpl_course_title_norm, one SQL-function call per row). On
-- the same 723 rows (TOP 1230.30 and 1230.20) that step measured 72 ms, 503 ms
-- and 4,178 ms on three calls today; through PostgREST pg_stat_statements
-- read 153 calls, mean 2,552 ms, max 7,944 ms. Red at 18:23 UTC (run
-- 36758190827), green at 19:50 (run 36767421681): it fails when the database
-- is busy. The fix computes each title's normal form once, at write time.
--
-- WHAT CHANGES LIVE, in this order (migration
-- chatbox_college_courses_title_norm_stored):
--   A. alter table public.chatbox_college_courses add column title_norm text
--        generated always as (public.cpl_course_title_norm(course_title)) stored;
--      One table rewrite (141,696 rows, 107 MB before). Writers are unaffected:
--      the loader (kb/_sync_college_courses.py) upserts built columns only, and
--      the title clean-up's rollback re-inserts only its COLS list.
--   B. create or replace function public.program_typical_courses(text[], integer, integer)
--      with its `base` CTE reading c.title_norm instead of calling the
--      normalizer per row. Same signature, same grants, same output.
--
-- EQUIVALENCE, measured before the change (min_colleges 2, per_top 40; the
-- hash is md5 of the rows as text in the function's own order):
--   47 health TOP codes (12%)            688 rows  b213152dd7e8d67b0bb4f7ebcd8c5261
--   1230.30 + 1230.20 (the smoke's pair)   42 rows  e2e3456a7f9cff5b5a69ab33355028a3
--   66 engineering/industrial TOPs (09%)  758 rows  faac1615890f95f5b89253eeeed64e12
-- The after-read must reproduce all three.
--
-- ⚠️ A STORED VALUE DOES NOT FOLLOW ITS FUNCTION. Postgres lets
-- cpl_course_title_norm be replaced while title_norm depends on it, and keeps
-- the old values. chatbox/supabase_program_typical_courses.sql therefore
-- recomputes the column right after it defines the normalizer, and
-- chatbox/verify_program_typical_courses.sql counts stale rows.
--
-- ── ROLLBACK ─────────────────────────────────────────────────────────────
-- B first (the function reads the column), then A:
--   1. re-apply the BEFORE text below;
--   2. alter table public.chatbox_college_courses drop column if exists title_norm;
--
-- BEFORE — program_typical_courses(), live, read 2026-09-30 20:51 UTC.
-- md5(pg_get_functiondef) = 270c8e2bc3a918ff6a2253d31948f862
-- (cpl_course_title_norm is not changed: md5 67bb3d88a225a48459e1e86a18fb1919).

CREATE OR REPLACE FUNCTION public.program_typical_courses(top_codes text[], min_colleges integer DEFAULT 2, per_top integer DEFAULT 40)
 RETURNS TABLE(top_code text, top_title text, norm text, n_colleges integer, program_colleges integer, colleges text[], modal_title text, modal_units numeric, example_college text, example_code text, credit_rows integer, noncredit_rows integer)
 LANGUAGE sql
 STABLE
AS $function$
  with base as (
    select c.top_code, c.top_title, c.college, c.course_title, c.subject, c.course_number, c.units,
           public.cpl_course_title_norm(c.course_title) as norm
    from public.chatbox_college_courses c
    where c.top_code = any(coalesce(top_codes, '{}'::text[]))
  ),
  tot as (
    select b.top_code, count(distinct b.college)::integer as program_colleges
    from base b group by b.top_code
  ),
  agg as (
    select b.top_code,
           mode() within group (order by b.top_title) as top_title,
           b.norm,
           count(distinct b.college)::integer as n_colleges,
           array_agg(distinct b.college order by b.college) as colleges,
           mode() within group (order by b.course_title) as modal_title,
           mode() within group (order by b.units) as modal_units,
           min(b.college) as example_college,
           (array_agg(b.subject || ' ' || b.course_number order by b.college, b.subject, b.course_number))[1] as example_code,
           sum(case when coalesce(b.units, 0) > 0 then 1 else 0 end)::integer as credit_rows,
           sum(case when coalesce(b.units, 0) > 0 then 0 else 1 end)::integer as noncredit_rows
    from base b
    where b.norm <> ''
    group by b.top_code, b.norm
  ),
  ranked as (
    select a.*, t.program_colleges,
           row_number() over (partition by a.top_code order by a.n_colleges desc, a.norm asc) as rn
    from agg a join tot t on t.top_code = a.top_code
    where a.n_colleges >= greatest(coalesce(min_colleges, 1), 1)
  )
  select r.top_code, r.top_title, r.norm, r.n_colleges, r.program_colleges, r.colleges,
         r.modal_title, r.modal_units, r.example_college, r.example_code, r.credit_rows, r.noncredit_rows
  from ranked r
  where r.rn <= greatest(coalesce(per_top, 1), 1)
  order by r.top_code, r.n_colleges desc, r.norm;
$function$;
