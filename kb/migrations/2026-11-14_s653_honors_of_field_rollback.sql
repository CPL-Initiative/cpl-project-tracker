-- DRAFT. Rollback for 2026-11-14_s653_honors_of_field.sql, keyed on the new stamps (COBIx's review of #3304, item 2).
-- The two base titles take back the June stamp (automerge-v1@bot, 2026-06-12T22:47:01.69179+00:00) only where they
-- still read honors-s652@bot with the value the forward statement left (a person's later edit wins and stays); the
-- cohort's two honors_of rows go. The forward receipt (kb/receipts/migration_s653_honors_of_field_<run>.json) holds
-- each before-image. Run this BEFORE 2026-11-14_s652_honors_followups_rollback.sql, which keys on the June stamp.
with expected (course_id, value) as (
  values ('HUMA M1110', 'World Religions'), ('LIBR M1040', 'Media & Information Literacy')
),
restored as (
  update public.kb_curation k
  set reviewer_email = 'automerge-v1@bot', reviewed_at = '2026-06-12T22:47:01.69179+00:00'::timestamptz
  from expected e
  where k.course_id = e.course_id and k.field = 'unified_title' and k.value = e.value
    and k.reviewer_email = 'honors-s652@bot'
  returning jsonb_build_object('op', 'restamp_back', 'course_id', k.course_id) as image
),
removed as (
  delete from public.kb_curation k
  where k.reviewer_email = 'honors-s653@bot' and k.field = 'honors_of'
    and k.course_id in ('HUMA M10ME', 'LIBR M10CJ')
  returning jsonb_build_object('op', 'delete', 'row', to_jsonb(k)) as image
)
select coalesce(jsonb_agg(x.image), '[]'::jsonb) as undone
from (select image from restored union all select image from removed) x;
-- Read back: expect the two titles under automerge-v1@bot, 2026-06-12, and no honors-s653@bot row on the two ids.
