-- RECEIPT — rebuild_map_college_credit_summary(): per-figure suppression,
-- in-plan figures, real statewide totals. 2026-09-30.
--
-- Authority: Sam's verdicts on sheet 2026-09-30-sierra-credit-source
-- (https://claude.ai/artifact/NT56gHRViNX9ZYnRg8r1KR, collection replies):
--   item 1 "fix"  — suppress each figure on the students behind it
--   item 2 "do"   — applied on the CPL plan, from the student view
--   item 6 note   — "I want Sierra to total for everyone using real numbers but
--                   when the totals (at any level) are below 10, to show \"<10\"
--                   on the views. This should happen without a governance gate."
--
-- WHAT CHANGES LIVE: one `create or replace function` (the body is the one in
-- kb/supabase_map_promote_custom_reports.sql and kb/supabase_map_college_credit_summary.sql),
-- then one call of it. The call drops and re-creates map_college_credit_summary
-- (a derived table the nightly promotion rebuilds anyway) and creates
-- map_college_credit_statewide. No base table is written. map_promote_custom_reports()
-- is NOT touched: it already calls this function inside its transaction, so a
-- failed suppression check rolls the whole nightly load back.
--
-- BEFORE (live, read 2026-09-30 ~15:10 UTC): md5(pg_get_functiondef) =
-- fd346ac3c8cf70b3f472de123d12677b, 2,276 chars. Verbatim below.
--
-- ── ROLLBACK ─────────────────────────────────────────────────────────────
-- Run the two statements under ROLLBACK, then drop the statewide table.
-- The summary comes back exactly as it was, because it is derived: the old
-- function rebuilds it from the same base tables.

-- ROLLBACK 1 of 3 — the function as it stood before.
CREATE OR REPLACE FUNCTION public.rebuild_map_college_credit_summary()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
end $function$
;
-- ROLLBACK 2 of 3 — rebuild the summary with it.
-- select public.rebuild_map_college_credit_summary();
-- ROLLBACK 3 of 3 — the statewide table did not exist before.
-- drop table if exists public.map_college_credit_statewide;
-- Then dispatch college-briefing-publish.yml so the public copy follows.
--
-- ── AFTER ─────────────────────────────────────────────────────────────────
-- Filled in when applied (hash of the new definition, the row counts, the
-- withheld counts, and the public copy's refresh run).
