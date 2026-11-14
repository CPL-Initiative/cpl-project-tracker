-- Honors S652: delete two rows the June auto-merge saved, so two Honors courses stand apart from their bases.
-- Sam, Open Asks Sheet 197 card 2, 14:35Z 2026-11-14, his own call: "delete" (Delete both rows). It carries out his
-- Sheet 191 card 1 ruling (sam-honors-own-mid-2026-11-13): an Honors course gets its own M-ID. Plan:
-- kb/honors_delete_s652_out/2026-11-14/plan.md. Written by kb/_honors_two_row_delete_s652.py --sql.
-- The rows:
--   (HUMA M10ME, merge_into, HUMA M1110), automerge-v1@bot, 2026-06-12T22:47:01.69179+00:00
--   (LIBR M10CJ, merge_into, LIBR M1040), automerge-v1@bot, 2026-06-12T22:47:01.69179+00:00
-- With them gone, MiraCosta College RELG 101H (CCC000588084) returns to its own record HUMA M10ME and LIBR 201H
-- (CCC000572223) to LIBR M10CJ; nothing is inserted.
-- One plain statement: the delete runs only when the guard holds, and a failed guard raises, so nothing is written.
-- The guard: exactly these two rows at their (course_id, field) keys, each with its value, this reviewer and this
-- reviewed_at, never validated (validated_at and validated_by null, as the rollback re-inserts them); exactly
-- 0 rows by a reviewer outside @bot on HUMA M10ME, LIBR M10CJ, HUMA M1110, LIBR M1040, or in merge_into, unified_title_merge_confirm, merge_dismissed naming one
-- of them (the conductor's read); no row by anyone pointing into HUMA M10ME or LIBR M10CJ; no CN: row re-homing either
-- Honors course. RETURNING puts each whole deleted row (to_jsonb) into the runner's receipt
-- (kb/receipts/migration_s652_honors_two_row_delete_<run>.json, its `response`), so a session that did not do the write can put them
-- back. Rollback: kb/migrations/2026-11-14_s652_honors_two_row_delete_rollback.sql.

with target as (
  select k.* from public.kb_curation k
  where (k.course_id = 'HUMA M10ME' and k.field = 'merge_into') or (k.course_id = 'LIBR M10CJ' and k.field = 'merge_into')
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and (p.course_id in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040')
         or (p.field in ('merge_into', 'unified_title_merge_confirm', 'merge_dismissed') and (p.value like '%HUMA M10ME%' or p.value like '%LIBR M10CJ%' or p.value like '%HUMA M1110%' or p.value like '%LIBR M1040%')))
),
inward as (
  select count(*) as n from public.kb_curation i
  where (i.field = 'merge_into' and i.value in ('HUMA M10ME', 'LIBR M10CJ')) or i.course_id in ('CN:CCC000588084', 'CN:CCC000572223')
),
guard as (
  select (select count(*) from target) = 2
     and (select count(*) from target t
          where ((t.course_id = 'HUMA M10ME' and t.value = 'HUMA M1110')
         or (t.course_id = 'LIBR M10CJ' and t.value = 'LIBR M1040'))
            and t.field = 'merge_into'
            and t.reviewer_email = 'automerge-v1@bot'
            and t.reviewed_at::timestamptz = '2026-06-12T22:47:01.69179+00:00'::timestamptz
            and t.validated_at is null
            and t.validated_by is null) = 2
     and (select n from person) = 0
     and (select n from inward) = 0 as ok,
     (select count(*) from target) as target_rows,
     (select n from person) as person_rows,
     (select n from inward) as inward_rows
),
gone as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.reviewer_email = 'automerge-v1@bot'
    and ((k.course_id = 'HUMA M10ME' and k.field = 'merge_into') or (k.course_id = 'LIBR M10CJ' and k.field = 'merge_into'))
  returning to_jsonb(k) as image
)
select case when g.ok and (select count(*) from gone) = 2
            then (select jsonb_agg(image order by image->>'course_id') from gone)
            else ('refused by the guard: target rows ' || g.target_rows || ', person rows ' || g.person_rows
                  || ', rows pointing in ' || g.inward_rows || ', or a row differs from the plan')::int::text::jsonb
       end as deleted
from guard g;

-- Read back: expect 0.
--   select count(*) from public.kb_curation where course_id in ('HUMA M10ME', 'LIBR M10CJ') and field = 'merge_into';
