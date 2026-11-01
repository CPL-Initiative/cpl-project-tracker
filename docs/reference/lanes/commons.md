---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-10-20
tags: [reference, roadmap-lane, commons, program-requirements, cer, ccr, cr-reference, csr]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[program-requirements-harvest]]"
  - "[[cer-procedures]]"
  - "[[skyview-ccr-interface]]"
  - "[[common-cr-reference]]"
---

# The Commons

**What this lane is:** the Program Requirements way of working (procedures that handle the gaps, a Progress dash, a
feedback loop) carried to every common reference, with one look across their dashes and a Commons dash above them.
Sam, 2026-10-18 ~14:28Z, in chat (vault braindump `braindump-2026-10-18-1430-commons-dash-one-tracking-system`;
`cpl_memory` `sam-commons-dash-one-tracking-system-2026-10-18`): *"each of our "common" projects should have the same
approach and tracking and feedback system. Would be nice to get used to the screen appearance and as we make changes to
one, keep the other related dashes aligned... It all needs to culminate in a "Commons" dash that brings all the efforts
together and places them in some order of priority and completion and known issues and settled procedures and..."*

## The pattern, named (what Program Requirements carries today)

1. **A universe and a definition of complete**, one headline pair. Program Requirements: COCI's active programs, and
   the ones whose record passes the machine checks (S415; 11,621 of 20,282 on 2026-10-18).
2. **Procedures that do the work**, versioned (per college there), so a misread changes a procedure, never one item by
   hand.
3. **Machine checks on every item**, so known issues are a list that opens, each naming its owner: a procedure, a
   college, or Sam.
4. **Milestones and parts**, each count opening its list (`MILESTONES`, `PARTS`, `WHOLE` in `program_requirements.js`).
5. **A run log** written at every checkpoint: last run, next step, calls waiting on Sam, what changed
   (`kb/status/program-requirements.json`, `scripts/queue_status.py`, checkpoint step 12).

## The common references

| Reference | Tab | Lane | Where it stands |
|---|---|---|---|
| Program Requirements (Catalog ROEP) | `#program-requirements` | [program-requirements-harvest](program-requirements-harvest.md) | carries all five parts |
| Common Exhibit Reference | `#credential-reference` | [cer-procedures](cer-procedures.md) | procedures run nightly; the Progress view since S436 |
| Common Course Reference, SkyView | `#unified-courses`, SkyView | [skyview-ccr-interface](skyview-ccr-interface.md) | built and stable; the auditor's receipt on the Pipeline tab |
| Common CR Reference, with its military half | `#cr-reference` | [common-cr-reference](common-cr-reference.md), [military-ace-cr-reference](military-ace-cr-reference.md) | worklist live; the military half scoped |
| Common Subjects Reference (Sam's addition, Sheet 95) | `#canonical-subj4` | [common-subjects-reference](common-subjects-reference.md) | carries all five parts since S425: the Progress view, a procedure per card, the daily scan, the run log |

## Status

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List view from a spec the tab
hands it (Sam, 2026-11-01: *"This new list view is so helpful that I want one now for each of our Catalog Commons
groups"*). Exhibits (#2656), the Common CR Reference (#2657, with your flag #2659), Subjects (#2658) and Program
Requirements (#2660) run on it; Courses waits on where its List lives (SkyView's workspace or a COBI view from the
Course row). A change to the engine reaches every List: a List spans the window and its table scrolls in its own box
only when the window is narrower than its columns (#2661, Sam: *"full screen width and allow for a horizontal scroll
bar when needed"*).

**The Catalog Commons tab (S542, #2662):** full width; each row's calls cell reads **Decision Sheet Library**, its count
bold, a 0 in green; answered calls sit under **Completed Decision Sheets**, one line each that opens (Sam, 2026-11-01).
**Next (Sam, 2026-11-01):** everything in the Commons' Exhibit row joins the Exhibits tab's tiles above the list, folded into the existing tiles where it fits and as new tiles where it does not (*"I like the tiles above the list ... capture everything from 1st into Exhibits view"*); one source for both pages, so they stay aligned.


**LIVE: the Commons tab, `#commons` (S417, 2026-10-18).** Sam, 20:10Z: *"Build it as a tab now. I can
live without the words on the cards—pretty self explanatory and I am the main user."* The tab is the
mock-up's row without its prose: five rows in his order, each with the complete pair and the test behind
it, the known issues each naming an owner, the settled procedures, the calls in the run log and the two
stamps. Every row collapses on its own word to its count and meter (19:08Z: *"Commons looks good. Just
make sure I can collapse each and we have a collapse all button."*; 20:03Z: *"Keep the count and meter
when collapsed."*), Collapse all folds the page, the words on a row move it, and the order and the fold
stay in the browser. Sam's three rulings of the day carry the `cpl_memory` row
`sam-approves-commons-mockup-collapse-2026-10-18` (verified).

- **The machine side** is `kb/status/commons.json`, written daily by `kb/_build_commons_status.py`
  (daily-dashboard.yml, after the builds it reads) from the committed files alone: Program Requirements
  from `coci_programs_data.js` and the harvest's record files (the mock-up's own method); Exhibit from
  `kb/unified_titles.json`, `kb/credentials.json`, the exhibit audit, the procedures run's `latest.json`,
  the saving receipts and the fold report; Course from the auditor's `kb/row_audit/latest.json`,
  `prototype/ccr_universe.json` and the stand-alone build; CR from `kb/cr_reference_worklist.json` and
  the curator receipts under `kb/receipts/`; Subjects from `kb/discipline_canonical_subj4.json`. A figure
  a source cannot supply is null beside its error and reads *Could not be read* (the S343 rule). Guard:
  `tests/commons_status_build_test.py` (66 checks).
- **The session side** is each project's run log, `kb/status/<project>.json`: today Program Requirements
  alone has one, so four rows read *no run log*. The tab reads a run log's session stamp, next step and
  calls as its last checkpoint left them. A call Sam answered on its sheet carries `answer` {by, at, words}: listed
  with his words, counted answered (Sam, 2026-10-21: *"the open asks on The Commons doesn't seem to record that I
  responded"*; #2329).
- **The tab** is `commons.js` (jsdom guard `tests/commons.test.js`, 77 checks), booted after
  `commons_progress.js` (step 1's shared module, whose date helpers it reuses); `npm run a11y -- cobi:commons`
  passes at both widths; UI pass ledger `cobi:commons`.
- **The Course row is SkyView alone** (Sam, 2026-10-18 20:40Z: *"the CCR should be the same as SkyView now,
  right?"*; 20:46Z: *"SkyView alone, since CCR is included as part of it"*): its one word is *Open SkyView*, the map,
  and every count on the row opens it. The Common Course Reference list left the COBI menu at 20:51Z through
  `supabase-migrate.yml` (`kb/receipts/cobi_nav_unified_courses_hidden_2026-10-18_s417.sql`, the rollback in its
  header; the run's receipt `kb/receipts/migration_cobi_nav_unified_courses_hidden_2026_10_18_s417_39165056506.json`;
  the session's SQL guard holds an UPDATE for that path): `cobi_nav` row `unified-courses` is `hidden`, the `skyview`
  launcher row kept. The tab and its list view stay reachable by deep link (`#unified-courses`,
  `#unified-courses/list`) and the Admin tab can show the entry again.
- The mock-up stays the design record: https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi (version 4;
  source `docs/visuals/2026-10-18-commons-mockup.html`).

**Step 1 landed (S419, #2237, merged 19:28Z):** the Progress view the Program Requirements tab drew since S343 is
drawn by `commons_progress.js`, the shared module: the renderer, `readStatus()`, the milestone arithmetic, the shared
status words, the time words and the Progress CSS. A project brings a spec (its words, `MILESTONES`, `PARTS`, `WHOLE`,
a declarative `HEADLINE`, its read names), a context from its own live reads and a host lending its `section()`,
`goControl()` and call-card helpers; a host's classes are substituted into the CSS, one style per host; a spec with no
whole measure draws no band; a failed module load leaves the other views drawing. Nothing changed on screen:
`tests/program_requirements.test.js` passes its 417 checks with the module loaded first; `tests/commons_progress.test.js`
(30 checks) guards what only a shared module can get wrong. The status file is `kb/status/program-requirements.json`,
the first of one per common reference (`scripts/queue_status.py --project`); checkpoint step 12 names it. Lessons:
`docs/commons_lessons.md`.

**What the tab leaves for the build.** A count opens its reference's tab at the top, since no tab reads a
list from its address (the deep link is a build item). The gaps across the harvest's five parts are a live
read of the records' display facts, so the Program Requirements row carries two known issues, the failing
and the unread. The CR row's curator decisions come from the committed receipt, so a new sitting lands a
receipt under `kb/receipts/` or the figure stays at 30 (the live table is the authority). A call reads from
the run log and stays open until a checkpoint removes it; the decision sheet's store is read only where the
Progress view's `callAnswered` resolves a record. The machine stamps: Program Requirements the last college
read (on dispatch), Exhibit the later of the saving run and the fold, Course the auditor, CR the worklist's
last change from git, Subjects the daily sync; a daily stamp older than 36 hours reads stale, a run log
older than a week reads stale.

**Fable's advice, carried (2026-10-18):** complete differs in kind, so each row names the test behind its
count and no column sorts on a share; the machine stamp and the session stamp stay apart, each against a
declared cadence; a call has one source, which today is the run log, with the sheet's store a build item.

**RULED (Sam, Open Asks Sheet 95 card 1, 14:43Z, his own call, "build"; `cpl_memory`
`sam-sheet-95-rulings-2026-10-18`):** *"Yes, and include Common Subjects in the mix."* Step 1, the shared
Progress module (`commons_progress.js`, S419, #2237), is on main; the Commons tab came next on Sam's
20:10Z word. What remains of the order: a run log per project written at checkpoints, each reference's
Progress view (Exhibit, Course, CR, Subjects) from the module, each with its definition of complete on a
card for Sam.

**Step 2, the run logs (S423):** `kb/status/exhibit.json`, `course.json`, `cr.json` and `subjects.json` carry a session stamp, the lane's NEXT as the next step and no calls (nothing on any of the four waits on Sam); checkpoint step 12 names them, stamped with `scripts/queue_status.py --project <id> --stamp`, and refreshes the ones a run touched. A run log older than a week reads stale on the tab, which is true of a reference no session worked.

**Step 3's first Progress view, Subjects (S425, cpl-project-tracker#2260).** Sam, 2026-10-19: *"Can you develop a
dash for CSR similar to the one you created for PR? Seems like each of our Commons consolidation projects should
follow the same process"*; his ask moved Subjects ahead of Exhibit, Course and CR in the ruled order. The tab opens on
Progress, drawn by the shared module from its own definitions (a card per step, the procedures under the cards, the
findings), and a count opens the table with its filter through `#canonical-subj4/<filter>`, the deep link behind a
count; the Commons row's counts link the same way. The second host proved the contract: a 60-line host object, its
own section classes, no change to the module but an optional second word per part. Lane:
[common-subjects-reference](common-subjects-reference.md).

**Step 3's second Progress view, Exhibit (S436, 2026-10-20).** The Common Exhibit Reference tab gains a fourth view,
*Progress*, first in its row; the tab still opens on Needs you (S413), so nothing a curator lands on moved. The
definitions live in `exhibit_progress.js`, loaded with `commons_progress.js` the first time the view opens. **One
definition, two readers:** the headline pair and the auditor's tallies come from the Exhibit row of
`kb/status/commons.json` (the builder now writes `map_titles`, `unclassified`, `left_map`, `below_80`, `below_60`), so
the Commons row and the view cannot disagree; the rest is the tab's live state lent through an `api` (last night's
procedures report, the Unclassified, No issuer and Merge confirms queues, the lane switch). Definition of complete,
carried from the Commons row: a title carries a review stamp, a person's or a procedure's cohort's (1,729 of 4,915).
Five milestones (every MAP title classified, the held titles decided, an issuer for every credential, the reference
matches MAP, every title stamped) and eight cards. A count opens the lane that lists it, and
`#credential-reference/<lane>` (progress, held, unc, noiss, merge, procs, all, industry; `needs` and `ref` name a view)
routes from the address; the Commons row's counts now link there. Guard `tests/exhibit_progress.test.js` (30 checks);
`npm run a11y -- cer-progress cer-progress-dark` passes. The third host needed no change to the module.

**RULED (Sam, Open Asks Sheet 107 card 4, 13:09Z 2026-10-20, and again on Sheet 108 card 4, 13:24Z, his own call:
keep).** The Exhibit Progress view stays as S436 built it: complete = a title with a review stamp (the Commons row's
pair), and the tab opens on Needs you.

**Step 3's third Progress view, CR (S437, 2026-10-20).** The Common CR Reference tab gains a view row, *Progress* and
*Worklist*; the tab still opens on the worklist's Needs a decision. The definitions live in `cr_progress.js`, loaded with
`commons_progress.js` the first time the view opens. **Complete changed unit:** a *wording* colleges wrote resolves to a
settled reference when a rung 1 to 4 rule places it or a curator's decision names it (confirmed or not a topic; deferred
and cleared settle nothing), so the Commons row's pair moved from two group counts (156 by rule, 30 decided) to one:
**459 of 2,344 wordings, 5,750 of 9,413 articulations** (408 by a rule, 51 more by Sam's 2026-09-20 sitting). The
builder (`row_cr()`) and the tab (`SETTLES`) apply one rule; the builder reads the committed receipts, and the view's
Curator decisions card says when the live table and the receipts differ. Milestones walk the head-heavy corpus: the
rules applied, the top 50, 100 and 250 wordings settled, every wording settled; You are here is the head (44 of 50; the
six left are the POST community-relations wordings, Criminal Court Process, Elective Course Credits and Engine
Performance I). Two new worklist filters back the counts, *No rule or decision* (1,885) and *Name to check* (37), and
`#cr-reference/<view or filter>` routes from the address. The tab had drawn inside its loading placeholder's inline
style (a dashed box, muted centered text) since it shipped; the module now clears it on first paint. Guards
`tests/cr_progress.test.js` (42) and `tests/commons_status_build_test.py` (77, a fixture for the settling rule);
`npm run a11y -- cr-progress cr-progress-dark` passes. The fourth host needed no change to the module.

**RULED (Sam, Open Asks Sheet 108 card 5, 13:24Z 2026-10-20, his own call: keep; `cpl_memory`
`sam-sheet-108-rulings-2026-10-20`).** The CR Progress view stays as built: complete = a wording a rule places or a
curator decides, and the tab opens on its worklist.

**NEXT:** the Course Progress view from the shared module, with its definition of complete on a card for Sam and the
deep link behind each count. Course is SkyView alone (Sam, 2026-10-18), so its view lives where SkyView's counts can
reach it.

**To do, later (Sam, 2026-10-26 ~15:00Z, S490):** *"The Commons program numbers don't match the PR tabs numbers. Need
to make sure the numbers on all tabs on the commons match the commons summaries."* His two screenshots, the same morning:
the Commons' Program Requirements card read **13,194 of 20,282 complete at 114 colleges** (3,731 failing a check, 3,357
with no record; figures read 6:16 AM PT), while the Program Requirements tab's Progress read **17,529 records read at 114
colleges** and **3,274 fail a machine check** (7:38 AM PT). The two count different things (complete active programs
against records read) and from different reads, but neither page says so. Make every tab's figures and the Commons
summary agree, or name the difference on both. The same screenshot shows both Progress cards reading *Could not be read*
(`coci_college_programs` answered 500): check that read first, since an empty denominator can move every figure.
