---
title: "Session 452 handoff: the S449 queue landed, Hartnell by its site, Long Beach City waiting, the next thin colleges"
date: 2026-10-23
session: 451 (SkyLupine)
tags: [handoff, program-requirements-harvest]
status: current
---

# You are Session 452

Your moniker is **SkyPoppy**. Session 451 (**SkyLupine**) was opened by Sam with one line, *"find the most recent
handoff and keep going with the Commons PR harvest"*, after the Sheet 115 session (S450 SkyMariposa) had published the
sheet and stopped. Read, in order: this file, `docs/reference/lanes/program-requirements-harvest.md`,
`docs/program_requirements_harvest_lessons.md` S451, then `docs/reference/lanes/my-college-action-page.md` (Sam has
still not seen the fold's step 3 live).

## What shipped

- **#2367, the wave:** Palo Verde (its Acalog 2026-2027 catalog; 15 inserted, 51 replaced), Cypress (17 and 1),
  Berkeley City (23 and 66; every one of its 23 regained programs a Multimedia Arts certificate or degree, read on
  the current reader), Hartnell by its site (24 and 70) and Mt. San Antonio (15 and 15) loaded and reread; display
  build 25fe751ccd0a, 17,505 programs (17,414 before). Its apply was dispatched on `main` at the checkpoint (a
  `step=display` run, about 30 minutes); **confirm its applied record landed on `main`** before any other build.
- **Hartnell reads from its Coursedog site.** The vendor-hosted catalog names the tab Requirements, prints no course
  units and writes (AS-T); the reader knows all three, and the site found 96 of 112 where the PDF found 73. A
  Coursedog catalog reads from its site by default now; `route=pdf` keeps the PDF step for one run. #2366 (Hartnell
  alone) was closed into the wave: a load without a build fails `tests/roep_display_test.py`.
- **#2365:** the page reader's `cq_view` and three S449 plans.
- The builder's dated registry read (`kb/program_requirements_pilot/registry_read.json`) re-read after the census of
  2026-10-18; a course outcomes test that pinned Palo Verde to eLumen now pins Modesto Junior.
- Measured before any spend: the S449 free captures against main (lessons S451). Victor Valley moved nothing.

## Decisions Sam made this run

None in session. Sheet 115 card 1 (the 25 older-build rows and Victor Valley's two) had no reply, so the rows stand.

## Open work, in order

0. **The display apply on `main`.** Read the newest `program-requirements-college.yml` run on `main` with
   `step=display`; its applied record commits to `main` beside the receipt. If it was canceled at the 120-minute
   limit, dispatch it again (lessons S398).
1. **Long Beach City.** Its extraction (run 39891611701 on `claude/harvest-long-beach-city-s449`, started 02:48Z)
   was still capturing at the checkpoint; 13 programs moved (4 new pages, 4 moved, 5 changed). When it files:
   `step=load`, `step=reread`, then one display build on a branch off `main` and a PR.
2. **Hartnell's course units.** The Requirements tab prints none, so 85 of 96 records fail arithmetic and the builder
   fills units from the state's file. A reconcile step reading each course's units from the catalog's course pages
   (`/courses/<code>` on the vendor host) would let the check pass; verify on a page read first.
3. **The next thin colleges** by the live list (under 60 percent): Cañada 56, San Mateo 56, East LA 59, Marin 59 have
   had no S443-S447 free capture. Skyline is COCI's ceiling, Canyons' missing 100 are noncredit.
4. **Sheet 115 card 1:** read its replies (`ArtifactData`, collection `replies`) before acting; a removal needs a
   receipt with before-values.
5. Two standing offers from S448, neither a card: retarget Sierra Training's *Try it in: My College* to CPL Pathways'
   section; whether CPL Pathways keeps My College's decision-right row.

## Lessons to honor

- Measure a free capture against main before any spend: a preview's `found` is a count; its `would_extract` list
  is what an extraction sends. The summary's `cost_usd` sums kept records' stored costs; the job log's `kept N ...; M
  to extract` line is the spend.
- Verify a reader change on the catalog's own words first (a page read), then dispatch. Hartnell took two reads.
- A load and its display build travel in one PR.
- Re-read the builder's registry read after each census apply (Sundays 10:29 UTC).

## Other sessions and the routine

No other session was working at the checkpoint (S450 idle after Sheet 115). The CPL Queue routine's next firing is
05:12Z on 2026-10-23; it reads this handoff.

## Let go

S451 holds no PR subscription (#2365 and #2367 merged, #2366 closed) and one pending check-in (trig_01Ht63oLp7dFcYAxf5pihPPG,
05:19Z), which the sign-off cancels. Harvest branches left on the remote: `claude/harvest-long-beach-city-s449` (its
extraction running), and the merged colleges' branches, which GitHub deletes with the wave.
