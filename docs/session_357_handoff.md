---
title: Session 357 handoff — the display applied from the runner; Mt. San Antonio loaded; Approved programs read
date: 2026-10-10
session: 356 (SkyThicket)
tags: [handoff, program-requirements, harvest, phase-2, display, approved, checkpoint]
status: current
---

# You are Session 357

Your moniker is **SkyCanopy**. SkyThicket (S356, `session_016MrMdnFGwcXAtkUTCeyiop`) carried out Sam's three rulings, built
the display job, loaded Mt. San Antonio and started the Approved re-reads. This handoff is refreshed at each checkpoint;
the latest state is below.

## First, in this order

0. **One writer.** `list_sessions` (`mine: true`). S356 may still hold PR #1955's subscription and a check-in; if it is
   idle, you take both over (subscribe to #1955, and read `list_triggers` for its `send_later`).
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `phase-2`, `display`, `sam-ruling` (S356's three rows:
   `sam-display-5be5-go-and-approved-programs-2026-10-10`, `sam-standing-go-display-builds-2026-10-10`,
   `roep-display-apply-from-runner-2026-10-10`).
2. **#1955** (`claude/wizardly-edison-glgcyb`): merge on a green `test` on its current head. A head the workflow pushed
   (an applied record or a receipt) carries no checks; merge main or push the next change on top first.
3. **The Approved re-reads.** Cerritos (run 38064252862, branch `claude/s356-approved-cerritos`) filed 305 records, 265
   passing, 37 extracted this run for $2.42 (the summary's $16.78 is the running total); its load was dispatched at
   ~16:25Z. Mt. San Antonio (run 38064250199, branch `claude/s356-approved-mtsac`) was still reading. For each: read
   `summary.json`, load (`step=load` on its branch), then bring the filing and the receipt into one branch (merge the
   sibling branches; they touch only their own college folders), rebuild (`python3 kb/_build_roep_display.py`), and
   dispatch `step=display`. **Sam's standing go covers that apply.** Verify with the combined md5 (lessons S356).

## Priority: the next college

Sam's queue after Mt. San Antonio has no named college yet. Propose one on the sheet if he has not named it: the college
read runs only on CourseLeaf catalogs today (`capture` stops on any other platform), so the next college is a CourseLeaf
one, or the work is a second platform's enumeration.

## What shipped (S356)

- #1954 (S355's emergency checkpoint) merged.
- #1955 (open): the display job (`kb/_program_requirements_display_apply.py`, `step=display`), `STATUS_FILTER` (Active,
  Active - Teachout Only, Approved), the Mt. San Antonio filing and load receipt, display build `153ead0ce992`,
  `kb/queue_status.json` (ten Mt. San Antonio records on the call), the lane, and this checkpoint.
- Live: display `5be53871ebf4` on 292 rows (run 38064154661), then `153ead0ce992` on 605 (run 38066520396), each verified by
  combined md5 against its receipt; checked count 27 throughout. Mt. San Antonio: 313 records inserted unchecked (run
  38064248268).

## Decisions Sam made this run

- "Yes build": apply display build `5be53871ebf4`.
- "go on call 2": read COCI Approved programs too.
- "Go": a standing go for each display build that follows a college load, checked programs included.

## Not done at this checkpoint

- The UI pass on `cobi:raci` (Team & RACI) ran in a background agent on `claude/s356-ui-pass-raci`; if its PR is open,
  watch and merge it, and record the pass (`python3 scripts/ui_pass.py --record cobi:raci "<sentence>"`) if the ledger
  does not show it.
- Sam has not yet read the ten Mt. San Antonio records on the Progress call.

## Patterns that worked

- **A megabyte write runs where the key lives:** the display job applies the committed receipt and commits each row's prior
  build ([KB note](kb-notes/methodology-a-receipt-too-large-for-the-connector-applies-from-the-runner.md)).
- **Verify with one hash**, not a 44 KB query.
- **Sibling branches for parallel reads:** one running and one pending run per branch; a third dispatch replaces the pending.

## Safety patterns

- A display write on checked programs waits on Sam's go, except a build that follows a college load (his standing go).
- The load is insert-only and never touches a row already there; its receipt names the inserted keys (the rollback).
- `tests/roep_display_test.py` fails the moment a college files without a rebuild: rebuild in the same PR.

## Sign-off line for Sam

Greetings, you are SkyCanopy (Session 357), see SkyThicket's handoff — `docs/session_357_handoff.md` — let's keep rolling with our queue.
