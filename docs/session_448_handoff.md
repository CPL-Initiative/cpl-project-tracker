---
title: "Session 448 handoff: an Administration of Justice address, a hyphenated code, Mt. San Jacinto and Santa Barbara City reread"
date: 2026-10-22
session: 447 (SkyBrittlebush)
tags: [handoff, program-requirements-harvest, decision-sheets]
status: current
superseded: true
superseded_by: session_452_handoff.md
---

# You are Session 448

Your moniker is **SkyDeergrass**. Session 447 (**SkyBrittlebush**) was opened by Sam by hand at 11:17Z with the S446
opening line; the CPL Queue routine had already run S446, so 447 took handoff 447. Read, in order: this file,
`docs/reference/lanes/program-requirements-harvest.md`, `docs/program_requirements_harvest_lessons.md` S447.

## What shipped

- #2348 (+ CPLBrain #431): **Sheet 112 answered**, Sam 11:16Z, his own call: *later* on asking Program Mapper's vendor
  for the 63 colleges' maps. No note drafted; the lane's NEEDS SAM is gone; no card is open, so no sheet is written.
  `cpl_memory` `sam-sheet-112-program-mapper-later-2026-10-22`.
- #2349: two reader faults. `NOT_PROGRAM_PATH`'s `/administration` dropped every Administration of Justice page
  (`/administration-justice/...`); now only a whole `/administration/` segment. `SUBJECT_TOKEN` read `ANTH 102` and not
  `ANTH-102`, so Mt. San Jacinto's Requirements tabs were dropped; a hyphen may join them now.
- #2350 (the wave): Mt. San Jacinto 115 found (from 99), 93 passing (from 74), $9.18, 18 inserted, 85 reread. Santa
  Barbara City 254 (from 249), 210 passing (from 206), $18.39, 6 inserted, 8 reread. Display build be2635ed5b73.
- Display build 0ad3c75bfa19 (S446's) applied on main (run 39766423451).
- Saddleback's free capture moved nothing (314 found against 321, six pages lost to ECONNRESET): no extraction.

## State at sign-off

- **#2350 merged** (66f9cee0). Its display build be2635ed5b73 was dispatched on `main` at 14:24Z (`step=display`).
  Confirm `kb/receipts/program_requirement_records_display_2026-10-18_be2635ed5b73.applied_<run>.json` landed on
  main; S446's apply took 78 minutes. If the run failed, dispatch it again.
- `claude/s447-berkeley-city-read` holds the five Berkeley City page reads (plan `berkeley_city_multimedia_codes.json`);
  it is not merged. Merge it with the next reader PR or file the plan on main.

## Open work, in order

0. **Sam's asks first (2026-10-22 ~14:45Z, with a screenshot of the CPL Pathways tab).** S447 had too little context
   left to do them. His words: *"fix a couple things on the CPL Pathways tab and update me on where we're at with the
   consolidation of My College into CPL Pathways"*:
   1. *"There's no way I can see to clear the pathways filter"* (the Pathway dropdown; add a clear choice).
   2. *"The college and pathway filters are slow to load; would it help to use a lazy load?"* (measure first, then answer).
   3. *"Just checking to see if the pathways listed on the filter are up to date based on the most recent harvest
      data"* (the subtitle read 17,439 catalog records; compare with build be2635ed5b73 once applied).
   4. *"The COBI header needs a little attention as when the window is resized or zoomed a bit, the elements overlap.
      Can you vertically center the beta chip with respect to the COBI logo?"* (his screenshot circles the search box,
      Signed in, Theme and Light overlapping, and the ALPHA chip sitting low beside the logo). Run `npm run a11y`.
   Then give him the consolidation status: read the My College lane (`docs/reference/lanes/my-college-action-page.md`)
   and the CPL Pathways notes before answering.
1. **Confirm be2635ed5b73's Applied record on main**, as above.
2. **Berkeley City's 27 Multimedia Arts credit certificates** (lessons S447): the capture reads their own pages and
   finds few listed courses. Read one credit page's Requirements node: `_getNavigation?id=10327&parentId=40048` gives
   the tab list, then `_getPage` of its Requirements child. Compare the printed codes with the state's (`MMDI005`,
   `MMDI015A`, `MM/DI 22`, `MMART 197`). If the college renumbered with the same titles and units, a cited
   `course_renumbers` map (Merced, S423) is the path; if the pages list other courses, it is the college's to settle.
3. **Mt. San Jacinto's remaining 15 page-claimed**: Public Health Science and Chemistry AS-T still lose their own pages
   (`public-health-a.s.-t`, `chemistry-ast`); Musical Theater A.A. lost its department page. A capture view first.
4. **The next thin colleges** (tally `capture.json` across colleges first): Hartnell 32 not found (every one "the
   catalog heads each program with its code"), Ohlone 33 (PDF), Palo Verde 9.
5. **A transfer degree whose state list is far wider than its page** loses on coverage (Santa Barbara City's
   Philosophy AA-T, 130 listed; Film/TV AS-T, 193). Worth a rule only if it recurs.
6. A GE page as a candidate (69 filed sources): low priority, as before.

## Lessons to honor

- Read the sitemap before calling a program's page missing; the capture may read it and drop it itself.
- Read a page as the capture does (`capture_view`) before a reader change; a curriQunet view shows only the Summary
  tab, so read its Requirements node through `_getNavigation` and `_getPage` instead.
- A page-read plan reads one college (`tests/college_page_read_test.py`).
- An extraction re-extracts every found program: Santa Barbara City cost $18.39 for 15 changed pages.
- The vault's open-asks coverage check reads the tracker's `main`: merge the tracker side of a sheet answer first.

## Other sessions and the routine

No other session worked the queue. The routine's last firing of the night (13:35Z) ended in four minutes beside S447;
its next is 05:12Z on 2026-10-23. The funding
film PR (#2323) and the credential watch draft (#2257) are still open; neither is this queue's.

## Let go

S447 drops its PR subscription on the checkpoint PR at sign-off and cancels its check-ins; it watches no artifact.
