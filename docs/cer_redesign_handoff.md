---
title: "CER redesign handoff: Program records retires into the Programs List, PRs 1 and 2 of 3 (SkyQuince)"
date: 2026-11-04
session: CER redesign build, side session (SkyQuince)
tags: [handoff, cer, commons-list, program-requirements, side-by-side, cpl-pathways]
status: current
---

# You are SkyLoquat, the Lists' next build

SkyQuince ran on 2026-11-04 from about 17:05Z (Sam named it; the greeting cited SkyPawpaw's handoff, and the file held
it). **Light checkpoint:** no §11 row moved, no re-mint, no data receipt, nothing waits on Sam. Skipped: `README.md`,
`kb/README.md`, the pipeline view, a new KB note (the List norms note took the record), the lessons doc, `cpl_memory`
rows and the decision sheet. The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (573); the commit
count since it (6) is the routine's trigger.

## What shipped (SkyQuince)

- **#2769**: **the Programs List's panel carries Program records' card.** `recordFacts` (shared by the card and the
  panel) draws the checks in full and the CPL line; the panel adds the flags with where each sits, each course's
  C-ID/CCN/M-ID chips, flag marks, outcomes and its CPL here dialog, Side by side, and Confirm and Needs a fix (or the
  sign-in). New List filters: *Confirmed by a person*, and *Waiting on your reading* for a signed-in reviewer, counted
  live. `tests/program_requirements_list_record_port.test.js`.
- **PR 2 (this one)**: **every way into Program records opens the List.** `goTo` takes `view: "list"` (`lf`, `lq`,
  `rcollege`, `panel`) and maps an older `view: "records"` address; `TO`'s record counts open List filters (Complete is
  Pass); a call's *Open it in the List* opens the record's panel; CPL Pathways' college line sends `view: "list"`. The
  four dropdowns (`dropdownBox`, shared) sit over the List; off-list records are rows under *On a program COCI does not
  list as active*; the panel points to the college's drafts on Catalogs and offers *Read again*; `nextToRead` follows
  the List's rows. **Engine fix:** the drawer goes before the panel's first direct-child `<details>` (a nested one
  threw NotFoundError). `program_requirements.test.js` 444 to 438, the six moved to the port suite (39).

## Open work, in order

1. **Merge PR 2** once `test` passes on its head.
2. **PR 3: delete Program records.** The view is now reachable only by its own view word. Delete `viewRecords`, its
   `collegeBody`, the Records view word in `VIEWS`, `listedColleges`, `state.rq`/`rshow`/`rscope`, the `records:*`
   sections, `loadCips`/`sectorOf`/`state.cip` if nothing else reads them, and `filterRecords` once CPL Pathways' test
   (d) stops calling it. **Keep** `recordCard`/`fillBody` (side by side draws them), `verdictBox`, `flagsFor`, the CPL
   dialog, `dropdownBox`, `picks`/`filt`/`linkPick`. **Port first:** 28 blocks of `tests/program_requirements.test.js`
   drive the Records view: (4) (6c) (11) (13) (15a) (15b) (15d) (15e) (17) (17b) (19) (19b) (20) (21) (22) (23) (24a)
   (24b) (24c) (24d) (24e) (24i) (24k) (24l) (24m) (24n) (25) (25b). Most test the card's parts through it; drive
   them through side by side (`M.openSplit`) or the List panel (`tests/program_requirements_list_record_port.test.js`'s
   harness), and drop what tests only the view (its Show select, count line, college cards, lazy college reads). Then
   update the lane file's "Four views" line (`docs/reference/lanes/program-requirements-harvest.md`).
3. **Then Courses' older view** (Courses keeps SkyView first), the same three steps.
4. **Carried:** the Subjects card's second count once the confirms sync to a file; after each of Sam's runs through
   Another look, move the panel rows the fold names; the first rule sent to the routine; the Catalog's *Courses that
   may align*, once a source names courses.

## Lessons to honor

- **An engine anchor found by `querySelector` reaches into the tab's nodes.** `body.querySelector("details")` found a
  fold nested in the checks; anchor on direct children.
- **Move the ways in before deleting the view.** Re-pointing `TO`, the calls and the cross-tab hand-off is its own PR;
  the deletion then breaks only the view's own tests.
- **Keep the old address working.** CPL Pathways' `CPL_PROGRAM_REQUIREMENTS_GOTO` may hold a `view: "records"`
  request from a page loaded before the deploy; `goTo` maps it.
- **A dropdown that redraws only the engine's table keeps its list open;** a full `render()` would close it.

## Let go

At sign-off: drop the PR watches on #2769 and PR 2 once merged. No check-in, no artifact watch.

---

# SkyPawpaw's record (2026-11-04)

SkyPawpaw ran on 2026-11-04 from about 02:24Z to 03:45Z (Sam named it; the greeting cited SkyTeaberry's handoff, and the
file held it). **Light checkpoint:** no §11 row moved, no re-mint, no data receipt. `cpl_memory`:
`cr-worklist-retired-into-list-2026-11-04` (verified), `subjects-reference-view-retiring-into-list-2026-11-04` and
`pitfall-qs-hint-wiped-by-arrival-reset-2026-11-04` (proposed). Skipped: `README.md`, `kb/README.md`, the pipeline view,
a new KB note (the List norms note took the record), the lessons doc (nothing retired), and the decision sheet (nothing
waits on Sam from this run). The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (565). The lint flags two
items that belong to the routine: `CLAUDE.md` at 60,641 of 60,000 bytes, and the commits since `session_565`.

## What shipped (SkyPawpaw)

- **#2750** (merged): **CR's worklist retired into the List.** Deleted the worklist's render (group cards, picker,
  filter row, stat row, CSV), its write handlers and its control CSS; the view row reads Progress, List, and
  `#cr-reference/worklist` opens the List. `tests/cr_reference.test.js` keeps Parts A, C and B17; Part B lives on in
  `cr_list_worklist_port`. Two suites caught what the worklist alone had carried: the header pointer
  (`team_phrase_affordance`) and the one prose measure (`cobi_prose_measure`).
- **#2751** (merged): **Subjects' List carries the Reference view.** Its lists became List filters (No code yet,
  Confirmed, On the CCN code, On the C-ID code, An official code differs, Proposed); every Progress count, old filter
  address and quickstart hint opens the List; a TOP column takes the TOP filter's place; the head carries the sign-in and
  Run the SUBJ check; the panel folds the CPL window and the C-ID and CCN courses on its codes.
  `tests/csr_list_reference_port.test.js` (17).
- **#2752** (merged): **Subjects' Reference view retires.** About 1,000 lines out of `canonical_subj4.js` (toolbar,
  table, row editor, variants and CPL modals); the check's *show* opens the panel; the panel lists *Codes it could take*
  with a *Take* word. The table's suites read the List through `tests/csr_list_harness.js`. Both HTMLs mount the views
  before `#cs-mount`. Five ported suites re-baselined their check floors (`tests/check_floor.json`), each loss named.
- **This PR**: the table's 55 rules leave the tab's `<style>` (both HTMLs) and the box's injected CSS with them;
  `csr_ui_pass` checks the rules that stay and that the table's are gone; `cobi_prose_measure`'s layout sample moves to
  `.cr-title-cell`.

## Open work, in order

1. **Merge this PR** (the Subjects CSS) once `test` passes on its head.
2. **The original views retire as each List does what they do**, one PR each, tests ported first: Programs' older view,
   then Courses' (Courses keeps SkyView first). Inventory what only the view has, carry it into the List or its panel
   (one PR), then delete (the next), as Subjects went.
3. **The Subjects card's second count** (local codes confirmed by a person) once the confirms sync to a file.
4. **Carried:** after each of Sam's runs through Another look, move the panel rows the fold names; the first rule sent
   to the routine; the Catalog's *Courses that may align*, once a source names courses.

## Lessons to honor

- **Deleting a view can delete a guard's only evidence.** The worklist held CR's only "in the header" pointer and only
  prose measure; run the suites that scan source (`team_phrase_affordance`, `cobi_prose_measure`, `csr_ui_pass`) before
  the push, not only the tab's own.
- **A quickstart hint lands before its tab does.** The tab's arrival reset (tabs never remember a filter) wipes it;
  hold it for that one arrival (`state.qsHeld`).
- **A save's `render()` must not repaint the List.** The List's callers redraw it and put focus back; a second repaint
  from `render()` loses the focus (csr_list (4)).
- **Port a suite that has no List engine by giving it one:** the shell's `CPL_TABS.loadScript` running
  `commons_list.js` in the page's context (`tests/csr_list_harness.js`).
- **Build the next PR on the open one, push it after the squash:** `git rebase --onto origin/main <old-branch>`.
- **A ported suite runs fewer checks than its floor** (`tests/check_floor.json`), and CI fails the shard. When the
  drop is the retired view's own checks, lower that file's entry by hand and name the loss in the commit (the full
  `npm run test:floor` refuses a shard and rewrites every entry).
- **A suite can print its FAIL lines indented** (`axe_select_names`); match `(^|\s)FAIL` when sweeping, never `^FAIL`.
- **Never hide a check's exit code behind a pipe:** `check_generated.sh | tail -1` let a stale dependency map through.
- **`npm test` locally exceeds the 30-minute background limit;** run the suites that touch the change, and let CI's
  shards run the rest.

## Let go

At sign-off: drop the PR watch on this PR once merged. No check-in, no artifact watch.
