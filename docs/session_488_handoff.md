---
title: "Session 488 handoff: Hartnell's pooled subject lists"
date: 2026-10-26
session: 487 (SkyHuckleberry)
tags: [handoff, program-requirements-harvest, hartnell, coursedog]
status: current
---

# You are Session 488

Your moniker is **SkyThimbleberry**. Session 487 (**SkyHuckleberry**) was the CPL Queue routine's 08:12Z firing on
2026-10-26 and ran until about 09:00Z. Its checkpoint was **full**, because it wrote a data receipt (a reread). It skipped
`kb/README.md`, `README.md`, a KB note and the Pipeline tab, since nothing they describe moved.
Read, in order: this file, then
[Open Asks Sheet 130](https://claude.ai/artifact/4UnUdMkMRwqCVkS6bF47aD)'s `replies` (one card, none at 08:15Z),
then `docs/program_requirements_harvest_lessons.md` S487.

## Who else is working

No other session ran beside S487. The open PRs other than S487's were last updated 2026-10-23 or earlier. S487's PR is
#2463. The routine's next firing is 09:12Z (`trig_01L8K64ZKYb5eALdT4HW6NAV`).

## What shipped (#2463)

- **Hartnell's pooled subject lists.** General Studies: Arts and Humanities A.A. 17912 read its eleven "List A: <subject>"
  lists as eleven figureless blocks. The tab prints "For the 18 units required, select courses in List A from at least
  two disciplines" (page read 40291523425), and the sibling 17911 with the same words was read as one 18-unit block. A
  new `pool_lists` reconcile kind joins two or more figureless lists sharing a name prefix into one block of the page's
  figure. Reconcile 40292405207 moved 17912 alone; reread 40294638373 replaced one row (before-values in its receipt).
  Hartnell 80 of 94.
- **S486's display build 8052e240575a is applied on `main`** (run 40289731342: 17,529 written, none missing, no errors).
- **Display build 767a48c10e89** is on the branch. Dispatch `step=display` on `main` after the merge, then check that its
  applied record landed (`kb/receipts/program_requirement_records_display_2026-10-23_767a48c10e89.applied_*.json`).

## Decisions Sam made this run

None. Sam was away.

## Proceeded on the recommendation

Nothing new. The step reads the page's own figure under Sam's harvest go of 2026-10-17, so it needs no card. S486's card
(*Hartnell's double-count words as the overlap: proceeded on the recommendation (S486, 2026-10-26); reply to reverse*)
still goes on the next sheet when another card is due; Sheet 130 stays current until then.

## Open work, in order

0. **Read Sheet 130's `replies` first.** Card 1 asks whether to deploy cpl-chat with the raised library page cap, or keep
   the current one; handoff 484 item 0 has both paths. **The funding memo's opening** still waits on Sam's paste.
1. **If #2463 is still open, merge it** once `test` passes on its head, then dispatch `step=display` on `main` and confirm
   the applied record.
2. **The UI pass: Privacy** (`privacy.html`) for the first scheduled session of 2026-10-27 UTC (the 05:12Z firing). Any
   firing still on 2026-10-26 UTC skips it.
3. **Hartnell's last structural failures** wait on a reader change: Respiratory Care 44537's 120, which counts the
   admitting A.S., and RN 03570's prerequisite GE (both read in S485, page read 40279150362); Biology 03537 and Engineering
   33851 under the narrow `meets` reading (Sheet 120 card 1, Sam's). The first two are definition calls with nothing to
   score against: ask Fable once and record its advice before writing a step. Other Hartnell failures (Agriculture
   Business 11803, CalGETC 45096, Liberal Arts 17924, Music 43887, three certificates) have not been read yet: read the
   tabs (free page read) before choosing.
4. **Waiting, as before:** the Coordinator Guide (Sam's comments under Changes to make); the two S448 offers; Sam's two
   passages in the old words; the Noncredit CPL Lead; the Baking and Nursing JPEGs; Sierra's logo link; one *utilize* in
   the proposed §55050 text (lint `house_voice`); the two summit refresh notes. The implementation-funding lane reads
   20,949 bytes against its 20,000 budget: move a finished section to its lessons doc when that lane next moves.

## Lessons to honor

- **Read a passing sibling before a reader change.** 17911's reading showed what the page supports; the page read
  confirmed it before any code.
- **Restore every re-filed record whose verdict stands before `step=reread`** (S484, S486, S487: 56 restored this run).
- **Don't push to the branch while a reconcile run is capturing**: its last step commits to the branch. Commit locally and
  push after the run's filing commit lands.
- **`scripts/check_generated.sh` reports the statewide catalog and the discipline blanks worklist STALE on `main` too**
  (2026-10-26); neither is this harvest's.

## Let go

S487 held no PR subscription (it read CI by polling), set no check-in and published no artifact. #2463 is open, awaiting
`test` on its head.
