---
title: "Session 446 handoff: a shared page per section heading, MiraCosta's degree lists, Palomar's Cert. Achievement, 185 new records"
date: 2026-10-22
session: 445 (SkyCurrant)
tags: [handoff, program-requirements-harvest, decision-sheets]
status: current
---

# You are Session 446

Your moniker is **SkyMadrone**. Session 445 (**SkyCurrant**) was opened by Sam from handoff 445 and worked the
harvest queue on its own (no new words from Sam this run). Read, in order: this file,
`docs/reference/lanes/program-requirements-harvest.md`, `docs/program_requirements_harvest_lessons.md` S445.

## What shipped

- #2336 and #2341: a page read with `"capture_view": true` prints a page as the harvest's capture reads it
  (innerText plus hidden tab panels, line for line), and the tab panels the capture leaves out. Use it before any
  reader change: the capture keeps none of the text it read.
- #2335 (S444's Sierra 57 and MiraCosta 39, build 65f1d116887b) merged after its Applied record.
- #2337: a shared page goes to each section heading's claimant, not one per award kind; a program that lost a page
  falls back only to one that names it, carries 80% of its courses, or heads its section. MiraCosta's degrees are
  their certificates plus general education: a degree its Degrees tab lists reads the certificate's section.
- #2339: "Cert. Achievement" names the certificate, so Palomar's degree and certificate share their `-AS-CA` page.
- #2342 (merging at this writing): MiraCosta's "its respective certificate" sentence, "Cybersecurity" for Cyber
  Security, transfer headings over two lines, and a list line that is the title outranks a pair holding its words.
- #2340 (merging at this writing): 185 new records loaded (MiraCosta 49, Orange Coast 55, Foothill 43, Citrus 26,
  Sierra 12; receipts under `kb/receipts/`), display build 82d6298a0c67 on 17,302 records, applied.

## Open work, in order

1. **If #2340 or #2342 is still open:** merge on `test` (each had green suites at this writing).
2. **Palomar and MiraCosta under the new readers.** Free captures found Palomar 282 (from 224, page-claimed 103 to
   45) and MiraCosta 142 (from 119, page-claimed 31 to 8). One branch each from main: extract (`extract=1`; about
   $25 and $13, under the $40 go), load, then one wave branch with one display build (`kb/_build_roep_display.py`,
   commit both outputs, dispatch `step=display`, merge main in once the Applied record lands).
3. **Palomar's remaining 45:** 22 certificates never had their own page as a candidate, 23 A.S. lost theirs. A
   capture view of two of their pages first.
4. **The next page-claimed colleges** on main's captures: Mt. San Jacinto 25, Santa Barbara City 20, Saddleback 19,
   Grossmont 15. A free capture of each under the new rules first, compared with main. Tally `capture.json` across
   colleges before choosing; handoff 445's Ventura/Moorpark/Oxnard counts were stale.
5. **A GE page as a candidate** (69 filed sources statewide; the load already keeps majors out): a reader rule that a
   general education page serves only a GE-titled program would save their extraction. Low priority.
6. **Open Asks Sheet 112** (https://claude.ai/artifact/AKsM96ZjKRmrYPHGWiDffG, current, one card, no reply at
   07:40Z): the Program Mapper vendor ask. Read its `replies` first; on *ask*, draft the note for Sam to send.

## Lessons to honor

- Read the page as the capture does (`capture_view`) before changing a reader; the text was sound at MiraCosta and
  the fault was in the sharing.
- Run `scripts/check_generated.sh` bare before every push; piped through `tail` it hid a stale dependency map.
- Two PRs that each regenerate `kb/dependency_map.json` conflict: merge main, regenerate, never pick a side.
- An extraction run re-extracts every found program: budget the whole college.

## Other sessions and the routine

The CPL Queue routine fired at 07:17Z and stood down in 90 seconds; its next run is 08:12Z. The funding session's
film PR (#2323) is still open.

## Let go

S445 drops its PR subscriptions (#2340, #2342) at sign-off; its two check-ins already fired; it watches no artifact.
