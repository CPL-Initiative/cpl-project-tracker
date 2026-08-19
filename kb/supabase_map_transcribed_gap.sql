-- map_transcribed_gap — the follow-up detail behind clean-up priority 2.
--
-- Sam, 2026-08-19: "For the defects you found we want to follow up on those."
--
-- The worklist says a college HAS this problem. This says WHERE, at the grain a
-- college can actually search on in MAP: exhibit × catalog year.
--
-- ⚠️ WE CANNOT NAME THE STUDENTS, and that is by design, not an oversight.
-- StudentMAPID is salt-hashed and never stored; student_key is our own counting
-- surrogate, re-assigned on every nightly load, and identifies nobody. So a
-- college cannot be handed a list of names — they locate these records in MAP
-- themselves by filtering the exhibit and catalog year below. Anyone tempted to
-- "improve" this by storing a durable student identifier should read
-- docs/map_dataset_sql_for_malone.md first: we asked MAP for a one-way hash
-- precisely so nobody here holds one.
--
-- ⚠️ "Units at stake" is NOT units lost. The plan says transcribed and the
-- units say nothing, which is consistent with TWO different stories:
--   (a) the credit was transcribed and the amount never got recorded, or
--   (b) it was never transcribed and the tick is wrong.
-- Only the college can say which. The whole point of the follow-up is to find
-- out, so the column is named for the question rather than for an answer.
--
-- ⚠️ Measured PER STUDENT. cpl_plan_status is a student-record attribute that
-- MAP stamps onto every CR row (Sam confirmed, 2026-08-19; constant within a
-- student for 47,804 of 47,804). A row-level test reports a grain artefact as a
-- defect. Sam also flagged that MAP intends to allow transcribed check marks on
-- CR rows LATER — when that ships, re-measure the constant-within-student test
-- before trusting this view.

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
end $$;

comment on table public.map_transcribed_gap is
  'Follow-up detail for clean-up priority 2: students whose CPL plan is marked '
  'Transcribed but who have NO transcribed units anywhere, broken out by exhibit '
  'and catalog year so a college can find them in MAP. Students are NOT named and '
  'cannot be - the MAP id is hashed and never stored. units_at_stake is the '
  'question, not the answer: the credit may have been transcribed and not '
  'recorded, or never transcribed at all. Team-phrase gated; rebuilt nightly.';

revoke all on function public.rebuild_map_transcribed_gap() from anon, authenticated;
