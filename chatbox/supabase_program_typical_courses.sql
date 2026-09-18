-- Schema of record: public.cpl_course_title_norm, public.program_typical_courses.
--
-- The TYPICAL-COURSES lookup behind the shared cpl-chat Edge Function (Sierra):
-- for a set of TOP programs, which course titles the colleges that teach the
-- program most often list — statewide, counted in colleges, never in rows.
-- Applied live via the Supabase MCP on 2026-09-18 as:
--   program_typical_courses
--
--
-- WHY THIS EXISTS: the visitor did not say where they trained
-- ------------------------------------------------------------------
-- Sam, 2026-09-18 (S276), reading cpl-chat v71's answer to his Orange County
-- question ("I have a CNA cert … what CNA courses match LVN courses so I can
-- ask for credit?"):
--
--   "Goal now would be for her to be able to add near the start of her
--    detailed answer a quick list view of the typical CNA course next to
--    typical LVN courses. The user did not say where they did their CNA, so
--    being able to generalize is an added skill level for Sierra."
--
-- The prospective-credit block (v69–v71) reads the FULL course list of the
-- three colleges nearest the visitor for each program the question matched.
-- That answers "which course at which college"; it cannot say what a CNA
-- program TYPICALLY teaches, because the visitor's own CNA came from a college
-- nobody named. Generalizing needs the whole state: chatbox_college_courses
-- carries every course of every college (141,696 rows over 120 colleges), and
-- the question is how many of the colleges teaching a program list a course
-- of the same name.
--
--
-- WHY A FUNCTION, NOT A PostgREST READ
-- ------------------------------------------------------------------
-- PostgREST caps a read at 1,000 rows (db-max-rows) and says nothing when it
-- cuts. Registered Nursing alone is 1,544 rows over 80 colleges, so a raw
-- read of the rows would return an alphabetical HALF of the state and call it
-- typical. Aggregating here returns one row per (program × normalized title)
-- — 174 rows for CNA + LVN + RN together, measured 2026-09-18 — in 65 ms
-- (explain analyze, seq scan on top_code; the table has no top_code index and
-- does not need one at this size: docs/kb-notes/methodology-an-index-is-a-
-- write-path-cost-until-measured.md).
--
--
-- THE NORMALIZATION, AND WHAT IT MEASURED (2026-09-18, live)
-- ------------------------------------------------------------------
-- Course titles are faculty-typed. "Nurse Assistant", "Nursing Assistant",
-- "Certified Nursing Assistant", "NURSE ASSISTANT TRAINING PROGRAM" and
-- "Nurse Assistant Theory" are one course to a counselor and five to GROUP BY.
-- cpl_course_title_norm() lowercases, drops parentheticals and punctuation,
-- folds nurse/nursing/nurses and assistant/assisting, foundations→fundamentals
-- and intro→introduction, and removes the words that split a course into its
-- delivery parts and levels (theory, lab, clinical, I/II/III, A/B, training,
-- program, certified, practice …). Measured on the live table:
--
--   TOP 1230.30 Certified Nurse Assistant (65 colleges)
--     nurse assistant ............... 49 of 65   (was 11 + 10 + 9 + 7 + 4 + 4 + 3 unfolded)
--     acute care nurse assistant ....  9 of 65
--     home health aide ..............  7 of 65
--   TOP 1230.20 Licensed Vocational Nursing (44 colleges)
--     fundamentals nurse ............ ~9–16 of 44 (Fundamentals of Nursing)
--     vocational nurse .............. ~15 of 44   (Vocational Nursing I / II …)
--     pharmacology .................. ~13 of 44
--     intravenous therapy blood withdrawal  8 of 44
--
-- Level words (fundamentals, introduction, basic, beginning, advanced,
-- intermediate) are KEPT: they are what separates the entry course a CNA can
-- ask about from the advanced one it cannot. Roman numerals and A/B suffixes
-- are dropped: "Vocational Nursing I" and "Vocational Nursing II" are one
-- course family, and the modal title tells the reader which level leads.
--
-- Every count is in COLLEGES (count(distinct college)), never rows: a college
-- listing Theory + Lab + Clinical for one course counts once.
--
--
-- WHAT THE FUNCTION RETURNS
-- ------------------------------------------------------------------
-- One row per (top_code × normalized title) with at least min_colleges
-- colleges, at most per_top rows per program, most colleges first:
--   top_code, top_title      the program
--   norm                     the normalized title (the grouping key)
--   n_colleges               colleges listing a course of this name
--   program_colleges         colleges teaching the program at all (the denominator)
--   colleges                 their names (so a caller can fold groups and
--                            still count colleges exactly)
--   modal_title              the most common raw title (what to display)
--   modal_units              the most common unit value (0 = noncredit)
--   example_college/_code    one real course to point at
--   credit_rows/noncredit_rows  how the rows split by unit value
--
-- Fail-safe by construction: an empty or unknown top_codes array returns no
-- rows, and the caller renders nothing.

create or replace function public.cpl_course_title_norm(title text)
returns text
language sql
immutable
as $function$
  select trim(regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(
                regexp_replace(lower(coalesce(title, '')), '\(.*?\)', ' ', 'g'),
                '[^a-z0-9 ]', ' ', 'g'),
              '\m(nursing|nurses|nurse s)\M', 'nurse', 'g'),
            '\m(assisting|assistants|assistance)\M', 'assistant', 'g'),
          '\m(foundations|foundation|fundamental)\M', 'fundamentals', 'g'),
        '\m(intro|introductory)\M', 'introduction', 'g'),
      '\m(i|ii|iii|iv|v|vi|1|2|3|4|5|6|a|b|c|d|e|and|the|of|for|to|in|an|with|theory|lecture|lab|laboratory|clinical|clinic|clinicals|practicum|skills|skill|training|program|course|certified|cert|level|part|section|concepts|principles|applications|practice)\M', ' ', 'g'),
    '\s+', ' ', 'g'));
$function$;

-- Drop-then-create on a signature change, as the other RPCs do: PostgREST
-- resolves an rpc call by name and must never see two candidates. The grants
-- the drop discards are restored at the end of this file.
drop function if exists public.program_typical_courses(text[], integer, integer);

create or replace function public.program_typical_courses(
  top_codes    text[],
  min_colleges integer default 2,
  per_top      integer default 40
)
returns table(
  top_code text, top_title text, norm text,
  n_colleges integer, program_colleges integer, colleges text[],
  modal_title text, modal_units numeric,
  example_college text, example_code text,
  credit_rows integer, noncredit_rows integer
)
language sql
stable
as $function$
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
           min(b.subject || ' ' || b.course_number) filter (where b.college = (select min(x.college) from base x where x.top_code = b.top_code and x.norm = b.norm)) as example_code,
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

-- The drop above discarded the explicit grants; restore them. anon is what the
-- smoke test and every anon-key caller use, service_role is the edge function.
-- Both read a public-read table (RLS policy chatbox_college_courses_read grants
-- SELECT to anon and authenticated), so security invoker is right here.
grant execute on function public.cpl_course_title_norm(text) to anon, authenticated, service_role;
grant execute on function public.program_typical_courses(text[], integer, integer) to anon, authenticated, service_role;
