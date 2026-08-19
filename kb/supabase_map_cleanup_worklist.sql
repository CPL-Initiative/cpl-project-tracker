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
-- ⚠️ SECURITY: `security_invoker = on` is REQUIRED and is not decoration. This
-- view reads map_student_credit, which is REVIEWER-ONLY at student grain.
-- Without it the view runs with the definer's rights and silently bypasses the
-- RLS it inherits — the exact defect gr_open_sections had. Every MAP team
-- member is on the reviewer roster (10 as of 2026-08-19), so reviewer-only
-- still reaches everyone who needs it, and no new gate or suppression scheme
-- had to be invented.
--
-- ⚠️ Counts here are of ROWS and STUDENTS at one college; they are not
-- published figures and must not be put on a public surface without the
-- k-anonymity that map_college_credit_summary applies.

drop view if exists public.map_cleanup_worklist;

create view public.map_cleanup_worklist
with (security_invoker = on) as

-- ── 1-3 · Recommendations that CANNOT yield credit, sitting at Needs Action ──
-- ACE reviewed these and said no credit, or said it needs an individual
-- assessment, or recommended zero hours. A college cannot act on them except
-- to rule them Not Applicable, so they inflate every backlog denominator and
-- depress every disposition rate while representing no opportunity at all.
-- One rule clears the lot: "if ACE recommends no credit, mark N/A".
--
-- The three overlap, so they are folded into one class by precedence rather
-- than counted three times.
with no_credit as (
  select college_id, student_key, source_row_id,
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
-- ── 4 · Marked Transcribed in the plan, but the student has NO transcribed
-- units anywhere. Measured PER STUDENT: cpl_plan_status is a student-plan
-- attribute repeated onto every row, so a row-level test reports a grain
-- artefact as a defect (47,804 of 47,804 students carry exactly one value).
plan_per_student as (
  select college_id, student_key,
         max(cpl_plan_status)                    as plan,
         coalesce(sum(transcribed_credits), 0)   as transcribed,
         max(case when cpl_plan_status = 'Transcribed' then 1 else 0 end) as bare_tick,
         count(*)                                as rows
  from public.map_student_credit group by 1,2
),
transcribed_gap as (
  select college_id, student_key, rows,
         case when bare_tick = 1 then 'transcribed-no-units-batch'
              else 'transcribed-no-units-workflow' end as sub
  from plan_per_student
  where plan ilike '%transcribed%' and transcribed = 0
),
-- ── 5 · Marked Applied to CPL Plan with zero applied units.
-- ⚠️ The disposition filter is load-bearing. On ALL 462,355 Needs Action rows
-- applied_credits is IDENTICAL to articulated_credits, so `applied_credits > 0`
-- alone is not a test for "credit was awarded" — it is a test for "credit
-- exists". Scoped properly the two applied measures agree to 0.1%.
applied_gap as (
  select college_id, student_key, source_row_id
  from public.map_student_credit
  where cpl_status_plan = 'Applied to CPL Plan' and coalesce(applied_credits, 0) = 0
),
-- ── 6 · Articulations sitting in the approval cascade. NOT a defect — a
-- QUEUE, and the only class here that names its own owner. Counted at
-- articulation grain because rows overstate a queue: many students share one.
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
         'Not a defect — a queue. This articulation is part-way through the approval cascade and is waiting on the named stage.',
         count(*), sum(rows), round(sum(units))
  from approval_queue where stage <> 'Implementation' group by 1,2,3,4,5,6,7
)
select
  i.college_id,
  c.college_name,
  i.priority,
  i.class,
  i.subclass,
  i.effort_shape,
  i.owner,
  i.rows,
  i.students,
  i.units,
  i.action
from items i
left join public.map_colleges c on c.college_id = i.college_id;

comment on view public.map_cleanup_worklist is
  'Prioritised per-college CPL clean-up list, derived live from map_student_credit. '
  'Ranked by DECISIONS not rows: priority 1 resolves under one rule per college. '
  'security_invoker = on, so it inherits the reviewer-only gate on the student '
  'grain — do NOT publish these counts without k-anonymity.';

revoke all on public.map_cleanup_worklist from anon;
