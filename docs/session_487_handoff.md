---
title: "Session 487 handoff: Hartnell's double-count words read as the overlap"
date: 2026-10-26
session: 486 (SkyQuince)
tags: [handoff, program-requirements-harvest, hartnell, coursedog]
status: current
superseded: true
superseded_by: session_494_handoff.md
---

# You are Session 487

Your moniker is **SkyHuckleberry**. Session 486 (**SkyQuince**) was the CPL Queue routine's 07:12Z firing on
2026-10-26 and ran until about 08:00Z. Its checkpoint was **full**, because it wrote a data receipt (a reread) and changed
a function. It skipped `kb/README.md`, `README.md`, a KB note and the Pipeline tab, since nothing they describe moved.
Read, in order: this file, then
[Open Asks Sheet 130](https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD)'s `replies` (one card, unanswered at 07:20Z),
then `docs/program_requirements_harvest_lessons.md` S486.

## Who else is working

No other session ran beside S486. No open PR had been updated since 2026-10-23, and S485's #2461 had merged. S486's PR
is #2462. The routine's next firing is 08:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`).

## What shipped (#2462)

- **Hartnell's double-count words read as the overlap.** A reconcile `set` step records `ge_overlap: true` where a tab
  prints "Students can double-count required courses and courses for General Education." `degree_verdict` takes Sheet 82
  card 2's overlap branch for a transfer degree or a record carrying the flag. Reconcile 40285320209 and reread
  40287110123 moved Vocational Nursing 39248, Addiction Studies 19718 and Agricultural Mechatronics 43809 to passing
  (Hartnell 79 of 94). The reread's receipt holds the before-values.
- **`program_record_carry_basis` leaves `ge_overlap` out** like the other reconcile fields (supabase-migrate run
  40285298395, `kb/migrations/2026-10-26_s486_carry_basis_ge_overlap.sql`; the rollback is the prior definition).
- **Display build 8052e240575a** is on the branch. `step=display` was dispatched on `main` after the merge: check that
  its applied record landed (`kb/receipts/program_requirement_records_display_2026-10-23_8052e240575a.applied_*.json`).

## Decisions Sam made this run

None. Sam was away.

## Proceeded on the recommendation (put this card on the next sheet)

*Hartnell's double-count words as the overlap: proceeded on the recommendation (S486, 2026-10-26); reply to reverse.* The
page's own words extend Sheet 82 card 2 to three local degrees. Reverse it by reverting #2462's step and scorer change and
running the reread receipt's rollback. Build the next sheet when another card is due; Sheet 130 stays current until then.

## Open work, in order

0. **Read Sheet 130's `replies` first.** Card 1 asks whether to deploy cpl-chat with the raised library page cap, or
   keep the current one; handoff 484 item 0 has both paths. **The funding memo's opening** still waits on Sam's paste
   (`cpl_funding_config` `updated_at` read 01:23:35Z at 07:25Z).
1. **Confirm the display apply** from #2462 (above).
2. **The UI pass: Privacy** (`privacy.html`) for the first scheduled session of 2026-10-27 UTC (the 05:12Z firing). Any
   firing still on 2026-10-26 UTC skips it.
3. **Hartnell's structural failures** wait on a reader change: subject lists pooled into one choice (General Studies
   17912), a baccalaureate reading that nets out the admitting A.S. (Respiratory Care 44537), and RN 03570's prerequisite
   GE. Fable-worthy if taken up: the readings have nothing to score against.
4. **Waiting, as before:** the Coordinator Guide (Sam's comments under Changes to make); the two S448 offers; Sam's two
   passages in the old words; the Noncredit CPL Lead; the Baking and Nursing JPEGs; Sierra's logo link; one *utilize* in
   the proposed §55050 text (lint `house_voice`); the two summit refresh notes. The implementation-funding lane reads
   20,949 bytes against its 20,000 budget: move a finished section to its lessons doc when that lane next moves. (S486
   brought the harvest lane to 19,838 and moved lessons S406-S407 to archive 3.)

## Lessons to honor

- **A new reconcile field joins the confirm carry basis** in the same PR, or a confirmed record loses its confirm on the
  next reread for a flag alone (the college test enforces it).
- **Restore every re-filed record whose verdict stands before `step=reread`.** A reconcile run re-files every record a
  step notes, including records where only a flag changed.
- **The display build wants openpyxl**: `python3 -m pip install openpyxl`.

## Let go

S486 held no PR subscription (it read CI by polling), set no check-in and published no artifact. If #2462 is still open,
merge it once `test` passes on its head.
