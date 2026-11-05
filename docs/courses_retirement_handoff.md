---
title: "Courses retirement handoff: the old Common Course Reference tab into the Courses List (SkyJujube)"
date: 2026-11-04
session: Courses retirement, side session (SkyJujube)
tags: [handoff, commons, commons-list, courses-list, ccr, signin, views]
status: current
---

# You are SkyKumquat, the Courses retirement's next build

SkyJujube ran on 2026-11-04 from about 19:42Z (Sam's greeting cited SkyLoquat's `docs/cer_redesign_handoff.md`). A
second session also took the name SkyJujube; the two split by message: **this file and the Courses lane are this
session's**, and the other took Programs' chip overlap (#2778) and `docs/cer_redesign_handoff.md`. A side session marks
its work with its moniker; the CPL queue's `docs/session_<N>_handoff.md` stays the routine's (575).
**Light checkpoint:** no Roadmap row moved, no re-mint, no data write beyond `cpl_memory`. Skipped: `README.md`,
`kb/README.md`, the pipeline view, a new KB note, the decision sheet (one ask was put to Sam in chat; below).

## What shipped

- **#2775 Sign-in: the magic link lands in the keeper and returns to the view.** `unified_courses.js` landed every
  COBI magic link at load (found in the inventory); `cpl_session.js` `consumeAuthHash()` now does, before `tabs.js`.
  No stash lands home (it had defaulted to the Common Course Reference). The stash keeps the whole address;
  `CPL_SESSION.viewAddress(tab, fn)` lets a tab report its view. `workplan_goals.js` and `cpl_news.js` stash through
  the keeper.
- **#2776 Courses: the List's panel carries the common course's card and its edits.** `coci_lookup.js` `ccCard`:
  name, discipline and its source, units range, confirmed or not, a save since the file was built; signed in:
  Rename (`unified_title`, never for a C-ID/CCN), Set the discipline, Confirm (a merged course stamps `validated_at`).
  `tests/coci_list_cc_card.test.js` (31). The engine anchors its Title drawer on the panel's first direct-child
  `<details>`: the sign-in fold is wrapped in a `div` so it never pulls the drawer up (seen only in the screenshot).
- **#2777 Context meter: a null usage field counts as zero.** The meter and its hook had been silent.
- **#2779 Every COBI view has an address** (merged). `CPL_SESSION.arrival(tab)`;
  21 more tabs open the view their address names and report it; CLAUDE.md's *Every view has an address*;
  `tests/every_view_has_an_address.test.js` (107). Built by three agents on disjoint files; each tab has a round trip.

## Open work, in order

1. **#2779 merged; CLAUDE.md is back under its 60,000-byte budget** (this checkpoint moved the checkpoint-scope
   paragraph to `obsidian_vault_wiring.md` and trimmed two asides). Keep it there: move PULL prose out before
   adding a rule.
2. **Suggested merges: read Sam's answer.** Asked in chat 2026-11-04: about 7,300 suggestions written daily
   (`unified_courses_suggestions.js`), none acted on since Sep 27, unseen since 10-18. 1 retire with the tab
   (recommended; stop the daily build writing the file), 2 carry the merge editor into the List. If no answer, carry
   it onto the next Open Asks sheet (a NEEDS SAM block in the commons lane makes the builder require it).
3. **The ways in, then the filters (one PR).** SkyView's three `../index.html#unified-courses/list` links
   (`prototype/ccr_universe.js` ~l.4592, 6416, 6553; rebuild `skyview.html` with its builder) to `#coci-lookup/courses`;
   Quickstart (`quickstart.js` `TABS`, `HINT_VOCAB['unified-courses']`, the routing rule) to `coci-lookup`, a
   `search` hint becoming `sessionStorage.cpl_coci_focus`; Subjects' *Fix on CCR* (`canonical_subj4.js` ~l.700) the
   same, and have COCI Lookup switch to Courses when a focus is waiting (today the focus fills the List's finder
   but a tab last left on Progress stays there). The tooltips in `statewide_interactive.js` (~l.1756, 2076) that say
   *Sign in via the Common Course Reference tab*. The auditor's other triage tags as List job filters
   (`JOB_FILTERS`: title mismatch, subject-code outlier, description mismatch, generic title, cross-discipline
   over-merge, subject collision, orphan merge target, unified issues).
4. **Delete the tab.** `unified_courses.js`, its pane and hidden nav button in both HTMLs (Rule 4), the
   `excel_to_dashboard.py` line that re-injects its script (~l.13122), `a11y.config.js` `seedCcrList` and the
   `ccr-list` routes, `kb/ui_pass_ledger.json`'s `cobi:unified-courses`, `prototype/check_skyview_sweep.js`'s asserts,
   the SkyView framed host (`unified_courses.js` ~l.287, 347; SkyView's framed branch serves only it), about 67
   `tests/uc_*.test.js` plus `ccr_skyview_*`, `ccr_list_ui_pass`, `lazy_tab_data`, `nav_groups`, `commons.test.js`'s
   `#unified-courses` fixture, `csr_subj_check`. **Keep** `unified_courses_members.js`, `_aligned.js` (My College reads
   both) and `_member_desc.js` (SkyView's shards); `_data.js` stays (the List's card reads it). The data files only
   the tab read (`_details`, `_index`, `_standalone`, `_suggestions`) are generator output: stop writing them in a
   separate PR. Docs that call the tab live: the commons, discipline-crosslist and skyview lanes, pipeline_reference,
   kb_build_status, README, `reference-ccr-curation-sync-and-live-merge`. The `cobi_nav` row `unified-courses`
   (hidden) becomes an orphan: a guarded delete with a receipt, or leave it and say so.
5. **Carried:** Programs' and the other Lists' items in the commons lane's NEXT.

## Lessons to honor

- **Inventory what a module does at load, beyond its pointers.** A hidden tab ran every COBI sign-in.
- **Measure use before carrying a feature.** `kb_curation` counts by field (all time and last 30 days) sized the carry
  from ten writes to three.
- **An address is the only carrier of a view.** Read it as a visit starts (after any per-visit reset), report what is
  on screen, store nothing; re-fired activations are no visit.
- **A screenshot finds what jsdom passes:** the sign-in fold moved the drawer, and every test passed.
- **Parallel agents in one working tree work when their files are disjoint** and a guard test lists every tab first;
  the stop hook asks for commits while they run, so snapshot their edits and squash at merge.

## Let go

At sign-off: drop the PR watch on #2780 (this checkpoint) once merged; #2775, #2776, #2777 and #2779 merged and unwatched. No check-in, no artifact watch.
