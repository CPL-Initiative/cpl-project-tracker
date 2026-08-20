-- map_cleanup_worklist — a PRIORITISED per-college clean-up list.
--
-- Sam, 2026-08-19: "Perhaps this will turn up a prioritized clean up list for
-- the team to follow up on."
--
-- RANKED BY DECISIONS, NOT BY ROWS. The project has been here before: the
-- Common CR Reference ranked by collapse value rather than by breadth, because
-- the widest-spreading string turned out to be a placeholder at one college.
-- The same trap applies to a clean-up list. 11,926 rows that all resolve under
-- ONE rule are a smaller job than 413 rows needing 413 judgements, and sorting
-- by row count would put them in the wrong order.
--
-- So `effort_shape` is the ranking axis:
--   'one rule'   a single policy decision resolves every row at a college
--   'per row'    a human must look at each one
--   'upstream'   nobody at the college can fix it; the data arrived wrong
--
-- WHO READS IT, AND WHY IT IS A TABLE RATHER THAN A VIEW
-- ------------------------------------------------------
-- Sam, 2026-08-19: "It would be useful for our Customer Success Team led by
-- Natalie Powell and supported by Chelsea Mirada and Ally Barker."
--
-- None of the three is on the reviewer roster, and they should NOT be added to
-- it for this. Reviewer is ALL-OR-NOTHING: beyond this list it reaches
-- map_student_credit (591,820 rows at STUDENT GRAIN), kb_curation, the gr_*
-- register, and `team_access` itself — so a reviewer can read and rotate every
-- team phrase. Granting that to read a per-college summary is the opposite of
-- least privilege, and it is exactly the case the pending `role` column exists
-- to solve.
--
-- The list does not need it. Every row here is a per-college AGGREGATE — counts
-- of rows and students by class. No student-grain data survives the group-by.
-- So it is materialised as a TABLE gated `is_allowed_reviewer() OR
-- team_pass_ok()`, matching map_college_cr_unit and map_college_contacts, and
-- Customer Success needs only the TEAM PHRASE they already use.
--
-- A view could not do this: reading map_student_credit under
-- `security_invoker = on` is permanently reviewer-only, and turning that off
-- would silently bypass the student-grain gate (the gr_open_sections defect).
-- Materialising is what lets the gate DROP to the right level honestly rather
-- than being circumvented.
--
-- ⚠️ No k-anonymity is applied, deliberately and consistently: map_college_cr_unit
-- sits at this same gate carrying per-articulation `distinct_students`, which is
-- finer than anything here. That makes this an INTERNAL team tool.
-- **It must never reach a public surface without the suppression
-- map_college_credit_summary applies.**
--
-- ⚠️ The contact join TRIMS the college name. Two of 106 colleges
-- ("Cypress College ", "San Jose City College ") carry a trailing space in
-- map_college_contacts and silently dropped out of an equality join.

drop view if exists public.map_cleanup_worklist;

create or replace function public.rebuild_map_cleanup_worklist()
returns void language plpgsql security definer set search_path = public as $$
begin
  drop table if exists public.map_cleanup_worklist;
  create table public.map_cleanup_worklist as
  -- ── Zero-unit recommendations, classified by WHAT THE TEXT SAYS ───────────
  -- ⚠️ CORRECTED 2026-08-19 (session 172), BEFORE the P1 instruction went out.
  -- The first cut put every zero-unit recommendation in one class, "cannot
  -- yield credit", under one action: "Rule these Not Applicable. ACE has
  -- already said no credit is recommended." That is FALSE for 5,311 rows
  -- across 101 colleges, whose text is the opposite:
  --
  --   "0 hours in Credit may be granted on the basis of an individualized
  --    assessment of the student"                                     3,933
  --   "0 hours in Additional swimming on the Basis of Institutional
  --    Evaluation"                                                    1,057
  --   "0 hours in Credit in surveying on the basis of institutional
  --    evaluation"                                                      ...
  --
  -- ACE is saying the college MAY award credit once it does its own
  -- evaluation. Telling ~100 colleges to close those as Not Applicable, on the
  -- stated grounds that ACE refused the credit, would manufacture a false zero
  -- at scale — and a college that acts on it never learns the door was open.
  -- So the reality classes are separated here and EACH CARRIES ITS OWN ACTION.
  --
  -- Two matcher misses found the same way, both now covered: the corpus
  -- contains the misspelling "Credit Is Not Recommeded" (26 rows), and
  -- "individual assessment" without the "-ized" (20 rows) fell through to the
  -- residue bucket.
  with zero_unit as (
    select college_id, student_key,
      case
        -- 'recommen' covers recommended / recommend / the "recommeded" typo.
        when credit_rec ~* 'credit is not recommen'            then 'ace-no-credit'
        -- ACE defers to the college. NOT a refusal. Split by whether the
        -- recommendation NAMES A SUBJECT, because that decides whether there is
        -- anything to offer (Sam, 2026-08-20 — see the P5 action text).
        when credit_rec ~* 'individuali[sz]ed assessment'
          or credit_rec ~* 'individual assessment'
          or credit_rec ~* 'institutional evaluation'          then
          case when credit_rec ~* '^ *0 +(hours?|semesters?) +in +credit +(may be|is) '
               then 'cx-no-course-named'   -- "Credit may be granted on the basis of..." and nothing else
               else 'cx-course-named'      -- "Additional swimming...", "Credit in surveying..."
          end
        -- The recommendation's own validity window has closed.
        when credit_rec ~* 'valid for the dates'               then 'expired-window'
        else                                                        'zero-hour-other'
      end as sub
    from public.map_student_credit
    where cpl_status_plan = 'Needs Action'
      and (credit_rec ~* 'credit is not recommen'
        or credit_rec ilike '%individualized%'
        or credit_rec ilike '%individualised%'
        or credit_rec ~* '^\s*0\s+(hours?|semester)')
  ),
  no_credit  as (select * from zero_unit where sub not like 'cx-%'),
  may_evaluate as (select * from zero_unit where sub like 'cx-%'),
  plan_per_student as (
    select college_id, student_key,
           max(cpl_plan_status) as plan,
           coalesce(sum(transcribed_credits), 0) as transcribed,
           max(case when cpl_plan_status = 'Transcribed' then 1 else 0 end) as bare_tick,
           count(*) as rows
    from public.map_student_credit group by 1,2
  ),
  transcribed_gap as (
    select college_id, student_key, rows,
           case when bare_tick = 1 then 'transcribed-no-units-batch'
                else 'transcribed-no-units-workflow' end as sub
    from plan_per_student
    where plan ilike '%transcribed%' and transcribed = 0
  ),
  applied_gap as (
    select college_id, student_key
    from public.map_student_credit
    where cpl_status_plan = 'Applied to CPL Plan' and coalesce(applied_credits, 0) = 0
  ),
  approval_queue as (
    select college_id, exhibit_id, credit_rec, max(status) as stage,
           count(*) as rows, sum(potential_credits) as units
    from public.map_student_credit
    where nullif(status, '') is not null
    group by 1,2,3
  ),
  items as (
    select college_id, 'recommendations that cannot yield credit' as class,
           sub as subclass, 1 as priority, 'one rule' as effort_shape,
           'college CPL staff' as owner,
           case sub
             when 'ace-no-credit' then
               'Rule these Not Applicable. ACE recommends no credit for this training, so there is nothing to award and they only depress the disposition rate.'
             when 'expired-window' then
               'Rule these Not Applicable. The recommendation carries its own validity window and that window has closed, so it cannot be articulated as written.'
             else
               'Zero-unit recommendation with no award to make. Read the recommendation text before ruling: this is the residue class, so check it does not say credit may be granted after your own evaluation.'
           end as action,
           count(*) as rows, count(distinct student_key) as students, 0::numeric as units
    from no_credit group by 1,2,3
    union all
    -- NOT a defect and NOT priority 1: ACE is deferring to the college, so
    -- credit MAY still be awarded. Priority 5 reflects READINESS, not value —
    -- it is last because nobody has ruled on the disposition yet, and it is the
    -- only class here that could still turn into credit for a student.
    -- RULED 2026-08-20 by Sam: these are Credit by Exam OPPORTUNITIES and belong
    -- in front of the student, not in a staff member's close-out queue. ACE
    -- defers the award to the college's own assessment; Credit by Exam is the
    -- mechanism California community colleges already use for exactly that, and
    -- it is the LARGEST CPL type in the curated corpus (798 credentials, ahead
    -- of Industry Certification's 671). So the row is not a dead end and never
    -- was — it is an untyped opportunity. All 5,311 carry an EMPTY course_type,
    -- which is why they read as one.
    -- ⚠️ SPLIT 2026-08-20, same day the ruling landed, on Sam's own challenge to
    -- it: "is the CR for many of these just a vague 'College may grant credit
    -- based on its own assessment' - no reference to a discipline or course?
    -- ...if there is no course or discipline, it's meaningless and a copout on
    -- ACE's part. Students can request Cx at any time provided the catalog
    -- allows for it for the particular course."
    --
    -- Measured: he is right about THREE QUARTERS of the class.
    --   cx-course-named     1,310 rows /  26 exhibits / 89 colleges - swimming,
    --                       surveying, First Aid and Fire Science, Anatomy and
    --                       Physiology, Air-Conditioning and Refrigeration, Gas
    --                       Turbine Technology. A real Cx target.
    --   cx-no-course-named  4,001 rows / 225 exhibits / 95 colleges - the text
    --                       is "Credit may be granted on the basis of an
    --                       individualized assessment of the student" and
    --                       nothing more. No subject anywhere in it.
    --
    -- So the ruling is SOUND but its REACH is a quarter of what the class
    -- implied, and one action across both halves would repeat exactly the
    -- mistake the P1 split fixed a day earlier.
    select college_id, 'Credit by Exam opportunities', sub, 5,
           case when sub = 'cx-course-named' then 'one rule' else 'upstream' end,
           case when sub = 'cx-course-named' then 'college CPL staff (student-facing)'
                else 'MAP team — attach the exhibit title' end,
           case sub
             when 'cx-course-named' then
               'Present these to the student as CREDIT BY EXAM options. Do NOT rule them Not Applicable: ACE is deferring the award to your own assessment, not refusing it, and Credit by Exam is the mechanism for that. The only reason to close one is that your college does not permit Credit by Exam for that particular course. (Sam, 2026-08-20.) The recommendation names the subject, so there is a specific course to point the student at.'
             else
               'NOT SENDABLE YET — do not pass this to a college. ACE names no course or discipline here: the recommendation reads "Credit may be granted on the basis of an individualized assessment of the student" and nothing more, so there is no course to offer a challenge exam in, and a student can already request Credit by Exam for any course the catalog allows. What the row still carries is the EXHIBIT - the military training ACE reviewed. Attaching that title turns it into an offer; until then it is a copout in the source data, not a task for a college. (Sam, 2026-08-20.)'
           end,
           count(*), count(distinct student_key), 0::numeric
    from may_evaluate group by 1,2,3
    union all
    select college_id, 'plan says Transcribed but no units recorded', sub, 2,
           case when sub = 'transcribed-no-units-batch' then 'upstream' else 'per row' end,
           case when sub = 'transcribed-no-units-batch' then 'MAP / ITPI with the college'
                else 'college CPL staff' end,
           case when sub = 'transcribed-no-units-batch'
                then 'Batch-upload shape: the plan is ticked Transcribed with no other lifecycle step, on AP/standardised-exam exhibits. The credit was recorded but the UNIT AMOUNTS never landed. Needs a re-upload, not a curation decision.'
                else 'The whole workflow completed and the units are still zero. Check whether the credit was actually transcribed at the college.' end,
           sum(rows), count(*), 0::numeric
    from transcribed_gap group by 1,2,3
    union all
    select college_id, 'marked Applied with zero applied units', 'applied-zero', 3,
           'per row', 'college CPL staff',
           'Either the units were never entered or the disposition is wrong. Small enough to work through individually.',
           count(*), count(distinct student_key), 0::numeric
    from applied_gap group by 1,2,3
    union all
    select college_id, 'articulation waiting on approval', lower(stage), 4,
           'per row', 'faculty / articulation officer / curriculum',
           'Not a defect - a queue. This articulation is part-way through the approval cascade and is waiting on the named stage.',
           count(*), sum(rows), round(sum(units))
    from approval_queue where stage <> 'Implementation' group by 1,2,3,4,5,6,7
  )
  select
    i.college_id, c.college_name, i.priority, i.class, i.subclass,
    i.effort_shape, i.owner, i.rows, i.students, i.units, i.action,
    -- The right person depends on the class, which is the whole point of
    -- carrying `owner`. An approval queue is not a CPL-coordinator job.
    case when i.priority = 4
         then coalesce(nullif(ct.articulation_officer,''), nullif(ct.faculty_lead,''),
                       nullif(ct.primary_contact,''))
         else coalesce(nullif(ct.cpl_coordinator,''), nullif(ct.primary_contact,'')) end
      as contact_name,
    case when i.priority = 4
         then coalesce(nullif(ct.articulation_officer_email,''), nullif(ct.faculty_lead_email,''),
                       nullif(ct.primary_contact_email,''))
         else coalesce(nullif(ct.cpl_coordinator_email,''), nullif(ct.primary_contact_email,'')) end
      as contact_email,
    ct.landing_page_url
  from items i
  left join public.map_colleges c on c.college_id = i.college_id
  -- TRIM: two of 106 colleges carry a trailing space in the contact roster and
  -- dropped out of an equality join without any error.
  left join public.map_college_contacts ct on btrim(ct.college) = btrim(c.college_name);

  alter table public.map_cleanup_worklist enable row level security;
  create policy map_cleanup_worklist_select on public.map_cleanup_worklist
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
end $$;

comment on table public.map_cleanup_worklist is
  'Prioritised per-college CPL clean-up list, rebuilt nightly by map_promote_custom_reports(). '
  'Ranked by DECISIONS not rows: priority 1 resolves under one rule per college. '
  'Priority 5 is NOT a defect class - it is the Credit by Exam lane. Sam ruled 2026-08-20 '
  'that these go to the STUDENT as Cx options and are never bulk-ruled Not Applicable. '
  'It carries TWO subclasses because only one is sendable: cx-course-named (the '
  'recommendation names a subject) vs cx-no-course-named (it names none, so there is no '
  'course to offer and the row waits on the exhibit title). '
  'Team-phrase gated because every row is a per-college AGGREGATE - no student grain '
  'survives the group-by, so Customer Success does not need reviewer access. '
  'NO k-anonymity: internal team tool, never a public surface.';

revoke all on function public.rebuild_map_cleanup_worklist() from public, anon, authenticated;
