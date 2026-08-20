-- The Credit-by-Exam guidance list: what training a blank recommendation came
-- from, and where colleges have already put it.
--
-- WHY THIS EXISTS (session 172, 2026-08-20)
-- -----------------------------------------
-- Sam ruled that ACE's deferral recommendations are Credit by Exam offers, then
-- challenged his own ruling and was right: 4,001 of the 5,311 rows name no
-- course or discipline at all — "Credit may be granted on the basis of an
-- individualized assessment of the student", and nothing more. A Cx offer has to
-- name a course to challenge, so those rows were marked NOT SENDABLE.
--
-- Sam, 2026-08-20: "I might ask you for a short list of the no course CRs + the
-- title of their ACE exhibit (e.g., Corpsman, Hospitalman, Rifleman, MP, etc.).
-- If we tag the generic Cx opportunity with an indicator of where their training
-- might align with a course, it would make them less likely to be ignored
-- completely."
--
-- ⭐ IT DOES NOT HAVE TO BE A GUESS. Measured before building: for 50 of the 225
-- blank exhibits — 2,971 of the 4,001 rows — some college has ALREADY named a
-- local course against that exact exhibit. So the indicator is a fact about what
-- peers did, not an inference about what might fit.
--
-- ⚠️ AND THE FLOOR IS THE WHOLE DESIGN. 119 of the 143 exhibit↔course pairs come
-- from a SINGLE college. Unfiltered, this list would tell a counsellor that
-- Infantryman (MOS-11B) aligns with `AUTOCOR-114 BASIC WELDING THEORY` because
-- one college did that once, and that `MAG-51 Elements of Supervision` fits
-- Infantryman, Combat Medic, Armor Crewman, HR Specialist and Signal Support
-- alike (three colleges blanket-mapping any service to supervision credit).
-- So the college count is carried per course and per tier, and a 1 can never
-- render like a 12. Same rule the local-course alignment lane already runs.
--
-- ⚠️ NO MATCHER, DELIBERATELY. Where no college has named a course, this says so
-- and shows the exhibit title instead. The alignment lane built a
-- "closest match anyway" fallback and WITHDREW it after it proposed an
-- automotive electrical course for a policing recommendation. On a row a
-- counsellor may put in front of a veteran, a plausible wrong suggestion costs
-- more than a blank one.

-- ── A · the ACE exhibit titles ─────────────────────────────────────────────
-- What MOS-42A-001 actually IS. The row is not empty — the RECOMMENDATION is;
-- every one still carries the exhibit, i.e. the training ACE reviewed.
--
-- fetch_custom_report.py has asked View_ExhibitCRsCatalog_Dataset for `AceID`
-- AND `Title` since 2026-08-14 and stored NEITHER, while map_student_credit
-- keys on the ACE id. The pair was arriving daily and being dropped on the
-- floor. That is the cost side of "minimisation happens twice": a column
-- dropped for having no consumer is invisible until something needs it.
drop table if exists public.stg_map_ace_exhibit_titles;
create table public.stg_map_ace_exhibit_titles (
  exhibit_id text,
  title      text
);

create table if not exists public.map_ace_exhibit_titles (
  exhibit_id text primary key,
  title      text not null
);

alter table public.map_ace_exhibit_titles enable row level security;
drop policy if exists map_ace_exhibit_titles_select on public.map_ace_exhibit_titles;
-- Public-read: an ACE exhibit title is published reference data (it is in ACE's
-- own Military Guide), carries no student grain and no college attribution.
create policy map_ace_exhibit_titles_select on public.map_ace_exhibit_titles
  for select to anon, authenticated using (true);

revoke all on public.stg_map_ace_exhibit_titles from anon, authenticated;

-- ── B · the guidance list ──────────────────────────────────────────────────
create or replace function public.rebuild_map_cx_exhibit_guidance()
returns void language plpgsql security definer set search_path = public as $fn$
begin
  drop table if exists public.map_cx_exhibit_guidance;
  create table public.map_cx_exhibit_guidance as
  with blank as (
    -- The SAME predicate as map_cleanup_worklist's cx-no-course-named subclass.
    -- Kept literal rather than shared because a view here would have to be
    -- security_invoker over student-grain data; if the two ever diverge the
    -- guidance list would describe a different population from the worklist it
    -- explains, which is the failure this comment exists to make visible.
    select exhibit_id,
           count(*) as rows_n,
           count(distinct college_id) as colleges_n,
           count(distinct student_key) as students_n
    from public.map_student_credit
    where cpl_status_plan = 'Needs Action'
      and credit_rec ~* '^ *0 +(hours?|semesters?) +in +credit +(may be|is) '
      and credit_rec ~* 'individuali[sz]ed assessment|individual assessment|institutional evaluation'
    group by 1
  ),
  -- What peers actually did with this exhibit. A FACT, per (exhibit, course),
  -- carrying the number of DISTINCT COLLEGES that did it.
  pairs as (
    select b.exhibit_id, u.college_course,
           count(distinct u.college_id) as colleges
    from blank b
    join public.map_college_cr_unit u on u.exhibit_id = b.exhibit_id
    where coalesce(u.college_course, '') <> ''
    group by 1, 2
  ),
  agg as (
    select exhibit_id,
           max(colleges) as top_course_colleges,
           count(*) filter (where colleges >= 2) as corroborated_courses,
           count(*) filter (where colleges  = 1) as single_college_courses,
           -- Ordered strongest-first, and every entry carries its own count so a
           -- 1 is visibly a 1. NEVER a bare course list.
           jsonb_agg(jsonb_build_object('course', college_course, 'colleges', colleges)
                     order by colleges desc, college_course) as peer_courses
    from pairs group by 1
  )
  select
    b.exhibit_id,
    t.title as exhibit_title,
    b.rows_n, b.colleges_n, b.students_n,
    case
      when coalesce(a.corroborated_courses, 0) > 0 then 1
      when coalesce(a.single_college_courses, 0) > 0 then 2
      else 3
    end as tier,
    case
      when coalesce(a.corroborated_courses, 0) > 0
        then 'At least two colleges independently articulated this exhibit against the same course. The strongest signal here, and still a peer precedent rather than a recommendation.'
      when coalesce(a.single_college_courses, 0) > 0
        then 'ONE college named a course for this exhibit. Treat as a lead, not a pattern — most single-college mappings in this list are idiosyncratic, and some are a blanket mapping of any military service to a management course.'
      else 'No college has named a course for this exhibit. The exhibit title is the only guidance available, and no course is suggested here on purpose.'
    end as tier_note,
    coalesce(a.peer_courses, '[]'::jsonb) as peer_courses,
    coalesce(a.corroborated_courses, 0) as corroborated_courses,
    coalesce(a.single_college_courses, 0) as single_college_courses
  from blank b
  left join agg a using (exhibit_id)
  -- LEFT join: a missing title must leave the row present and the title NULL.
  -- Dropping it would hide the exhibit entirely, and an absent measurement must
  -- never be indistinguishable from an absent problem.
  left join public.map_ace_exhibit_titles t on t.exhibit_id = b.exhibit_id;

  alter table public.map_cx_exhibit_guidance enable row level security;
  create policy map_cx_exhibit_guidance_select on public.map_cx_exhibit_guidance
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
end $fn$;

comment on table public.map_cx_exhibit_guidance is
  'Per-ACE-exhibit guidance for the Credit by Exam rows whose recommendation names no course. '
  'Rebuilt nightly inside map_promote_custom_reports(). tier 1 = two or more colleges named the '
  'same course (peer precedent), tier 2 = exactly one college did (a lead, not a pattern), '
  'tier 3 = nobody has, so only the exhibit title is offered. peer_courses ALWAYS carries the '
  'college count per course so a single-college mapping can never render like a corroborated one. '
  'No matcher: where no college has named a course, none is suggested. Team-phrase gated.';

revoke all on function public.rebuild_map_cx_exhibit_guidance() from public, anon, authenticated;
