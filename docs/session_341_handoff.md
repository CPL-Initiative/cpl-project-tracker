---
title: Session 341 handoff — Santa Monica's record filed; read maps placed by term; the live load waits on sheet 46
date: 2026-10-07
session: 340 (SkyLedger)
tags: [handoff, program-requirements-harvest, cpl-pathways, decision-sheets]
status: current
superseded: true
superseded_by: session_342_handoff.md
---

# You are Session 341

Your moniker is **SkyTerrace**. SkyLedger (S340, `session_01Ft9HHtGiaTVRdzQjZ4rMz4`) was a Sam-started session; Sam gave
the greeting and nothing else, so it ran handoff 340's two priorities as far as they go without his go.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`). At sign-off S340 was the only running session.
2. **Open Asks Sheet 46** ([EMbKxa6H8D8fa3ZudacQSJ](https://claude.ai/artifact/EMbKxa6H8D8fa3ZudacQSJ), current; sheet
   45 is superseded by it). Read `replies` and `replies/done` with `ArtifactData`. Cards 1-6 are sheet 45's six at the
   same positions; 7 and 8 are the harvest's.
3. **Library filer:** `python3 scripts/library_file.py --check`. At S340 it still answered `invalid_client`, the three
   saved values still 43 / 19 / 14 characters. Measure lengths only; Sam was told once more.

## Priority 1: sheet 46 card 8, the live load (only on Sam's "Load both")

Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767 sit in `kb/program_requirements_pilot/records_maps/`.
On his go, in this order:

1. `git mv` both into `records/`; run `python3 kb/_program_requirements_load.py` (the load receipt grows to 22, both
   unchecked); apply it as a named migration (execute_sql refuses row changes; see the memory rows on apply_migration).
2. Deploy cpl-chat (its `MAP_STATUS_LINE` gains `read`, #1894). Sierra must know the status before the table carries it.
3. Rebuild the display. Moving the files does not change the display, so the build should stay 9f60f746ea49; if it
   does, apply `kb/receipts/program_requirement_records_display_2026-10-06_9f60f746ea49.sql` as it stands, then
   `python3 kb/_build_roep_display.py --verify-sql` and run the printed query: every row must say `match`.
4. Tests to update with it: `tests/sierra_program_courses.test.js` pins `current (20 records)` and `20 checked`.

Card 7 (*Proceeded*: Santa Monica's procedure record v1): on *Undo it*, restore the prior record from the registry's
history row and take Santa Monica's record off the page.

## Priority 2: what the read map can say next

- **The recommended-path figure** stays TBA (`figure.path` null; `path_why` says the map is read). Sam's sheet 32 asked
  for it where a map is read: the CPL a learner clears along the map's picks. It needs a rule for a choice the map
  leaves open (Santa Monica's Salon Experience, 1-4 units) before it is a number.
- **Sierra** says only that the map is read. She could say a course's term; the terms are in `display.map`.
- **By requirement** could mark the courses the map names (*On the college's map*), the note the term view promised.

## What shipped

- **#1894** (merged at sign-off): Santa Monica's source and record; `RECORD_FOLDERS`; `term_map()` and `roepReadMap`;
  `plan()` counts a course once (Irvine Valley 6 → 3 units; Santa Monica 21.5 of 26.5; no pilot figure moved); both
  dated reads cover seven colleges; Sierra's read-map line; display build 9f60f746ea49 and its receipt. Checkpoint.
- **Vault #264:** Open Asks Sheet 46 and its builder; the S340 session note.
- **KB note updated:** `methodology-a-postgres-md5-proves-a-transcribed-jsonb-copy` (a fingerprint per row refreshes a
  dated read without re-copying it).

## Decisions Sam made this run

None. He gave the greeting only.

## Waiting on Sam

- Sheet 46: all eight cards. Card 8 is the harvest's next step.
- Re-save the Library filer's three Google values at full length (only sessions started after the save see them).
- Drop the two Summit v2 MP4s into Drafts (from handoff 340).

## Patterns that worked

- **Re-score a transcribed record.** A local `score()` equal to the run's, key for key, proves the copy.
- **Fingerprint a dated read per row** in SQL and in Python; re-read only the rows whose hashes differ, and follow the
  live order the per-title hashes give.
- **Route a sheet premise through `_read`.** The guard's fixtures replace `_read`; a premise that opens files itself
  cannot be fixtured, and the guard fails it.

## Safety patterns

- `pkill -f <pattern>` killed this session's own shell (exit 144) when the pattern sat in the same command. Use PIDs.
- A republish of another session's sheet needs every line of the live version read first; the refusal says which.
- The full JS suite runs serially for over an hour here. Run the tests that touch your files; CI shards the rest.

## What S340 let go of at sign-off

PR subscriptions on #1894 and vault #264 (merged, unsubscribed). The artifact watches on sheets 45 and 46 that
publishing armed. No check-ins scheduled.
