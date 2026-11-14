-- DRAFT. Rollback for 2026-11-14_s653_honors_of_rows.sql: the step-2 cohort's rows go, keyed on the cohort
-- (honors-rows-s653@bot) and the field, never on ids, so it finds every row after a mint re-keys them (#3315's
-- review, item 2). Step 1's rows are another cohort and stay (their own rollback removes them, and refuses while
-- any row of this cohort stands). A row a person re-saved carries the person's reviewer and is never touched; a
-- row a person validated (the Verify control stamps every row of a course) stays, counted as kept_for_a_person.
-- The result is the count and an md5 over the deleted rows (course_id>value, | joined, C order). They equal the
-- forward result (347, 7d733405d750a50bb359e1bea7665ed7) only before a mint and while no person has re-saved or validated a
-- row; a difference names rows a person now owns or a mint moved.
with kept as (
  select count(*) as n from public.kb_curation k
  where k.reviewer_email = 'honors-rows-s653@bot' and k.field = 'honors_of'
    and not (k.validated_by is null or k.validated_by like '%@bot')
),
removed as (
  delete from public.kb_curation k
  where k.reviewer_email = 'honors-rows-s653@bot' and k.field = 'honors_of'
    and (k.validated_by is null or k.validated_by like '%@bot')
  returning k.course_id, k.value
)
select jsonb_build_object('deleted', count(*), 'kept_for_a_person', (select n from kept), 'md5',
       md5(coalesce(string_agg(r.course_id || '>' || r.value, '|' order by r.course_id collate "C"), ''))) as undone
from removed r;
-- Read back: expect 0 rows under honors-rows-s653@bot, apart from any a person validated.
