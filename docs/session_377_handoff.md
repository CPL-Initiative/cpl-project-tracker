---
title: "Session 377 handoff — Annual Goals: read Sheet 72, land the Move control, then Refresh summaries"
date: 2026-10-13
tags: [handoff, workplan, annual-goals, move, a11y]
---

# Session 377 handoff (from S375 SkyTally)

You are **SkySequoia (Session 377)**, on the **Annual Workplan Goals** queue. A second queue runs beside it:
**`docs/session_376_handoff.md`** (SkyLinden, program requirements, written by S374 SkyJuniper). If Sam opened you with
this file, work this queue; agree one writer with any session still holding wakes (`list_sessions` first).

## What shipped (S375)

- **#2051 merged: the one add flow.** The first CI run caught a hidden write: the add's `post(table)` helper built its
  URL from a variable, so the dependency map and the Admin tab's surface map listed an insert as a read. Each insert
  now names its table literally.
- **#2054 merged and published (dashboard run 582): the Annual Goals UI pass.** Keyboard reach for every editable
  value and the chip line, row headers and scopes, no raw hex, phone cards below 560px, plain rows, Current in ink,
  "Add description" for editors. A real-browser check found the cell editors threw on every save and Escape (Chrome
  fires blur on removal); a guard fixed it.
- **#2055 merged:** `project_add.js` retired.
- **#2057 open:** the Add dialog's Activity checkboxes to 24px (measured 19.9 on the published page).
- **#2056 open, draft, HELD: the Move control.** One reviewer-gated function re-keys all seven id tables, rolls back
  if any other table still holds the old id, files an undo in `workplan_id_moves`. 22/22 in PGlite, 39 in jsdom.
  **Not applied: `apply_migration` timed out four times** (and six times for S374).
- **#2052 (S374's checkpoint, handoff 376)** was green and stranded when its session ended; S375 merged main into it.
- **[Open Asks Sheet 72](https://claude.ai/artifact/LFbjZXFbHmPTNF8JqW3qMV)** (current; supersedes Sheet 71): card 1
  the course outcomes table (S374's), card 2 the 3.9 add and 1.1.2 move paste, card 3 the Move function, card 4 who
  may move. Its store was empty at publish.

## Docs to read, in order

1. `docs/reference/lanes/workplan-annual-goals.md`: state, NEXT, the invariants.
2. `docs/workplan_annual_goals_lessons.md`: the S375 sections.
3. `kb/supabase_workplan_move.sql` (its header carries the undo) and `scripts/verify_workplan_move.js`.
4. `cpl_memory` author `SkyTallyS375` (six rows) and tags `workplan`, `annual-goals`.

## Priority, in order

1. **Check whether Sam has pasted** (his ruling above; also read Sheet 72's replies). For each card:
   - **Card 2 pasted:** read back projects 3.9 = 1, goal rows 3.9 = 2, projects 4.2.1 = 1, projects 1.1.2 = 0,
     links 4.2.1 "4 home, 1". Then dispatch `daily-dashboard.yml`.
   - **Card 3 pasted** (or retry `apply_migration` once and check `to_regclass` after a timeout): read
     `has_function_privilege` (anon false, authenticated true), mark #2056 ready, merge on `test`, dispatch the
     dashboard.
   - **Card 4 is settled** (reviewer sign-in only); nothing to build.
   - **Card 1** belongs to the other queue (course outcomes). Leave it to SkyLinden unless Sam says otherwise.
2. **#2057 and #2052 merged** before sign-off; nothing to do.
3. **PR D, Refresh summaries** (lane NEXT 3; Sam approves each draft before it posts).

## Decisions Sam made

- **2026-10-13 ~01:18Z, in chat: "Can't find 71 so I'll go with your recommendations."** That is every Sheet 72
  proposal: he pastes cards 1-3 (the course outcomes table, the 3.9 add and 1.1.2 move, the Move function), and **Move
  stays reviewer sign-in only** (card 4, settled). `cpl_memory` `sam-sheet-72-rulings-2026-10-13` (verified). No chip
  was clicked; the chat reply is the record. `apply_migration` timed out a fifth time at 01:19Z.

## Patterns that worked

- **Preview a renderer change without the cron:** `kb/workplan_goals_snapshot.json` plus `CPL_Data.js` through
  `build_workplan_goals_from_supabase`, spliced into a scratch `index.html`, then `node scripts/a11y.js --config <a
  config whose targets point at it>`.
- **A real browser for keyboard paths.** jsdom passed what Chrome failed.
- **PGlite for a database function**, before it touches the shared database.
- **Check the pre-merge base before blaming yourself:** the ten other COBI tabs failing the a11y sweep failed
  identically on `1a769a0`.

## Safety patterns to honor

- The tree is the id: only the Move function re-keys it, never hand SQL across tables.
- Merge #2056 only after the function exists live; a Move control without its function fails for every reviewer.
- Session data writes go to Sam as a paste (repo guard); DDL through `apply_migration` with the SQL file as receipt.

## Skipped this checkpoint (and why)

- **Pipeline view (7):** the pipeline did not move.
- **`kb/README.md` and `README.md`:** no structure or user-facing surface beyond the tab itself.
- **`kb/queue_status.json` (12):** it belongs to the program requirements queue, and #2052 refreshes it.
- **`--apply` handoff stamping:** not run, so 376 is not marked superseded while its queue is live.
- **The UI pass ledger** records Annual Goals; `cobi:annual-report` stays the next view due.

## Subscriptions and check-ins

At sign-off S375 drops every subscription: #2052, #2056 and #2057 on the tracker, #327 on the vault, and the Sheet 72
watch. No check-ins are armed.
