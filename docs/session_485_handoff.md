---
title: "Session 485 handoff: Hartnell's noncredit course hours, six of eight programs pass"
date: 2026-10-26
session: 484 (SkyToyon)
tags: [handoff, program-requirements-harvest, hartnell, coursedog]
status: current
superseded: true
superseded_by: session_494_handoff.md
---

# You are Session 485

Your moniker is **SkyElderberry**. Session 484 (**SkyToyon**) was the CPL Queue routine's 05:12Z firing on
2026-10-26 and ran until about 06:15Z. Its checkpoint was **full** (a Rule 10 reread receipt). It skipped
`kb/README.md`, `README.md` and the Pipeline tab: nothing they describe moved; no KB note (the finding is
Coursedog-specific and lives in the lessons doc and `cpl_memory`). Read, in order: this file, then
[Open Asks Sheet 130](https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD)'s `replies` (one card, unanswered at 05:15Z),
then `docs/program_requirements_harvest_lessons.md` S484.

## Who else is working

No other session ran beside S484 (no open PR updated after 2026-10-23 at 05:14Z). The routine's next firing is
06:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`); S484 signs off before it.

## What shipped

- **Hartnell's noncredit course hours** (#2460). The page reader's new `network_find` prints the stretch of a long
  vendor body around named strings (page read 40273805437). It showed each Coursedog course's hours under
  `credits.lectureHours` and `credits.labHours` as ranges; the tab's "Non Credit - Total hours" sums the tops. The
  reader keeps them per page as `course_hours`, and a new `course_hours` reconcile kind fills an hours record's courses
  with the tops, citing the call. Reconcile 40274398240 (free), reread 40276122401: 8 rows replaced, 6 pass the machine
  checks (receipt `kb/receipts/program_requirement_records_college_reread_hartnell_40276122401.json`, the rollback).
  Complete programs 13,173 to 13,179 (read 05:49Z).
- **Display build 454f2ac7bfbd** committed on the branch; `step=display` on `main` follows the merge (check the run
  named in the PR's last comment, or dispatch it if none ran).

## Decisions Sam made this run

None. Sam was away; S484 proceeded on a harvest procedure (Sam's go of 2026-10-17, no card): a course takes the top of
its hours range because the catalog's own total sums the tops.

## Open work, in order

0. **Read Sheet 130's `replies` first** (card 1: deploy cpl-chat with the raised library page cap, or keep). Handoff
   484 item 0 has both paths. **The funding memo's opening** still waits on Sam's paste (`cpl_funding_config`
   `updated_at` read 01:23:35Z at 05:15Z).
1. **The UI pass: Privacy** (`privacy.html`) for the first scheduled session of 2026-10-27 UTC (05:12Z firing). Today's
   pass is recorded (the Fact Sheet, S481).
2. **Hartnell's last two noncredit programs:** TAC326 (Theatre Performance 44161, 630 hours) and BUS690 and BUS699
   (Workforce and Academic Readiness 44574, 432) carry no lecture or lab hours in the answer. A page read with
   `network_find` on those codes (plan `kb/college_reads/hartnell_course_hours.json`, change the strings) shows which
   field holds them.
3. **Hartnell's other arithmetic failures** (handoff 458 item 3: 17912, 03570, 39248, 44537, 03537, 33851).
4. **Waiting, as before:** the Coordinator Guide (Sam's comments under Changes to make); the two S448 offers; Sam's
   two passages in the old words; the Noncredit CPL Lead; the Baking and Nursing JPEGs; Sierra's logo link; one
   *utilize* in the proposed §55050 text; the two summit refresh notes. The implementation-funding lane reads 20,949
   bytes against its 20,000 budget (lint): move a finished section to its lessons doc when that lane next moves.

## Lessons to honor

- **A reconcile run re-files every record a step notes,** not only the ones whose figures changed. Restore the
  bookkeeping-only files before `step=reread`, which posts only records stamped with the newest run.
- **Read a vendor answer past its opening with `network_find`,** not by widening `NETWORK_BODY`.

## Let go

S484 held no PR subscription (it read CI by polling), set no check-in and published no artifact.
