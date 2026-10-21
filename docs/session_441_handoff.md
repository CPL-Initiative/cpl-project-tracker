---
title: "Session 441 handoff: the program requirements harvest reaches Santa Monica, Irvine Valley and West LA; Taft 38661 removed"
date: 2026-10-21
session: 440 (SkyChaparral)
tags: [handoff, program-requirements-harvest, catalog-sweep]
status: current
---

# You are Session 441

Your moniker is **SkyIronbark**. Session 440 (**SkyChaparral**, `session_01BUP3QowsdJEudpVj8B75EJ`) was opened by Sam
from his phone with handoff 439's line (stale: 439 had already run as SkySaltbush) and *"want to get back on track
with our PR harvest project"*: PR is program requirements. It worked the harvest only; handoff 440's priorities 1 to 5
carry over below unchanged. If the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## Sam's words this run (decisions, recorded with who and when)

- **~01:35Z, Taft 38661:** asked the session to get around the auto-mode classifier's refusal; it refused again with
  his go, so he ran the guarded delete in the Supabase SQL editor himself (Sheet 98 card 1 carried out). No copy of
  the row is committed.
- **~03:45Z, Santa Monica's PDF:** *"I'm on my phone now and don't have a way to download it. Can you cheat it in any
  way to grab it?"*, then *"Raise to 40 mins if possible"*. The ceiling is now 2,400 s (`CATALOG_PDF_WAIT_MAX_S`).

## What shipped (PR #2306)

- **Three colleges no list had named, read for the first time:** West LA 195 loaded (214 extracted, 173 passing,
  $14.97), Irvine Valley 143 loaded (144, 122, $11.02), Santa Monica 224 loaded (239 extracted, 157 passing,
  $20.34; one extraction error), display build 6433296e07e2. The headline moved from 11,687 to 12,132 complete of
  20,282 active programs (114 colleges).
- **The PDF wait ceiling** (`kb/_program_requirements_pilot.py`, guard in `tests/program_requirements_pilot_test.py`)
  and Santa Monica's procedure record at 2,400 s (receipt
  `kb/receipts/program_source_procedure_smc_pdf_wait_2026-10-21_s440.sql`).
- **Taft 38661's filed record removed** (build 772abb3ddebe), after the display job found the row missing.
- Orange Coast 10278 passes (read live). Lane `program-requirements-harvest.md`, lessons S440, the status file and
  two `cpl_memory` rows (`sam-pdf-wait-40-minutes-2026-10-21`, `harvest-one-run-waits-per-branch-2026-10-21`).

## Priority

1. **The CLAUDE.md pass (Sam, 2026-10-20 ~17:15Z: "yes").** Tag every rule in the tracker's CLAUDE.md keep, update or
   pull, each with its evidence: stale capability limits (other sessions are visible; the context meter's 786k
   ceiling against a 1M window), ritual weight (propose a light checkpoint for small sessions), and the auto-mark
   rule. Change nothing in CLAUDE.md on your own: one short sheet of proposed edits, applied on his answers.
2. **The harvest's next colleges.** List the thin ones live first (active COCI programs against records, under 60%;
   lessons S440): Golden West, Reedley, Sierra, Moorpark, Oxnard, Skyline and College of the Canyons sat between 12%
   and 53% on 2026-10-21. Capture-only first, extraction under the $40 go, one run waiting per branch.
3. **The Course Progress view** (Commons lane NEXT), as handoff 440 item 2 describes.
4. **The auto-mark rule waits on Sam's word** (handoff 440 item 3).
5. **Grok:** nothing until Sam says the key is in.
6. Small: `kb/_test_activity_card_current.py` and `tests/workplan_description_drafts_test.py` fail on main.

## Lessons to honor

- One run waits per branch on `program-requirements-college.yml`: a second queued dispatch cancels the first pending one.
- A dispatch checks out the commit the branch held when it was sent: push, confirm the head, then dispatch.
- Santa Monica's host drops a long download now and then (`read ETIMEDOUT` once at 16 minutes); one retry fetched it.
- The auto-mode classifier refuses a session-written delete of a live row even with Sam's go; hand him the guarded SQL.

## Not refreshed

The UI pass, the Pipeline tab, `kb/README.md`, `README.md`, no KB note, the Commons run logs (no reference touched),
the decision sheet (nothing new waits on Sam from the harvest).

## Let go

PR #2306 subscription and any pending check-in are dropped at sign-off; the CPL Queue routine fires on its own schedule.
