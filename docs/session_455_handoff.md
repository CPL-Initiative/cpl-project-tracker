---
title: "Session 455 handoff: Hartnell's GE units, Sierra's AA or AS, display build b2864d4d6992"
date: 2026-10-23
session: 454 (SkyBlazingStar)
tags: [handoff, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_462_handoff.md
---

# You are Session 455

Your moniker is **SkyMonkeyflower**. Session 454 (**SkyBlazingStar**) was started by the CPL Queue routine at about
09:14Z and claimed S453's queue. Read, in order: this file, `docs/reference/lanes/program-requirements-harvest.md`,
`docs/program_requirements_harvest_lessons.md` S454, then `docs/reference/lanes/my-college-action-page.md` (Sam has
still not seen the fold's step 3 live).

A full checkpoint: the harvest lane's state moved and the run wrote data receipts. Skipped, nothing moved there:
`kb/README.md`, `README.md`, the pipeline viz, the four other Commons run logs. No KB note this run: the two findings
are reader-specific and sit in the lessons doc and `cpl_memory`.

## What shipped (#2375, the wave PR, which carries this checkpoint too)

- **Hartnell's general education units.** Counting each failing record's `score.arithmetic.why` showed 41 of its 85
  arithmetic failures were GE units, not course units. Reconcile steps (`kb/program_requirements_reconcile.json`):
  Cal-GETC 34 on transfer degrees (Taft's step, kept on Sheet 94 card 4), Local GE 23 on local degrees (the catalog
  PDF's seven areas on pages 58-59, summed). Reconcile run 39931703521 changed 50; reread 39933892215 replaced 50
  (receipt with before-values), 34 pass the machine checks.
- **Sierra's "AA or AS".** Its Fire Technology department page heads one section for both degrees "AA or AS" (page
  read 39930677707). `SECTION_AWARD` reads it for the A.A. and the A.S. Capture 39931621162: found 92 to 105 of 125
  with a closed list, page-claimed 25 to 17, not found 8 to 3. Extraction 39933862802 (79 passing), load 39937672907
  (6 inserted, 90 kept), reread 39938320097 (7 replaced).
- **Display build b2864d4d6992** on the wave branch (`cpl_pathways_roep_data.js` and its `.sql.gz`).
- **Hartnell's course units are in the vendor's data:** the Requirements tab POSTs `courses/search` to
  app.coursedog.com and each course carries `credits.creditHours.min` (page read 39930495321). The tab's course lines
  are not links (39924074351).
- **Open Asks Sheet 116** ([link](https://claude.ai/artifact/4oL4YfC4b43iVjUq1bSS8J), current; Sheet 115 superseded):
  Sheet 115's three cards at the same positions, then card 4, proceeded: Hartnell's Local GE at 23.

## Decisions Sam made this run

None. Sheet 115's store held no reply at 09:15Z; no Library brief was requested.

## Open work, in order

0. **The display apply on `main`.** If #2375 merged, S454 dispatched `step=display` on `main` (college=Hartnell
   College) for b2864d4d6992; confirm it finished and committed its applied record. If #2375 is still open, merge it
   once `test` passes, then dispatch.
1. **Hartnell's course units from the vendor's data.** In `cd_pages`, keep each Requirements tab's own
   `courses/search` answer (a code to `creditHours` map, listened for as `cd_list` listens for the program search),
   and add a reconcile kind that fills an empty course unit from it, citing the call. Verify on one program, then
   `step=reconcile` for Hartnell. About 22 records lack a course's units.
2. **Sierra's last 17 page-claimed** (`kb/program_requirements_college/sierra/capture_preview.json`): IT (07963,
   11965, 21537, 21557), Business (15307, 37810), Mathematics and Physics AS-T, Health Sciences, Building Industries
   and ESL noncredit. Read one department page's Degrees tab with `capture_view` and fetch the log with a large
   `tail_lines`: the tool saves it to a file you can grep (lessons S454).
3. **Sheet 116:** read its `replies` (and 115's) before acting. Card 1's removal needs a receipt with before-values.
4. Two standing offers from S448, neither a card: retarget Sierra Training's *Try it in: My College* to CPL
   Pathways' section, and decide whether CPL Pathways keeps My College's decision-right row.

## Lessons to honor

- Count a college's arithmetic failures by their `why` before choosing a fix.
- A page read without `capture_view` prints only the visible tab; a department page's awards sit in a hidden tab.
- `step=display` applies the committed build; build it on the branch first (`openpyxl`).
- Runners were slow today (a 13-minute browser install): judge a run by its own step times.

## Other sessions and the routine

S454 had no `list_sessions` and no `get_trigger`. It read the open PRs (#2323 and #2257, days old) and `main`'s
commits since the handoff, and found no live session. The next firing is hourly through 13:12Z (11:12Z next).

## Let go

S454 unsubscribes from #2375 at sign-off (its state is in the sign-off). No check-in, no artifact watch (remote
sessions cannot watch). Branches on the remote: `claude/harvest-wave-s454` (auto-deletes on merge),
`claude/harvest-hartnell-ge-s454`, `claude/sierra-claimed-read-s454`, `claude/hartnell-course-units-read-s453`
(all merged into the wave), plus S452-S453's `claude/harvest-skyline-s453`, `claude/harvest-east-la-s452` and
`claude/harvest-marin-s452`.
