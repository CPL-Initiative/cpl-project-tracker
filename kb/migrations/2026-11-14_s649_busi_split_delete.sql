-- Re-clustering S649: remove one row the title-matching bot saved, so the BUSI M1228 split is clean.
-- Sam, Open Asks Sheet 195 card 3, 01:18Z 2026-11-14: "Remove the row" (sam-sheet-195-answers-2026-11-14), carrying
-- out his Sheet 186 card 6 split of BUSI M1228 (d-busi-split-held-for-delete-s648). Plan:
-- kb/reclustering_s649_out/2026-11-14/plan.md. Written by kb/_reclustering_s649.py --sql.
-- The row: (BUSI M10XW, merge_into, BUSI M1228), automerge-titlelane-v1@bot, 2026-06-13T17:47:56.243497+00:00.
-- With it gone, Santa Ana College BUS 115 (CCC000609492) returns to its own record BUSI M10XW; nothing is inserted.
-- One plain statement: the delete runs only when the guard holds, and a failed guard raises, so nothing is written.
-- The guard: exactly one row at (BUSI M10XW, merge_into), with this value, reviewer and reviewed_at, never
-- validated by a person (validated_at and validated_by null, as the rollback re-inserts them); and no row by a
-- reviewer outside @bot, in merge_into, unified_title_merge_confirm, merge_dismissed, whose course_id or
-- value names BUSI M10XW or BUSI M1228. RETURNING puts the whole deleted row (to_jsonb) into the runner's receipt
-- (kb/receipts/migration_s649_busi_split_delete_<run>.json, its `response`), so a session that did not do the write
-- can put it back. Rollback: kb/migrations/2026-11-14_s649_busi_split_delete_rollback.sql.

with target as (
  select k.* from public.kb_curation k
  where k.course_id = 'BUSI M10XW' and k.field = 'merge_into'
),
person as (
  select count(*) as n from public.kb_curation p
  where p.reviewer_email not like '%@bot'
    and p.field in ('merge_into', 'unified_title_merge_confirm', 'merge_dismissed')
    and (p.course_id in ('BUSI M10XW', 'BUSI M1228') or p.value like '%BUSI M10XW%' or p.value like '%BUSI M1228%')
),
guard as (
  select (select count(*) from target) = 1
     and (select count(*) from target t
          where t.value = 'BUSI M1228'
            and t.reviewer_email = 'automerge-titlelane-v1@bot'
            and t.reviewed_at::timestamptz = '2026-06-13T17:47:56.243497+00:00'::timestamptz
            and t.validated_at is null
            and t.validated_by is null) = 1
     and (select n from person) = 0 as ok,
     (select count(*) from target) as target_rows,
     (select n from person) as person_rows
),
gone as (
  delete from public.kb_curation k
  using guard g
  where g.ok and k.course_id = 'BUSI M10XW' and k.field = 'merge_into'
  returning to_jsonb(k) as image
)
select case when g.ok and (select count(*) from gone) = 1
            then (select jsonb_agg(image) from gone)
            else ('refused by the guard: target rows ' || g.target_rows || ', person rows ' || g.person_rows
                  || ', or the row differs from the plan')::int::text::jsonb
       end as deleted
from guard g;

-- Read back: expect 0.
--   select count(*) from public.kb_curation where course_id = 'BUSI M10XW' and field = 'merge_into';
