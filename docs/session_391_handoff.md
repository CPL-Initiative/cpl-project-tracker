---
title: "Session 391 handoff: Sheet 79, Fresno City and the Records filters to merge, Delta's catalog year"
date: 2026-10-14
session: 390 (SkySaguaro)
tags: [handoff, program-requirements, course-outcomes, records-filters, fresno-city, decision-sheet]
status: current
---

# You are Session 391

Your moniker is **SkyJuniper**. Session 390 (**SkySaguaro**, `session_01VfhnCyDfEpfvdcmpqLShkD`) wrote this at a context
checkpoint (about 90,000 tokens left), not at sign-off. `list_sessions` first, and agree one writer with any session still working.

## What shipped (S390)

- **#2115 (merged):** Southwestern read, loaded, displayed; Cabrillo's 55 re-read; Southwestern's procedure record v1.
- **#2116 (merged): the SLO links** (Sam: *"there should be a link to them on each course listing"*). Program records course
  rows carry an Outcomes link; COCI Lookup's expanded row shows the outcomes. Codes join on a key without spaces or hyphens.
- **#2117 (merged):** the daily run baked a reviewer's email into the tabled line and `pii_guard` failed every PR; the
  generator and the live render print the date only.
- **#2118 (merged):** CIP Codes UI pass, AA clean on its first screen in both themes. The palette conversion is a lane item.
- **#2112 (merged):** the Acalog reader; San Joaquin Delta captured (203 of 233), its catalog year unread.
- **#2119 (closed):** its test fix landed inside #2116.
- **#2120 (open): Fresno City.** 211 loaded unchecked, display build `04872c826890` on all 3,478 rows (run 38591098013),
  procedure record v1 applied and committed (83a1664). Its `test` was unreported on the bot's head; 83a1664 is the real commit.
- **#2121 (open): the Records filters**, Sam's ruling below. 401/401 tab tests; a11y clean.

## Decisions Sam made this run

- ~14:39Z: the SLOs need a link on each course listing (`sam-slo-links-on-course-listings-2026-10-14`).
- ~14:38Z: a statewide catalog with SLOs gives M-ID merge and mint decisions a richer signal (braindump, CPLBrain #343).
- ~15:17Z: *"no scrub needed"*; ~15:20Z: *"my email is fine to have public"* (two `cpl_memory` rows).
- ~16:05Z: the Program requirements tab drops its Sierra window, opens on Progress, and filters Records with District,
  College, SWP Region and CIP Sector dropdowns (`sam-prh-filters-progress-first-no-sierra-2026-10-14`).

## Priority, in order

1. **Read [Open Asks Sheet 79](https://claude.ai/artifact/V1vZDZuwRqphwkcPAYVnt8)** (current, no replies at 16:10Z). Card 1
   *count*, card 2 *adt*, card 3 *extract* El Camino. Add a card for Sheet 80: `project_lifecycle` is anon-readable with
   `updated_by` (Sam's email is fine public; another reviewer's may not be). S390 built no Sheet 80 for want of context.
2. **Merge #2121, #2120 and #2122 (this checkpoint)** once `test` passes on each head. Merge `main` into either if it moved; regenerate the
   dependency map rather than picking sides.
3. **San Joaquin Delta's catalog year:** read it from the Acalog catalog page into the capture report before extraction.
4. **Palo Verde's 2026-27 catalog** after Sunday's census apply (2026-10-18 10:29 UTC): read all 52 with `extract=1`, then
   `step=reread`.
5. **The UI pass:** `python3 scripts/ui_pass.py --next`.

## Docs to read

- `docs/program_requirements_harvest_lessons.md` (S390 sections)
- `docs/reference/lanes/program-requirements-harvest.md`

## Patterns that worked

- A failure on a PR's merge ref can be main's: read the failing check before touching the branch, fix at the source,
  port the fix into each open PR on top of a merge of `main`.
- `step=display` applies the committed build; run `kb/_build_roep_display.py` and commit first.
- A late read in a view adds its control in place; a full re-render wipes the status line.

## Subscriptions and check-ins

S390 dropped its watches at sign-off (16:25Z): #2120, #2121, #2122 and CPLBrain #343 (the braindump and the S390 session
note; merge it). No check-in is armed. Subscribe to each PR you drive.
The CPL Queue routine fires next at 2026-10-15 05:12 UTC.
