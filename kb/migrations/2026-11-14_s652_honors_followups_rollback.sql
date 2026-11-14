-- Rollback for 2026-11-14_s652_honors_followups.sql: the two bases take back their before-values, and the cohort's two
-- inserts go. The forward receipt (kb/receipts/migration_s652_honors_followups_<run>.json) holds every before-image. One plain
-- statement: a base title is restored only where it still holds the follow-up's value under the same reviewer and
-- stamp (a person's later edit wins and is left alone); only the cohort's honors-s652@bot merge_dismissed rows are deleted.
with expected (course_id, value_before, value_after) as (
  values
    ('HUMA M1110', 'World Religions (Honors)', 'World Religions'),
    ('LIBR M1040', 'Media & Information Literacy (Honors)', 'Media & Information Literacy')
),
restored as (
  update public.kb_curation k
  set value = e.value_before
  from expected e
  where k.course_id = e.course_id and k.field = 'unified_title' and k.value = e.value_after
    and k.reviewer_email = 'automerge-v1@bot' and k.reviewed_at::timestamptz = '2026-06-12T22:47:01.69179+00:00'::timestamptz
  returning jsonb_build_object('op', 'restore', 'course_id', k.course_id, 'value', k.value) as image
),
removed as (
  delete from public.kb_curation k
  where k.reviewer_email = 'honors-s652@bot' and k.field = 'merge_dismissed'
    and k.course_id in ('HUMA M10ME', 'LIBR M1040')
  returning jsonb_build_object('op', 'delete', 'row', to_jsonb(k)) as image
)
select coalesce(jsonb_agg(x.image), '[]'::jsonb) as undone
from (select image from restored union all select image from removed) x;
-- Read back: expect the two bases' "(Honors)" titles and no honors-s652@bot row.
