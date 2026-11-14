---
title: Honors M-IDs and the honors_of field (design)
created: 2026-11-14
tags: [reference, m-id, honors, curation-safety, rule-7, rule-10]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
---

# Honors M-IDs and the `honors_of` field

The first step of the Honors build (S653, PR on `claude/honors-of-field-s653`). It builds the field and plans the rows
and mints; it applies nothing. The commons lane carries the state (`docs/reference/lanes/commons.md`, NEXT item 1).

## What Sam ruled

- **Sheet 191 card 1** (`sam-honors-own-mid-2026-11-13`): an Honors course gets its own M-ID, with a declared
  equivalence to its base.
- **Sheet 197 card 3**, 14:37Z 2026-11-14 (`sam-sheet-197-answers-2026-11-14`): *"Base number plus H (MATH M1036H)"*;
  *"Two-way: either satisfies the other"*; *"Build the field first, then the rows"*; *"Rows for all 508 pairs"*.
- **In session**, 2026-11-14 (`sam-ccn-structures-gold-standard-2026-11-14`): *"CCN structures should be our gold
  standard"*. CCN keeps Honors as its own record beside its base (ENGL C1000H beside ENGL C1000). C-ID has no H ids, and
  a C-ID record stays as the official body numbers it (Sheet 195): Honors reaches M-IDs only.
- **In session**, 2026-11-14 (`sam-mid-care-goes-into-the-rewiring-2026-11-14`): the choice of id is low stakes; the
  care goes into rewiring every dependent. Units never split an identity (`CLAUDE.md` Rule 7).

## The field

`honors_of` is a `kb_curation` row: `course_id` is the Honors M-ID, `field` is `honors_of`, `value` is its base's id.
It is stored once, on the Honors side. The base's Honors partner is derived (`kb/honors_of.py` `partners`), never
stored a second time, so the two cannot disagree. The equivalence is two-way: either course satisfies the other.

`kb/_apply_curation.py` folds it into `kb/coci_curation.json` beside the other fields (`FIELDS`). The value may name an
M-ID, a C-ID or a CCN record; the key is always an M-ID. A C-ID or CCN record is never keyed by the field and never
written by it.

**The hold is pairwise and comes from the field.** A merge that would join an Honors id and its base, directly,
through a chain, or through a third id both land on, is cut (`kb/honors_of.py` `hold_merges`): the Honors id's own
merge first, else the base's own, so every other merge stays. A worklist group that holds both never offers the pair:
the Honors member leaves the group and the rest may still be offered (`without_honors_pairs`). Today's two dismissal
rows key on a group signature (`HUMA M10ME|HUMA M10OI|HUMA M1110`), which changes when HUMA M10OI merges into HUMA
M1110 and re-offers the pair (COBIx's review of #3304, item 1); the field's hold does not move when the group does.
The merge worklist cannot take a pairwise hold through `merge_dismissed` (its value is a whole-group signature by
design, `unified_courses.js` `groupSig`), so the worklist reads `honors_of` (decision 3).

**A person's merge wins** (Rule 10). When a person's `merge_into` joins a pair, the fold keeps it and sets the
`honors_of` aside; both outcomes are written to the overlay (`_honors_held`, `_honors_set_aside`), never dropped
silently. Those two keys appear only when a hold or a set-aside happened, so the overlay is unchanged while no row
carries the field.

## The id rule

The Honors M-ID is its base's id plus `H`: MATH M1036 takes MATH M1036H (`kb/honors_of.py` `honors_id_for`). Only an
M-ID base takes an H id. A C-ID or CCN base keeps its record as is: the Honors M-ID beside a C-ID keeps its own M-ID
and names the C-ID in `honors_of`; beside a CCN base whose H record exists, the Honors courses belong in that CCN H
record (a fold, held for now). Four characters after the `M` is a base; five ending in `H` is an Honors id
(`M_ID_RE`), so a stand-alone base whose tail ends in H (`ABCD M10GH`) stays a base. When one base has several
single-base Honors M-IDs, the one with the most local courses takes the H id by re-key and the rest fold into it, the
way CCN keeps one H record per base.

### Id parsers

Every parser that reads an M-ID's shape, and what it does with `MATH M1036H`. "Changed" lines are in this PR.

| Parser | Before | Now |
|---|---|---|
| `excel_to_dashboard.py` row-less target system, `\sM[0-9A-Z]{4}\b` | C-ID (wrong) | changed: `H?`, M-ID |
| `unified_courses.js` `applyMergeLocal`, `/\sM[0-9A-Z]{4}\b/` | C-ID (wrong) | changed: `H?`, M-ID |
| `kb/_row_audit.py` `M_ID_RE` (`mid_id_off_scheme`) | off-scheme finding | changed: `H?`, on scheme |
| `kb/_audit_cid_claims.py` `" M\d{3,}$"` (skip M-IDs) | audited as a claim | changed: `H?`, skipped |
| `kb/honors_of.py` `M_ID_RE` | new | Honors id, base MATH M1036 |
| `kb/_authority_recode_dryrun.py` `ID_RE` / `parse_id` (every re-mint allocator imports it) | no match: kind None, allocators skip it | unchanged on purpose: an H id never takes a number of its own; the re-mint derives it from its base (step 4) |
| `kb/_csr_trail.py` `MID_SHAPE` `M[A-Z0-9]+$` | matches | unchanged |
| `coci_lookup.js` `idWords` `/\sM[0-9A-Z]{2,}$/` | matches | unchanged |
| `unified_courses.js` band `/^[A-Z]{2,4} [MZ](\d)/`; `kb/_auto_merge_worklist.py` and `kb/_merge_candidate_queue.py` `BAND_RE`; `kb/_uc_cur_promote.py` `MEMBER_BAND_RE`; `kb/_uc_cur_zscheme_dryrun.py` `MEMBER_ID_RE`; `kb/_hs_title_fold.py` `" M(\d)"`; `kb/_reclustering_s648_dryrun.py` `id_system`; `kb/_doctrine_calibration_sample.py` | prefix match: band read | unchanged |
| `excel_to_dashboard.py` CCN test `\sC\d{4}` | no match | unchanged |
| Historical re-mint scripts, frozen after their apply: `kb/_subj4_apply.py` `MID_RE`, `kb/_subj4_dryrun.py` and `kb/_overmerge_dryrun.py` `COURSE_ID_RE`, `kb/_overmerge_apply.py` `COURSE_ID_RE`, `kb/_authority_recode_apply.py` and `kb/_zband_retire_apply.py` `MZ_RE`, `kb/_zband_retire_dryrun.py` `M_CORR_RE`/`M_STAND_RE`, `kb/_kin_pe_pass2.py` `CORR_RE`/`SA_RE`, `kb/_apply_convergence_singletons.py` `SA_RE` | no match | unchanged: each ran once on a set with no H id; a rerun would treat an H id as foreign |

`SUBJ4_RE` (`^[A-Z]{4}$`, in many scripts) reads the subject alone and never sees the `H`.

## Dependents to rewire

Each line names the dependent, how an Honors id or `honors_of` reaches it, and what this PR did or what a later step
must do. A second reader checks these one by one.

1. **`kb/_apply_curation.py`** (the fold, daily). Reads the field (`FIELDS`), holds the pair, reports holds. Done.
   Proof: `tests/honors_of_test.py` (rebuilds today's overlay as rows and folds it back to the committed bytes).
2. **`excel_to_dashboard.py` `export_unified_courses`** (the generator, daily). (a) The overlay's merge map passes
   through `hold_merges` before chains flatten. Done. (b) `substantive_curation` treats `honors_of` like
   `merge_dismissed`: a bot equivalence does not mark a row Verified. Done. (c) The id-system regex takes the `H`.
   Done. (d) **Not guarded:** the in-memory folds that run after the overlay map, Phase B (`promotions.json`
   `official_targets`, around line 9321), the stand-alone routing folds (around 9430, 9463, 9479). The pairs are
   measured on the generator's own output, after every fold, so today none of these joins a pair; a later change to
   their inputs could. The plan holds the 3 pairs whose `promotions.json` entry names the base among the Honors id's
   official targets (CHEM M1052 and CHEM M1053 with CHEM 120 S, SPAN M1073 with SPAN 100).
3. **`unified_courses.js`** (the CCR worklist and `applyMergeLocal`). Reads live `honors_of` rows
   (`fetchHonorsOf`); `liveMembers` drops an Honors member whose base sits in the same group. Done. Proof:
   `tests/uc_honors_of_worklist.test.js`.
4. **`kb/_auto_merge_worklist.py`** (the bot that folded HUMA M10ME and LIBR M10CJ in June). Reads `honors_of` from the
   overlay; an Honors member leaves a group holding its base. Done.
5. **`kb/_merge_candidate_queue.py`** (a queue for a faculty reviewer, writes nothing). Reads no overlay. Its
   `same_title` lane compares normalized titles, so an Honors title with "Honors" kept never equals its base. Not
   changed; recommended later: skip a pair `honors_of` names.
6. **`kb/_rekey_kb_curation_supabase.py`** (`supabase-rekey.yml`, the live re-key of a re-mint). Moves `honors_of`
   values with `merge_into` values (`POINTER_FIELDS`). Done. `merge_dismissed` values are not re-keyed there, as before.
7. **The alias chain, `kb/alias_chain.py`, and its era guard.** No code change. An H mint is a re-mint: its alias map
   (old Honors id to base plus H) is appended to `ALIAS_MAPS` in the land commit, like every other. Every later
   re-mint that moves a base must carry `<base>H` to `<new base>H` in the same map, or the Honors id is left behind
   (boundary-aware re-keyers such as `kb/_eths_remint.py` `rekey_skyview` never touch `MATH M1036H` when they move
   `MATH M1036`). The plan's ids are current-era: the newest applied map is 2026-11-08, no map is pending, and the plan
   records any id that a pending map would move (0).
8. **The identities map, `kb/coci_articulations.json` `identities`** (adopter and potential lists, keyed by id). An H
   mint moves the Honors id's entry to the H id: `kb/_identities_rebuild.py` (or `kb/_identities_rekey_dryrun.py`)
   after the alias map lands. A fold of a second Honors M-ID into the H id merges its entry.
9. **`kb/promotions.json`** (Phase A/B, keyed by id). `kb/_rekey_promotions.py` after the alias map lands. The 3 Phase B
   pairs stay held until their `official_targets` entry naming the base is removed or the fold is guarded.
10. **The minted records, `kb/coci_minted_courses.json`, `kb/coci_minted_singletons.json`,
    `kb/coci_minted_memberships.json`.** An H mint re-keys the Honors id's record and its memberships, stamped
    `_honors_mint_from`. The stale LIBR M10CJ entry under LIBR M1040 in `kb/coci_minted_courses.json` is step 3.
11. **`kb/crnc_mirrors.json`** (id-keyed). `kb/_rekey_crnc_mirrors.py` after the alias map lands.
12. **The Commons builders**, `kb/_build_commons_status.py` and `kb/_build_commons_data_status.py`, and the Commons
    tabs (`commons*.js`). They read the generated payloads, rebuilt nightly; they parse no M-ID shape. A display of the
    Honors partner on the Commons is not built; recommended once rows exist.
13. **SkyView**, `prototype/ccr_universe.json` and `prototype/ccr_universe_members.json` (a hand-built layout, never
    rebuilt), and its builders `kb/_build_ccr_universe.py`, `kb/_build_ccr_sky.py`, `kb/_build_ccr_atlas_extract.py`.
    An H mint re-keys the Honors id's point by exact token (the `rekey_skyview` pattern) and treats SkyView's drawn ids
    as taken (`skyview_ids`).
14. **The row auditor, `kb/_row_audit.py`.** `M_ID_RE` takes the `H`. Done. A rule for an Honors id without
    `honors_of`, or an `honors_of` whose base is gone, is not written; recommended with the mints.
15. **The claim audit, `kb/_audit_cid_claims.py`.** Skips an Honors M-ID as an M-ID. Done.
16. **Every other `kb_curation` reader** the [dependency map](dependency_map.md) names (tabs `canonical-subj4`,
    `coci-lookup`, `commons`, `cr-reference`, `credential-reference`, `exhibits`, `map-export`, `vision-2030`). Each
    read filters by field or by a non-M-ID `course_id` prefix (`canonical_subj4.js` 2478, `coci_lookup.js` 388 and 680,
    `cr_reference.js` 357, `exhibits.js` 557, 714, 1502 and 2740, `map_export.js` 103), so a new field is invisible to it.
17. **The dependency map itself**, `docs/reference/dependency_map.md`: regenerated by
    `python3 kb/_build_dependency_map.py` in this PR (the new module and dry run are consumers).

## How the pairs are found

`measure_honors` in `kb/_reclustering_s648_dryrun.py` (S648), imported by `kb/_honors_of_s653_dryrun.py`, never
copied. A course is Honors when its title carries the word Honors as a whole word; its base is the same college's
course whose code is the Honors code with the H removed and whose title agrees, else the one course at that college
with the Honors-struck title. A **pair** is an (Honors identity, base identity) where an Honors course and its base sit
in different identities.

**Reproduced:** on the committed members file (generated 2026-11-14 13:44, before #3304's delete applied at 15:07Z),
**508 pairs** from 1,118 Honors courses, the S648 count. On the live-equivalent fold (the overlay without the two rows
#3304 deleted), **510 pairs** from 1,120 courses: the delete set HUMA M10ME apart from HUMA M1110 and LIBR M10CJ apart
from LIBR M1040. Sam's "all 508" is the count he saw; the rows plan covers the 510.

Measures, named (COBIx's review of #3304, item 3): *local courses* are rows in `unified_courses_members.js` (HUMA
M1110 63 to 62); *folded identities* are the row's `members` in `unified_courses_data.js` or
`unified_courses_standalone.js` (HUMA M1110 11 to 10).

## The plan, in numbers

`kb/honors_of_s653_out/2026-11-14/plan.json` and `plan.md`. Of 510 pairs:

| Action | Pairs | What it means |
|---|---:|---|
| row and mint | 301 | `honors_of` row now; the Honors M-ID takes base plus H later |
| row and fold into the H id | 8 | a second single-base Honors M-ID for one base: row now, folds into the H id at the mint |
| row only (official base) | 80 | M-ID Honors beside a C-ID base: `honors_of` names the C-ID; no H id |
| none | 65 | the Honors side is itself a C-ID or CCN record: untouched (22 are CCN's own base and H records) |
| held | 56 | below |

Holds (a pair may carry more than one): 53 pairs whose Honors M-ID's courses name 2 to 4 base identities (the base
side is split, so one `honors_of` cannot name them all; the record keeps the modal base); 3 pairs whose
`promotions.json` entry names the base as an official target; 1 CCN pair
(HIST M10UP beside HIST C1001, where HIST C1001H already exists). No proposed H id already exists, no base or Honors id
is slated to merge, and no id moves under a pending alias map. No person's row is overridden: 27 pairs touch an entry a
person saved (`unified_title`, one with `discipline`); the `honors_of` insert overrides none of them and the mint
carries the Honors side's to its H id, so each is a note, not a hold. The live per-field read below confirms it.

## Steps, in order

Each step lands only after the one before it, under its own receipt, and each has its undo.

0. **The field** (this PR, code only). Undo: `git revert`.
1. **First rows and the restamp** (`kb/migrations/2026-11-14_s653_honors_of_field.sql`, drafted, not in `.apply`).
   Restamps HUMA M1110's and LIBR M1040's `unified_title` rows from `automerge-v1@bot` 2026-06-12 to `honors-s652@bot`
   now (COBIx's item 2) and inserts `honors_of` for HUMA M10ME and LIBR M10CJ under `honors-s653@bot`. Receipt
   `kb/receipts/migration_s653_honors_of_field_<run>.json`. Undo:
   `kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql`, keyed on the new stamps; run it before
   `2026-11-14_s652_honors_followups_rollback.sql`, which keys on the June stamp. Proved against a throwaway Postgres
   (`tests/kb_curation_guarded_sql_proof.py`: the forward file, the rollback, seven refusals).
2. **The rows** (`kb/migrations/2026-11-14_s653_honors_of_rows.sql`, drafted from the plan by
   `kb/_honors_of_s653_dryrun.py --sql-only`, not in `.apply`). 387 inserts, `ON CONFLICT DO NOTHING`, cohort
   `honors-s653@bot`, on the current ids; held pairs get none. Receipt
   `kb/receipts/migration_s653_honors_of_rows_<run>.json`. Undo:
   `kb/migrations/2026-11-14_s653_honors_of_rows_rollback.sql` (by cohort, field and the planned keys). Proved the same
   way (five refusals). Before it: re-run the dry run on the day's fold and redraft if any count moved.
3. **HUMA M10OI into HUMA M1110** (`d-huma-m10oi-into-m1110-s652`) and **LIBR M10CJ's stale entry** in
   `kb/coci_minted_courses.json`, each its own small change after step 1, when the pairwise hold already stands.
   M10OI: one `merge_into` row, cohort `honors-s653@bot`, undo by cohort. LIBR M10CJ: a committed edit, undo
   `git revert`.
4. **The mints** (a re-mint under `docs/coursecontrolnumber_remint.md`): an alias map from each unheld Honors M-ID to
   its base plus H (and each second Honors M-ID to the same H id), dry run first, then one atomic land: minted records,
   memberships, promotions, identities map, crnc mirrors, SkyView, the overlay, `ALIAS_MAPS`, and the live re-key
   (`supabase-rekey.yml`, which now moves `honors_of` values too). Undo: the playbook's rollback.
5. **The held pairs**, one class at a time: the multi-base Honors M-IDs (merge the base side first, or name the modal
   base), the Phase B three, the CCN fold.

## Live reads (one SELECT each, one JSON value)

Before step 1 the conductor confirms that no row carries the field and that the two title rows are as the guard
expects:

```sql
select json_build_object(
  'honors_of_rows', (select count(*) from public.kb_curation where field = 'honors_of'),
  'titles', (select json_agg(json_build_object('id', course_id, 'value', value, 'by', reviewer_email,
             'at', reviewed_at, 'validated', validated_at)) from public.kb_curation
             where field = 'unified_title' and course_id in ('HUMA M1110', 'LIBR M1040')),
  'leaf_merges', (select count(*) from public.kb_curation
                  where field = 'merge_into' and course_id in ('HUMA M10ME', 'LIBR M10CJ')));
```

Before step 2, the person-saved rows on the plan's ids, per field:

```sql
select json_build_object('person_rows_by_field', (
  select json_object_agg(field, n) from (
    select field, count(*) as n from public.kb_curation
    where reviewer_email not like '%@bot'
      and course_id in (select jsonb_array_elements_text('<the ids from plan.json, as a JSON array>'::jsonb))
    group by field) x));
```

## Open questions, each with a recommendation

1. **Rows on official bases (80).** An `honors_of` naming a C-ID keeps the C-ID untouched and makes the equivalence
   visible from it. Recommendation: write them (step 2 includes them).
2. **Multi-base Honors M-IDs (53 pairs).** Recommendation: hold; first ask the base side whether its identities should
   merge (they are usually one course split across M-IDs), then name the one base.
3. **Several Honors M-IDs for one base (8 fold).** Recommendation: as planned, one H id per base, the rest fold into it.
4. **Phase B evidence (3).** Recommendation: guard the Phase B fold with `hold_merges` once rows exist, then release
   the three.
5. **HIST M10UP beside HIST C1001H.** Recommendation: fold the M-ID into the CCN H record, by CCN's own structure.
6. **The `merge_dismissed` rows of #3304.** Recommendation: leave them; the field's hold makes them redundant, and
   their rollback already removes them if wanted.
