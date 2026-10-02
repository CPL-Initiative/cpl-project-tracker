-- Schema of record: public.college_program_courses.
-- Applied live via the Supabase MCP on 2026-10-02 (S318) as:
--   college_program_courses
--
-- Sam, 2026-10-02: "Goal is to be able to list the courses in particular
-- programs at a given college." One read for Sierra: the programs at ONE college
-- that match the question, each with the courses it lists in
-- coci_program_courses (chatbox/supabase_program_courses.sql).
--
-- THE MATCHER IS search_college_programs, CALLED, NEVER COPIED. A second
-- program matcher is a second place for "which program did they mean" to drift
-- (the CRED routes' rule: one matcher). college_filter narrows it to the asked
-- college; the term weighting still reads the whole catalog, so a term is as
-- generic here as it is in the statewide answer.
--
-- WHICH PROGRAMS. A program whose own title carries the ask ('title',
-- 'title+code') outranks one that shares only a code; code-only and fuzzy
-- matches appear only when no title match exists, because a code says what a
-- program is ABOUT and cannot say it is the one asked for. At most
-- program_limit programs (8), in the matcher's order. Eight, because inside
-- one college the matcher's order is loose: for "LVN" at Mt. San Antonio,
-- Vocational Nursing ranks 5th, behind a CNA program, since the prefix "nurs"
-- also matches Nursery Management. Sierra re-ranks the eight by how many of the
-- visitor's own words each title carries, then lists the first three.
--
-- THE KEY. A program row joins its course list on (college, control_number).
-- control_number is NULL until the programs loader carries it (the pending
-- part of chatbox/supabase_search_college_programs.sql); then list_size is NULL
-- and the caller must render nothing about courses, because "no course list"
-- would be a false absence. A known control with no rows has list_size 0: the
-- catalog data carries no course list for that program.
--
-- WHAT A ROW SAYS. The program LISTS the course. The source has no
-- required/elective flag, so the caller never calls a course required and never
-- totals units. course_limit caps the rows per program; list_size is the whole
-- list, so the caller can say how many it left out.

create or replace function public.college_program_courses(
  p_college text,
  search_terms text[],
  program_limit integer default 8,
  course_limit integer default 60)
returns table(
  program_title text, award text, status text, matched_via text,
  control_number text, list_size integer,
  course_code text, course_title text, units numeric, cid text, course_college text)
language sql
stable
set search_path to 'public'
as $function$
  with found as (
    select s.program_title, s.award, s.status, s.matched_via, s.ord
    from public.search_college_programs(search_terms, p_college, 40)
         with ordinality as s(college, program_title, award, status, top_code, top_title,
                              cip_code, cip_title, matched_via, region, county,
                              landing_page_url, ord)
  ),
  ranked as (
    select f.*,
           f.matched_via in ('title', 'title+code') as named,
           bool_or(f.matched_via in ('title', 'title+code')) over () as any_named,
           row_number() over (
             order by (f.matched_via in ('title', 'title+code')) desc, f.ord) as pick
    from found f
  ),
  progs as (
    select r.program_title, r.award, r.status, r.matched_via, r.pick, p.control_number
    from ranked r
    join public.coci_college_programs p
      on p.college = p_college
     and p.program_title = r.program_title
     and p.award is not distinct from r.award
     and p.status is not distinct from r.status
    where r.pick <= greatest(coalesce(program_limit, 8), 1)
      and (r.named or not r.any_named)
  ),
  listed as (
    select pr.program_title, pr.award, pr.status, pr.matched_via, pr.pick, pr.control_number,
           c.course_code, c.course_title, c.units, c.cid, c.course_college,
           count(c.course_control_number) over (partition by pr.pick, pr.control_number) as n,
           row_number() over (partition by pr.pick, pr.control_number
                              order by c.course_code, c.course_title) as rn
    from progs pr
    left join public.coci_program_courses c
      on c.college = p_college and c.program_control_number = pr.control_number
  )
  select l.program_title, l.award, l.status, l.matched_via, l.control_number,
         case when l.control_number is null then null else l.n::integer end as list_size,
         l.course_code, l.course_title, l.units, l.cid, l.course_college
  from listed l
  where l.rn <= greatest(coalesce(course_limit, 60), 1)
  order by l.pick, l.control_number, l.course_code, l.course_title;
$function$;
