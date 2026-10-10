---
title: Session 357 handoff — the display applied from the runner; Mt. San Antonio loaded; Approved programs read
date: 2026-10-10
session: 356 (SkyThicket)
tags: [handoff, program-requirements, harvest, phase-2, display, approved, checkpoint]
status: current
---

# You are Session 357

Your moniker is **SkyCanopy**. SkyThicket (S356, `session_016MrMdnFGwcXAtkUTCeyiop`) carried out Sam's three rulings, built
the display job, loaded Mt. San Antonio and the Approved programs at both colleges, and ran Team & RACI's first UI pass.
This handoff is refreshed at each checkpoint;
the latest state is below.

## First, in this order

0. **One writer.** `list_sessions` (`mine: true`). S356 signed off holding nothing: no PR subscription, no check-in, no
   artifact watch.
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `phase-2`, `display`, `sam-ruling`, `ui-pass` (S356's rows:
   `sam-display-5be5-go-and-approved-programs-2026-10-10`, `sam-standing-go-display-builds-2026-10-10`,
   `roep-display-apply-from-runner-2026-10-10`, `roep-approved-loaded-both-colleges-2026-10-10`,
   `roep-summary-cost-is-cumulative-2026-10-10`, `a11y-engine-dedupes-contrast-by-tag-and-color-2026-10-10`).
2. **#1957** (Team & RACI UI pass, this checkpoint): if it is still open, merge it on a green `test` on its head.
3. **State.** #1955 and #1956 merged. The Approved programs are loaded at both colleges (Cerritos +33, Mt. San Antonio +70,
   $6.89 for the re-reads). Display build `ee814befc65d` holds on 700 rows (run 38068711585, combined md5
   977aaaebe1171b9af65db321cfc125cc); checked count 27. Eight live rows whose pages went to Approved programs stay on
   `153ead0ce992`: Cerritos 19170, 19172; Mt. San Antonio 31598, 32892, 38942, 43373, 43777, 43999. Whether such a row keeps
   its old display or is marked is a small call for Sam (a sheet card, if it needs one); nothing reads them wrong today.
4. **Sam's reading:** the ten Mt. San Antonio records on the Progress call; 681 records wait in all.

## Priority: the next college

Sam's queue after Mt. San Antonio has no named college yet. Propose one on the sheet if he has not named it: the college
read runs only on CourseLeaf catalogs today (`capture` stops on any other platform), so the next college is a CourseLeaf
one, or the work is a second platform's enumeration.

## What shipped (S356)

- #1954 (S355's emergency checkpoint) merged.
- #1956 (merged, 77c0249): the Approved filings and loads at both colleges, display build `ee814befc65d`.
- #1957 (open at this writing): the Team & RACI UI pass, its ledger record, this checkpoint.
- #1955 (merged, 241b5f7): the display job (`kb/_program_requirements_display_apply.py`, `step=display`), `STATUS_FILTER` (Active,
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

- The UI pass on `cobi:raci` is done and recorded (#1957). Deferred from it: edit-mode keyboard access (the clickable
  RACI, directory and status cells need a button inside) and the Mission Control wiring entry
  (`"raci": ["mission_control.js"]` in `MODULE_ALIASES`, `kb/_build_cobi_admin_surface.py`, then regenerate). Next due:
  `cobi:map-users`.
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
