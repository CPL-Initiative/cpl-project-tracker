---
title: "CER redesign handoff: the Subjects List as Sam's workspace; Commons views fold and resize (SkyJujube)"
date: 2026-11-05
session: CER redesign build, side session (SkyJujube)
tags: [handoff, cer, commons-list, common-subjects-reference, exhibits, check-alignment]
status: current
---

# You are SkyKumquat, the Lists' next build

SkyJujube ran 2026-11-04 21:21Z to 2026-11-05 ~00:40Z with Sam driving the Common Subjects List live. Another Cowork
session also named SkyJujube owns the Courses carry (`coci_lookup.js`, `unified_courses.js`, `lanes/commons.md`); a
third (CO Academic Affairs setup) owns `our_process.js`. **Light checkpoint** (context at the warn line): no Roadmap
row moved, no re-mint, no Rule 10 write. Skipped: `README.md`, `kb/README.md`, the pipeline view, the decision sheet,
`program-requirements.json` (the routine's).

## What shipped (all merged)

#2778 side by side's chips stay in their cell. #2781 saves renew the sign-in (the 401s), a row press edits and moves
the panel, local-code counts name their courses (`kb/discipline_local_courses/`). #2782 Colleges beside Courses, the
Note seeded on a code edit, a reason to keep, Check alignment (Subjects and Exhibits), the scan list shortens. #2783
*What a Common SUBJ is* (`prototype/common_subj_explainer.html`) and KB note section 5. #2785 *Hide the top* on every
Commons view, side panels resize, Take becomes Use, a row saved since the scan leaves the scan list.
CPLBrain#663 Sam's Common SUBJ framing, verbatim. **The sync ran and was reverted** (phase-1e-sync, 00:15Z): new codes in the file ahead of their
M-IDs fail `tests/csr_trail_rules_test.py` (canonical codes with no identity; strays 2,488 of 75,581). Sam's saves stay
in `kb_curation`; sync them with the re-mint, in one window.

## Sam's decisions this run

- The Common SUBJ model (his words in the braindump): four-letter codes for every MQ discipline, adopted from C-ID and
  CCN where they exist; he hopes C-ID's 21 short prefixes move to the CCN standard.
- Keep ELMT. Keep cards and edits on the List: row press edits; Use, not Take; colleges beside courses; a reason to keep.
- Check alignment belongs on every Commons List.

## Open work, in order

1. **The re-mint dry-run** that carries the evening's new codes (Cabinet Making WWKC, Furniture Making WWKF, Graphic
   Arts GFCD, Building Codes CBIT, Diesel DIES, AI CSIS and others) onto their M-IDs. Read
   `docs/reference/mid_lifecycle.md` and `docs/coursecontrolnumber_remint.md` first; the refreshed
   `kb/subj4_dryrun/report.md` is the starting list. The apply waits on Sam.
2. **Check alignment on CR, Programs and (offer it to the other session) Courses**: engine `edit.extra`; worked
   examples `codeAudit` (canonical_subj4.js), `exhibitAudit` (exhibits.js).
3. **After the 06:17 scan**, confirm the answered findings left; any left are the scan's rules disagreeing with a note.
4. Carried: ECONMT and Electricity's adult-education codes (Sam's refile); the Subjects card's second count; the
   stacked Units cells' right alignment.

## Lessons to honor

- Read a session token at write time; a laptop sleep outlives the copy taken at load.
- A code change and its re-mint land together: syncing new codes alone turns main red. Notes alone could sync any time.
- Verify a "fix the display" ask against the database: the evening's "reverts" were saves that never landed.

## Let go

No PR watch, no check-in, no artifact watch remain.

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

