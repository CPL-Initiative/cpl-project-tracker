-- DRAFT. Rollback for 2026-11-14_s653_honors_of_rows.sql: the step-2 cohort's rows go, keyed on the cohort
-- (honors-rows-s653@bot) and the field, never on ids (#3315's first review, item 2). One plain statement on one
-- guard, which raises and changes nothing while any kb_curation row is keyed on an H id: the step-4 mint has
-- landed, and a minted H id would lose its honors_of row while its pair hold stands on the field (COBIx on
-- #3315, 18:15Z and 18:47Z). Run the mint's own rollback first; then this. Step 1's rows are another cohort and
-- stay (their own rollback removes them, and refuses while a removable row of this cohort stands). A row a
-- person re-saved carries the person's reviewer and is never touched; a row a person validated (the Verify
-- control stamps every row of a course) stays, counted as kept_for_a_person, and blocks no other rollback.
-- The result is the count and an md5 over the deleted rows (course_id>value, | joined, C order). They equal the
-- forward result (380, 29667c0741e7e7fafb509b4c2937e9db) while no person has re-saved or validated a row; a difference names
-- rows a person now owns.
with minted as (
  select count(*) as n from public.kb_curation h where h.course_id ~ '^[A-Z]{1,6} [MZ][0-9][A-Z0-9]{3}H$'
),
kept as (
  select count(*) as n from public.kb_curation k
  where k.reviewer_email = 'honors-rows-s653@bot' and k.field = 'honors_of'
    and not (k.validated_by is null or k.validated_by like '%@bot')
),
guard as (
  select (select n from minted) = 0 as ok, (select n from minted) as h_id_rows
),
removed as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.reviewer_email = 'honors-rows-s653@bot' and k.field = 'honors_of'
    and (k.validated_by is null or k.validated_by like '%@bot')
  returning k.course_id, k.value
)
select case when g.ok
            then (select jsonb_build_object('deleted', count(*), 'kept_for_a_person', (select n from kept), 'md5',
                    md5(coalesce(string_agg(r.course_id || '>' || r.value, '|' order by r.course_id collate "C"),
                                 ''))) from removed r)
            else ('refused by the guard: ' || g.h_id_rows || ' kb_curation rows are keyed on an H id, so the step-4'
                  || ' mint has landed; run its rollback first')::int::text::jsonb
       end as undone
from guard g;
-- Read back: expect 0 rows under honors-rows-s653@bot, apart from any a person validated.
