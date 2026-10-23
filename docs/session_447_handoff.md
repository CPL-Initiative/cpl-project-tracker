---
title: "Session 447 handoff: a degree-and-certificate address names both awards, 91 new records at four colleges"
date: 2026-10-22
session: 446 (SkyMadrone)
tags: [handoff, program-requirements-harvest, ui-pass, decision-sheets]
status: current
superseded: true
superseded_by: session_452_handoff.md
---

# You are Session 447

Your moniker is **SkyBrittlebush**. Session 446 (**SkyMadrone**) was started by the CPL Queue routine at 08:12Z and
worked the harvest queue on its own, with no new words from Sam. Read, in order: this file,
`docs/reference/lanes/program-requirements-harvest.md`, `docs/program_requirements_harvest_lessons.md` S446.

## What shipped

- #2344: the night's UI pass, the CPL opportunity visual. It gained an h1 before a college loads, the picker no
  longer widens the page at 360px, and a dark target joined `a11y.config.js`. Ledger recorded.
- #2345: a CourseLeaf address `-as-certificate-achievement` names both awards (`slug_awards()`), so Grossmont's
  degrees keep their own pages beside their certificates. The cause was found with page read 39750446541
  (`kb/college_reads/grossmont_as_cert_capture_view.json`).
- #2346 (the wave): 91 new records loaded at Palomar 62, MiraCosta 21, Grossmont 5 and Pasadena City 3, plus 6
  replaced by rereads. Spend was $62.24, every college under the $40 go. Display build 0ad3c75bfa19 covers 17,393 rows.

## State at sign-off

- **#2346 merged** (856885cc) on a green test. Its display build 0ad3c75bfa19 was dispatched on `main` at 10:53Z
  (`step=display`). Confirm its Applied record landed on main
  (`kb/receipts/program_requirement_records_display_2026-10-18_0ad3c75bfa19.applied_<run>.json`); if the run
  failed, dispatch it again. Build 1b3616641146 applied earlier on the wave branch (run 39757574337).
- **Saddleback's free capture** (run 39748152661, `claude/s446-saddleback`) was still reading after two hours. It
  files `capture_preview.json` on that branch; compare it with main's 321 found and 19 page-claimed.

## Open work, in order

1. **Confirm build 0ad3c75bfa19's Applied record on main**, as above.
2. **Saddleback's capture**: read its `page_claimed`. Extract (about $25) only if programs move to their own pages.
3. **Mt. San Jacinto and Santa Barbara City** did not move under the sharing rules. Their losers never had their own
   page found (Mt. San Jacinto 28 not found, its losers falling back to general education and C-ID chart pages; Santa
   Barbara City's Administration of Justice pages were never captured). The next step is a capture view of how each
   catalog lists those programs: a finding problem, not a sharing one.
4. **Palomar's 45 remaining page-claimed need no reader work.** The catalog has no entry for them (lessons S446).
5. **A GE page as a candidate** (69 filed sources statewide): a reader rule that a general education page serves only
   a GE-titled program would save their extraction. Low priority.
6. **Open Asks Sheet 112** (https://claude.ai/artifact/AKsM96ZjKRmrYPHGWiDffG, current, one card, no reply at
   10:40Z): the Program Mapper vendor ask. Read its `replies` first; on *ask*, draft the note for Sam to send.

## Lessons to honor

- A display job's Applied record becomes the PR head, and its test run stops at `action_required`. When main has not
  moved, merge on the session commit's green test and run `step=display` on main.
- Read a page as the capture does (`capture_view`) before a reader change; the Grossmont fix came from one read.
- An extraction re-extracts every found program: budget the whole college, and weigh it against the programs that move.
- Run `scripts/check_generated.sh` bare before every push (it needs `openpyxl`: `python3 -m pip install openpyxl`).

## Other sessions and the routine

No other session worked the queue. The funding session's film PR (#2323) and the credential watch draft (#2257)
are still open; neither is this queue's.

## Let go

S446 drops its PR subscription (#2347, this checkpoint) at sign-off; it set no check-ins and watches no artifact.
