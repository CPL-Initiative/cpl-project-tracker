---
title: Honors M-IDs and the honors_of field (design)
created: 2026-11-14
tags: [reference, m-id, honors, curation-safety, rule-7, rule-10]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
---

# Honors M-IDs and the `honors_of` field

The first step of the Honors build (S653). PR #3313 (`claude/honors-of-field-s653`) builds the field and every reader
of it, and writes no data. The rows plan, its dry run and the drafted migrations sit on the stacked branch
`claude/honors-of-rows-s653`, where the plan is redesigned before anything applies (*Before the rows apply*, below).
The commons lane carries the state (`docs/reference/lanes/commons.md`, NEXT item 1).

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
It is stored once, on the Honors side. The base's Honors partner is derived (`kb/honors_of.py` `partners`,
`pair_list`), never stored a second time, so the two cannot disagree. The equivalence is two-way: either course
satisfies the other.

`kb/_apply_curation.py` folds it into `kb/coci_curation.json` beside the other fields (`FIELDS`). **An `honors_of` row
never touches the entry's `reviewed_by` or `reviewed_at`**: it is a bot's equivalence, not a review, and a later one
would otherwise credit a person's saved title to the bot (Rule 10). An entry that holds only `honors_of` carries no
reviewer. The generator's `substantive_curation` ignores the field for the same reason, so it never marks a row
Verified. The value may name an M-ID, a C-ID or a CCN record; the key is always an M-ID.

**Resolving the base.** A stored base goes stale two ways, and `kb/honors_of.py` resolves both, once:

- *A re-mint moves it.* Every re-keyer moves `honors_of` values with `merge_into` values (`kb/curation_pointers.py`
  `rekey_entry`; the live re-key reads its `POINTER_FIELDS`), so a live value is current by construction and stays as
  stored. A value outside the live set (the minted courses and stand-alones) resolves through `kb/alias_chain.py`,
  imported, through the maps applied after `FIELD_BASELINE` only (the newest map when the field was born, 2026-11-08).
  No older map can name a value the field holds, and resolving a current value again through an older map is the
  slot-reuse telescoping the chain's docstring forbids. Today no map is pending, so resolution changes nothing.
  **A live value is never moved, even when a later map names it.** That is safe only while every re-keyer moves
  `honors_of` with the key it points at: then a later map naming a live value means its slot was reused by another
  row. A re-keyer that skips the field breaks this; the note sits beside `FIELD_BASELINE`.
- *A merge moves it* (the base merged into a third id). The worklists read the base at its merge-chain end too
  (`honors_map(merge_end=True)`; in the CCR, `fetchHonorsOf` reads the base's live `merge_into` hops and `liveMembers`
  walks them with this session's merges).
- **The CCR relies on the live re-key.** The browser resolves no alias map, so a live value naming a re-minted base
  would offer the pair in the worklist while Python holds it. It holds because `supabase-rekey.yml` moves `honors_of`
  values at every re-mint, and because the rows migration must refuse a value outside the live id set (*Before the
  rows apply*, item 5).

**The hold is pairwise and comes from the field.** A merge that would join an Honors id and its base, directly,
through a chain, or through a third id both land on, is cut (`hold_merges`). It walks both sides to the point where
their paths meet and cuts the first bot edge on the joining paths, the Honors side's first. Every merge past the
meeting point and every other id's merge stays. A worklist group that holds both never offers the pair: the Honors
member leaves the group and the rest may still be offered (`without_honors_pairs`). Today's two dismissal rows key on a
group signature (`HUMA M10ME|HUMA M10OI|HUMA M1110`), which changes when HUMA M10OI merges into HUMA M1110 and
re-offers the pair (COBIx's review of #3304, item 1); the field's hold does not move when the group does. The merge
worklist cannot take a pairwise hold through `merge_dismissed` (its value is a whole-group signature by design,
`unified_courses.js` `groupSig`), so the worklist reads `honors_of`.

**A person's merge wins** (Rule 10). Only when every joining edge is a person's does the fold keep the merges and set
the `honors_of` aside. Both outcomes are written to the overlay (`_honors_held`, `_honors_set_aside`), never dropped
silently. Those two keys appear only when a hold or a set-aside happened, so the overlay is unchanged while no row
carries the field.

## The id rule

The Honors M-ID is its base's id plus `H`: MATH M1036 takes MATH M1036H (`kb/honors_of.py` `honors_id_for`). Only an
M-ID base takes an H id. A C-ID or CCN base keeps its record as is: the Honors M-ID beside a C-ID keeps its own M-ID
and names the C-ID in `honors_of`; beside a CCN base whose H record exists, the Honors courses belong in that CCN H
record. Four characters after the `M` is a base; five ending in `H` is an Honors id (`M_ID_RE`), so a stand-alone base
whose tail ends in H (`ABCD M10GH`) stays a base. One base takes one H id (decision 3).

**An H id never takes a number of its own.** `kb/_authority_recode_dryrun.py` `Allocator.place` and the new
`kept_number` raise on any id `parse_id` does not number (kind None), so a re-mint can no longer write
`ETHN NoneNoneNone` into an alias map (COBIx's review of #3313). Every re-mint script that took its kept number by hand
(`_eths_remint.py` and the seven built on it: `_agab_one_remint.py`, `_agri_family_remint.py`, `_athl_four_remint.py`,
`_blank_stray_remint.py`, `_fl_stray_remint.py`, `_forestry_wine_remint.py`, `_subjects_list_recode.py`) now calls
`rec.kept_number`. A re-mint that moves a base moves `<base>H` to `<new base>H` in the same alias map.

### Id parsers

Every parser that reads an M-ID's shape, and what it does with `MATH M1036H`. "Changed" lines are in #3313.

| Parser | Before | Now |
|---|---|---|
| `excel_to_dashboard.py` row-less target system, `\sM[0-9A-Z]{4}\b` | C-ID (wrong) | changed: `H?`, M-ID |
| `unified_courses.js` `applyMergeLocal`, `/\sM[0-9A-Z]{4}\b/` | C-ID (wrong) | changed: `H?`, M-ID |
| `kb/_row_audit.py` `M_ID_RE` (`mid_id_off_scheme`) | off-scheme finding | changed: `H?`, on scheme |
| `kb/_audit_cid_claims.py` `" M\d{3,}$"` (skip M-IDs) | audited as a claim | changed: `H?`, skipped when the tail is all digits; a stand-alone tail (`M10AB`) was already audited and still is, H or not |
| `kb/honors_of.py` `M_ID_RE` | new | Honors id, base MATH M1036 |
| `kb/_authority_recode_dryrun.py` `ID_RE` / `parse_id` (every re-mint allocator imports it) | no match: kind None, and `Allocator.place` wrote `ETHN NoneNoneNone` | `parse_id` unchanged; `Allocator.place` and `kept_number` refuse it |
| `kb/_csr_trail.py` `MID_SHAPE` `M[A-Z0-9]+$` | matches | unchanged |
| `coci_lookup.js` `idWords` `/\sM[0-9A-Z]{2,}$/` | matches | unchanged |
| `unified_courses.js` band `/^[A-Z]{2,4} [MZ](\d)/`; `kb/_auto_merge_worklist.py` and `kb/_merge_candidate_queue.py` `BAND_RE`; `kb/_uc_cur_promote.py` `MEMBER_BAND_RE`; `kb/_uc_cur_zscheme_dryrun.py` `MEMBER_ID_RE`; `kb/_hs_title_fold.py` `" M(\d)"`; `kb/_reclustering_s648_dryrun.py` `id_system`; `kb/_doctrine_calibration_sample.py` | prefix match: band read | unchanged |
| `excel_to_dashboard.py` CCN test `\sC\d{4}` | no match | unchanged |
| Frozen re-mint scripts, each run once on a set with no H id: `kb/_subj4_dryrun.py` and `kb/_overmerge_dryrun.py` `COURSE_ID_RE`, `kb/_overmerge_apply.py` `COURSE_ID_RE`, `kb/_authority_recode_apply.py` and `kb/_zband_retire_apply.py` `MZ_RE`, `kb/_zband_retire_dryrun.py` `M_CORR_RE`/`M_STAND_RE`, `kb/_kin_pe_pass2.py` `CORR_RE`/`SA_RE`, `kb/_apply_convergence_singletons.py` `SA_RE`, `kb/_apply_drama_theater_convergence.py` (line 65), `kb/_apply_kin_pe_convergence.py` (75), `kb/_apply_kine_flsp_twin_merge.py` (75), `kb/_apply_twin_merge_statewide.py` (116), `kb/_fl_subj4_dryrun.py` (96) | no match | unchanged: a rerun would treat an H id as foreign |
| `kb/_subj4_apply.py` `MID_RE` | no match | unchanged, and **still dispatchable** from `phase-1e-apply.yml`: a rerun after the mints would skip every H id. Its overlay re-key now moves `honors_of` values (below). |

`SUBJ4_RE` (`^[A-Z]{4}$`, in many scripts) reads the subject alone and never sees the `H`.

### Re-keyers

Twenty places in `kb/` re-key the overlay's `merge_into` values. The eight a future re-mint can still run call
`kb/curation_pointers.py` `rekey_entry`, which moves `merge_into` and `honors_of` together and counts an entry once
however many of its fields moved, so each receipt's counter still means entries re-pointed: `_eths_remint.py`
`apply_plan` (shared by the seven re-mints built on it), `_uc_cur_promote.py`, `_zband_retire_dryrun.py` `rekey_state`,
`_prefix_fold_apply.py`, `_authority_recode_apply.py`, `_zband_retire_apply.py`, `_overmerge_apply.py`
(`overmerge-apply.yml`) and `_subj4_apply.py` (`phase-1e-apply.yml`). The live re-key
(`kb/_rekey_kb_curation_supabase.py`, `supabase-rekey.yml`) reads the same `POINTER_FIELDS`.

Frozen history, each run once before the field existed, left as written: `_apply_convergence_singletons.py`,
`_apply_drama_theater_convergence.py`, `_apply_fl_subj4_remint.py`, `_apply_kin_pe_convergence.py`,
`_apply_kine_flsp_twin_merge.py`, `_apply_twin_merge_statewide.py`, `_kin_pe_pass2.py`, `_pols_remint.py`,
`_remint_dryrun.py`, `_uc_cur_zscheme_apply.py`. `_hs_title_fold.py` (two sites) writes new merges rather than
re-keying values. A new re-mint copies the live pattern, never a frozen loop.

## Dependents to rewire

Each line names the dependent, how an Honors id or `honors_of` reaches it, and what #3313 did or what a later step
must do.

1. **`kb/_apply_curation.py`** (the fold, daily). Reads the field, leaves the ledger alone, resolves the base, holds
   the pair, reports holds. Done. Proof: `tests/honors_of_test.py` (including a rebuild of today's overlay as rows that
   folds back to the committed bytes).
2. **`excel_to_dashboard.py` `export_unified_courses`** (the generator, daily). (a) The overlay's merge map passes
   through `hold_merges` before chains flatten, with the base resolved against the minted and stand-alone ids. (b)
   `substantive_curation` treats `honors_of` like `merge_dismissed`. (c) The id-system regex takes the `H`. (d) The
   later in-memory folds ask before each write. `would_join` is a trial over **every** pair (`pair_list`, computed
   once from the hmap): it makes the proposed write in the merge map, refuses it when any pair that was apart before
   ends under one id after, and undoes the write. A point check on the folding id's own partners missed a fold of a
   third id that one side had already merged into (round 2's blocker), so it was replaced. Phase B tries its group's
   members one by one through the same test, bases before Honors ids and then by id, so the result never depends on
   member order; R4 and both routing folds skip a member the test refuses. They consume and synthesize rows, so a cut
   after them could not restore what they removed. (e) After every fold, `check_apart` asserts no pair ends under one
   id. The trial is complete by construction, so it never fires; under the test suite and `--check`
   (`HONORS_OF_STRICT=1`) it fails the run, and the daily run prints the named warning `honors-pair-joined`. Proof: a
   property test over 400 random merge maps (1,467 writes, 58 refused) finds no accepted write that joins a pair.
   With no row carrying the field the output is byte-identical to `main` apart from timestamps.
3. **`unified_courses.js`** (the CCR worklist and `applyMergeLocal`). `fetchHonorsOf` reads the live rows and each
   base's live merge hops; `liveMembers` drops an Honors member whose base, or any id along the base's chain, sits in
   the same group. No `honors_of` row, no second read. Done. Proof: `tests/uc_honors_of_worklist.test.js`.
4. **`kb/_auto_merge_worklist.py`**. Reads the field from the overlay, base resolved and read at its merge end; an
   Honors member leaves a group holding its base. Done.
5. **`kb/_merge_candidate_queue.py`**. Reads the field; a group holding a pair is flagged and never proposable. Done.
6. **`kb/_rekey_kb_curation_supabase.py`** and **the overlay re-keyers**. Above, *Re-keyers*. Done.
7. **The alias chain, `kb/alias_chain.py`.** No code change. An H mint is a re-mint: its alias map is appended to
   `ALIAS_MAPS` in the land commit. Boundary-aware re-keyers such as `kb/_eths_remint.py` `rekey_skyview` never touch
   `MATH M1036H` when they move `MATH M1036`, so the base's move must carry its H id in the same map.
8. **The identities map, `kb/coci_articulations.json` `identities`.** An H mint moves the Honors id's entry:
   `kb/_identities_rebuild.py` (or `kb/_identities_rekey_dryrun.py`) after the alias map lands.
9. **`kb/promotions.json`** (Phase A/B, keyed by id). `kb/_rekey_promotions.py` after the alias map lands.
10. **The minted records**, `kb/coci_minted_courses.json`, `kb/coci_minted_singletons.json`,
    `kb/coci_minted_memberships.json`. An H mint re-keys the Honors id's record and its memberships, stamped
    `_honors_mint_from`. LIBR M10CJ's stale entry under LIBR M1040 in `kb/coci_minted_courses.json` is its own change.
11. **`kb/crnc_mirrors.json`** (id-keyed). `kb/_rekey_crnc_mirrors.py` after the alias map lands.
12. **The Commons builders**, `kb/_build_commons_status.py` and `kb/_build_commons_data_status.py`, and the Commons
    tabs. They read the generated payloads and the overlay's `reviewed_by` (`_build_commons_status.py` line 404 counts
    a person's stamp as confirmed, which item 1 now protects). A display of the Honors partner is not built.
13. **SkyView**, `prototype/ccr_universe.json` and `prototype/ccr_universe_members.json` (a hand-built layout), and its
    builders. An H mint re-keys the Honors id's point by exact token (`rekey_skyview`) and treats SkyView's drawn ids
    as taken (`skyview_ids`).
14. **The row auditor, `kb/_row_audit.py`.** `M_ID_RE` takes the `H`. Done. A rule for an Honors id without
    `honors_of`, or an `honors_of` whose base is gone, is recommended with the mints.
15. **The claim audit, `kb/_audit_cid_claims.py`.** Skips an all-digit Honors M-ID. Done.
16. **Every other `kb_curation` reader** the [dependency map](dependency_map.md) names. Each read filters by field or
    by a non-M-ID `course_id` prefix (`canonical_subj4.js` 2478, `coci_lookup.js` 388 and 680, `cr_reference.js` 357,
    `exhibits.js` 557, 714, 1502 and 2740, `map_export.js` 103), so a new field is invisible to it.
17. **The dependency map**, regenerated by `python3 kb/_build_dependency_map.py` in #3313.

## Decisions (the conductor, S653, on the six open questions)

1. Rows on the 80 C-ID bases: yes.
2. Multi-base pairs wait until their base side merges.
3. One H id per base.
4. The three pairs whose `kb/promotions.json` entry names the base as an official target get a hold, released now
   that the generator's Phase B guard (dependent 2d) has landed with #3313.
5. HIST M10UP folds into HIST C1001H, as its own change.
6. #3304's two `merge_dismissed` rows stay.

From the review: where a CCN H record already pairs with any course in the base (ASTR C1001H beside ASTR M1012), the
M-ID pair is held; and the matcher gets a self-recall test before the rows are redrawn.

## Before the rows apply

The second PR (#3315, `claude/honors-of-rows-s653`) holds the dry run (`kb/_honors_of_s653_dryrun.py`), its plan
(`kb/honors_of_s653_out/2026-11-14/`), the matcher's recall test (`kb/_honors_matcher_recall.py`) and four drafted
migrations (`kb/migrations/2026-11-14_s653_honors_of_field.sql`, `..._rows.sql` and their rollbacks), none in
`kb/migrations/.apply`. Five readers reviewed the first draft for #3313; the redraw (S653, 2026-11-14) meets each
finding as below. `tests/honors_of_rows_plan.test.js` pins each on the committed files, and
`tests/kb_curation_guarded_sql_proof.py` runs the files themselves against Postgres (83 checks; run locally with a
server, it prints SKIP in CI).

**The plan today** (523 pairs on the live-equivalent members file; 510 before the recall fix): 305 row and mint, 81
row only on an official base, 4 row with a fold after the mint, 64 none (the Honors side is a C-ID or CCN record),
69 held. Held by first reason: 62 multi-base, 4 folds that would join distinct Honors courses, 3 beside a CCN Honors
record. 390 rows: step 1 writes 2, step 2 writes 388. `plan.md` lists every held pair by reason.

1. **The person guard holds only a join** (was the blocker). A person's saved row holds a pair only where the pair's
   `honors_of` would contradict it: a merge path that puts the Honors id and its base under one id. The insert walks
   the merge chains of both sides (a recursive CTE) and refuses on a join, counting a person's apart; a merge keyed on
   a named id refuses too, since that id is no longer a live identity. A person's merge of a third course into
   either side agrees with the pair standing apart and proceeds: the proof seeds today's 45 such rows and the insert
   passes. The plan counts them (`person_merges_into_a_planned_id`: 45 rows, 0 joins).
2. **Each rollback keys on its cohort and the field.** Step 1 writes under `honors-s653@bot`, step 2 under its own
   cohort, `honors-rows-s653@bot`, so neither rollback names an id. The proof inserts both steps, re-keys every
   minted Honors id to its H id as the live re-key would, then rolls back: zero step-2 rows left, then zero
   `honors_of` rows, both titles restored.
3. **The receipt.** Step 2 returns a count and an md5 over the inserted rows (`course_id>value`, `|` joined, C
   order), and refuses unless both equal the plan's (`rows_md5` in `plan.json`). No row image is promised: the
   insert-only cohort rolls back by its `reviewer_email`. Step 1's restamp is a guarded UPDATE: its before-values are
   committed in `kb/honors_of_s653_out/2026-11-14/step1_restamp_before.json`, and the proof checks that file against
   the state the guard reads and the rollback restores.
4. **The S652 follow-ups rollback refuses a partial restore.** It runs only while both titles hold the follow-up's
   value under the June stamp, and it deletes the Keep as-is rows by cohort and field (an Honors mint re-keys HUMA
   M10ME's row). After step 1 it refuses and changes nothing; it runs after the step-1 rollback. The step-1 rollback
   refuses while any step-2 row stands and unless it restores both titles, so the rollbacks run last in, first out.
5. **A value outside the live id set refuses.** The dry run aborts on any planned id outside the live set (the
   payload's index and members, the minted and stand-alone records). The insert refuses a planned row outside its
   named set and any named id merged away. `--check` (run before the apply) refuses when the SQL differs from the plan,
   a planned id is no longer live in the committed payload, or an alias map landed after the plan (`alias_era`).
   CI runs the SQL half (`--check-sql`), since the payload moves daily.
6. **Fan-in: the mint is one to one.** One H id per base (decision 3). The single-base Honors M-ID with the most
   local courses takes it by the mint's alias map. Each other one keeps its own `honors_of` row under its own id and
   merges into the H id after the mint, its own change. No two ids move onto one key, so no `(course_id, field)` slot
   is written twice; the dry run aborts if two mints name one H id, and the proof re-keys every mint and inserts the
   four follower merges with no key error.
7. **Classification.** The recall fix finds the four second bases (ANTH M1015, ENGL M1269, ETHS M1266, MATH M1330),
   which now hold as multi-base, with ENGL M1408. ASTR M1010 and HIST M10UO hold beside the CCN Honors records ASTR
   C1001H and HIST C1001H. Of the eight folds, four hold because their titles name a different course from the lead's
   (ENGL M11BM Modern Fiction and ENGL M11BN Popular Fiction beside Introduction to Fiction; MUSI M10CE, Music History
   from 1750, beside the part to 1750; ECON M10BX, the Global Economy, beside International Political Economy). The
   check reads every title word past fillers (introduction, principles) in both directions, so parts I and II differ.
   The four that agree (ENGL M11FG, ETHS M10IR, LIBR M10CJ, PHSC M10BO) fold after the mint.
8. **The matcher's recall is tested.** `kb/_honors_matcher_recall.py` derives the pairs a second way (an Honors word
   and an H-marked code beside the code without it, or the title without the word, same subject, same college) and
   reports right, wrong and missed against hand labels; `tests/honors_matcher_recall.test.js` runs it. Before the
   fix: 508 pairs, 1 wrong (MATH 211 with MATH 221), 14 missed. After: 523 pairs on the live-equivalent file, 0 wrong,
   0 missed; one candidate (Mt. SAC COUN 7H beside COUN 7, the titles sharing one word) is labeled uncertain and held
   out by the title gate. The fix: `HNRS` is an Honors word; `CHEM H206` carries the H marker; a code match accepts a
   base title that abbreviates the Honors title ("Hist Of Arch 2"). The S648 precision fixtures still pass.
9. **The two field minors** (`hold_merges` over every base of a list value; a stand-alone R4 refuses falls through to
   the evidence lane) and **COBIx's two** (the CCR worklist fails closed on a read error; the daily run puts the
   `honors-pair-joined` count on its summary) are in their own PR off `main`.
10. **Re-measured on the day's fold.** The two exports and the plan were redrawn at 18:09Z on 2026-11-14.

**Still open before step 2 applies:** the conductor's live reads (a fresh read of `kb_curation`'s `honors_of`,
`merge_into` keyed on a named id, and the three person-saved entries the plan notes) and `--check`, then a review of
this redraw. Lead mints whose base lumps several courses (ENGL M1258H, MUSI M1002H) take the base's H id as drawn;
whether such a base splits first is a question for the mints, not the rows.


## Before the mints

1. **A base's move carries its H id** (round 2). The move-selection engines drop an H id before it reaches the
   allocator: `kb/_prefix_fold_dryrun.py` `classify` counts it under `skip_offscheme_id`,
   `kb/_authority_recode_dryrun.py` skips it (`if not kind: continue`, about line 457), and
   `kb/_subjects_list_recode.py` skips it at line 138 and in its orphans list. A base can then move and leave its
   Honors id under the old prefix, while `rekey_entry` moves the `honors_of` value, so the H id no longer equals base
   plus H. Before any mint lands, each selector derives `<new base>H` from the base's move into the same alias map
   (`kb/honors_of.py` `base_of_id`, `honors_id_for`) and prints a named report line, `honors-id-left-behind`, for any H
   id whose base moves without it; a test runs a prefix fold with an H row. Today no H id is live, so nothing is
   dropped yet.
2. **The rollback and fan-in items above** (2, 4 and 6) are met in the drafted files; the mint's own rollback (the
   playbook's) inverts a one-to-one alias map, and each follower merges into its H id after the mint.

## Steps, in order

Each step lands only after the one before it, under its own receipt, and each has its undo.

0. **The field** (#3313, code only). Undo: `git revert`.
1. **First rows and the restamp**: HUMA M1110's and LIBR M1040's `unified_title` rows restamped from
   `automerge-v1@bot` 2026-06-12 to `honors-s652@bot` (COBIx's review of #3304, item 2), and `honors_of` for HUMA M10ME
   and LIBR M10CJ. On the rows branch, after items 2 to 4 above.
2. **The rows**, after every item above.
3. **HUMA M10OI into HUMA M1110** (`d-huma-m10oi-into-m1110-s652`) and LIBR M10CJ's stale minted entry, each its own
   small change after step 1, when the pairwise hold already stands.4. **The mints** (a re-mint under `docs/coursecontrolnumber_remint.md`): one alias map from each unheld Honors M-ID to
   its base plus H, dry run first, then one atomic land (minted records, memberships, promotions, identities map, crnc
   mirrors, SkyView, the overlay, `ALIAS_MAPS`, and the live re-key). Undo: the playbook's rollback, with the fan-in
   and rollback-keying items above settled first.
5. **The four follower merges** (ENGL M11FG, ETHS M10IR, LIBR M10CJ, PHSC M10BO, each into its lead's H id), after
   the mint, its own change.
6. **The held pairs**, one class at a time.
