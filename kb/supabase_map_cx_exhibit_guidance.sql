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
    select exhibit_id, count(*) as rows_n,
           count(distinct college_id) as colleges_n,
           count(distinct student_key) as students_n
    from public.map_student_credit
    where cpl_status_plan = 'Needs Action'
      and credit_rec ~* '^ *0 +(hours?|semesters?) +in +credit +(may be|is) '
      and credit_rec ~* 'individuali[sz]ed assessment|individual assessment|institutional evaluation'
    group by 1
  ),
  pairs as (
    select b.exhibit_id, u.college_course, count(distinct u.college_id) as colleges
    from blank b
    join public.map_college_cr_unit u on u.exhibit_id = b.exhibit_id
    where coalesce(u.college_course, '') <> ''
    group by 1, 2
  ),
  -- ⚠️ SPECIFICITY — the second dimension, added after the first build shipped
  -- a tier 1 that was 11/14 "Elements of Supervision".
  --
  -- A course articulated against many UNRELATED exhibits carries no information
  -- about any one of them. Measured: `MAG-51 Elements of Supervision` spans 33
  -- exhibits (Infantryman, Combat Medic, Cook, Truck Driver, HR Specialist...),
  -- `MAG-200 Management Work Experience` 10, `AUTOCOR-114 BASIC WELDING` 8.
  -- Three colleges blanket-map any military service to a supervision course.
  --
  -- THE TWO-COLLEGE FLOOR CANNOT CATCH THAT. A systematic behaviour shared by a
  -- few colleges is indistinguishable from genuine corroboration when you only
  -- count colleges — which is exactly why the floor felt sufficient and was not.
  -- `ADJ-1 Introduction to the Administration of Justice` spans 1 (Military
  -- Police) and is worth reading. Span is what tells them apart.
  spans as (select college_course, count(distinct exhibit_id) as spans_exhibits
            from pairs group by 1),
  scored as (
    select p.exhibit_id, p.college_course, p.colleges, s.spans_exhibits,
           (p.colleges >= 2 and s.spans_exhibits < 4) as specific_and_corroborated,
           (s.spans_exhibits >= 4) as blanket
    from pairs p join spans s using (college_course)
  ),
  agg as (
    select exhibit_id,
           count(*) filter (where specific_and_corroborated) as strong_courses,
           count(*) filter (where blanket) as blanket_courses,
           count(*) as total_courses,
           -- Every entry carries BOTH numbers. A blanket course is never removed
           -- — it is labelled, because hiding it would leave a curator unable to
           -- see why an exhibit has no strong course.
           jsonb_agg(jsonb_build_object(
             'course', college_course, 'colleges', colleges,
             'spans_exhibits', spans_exhibits, 'blanket', blanket)
             order by specific_and_corroborated desc, blanket, colleges desc, college_course
           ) as peer_courses
    from scored group by 1
  )
  select
    b.exhibit_id, t.title as exhibit_title,
    b.rows_n, b.colleges_n, b.students_n,
    case when coalesce(a.strong_courses,0) > 0 then 1
         when coalesce(a.total_courses,0)  > 0 then 2
         else 3 end as tier,
    case
      when coalesce(a.strong_courses,0) > 0
        then 'At least two colleges named the same course AND that course is not a blanket mapping (it appears against fewer than four different exhibits). The only tier worth reading as a pointer, and still peer precedent rather than a recommendation.'
      when coalesce(a.total_courses,0) > 0
        then 'Colleges have named a course here, but none that is both corroborated and specific - either only one college did it, or the course is a blanket mapping applied across many unrelated exhibits. Read peer_courses with the spans_exhibits count before using any of it.'
      else 'No college has named a course for this exhibit. The exhibit title is the only guidance, and no course is suggested here on purpose.'
    end as tier_note,
    -- ⚠️ WHAT TO DO IN MAP — Sam's condition on keeping tier 2, 2026-08-20:
    -- "tier 2s earn their place as long as there is guidance for the CSM team on
    -- correcting or noting in MAP any changes recommended."
    --
    -- A tier label tells a reader how much to trust a row. It does not tell them
    -- what to DO, and this list exists to send someone to MAP. So each tier
    -- carries its own action, and the actions differ in KIND, not in confidence:
    -- tier 1 carries a candidate course to test, tier 2 carries a CONVERSATION
    -- (the peer course is context, never a proposal), tier 3 carries only the
    -- title.
    --
    -- The concrete correction is stronger than it first looks: ALL 4,001 of
    -- these rows carry an EMPTY course_type (measured, 2026-08-20), which is
    -- exactly why they read as closed. Typing them Credit by Exam IS the
    -- "noting in MAP" Sam asked for, and it uses a value MAP already has —
    -- Credit By Exam is the largest CPL type in the curated corpus.
    --
    -- ⚠️ These name FIELDS, never SCREENS. No session has seen MAP's UI and MAP
    -- is read-only to us, so inventing a click path would be fabricating the one
    -- part we cannot check. `college_course`, `course_type` and
    -- `cpl_status_plan` are columns we load, so they are safe to name.
    case
      when coalesce(a.strong_courses,0) > 0
        then 'IN MAP: take the corroborated course to the college as a candidate. If it fits, attach it as the local course on this recommendation and set the CPL type to Credit by Exam - every one of these rows carries an EMPTY CPL type today, which is why they read as closed. If it does not fit, record that it was reviewed and why. Do NOT rule it Not Applicable just because the peer course did not fit.'
      when coalesce(a.total_courses,0) > 0
        then 'IN MAP: lead with the exhibit title, not the course below it. Ask the college whether they teach an equivalent - the peer course here is CONTEXT for that conversation, never a proposal, because either only one college chose it or it is a blanket mapping applied across many unrelated exhibits. If the college identifies a course, attach it as the local course and set the CPL type to Credit by Exam. If nothing fits, note that the training was reviewed and no local equivalent was found, so the next person does not start over. Do NOT bulk-rule Not Applicable.'
      else
        'IN MAP: no course is suggested here on purpose. Take the exhibit title to the college and ask whether the training maps to anything they teach. If it does, attach that course and set the CPL type to Credit by Exam; if it does not, note that it was reviewed. Do NOT bulk-rule Not Applicable - ACE deferred this award to the college, it did not refuse it.'
    end as map_action,
    coalesce(a.peer_courses, '[]'::jsonb) as peer_courses,
    coalesce(a.strong_courses, 0)  as strong_courses,
    coalesce(a.blanket_courses, 0) as blanket_courses,
    coalesce(a.total_courses, 0)   as total_courses
  from blank b
  left join agg a using (exhibit_id)
  -- LEFT join: a missing title leaves the row present with a NULL title.
  left join public.map_ace_exhibit_titles t on t.exhibit_id = b.exhibit_id;

  alter table public.map_cx_exhibit_guidance enable row level security;
  create policy map_cx_exhibit_guidance_select on public.map_cx_exhibit_guidance
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
end $fn$;

comment on table public.map_cx_exhibit_guidance is
  'Per-ACE-exhibit guidance for the Credit by Exam rows whose recommendation names no course. '
  'Rebuilt nightly inside map_promote_custom_reports(). tier 1 = a course named by 2+ colleges '
  'that is ALSO specific (spans fewer than 4 exhibits) - 3 exhibits today; tier 2 = colleges named '
  'something but nothing corroborated AND specific - 47; tier 3 = nobody has, so only the exhibit '
  'title is offered - 175. peer_courses ALWAYS carries colleges AND spans_exhibits per course: '
  'counting colleges alone cannot tell genuine corroboration from three colleges blanket-mapping '
  'any military service to MAG-51 Elements of Supervision, which spans 33 exhibits. Blanket '
  'courses are LABELLED, never hidden. No matcher: where no college has named a course, none is '
  'suggested. EVERY tier carries a map_action saying what to correct or note IN MAP - Sam''s '
  'condition, 2026-08-20, on tier 2 earning its place. Team-phrase gated.';

revoke all on function public.rebuild_map_cx_exhibit_guidance() from public, anon, authenticated;
