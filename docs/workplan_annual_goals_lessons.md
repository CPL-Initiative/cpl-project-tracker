---
title: "Annual Workplan Goals — lessons"
date: 2026-10-12
tags: [lessons, workplan, annual-goals, activities]
artifacts:
  - workplan_goals.js
  - excel_to_dashboard.py
  - kb/supabase_projects_count_note.sql
  - kb/receipts/workplan_2026-10-12_s372_add_3_9_move_1_1_2.sql
  - tests/workplan_goals_add_flow.test.js
  - activity_summaries.js
  - tests/activity_summaries.test.js
related:
  - "[[workplan-annual-goals]]"
  - "[[reference-workplan-activity-project-linking-model]]"
  - "[[methodology-an-option-list-read-from-the-page-dies-with-the-renderer]]"
---

# Annual Workplan Goals — lessons

## 2026-10-12 — SkyLedger (parallel session): the add flow that could not add, and the asks behind it

Sam asked for four things on Annual Goals (move AI Apprenticeship CPL Tools under Apprenticeship Sprint; edit goals whose cells look gray; generate the four activity-level updates from a Refresh control; an AA / mobile / First Light audit), then reported that adding 3.9 Futuro Behavioral Healthcare Project failed, then asked for notes defining what each goal number counts, wired to the Activities tab and the report generator.

**What we learned**
- **The add dialog had two independent faults.** Its Activity list came from `[data-kind="activity"]`, a marker printed only by the grouped Workplan Goals renderer, which the Annual table replaced in the same AWG markers (#909's Path A era); the list came back empty and every sub-activity prefix failed. And a sub-activity add wrote only `workplan_goals`, never the `projects` row the table iterates, so even a valid add never rendered. Neither shows in a test that builds its own fixture with the old marker.
- **`project_add.js` lost both mount points** (`#projectCount`, `#awgProjectsAddSlot` are gone from the page), so there was no working add path anywhere. Its jsdom test still passes because the fixture supplies the anchors.
- **The tree is the id.** `projects` has no parent column; nesting is the id's depth. Moving 1.1.2 under 4.2 is a re-key of five live rows (projects, item_raci, item_updates, two association rows; no ladder). The only FK on `projects(id)` is `update_log`.
- **"Grayed" had four causes**, none of them a lock: the Goal/Stretch row fill; no at-rest edit cue once unlocked; eight ladderless rows whose cells really are read-only with nothing saying so; and no keyboard route to any cell.
- **The a11y tool passes the tab** (contrast, targets, layout at 390/1440 signed out and in the editor seeds) and misses keyboard reachability, `th scope`, raw hex in inline styles and the plain-words/green rules. A pass is not an audit.
- **Activity-level updates are rare:** 2 ever (Activities 1 and 3, late June) against 39 sub-activity updates. Sam's Refresh idea matches the use.
- **`projects.kpi_unit` already is "what it counts"** (the cards print it beside the number); the longer definition had no home, so `count_note` was added. Making `kpi_unit` editable exposed an unescaped interpolation on the card.
- **The repo guard blocks every session data write except cpl_memory** (`scripts/supabase_sql_guard.py`); a reviewed write goes to Sam as a paste for the SQL editor. `apply_migration` stays the DDL path.

**State at the time:** PR A #2051 (draft, WIP, CI is the first test run); data SQL waiting on Sam; PR B (audit fixes), C (Move), D (Refresh summaries, approve-before-post) queued in the lane file.

## 2026-10-12/13 — SkyTally (S375): PR A merged, PR B (the UI audit) built

**What we learned**
- **A scanner sees only a literal.** PR A's add wrote three tables through `post(table)`, which built `"/rest/v1/" + table`. The static scan behind the Admin tab's surface map and the dependency map could not see the association insert, and the rebuilt map listed it as a read. Shard 1 caught it only because `cobi_admin_surface.js` was stale. The fix names each table beside its `method: "POST"`; a helper may check the response, never build the URL.
- **jsdom passed a keyboard path that Chrome failed.** Removing a focused field fires its `blur` in Chrome, and the cell editors commit on blur, so Escape restored the cell twice and threw ("the node to be removed is no longer a child") before focus could return. The old code threw on every save and every Escape; the save itself still went out once. A `done` guard (the shared text editor already had one) closes each field once; the return of focus is deferred one tick. `npm run a11y`'s functional keyboard check found it; jsdom never fires that blur.
- **Making a word keyboard-reachable brings it under the 24x24 target rule.** The editable names and "Add" prompts were never measured as targets while they were mouse-only spans; with `role="button"` and `tabindex` they are, and 126 failed. They now grow to 24px.
- **`--on-accent` is not white in dark.** It turns near-black there while `--seal-blue` stays the navy, so the header text read 1.43:1. Text on `--seal-blue` takes `--white` (as the statewide tabs already do).
- **The gray page band is the First Light background** (`#cplfl-bg`, fixed, 100vh). It scrolls with the reader; only a full-page capture shows it stopping. Not this tab's fault, and not a defect a reader meets.
- **A preview needs no cron.** The committed `kb/workplan_goals_snapshot.json` plus `CPL_Data.js` feed `build_workplan_goals_from_supabase`, and the rendered table spliced into a scratch copy of `index.html` lets the a11y tool measure a renderer change before the cron publishes it.

## 2026-10-13 — SkyTally (S375), continued: the Move control, held for its function

**What we learned**
- **A function that must finish or change nothing can be proven before it ships.** The sandbox cannot run a Postgres server, but PGlite runs the committed SQL file as written, with roles, grants and exceptions that roll back the statement. The Move function passed 22 checks there, including the one its design rests on: a table it does not know that still holds the old id stops the move and a before-and-after snapshot shows nothing changed (`docs/kb-notes/playbook-test-a-database-function-locally-with-pglite.md`).
- **A move needs a run-time guard, not a list.** The tables that store a sub-activity id are measured today (seven); a test can pin that list but cannot see a table added next month. The function scans every public `project_id`, `item_id` and `activity_id` column after its re-key and raises if any still holds the old id, which is the #872 failure turned into an error.
- **update_log's foreign key decides the order.** It references `projects(id)`, is not deferrable and does not cascade, so the function copies the project row under the new id, re-points the log, then deletes the old row.
- **The governance proposer read RPC writes by their name's verb**, and "move" was not on its list, so the first scan proposed the tab instead of counting it mapped. "move" is on the list now; the surface maps to DR-13, the workplan's row.
- **`apply_migration` was down for the night.** Four timeouts for this run (even a plain create table with grants), six for S374 an hour earlier, nothing landing, no lock. Two pending structure changes went to Sam as pastes on one sheet rather than a third route around the migrations path.
- **A checkpoint PR can strand.** S374's #2052 passed `test` and its session ended before merging; it carried handoff 376. This run merged main into it (clean; derived files current) so it could land, and wrote its own handoff as 377.

**State:** #2051, #2054 and #2055 merged and published; #2057 (checkbox targets) and #2056 (Move, held) open; Sheet 72 carries the four open asks.

## 2026-10-13 — SkySequoia (S377): Refresh summaries shipped; the Move control fixed and still held

**What we learned**
- **`indexOf` checks the first match, and a second dialog moved the first match.** The First Light test read "the dialog's lead word comes first" from the first `actions.appendChild(btnSubmit)` in `workplan_goals.js`; the Move dialog, added later in the file, appended Cancel before Move, and the test failed on the new dialog without naming it. Move now leads, and the test checks every Submit/Cancel pair in order.
- **`apply_migration` was down, and the migrations table says so.** S377's full try and a table-only try both timed out with no row, no lock and no running query, and `supabase_migrations.schema_migrations` showed nothing newer than 23:19Z on 2026-10-12, though an 18,000-character migration had landed at 21:51Z. Read that table before retrying: a gap since the last success means the tool, never the SQL.
- **A drafted update needs its provenance in the row, not in the page.** The summary posts with the approver as author (as the RACI composer writes it), and `raw` carries the drafter, the model, whether the reviewer edited it, the original draft when edited, and the `item_updates` and `projects` ids it drew on. Nothing renders `raw`, so the JSON costs readers nothing and lets a later session read what Sam changed.
- **Group a sub-activity by its home field.** `projects.workplan_activity` names the home Activity (parsed by number); the id prefix lies after a move, and 1.1.2 is about to sit under Activity 4.
- **The Update link's job moved, so the link went.** The Refresh field is editable and stays open when a draft fails, which covers writing a summary by hand; the RACI tab's composer still accepts activity keys for the team phrase.
- **Measure overflow before blaming the new control.** At 390px the Activities page scrolled 71px sideways with or without the new panel: the header's link row was a `nowrap` span, and PR A's Add sub-activity pushed it over. The row now wraps, each link keeps `nowrap`.
- **The published page versions its scripts** (`src="activity_summaries.js?v=d963b4a7"`), so grep the live page for the name with `?v=`, never the bare `src`.
- **Playwright's last-registered route wins.** A catch-all abort registered after the stubs swallowed them; register the catch-all first.

- **The SQL editor is the route when the tool is down.** Sam ran Sheet 72 cards 2 and 3 in Supabase's SQL editor about 03:50Z, each block whole, as two queries; both landed at once while `apply_migration` still accepted nothing. A paste needs its read-back in the same block (card 2 ended with one) and a fresh footprint read before it goes out: S377 re-measured 1.1.2 in every id column at 03:20Z, since the card's move was written the day before.

- **A move changes sort order, and a name-matched series reads sort order.** The workplan charts pick each population series from the goal rows by a word in the name, last match wins. 1.1.2 "AI Apprenticeship CPL Tools" carried no ladder (all zeros) and was harmless while it sorted first; as 4.2.1 it sorted last, the chart took its zeros, and dashboard run 585 died on a zero division. The read-back of the move itself was clean: the failure sat in a consumer three steps away. After a move or an add, run the generator (or wait for the dashboard run) before calling it done (#2063).

**State:** #2059, #2061 and #2056 merged; the Move function live (anon false, authenticated true); 3.9 added and 1.1.2 is 4.2.1 (read back 03:51Z). The dashboard was dispatched after #2056.

## 2026-10-13 — SkyHemlock (S378, scheduled): Move to the phrase held; the Common Course Reference UI pass

**What we learned**
- **A scheduled session's permission check reads a widened grant as a permission change, whatever the ruling behind it.** Sam chose "the team phrase too" on Sheet 72; the session's first edit to the Move function (the gate plus `grant execute ... to anon`) was refused before any file changed. The routine's rule treats a refusal as a hold: a card on Sheet 73, no retry and no route around it. Access widening belongs in a session Sam opens.
- **A tab that opens on another view is measured as that view.** The Common Course Reference opens on SkyView filling the window, so `npm run a11y cobi` measured the map and reported one heading fault, while the list a curator works in carried eight contrast faults in dark (the toggle 1.29:1, the id column 1.76:1) and five kinds of undersized targets. A seeded target on the list's own link (`#unified-courses/list`) found them; `ccr-list` and `ccr-list-dark` now measure it.
- **Growing a target can push a fixed-layout column over.** The caret and the info mark at 24px pushed *Course* into the id column; the id was already clipped because `.uc-id` kept `nowrap` against a June fix that meant it to wrap. Look at the screen after a target-size fix: the sweep reported clean while the cells overlapped.

**State:** #2063 merged and run 586 green; no Refresh posted and no Move made yet; Move to the phrase held on Sheet 73.

## S382 SkyLarch (2026-10-13): the Under list, a row added since the rebuild, and the stale home check

- **A list that groups by kind hides the parent beside its children.** Under listed the four Activities first and every
  sub-activity after them; Sam, adding 4.7 EMS Corps, looked for Activity 4 beside 4.6 and found only sub-activities, whose
  pick suggests a child (4.6.1). Each Activity now sits above its own sub-activities (#2080, `fillParentOptions`).
- **A choice list built from the drawn page lags the table by a rebuild.** `collectExistingIds()` reads the rows on the
  page, which redraw nightly, so a sub-activity saved today could not be a parent until tomorrow. The dialog already read
  the live ids for the duplicate check; it now offers the live sub-activities too, less tabled, archived and D.* rows
  (`project_lifecycle` hides those from the table).
- **An automatic check must be cleared by the same automation.** The dialog checked the default parent's Activity 1 box as
  home; typing 4.7 moved the home label to Activity 4 and left Activity 1 checked, so 4.7 saved with a second link Sam had
  not chosen. `setHome()` clears the box it checked unless the editor touched it.
- **Running the rebuild by hand unblocks the same day** (dashboard run 590, ~7 minutes). Sam asked whether adds and removals
  could skip the wait; the recommendation (draw rows changed since the build at once, and queue a rebuild on save) and the
  removal question (his 2026-07-02 immunity ruling) wait on him.

**State:** #2080 merged; 4.7 drawn by run 590; three asks open (the lane's NEEDS SAM).

## 2026-10-13 — SkySpruce (S383): Sheet 75, Table and Restore on Annual Goals

**What we learned**
- **Read the code before a card states what a ruling still does.** Sheet 75 card 3 said the 2026-07-02 ruling keeps official
  sub-activities immune from Table and Archive. The Activities-tab reorg (Session 95) dropped that gate: every card there is
  tableable by a reviewer or the team phrase, and `activityLayerIds()` is kept for reference only. Sam's "reviewer" answer
  still decides the Annual Goals surface; whether the phrase keeps Table on the Activities tab goes back to him.
- **A selector written for one markup survives a UI pass only by luck.** `setGoalsRowsHidden` hid a tabled row's Annual Goals
  rows through a `td[rowspan]` name cell; #2054 made it a row header (`th`), and the rows still hid only because each ladder
  cell carries `data-aid`. A row without a ladder cell (Current) would have stayed. The guard's fixture has one.
- **One writer, two surfaces.** Annual Goals opens the Activities tab's own Table / Archive dialog and Restore
  (`CPL_PROJECT_LIFECYCLE.openTable`, `.restore`) and listens for `cpl-lifecycle-changed`, so `project_lifecycle` has one
  write path and both tabs agree at once.

**State:** Sheet 75 answered (drop, both, reviewer); card 1 waits on Sam's paste; card 3 built (`tests/workplan_goals_table_control.test.js`, 16); card 2 is open work.
