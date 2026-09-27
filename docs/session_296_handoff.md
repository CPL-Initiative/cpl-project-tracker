---
title: Session 295 handoff — the ESL apply, the CLAUDE.md prompt audit, and main's lints
date: 2026-09-27
session: 295 (SkyHarbor)
tags: [handoff, doctrine, esl-packaging, ci]
status: current
---

# You are Session 296

Your moniker is **SkyBeacon**. SkyHarbor (S295) took the queue from
[`session_295_handoff.md`](session_295_handoff.md). Three PRs merged (#1708, #1709) or wait on
CI (#1710), and the ESL writes are live.

## What shipped

1. **The ESL sheets are applied.** S295 dispatched `esl-sheet-apply.yml` (dry-run, then commit,
   one run at a time) for `kb/esl_sheet_out/2026-09-26` and `2026-09-27`: 147 + 2 rows, none held.
   The live table reads `esl-catalog` 6 · `esl-health` 18 · `esl-ladder` 30 · `esl-newfold` 89 ·
   `esl-transfer` 3 · `esl-vesl` 2, and the daily run published it (2cc2f03). Both of Sam's Complete
   threads are answered and resolved.
2. **The CLAUDE.md prompt audit** ([#1708](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1708)),
   queue item 0. Fifteen incident stories and outdated wordings moved verbatim to
   `docs/reference/doctrine_provenance.md` with every rule in place; the file fits its budget
   (59,436 of 60,000 B). Report: `kb/prompt_audit/20260927_claude_md_prompt_audit.md`.
3. **Main's lints** ([#1709](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1709)). The first
   curation change to reach the nightly sync turned `main` red twice: the daily run never rebuilt
   `prototype/ccr_remint_blast.json` (Step 4d7 now does), and `tests/legacy_anchor_duplicates_test.py`
   counted merged anchors as missing.
4. **The ESL monthly pass** ([#1710](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1710),
   Sam's item 8): `kb/_esl_monthly_pass.py`, the lint `esl_monthly_pass_due`, cadence CA-08. First
   pass: nothing new. **Merge it once `test` passes on its head** if S295 did not.

## Waiting on Sam

- **The CLAUDE.md Cleanup sheet**, https://claude.ai/artifact/Kd6K7yrAfGQKCtVyd4bhX5 (eight cards,
  `kb/_build_claude_md_audit_decision_sheet.py`). **Read its replies first** (`ArtifactData list`,
  collection `replies`, and `replies/done`), then execute: the proposed diff for each card is in the
  report. Cards 4, 5, 7 and 8 edit `CPLBrain/CLAUDE.md` and `cpl-knowledge-base/CLAUDE.md`
  (a PR in each; the knowledge-base one touches no curated content unless card 5 says curate).
- **The narrated draft** (S294): unchanged, waiting on his OK.

## The queue, in Sam's order

1. **The CLAUDE.md sheet's verdicts** (above).
2. **The narrated video:** waiting on his OK.
3. **ESL:** the next monthly pass when `esl_monthly_pass_due` fires (after 2026-10-28). Then the
   Jev CCR's misfit ruling (nest or cross-list, [handoff 283](session_283_handoff.md) "first
   sitting") and its next rung.
4. **SkyView.**
5. **The EACR grid review**, whenever he opens it.

## Read in order

1. The sheet's replies, then `kb/prompt_audit/20260927_claude_md_prompt_audit.md`.
2. [`lanes/esl-packaging.md`](reference/lanes/esl-packaging.md) (after #1710 merges).
3. [`doctrine_provenance`](reference/doctrine_provenance.md) before you reword any rule.

## Patterns that worked

- **Measure the context yourself.** In a three-repo session the context meter never fires (card 1);
  `python3 kb/_context_budget.py` at start, after a long stretch, and before sign-off.
- **When `main` is red, run every step of the lints job locally** (extract the `run:` blocks from
  `js-tests.yml`): the job stops at its first failure, and a second one hid behind the first.
- **Merge the base into your branch, then regenerate**: generated-file conflicts resolve by
  rebuilding (dependency map, docs index), never by picking a side.
- **Move doctrine verbatim, then prove it**: `kb/_consolidation_loss_audit.py --baseline HEAD:CLAUDE.md`.

## Safety patterns

- ESL writes go through `esl-sheet-apply.yml` only, one dispatch at a time (it shares the daily
  cron's concurrency group). Never hand Sam SQL.
- Do not republish the standing open-asks sheet onto its store; a sheet whose cards changed gets a
  fresh `SHEET_ID` and artifact.

## Carryover

- Checkpoint artifacts not refreshed, with the reason: the Pipeline tab (no re-mint this run),
  `README.md` (no user-facing change), `kb/README.md` (it does not list the ESL scripts).
- Add *maths* to `BRITISH_FORMS` in `kb/_docs_audit.py` (it would flag the word corpus-wide).
- The governance register's CA-04 still says "every ~100K tokens", and `checkpoint_overdue`'s
  message still quotes the old trigger.
- The dry run labels Sam's keep-apart identities "unruled"; the monthly pass carries the rulings.
