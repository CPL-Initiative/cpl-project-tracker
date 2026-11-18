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
  values at every re-mint, and because the rows apply only after the dry run's `--check` re-measures the plan on the
  day's payload (*Before the rows apply*); the SQL itself cannot see the live id set.

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
    as taken (`skyview_ids`). **`prototype/ccr_remint_blast.json`** (the re-mint blast-radius view, id-keyed) names 9
    of the 267 Honors ids the first plan would mint; the mint re-keys its entries in the same land (#3315's third
    review).
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
(`kb/honors_of_s653_out/2026-11-15/`), the anchors (`kb/_honors_anchors.py`), the second derivation
(`kb/_honors_pairs_second.py`), the self-recall measures (`kb/_honors_matcher_recall.py`) and the step-2 migration and
rollback, none in `kb/migrations/.apply`. Step 1 is applied (#3329, 2026-11-14 18:44Z). Four reviews read the step-2
plan. Each found the lump and sequence class again: every design asserted the Honors relation between two clusters and
tried to certify, by title and sequence rules, that each cluster is one course, which is the M-ID layer's own
unfinished work. The S654 conductor replaced the question (`d-honors-anchored-rows-s654`), under Sam's rulings that
M-IDs are "low stakes attempts to get our course clusters as close to right as we can" and that the care goes into
the rewiring (`sam-mids-are-ours-trial-and-error-2026-11-14`, `sam-mid-care-goes-into-the-rewiring-2026-11-14`).

- **An anchor** is two courses at one college: an Honors course and a base course whose codes name the same subject
  and the same number once `honors_code_base` strikes the marker (a space before the H included, and up to three
  letters before it: De Anza's F TV 2CWH; 1AH pairs with 1A, never 1B; padding zeros dropped after any non-digit, so
  San Jose City's "(ETH) 027H" meets "(ETH) 27"), with a second signal at the course level: an Honors word in the
  Honors course's title. A number pair whose titles disagree is a doubtful anchor, and so is a pair whose Honors
  course carries no Honors word (equal titles, the marker in the number: Contra Costa's PHYS 121H). An H ending the
  subject under a title with no Honors word is no Honors course (Glendale's ARTH 119 beside ART 119), nor is a
  trailing H in a series (A to G at the college). Titles are read with HTML entities decoded.
- **A row.** An Honors M-ID gets an `honors_of` row to base B when it has an anchor and every anchor lands in B, an
  M-ID or an official id. Anchors in two bases hold it ("anchors split"); a doubtful anchor holds it; no anchor, no
  row. The safety holds stay: a pending alias map, a merge slated or decided, a person's join, another `honors_of`
  on the id, a CCN Honors record beside the base, an id mostly not Honors courses.
- **A mint** (step 4, planned here) needs the row and: every member course anchored; exactly one Honors M-ID anchored
  into B; no CCN-coded course in B, whatever kind of base B is (an official base mints nothing, so there the clause
  holds the row itself: MATH 210 holds MATH C2210 and C2210H); no second base named by another derivation; and the
  base is no split candidate (COBIx's Q1, `d-honors-no-mint-on-split-candidate-s654`): a mint names the Honors id
  after a base that may itself be split or re-minted, and that rewiring is the costly part, so the row stands on its
  anchors and the mint waits for the split.
- **The cluster tests decide no row.** One title group, two course numbers, the sequence marks (an explicit I or 1
  differs from no mark), the Honors side's title groups and the base's subjects (MATH, BIOL and LIB are three) flag a
  base as a **split candidate** for the re-clustering lane, and the flag waits its mint only. A row on an impure base
  is the base's own impurity, and its anchors say where the row goes when the base is split.
- **A subject is read by its first three letters**, except where those letters join two disciplines:
  `SUBJECT_FAMILY_APART` reads ENGR, COMP and BIOT (and their long forms) apart from ENGL, COMM and BIOL (COBIx's
  finding 1, S655). **An H ending the subject is the Honors marker** only for the subjects `HONORS_SUBJECTS` lists by
  college: Victor Valley's CHEMH and HISTH, every such subject on the 2026-11-15 payload (finding 2). Both are pinned
  by `tests/honors_subject_reading_test.py`.
- **Every row carries its anchors** (college, both codes, both titles) in `plan.json` and `plan.md`, and the class
  digest covers them.
- **The apply-day re-measure and its receipt.** `--check` reads the newest plan folder (or `--date`), re-measures on
  the checkout's payload, refuses unless the rows md5 and the class md5 are the plan's, and on a pass writes
  `check_receipt.json`: origin/main's head, both digests, the SQL file and its sha256, the payload's sha256s. The rows
  SQL names the receipt in its header, once, in the exact form. `scripts/supabase_migrate.py` refuses a file that
  names one unless the receipt sits inside the repo, names the trigger's file and its sha256, names the payload as
  the checkout holds it, and was written at `main`'s head as it stands at the apply; a near-miss spelling of the
  header refuses, and the runner keeps a list of files that must carry a receipt (the rows SQL first), so deleting
  the header line never skips the gate.

**The plan today** (committed `unified_courses_members.js`, generated 2026-11-15 06:19, the daily run `e0573f42`;
redrawn S655 and identical to the 2026-11-14 20:25 plan in every pair, class, anchor and both digests; the two subject
readings moved only the split-flag text of 8 pairs; local courses): 590 anchors on
M-ID Honors courses and 3 doubtful. 519 pair records: 129 row and mint, 179 row with the mint held (176 on a split
candidate), 74 row only on an official base, 40 held, 97 none. Waiting the mint on split candidates moved 157 mints;
the rows and their digest are unchanged. Held by first reason: 27 anchors split, 8 an official base holding a CCN-coded
course, 3 doubtful anchors only, 1 beside a CCN Honors record, 1 an anchor's base inside the Honors id. 382 rows: step
1 wrote 2, step 2 writes 380. 234 bases are split candidates. COBIx's Q2, counted: 123 Honors-word courses in an
M-ID have no anchor (29 under an Honors-program subject, HONORS, HNRS or HON, all colloquia and topic seminars with
no subject twin; 49 with no H in the code, a renumbered Honors course or a title-only pair; 45 with an H but no base at
the college), each listed in `plan.json` and out of reach by design; 26 bases take two or more Honors M-IDs (55 ids),
named in `plan.md` as Honors-side merge candidates, their rows standing and their mints waiting.

**The cases the reviews named**, as the rule decides them: LIBR M10CL row, mint held (Fullerton LIB 100HF beside LIB
100 F; the base carries three subjects); BIOL M1317 row, mint held (Cosumnes BIOL 485 has no H in its number, so it
rides unanchored); HIST M1165 row, mint held (three anchors into HIST M1191, a split candidate on its sequence marks);
HUMA M10LS row, mint held (Irvine Valley HUM 1H beside HUM 1, the same); BIOL M1091 row and mint (a clean base); MATH M10NA held
(San Jose City's 071H meets 71 in MATH 210, which holds MATH C2210 and C2210H); MATH M1333 held on the same clause;
ETHS M1266 held (anchors split over ETHS M1213 and ETHS M1218); PHYS M1015 held (a doubtful anchor only).

**The self-recall measures** (`kb/_honors_matcher_recall.py`, by hand): 24 anchor labels, among them the ECON 101 H,
LING 101 HC, MATH 1A H, (BIOL) 020H and F TV 2CWH shapes, an entity inside the Honors word, a part I beside a part II,
a series letter H, a number pair with different titles, a code-only H as doubtful, Victor Valley's CHEMH and an
Honors-titled ARTH beside ART; 22 cluster labels (11 self-contained, 11 on the ids the reviews named, each resolved through `kb/alias_chain.py` from a pinned `LABEL_ERA`,
with one renamed-label case, and failing on an id that is gone). Dropping each of the 18 clauses of rules 1 to 3 in
turn fails a label. `tests/honors_matcher_recall.test.js` scores the cluster labels against the committed
`plan.json`; the live re-score stays in `--plan`'s abort gate.

**The undo, last in, first out.** Step 2's rollback keys on its cohort and the field, keeps a row a person validated,
and refuses while any `kb_curation` row is keyed on an H id, the step-4 mint's marker. The step-1 rollback counts only
removable step-2 rows, so one Verify on a step-2 row blocks neither it nor the S652 rollback, and it reads the same
marker. The Postgres proof runs every case with no hand delete.

**After the apply.** The plan treats an `honors_of` row that names its anchored base as standing, so the re-measure
gives the same classes once the rows sync. `tests/honors_of_rows_plan.test.js` reads `kb/migrations/.apply`: when it
names the rows file, its last check reports the applied state rather than failing. The generator's
`committed_curation` emits only entries that carry a discipline or a `merge_into`.

**Still open before step 2 applies:** a short review of the anchors; #3329 merges first, then this branch merges
`main`, keeping `main`'s APPLIED header on the step-1 migration; the conductor's live read of pending
`unified_title_merge_confirm` rows; after the next daily run, `--check` and its receipt with the `.apply` line.

## Before the mints

0. **Two notes from the anchors review.** HLTH M10ZH mints HLTH M1134H beside C-ID PHS 102, a plain C-ID with five
   courses and one Honors course (Cypress PHS 281HC); counting it would hold a mint on a non-Honors id, so step 4
   decides it as a base split or merge, and no step-2 row is affected. And step 4's own rollback (the inverse alias
   map) is written and proved before the mint: the step-1 and step-2 rollbacks refuse while any row is keyed on an
   H id, and the proof's mint cases use a synthetic inverse today.

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
1. **First rows and the restamp** (done: applied 2026-11-14T18:44:02Z by supabase-migrate run 43627165705; receipt
   `kb/receipts/migration_s653_honors_of_field_43627165705.json`): HUMA M1110's and LIBR M1040's `unified_title` rows restamped from
   `automerge-v1@bot` 2026-06-12 to `honors-s652@bot` (COBIx's review of #3304, item 2), and `honors_of` for HUMA M10ME
   and LIBR M10CJ. Its own PR (#3329, `claude/honors-of-step1-s653`), after five readers of #3315 judged it safe.
   The S652 follow-ups rollback refuses unless it restores both titles, so after step 1 it refuses and changes
   nothing. The step-1 rollback refuses while a removable step-2 row (cohort `honors-rows-s653@bot`, not validated
   by a person) stands or a row is keyed on an H id, and unless it restores both titles; it deletes its rows by
   cohort and field, and keeps a row a person validated (`kept_for_a_person`). The anchored plan mints neither HUMA
   M10ME nor LIBR M10CJ. The restamp's before-values are committed in
   `kb/honors_of_s653_out/2026-11-14/step1_restamp_before.json`. Proof: `tests/kb_curation_guarded_sql_proof.py`.
2. **The rows**, after every item above.
3. **HUMA M10OI into HUMA M1110** (`d-huma-m10oi-into-m1110-s652`) and LIBR M10CJ's stale minted entry, each its own
   small change after step 1, when the pairwise hold already stands.
4. **The mints** (a re-mint under `docs/coursecontrolnumber_remint.md`): one alias map from each unheld Honors M-ID to
   its base plus H, dry run first, then one atomic land (minted records, memberships, promotions, identities map, crnc
   mirrors, SkyView, `prototype/ccr_remint_blast.json`, the overlay, `ALIAS_MAPS`, and the live re-key). The live
   re-key moves every field of an Honors id to its H id, `honors_of` included; a `kb_curation` row keyed on an H id is
   the mint's marker, which the step-1 and step-2 rollbacks read and refuse on. Undo: the playbook's rollback first
   (it moves the rows back off the H ids), then the step-2 rollback.
5. **The four follower merges** (ENGL M11FG, ETHS M10IR, LIBR M10CJ, PHSC M10BO, each into its lead's H id), after
   the mint, its own change.
6. **The held pairs**, one class at a time.
