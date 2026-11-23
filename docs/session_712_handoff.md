---
title: "Session 712 handoff (from SkyRazorbill, S711, Sam's plain session of 2026-11-23: course moves reach the re-mint gate, the 50 outlines to find)"
created: 2026-11-23
updated: 2026-11-23
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows `docs/session_699_handoff.md`
and the routine's own newest handoff, never this file. **Numbering.** If the routine has taken 712 by the time you
start, take the next free number and say so in your handoff.

# You are SkyPuffin (Session 712)

From SkyRazorbill (S711), Sam's plain session of 2026-11-23, starting 00:20Z. **Read `docs/session_708_handoff.md` first
for the standing block; the open work in handoffs 709 to 711 still stands**, except the commons item this run closed.

A **light checkpoint**: the commons lane moved with its PR, one `cpl_memory` row, no re-mint and no data receipt.
Skipped: steps 2, 3, 5, 7 and 9 (no KB structure, nav, re-mint or pipeline change), 4 (no retired text), and 12 (no
status file reads the queue). The docs lint (`kb/docs_audit/2026-11-23.md`) flags only the standing oversized files.

## Open with the standing block (unchanged from handoff 703)

Handoff 708 carries it. The COBIx watcher ran from 00:21Z. The routine's four S703 PRs (#3675, #3683, #3684, #3686)
belong to the routine.

## What shipped

- **This PR** (`kb/_sync_subject_decisions.py`, `kb/subject_decisions.py`, `kb/_mid_readiness.py`,
  `tests/subject_course_moves_test.py` and its step in `js-tests.yml`): the commons lane's NEXT (4). The daily sync now
  also reads the Subjects panel's course moves (`course_subject_decision`, `CRS:<college>|<code>|<number>`) into
  `kb/status/subject_decisions.json` under `courses`. The readiness gate settles only the moved course, to the move's
  code and ahead of its code's save, so the twelve titles a person moves come out of the dry run where the person put
  them. The nightly mint does not read moves. A live read at 00:23Z found 0 saved moves, so no count changed.

## Decisions Sam made (verbatim in `cpl_memory`)

- `r-fix-twelve-then-one-remint-sam-2026-11-23`, above.

## Decisions the session made (each Sam's to revise)

- `d-course-move-settles-first-s711`, above.
- `d-outline-hunt-ranking-s711`: the outline list's rule (CTE credit M-IDs, never C-ID or CCN; districts per outline
  needed; a pick outside the districts with text, a read college first).

## Open work

1. **Sam fixes the twelve titles first, then one re-mint** (`r-fix-twelve-then-one-remint-sam-2026-11-23`). He
   will move them on the Subjects page on 11-23: the six electrical courses to ELEC (their M-IDs then stay) and the six
   small-business courses to ENTR (Small Business Development). When he says they are done, dispatch
   `daily-dashboard.yml` (the sync, then `kb/_mid_readiness.py`) and rerun `python3 kb/_scope_remint_dryrun.py`; expect
   19 to VOCE, 6 to ENTR, 9 staying. He accepted the draft gate on that path ("we're fine"): record it as his ruling
   when the re-mint starts, then the apply under the playbook (`docs/coursecontrolnumber_remint.md`).
2. **The 50 outlines Sam will drop** (`#collect/slos`, the new list under the SLO table; `kb/status/outline_hunt.json`).
   Load each one into `course_outcomes` under its college as the readers do, then rerun `kb/_mid_outcomes_compare.py` and
   `kb/_outline_hunt.py`; a course whose outline now prints text drops off the list.
3. **`commons`, from its NEXT line:** (1) Cerritos AED's saves under Elementary and Secondary Basic Skills and the
   uncategorized band (a person's); (2) statewide defaults by the DR-25 route; (3) a store for answering outcomes
   splits; (5) the apply; (6) the rest of the list. The held-codes list (`kb/_held_subject_codes.py`) does not read
   course moves yet; it counts codes, so it has not needed to.
4. **`cer-procedures`** (compact it below 20,000 bytes at the next full checkpoint), **`repo-size`** and
   **`my-college-action-page`**, as their lanes list them. **`program-requirements-harvest`** is the routine's. The
   commons lane is 19,520 bytes and close to its budget: compact it at the next full checkpoint.

## Pitfalls from this run

- **`cpl_memory.summary` is capped at 400 characters** (`cpl_memory_summary_check`); an insert over the cap fails.
- **The Supabase guard refuses any statement that contains the word `replace`**, even the string function. To change
  your own row, write the whole new value in a plain UPDATE.
- **The clock guard checks every time in a PR's text** against `date -u`. Read the clock in the command that writes it.

## Memory and vault

One `cpl_memory` row by `SkyRazorbill (S711)`: `kb/migrations/2026-11-23_s711_cpl_memory_rows.sql`, applied (its
00:23Z time corrected in place by a plain UPDATE), rollback in its header. Vault: a session note on a draft PR in
samueltlee/CPLBrain.

## Let go

Dropped at sign-off: the subscriptions on #3700 (merged) and on the vault note's PR (samueltlee/CPLBrain#851, a draft), the check-in, and the COBIx watcher. No
check-in or artifact is held.

Opening line: *Greetings, you are SkyPuffin (Session 712), see SkyRazorbill's handoff — `docs/session_712_handoff.md` — let's keep rolling with our queue.*
