---
title: Session 344 handoff — procedures for the pilot colleges; the Progress view is live
date: 2026-10-07
session: 343 (SkyGantry)
tags: [handoff, program-requirements-harvest, roep, sierra, scheduled-sessions]
status: current
superseded: true
superseded_by: session_345_handoff.md
---

# You are Session 344

Your moniker is **SkyWaypoint**. SkyGantry (S343, `session_01WrHjhji5tPA2qWD9RLrYAr`) was a Sam-driven session. You are
probably the **CPL Queue routine's** run (`trig_01L8K64ZKYb5eALdT4HW6NAV`, daily 15:07Z): follow
`docs/reference/scheduled_sessions.md`, go with the recommendation, and put a *Proceeded* card on the sheet for any call
you make for Sam.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`). S343 let go of everything at sign-off (end of this file).
2. **The standing sheet:** Open Asks Sheet 49 ([6uMT8LrZgMZBit3Gs8wHBL](https://claude.ai/artifact/6uMT8LrZgMZBit3Gs8wHBL), current, three
   SharePoint calls, built after S343 signed off). Read `replies` and `done` with `ArtifactData` before acting. Sheet 48
   ([FWGJ2uNEGB1RrhMPrFsaCJ](https://claude.ai/artifact/FWGJ2uNEGB1RrhMPrFsaCJ)) is fully answered.
3. **Rule 8:** `cpl_memory` with tags `program-requirements-harvest`, `roep`, `sierra`. Read
   `progress-view-built-2026-10-07` and `sierra-credit-spelling-fold-2026-10-07`.
4. **The view itself:** COBI, Program Requirements, Progress (the first view). It reads the tables live and
   `kb/queue_status.json` for what anon cannot read.

## Priority 1: a reading procedure for each pilot college (the Progress view's next milestone)

Five pilot colleges have no procedure record: **Irvine Valley, San Diego Miramar, Mt. San Antonio, Riverside City, West
Los Angeles**. Cerritos (v4) and Santa Monica (v1) are the worked examples (`program_source_registry.procedure`).
Write each through `program_source_procedure_set(college, record, by, expect_md5)` (service role, `none` for no prior
record, receipt under `kb/receipts/`). Fill it from what the pilot reads already learned: the lessons doc (S323-S342)
names each college's hosts, catalog format, the capture's fallbacks (curriQunet PDF export, Mt. San Antonio's hidden
Outcomes tab), its map host and access, and its open questions. A procedure records what the reads settled; it is not a
place to guess. The milestone moves from 2 of 118 to 7.

## Priority 2: the addenda reading agent

After the 2026-10-11 census apply (Sundays 10:29Z). 79 listed at 52 colleges, none read. Lane: NEXT ④.

## Priority 3: the checkpoint writes the status file now

Every checkpoint writes `kb/queue_status.json` (`.claude/commands/checkpoint.md` step 12): the unchecked records (from
`select college, program_title, control_number, loaded_at from program_requirement_records where not checked`), the next
step, the calls waiting on Sam, the run's changes, then `python3 scripts/queue_status.py --stamp --next-run <next_run_at>`
with the routine's `next_run_at` from `get_trigger`. The Progress view's header and side column read it.

## What shipped (S343)

- **#1900** The Progress view, the tab's first view, from the mock-up Sam approved (*"The mockup looks good to go"*):
  five milestones with *You are here* (now Read program maps, 2 of 26), eight parts, next step, the call, changed
  recently. `MILESTONES`/`PARTS` are definitions at the top of the view. Every section on the tab collapses, with Expand
  all and Collapse all (Sam). Sierra's widget got token-only dark rules (it stayed a light box in dark mode, 2.19:1). The
  Sequences view counted `'ok'`, a value the column never holds; it counts `open` now. a11y targets
  `program-requirements-progress` and `-dark` pass at 390 to 1440.
- **#1901, deployed 22:24Z** (run 37695847449, byte-verified): Sierra folds NOCE's and SDCCE's "... Credit" spelling into
  the college (one row per TOP program, larger count kept), and names a certification only where a program or course
  title names it. A/B 37693477855: preview all modes OK, production 1 failing, no regression. The post-deploy smoke
  (37696012819) failed two: 7c's Orange County wording (the known variance; it failed the same way before the deploy)
  and 7v's new certification negative, **a false match in the smoke itself**: "aimed" sits inside "unclaimed", and the
  deployed answer was right (*"named for the Google IT Support certification specifically — that's the one industry
  credential the course titles point to directly"*). The pattern is word-bounded now (#1902). Re-dispatch the smoke on
  `main` first; only 7c may stay red.

## Decisions Sam made this run

- The mock-up approved for building; the view must be AA, mobile friendly and good in dark mode; every section
  collapsible with an expand/collapse all control (all three in chat, 2026-10-07; `cpl_memory`, verified by Sam).

## Waiting on Sam

- Read Irvine Valley Art A.A. 10265 and Santa Monica Barbering A.S. 43767 (the Progress view's one call).
- Drop the Summit v2 MP4s into Drafts. Re-save the Library
  filer's three Google values.

## After S343 signed off

Sam dropped sharing CPLLibrary (2026-10-07, in chat): *"so many on team do not have google accounts. May need to switch
to sharepoint."* The Drive connector refused the share again with his go. Sheet 48 card 2 is closed, the library lane
carries no ask, and the open-asks builder has no card left (`cpl_memory` `sam-drop-cpllibrary-sharing-2026-10-07`).
He then asked for the switch laid out and its calls on a sheet: Open Asks Sheet 49, three cards (who creates
the site, guests from outside RCCD, how files reach it), the library lane's NEEDS SAM.
Still to apply: `kb/receipts/cpl_library_open_asks_sheet49_2026-10-08.sql` (sheet 49 as the open-asks series'
current version). `apply_migration` timed out twice on 2026-10-08 and wrote nothing (read back: version 48). The
update is guarded on version 48, so a later run is safe; read the row back after.

## Patterns that worked

- **Seed an a11y target with the tables' real shape.** The sweep aborts every request off the origin, so a live-read view
  paints only its failed state there; a seed that sets the state the reads would set measures the real view, both themes.
- **Fold a duplicate spelling by key, never by sum.** The Credit rows repeat the college's courses; adding counts doubles.
- **Prove a smoke negative against the bad answers and a good one** before adding it; key it on the claim's shape.

## Safety patterns

- The PR-push smoke asks **production**: a red one before deploy is production's wording or the database (S343: 7c twice,
  then a 7p statement timeout). The A/B is the test of the change.
- `program_source_registry_history` and unchecked records stay closed to anon; the status file carries what the view needs.

## What S343 let go of at sign-off

PR subscriptions: none left (#1900 and #1901 merged; both auto-unsubscribed). Check-ins: `trig_01PZ4LZAAmrc48i8zSZnogLA`
(the A/B read, fired 22:23Z). No artifact watch was armed.
