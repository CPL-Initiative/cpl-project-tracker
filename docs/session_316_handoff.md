---
title: Session 316 handoff — sheet 19's two asks, the CER entry, and which statewide target the state publishes
date: 2026-10-02
session: 315 (SkyLedger)
tags: [handoff, implementation-funding, partner-crosswalks, sierra, decision-sheet]
status: current
superseded: true
superseded_by: session_320_handoff.md
---

# You are Session 316

Your moniker is **SkyTally**. S315 executed sheet 17, indexed Sierra's catalog read, traced the 2.3% target gap,
and handed Sam sheet 19. This is a full checkpoint; every Rule 9 artifact is current except the Pipeline tab (the
pipeline did not move) and `README.md` / `kb/README.md` (no user-facing surface or generator changed).

## First, in this order

Sam answered sheet 19 at 11:52Z (both his own call): card 1 **"write"**, card 2 **"sum"**. S315 shipped card 1's
workflow and ran out of context before card 2. `cpl_memory` `sam-sheet19-rulings-2026-10-02`.

1. **The open PR.** #1820 (the CER workflow, carrying this checkpoint) or its successor: merge on a green `test`.
2. **Card 1, the CER entry.** If `kb/cer_decisions_out/2026-10-02/applied_*.json` is on `main`, the rows were
   written; confirm in `kb_curation` (cohort `partner-crosswalks-s315@bot`). If not, dispatch
   `cer-decision-apply.yml` with `plan_dir=kb/cer_decisions_out/2026-10-02`: `dry-run` (expect 3 to write, 0 held),
   then `commit`. Then dispatch `cred-rename-apply.yml` (it fresh-syncs and dry-runs: expect 1 confirmed merge,
   AWS SysOps into *AWS CloudOps Engineer - Associate*, and 1 clean rename, the Microsoft title). Confirm
   `kb/cred_rename_out/2026-10-02/` lands and the derived files rebuild.
3. **Card 2, "sum": the statewide Access target becomes the institutions' sum.** Re-measure over the LIVE config
   first (dump `select config from cpl_funding_config where id='default'` through the MCP to a file;
   `scripts/funding_effective.js --config`; the S315 figures, 4,366.66 vs 4,467.60, came from the `e21658f9`
   fixture). Today the Access card and `_publicProgress()` read `prioTarget(null, p)` (funding ÷ price); the
   Statewide row's detail sums `earnAgg()`'s `crTarget + ncTarget`. Make the card, `_publicProgress()` (the
   explainer reads it) and the film's figure the sum; keep `prioTarget(null, p)` wherever a price, not a target,
   is meant. Grep tests for 4,467.6 and the retired sentences before pushing (`cpl_memory`
   `wording-change-grep-tests-for-retired-sentences-2026-10-01`). Re-render Scenario 2's introduction as `_v7`
   (`prototype/funding_video/build.py`) and point the explainer at it.
4. **ElevenLabs** still waits on Sam's Scenario 2 script (sheet 6 card 1).

## What shipped

- **#1815 + the workflow at 04:52Z:** sheet 17 card 2. Both scenarios' Introduction now reads "The Chancellor's
  Office measures outcomes..." and "CPL funding relies on data...", and the Timeline "CPL Funding Procedure
  Finalized" and "Guidance Memo Release". Config md5 `7e59830b` → `764fd264`; receipt
  `kb/funding_config_edits_out/2026-10-02-2/`. The workflow now takes `<date>-2..9` for a later plan the same day.
- **#1817 + migration `chatbox_college_courses_top_code_idx`:** `program_typical_courses` 1,521 → 15.5 ms on a
  quiet database (seq scan of 4,215 buffers → bitmap scan of 419). Receipt names the rollback.
- **#1816, #1818:** sheets 18 and 19 (18 superseded with no replies). The 2.3% gap measured: the seven institutions
  at the $400,000 maximum carry 78.8 FTES each (Mt. San Antonio 62.0 of the 100.9); no other target moves.
- **Sierra v80's first clean smoke** (run 36961860002): 7c leads LBCC VN 220, 7s Rio Hondo VN 61; all checks pass.

## Sam's rulings this run (sheet 17, 04:18Z; sheet 19, 11:52Z)

- Card 2 **"Apply them"** (executed). Card 1 **"Done"**, with no `kb_curation` row and no CER load in the edge log
  after 22:46Z on 1 October; sheet 19 card 1 changed the mechanism. `cpl_memory` `sam-sheet17-rulings-2026-10-02`.
- Sheet 19: card 1 **"write"** (a session writes the CER rows; #1820), card 2 **"sum"** (step 3 above).

## Carryover

- `cpl_funding.js` `DEFAULT_TIMING` and the default introduction still say "model"; inert while both scenarios
  carry saved text (left, noted in `cpl_funding_lessons.md`).
- `chatbox_college_courses` reads 2,542 heap fetches on an index-only scan: its visibility map is stale (autovacuum's
  job; note only).
- `kb/_docs_audit.py --apply` reads handoffs 314 and 315 as parallel siblings of 316 (same `date`, 2026-10-02) and
  stamps neither; three sequential sessions in one day hit the sibling rule. The highest number stays authoritative.

## Safety patterns

- ⚠️ **A "Done" is a report; read the store and the edge log** before the next step.
- ⚠️ **One funding-config plan per directory**: rollback reads every receipt in it; a second plan the same day takes
  `<date>-2`.
- ⚠️ **Time an index both sides in one sitting** (`timing off`): "48 ms quiet" from another day read 1.9-3.4 s today.
- ⚠️ **A prompt change to Sierra goes through `cpl-chat-preview-ab.yml` before deploy.**
- ⚠️ **The SQL guard blocks any statement containing a DDL word**; DDL goes through `apply_migration`.
- ⚠️ Budgets at the edge: `CLAUDE.md` 59,975 / 60,000; lanes `sierra-retrieval-corpus` 19,999,
  `implementation-funding` 19,965, `partner-crosswalks` 19,867 of 20,000. Delete before you add.
