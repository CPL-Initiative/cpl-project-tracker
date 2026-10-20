---
title: "Annual Workplan Goals / adding, moving and counting sub-activities — lane state"
created: 2026-10-12
updated: 2026-10-20
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[workplan_annual_goals_lessons]]"
  - "[[reference-workplan-activity-project-linking-model]]"
---

# Annual Workplan Goals: adding, moving and counting sub-activities

> **Always-current lane state, not an archive.** Story: [`docs/workplan_annual_goals_lessons.md`](../../workplan_annual_goals_lessons.md).

**What this lane is:** the Annual Workplan Goals tab as the one editor of the workplan's structure (add, move, set targets, say what each number counts), wired to the Activities tab and the report generator, plus the Activities tab's generated activity summaries.

## Status

✅ **S438 SkySumac (2026-10-20): no Total column, the details folded, gray borders only, links to the cards (#2291,
live after dashboard run 619).** Sam's asks of the morning: the Total column *"mis-states the 2030 target"* (most
ladders are cumulative; 1.1's 4/9/18/22/25 summed to 78), center the numbers, *"auto collapse everything under the
first row title"* so the three rows stand at single height, delete the blue outline on editable cells (*"the thin blue
outlines look like someone didn't finish the formatting"*), and link the Activity cards (`cpl_memory`
`sam-annual-goals-no-total-fold-gray-2026-10-20`).
- **The table:** five year columns, values and headers centered; each name cell is the title, then "Details" (a
  button, `aria-controls` its `.wpg-more` panel, printed hidden) and "Activity card"; the panel holds the description,
  the counting lines and the chips, and an editor's Move and Table fold into it (Set targets stays on the line under
  the title, since it explains the blank cells). "Show all details" in the head row opens or closes every panel. The
  editor still sends the ladder's sum to `workplan_goals.total`; nothing reads the dropped column.
- **The links:** `#activities-projects/card-<id>` and `#activities-projects/activity-<N>` (each Activity header,
  "Activity cards"); `card_actions.js` opens the folded section, clears a filter hiding the card, scrolls it clear of
  the sticky actions bar (145px at 1440; centered, a 1,554px card hid its own name), focuses and marks it for 2.5s.
  The Activities groups carry `data-activity-id`; an older page is found by its RACI link.
- **Borders:** no cobalt rule under an editable value and no dashed outline on hover in the table; the focus ring
  stays. The nested rows keep their navy left bar (it matches the nested cards).
- Tests: `tests/annual_goals_card_links.test.js` (17, both renderers), `annual_goals_ui_pass` (74),
  `workplan_goals_set_targets` (15), `workplan_goals_authoritative` (26), the hybrid python test.

✅ **S426 SkyTorreya (2026-10-19): a Current for every year, one editor for all three rows, the formatting pass.**
Sam, 2026-10-19: *"make sure all of the annual columns can be edited. Currently, only the 2025-2026 year is
editable."* Goal and Stretch already edited for all five years; the Current row had one column, `workplan_goals.current`
on the GOAL row, so fiscal year 2026-27 (from July 1, 2026) had nowhere to go.
- **Store:** `cur_2025_26` .. `cur_2029_30` on the GOAL row (`kb/supabase_workplan_goals_current_by_year.sql`, applied by
  `supabase-migrate.yml` from `kb/migrations/.apply`); the migration copies `current` into `cur_2025_26` (the column it
  was typed under: 1.2's value of 2, typed 2026-10-19). `current` stays unread; a later migration drops it.
- **Editor:** the Current row is a ladder like Goal and Stretch (`data-rt="CURRENT"`, `data-yr-key="cur_<year>"`), saved
  by the same `startEdit`/`saveCell` path (PATCH the GOAL row, no `total`); `startCurrentEdit`, `saveCurrent` and the
  pencil hint are gone.
- **Live rows (3.1, 3.1.1-3, 3.2, 2.1, 3.3, 4.1):** the live value prints under the fiscal year the run is in
  (`current_workplan_year()`, July 1 boundary, clamped to the ladder); each closed year reads the June 30 entry of
  `kpi_history.json` (`_history_year_end`; 2025-26 = 48,219 students, 24,881 military, 99,534 units, 12,566 CRs, 100
  colleges); later years stay blank; the date is stated once above the table. The Activities tab's header summary reads
  this year's goal against the latest Current (`_summary_current`); the card's number is the latest year set
  (`current_latest`); `activity_summaries.js` sends the fiscal year's goal and current (`goalFacts`).
- **Set targets is idempotent and paints at once:** it reads the live rows first, PATCHes a row type that exists and
  inserts only the missing ones, then `activateLadder` gives the row its ladder attributes and removes the control.
  Before this a second press inserted a second pair, which is how the duplicates below landed.
- **Formatting pass (verified with `npm run a11y`, light and dark, 390 and 1440):** hairline rows in place of the full
  grid, tabular figures, Activity headers on the subtle surface, Stretch in its text grade
  without italics, the sign-in controls in the card's head row ("Add sub-activity", "Sign out"; signed out, the row
  takes its own line), one as-of line for every live value. Phone: each row is a wrapping flex line whose cells take
  the width their number needs (a 1,500,000 used to break mid-digit in a sixth of 300px).
- Tests: the S438 list above, plus `tests/activity_summaries.test.js`, `tests/annual_goals_reflect_all_projects_test.py`,
  `tests/annual_goals_contrast_test.py`.

✅ **Descriptions show, and the two rows without one have drafts (S426, Sam's second ask of 2026-10-19:** *"add a
procedure that drafts a description to insert in the Descriptions box on the annual goals ... If you don't have any
information for a particular activity, take your best guess and I'll edit it"*). The tab offered "Add description" on
every row while 32 of 34 sub-activities carried one in `projects.description`: the generator read the key
`description` where the loader's contract names it `desc` (`build_projects_from_supabase`); both read now, so the
stored text shows after the next build. Only 4.7 EMS Corps and 4.8 Futuro had none.
- **The procedure:** `kb/_draft_workplan_descriptions.py` — `--brief` lists each empty row with its facts (its
  Activity's description, what it counts and how, milestones, latest update, workplan notes, lead, team, the repo and
  vault documents naming it); the session writes the draft into `kb/workplan_description_drafts.json` with its sources
  and a `best_guess` flag; `--check` refuses a stale, short, unsourced or business-register draft; `--sql` prints the
  guarded UPDATE (`where description is null`, rollback in the header) for `supabase-migrate.yml`. Sam edits on the
  tab; the JSON keeps what was drafted and from what. Test: `tests/workplan_description_drafts_test.py`.
- **Drafted:** 4.7 (from `docs/noncredit_cpl_thinking.md` §3a and the spring 2026 update draft) and 4.8 (from its
  2026-10-19 update and `docs/futuro_hth_crosswalk_lessons.md`), both marked best guess;
  `kb/receipts/workplan_descriptions_drafted_2026-10-19_s426.sql` applies once `.apply` points at it (NEXT 0e).

⚠️ **Duplicate ladder rows (found 2026-10-19).** `workplan_goals` holds exact duplicate GOAL and STRETCH rows for
1.1.1 (four pairs, ids 69-76), 1.1.3 (77-80), 4.2.1 (81-84) and 4.4.1 (85-88), all inserted 2026-10-14 12:26-12:37Z
seconds apart by Set targets. Readers saw nothing wrong (the generator kept the last row, the editor patched all alike).
The paste that deletes the 12 extra rows and adds the unique index is
`kb/receipts/workplan_goals_dedupe_ladder_rows_2026-10-19_s426.sql` (rollback in its header).
✅ **Pasted by Sam (Open Asks Sheet 100, 2026-10-19 21:06Z, "Success: no rows returned"; `cpl_memory` `sam-sheet-100-dedupe-pasted-2026-10-19`).** Read back 21:07Z: no sub-activity holds more than one row per type (68 rows, 12 fewer) and `workplan_goals_one_row_per_type` exists. The drafted descriptions for 4.7 and 4.8 landed through the runner the same hour.

✅ **PR A merged (#2051, 2026-10-13): one add flow, Set targets, counting notes.**
- **The add bug (Sam, 2026-10-12, adding 3.9):** the dialog read `[data-kind="activity"]`, a marker the Annual table stopped printing when it won the AWG injection, so its Activity list was empty and every sub-activity was refused. And a sub-activity add wrote only `workplan_goals`, never `projects`, which the table iterates (Path A), so a valid add never appeared.
- **The fix:** one dialog (parent picker suggests the next free id; writes projects → workplan_goals → links, home primary, each insert a literal URL so the surface maps see it; reads tabled ids live), opened from Annual Goals and from **Add sub-activity** on each Activities-tab activity header (`window.CPL_WORKPLAN_ADD`). **Set targets** on ladderless rows writes the ladder only. **Counting notes:** `projects.kpi_unit` (Counts) + `projects.count_note` (How it is counted; migration `add_projects_count_note`), edited in place, shown on the cards and sent to `report_generator.js`, `master_report.js`, `generate_reports.js`. `project_add.js` is retired (#2055): it had lost both mount points.
- ⛔ **The tree is keyed by the id itself** (projects has no parent column): a move is a re-key of projects, item_raci, item_updates, workplan_activity_associations, workplan_goals, project_lifecycle, update_log (FK, not deferrable). Miss one and it silently mis-attaches (#872).

✅ **PR B merged (#2054): the UI audit fixes.** Every editable value takes Tab and opens on Enter or Space, the field is named, Escape or Enter returns focus (a `done` guard closes each field once: Chrome's blur-on-removal threw on every Escape); the chip line opens its popover from the keyboard. Headers carry `scope`, each Activity is a `<tbody>` with a rowgroup `<th>`, names and Goal/Current/Stretch are row headers. The renderer prints classes and `workplan_goals.js` paints them (no raw hex). An empty description hides for a reader and reads **Add description** for an editor. The Add dialog's checkboxes are 24px tall (#2057).

✅ **PR C merged (#2056): the Move control, live.** `workplan_move_sub_activity(old, new, keep_old_link)` (`kb/supabase_workplan_move.sql`) re-keys the seven tables above in one transaction, makes the new home the primary link, keeps the old Activity's link unless dropped, and rolls back if any public `project_id` / `item_id` / `activity_id` column still holds the old id. Each move files its before-values in `workplan_id_moves`; the file's header carries the undo. Reviewer sign-in only (anon false). The dialog offers "Move" on each sub-activity, never the row or its children as a parent, and suggests the next free number from the live list. DR-13 names the function. Verified in PGlite (`scripts/verify_workplan_move.js`, 22/22) and jsdom (`tests/workplan_move.test.js`, 39). Live since Sam's paste (Sheet 72 card 3, 2026-10-13). No move has been made with it yet.

✅ **PR D merged (#2059): Refresh summaries.** `activity_summaries.js`: every Activities-tab header says how current its summary is; a signed-in reviewer gets **Refresh summaries**, which drafts each Activity through the report proxy (`claude-sonnet-4-5`, the report generator's naming rule) from its sub-activities' three newest `item_updates` (else the creation-era `latest_update`), status, percent, and this fiscal year's goal and current (S426). Each draft posts only on its own **Post** (`item_updates` `activity:N`, provenance in `raw`); **Skip** and **Redraft**. DR-20 names the writer. `tests/activity_summaries.test.js`. No summary has been posted with it yet.

✅ **Sheet 72 answered and applied.** Sam ruled 2026-10-13 ~01:18Z (chat): *"Can't find 71 so I'll go with your recommendations"* on [Open Asks Sheet 72](https://claude.ai/artifact/LFbjZXFbHmPTNF8JqW3qMV) (`cpl_memory` `sam-sheet-72-rulings-2026-10-13`), and ran cards 2 and 3 himself (~03:50Z; `sheet-72-pastes-applied-2026-10-13`). Read back 03:51Z: **3.9** Futuro Behavioral Healthcare Project added (Goal 0/2/4/4/4, Stretch 0/4/8/8/8, Activity 3 home); **1.1.2 is 4.2.1** (Activity 4 home, the Activity 1 link kept, its RACI row and update moved, no table holds 1.1.2). That move ran as the card's hand SQL, not through the function, so `workplan_id_moves` has no row for it; its undo is the rollback block in `kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql`. **Card 4: the team phrase too.** Sam clicked "phrase" in the sheet's store at 03:50:39Z, after his 01:18Z chat reply that S375 read as reviewer-only; the later click wins (`cpl_memory` `sam-sheet-72-card-4-team-phrase-too-2026-10-13`, found by S376 SkyLinden). The function and the control went live reviewer-only, so this is open work (NEXT 0b). Card 1 (the `course_outcomes` table) belongs to the program requirements queue and was not run.

⚠️ **The move broke the workplan charts until #2063.** `render_workplan_charts_html` picks the military, workforce and apprentice series by name and the last match wins; 4.2.1 (no ladder, all zeros) sorted after the real apprentice rows, and dashboard run 585 died dividing by zero. #2063: a zero ladder names no series; `build_trajectory` guards a zero sum. Any move or add that changes sort order can change which row a name-matched series picks.

✅ **#2080 merged (S382): the add dialog's Under list.** Sam added 4.7 EMS Corps (2026-10-13 18:18Z) and could not find Activity 4 beside 4.1-4.6: Under listed every Activity above every sub-activity. It now lists each Activity above its own sub-activities, offers a row added since the last rebuild as a parent (marked new; tabled, archived and D.* rows left out), and clears the box it checked for an old home when the home changes. 4.7 saved with Activity 4 as home and Activity 1 as a second link left from the default parent; dashboard run 590 drew it.

✅ **Sheet 75 answered (Sam, 2026-10-13 19:17-19:18Z, all three his own call;** [Open Asks Sheet 75](https://claude.ai/artifact/FHD8da5vuCN7M3XaL5g4a1), `cpl_memory` `sam-sheet-75-annual-goals-rulings-2026-10-13`):
- **Card 1 "drop":** 4.7 loses its non-primary link to Activity 1. The MCP guard refuses a delete, so Sam runs the paste in `kb/receipts/workplan_2026-10-13_s383_drop_4_7_activity_1_link.sql` (rollback in the same file). ✅ **Run by Sam (Sheet 77 card 4, 22:26Z);** read back 22:27Z: 4.7 keeps only its Activity 4 link. APPLIED is noted in the receipt.
- **Card 3 "reviewer":** an official sub-activity may leave the workplan, reversibly, by a signed-in reviewer. Annual Goals gives a reviewer **Table** beside Move, which opens the Activities tab's own Table / Archive dialog (`CPL_PROJECT_LIFECYCLE.openTable`, one writer to `project_lifecycle`), and a **Tabled and archived** list under the table with **Restore**. The card's premise was off: from Session 95's reorg until Sheet 77 card 2 every Activities-tab card was tableable by a reviewer **or the team phrase**, and the 2026-07-02 immunity gates nothing. `setGoalsRowsHidden` looked for a `td[rowspan]` name cell, a `th` since #2054; rows still hid through their ladder cells' `data-aid`, and the selector now takes both.
- **Card 2 "both":** the page draws rows added or changed since the build, and a save queues the rebuild. Open work (NEXT 5).

✅ **A reviewer's sign-in email stays readable by the public (Sam, [Open Asks Sheet 81](https://claude.ai/artifact/ExZErAUjsA1vh4kLHRfkt3) card 4, 2026-10-14, *Leave them public*, `sam-sheet-81-rulings-2026-10-14`).** A Table or Archive writes the reviewer's email to `project_lifecycle.updated_by`, which anyone can read and the daily run commits to `kb/project_lifecycle.json`; since #2117 the page prints the date only. Nothing to build.

**NEXT:**
0a. **The migration run:** `supabase-migrate.yml` fires on the S426 push; read `supabase_migrations.schema_migrations`
    for `workplan_goals_current_by_year_2026_10_19_s426` and the receipt the runner commits. Until it lands, the
    loader's select falls back to the `current` shape and the page shows the old one-column value under 2025-26.
0c. **Drop `current`** once a build has published with `cur_*` (one migration: `alter table ... drop column current`;
    `activity_summaries.js` and `_row_current_years` still read it as a fallback until then).
0e. ✅ The two drafted descriptions landed through the runner (read back 21:07Z); the tab shows all 34 after the
    next build. A row Sam empties later shows in `--brief` again; draft it the same way.
0d. **The reports still print the 2025-26 pair** (`generate_reports.js` and `master_report.js` hard-code
    `kpi_goal_2526` beside `kpi_metric`); the fiscal-year pair belongs there too, with `kpi_current_<year>` exported
    from the GOAL row's `cur_*` columns.
0b. ✅ **Move stays reviewer-only (Sam, Open Asks Sheet 73 card 1, *Keep it reviewer-only*, 2026-10-13 11:45:21Z).** His later, direct answer stands over Sheet 72 card 4's *phrase* (03:50Z); read from the sheet store by S381 (`cpl_memory` `sam-sheet-73-card-1-keep-reviewer-only-2026-10-13`). Nothing to build; the function and the control stay as they went live.
1. **The first Refresh Sam runs:** read the posted rows (`item_updates` where `item_type = 'activity'` and `raw` names `activity_summaries.js`) and his edits (`raw.edited`, `raw.draft`). What he changes in a draft is the prompt's next revision.
2. **The first Move a reviewer makes:** read its `workplan_id_moves` row (before-values and counts) and the guard's verdict; the undo is in `kb/supabase_workplan_move.sql`'s header.
3. ✅ `a.act-update-link` left `UPDATE_SEL` with #2291.
4. **`apply_migration`:** before a session's next DDL, read `supabase_migrations.schema_migrations` for anything newer than 23:19Z on 2026-10-12; none means the tool is still down and the SQL goes to Sam as a paste.
5. **Sheet 75 card 2, built (#2083):** an add, a move, and a Table, Archive or Restore on either tab queue `daily-dashboard.yml` through `chatbox/supabase/functions/workplan-rebuild` (it checks its caller as the caller, reviewer or phrase, reuses a build already waiting, writes no table; `kb/governance_surface_map.json` dismisses it with its reason), and a signed-in editor sees a sub-activity added since the build under its home Activity, and a row moved away hidden, at once. ✅ **Merged and deployed (S384):** `cpl-chat-deploy.yml` run 38464141223; the function reads back ACTIVE, version 1, `verify_jwt` off, its source matching main; without the key it answers 503. ✅ **Sam, Open Asks Sheet 77 (22:24-22:25Z, `cpl_memory` `sam-sheet-77-rulings-2026-10-13`):** card 1 done, the key `WORKPLAN_DISPATCH_TOKEN` is set (confirm on the next save: the add or move message says *within about 10 minutes*); card 2 *reviewer*: Table and Archive become reviewer-only on the Activities tab too. ✅ **Built and merged (S385, #2092):** `project_lifecycle.js` shows Table / Archive and Restore to a signed-in reviewer only and sends no `x-team-pass`; signed out, the dialog asks for a reviewer sign-in. The three write policies in `kb/supabase_project_lifecycle.sql` name `is_allowed_reviewer()` alone, applied by `supabase-migrate.yml` run 38480012281 (its first use, no approval wait; ledger `20261013224742`; receipt `kb/receipts/migration_project_lifecycle_reviewer_only_2026_10_13_s385_38480012281.json`; rollback `kb/receipts/project_lifecycle_reviewer_only_2026_10_13_s385_rollback.sql`). ✅ Read back live 22:52Z: `plc_insert`, `plc_update`, `plc_delete` name `is_allowed_reviewer()` alone; `plc_select` stays open. DR-13 in `kb/governance_register.json` says so.

**Related:** the 50% Law finding (restricted CPL funds sit outside the calculation; `cpl_memory` `fifty-percent-law-restricted-cpl-funds-outside-cee-2026-10-12`; public KB `policy-and-funding/fifty-percent-law-and-cpl-funds.md`) belongs to the funding lane.
