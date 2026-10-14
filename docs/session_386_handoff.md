---
title: "Session 386 handoff — Sheet 77 built, Modesto and Palo Verde displayed"
date: 2026-10-14
session: 385 (SkyHazel)
tags: [handoff, program-requirements, records-view, annual-goals, map-team-queue, supabase-migrate]
status: current
superseded: true
superseded_by: session_387_handoff.md
---

# You are Session 386

Your moniker is **SkyElm**. Session 385 (**SkyHazel**, `session_01HLTbUqE2SMCTAyXKxryJ1L`) ran on Sam's greeting and
heard nothing more from him. `list_sessions` first and agree one writer.

## What shipped (S385)

- **Merged:** S384's checkpoint (#2091) and CPLBrain #336 (its coverage check waited on #2091 dropping the
  annual-goals NEEDS SAM); **#2090** (the Records view's light index and college/district picker); **#2092**
  (Sheet 77 card 2: Table, Archive and Restore reviewer-only on the Activities tab; the `project_lifecycle` write
  policies name `is_allowed_reviewer()` alone, read back live); **#2093** (Sheet 77 card 3: numbered boxes for the
  reading procedure only, the college's 3,353 items on one *For the college* line a record, and the MAP team queue's
  *Program record items for the colleges to correct* with a list a college from the new view
  `program_record_college_items`); **#2094** (Sheet 77 card 5: Modesto Junior 185 and Palo Verde 52 loaded, display
  build `2d812b8ce768` on all 3,077 records, read back live).
- **The migrate runner's first two applies** (`supabase-migrate.yml`): the lifecycle policies and the view, no wait.
- **#2090's first live reads (22:50Z):** clean, 250-row pages, 106-403 ms each, no 400.

## Decisions Sam made this run

None new. S385 built Sheet 77's rulings (`cpl_memory` `sam-sheet-77-rulings-2026-10-13`); no sheet card is open, so
the open-asks builder writes no sheet.

## Priority, in order

1. **The Records view's first college pick.** Nobody has picked a college since #2090 deployed, so its
   `college=in.(...)` read (quoted names) has never run live. When `edge_logs` shows one
   (`request.path = '/rest/v1/program_requirement_records'`, a `college=in.` search), check 200/206 and no 400; a 400
   names the select, fix it in a PR the same hour. Measure a real load (origin_time, content_range).
2. **Palo Verde's noncredit programs** (five at 0 coverage: High School Equivalency, Child Care, Developing Capable
   Youth, Arts - Early Childhood Education, Microsoft Word Specialist; near misses in
   `kb/program_requirements_college/palo_verde/summary.json`). Read one page on a runner before any reader fix.
   Its 25 arithmetic failures of 54 are worth one look for a layout pattern (Cabrillo's was a degree total with GE).
3. **The next college by tier** (lessons S381: Southwestern, Fresno City, Cypress among CourseLeaf/curriQunet).
4. **Card 1's key:** confirm on the next Annual Goals save that the message says *within about 10 minutes*.
5. **My College could read `program_record_college_items`** instead of every record's display (Cerritos: 577 rows
   against about 4 MB). Optional.

## Docs to read

`docs/reference/lanes/program-requirements-harvest.md` · `docs/reference/lanes/workplan-annual-goals.md` ·
`docs/program_requirements_harvest_lessons.md` (S385) · `docs/workplan_annual_goals_lessons.md` (S385).

## Patterns that worked

- **A display dispatch applies the build the page file carries.** Run `kb/_build_roep_display.py`, commit
  `cpl_pathways_roep_data.js` and its receipt, then dispatch `step=display`. S385's first dispatch re-applied the old
  build and left the new rows empty.
- **A bot's receipt commit runs no CI.** After the migrate runner or a load commits a receipt, push a commit of your
  own before waiting on `test`.
- **Read a dated-read diff with `--diff-algorithm=histogram`;** the default diff showed 2,981 false deletions.
- **`check_generated.sh | tail` hides the exit code.** S385 pushed once past a stale dependency map that way; run it
  alone and read `$?`.
- **Prove a test guards the change:** run the new test against main's code and count the failures.

## Not refreshed this checkpoint

The UI pass (9): no room for a fix PR at Rule 9a's warning line (about 110K tokens left). The pipeline viz (7): the
M-ID pipeline did not move. `docs/INDEX.md`'s update history is still past eight bullets.

## Subscriptions and check-ins

S385 holds no PR subscription (#2092-#2094 merged and auto-unsubscribed) and no check-in (all fired or deleted).
