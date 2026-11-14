# Honors S652 follow-ups (dry run, 2026-11-14)

After the two-row delete (run 43607926526), the conductor's two follow-ups under Sam's standing view (CCN structures are the gold standard: no base holds an Honors course). Nothing here is applied.

## The writes

- UPDATE `HUMA M1110` unified_title *World Religions (Honors)* to *World Religions* (value alone; reviewer and reviewed_at kept, as the S649 CVMA update).
- UPDATE `LIBR M1040` unified_title *Media & Information Literacy (Honors)* to *Media & Information Literacy* (value alone; reviewer and reviewed_at kept, as the S649 CVMA update).
- INSERT `HUMA M10ME` merge_dismissed `HUMA M10ME|HUMA M10OI|HUMA M1110` (honors-s652@bot).
- INSERT `LIBR M1040` merge_dismissed `LIBR M1040|LIBR M10CJ` (honors-s652@bot).

No title row for the Honors records: The export builds a stand-alone row's title from its catalog record and the worklist replays a curated title only on a merge target, so a unified_title row on HUMA M10ME or LIBR M10CJ would be inert; the CCN form waits for an export change or card 3's Honors build.

`kb/migrations/2026-11-14_s652_honors_followups.sql`, one plain statement on one guard; rollback `kb/migrations/2026-11-14_s652_honors_followups_rollback.sql`.

## Simulated (export on the post-delete overlay, then on the post-follow-up overlay)

- `HUMA M10ME`: title *World Religions (Honors)* to *World Religions (Honors)*; Stand-Alone, 1 members.
- `LIBR M10CJ`: title *Media & Information Literacy (Honors)* to *Media & Information Literacy (Honors)*; Stand-Alone, 1 members.
- `HUMA M1110`: title *World Religions (Honors)* to *World Religions*; Course, 10 members.
- `LIBR M1040`: title *Media & Information Literacy (Honors)* to *Media & Information Literacy*; Course, 3 members.

Suggestion groups naming an Honors record or its base:

- after_delete: groups `LIBR M1040|LIBR M10CJ` (score 0.84): offered
- after_delete: groups `HUMA M10ME|HUMA M10OI|HUMA M1110` (score 0.527): offered
- after_followups: groups `LIBR M1040|LIBR M10CJ` (score 0.84): held by a dismissal
- after_followups: groups `HUMA M10ME|HUMA M10OI|HUMA M1110` (score 0.527): held by a dismissal

Checks: the post-delete payload offers both pairs: True; every pairing group is held after: True; every dismissal is a pairing group's signature: True; the bases read their new titles: True; the Honors records stay stand-alone: True.

## The conductor's read before the apply (one JSON value)

```sql
select jsonb_build_object('title_rows', (select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id), '[]'::jsonb) from public.kb_curation k where k.field = 'unified_title' and k.course_id in ('HUMA M1110', 'LIBR M1040')), 'rows_on_honors_records', (select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id, k.field), '[]'::jsonb) from public.kb_curation k where k.course_id in ('HUMA M10ME', 'LIBR M10CJ')), 'insert_slots_taken', (select count(*) from public.kb_curation k where (k.course_id, k.field) in (('HUMA M10ME', 'merge_dismissed'), ('LIBR M1040', 'merge_dismissed'))), 'dismissals_naming_the_ids', (select coalesce(jsonb_agg(jsonb_build_object('course_id', k.course_id, 'value', k.value, 'reviewer', case when k.reviewer_email like '%@bot' then k.reviewer_email else 'a person' end)), '[]'::jsonb) from public.kb_curation k where k.field = 'merge_dismissed' and (k.value like '%HUMA M10ME%' or k.value like '%LIBR M10CJ%' or k.value like '%HUMA M1110%' or k.value like '%LIBR M1040%')), 'person_rows', (select count(*) from public.kb_curation p where p.reviewer_email not like '%@bot' and (p.course_id in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040') or (p.field in ('merge_into', 'unified_title_merge_confirm', 'merge_dismissed') and (p.value like '%HUMA M10ME%' or p.value like '%LIBR M10CJ%' or p.value like '%HUMA M1110%' or p.value like '%LIBR M1040%')))));
```
