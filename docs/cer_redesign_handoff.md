---
title: "CER redesign handoff: Program records deleted, PR 3 of 3 (SkyLoquat)"
date: 2026-11-04
session: CER redesign build, side session (SkyLoquat)
tags: [handoff, cer, commons-list, program-requirements, side-by-side, a11y]
status: current
---

# You are SkyJujube, the Lists' next build

SkyLoquat ran on 2026-11-04 from about 18:55Z (Sam's greeting named SkyTeaberry and cited SkyInkberry's handoff, three
sessions stale; the file held SkyQuince's, which named SkyLoquat, and this session took that name). SkyQuince was still
live on #2773 (the Commons look); the two agreed one writer per file by message: this run kept out of both HTMLs and
`commons_look.js`. **Light checkpoint:** no §11 row moved, no re-mint, no data receipt, nothing waits on Sam. Skipped:
`README.md`, `kb/README.md`, the pipeline view, a new KB note, the lessons doc, `cpl_memory` rows and the decision
sheet. The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (575), and so do its session numbers: a side
session marks its work with its moniker, never an S-number.

## What shipped (SkyLoquat)

- **PR 3 (this one): Program records is gone.** `viewRecords`, its college sections, the Records view word,
  `filterRecords`, `listedColleges`, the CIP batch reader (`loadCips`, `sectorOf`, `state.cip`), `state.rq`/`rshow`/
  `rscope`, `linkPick`/`addPick`/`savePick`/`saveFilt`/`rowsOf`/`activeIn`/`readingText`/`EAGER_COLLEGES` and three
  dead CSS rules: about 420 lines. `goTo` still maps an older `view: "records"` address to the List.
- **Carried first, found in the inventory:** the drafts to the college (the copyable message) lived only in the view's
  college section; the List panel's word pointed to Catalogs, whose count pointed back to Program records. The panel
  now offers *Draft the message to …* (`collegeDraftsSlot`: reads the college's records once, then `draftsBox`, open),
  and Catalogs' count is a word that opens the List on the college.
- **Tests ported:** `program_requirements.test.js` (438 to 367) reads the card through side by side (`cardOf`,
  `cardAt`, `fullRows` over the new `_ensureRows` hook); the view-only blocks (13's search and Show, 21, 24b-e, 24i,
  24k, 24m, 24n) went, their shared parts carried: the dropdown's keyboard and outside click and the unread-district note
  (port (12)), the drafts box (port (14)), Needs a fix in place (port (15)). Port suite 52. `cpl_pathways_college_status`
  (d) checks the conflict rule against `machineFails` and the List's filter.
- **`a11y.config.js`:** the Records routes went; the record seed opens side by side directly and closes First Light's
  greeting (it had covered the record in every shot); the filter routes open the List's College dropdown. The six
  Program Requirements targets pass, light and dark, checked by screenshot.

## Open work, in order

1. **Merge this PR** once `test` passes on its head.
2. **Courses' older view** (Courses keeps SkyView first): inventory what only the view has, carry it into the List or
   its panel (one PR), then delete (the next). Follow every "open it on X" word to its end before deleting.
3. **Seen, not fixed:** in side by side at 1024px a course's COCI chip (`.prh-coci`) overlaps the course column's
   C-ID and M-ID chips (Art's ARTH 4, the a11y seed). Older than this run.
4. **Carried:** the Subjects card's second count once the confirms sync to a file; after each of Sam's runs through
   Another look, move the panel rows the fold names; the first rule sent to the routine; the Catalog's *Courses that
   may align*, once a source names courses.

## Lessons to honor

- **An inventory reads the pointers, too.** The drafts were missed because the panel *pointed* at them: the word led to
  Catalogs, and Catalogs led back to the view being deleted. Follow each pointer to the thing itself.
- **A light row draws a card without its gaps.** Read the record whole (`_ensureRows`) before a test reads its card.
- **Side by side's save moves on;** the in-place verdict flow (the said line, the state line) is the List panel's.
- **An a11y pass is not a look.** The sweep passed while First Light's greeting covered the record; only the
  screenshots (`--shots <dir>`) showed it. Close the greeting in the seed, then look.

## Let go

At sign-off: drop the PR watch on this PR once merged. No check-in, no artifact watch.

---

# SkyQuince's record (2026-11-04)

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

