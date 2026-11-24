---
title: "Session 721 handoff (from SkyEider, S720, the CPL Queue routine's collection run of 2026-11-24) — DRAFT declaration"
created: 2026-11-24
updated: 2026-11-24
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

**Routing, both ways.** A CPL Queue routine firing follows this file. A plain session Sam opens follows the newest
plain-session handoff, `docs/session_720_handoff.md` (S719 SkyShearwater's, for SkyCormorant), never this file.
**Numbering.** Handoff 716 named the routine's next session SkyPetrel, but Sam's plain session S718 took that name and
plain sessions took 715 to 719, so this run is S720, the next free number, and writes 721, one above the highest on
`main` (`d-routine-takes-next-free-number-s713`). Its name is **SkyEider**: both named monikers were held (SkyPetrel by
S718, SkyCormorant by handoff 720 for Sam's next plain session), so the run took an unused one
(`d-routine-moniker-fresh-on-collision-s720`). If Sam's SkyCormorant starts while this runs, it takes the next free
number above this run's.

# DRAFT: the declaration of the 06:12Z firing (S720, SkyEider)

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 and the COBIx brief on #3358 (Mon Nov 23,
written 6:45 PM PT). Served by Opus 5.5 (the form names Fable 5.2).

## The start (06:12Z firing, 2026-11-24)

- Step 0: no `daily-dashboard.yml` run created on UTC 2026-11-24, so the run dispatched it on `main` at 06:16Z.
- One writer: no `list_sessions` or `get_trigger` here. Open PRs: only dependabot's #3383. `main`'s head is S719's
  checkpoint #3750 (`56c38abf`, 04:25Z); S719 signed off at 03:37Z. No live session.
- No pause line (handoffs 716 and 720). Three repos attached. Sheet 200: no reply since 2026-11-19. `queue_todo_done`
  since 2026-11-23: none. No exhibit re-analysis request open. Library: two requested briefs and three revise
  requests, the daytime Library run's; one CER procedure request (2026-11-19), a plain session's.
- Step 11: `python3 scripts/next_slo_colleges.py --next` says the queue is empty.
- Census on `main` (run 45319725062, 03:32Z): of 20,282 active programs, 4,495 have no passing record; 320 are
  collected with a named gap.

## The college split (written before any worker started)

Two lanes, never on one college at the same time, one writer per college (`d-lane-names-only-colleges-in-flight-s681`).

- **Lane 1 (collection):**
  - `display` first, while no apply is in flight: one display build carrying the records applied after S713's build
    (#3708) and S714's, gate college Glendale, then the whole build, then `harvest-gap-census.yml` on `main`.
  - `fill` (high effort), the fix that blocks every reconcile: measure `f-elective-fill-passes-cut-off-windows-s714`
    statewide (read-only), fix the fill and `f-rescore-drops-ge-units-not-read-gaps-s714`, then the 9 Los Rios records
    held for it (Sacramento City, Cosumnes River, Folsom Lake).
  - `lever` (high effort): the reader-page lever at San Bernardino Valley 16, Los Angeles Southwest 9, Mendocino 6 and
    Santiago Canyon 6; American River's 5 after a checked filing. Free page reads and pins first; paid reads with
    `only=` at most $5 a college on the estimate; no reconcile until `fill` merges.
- **Lane 2 (cheap piles, one worker at a time, high effort):** the holds by key in handoff 716's block table that Sky
  clears: Fullerton 13, City College of San Francisco 26, College of the Sequoias 9, Clovis 8, Santa Monica 23, East
  Los Angeles 8, Glendale 3 (after the display gate), Las Positas 01037 and 09227 with Antelope Valley 39295, Santa
  Barbara City 05934, College of Marin's moved-page guard. Then the records the table marks for a person, collected
  each with its gap named and a lower confidence (`sam-collect-with-gaps-2026-11-17`), at those colleges and at College
  of the Canyons, West Los Angeles, Napa Valley, Los Angeles Harbor, Cerritos, Los Angeles Mission, Los Angeles City,
  Ventura, Shasta and De Anza. Then the census's next wording-rule piles (Contra Costa 22, El Camino 22, Ventura 22,
  Cabrillo 21). No lane 2 plan passes a record through the program-level fill before `fill` merges.

## Split changes during the run

- 06:24Z to 06:26Z: `fill`, `lever` and `piles` started on Opus 5.5 at high effort.
- 06:29Z to 06:43Z: the display build `abf1f6396156` (18,666 records): Glendale gate 45340786385 (242 rows), whole
  build 45341895811 (18,423 rows); live 18,665 at the build, the same 32 at older builds; #3754.
- 06:38Z: `lever`'s page read 45341735139 (its push) and American River's free read 45341899083 on #3752.
- 06:52Z: Fullerton's plan on #3753 (9 collected with named gaps, 4 held) went to a second reader; `piles` took City
  College of San Francisco.
- 07:00Z to 07:20Z: #3754 merged (`79a534fb`); the census dispatched on `main`. Fullerton's reader, FIX THEN APPLY
  (35174 read from a shared page; 33680 and 42143 pass under the printed floor): 6 rows, round 2 APPLY. #3756's
  reader, FIX THEN MERGE (four findings). #3752's reader, DISPATCH, merge after three fixes.
- 07:18Z to 07:31Z: applied and confirmed live: Fullerton 6 (migrate 45346957909), College of the Sequoias 7
  (45347712879), Clovis 3 (45348350867). Mendocino's paid read 45348021173 landed; Los Angeles Southwest's dispatched.
- 07:3xZ: East Los Angeles's pre-read found 02456's live row on an older extraction than its committed record: held,
  the plan rebuilt at 3 (`p-preread-catches-older-live-extraction-s720`).

Off the queue tonight (Sam's routine prompt: *"No new UI, tooling or governance work in conductor runs."*): the brief's
section 1 slimming items and section 4 go to a plain session, as section 4 item 3 provides
(`d-slimming-left-to-plain-session-s720`).
