---
title: "Session 225 handoff — the chip is live, both re-mint dry runs are receipts, and fourteen readings wait on Sam"
created: 2026-09-03
updated: 2026-09-03
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 225

Your moniker is **SkyApply** (assigned by SkyTune at sign-off, per Sam's
2026-09-03 template): the day's work, once Sam replies, is the two applies.
Predecessors: SkyCheck S222 → SkyOrbit S223 → **SkyTune S224**.

## What S224 did

Sam's greeting was *"let's keep rolling with our queue"*, and the queue's head
was the re-mint series he ruled the evening before
(`kb/csr_authority_codes_rulings_2026-09-03.json`). Three pull requests on
`cpl-project-tracker`, nothing applied — the playbook's measure-first half:

1. **#1447 (merged) — the C-ID chip, item 19.** `kb/_seed_authority_codes.py`
   attributes every C-ID / CCN subject code to a discipline from the promotions
   evidence plus the rulings and writes `ccn_subject_code`, `cid_subject_codes`,
   `canonical_source`, `authority_chips`, `authority_flag` into the seed (receipt
   `kb/reference/authority_subject_codes.json`). The CSR tab shows `C-ID AJ`
   beside `CRIM` and the word **proposed** on CSR-minted codes; the CCR Subject
   list reads `CRIM — C-ID AJ · proposed`; SkyView's subject card and tooltip
   read `Common SUBJ CRIM · C-ID AJ`, from the seed read live. 12 disciplines on
   a CCN code, 14 on a C-ID code, 120 proposed, 29 with a chip.
2. **#1448 (merged) — the authority recode dry run** (`kb/_authority_recode_dryrun.py`,
   receipts `kb/authority_recode_out/2026-09-03/`): items 7, 9, 10, 11, 12, 13,
   14, 16 as a keep-number prefix re-key. 10,292 ids move, 10,039 keep their
   number, 253 gap-fill, 539 Z ids move with their namespace; the languages by
   rule; the agriculture families by two agreeing signals; 7 of 7 gates.
3. **#1449 (merged) — the Z-band retirement dry run** (`kb/_zband_retire_dryrun.py`,
   receipts `kb/zband_retire_out/2026-09-03/`, computed `--after-recode`):
   4,053 Z identities to M by gap-filling, 10,704 pointers, 218 of 221 legacy
   anchors, 122 duplicates listed as a merge worklist; 7 of 7 gates. Stacked on
   #1448 because it consumes that receipt; it retargeted to `main` when #1448
   merged.

All of it landed before SkyTune signed off: #1448 at `ce72d60`, #1449 at
`811d376`, and this checkpoint as #1450 at `0a15703` (the dependency-map
conflicts along the way were resolved by regenerating the map, never by hand).
Nothing from this session is open on `cpl-project-tracker`.

## Sam's decisions this run (record, don't re-derive)

None new — Sam did not speak this session. Every ruling applied here is the
2026-09-03 sheet's, and the three readings it left to confirm (8, 13, 14) are
still unconfirmed: they are cards 1 to 3 of the new sheet.

## ⭐ THE THINGS WORTH CARRYING FORWARD

**A code change is a prefix re-key that keeps the number, not a re-sequence.**
`kb/_subj4_dryrun.py` numbers every bucket by title order; measured with the
committed seed it would move 62,638 of 70,946 ids to change nothing (titles were
normalized after the June fold). The POLS pattern is the tool
([KB note](kb-notes/methodology-a-code-change-is-a-prefix-rekey-not-a-resequence.md)).
**A keep-number allocation runs in two passes** or one taken key cascades down
the bucket (554 shifts from one stray). **Keys that exist only in the
articulation identities map are ghosts**, not occupants. **The collision surface
of a re-key is every catalog key** — a merged-away member keeps its id forever
— which is why 3,836 of 4,053 Z numbers could not be kept. **Kinesiology credit
lands at 996 of 999.** And **the dependency map builder scans `git ls-files`**:
rebuild it after `git add`, or CI's `--check` goes red (it did, twice).

## Read in order

1. `docs/visuals/2026-09-03-remint-series-readings.html` — the fourteen
   readings, and the artifact Sam replies to:
   https://claude.ai/code/artifact/5674d4c3-9f77-4c16-bdc7-40c5fd10bfbb
2. `kb/authority_recode_out/2026-09-03/report.md` and
   `kb/zband_retire_out/2026-09-03/report.md` — the two receipts.
3. `docs/reference/lanes/skyview-ccr-interface.md` — current truth, NEEDS SAM
   ①–⑤, NEXT ①–⑩.
4. `docs/ccr_atlas_lessons.md` §2026-09-03 SkyTune — the story.
5. `docs/coursecontrolnumber_remint.md` — the playbook (mandatory before any
   apply), and `kb/_pols_remint.py` for the keep-number precedent.
6. `cpl_memory` — `author = 'session-224-skytune'` (Rule 8: query before work).

## Priority work, in order

0. **Nothing is left to merge** — start from `main` at `811d376` or later.
1. **Sam's replies to the fourteen readings.** Record them the way SkyOrbit did:
   a rulings file beside the first (`kb/remint_series_readings_rulings_<date>.json`),
   the sheet's cards stamped "Ruled", a `cpl_memory` row per decision with Sam in
   `verified_by`, the vault braindump. Re-run both dry runs if a reply changes a
   rule (`edit: AGPS` for viticulture, `AGRI for both`, `ARBC`, `stay
   curation-only`) and re-commit the receipts.
2. **Build the two applies** from the dry runs' `compute_plan()` — apply == spec,
   a fidelity gate against the committed receipt, a fresh `kb_curation` read at
   write time (`--curation-export`, the `_subj4_apply.py` pattern), per-row
   provenance stamps, receipts restamped APPLIED. Recode: catalog keys +
   `course_id` + `subject_4letter`, memberships, articulations + identities,
   curation keys + `merge_into`, the zseq counters, the seed (canonical codes,
   umbrella flags) and `kb/foreign_language_subj4.json`. Retirement: curation
   keys + `merge_into`, `kb/common_courses.json` (+ `origin`),
   `kb/course_crosswalk.json`, retire `kb/uc_cur_zseq.json`, and the code that
   knows the Z shape (the report lists every site). Give
   `supabase-rekey.yml` a generic verify (today it counts `UC-CUR-*` rows).
3. **One cron window** (before 06:17 UTC): recode apply, Supabase re-key from its
   receipt, retirement apply, its re-key, the `_CANON_SUBJ4::` picks, then
   `kb/_post_apply_chain.py` once (it now runs `_seed_authority_codes.py` after
   `csr-seed`, so the chips flip to `c-id` where the code now matches).
   Register both receipts in `kb/_rekey_promotions.py` `ALIAS_MAPS`. Then a
   hand rebuild of SkyView (`python3 kb/_build_ccr_universe.py`) so the islands
   read the new codes.
4. **SkyView carry-overs** unchanged: Sam drives it (NEEDS SAM ①), decision packs
   per discipline (NEXT ①), the queue (②), the rim by description (⑦), the
   dropdown labels (⑧).
5. **Funding carry-overs** unchanged: `CollegeID2`, the dials, NEEDS SAM ③④⑤ of
   that lane.

## Patterns that worked

- **Measure the tool before using it.** One scratch run of the June allocator
  turned a fold plan into a rename plan before any receipt was committed.
- **Rulings as data.** The recode planner cross-checks its plan tables against
  the rulings file at runtime and prints drift; the seed script takes the
  ruled attributions from the same file.
- **Stack the receipt that consumes another** (#1449 on #1448) rather than
  committing a receipt computed on the wrong base.
- **Fixture tests for allocators**, one check per failure the real run
  produced (the cascade, the ghosts, Nahuatl taking Spanish's code).

## Safety patterns to honor

- Nothing in `kb/authority_recode_out/` or `kb/zband_retire_out/` is applied;
  the `_status` in each `alias_map.json` says DRY-RUN. An apply restamps it.
- `cpl_memory` rows from this session are INSERT-only under author
  `session-224-skytune` — rollback is `delete … where author = …`.
- The seed's new fields survive a re-seed (the preserve list) and the daily
  Supabase sync (it touches curator fields only); never edit `canonical_subj4`
  in the committed seed ahead of an apply — the catalog is keyed by it.
- Never force-push `main`; the stop-hook's post-merge nag is a false positive.
- A sheet is handed over as an artifact link; the Pages deploy prunes `docs/`.
- Item 17's dismissals stand until Sam reverses one (card 10): a human-sourced
  ruling is not superseded by a session's count.
