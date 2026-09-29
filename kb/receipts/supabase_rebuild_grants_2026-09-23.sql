-- RECEIPT · Supabase table grants on the five nightly rebuilds · 2026-09-23 · S284 SkyWage
-- Sam's verdict "apply", item 1 of https://claude.ai/artifact/2xc8Hik6di18kSqmP7vkCV (replies
-- store, 2026-09-23T17:10Z). Applied with the Supabase MCP apply_migration; this file is exactly
-- the SQL sent: the five `create or replace function` statements from the files named below
-- (PR #1665), nothing else. No table is touched until tonight's promotion calls the functions.
--
-- BEFORE (live prosrc md5, read at 17:1xZ the same day, unchanged from the 15:5xZ read):
--   rebuild_map_cleanup_worklist        ae9e6351065a8cf9dcf01fb4b502c9a4
--   rebuild_map_college_credit_summary  264c719e1f208c3fd30cf1fa5184fdea
--   rebuild_map_college_goal2           8a2db29799788772eb0e3e515f940e03
--   rebuild_map_cx_exhibit_guidance     2398b8d17846725966510e691004ebdb
--   rebuild_map_transcribed_gap         3db137e2f71a44c82a26c62f6645d80b
-- Owner postgres, security definer, EXECUTE held by postgres and service_role only; a
-- `create or replace` keeps the owner and the ACL.
--
-- ROLLBACK: re-apply these five definitions from commit e8b3582 (main before #1665). Their code
-- matches the BEFORE state apart from dashes in two text strings shown to colleges (measured
-- statement by statement, comments stripped).

-- ── rebuild_map_college_goal2 (from kb/supabase_map_promote_custom_reports.sql) ──
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

-- ── rebuild_map_college_credit_summary (from kb/supabase_map_promote_custom_reports.sql) ──
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
  -- EXPLICIT GRANTS (2026-09-23). This body creates the table afresh on every
  -- run, and from 2026-10-30 Supabase stops granting the API roles on a NEW
  -- table in public. anon and authenticated read through the policy above;
  -- service_role reads it for the daily publishers. Nothing writes here but
  -- this function. Guarded by tests/supabase_table_grants_test.py.
  grant select on public.map_college_credit_summary to anon, authenticated, service_role;
end $$;

-- ── rebuild_map_cleanup_worklist (from kb/supabase_map_cleanup_worklist.sql) ──
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
  -- EXPLICIT GRANTS (2026-09-23). This body creates the table afresh on every
  -- run, and from 2026-10-30 Supabase stops granting the API roles on a NEW
  -- table in public. anon and authenticated read through the policy above;
  -- service_role reads it for the daily publishers. Nothing writes here but
  -- this function. Guarded by tests/supabase_table_grants_test.py.
  grant select on public.map_cleanup_worklist to anon, authenticated, service_role;
end $$;

-- ── rebuild_map_transcribed_gap (from kb/supabase_map_transcribed_gap.sql) ──
create or replace function public.rebuild_map_transcribed_gap()
returns void language plpgsql security definer set search_path = public as $$
begin
  drop table if exists public.map_transcribed_gap;
  create table public.map_transcribed_gap as
  with affected as (
    select college_id, student_key,
           case when max(cpl_plan_status) = 'Transcribed'
                then 'A · batch upload'
                else 'B · workflow completed' end as pattern
    from public.map_student_credit
    group by 1,2
    having max(cpl_plan_status) ilike '%transcribed%'
       and coalesce(sum(transcribed_credits), 0) = 0
  )
  select
    a.college_id,
    c.college_name,
    a.pattern,
    m.exhibit_id,
    m.catalog_year,
    count(distinct a.student_key)::int              as students,
    count(*)::int                                   as records,
    round(sum(m.potential_credits), 2)              as units_at_stake,
    count(*) filter (where m.cpl_status_plan = 'Needs Action')::int as still_needs_action,
    case when a.pattern like 'A%'
      then 'Ask the college whether this batch actually transcribed. The upload marked the plan complete but carried no unit amounts, so it needs re-uploading with the units — not a curation decision.'
      else 'The whole CPL workflow was completed and the units are still zero. Ask the college whether the credit reached the transcript.'
    end                                             as ask
  from affected a
  join public.map_student_credit m using (college_id, student_key)
  left join public.map_colleges c on c.college_id = a.college_id
  group by 1,2,3,4,5;

  alter table public.map_transcribed_gap enable row level security;
  create policy map_transcribed_gap_select on public.map_transcribed_gap
    for select to anon, authenticated
    using (is_allowed_reviewer() or team_pass_ok());
  -- EXPLICIT GRANTS (2026-09-23). This body creates the table afresh on every
  -- run, and from 2026-10-30 Supabase stops granting the API roles on a NEW
  -- table in public. anon and authenticated read through the policy above;
  -- service_role reads it for the daily publishers. Nothing writes here but
  -- this function. Guarded by tests/supabase_table_grants_test.py.
  grant select on public.map_transcribed_gap to anon, authenticated, service_role;
end $$;

-- ── rebuild_map_cx_exhibit_guidance (from kb/supabase_map_cx_exhibit_guidance.sql) ──
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
  -- EXPLICIT GRANTS (2026-09-23). This body creates the table afresh on every
  -- run, and from 2026-10-30 Supabase stops granting the API roles on a NEW
  -- table in public. anon and authenticated read through the policy above;
  -- service_role reads it for the daily publishers. Nothing writes here but
  -- this function. Guarded by tests/supabase_table_grants_test.py.
  grant select on public.map_cx_exhibit_guidance to anon, authenticated, service_role;
end $fn$;

-- AFTER (live prosrc md5 read back once the migration returned success, 2026-09-23 ~17:2xZ;
-- each equals the md5 of the body above, so live == repo byte for byte):
--   rebuild_map_cleanup_worklist        6d86450d26d29fd31897be962986bb60
--   rebuild_map_college_credit_summary  a5ac48cfccf653d4837937893da976f0
--   rebuild_map_college_goal2           7867dd6f344f466b77d60dd0cba1486b
--   rebuild_map_cx_exhibit_guidance     5d923ec965ea575847cd2c53291a7941
--   rebuild_map_transcribed_gap         bce0f7b454400fa5224c5d5343fff685
-- Owner postgres, security definer, search_path=public and EXECUTE (postgres, service_role)
-- unchanged. NEXT: after the 2026-09-24 13:40 UTC promotion, confirm its map_data_loads row
-- and has_table_privilege(anon/authenticated/service_role, <table>, 'select') on all five.
