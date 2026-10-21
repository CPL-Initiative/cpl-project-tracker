---
title: "Session 443 handoff: the Ventura district's campus letter fixed; Moorpark, Oxnard and Ventura re-read; Sheet 109 still open"
date: 2026-10-21
session: 442 (SkyManzanita)
tags: [handoff, program-requirements-harvest, claude-md-pass]
status: current
---

# You are Session 443

Your moniker is **SkyFlannelbush**. Session 442 (**SkyManzanita**) was started by the CPL Queue routine at 11:15Z on
2026-10-21. If the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## What happened this run

- **No `list_sessions`.** The fallback found no open PR newer than 2026-10-19 (#2257, the credential watch, draft).
- **[Open Asks Sheet 109](https://claude.ai/artifact/FJ2UbqDiaCfc6adgrTjynE) (current) had no replies** at 11:16Z.
  Nothing on it was applied.
- **The harvest's tab filter dropped the Ventura district's Requirements tabs (#2309).** `SUBJECT_TOKEN` read no course
  in a number led by a campus letter (`ANCT M01A`), so `hidden_tabs_text` dropped each tab and the capture fell back to
  textContent, where codes run into titles. Found by two free page reads (39595155181, 39595760314 with
  `"expand": true`). Any one letter may now lead. Guard in `tests/program_requirements_pilot_test.py`.
- **Re-read and loaded, about $32 in extraction:** Moorpark 144 found (99 before), 100 passing (31), 83 inserted, 1
  reread; Oxnard 120 found (94), 86 passing (25), 56 inserted; Ventura 173 found (131), 121 passing (53), 70 inserted,
  14 reread. Receipts in `kb/receipts/`.
- **Golden West's free re-read (39591103370) found the same 81 pages.** Its gap is department and GE pages holding
  several awards, a reader question rather than a code fix (lessons S442).
- **Display build 8d733f684f83** (16,729 rows): the first apply (run 39630350229) wrote 15,216 and stopped on one
  SSL EOF at Santa Rosa 21740; the second (39641128488) wrote all 16,729, none missing, no errors. Its applied record
  is the rollback.

## Priority

1. **PR #2309** was merged by S442 after the display apply. Nothing on it is open.
2. **Read Sheet 109's replies** (`ArtifactData` list, collection `replies`, url above; then `replies/done`) and apply
   them as handoff 442 item 1 describes. No reply: the sheet waits.
3. **The thin list** (read live 11:20Z, active COCI programs against records under 60%): Sierra 13%, Reedley 17%,
   MiraCosta 6% (all parked for the reader), Skyline 25% (58 of 144 have a course list in the state's file: the
   state's gap), Golden West 27% (department pages), Foothill 42%, College of the Canyons 53%. Look for a shared cause
   first, as this run did. Free reads first; extraction under the $40 go.
4. **The Course Progress view** (Commons lane NEXT), as handoff 440 item 2 describes.
5. **Grok:** nothing until Sam says the key is in.

## Headline (read live about 15:59Z)

20,282 active programs, 12,439 complete (12,132 at 10:22Z), 114 colleges; 16,893 records in all.

## Lessons to honor

- When a college reads near zero coverage on pages labeled exactly, open the page's tab in a page read before
  changing the reader; the filter in front of the checks can drop the text unseen.
- Read the thin list for a shared host or habit; one fix reached three colleges.
- One run waits per branch, and a display apply holds the branch about an hour: extract and load every college
  first, then build and apply once.

## Not refreshed

The UI pass (Sheet 109 card 2 asks to move it out of the checkpoint; the ledger keeps `cpl-opportunity` due), the
Pipeline tab (nothing moved), `kb/README.md`, `README.md`, no KB note, the Commons' four other run logs (untouched).

## Let go

S442 holds no PR subscription, no check-in and no artifact watch. PR #2309 merged; vault PR 422 merged. The routine's next firing is 05:12Z on 2026-10-22.
