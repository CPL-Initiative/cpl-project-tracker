-- Honors S652 follow-ups: the bases' titles, and the pairs held apart.
-- After Sam's Sheet 197 card 2 delete (14:35Z 2026-11-14, "delete"; run 43607926526, kb/receipts/migration_s652_honors_two_row_delete_43607926526.json), MiraCosta
-- College's RELG 101H and LIBR 201H stand on their own records. The conductor carries out the delete's two follow-ups
-- under Sam's standing view (an M-ID is our own construct; CCN structures are the gold standard, and no base holds an
-- Honors course). Plan: kb/honors_delete_s652_out/2026-11-14/followups_plan.md. Written by kb/_honors_followups_s652.py --sql.
--   UPDATE HUMA M1110 unified_title: 'World Religions (Honors)' to 'World Religions'
--   UPDATE LIBR M1040 unified_title: 'Media & Information Literacy (Honors)' to 'Media & Information Literacy'
--   INSERT HUMA M10ME merge_dismissed: 'HUMA M10ME|HUMA M10OI|HUMA M1110'
--   INSERT LIBR M1040 merge_dismissed: 'LIBR M1040|LIBR M10CJ'
-- The two updates change the value alone: reviewer_email and reviewed_at stay the June auto-merge's, as the S649 CVMA
-- update kept its rows' stamps; the result carries each row's before-image. The two inserts are cohort honors-s652@bot.
-- One plain statement: the writes hang on one guard CTE, and a failed guard raises, so nothing is written. The guard:
-- exactly the two title rows, each with its before-value, automerge-v1@bot and 2026-06-12T22:47:01.69179+00:00, never validated; no row at all on
-- HUMA M10ME or LIBR M10CJ (so the delete has landed); neither insert's slot taken; no row by a reviewer outside @bot on
-- the four ids, or in merge_into, unified_title_merge_confirm or merge_dismissed naming one of them.
-- RETURNING puts every change (each update's before-image and after-value, each insert whole) into the runner's
-- receipt (kb/receipts/migration_s652_honors_followups_<run>.json). Rollback: kb/migrations/2026-11-14_s652_honors_followups_rollback.sql.

with expected (course_id, value_before, value_after) as (
  values
    ('HUMA M1110', 'World Religions (Honors)', 'World Religions'),
    ('LIBR M1040', 'Media & Information Literacy (Honors)', 'Media & Information Literacy')
),
target as (
  select k.* from public.kb_curation k
  where k.field = 'unified_title' and k.course_id in (select course_id from expected)
),
leaf_rows as (
  select count(*) as n from public.kb_curation l where l.course_id in ('HUMA M10ME', 'LIBR M10CJ')
),
slots as (
  select count(*) as n from public.kb_curation s where (s.course_id, s.field) in (('HUMA M10ME', 'merge_dismissed'), ('LIBR M1040', 'merge_dismissed'))
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and (p.course_id in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040')
         or (p.field in ('merge_into', 'unified_title_merge_confirm', 'merge_dismissed') and (p.value like '%HUMA M10ME%' or p.value like '%LIBR M10CJ%' or p.value like '%HUMA M1110%' or p.value like '%LIBR M1040%')))
),
guard as (
  select (select count(*) from target) = 2
     and (select count(*) from target t join expected e on e.course_id = t.course_id
          where t.value = e.value_before
            and t.reviewer_email = 'automerge-v1@bot'
            and t.reviewed_at::timestamptz = '2026-06-12T22:47:01.69179+00:00'::timestamptz
            and t.validated_at is null
            and t.validated_by is null) = 2
     and (select n from leaf_rows) = 0
     and (select n from slots) = 0
     and (select n from person) = 0 as ok,
     (select count(*) from target) as target_rows,
     (select n from leaf_rows) as leaf_rows,
     (select n from slots) as slot_rows,
     (select n from person) as person_rows
),
retitled as (
  update public.kb_curation k
  set value = e.value_after
  from guard g, target t, expected e
  where g.ok and k.course_id = t.course_id and k.field = t.field and e.course_id = t.course_id
    and k.value = e.value_before and k.reviewer_email = 'automerge-v1@bot'
  returning jsonb_build_object('op', 'update', 'value_after', k.value, 'row_before', to_jsonb(t)) as image
),
added as (
  insert into public.kb_curation as k (course_id, field, value, reviewer_email)
  select v.course_id, v.field, v.value, 'honors-s652@bot'
  from guard g cross join (values
    ('HUMA M10ME', 'merge_dismissed', 'HUMA M10ME|HUMA M10OI|HUMA M1110'),
    ('LIBR M1040', 'merge_dismissed', 'LIBR M1040|LIBR M10CJ')
  ) as v (course_id, field, value)
  where g.ok
  on conflict (course_id, field) do nothing
  returning jsonb_build_object('op', 'insert', 'row', to_jsonb(k)) as image
)
select case when g.ok and (select count(*) from retitled) = 2 and (select count(*) from added) = 2
            then (select jsonb_agg(x.image) from (select image from retitled union all select image from added) x)
            else ('refused by the guard: title rows ' || g.target_rows || ', rows on the Honors records '
                  || g.leaf_rows || ', taken slots ' || g.slot_rows || ', person rows ' || g.person_rows
                  || ', or a row differs from the plan')::int::text::jsonb
       end as changed
from guard g;

-- Read back: expect the two bases' titles without "(Honors)", and two honors-s652@bot merge_dismissed rows.
--   select course_id, field, value, reviewer_email from public.kb_curation where course_id in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040') and field in ('unified_title', 'merge_dismissed') order by 1, 2;
