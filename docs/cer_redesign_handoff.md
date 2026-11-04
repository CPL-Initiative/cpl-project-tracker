---
title: "CER redesign handoff: CR's worklist and Subjects' Reference view retire into their Lists (SkyPawpaw)"
date: 2026-11-04
session: CER redesign build, side session (SkyPawpaw)
tags: [handoff, cer, commons-list, cr-reference, subjects, program-requirements, coci-lookup]
status: current
---

# You are SkyQuince, the Lists' next build

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
- **#2752** (open, CI): **Subjects' Reference view retires.** About 1,000 lines out of `canonical_subj4.js` (toolbar,
  table, row editor, variants and CPL modals); the check's *show* opens the panel; the panel lists *Codes it could take*
  with a *Take* word. The table's suites read the List through `tests/csr_list_harness.js`. Both HTMLs mount the views
  before `#cs-mount`.

## Open work, in order

1. **Merge #2752** once `test` passes on its head.
2. **Subjects' leftover CSS:** the table's rules in the tab's `<style>` block (both HTMLs, Rule 4): `.cs-table*`,
   `.cs-toolbar`, `.cs-summary`, `.cs-variants`, `tr.cs-cat-header`, `.cs-muted-dash`, `.cs-toast`. `tests/csr_ui_pass.test.js`
   still checks four of them (its RULES); move those checks to the rules that stay.
3. **The original views retire as each List does what they do**, one PR each, tests ported first: Programs' older view,
   then Courses' (Courses keeps SkyView first). Inventory what only the view has, carry it into the List or its panel
   (one PR), then delete (the next), as Subjects went.
4. **The Subjects card's second count** (local codes confirmed by a person) once the confirms sync to a file.
5. **Carried:** after each of Sam's runs through Another look, move the panel rows the fold names; the first rule sent
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
- **`npm test` locally exceeds the 30-minute background limit;** run the suites that touch the change, and let CI's
  shards run the rest.

## Let go

At sign-off: drop the PR watch on #2752 once merged. No check-in, no artifact watch.

---

# SkyTeaberry's record (2026-11-04)

SkyTeaberry ran on 2026-11-04 from about 00:00Z to 01:15Z (Sam named it; the greeting cited SkyInkberry's handoff, and
the file held SkyMulberry's, which named SkyMedlar). **Light checkpoint:** no §11 row moved, no re-mint, no data receipt.
One `cpl_memory` row: `pitfall-null-list-limit-empties-table-2026-11-04` (proposed). Skipped: `README.md`,
`kb/README.md`, the pipeline view, a new KB note (the List norms note took the record), the lessons doc (nothing
retired), and the decision sheet (nothing waits on Sam from this run). The CPL queue's `docs/session_<N>_handoff.md`
stays the routine's (565). The lint flags two items that belong to the routine: `CLAUDE.md` at 60,641 of 60,000
bytes, and the commits since `session_565` (its checkpoint trigger).

## What shipped (SkyTeaberry)

- **#2745** (merged): **Subjects and Programs take the line, the folded summary and the side panel.** Subjects'
  panel: an MQ discipline's local subjects (most used first, each share), the codes it shares (a collision, or shared
  by design; another discipline's name opens its panel) and Confirm this pick with its own status line. Programs'
  panel: the record's checks in words and its courses block by block with title, units and the CPL on record at the
  college; a light record is read once from the panel. **Engine fix:** a count pressed on CR's line set
  `L.limit = null` and `slice(0, null)` drew an empty table; `listState` restores the first page, callers pass
  `api.LIMIT`. `h.table` takes an opening `sort`; the line's pair words stop at a colon too.
  `tests/csr_list_panel.test.js`, `tests/program_requirements_list_panel.test.js`.
- **#2746** (merged): **Courses, the fifth.** Its counts open SkyView in a new tab (Courses keeps SkyView first); the line
  shares the tab's one read of the Commons file with its Progress page; a course's panel lists the local courses its
  M-ID holds, the Title drawer (description, outcomes) moved in. The Title drawer's tests in `coci_list` and
  `coci_lookup` now drive it inside the panel. `tests/coci_list_panel.test.js`. This checkpoint rides in it.

- **#2747** (merged): Exhibits' panel on the engine's parts (each exhibit's number links to MAP); Exhibits' and CR
  Progress's Commons reads through `CPL_COMMONS_LIST.readCommons` (`tests/commons_one_reader.test.js`); the CR wording
  panel does what the worklist's group card did (Split out, Put back, Name the group by it, Add a wording, the note
  with Defer, Clear). The engine's `h.table` takes a fixed column of controls.
- **#2748** (merged): the CR List opens first; Progress counts and `#cr-reference/<filter>` open it, with *Folded by a rule* and
  *Held by a screen*; the official-title warning rides in the panel; `#cr-reference/worklist` keeps the worklist.

- **This PR**: the worklist's Part B guards ported onto the List (`tests/cr_list_worklist_port.test.js`, 16), and a
  *Decided by* column on the CR List.

## Open work, in order

1. **Merge the worklist-port PR** once `test` passes on its head (#2746, #2747 and #2748 merged).
2. **The original views retire as each List does what they do**, one PR each, tests ported first. **CR's worklist is
   ready to delete:** the List opens first and does what it did, and `tests/cr_list_worklist_port.test.js` carries
   Part B (B1 to B16) onto the List, with a *Decided by* column for the CSV's who-and-when. Delete the worklist's render
   (`groupCard`, its picker and `wire`'s worklist handlers, the worklist view word, `#cr-reference/worklist`), then
   Part B of `tests/cr_reference.test.js` and Part D (the worklist's own control CSS; the engine's control rules
   cover the List). Keep Parts A and C (the builder's data). Then Subjects' Reference
   view (its toolbar filters, the SUBJ check modal), then Programs' and Courses' older views. Check what only the
   view still has and carry it into the panel first.
3. **The Subjects card's second count** (local codes confirmed by a person) once the confirms sync to a file.
4. **Carried:** after each of Sam's runs through Another look, move the panel rows the fold names; the first rule sent
   to the routine; the Catalog's *Courses that may align*, once a source names courses.

## Lessons to honor

- **A null page limit empties a List.** `rows.slice(0, null)` is `[]`. Reset with `api.LIMIT`; the engine now guards it.
- **The engine's `redraw` repaints the table only.** A control that changes the head (the line, the fold) calls the
  tab's own render.
- **A raw-hex lint reads `#2736` as a color.** Write PR numbers in comments as `PR 2736` in files whose tests scan for hex.
- **Before a title press moves into a panel, port the Title drawer's tests** (`.P-pdrawer` inside `#P-panel`) and
  filter a fetch log by its table (`course_outcomes`) rather than reading `fetches[0]`.
- **A 503 retries after a delay** in Programs' reads; a test that wants a failure answers 400.
- **A lane edit can tip its budget.** Run the lint before the push, not after.

## Let go

At sign-off: drop the PR watch on #2746 and the check-in `trig_01D7fGoDcNALyBK5UaqiHQP3` once it merges. No artifact watch.

---
