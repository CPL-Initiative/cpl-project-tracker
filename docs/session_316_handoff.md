---
title: Session 316 handoff — sheet 19's two asks, the CER entry, and which statewide target the state publishes
date: 2026-10-02
session: 315 (SkyLedger)
tags: [handoff, implementation-funding, partner-crosswalks, sierra, decision-sheet]
status: current
---

# You are Session 316

Your moniker is **SkyTally**. S315 executed sheet 17, indexed Sierra's catalog read, traced the 2.3% target gap,
and handed Sam sheet 19. This is a full checkpoint; every Rule 9 artifact is current except the Pipeline tab (the
pipeline did not move) and `README.md` / `kb/README.md` (no user-facing surface or generator changed).

## First, in this order

1. **The checkpoint PR.** If it is open, merge it on a green `test` (squash).
2. **Read sheet 19's `replies`** (https://claude.ai/artifact/HSGh2r1HAE5CzfWTW49K44; high-water rule,
   `docs/reference/decision_sheets.md`). Also list sheet 18's store (https://claude.ai/artifact/NopXsApvXCGbnGjSTPRC5A)
   in case he answered there; both were empty at 06:12Z. Two cards:
   1. **The CER entry.** "Write" means: build a small workflow on the `funding-config-edit-apply.yml` pattern that
      INSERTs, `ON CONFLICT DO NOTHING` under `partner-crosswalks-s316@bot`, with a receipt: on
      `_CREDENTIAL_REVIEW::AWS Certified SysOps Administrator` a `unified_title_override` and a
      `unified_title_merge_confirm`, both *AWS CloudOps Engineer - Associate* (the value the CER's `saveGridRowCore`
      writes for each); on `_CREDENTIAL_REVIEW::Microsoft Certified: Azure AI Fundamentals (AI-900)` a
      `unified_title_override` of *Microsoft Certified: Azure AI Fundamentals*. Map the writer in
      `kb/governance_surface_map.json` (Rule 10 a3; `kb_curation` already has bot cohorts, so the reason is the
      point). Cross-check pending `unified_title_merge_confirm` targets first (Rule 10 a). Then dispatch
      `cred-rename-apply.yml` (it fresh-syncs and dry-runs itself). "Type" means: re-read `kb_curation` and run the
      rename once the rows exist; if they do not, read the edge log before asking again
      (`methodology-a-verdict-that-reports-an-action-is-checked-in-the-store`).
   2. **The statewide Access target.** "Sum": the card, the explainer and the Scenario 2 film print 4,366.7
      (the institutions' targets added up). Find where `prioTarget(null, p)` feeds the card and `_publicProgress()`,
      decide with the code whether to sum through `earnAgg()` (crTarget + ncTarget), and re-render the film
      (`_Scenario_2_v7`). "Division": keep 4,467.6 and add one line to the Statewide row's detail naming the maximum
      award as the difference. Either way, measure again over the live config first: the S315 numbers came from
      the `e21658f9` fixture.
3. **ElevenLabs** still waits on Sam's Scenario 2 script (sheet 6 card 1).

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

## Sam's rulings this run (sheet 17, 04:18Z)

- Card 2 **"Apply them"** (executed). Card 1 **"Done"**, with no `kb_curation` row and no CER load in the edge log
  after 22:46Z on 1 October; sheet 19 card 1 changes the mechanism. `cpl_memory` `sam-sheet17-rulings-2026-10-02`.

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
