# Honors S652: delete two bot rows (dry run, 2026-11-14)

Sam, Open Asks Sheet 197 card 2 (*Delete two bot rows so two Honors courses stand apart*), his own call, 14:35Z 2026-11-14: "delete" (*Delete both rows*). Background: sam-honors-own-mid-2026-11-13 (Sheet 191 card 1). Nothing here is applied.

## The rows

- `(HUMA M10ME, merge_into, HUMA M1110)`, `automerge-v1@bot`, 2026-06-12T22:47:01.69179+00:00, unvalidated. Its course: MiraCosta College RELG 101H *World Religions (Honors)* (CCC000588084).
- `(LIBR M10CJ, merge_into, LIBR M1040)`, `automerge-v1@bot`, 2026-06-12T22:47:01.69179+00:00, unvalidated. Its course: MiraCosta College LIBR 201H *Media & Information Literacy (Honors)* (CCC000572223).

Nothing is inserted: each Honors course's own record already exists as a stand-alone record in kb/coci_minted_singletons.json; with the bot's row gone nothing folds it, nothing points into it and no CN: row re-homes it, so the export emits it as its own row.

## The guard and the receipt

`kb/migrations/2026-11-14_s652_honors_two_row_delete.sql`, one plain statement. The delete runs only when: both rows stand at their keys with this value, reviewer and stamp, unvalidated; the person-saved rows on the four ids (or in a merge field naming one) number 0; no row points into either leaf; no CN: row re-homes either Honors course. Otherwise the cast raises and nothing is written. RETURNING sends both rows whole to `kb/receipts/migration_s652_honors_two_row_delete_<run>.json`. Undo: `kb/migrations/2026-11-14_s652_honors_two_row_delete_rollback.sql` re-inserts both, ON CONFLICT DO NOTHING.

## What moves (simulated)

- `HUMA M10ME`: members 0 to 1, colleges 0 to 1, units [] to [3]; row None to Stand-Alone, title 'World Religions (Honors)', subjects None to ['RELG'], TOP None to 1510.00.
- `LIBR M10CJ`: members 0 to 1, colleges 0 to 1, units [] to [3]; row None to Stand-Alone, title 'Media & Information Literacy (Honors)', subjects None to ['LIBR'], TOP None to 1601.00.
- `HUMA M1110`: members 63 to 62, colleges 59 to 59, units [0, 3, 4] to [0, 3, 4]; row Course to Course, title 'World Religions (Honors)', subjects ['HUMAN', 'PHIL', 'RELG'] to ['HUMAN', 'PHIL'], TOP 1509.00 to 1509.00.
- `LIBR M1040`: members 3 to 2, colleges 2 to 2, units [3] to [3]; row Course to Course, title 'Media & Information Literacy (Honors)', subjects ['LIBR'] to ['LIBR'], TOP 1601.00 to None.

Identities in the index 49,804 to 49,806; stand-alone rows 33,422 to 33,424 (the Commons CCR card's *stand-alone in today's build*); member rows 134,485 to 134,485; suggestion groups 2,619 to 2,620. Articulations, credit recommendations and adopter lists: none on any of the four ids, before or after. Only COBI reads these files (Unified Courses, COCI Lookup, the CPL Pathways workbook, Exhibits), with SkyView's canvas and the Commons status rebuilt from them nightly; no public page and no Fact Sheet figure reads them.

## Identities map, alias chain

None of the four ids carries an articulation record, so none needs an identities entry and the rollup's adopter and potential lists stay empty on all four; a later rebuild has nothing to fill for them. `--check` logic: missing entries 0 before, 0 after.

Alias chain: none: no map renames any of the four ids, no map is pending, and a delete re-keys nothing; supabase-rekey.yml has no row left to carry for the two leaves.

## Not covered by card 2

- The base titles keep '(Honors)': HUMA M1110's unified_title 'World Religions (Honors)' (trailcrew-ccr3-s112 bot) and LIBR M1040's 'Media & Information Literacy (Honors)' (the same June auto-merge cohort). Changing either is an UPDATE or DELETE of a saved row that card 2 does not name.
- HUMA M10ME returns with a discipline inferred from its TOP division (Humanities, dconf 0.4), shown with the inferred mark and held out of the SUBJ4 fold; its base HUMA M1110 carries Religious Studies from a curated row.
- The two ids are the records' existing ids (HUMA M10ME, LIBR M10CJ), not the base-plus-H numbers card 3 rules for a new Honors M-ID; whether card 3 renames them is the Honors design's call.
- The nightly suggested-merge worklist proposes each pair again (LIBR M1040 with LIBR M10CJ, score 0.84; HUMA M1110 with HUMA M10ME and HUMA M10OI, 0.527). No procedure acts on it; a curator's merge would fold them back until honors_of exists.

## The conductor's reads (one JSON value each)

**a.** the two bot rows as they stand, whole. Expect: two rows: HUMA M10ME merge_into HUMA M1110 and LIBR M10CJ merge_into LIBR M1040, automerge-v1@bot, 2026-06-12 22:47:01.69179+00, validated_at and validated_by null, reviewer_label automerge-v1@bot.

```sql
select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id), '[]'::jsonb) from public.kb_curation k where (k.course_id, k.field) in (('HUMA M10ME', 'merge_into'), ('LIBR M10CJ', 'merge_into'));
```

**b.** every other row on the four ids or naming them, by any reviewer: whole rows on the ids, pointer counts into them by reviewer, every person-saved row naming them, CN: rows on the four MiraCosta courses. Expect: {"on_ids": "HUMA M1110 discipline (Religious Studies) and unified_title (World Religions (Honors)); LIBR M1040 unified_title (Media & Information Literacy (Honors)); all @bot (the overlay: trailcrew-ccr3-s112 and automerge-v1)", "pointers_in": "HUMA M1110 9 and LIBR M1040 3 merge_into rows, all @bot (each count includes the Honors row); none into HUMA M10ME or LIBR M10CJ", "person_rows": [], "cn_rows": []}.

```sql
select jsonb_build_object('on_ids', (select coalesce(jsonb_agg(jsonb_build_object('course_id', k.course_id, 'field', k.field, 'value', k.value, 'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at, 'validated_at', k.validated_at, 'validated_by', k.validated_by) order by k.course_id, k.field), '[]'::jsonb) from public.kb_curation k where k.course_id in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040') and (k.course_id, k.field) not in (('HUMA M10ME', 'merge_into'), ('LIBR M10CJ', 'merge_into'))), 'pointers_in', (select coalesce(jsonb_object_agg(x.v || ' / ' || x.who, x.n), '{}'::jsonb) from (select k.value as v, case when k.reviewer_email like '%@bot' then k.reviewer_email else 'a person' end as who, count(*) as n from public.kb_curation k where k.field = 'merge_into' and k.value in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040') group by 1, 2) x), 'person_rows', (select coalesce(jsonb_agg(jsonb_build_object('course_id', k.course_id, 'field', k.field, 'value', k.value, 'reviewer_email', k.reviewer_email, 'reviewed_at', k.reviewed_at) order by k.reviewed_at), '[]'::jsonb) from public.kb_curation k where k.reviewer_email not like '%@bot' and (k.course_id in ('HUMA M10ME', 'LIBR M10CJ', 'HUMA M1110', 'LIBR M1040') or k.value like '%HUMA M10ME%' or k.value like '%LIBR M10CJ%' or k.value like '%HUMA M1110%' or k.value like '%LIBR M1040%')), 'cn_rows', (select coalesce(jsonb_agg(to_jsonb(k) order by k.course_id), '[]'::jsonb) from public.kb_curation k where k.course_id in ('CN:CCC000588084', 'CN:CCC000572223', 'CN:CCC000545257', 'CN:CCC000354460')));
```

**c.** pending unified_title_merge_confirm rows touching the four ids (Rule 10's cross-check). Expect: {"n": 0, "rows": []}.

```sql
select jsonb_build_object('n', count(*), 'rows', coalesce(jsonb_agg(jsonb_build_object('course_id', k.course_id, 'value', k.value, 'reviewer', case when k.reviewer_email like '%@bot' then k.reviewer_email else 'a person' end, 'reviewed_at', k.reviewed_at)), '[]'::jsonb)) from public.kb_curation k where k.field = 'unified_title_merge_confirm' and (k.course_id like '%HUMA M10ME%' or k.value like '%HUMA M10ME%' or k.course_id like '%LIBR M10CJ%' or k.value like '%LIBR M10CJ%' or k.course_id like '%HUMA M1110%' or k.value like '%HUMA M1110%' or k.course_id like '%LIBR M1040%' or k.value like '%LIBR M1040%');
```

**d.** the table's shape: columns, the conflict key, triggers, and foreign keys into it (the BUSI plan's read 5, widened: a delete trigger or a cascading key would write more than two rows). Expect: {"columns": "course_id, field, value, reviewer_email, reviewed_at (default now()), reviewer_label (generated always, never inserted), validated_at, validated_by", "unique": "a unique index on (course_id, field)", "triggers": [], "fks_in": []}.

```sql
select jsonb_build_object('columns', (select jsonb_agg(jsonb_build_object('name', c.column_name, 'type', c.data_type, 'default', c.column_default, 'generated', c.is_generated) order by c.ordinal_position) from information_schema.columns c where c.table_schema = 'public' and c.table_name = 'kb_curation'), 'indexes', (select jsonb_agg(i.indexdef) from pg_indexes i where i.schemaname = 'public' and i.tablename = 'kb_curation'), 'triggers', (select coalesce(jsonb_agg(pg_get_triggerdef(t.oid)), '[]'::jsonb) from pg_trigger t where t.tgrelid = 'public.kb_curation'::regclass and not t.tgisinternal), 'fks_in', (select coalesce(jsonb_agg(conname), '[]'::jsonb) from pg_constraint where confrelid = 'public.kb_curation'::regclass and contype = 'f'));
```

**post.** after the apply: the two keys are gone. Expect: 0.

```sql
select to_jsonb(count(*)) from public.kb_curation where (course_id, field) in (('HUMA M10ME', 'merge_into'), ('LIBR M10CJ', 'merge_into'));
```

## Apply sequence

(i) The conductor runs reads a to d, in a window clear of 06:17, 09:17 and 12:17 UTC, and sets the guard's person count from read b. (ii) On this branch, `kb/migrations/.apply` takes the two lines `file=kb/migrations/2026-11-14_s652_honors_two_row_delete.sql` and `name=s652_honors_two_row_delete`, one commit, one push; `supabase-migrate.yml` applies on that push. (iii) The runner commits the receipt; its `response` holds both rows. (iv) Read post. (v) The PR merges on a green `test`. (vi) One `daily-dashboard.yml` dispatch (or the next cron), then read the members file against `post_apply_simulated.json`.
