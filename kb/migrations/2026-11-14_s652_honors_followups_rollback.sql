-- Rollback for 2026-11-14_s652_honors_followups.sql: the two bases take back their before-values, and the cohort's two
-- inserts go. The forward receipt (kb/receipts/migration_s652_honors_followups_<run>.json) holds every before-image. One plain
-- statement on one guard: it runs only while BOTH titles still hold the follow-up's value under the same reviewer
-- and stamp, and otherwise raises and changes nothing. A title restamped since (S653 step 1 moves both to
-- honors-s652@bot: run 2026-11-14_s653_honors_of_field_rollback.sql first) or edited by a person refuses the whole
-- rollback, so the Keep as-is rows are never deleted while a title stays unrestored (#3315's review, item 3). The
-- delete keys on the cohort and the field, never on ids (the anchored plan mints no HUMA M1110H; #3315). A
-- row a person has validated stays, and the result counts it (kept_for_a_person).
with expected (course_id, value_before, value_after) as (
  values
    ('HUMA M1110', 'World Religions (Honors)', 'World Religions'),
    ('LIBR M1040', 'Media & Information Literacy (Honors)', 'Media & Information Literacy')
),
target as (
  select k.* from public.kb_curation k join expected e on e.course_id = k.course_id where k.field = 'unified_title'
),
guard as (
  select (select count(*) from target t join expected e on e.course_id = t.course_id
          where t.value = e.value_after and t.reviewer_email = 'automerge-v1@bot'
            and t.reviewed_at::timestamptz = '2026-06-12T22:47:01.69179+00:00'::timestamptz) = 2 as ok,
         (select count(*) from target t where t.reviewer_email <> 'automerge-v1@bot') as restamped,
         (select count(*) from public.kb_curation c where c.reviewer_email = 'honors-s652@bot'
          and c.field = 'merge_dismissed' and not (c.validated_by is null or c.validated_by like '%@bot')) as kept,
         (select count(*) from target) as title_rows
),
restored as (
  update public.kb_curation k
  set value = e.value_before
  from guard g, expected e
  where g.ok and k.course_id = e.course_id and k.field = 'unified_title' and k.value = e.value_after
    and k.reviewer_email = 'automerge-v1@bot' and k.reviewed_at::timestamptz = '2026-06-12T22:47:01.69179+00:00'::timestamptz
  returning jsonb_build_object('op', 'restore', 'course_id', k.course_id, 'value', k.value) as image
),
removed as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.reviewer_email = 'honors-s652@bot' and k.field = 'merge_dismissed'
    and (k.validated_by is null or k.validated_by like '%@bot')
  returning jsonb_build_object('op', 'delete', 'row', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from restored) = 2
                 and (select count(*) from removed) + g.kept = 2
            then jsonb_build_object('kept_for_a_person', g.kept, 'changed',
                   (select coalesce(jsonb_agg(x.image), '[]'::jsonb)
                    from (select image from restored union all select image from removed) x))
            else ('refused by the guard: ' || g.title_rows || ' title rows, ' || g.restamped
                  || ' under another reviewer, and both must hold the follow-up value under the June stamp')::int::text::jsonb
       end as undone
from guard g;
-- Read back: expect the two bases' "(Honors)" titles and no honors-s652@bot row.
