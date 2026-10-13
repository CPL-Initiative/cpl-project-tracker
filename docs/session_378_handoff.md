---
title: "Session 378 handoff — Annual Goals: the Move control is live; read the first Refresh and the first Move"
date: 2026-10-13
session: 377 (SkySequoia)
tags: [handoff, workplan, annual-goals, move, activity-summaries]
status: current
---

# You are Session 378

Your moniker is **SkyHemlock**, on the **Annual Workplan Goals** queue. Session 377 (**SkySequoia**,
`session_01VMShwebv8WdMQgsF54Ri4b`) ran it. A second queue runs beside it: **`docs/session_376_handoff.md`**
(SkyLinden, program requirements), not yet started at 02:40Z on 2026-10-13. If Sam opened you with this file, work this
queue; `list_sessions` first and agree one writer with any session still holding wakes.

## What shipped (S377)

- **#2058 and vault #327 merged:** S375's checkpoint and session note (handoff 377 reached main).
- **#2059 merged, published by dashboard run 583: Refresh summaries** (`activity_summaries.js`, lane PR D). A line under
  every Activities-tab activity header says how current its summary is; a signed-in reviewer gets **Refresh summaries**,
  which drafts each Activity through the report proxy from its sub-activities and posts one only on its own **Post**
  (`item_updates` `activity:N`, provenance in `raw`). The header's Update link is gone; the link row wraps at 390px.
  Checked in Chromium. No summary has been posted with it yet.
- **Sam ran Sheet 72 cards 2 and 3 (~03:50Z), so #2056 (the Move control) merged.** Read back 03:51Z: 3.9 Futuro
  Behavioral Healthcare Project added (Goal 0/2/4/4/4, Stretch 0/4/8/8/8, Activity 3 home); 1.1.2 is 4.2.1 (Activity 4
  home, Activity 1 kept, no table holds 1.1.2); `workplan_move_sub_activity` live (anon false, authenticated true).
  Shard 3 had failed because the Move dialog put Cancel before Move; Move leads now and the test checks every dialog.
  Dashboard dispatched after the merge. Card 1 (`course_outcomes`) belongs to handoff 376's queue and was not run.
- **UI pass: the Annual Report tab (#2061)**, its first audit. Underlined word controls in place of four glyph
  buttons, a labeled editor, the preview a keyboard-reachable region, the status announced and red only on a
  failure, tokens only, left-aligned prose, the data date in italics. a11y 1 finding to 0 in both themes; the ledger
  records it. Merged.
- **`apply_migration` was down all night.** S377's two tries (the full Move SQL, then the table alone) timed out with nothing
  landing; `supabase_migrations.schema_migrations` has nothing newer than 23:19Z on 2026-10-12. New KB note:
  `playbook-when-apply-migration-times-out-read-the-migrations-table`.

- **Dashboard run 585 (after #2056) crashed; #2063 fixes it.** `render_workplan_charts_html` picks the apprentice
  series by name, last match wins; 4.2.1 (ladderless, all zeros) now sorts after the real apprentice rows, so
  `build_trajectory` divided by zero. #2063 skips zero ladders and guards the sum
  (`tests/workplan_charts_zero_ladder_test.py`, 1/3 on the old code). **No dashboard publishes until it merges.**

## Docs to read, in order

1. `docs/reference/lanes/workplan-annual-goals.md`: state, NEXT, invariants.
2. `docs/workplan_annual_goals_lessons.md`: the S375 and S377 sections.
3. `activity_summaries.js` header, then `kb/supabase_workplan_move.sql` (its header carries the undo).
4. `cpl_memory` tags `workplan`, `annual-goals` (S377 adds four rows, author `SkySequoiaS377`; `sheet-72-pastes-applied-2026-10-13`
   supersedes S375's "Move control built, not yet live").

## Priority, in order

1. **#2063 merged and the dashboard green.** If S377 has not: merge #2063 on `test`, dispatch `daily-dashboard.yml`,
   and confirm the run succeeds (run 585 failed). Then check the published page: 3.9 and 4.2.1 on the Annual Goals
   and Activities tabs, no 1.1.2, Move on each sub-activity for a signed-in reviewer. The 06:17Z cron fails the same
   way until #2063 is on main.
2. **The first Refresh Sam runs:** read the posted `activity` rows and their `raw` (`edited`, `draft`). What he changes
   in a draft is the prompt's next revision; record his edits as a lesson, and a ruling as a `cpl_memory` row.
3. **The first Move a reviewer makes:** read its `workplan_id_moves` row and the guard's verdict. The 1.1.2 move ran as
   hand SQL, so its undo is the receipt's rollback block, never the function.
4. **Small cleanup with the next `card_actions.js` change:** drop `a.act-update-link` from `UPDATE_SEL` (no page prints
   it since run 583).
5. **UI pass at your checkpoint:** `python3 scripts/ui_pass.py --next` names the next view (S377 did the Annual
   Report). Before any DDL, read `schema_migrations` for a row newer than 23:19Z on 2026-10-12 (none: the tool is
   still down, and the SQL goes to Sam as a paste).

## Decisions Sam made

- No new rulings in S377. Sam ran Sheet 72 cards 2 and 3 himself (~03:50Z, `sheet-72-pastes-applied-2026-10-13`,
  verified by read-back). His standing rulings for this queue: Sheet 72's
  recommendations stand (`sam-sheet-72-rulings-2026-10-13`), Move stays reviewer-only, and generated summaries are
  drafts he approves before they post (`sam-annual-goals-rulings-2026-10-12`).

## Patterns that worked

- **Read the failing assertion's source before the diff.** The shard 3 failure was a test reading the first match of a
  string a new dialog had added above the old one.
- **Measure the page before and after your control.** The 71px overflow at 390px predated the new panel.
- **A scratch copy of `index.html` patched the way the generator will print it** lets Chromium verify a generator change
  before the cron runs.
- **Grep the live page for `name.js?v=`**: the publish step versions every script.

## Safety patterns to honor

- The tree is the id: only the Move function re-keys it. Merge #2056 only after the function exists live.
- Session data writes go to Sam as a paste; DDL through `apply_migration` with the SQL file as receipt.
- `scripts/check_generated.sh` after `git add`, and stop on its output: a pipe to `tail` hides its exit code (S377
  pushed a stale dependency map that way and fixed it in the next commit).

## Skipped this checkpoint (and why)

- **Pipeline view (7):** the pipeline did not move.
- **`kb/README.md`, `README.md`:** no KB structure or new user-facing tab.
- **`--apply` handoff stamping:** not run, so 376 stays live for its queue.
- **`kb/queue_status.json` (12):** it reports the program requirements queue, whose next step is handoff 376; stamping
  it with 378 would point that view at the wrong queue.

## Subscriptions and check-ins

At sign-off S377 holds no subscription (#2056, #2059, #2060, #2061 and vault #328 all merged) and arms no
check-in. #2059 merged (unsubscribed). No artifact watch.
