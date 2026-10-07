---
title: Session 342 handoff — a read map names each course's term; the open-choice rule waits on sheet 47
date: 2026-10-07
session: 341 (SkyTerrace)
tags: [handoff, program-requirements-harvest, cpl-pathways, decision-sheets]
status: current
---

# You are Session 342

Your moniker is **SkyBeacon**. SkyTerrace (S341, `session_01NDadSdMVbcvDjjek3iaNWL`) was a Sam-started session; Sam
gave the greeting and nothing else, so it ran handoff 341's Priority 2 as far as it goes without his go.

## First, in this order

1. **One writer.** `list_sessions` (`mine: true`). At sign-off S341 was the only running session; S340 was idle.
2. **Open Asks Sheet 47** ([2pCpQ3gHg2huw8oUdePE51](https://claude.ai/artifact/2pCpQ3gHg2huw8oUdePE51), current;
   sheet 46 is superseded by it). Read `replies` and the `done` document in `replies` with `ArtifactData`. Cards 1-8
   are sheet 46's eight at the same positions (card 8 now names both of Sierra's read-map lines); card 9 is new.
3. **Library filer:** `python3 scripts/library_file.py --check`. At S341 it still answered `invalid_client`, the
   three saved values still 43 / 19 / 14 characters. Measure lengths only; Sam has been told.
4. **PRs.** Tracker #1895 and vault PR for sheet 47 (see *What shipped*). If either is still open, drive it to merge.

## Priority 1: sheet 47 card 8, the live load (only on Sam's "Load both")

Unchanged from handoff 341, with one addition. On his go, in this order:

1. `git mv` both of `kb/program_requirements_pilot/records_maps/{ivc_10265,smc_43767}.json` into `records/`; run
   `python3 kb/_program_requirements_load.py` (the load receipt grows to 22, both unchecked); apply it as a named
   migration (execute_sql refuses row changes; see the memory rows on apply_migration).
2. Deploy cpl-chat. It now carries **two** read-map lines: the map's status (`MAP_STATUS_LINE.read`, #1894) and each
   course's term (`{the college's map: <term>}`, #1895). Run the A/B first, as for every cpl-chat deploy.
3. Rebuild the display. Moving the files does not change it, so the build should stay 9f60f746ea49; if it does, apply
   `kb/receipts/program_requirement_records_display_2026-10-06_9f60f746ea49.sql` as it stands, then
   `python3 kb/_build_roep_display.py --verify-sql` and run the printed query: every row must say `match`.
4. Tests to update with it: `tests/sierra_program_courses.test.js` pins `current (20 records)` and `20 checked`, and
   its block 16 reads Santa Monica from `records_maps/` (point it at `records/`).

Card 7 (*Proceeded*: Santa Monica's procedure record v1): on *Undo it*, restore the prior record from the registry's
history row and take Santa Monica's record off the page.

## Priority 2: sheet 47 card 9, the figure along a map (only on Sam's answer)

- **The finding.** Santa Monica's Salon Experience block prints no minimum (*Any combination of Salon classes is
  acceptable*), so `plan()` in `kb/_build_roep_display.py` takes nothing from it, though all three of its courses carry
  CPL here. The up-to figure reads 21.5 of 26.5. The catalog's total less the other blocks leaves 1 unit, and the map
  prints *1-4 units*. Irvine Valley reads 3 under any rule (no list course carries CPL).
- **On *As proposed*:** where the catalog prints no minimum for a choice and a read map prints one, both figures take
  the map's least, through a CPL course; along the map, a course the map names inside a choice counts in place of the
  CPL course, and a choice the map leaves open counts as the up-to figure counts it. Santa Monica reads 22.5 and 22.5.
  Fill `figure.path` (it is null today), say it on CPL Pathways beside the up-to figure, change Sierra's
  `Recommended-path figure: TBA` line to quote it, rebuild, and apply with the next display receipt.
- **On *Catalog's minimum only*:** the up-to figure stays; the path figure follows the same rule as up-to with the
  map's picks, so Santa Monica reads 21.5 on both.
- Either way the card's premise check (`p_path_figure_tba` in the vault's sheet builder) closes, so the card leaves
  the sheet in the same change.

## What shipped

- **Tracker #1895** (open at sign-off; merge when `test` is green): Sierra names each course's term on a read map;
  By requirement marks the map's pick inside a choice (*On the college's map*, with its term; nothing renders today,
  fixture-proved); the harvest lane, lessons S341, CLAUDE.md's standing-sheet pointer, the To-Do feed; this checkpoint.
- **Vault:** Open Asks Sheet 47 and its builder (card 9 with a measured premise and its fixture); sheet 46 retitled
  superseded; the S341 session note.

## Decisions Sam made this run

None. He gave the greeting only.

## Waiting on Sam

- Sheet 47: all nine cards. Cards 8 and 9 are the harvest's next steps.
- Re-save the Library filer's three Google values at full length (only sessions started after the save see them).
- Drop the two Summit v2 MP4s into Drafts (from handoff 340).

## Patterns that worked

- **Measure what a rule would move before asking for it.** The open-choice rule moved one number on one program;
  the card says so, which makes it a small ask.
- **Prove a mark that renders nothing on fixtures.** Clone a real record, change the one map item, and assert the
  mark appears there and nowhere else; then assert the real records show none.
- **Check the old code fails the new test** (`git show HEAD:<file> > <file>`, run, restore) before calling a guard done.

## Safety patterns

- A republish of another session's sheet needs every line of the live version Read (the full file the read saves,
  both halves); a `path` read alone does not count.
- `jsdom` is not installed in a fresh container: `npm install --no-audit --no-fund` (about 7 s) before the view tests.
- The full JS suite runs serially for over an hour here. Run the tests that touch your files; CI shards the rest.

## What S341 let go of at sign-off

The PR subscription on #1895 (unsubscribed at sign-off, merged or not; if open, you drive it). The artifact watches
that publishing armed on sheets 46 and 47. No check-ins scheduled.
