---
title: "Session 399 handoff: Sierra's statewide catalog to A/B and deploy, the next sweep wave"
date: 2026-10-16
session: 398 (SkyLinden)
tags: [handoff, sierra, program-requirements, catalog-sweep, display-build]
status: current
---

# You are Session 399

Your moniker is **SkyRowan**. Session 398 (**SkyLinden**, `session_01XKT85uD68AjcFvSuqHCz8R`) was opened by Sam by hand
on 2026-10-16 with the line for 397; the CPL Queue routine had already run 397 (SkyCatalpa) overnight, so 398 took the
highest handoff. If the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## What shipped (S398)

- **Wave 4 of the catalog sweep is done.** Santa Ana 346, Rio Hondo 288, Saddleback 311 loaded unchecked (47 colleges
  in all). Build `66b50c86891e` applied (run 38909267523) and `fa8ee2a84935` (8,070 programs, #2158; run 38915019105).
  Procedure records for all nine wave-4 colleges (#2161), v2 merged onto S346's record for Ventura, Oxnard, Reedley.
- **#2159:** the display job has 120 minutes (S397's apply was canceled at 30 with 6,875 of 7,125 written and no
  applied record) and new display receipts are gzipped (a plain one passes GitHub's 100 MB limit near 11,000 programs).
- **#2160:** the Memory tab's UI pass. Six seeded a11y targets, controls as underlined words, AA in both themes.
- **#2163, one Sierra in COBI** (Sam's words below): the CPL Assistant tab retires; `CPL_CHAT.open()` opens Sierra AI
  over any tab; Sierra Training's *Try it in: Sierra* and *Save & ask Sierra* ask her over the Training tab and send.
- **The statewide gap, diagnosed.** Sierra cannot list every statewide exhibit because the full set never reaches her
  context; Sam's 2026-10-15 rule (`sierra_guidance` `1b946882`) had nothing to act on. An agent built a statewide
  catalog block on `claude/s398-sierra-statewide-catalog` (see Priority 1).

## Decisions Sam made this run

- **2026-10-16 ~14:30Z, in chat:** *"consolidate Sierra Assistant into Sierra AI and sunset the separate assistant. I
  don't want to lose any functionality in the process, but only gain."* Try it on Sierra should send the question to
  Sierra AI. Captured: `cpl_memory` `sam-sierra-one-assistant-2026-10-16` (verified), vault braindump
  `braindump-2026-10-16-1430-sierra-one-assistant.md`.

## Priority, in order

1. **Sierra's statewide catalog, #2164** (`claude/s398-sierra-statewide-catalog`). If not merged, merge on a green
   `test` (merging is inert: only `cpl-chat-deploy.yml` reaches production). Then dispatch `cpl-chat-preview-ab.yml` on
   `main` (input `cleanup`); expect smoke mode 7w fixed by the candidate and no regressions. Put *deploy Sierra* to Sam
   with the A/B's result; on his go, `cpl-chat-deploy.yml` (`confirm: DEPLOY`, `function: cpl-chat`), then
   `cpl-chat-smoke.yml`. 7w fails on production until then (the branch push ran the smoke once). The catalog is
   `fact-sheet/statewide_catalog.json` (164 exhibits by program area, the Fact Sheet's own count), rebuilt daily.
   Follow-ups: render the Fact Sheet's baked title lists from it (132 baked, 50 current titles missing); retire the
   April vault note `map-exhibit-analysis.md` (Sierra's old 114); curate the 22 "Other Statewide" exhibits.
2. **#2163** if not merged: merge on a green `test` (squash). Then ask Sam to try *Try it in: Sierra* on his
   statewide question once the catalog is deployed.
3. **The next sweep wave**, under the $40 go: the census's unread catalogs, one branch per college.
4. **Reader gaps from wave 4:** Palomar lost 103 of 331 programs' pages to a sibling award (Foothill's pattern);
   Ventura and Oxnard keep 30 records each out of the load; Reedley's index held 40 entries for 200 programs.
5. **`docs/cpl_assistant_lessons.md` is over budget (123 KB of 120 KB):** compact it before any Sierra lesson is added.

## Patterns and safety

- A display apply now takes about 30-40 minutes for 8,000 programs; the job has 120. Poll `main` for its
  "Applied record" commit; never read a job log for status.
- New display receipts are `.sql.gz`; `zcat` reads one. Earlier builds keep their plain `.sql` as rollbacks.
- One branch per college; `kb/_build_roep_display.py` needs `openpyxl`.
- The repo's Supabase guard blocks UPDATE through `execute_sql`; a denial is a hold, never a workaround.

## Not refreshed this checkpoint

The Pipeline tab (step 7): the roadmap's phases did not change. The decision sheet: no card changed, so Open Asks
Sheet 84 stays current (https://claude.ai/artifact/AqQsUUEmSKRWkLntcbAhFz); the statewide deploy becomes a card once
its A/B is clean.

## Subscriptions and check-ins

S398 drops every PR subscription and check-in at sign-off and holds no artifact watch.
