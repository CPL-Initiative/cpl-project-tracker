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
  with no_credit as (
    select college_id, student_key,
      case
        when credit_rec ilike '%credit is not recommended%'   then 'ace-no-credit'
        when credit_rec ilike '%individualized%'
          or credit_rec ilike '%individualised%'              then 'ace-individualized'
        else                                                       'zero-hour-rec'
      end as sub
    from public.map_student_credit
    where cpl_status_plan = 'Needs Action'
      and (credit_rec ilike '%credit is not recommended%'
        or credit_rec ilike '%individualized%'
        or credit_rec ilike '%individualised%'
        or credit_rec ~* '^\s*0\s+(hours?|semester)')
  ),
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
           'Rule these Not Applicable. ACE has already said no credit is recommended, so there is nothing to award and they only depress the disposition rate.' as action,
           count(*) as rows, count(distinct student_key) as students, 0::numeric as units
    from no_credit group by 1,2,3
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
  'Team-phrase gated because every row is a per-college AGGREGATE - no student grain '
  'survives the group-by, so Customer Success does not need reviewer access. '
  'NO k-anonymity: internal team tool, never a public surface.';

revoke all on function public.rebuild_map_cleanup_worklist() from public, anon, authenticated;
