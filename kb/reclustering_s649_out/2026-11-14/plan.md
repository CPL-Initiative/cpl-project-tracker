# Re-clustering S649: the BUSI row delete and the Honors step, dry-run plan (2026-11-14)

Written by `kb/_reclustering_s649.py --plan`. Nothing was applied. Every id is in `plan.json` beside this file.

Rulings: Open Asks Sheet 195, Complete pressed at 01:18Z 2026-11-14, Sam's own call, no notes (`sam-sheet-195-answers-2026-11-14`): card 3 *Remove the row*; card 2 *Take every recommendation*. They carry out Sheet 186 card 6 (`sam-sheet-186-six-cases-as-recommended-2026-11-13`) and Sheet 191 card 1 (`sam-honors-own-mid-2026-11-13`).

Alias chain: newest applied map `kb/anchor_rekey_out/2026-11-08/alias_map.json`, 0 maps pending; every named id resolves to itself. Members file generated 2026-11-14 00:57; overlay synced 2026-11-14T00:56:31Z.

## A. The BUSI M1228 split: one guarded DELETE, no insert

| | course_id | field | value | reviewer_email | reviewed_at |
|---|---|---|---|---|---|
| before | BUSI M10XW | merge_into | BUSI M1228 | automerge-titlelane-v1@bot | 2026-06-13T17:47:56.243497+00:00 |
| after | (no row) | | | | |

The course: Santa Ana College BUS 115 *Global Supply Chain and Logistics* (control CCC000609492, 3 units, no COCI C-ID or CCN, no ASCCC approval), sitting under BUSI M1228 by the bot's row alone (`leaf_merge_into`). Its own record BUSI M10XW is a stand-alone in `kb/coci_minted_singletons.json` (*Global Supply Chain and Logistics*, Business).

Inserted under `reclustering-s649@bot`: nothing. BUS 115's own leaf is BUSI M10XW, a stand-alone record in kb/coci_minted_singletons.json (control CCC000609492); with the bot's row gone nothing folds it anywhere, nothing points into it and no CN: row re-homes the course, so the export emits it as its own row. The delete alone carries out the split; an insert would mint a second record beside a live one (the S648 plan's route B residue).

The overlay rows naming either id are all the bot's: nine `merge_into` pointers into BUSI M1228 (this one among them) and BUSI M1228's `unified_title` *International Documentation and Supply Chain Management*, all saved 2026-06-13 17:47Z. The other eight pointers and the title stay; the title is Santa Ana BUS 114's, which stays.

**The guard** (one statement, `kb/migrations/2026-11-14_s649_busi_split_delete.sql`): exactly one row at (BUSI M10XW, merge_into) with this value, reviewer and reviewed_at and no person's validation; and no row by a reviewer outside `@bot` in merge_into, unified_title_merge_confirm or merge_dismissed naming BUSI M10XW or BUSI M1228. A failed guard raises, so the statement writes nothing. The deleted row comes back whole (`to_jsonb`) in the receipt's `response`.

**The rollback** (`kb/migrations/2026-11-14_s649_busi_split_delete_rollback.sql`): re-inserts the row with its reviewer and reviewed_at, `on conflict do nothing` so a row saved in the slot since wins.

**What the next daily run does:**

From `post_apply_simulated.json`, simulated, not applied: export_unified_courses() run through its UC_KB_DIR / UC_OUT_DIR seam on kb/ with the BUSI row removed from a copy of the overlay (kb/_reclustering_s649.py --overlay), beside the same run on the untouched kb/ in the same session.

- `BUSI M1228`: members 24 to 23, units [0, 1, 3] to [0, 1, 3]; index row ["BUSI M1228", "International Documentation and Supply Chain Management", "BUS;MGMT;MKT;WARE", "Course", 3.0] to ["BUSI M1228", "International Documentation and Supply Chain Management", "BUS;MGMT;MKT;WARE", "Course", 3.0].
- `BUSI M10XW`: members 0 to 1, units [] to [3]; index row null to ["BUSI M10XW", "Global Supply Chain and Logistics", "BUS", "Stand-Alone", 3.0].
- `unified_courses_index.js`: ids 49,803 to 49,804; ids whose entry changed: BUSI M10XW.
- `unified_courses_members.js`: ids 49,560 to 49,561; ids whose entry changed: BUSI M10XW, BUSI M1228; member rows 134,485 to 134,485.
- Committed files the nightly changes: `kb/coci_curation.json` (BUSI M10XW's entry goes), then the `unified_courses_*.js` export. Not rebuilt nightly, so they keep BUS 115 under BUSI M1228 until their own builders run: `coci_lookup_data.js` (`kb/_build_coci_lookup.py`).

**Pre-apply reads (aggregates or exact keys; the conductor runs them):**

1. Expect `[["BUSI M10XW", "merge_into", "BUSI M1228", "automerge-titlelane-v1@bot", "2026-06-13 17:47:56.243497+00", null, null]]`. If different: the row changed since the conductor's 01:22Z read: hold; the guard would refuse anyway.

```sql
select course_id, field, value, reviewer_email, reviewed_at, validated_at, validated_by from public.kb_curation where course_id = 'BUSI M10XW' and field = 'merge_into';
```

2. Expect `0`. If different: a person saved a merge, a confirm or a Keep as-is naming either id: read it; the guard refuses.

```sql
select count(*) from public.kb_curation where reviewer_email not like '%@bot' and field in ('merge_into', 'unified_title_merge_confirm', 'merge_dismissed') and (course_id in ('BUSI M10XW', 'BUSI M1228') or value like '%BUSI M10XW%' or value like '%BUSI M1228%');
```

3. Expect `[["merge_into", 9], ["unified_title", 1]]`. If different: the bot's ten rows on BUSI M1228 changed (9 pointers including this one, 1 title): read them before applying.

```sql
select field, count(*) from public.kb_curation where (field = 'merge_into' and value = 'BUSI M1228') or course_id = 'BUSI M1228' group by 1 order by 1;
```

4. Expect `0`. If different: something points into BUSI M10XW or re-homes BUS 115: it would follow the course; read it.

```sql
select count(*) from public.kb_curation where (field = 'merge_into' and value = 'BUSI M10XW') or course_id = 'CN:CCC000609492';
```

5. Expect `"course_id, field, value, reviewer_email, reviewed_at (default now()), reviewer_label (generated from reviewer_email, never inserted), validated_at, validated_by; the committed migrations name no other"`. If different: a column the rollback does not name: the tool adds it to the rollback before the apply.

```sql
select column_name, data_type, column_default from information_schema.columns where table_schema = 'public' and table_name = 'kb_curation' order by ordinal_position;
```

post. Expect `0`. If different: the delete did not land; read the receipt's response.

```sql
select count(*) from public.kb_curation where course_id = 'BUSI M10XW' and field = 'merge_into';
```

**`.apply` (the conductor's word only):**

```
file=kb/migrations/2026-11-14_s649_busi_split_delete.sql
name=s649_busi_split_delete
```

Undo: `file=kb/migrations/2026-11-14_s649_busi_split_delete_rollback.sql`, `name=s649_busi_split_delete_rollback`.

## B. Card 2's held cases: no write

- AJ 160: kept as is (Sheet 195 card 2).
- MUS 130: kept as is (Sheet 195 card 2).
- REAL M1038 with REAL M1040: kept apart (Sheet 195 card 2).
- MATH M1036 with MATH M1044: waits until the MAP team settles the refrigeration lab articulation (exhibit MAPCBES-CBES-1-001); a lane NEXT line names who is asked.

## C. Honors, M-IDs only: laid out and stopped for the conductor

Reach: M-IDs only (Sheet 195 card 2, the recommendation). The three identities and their four Honors courses:

- `HUMA M1110` *World Religions (Honors)* (Humanities, 63 members). Route: own record exists: each Honors course is a stand-alone record the June auto-merge folded in; deleting that bot row returns it to its own id, no mint (the BUSI shape, which needs Sam's word for a delete).
  - MiraCosta College RELG 101H *World Religions (Honors)* (3 units, control CCC000588084): sits by `leaf_merge_into`, own record `HUMA M10ME` folded in by automerge-v1@bot at 2026-06-12T22:47:01.69179+00:00; base RELG 101 *World Religions* (control CCC000545257).
- `IDST M1120` *Undergraduate Research Experience* (Interdisciplinary Studies, 34 members). Route: true mint: the Honors courses are members of the identity's own cluster, so a new id and a CN:<control number> merge_into row per course are the only route.
  - Glendale Community College BIOL 298H *Honors Undergraduate Research in Microbiology and Molecular Biology* (4 units, control CCC000658703): sits by `own_leaf`, own record `IDST M1120`; base BIOL 298 *Undergraduate Research in Microbiology and Molecular Biology* (control CCC000651069).
  - Glendale Community College ENGL 298H *Honors Undergraduate Research in Professional Writing* (1 units, control CCC000619132): sits by `own_leaf`, own record `IDST M1120`; base ENGL 298 *Undergraduate Research in Professional Writing* (control CCC000619131).
- `LIBR M1040` *Media & Information Literacy (Honors)* (Library Science, 3 members). Route: own record exists: each Honors course is a stand-alone record the June auto-merge folded in; deleting that bot row returns it to its own id, no mint (the BUSI shape, which needs Sam's word for a delete).
  - MiraCosta College LIBR 201H *Media & Information Literacy (Honors)* (3 units, control CCC000572223): sits by `leaf_merge_into`, own record `LIBR M10CJ` folded in by automerge-v1@bot at 2026-06-12T22:47:01.69179+00:00; base LIBR 201 *Media & Information Literacy* (control CCC000354460).

Why it stops here:

- Numbering: a new Honors M-ID takes its base's number plus H (breaks the four-character shape) or the next free number in its bucket; the S648 sheet asked it (plan.md, Honors question 6) and card 2's five answers do not settle it.
- Two of the three already have their own record (HUMA M10ME, LIBR M10CJ), folded in by automerge-v1@bot on 2026-06-12: the clean route is a delete of a bot row, like card 3, and card 2 authorizes no delete.
- The equivalence row (field honors_of) is a field kb/_apply_curation.py does not fold (FIELDS) and the export does not read: a code change and its tests land before any row, or the row is inert.
- Equivalence direction (one-way or both ways) is unanswered (plan.md, Honors question 2).
- Option (a) on the S648 sheet read 'the equivalence for every pair': 508 pairs already apart would take an honors_of row each; the conductor's brief names the 3 new M-IDs only.
- Two base identities carry the Honors title as their curated title (HUMA M1110 'World Religions (Honors)', trailcrew-ccr3-s112@bot; LIBR M1040 'Media & Information Literacy (Honors)', automerge-v1@bot): once the Honors course leaves, the base keeps an Honors title unless that bot row is changed, which is an UPDATE or DELETE of a saved row.
- IDST M1120's two Glendale Honors courses have different bases (BIOL 298 and ENGL 298); the rule makes one Honors M-ID of both (units 1 to 4).

The atomic steps once those are settled:

1. A code PR: kb/_apply_curation.py FIELDS learns honors_of; export_unified_courses() shows the equivalence on both rows; supabase-rekey.yml and kb/alias_chain.py re-key its value; tests guard each.
2. A dry run under docs/coursecontrolnumber_remint.md: the new id for IDST (and, if the delete route is refused, for HUMA and LIBR) from the bucket's counter, never hand-picked; an alias map is not needed (no id is renamed) but kb/promotions.json is read so no promotion names the moved control numbers.
3. One migration, one plain statement on a guard CTE, cohort reclustering-s649@bot, INSERT-only: per moved course a CN:<control number> merge_into <new id> row (IDST), the new id's unified_title and discipline rows, and one honors_of row per new id; or, on Sam's word, the two automerge-v1@bot deletes (HUMA M10ME, LIBR M10CJ) with their rows in the receipt.
4. The fresh read, the .apply push, the read-back, the merge, one daily-dashboard dispatch, all in one cron window (06:17, 09:17, 12:17 UTC clear).

## Apply sequence for A

(i) The conductor runs reads 1 to 5 against their expectations, in a window clear of 06:17, 09:17 and 12:17 UTC. (ii) Within minutes, on this branch, `kb/migrations/.apply` takes the two lines above, one commit, one push; `supabase-migrate.yml` applies on that claude/** push. (iii) The runner commits `kb/receipts/migration_s649_busi_split_delete_<run>.json`; its `response` holds the deleted row. (iv) The post-apply read. (v) The PR merges on a green `test`. (vi) One `daily-dashboard.yml` dispatch (or the next cron): `kb/_apply_curation.py` drops BUSI M10XW's entry from `kb/coci_curation.json` and the export rebuilds; read the members file against `post_apply_simulated.json`.
