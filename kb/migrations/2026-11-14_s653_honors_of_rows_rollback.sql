-- DRAFT. Rollback for 2026-11-14_s653_honors_of_rows.sql: the step-2 cohort's rows go, keyed on the cohort
-- (honors-rows-s653@bot) and the field, never on ids, so it finds every row after a mint re-keys them (#3315's
-- review, item 2). Step 1's rows are another cohort and stay (their own rollback removes them, and refuses while
-- any row of this cohort stands). A row a person re-saved carries the person's reviewer and is never touched.
-- The result is the count and an md5 over the deleted rows (course_id>value, | joined, C order); before a mint it
-- equals the forward digest (20d4fab9316392f96b1f48039acdba98).
with removed as (
  delete from public.kb_curation k
  where k.reviewer_email = 'honors-rows-s653@bot' and k.field = 'honors_of'
  returning k.course_id, k.value
)
select jsonb_build_object('deleted', count(*), 'md5',
       md5(coalesce(string_agg(r.course_id || '>' || r.value, '|' order by r.course_id collate "C"), ''))) as undone
from removed r;
-- Read back: expect 0 rows under honors-rows-s653@bot.
