---
title: "CER redesign handoff: side by side's chips stay in their cell (SkyJujube)"
date: 2026-11-04
session: CER redesign build, side session (SkyJujube)
tags: [handoff, cer, commons-list, program-requirements, side-by-side, a11y]
status: current
---

# You are SkyKumquat, the Lists' next build

SkyJujube ran on 2026-11-04 from about 21:21Z (Sam's greeting named it and cited SkyLoquat's handoff, which the file
held). **The moniker ran twice:** a Cowork session (`session_01Rvwe2Xto2Gp2P1RBVdv913`, on Kristen_Surface) shipped
#2776 as SkyJujube before this one started, taking item 2 below. By message this run left it the Courses carry
(`coci_lookup.js`, `unified_courses.js`, `tests/coci_list_cc_card.test.js`, `lanes/commons.md`) and kept to
`program_requirements.js`, its test and this file. **Light checkpoint:** no §11 row moved, no re-mint, no data receipt,
nothing waits on Sam. Skipped: `README.md`, `kb/README.md`, the pipeline view, a KB note, the lessons doc, `cpl_memory`
rows and the decision sheet. The CPL queue's `docs/session_<N>_handoff.md` stays the routine's (575).

## What shipped (SkyJujube)

- **This PR: side by side's course chips stay in their cell.** At 1024px the record pane is about 490px, so the
  course column (17%) let a course's C-ID and M-ID chips run into the title column over the COCI chip. The record
  pane is now a container (`prh-rec`) and the card's tables stack by its own width under 560px, sharing the phone's
  rules (`STACK_CSS`); a stacked cell's element children sit in the value's column (the M-ID chip had dropped into the
  word's column on the phone too). Measured in Chromium at 768, 1024 and 1440: every chip inside its cell. Guard
  `tests/program_requirements.test.js` (19), 369 checks; `npm run a11y -- program-requirements-split
  program-requirements-split-dark` passes.

## Open work, in order

1. **Merge this PR** once `test` passes on its head.
2. **Courses' older view** belongs to the Cowork session that shipped #2776 while it runs (its next PR: the merge
   editor and Suggested merges; then the deletion). Read `list_sessions` first; take it only if that session has
   stopped, from where `lanes/commons.md` says it stopped.
3. **Carried:** the Subjects card's second count once the confirms sync to a file; after each of Sam's runs through
   Another look, move the panel rows the fold names; the first rule sent to the routine; the Catalog's *Courses that
   may align*, once a source names courses.
4. **Small, seen:** stacked, the Units and CPL here cells keep `.prh-num`'s right alignment, so their words sit right
   in the word column (older, on the phone too).

## Lessons to honor

- **Check the live sessions before taking a handoff's next item.** Item 2 here had already shipped as #2776 under the
  same moniker; `list_sessions` and `main`'s log named the session, and one message settled who writes what.
- **A table in a pane stacks by the pane, not the viewport.** A `@media` breakpoint never fires for a 490px pane on a
  1024px screen; a container query does.
- **Measure the overlap, then look.** The a11y sweep passed with the chips overlapping; a bounding-box check of each
  chip against its cell, plus a screenshot scrolled to the row, showed the fix.

## Let go

At sign-off: drop the PR watch on this PR once merged. No check-in, no artifact watch.

---

# SkyLoquat's record (2026-11-04)

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

