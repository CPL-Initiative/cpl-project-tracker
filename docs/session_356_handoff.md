---
title: Session 356 handoff — the sample held; the reading room; the blocks given their numbers
date: 2026-10-10
session: 355 (SkyBramble)
tags: [handoff, program-requirements, harvest, phase-2, records, checkpoint, emergency]
status: current
---

# You are Session 356

Your moniker is **SkyThicket**. SkyBramble (S355, `session_01JWHaYACAtZ83SrSx4doFMu`) built Sam's reading tools and
started Mt. San Antonio. **This was an EMERGENCY checkpoint (Rule 9a, ~46k context left).** Refreshed: this handoff, the
harvest lane file, the lessons doc (S355 section; S320-S326 moved verbatim to
`docs/program_requirements_harvest_lessons_archive.md`), one KB note
(`methodology-a-split-view-needs-the-host-to-allow-framing.md`), the §11 row, the docs index. **NOT refreshed:**
`kb/queue_status.json` (its calls still list the two answered calls; write the new calls and changes), the CPLBrain vault
session note, the UI pass (`python3 scripts/ui_pass.py --next` still names `cobi:raci`), the pipeline tab (did not move),
kb/README, README, and the `cpl_memory_log` entries for this run's five memory rows.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`); S355 holds one check-in (`trig_01N3xqWChAokzGP4Q2ZaTEg1`, fires
   ~15:13Z 2026-10-10: "Read the Mt SAC run"). If it already fired into S355, nothing waits; otherwise delete it.
2. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `phase-2`, `sam-ruling` (five S355 rows, slugs
   `sam-todo-button-and-side-by-side-2026-10-09`, `sam-cerritos-sample-confirmed-reading-room-2026-10-10`,
   `roep-approved-status-programs-and-catalog-only-courses-2026-10-10`, and the split-view ask).
3. **Ask Sam the two open calls** (asked in chat, not answered; put them on the standing sheet if he does not answer):
   - **Go to apply display build `5be53871ebf4`** (Cerritos 270 and the pilot 22; receipt
     `kb/receipts/program_requirement_records_display_2026-10-06_5be53871ebf4.sql`, 2.2 MB, one statement per program).
     Apply in batches through `apply_migration` (22 in one timed out before; try ~25 a migration), then
     `python3 kb/_build_roep_display.py --verify-sql` must read all match. Rollback: the 270 to null, the 22 by
     re-applying `..._2360b83e8100.sql`.
   - **Read Approved programs too?** 117 at the two colleges (33 Cerritos, 84 Mt. San Antonio), about $6.50; the college
     script reads `status=like.Active*` (`kb/_program_requirements_college.py` line ~97).

## Priority 1: Mt. San Antonio (Sam: "Go on Mt SAC!", 2026-10-10)

Run **38059865531** (`program-requirements-college.yml`, dispatch on `claude/todo-button-program-requirements-x9k98l`,
college "Mt. San Antonio College", extract 1). Its filing commit lands on that branch (recreated off an older base:
merge main into it). Then: read `kb/program_requirements_college/mt-san-antonio*/summary.json`, load (dispatch
`step=load` on the branch, or a `[load]` push), rebuild the display (the builder picks the folder up), and put a
ten-record sample on a call in `kb/queue_status.json`.

## What shipped (S355)

- #1949 (S354's emergency handoff) merged. #1950 Sam's to-dos under the title; Side by side; Show the blocks fixed.
  #1951 `kb/catalog_framing.json` (64 hosts frame, 42 refuse incl. Cerritos, 2 unknown) and `scripts/catalog_framing.py`
  (HEAD for PDFs). #1952 answered calls carry a check; opening a call's record starts side by side; the reading room
  (record window right half, catalog left, Next moves both). #1953 the display build reads full-college records; each
  course carries `ids` and `here.exhibits`; the blocks show C-ID/CCN/M-ID with titles on hover or tap, and the CPL count
  opens the exhibits view.

## Decisions Sam made this run

- "Put a button to my todo items on the front"; "side by side" (both built). Confirmed all 12 sample records
  (2026-10-10 ~01:50Z; 7 checked). "Go on Mt SAC!" His question on COCI's Approved status (measured; lessons S355).
- The titles, numbers with hover titles, and the CPL count as exhibits with a drill-down (built, #1953; apply waits).

## Patterns that worked

- **Measure from a runner what the container cannot reach** (framing), and file the JSON by session.
- **Two windows must not overlap**; a browser gives one window per click.

## Safety patterns

- The college workflow's filing commit pushes to the branch that ran it; a merged branch is recreated off its base.
- A display apply is a data write: receipt first, Sam's go, batches, `--verify-sql` after.

## Sign-off line for Sam

Greetings, you are SkyThicket (Session 356), see SkyBramble's handoff — `docs/session_356_handoff.md` — let's keep rolling with our queue.
