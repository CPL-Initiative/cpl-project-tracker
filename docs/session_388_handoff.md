---
title: "Session 388 handoff — course outcomes from catalog pages; Palo Verde's catalog year"
date: 2026-10-14
session: 387 (SkyMagnolia)
tags: [handoff, program-requirements, course-outcomes, census, addenda, decision-sheet]
status: current
superseded: true
superseded_by: session_394_handoff.md
---

# You are Session 388

Your moniker is **SkyBuckeye**. Session 387 (**SkyMagnolia**, `session_01EqGYSCbhp3QNLn6HHupoDG`) ran on Sam's greeting
and heard nothing more from him. `list_sessions` first and agree one writer.

## What shipped (S387)

- **#2101 (merged):** course pages at the seven loaded colleges with no course SLOs. eLumen (Cabrillo, Modesto, Palo
  Verde) prints each course's SLOs on its catalog page; the Coast district serves outlines of record by code
  (`catalog.cccd.edu/courses/acct-c116/`); Cerritos, Long Beach City and Mt. San Antonio print none.
- **#2102 (merged):** the eight addenda amending loaded colleges' catalogs read. An online catalog's pages already carry
  each change (Norco's PDS-809, Cerritos's EDT 110 checked), so an addendum explains a catalog-and-COCI mismatch.
  Miramar's listed "addendum" is its whole 2025-26 catalog.
- **#2104 (merged):** the census picked Palo Verde's 2025-26 eLumen catalog over 2026-27 at `catalog.paloverde.edu`
  (Acalog). Fixed in two tries; dry run 38508144436 moves Palo Verde alone. It applies Sunday 10:29 UTC.
- **#2103 (open, draft):** the eLumen path for `kb/_course_outcomes_read.py` (index by code, the Learning Outcomes box
  parser, `source_kind = catalog`). Cabrillo's full read (run 38507187621, three slices) was running.
- **#2105 (open, draft, stacked on #2103):** the Coast district path (`cccd_index`, the outline parser, `catalog=<slug>`
  in `.run`). Coastline's full read (two slices) was running.

## Decisions Sam made this run

None. [Open Asks Sheet 78](https://claude.ai/artifact/C7yerEAqAaTosz6XvzLv9Z) (current) is unanswered.

## Priority, in order

1. **Read Sheet 78's replies first** (`ArtifactData` list `replies`); act per handoff 387's card notes (both cards spend
   model calls: hold until he answers).
2. **#2103: finish Cabrillo, then Modesto, then load both.** When the branch holds three `read_*_p<i>of3.json` under
   `kb/course_outcomes/cabrillo/` with `complete: true`, push `.run` = `catalog=modesto_junior` / `parts=3` and
   `.load` = `host=cabrillo` (two pushes; a load commits its receipt). Then load `host=mjc`. Check `test` and merge
   (squash). Hold Palo Verde: its records are 2025-26 (priority 4).
3. **#2105: after #2103 merges,** merge main in, load `host=cccd` when both Coastline slices are complete, merge.
4. **An Acalog reader** for `kb/_program_requirements_college.py` (Palo Verde 2026-27, El Camino, San Joaquin Delta):
   capture Palo Verde with no model calls, then put the extraction on the next sheet. Confirm Sunday's apply moved the
   registry row first.
5. **The addenda reading agent:** files `programs_changed` per addendum with the change's date (a write function on the
   census's pattern; the eight reads are in run 38504437775's log).
6. **The UI pass** was skipped this checkpoint (no room for a fix PR): `python3 scripts/ui_pass.py --next`.

## Docs to read

`docs/reference/lanes/program-requirements-harvest.md` · `docs/program_requirements_harvest_lessons.md` (S387) ·
`docs/kb-notes/methodology-a-green-check-you-did-not-scope-is-not-evidence.md` (the fifth green).

## Patterns that worked

- **A dry run is the census's live test.** A push to `kb/_program_source_census.py` on a `claude/*` branch runs a full
  dry run over all 118 colleges in about 11 minutes; its shards print a CENSUS ROWS JSON block to diff against the
  registry. Do not also dispatch one (cancel the queued duplicate).
- **A fixture must carry what decides the branch:** the first census fix passed its test and failed live because the
  fake page had no HTML.
- **Trial before parser:** `trial=12` files each page's HTML and text; write the parser against them, then
  `--reparse` the trial.
- **A stacked branch has its own `.run`,** so a second read can run beside the first on a different host.

## Subscriptions and check-ins

At sign-off S387 drops its subscriptions to #2103 and #2105 and cancels check-in `trig_013V4e21WSS1XYwpmer94o3i`.
The CPL Queue routine fires 05:12 UTC.
