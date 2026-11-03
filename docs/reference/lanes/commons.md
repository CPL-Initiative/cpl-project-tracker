---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-02
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

**The CPL Commons, the working name (Sam, S552, 2026-11-02).** *"Let's call the Catalog Common the CCC Commons for now
and you can play off of that for the card titles and focus elements."*, then, on seeing it: *"Let's go with these designs for now. I'm chickening out on the CCC Commons...let's go with CPL Commons for now as less of a wholesale take over of the system:)"* The first-view mock
(https://claude.ai/artifact/TG8LPUBATV8WFfrmvPwKEG, a Design canvas, version 8, locked by Sam; source in
`CPLBrain/04-projects/cpl-initiative/catalog-commons-mock/`) now reads **CPL Commons**, with its lede (*eight common references the
California Community Colleges keep together for credit for prior learning*), and each of its eight cards is a **Common**
reference, this tab's own row pattern with "Reference" dropped: Common Programs, Common Subjects, Common Exhibits,
Common Credit Recommendations, Common Courses, Common Credentials, Common Outcomes, Common Skills. The decisions band,
the sort note, the skip link and the footer carry the same words; the Programs card opens CPL Pathways. "Register"
(S551's advice) is retired. The mock is in Malone's CPL/AI look at Sam's ask (S551), which is the public pages' look,
so the port into this tab waits on his call on the look.

**RULED (Sam, Open Asks Sheet 158 cards 2 and 3, 15:01Z 2026-11-02, his own call: "malone", "rename").** The CPL
Commons first view ports into this tab in **Malone's CPL/AI look**, the first COBI tab to carry it (First Light stays the
rule for the other tabs; this is the one departure inside COBI, beside the public pages' departure of 2026-10-24). The
side menu reads **CPL Commons** (`cobi_nav` row `commons`, one guarded UPDATE, receipt
`kb/receipts/cobi_nav_commons_label_cpl_commons_2026-11-02_s552.sql`, the rollback in its header).

**LIVE: the CPL Commons first view (S552, 2026-11-02, #2697).** `commons.js` draws the locked mock as the tab's first
view: the decisions waiting on Sam lead (every open call from the run logs, each naming its card), then one card per
common reference, your decisions first, then by how far along, then the builds; a card carries its Common name, one
line of what, the headline pair with its meter, *Your decision* (the first open call, linked to its sheet), *Recently*
(the run log's latest change, first sentence; a row with no run log shows its machine stamp), *Next* (the run log's
next step), its opening words and *Decision record*. Three filter words (*All eight*, *Needs you*, *Building*) last the
visit. The rows of 2026-10-18 (known issues, settled procedures, the Decision Sheet Library, the last run, Sam's order
and fold) stay under **Details**, one word away; a card's *Decision record* opens them at its row. **The three building
references** (Common Credentials, Common Outcomes, Common Skills) are `building` rows in `kb/status/commons.json`, written
by `kb/_build_commons_status.py` from `kb/it_ai_credential_catalog.json` (`_stats`) and the committed
`kb/course_outcomes/*/read_*.json`: a count with no universe, no meter, the file's stamp. **Malone's look** (Sheet 158
card 2): the palette lives once as `--cmn` tokens on `#tab-commons`; the dark theme maps every role onto a First Light
dark token (`:root[data-theme="dark"] #tab-commons` and the OS-dark media query), so no color is invented there. Inter
loads once from Google Fonts. Guards: `tests/commons.test.js` (108), `tests/commons_status_build_test.py` (83).

**A to-do closes here (S555, 2026-11-02).** Sam: *"There is one decision in the queue that doesn't give me a way to close it, just links to review."* A run-log call with a `todo_id` is a to-do; the Commons now reads the marks (`queue_todo_done`, for a signed-in reviewer), a standing mark answers its call, and an open to-do offers **Mark done** with a note in the band, through `rpc/queue_todo_done_add`. Guard `tests/commons.test.js` (todo 1-5).

**The opened page, one renderer (S556, 2026-11-03).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws
the mock's opened page for any reference: the progress line over its one denominator, *Needs attention* with an action
each and the team's next step, and the three question groups with every count over one denominator; an unread count says
*Could not be read*. First Light tokens (the Commons tab alone wears Malone's look). **Exhibits carries it** as its
**Progress** view, first in the views row, at `#exhibits/progress`, and the Common Exhibits card opens there; the tab
still opens on Review (Sheet 147). The headline is the Commons row's pair (Sam's keep, Sheets 107 and 108); the groups
read `credCounts()`, the Credentials tiles' own counts. The CER tab's S436 Progress view stands as kept. Guards
`tests/exhibits_progress_page.test.js` (41), a11y `exhibits-progress` and `exhibits-progress-dark`. **The CR Reference
carries it too (S556):** its Progress view draws the page first and the S437 milestones and parts under *Details*,
closed; the three questions are counted per wording from the worklist the tab holds (grouped, official number, statewide
line; units stated, units agree; two or more colleges, two or more credentials), and the card opens
`#cr-reference/progress` while the tab still opens on the worklist. Guard `tests/cr_progress.test.js` (54). **Subjects
too (S556):** the page over the 147 MQ disciplines with courses, with questions that fit a code (what it is called, whose
code it is, how it reaches the courses); the milestones and steps under *Details*, the procedures and findings below.
Guard `tests/csr_progress.test.js` (78), a11y `canonical-subj4-progress` (320 to 1440) and `-dark`.

**CPL Pathways too (S558, 2026-11-03):** the Program Requirements tab's Progress view draws the page first and the
dash (milestones, parts, the whole harvest, the calls) under *Details*, closed; opening a call opens Details. The
denominator is COCI's active program, the headline's own unit, and the three questions fit a program: where it is read
from (a college with a catalog address, with a reading procedure), what it requires (read, units add up, nothing
added), whether it matches the state's record (every course COCI lists placed, complete). A record on a program COCI
does not list never counts; a failed active read says *Could not be read*. `commons_page.js` loads on the first
Progress render. Guard `tests/program_requirements_page.test.js` (16); a11y `program-requirements-progress` and
`-dark` wait for the page and open Details.

**The Common Course Reference too (S559, 2026-11-03, #2720):** COCI Lookup's **Progress** view, first in its views row
(the tab still opens on the Courses List), at `#coci-lookup/progress`; the Commons card's third word, *Open Progress*.
It reads the Commons' own row (`kb/status/commons.json`, key `course`) and the run log it names, so its headline is the
card's pair: ready (the auditor's 0.85 or better) of the auditor's cards, 3,205 of 27,581. Needs attention: needs
repair, then the row's issues with who fixes each, Open SkyView on each. The three questions (what it is called, where
it sits, whether its courses agree) count the cards free of one auditor tag; the builder writes those six tag counts
into the row's `facts.tags`. **NEEDS SAM (Open Asks Sheet 160, S559, 2026-11-03): complete is the auditor's *ready*,** proceeded on the
recommendation; reply to reverse (*curator* would count only a person's confirmation in SkyView). Sheet: https://claude.ai/artifact/KWSqdMPag3RXkwpvqGZqE9 Guard `tests/coci_progress.test.js` (29); a11y `coci-lookup-progress` (320 to 1440) and `-dark`.
Every reference now carries the opened page.

**NEXT:** the to-do below: make every tab's figures and the Commons summary agree, or name the difference on both.
The a11y pass (`npm run a11y -- cobi:commons`) passes on the first view at both widths (S552).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List view from a spec the tab
hands it (Sam, 2026-11-01: *"This new list view is so helpful that I want one now for each of our Catalog Commons
groups"*). Exhibits (#2656), the Common CR Reference (#2657, with your flag #2659), Subjects (#2658) and Program
Requirements (#2660) run on it. **The Courses List is the COCI Lookup tab's Courses view** (#2670, live): 141,738
local courses banded by today's M-ID (from `unified_courses_members.js`, never the extract's older column), Open in
SkyView on each band, read only (an M-ID move is a re-mint, done in SkyView). Sam, 2026-11-01 ~23:02Z: *"WE have the
COCI lookup tab in COBI...maybe courses in that?"*; SkyView stays the map alone. The engine filters before it sorts and
sorts on per-column ranks (a settled finder keystroke 228 ms at 141,738 rows). A change to the engine reaches every List: a List spans the window and its table scrolls in its own box
only when the window is narrower than its columns (#2661, Sam: *"full screen width and allow for a horizontal scroll
bar when needed"*).

**The Catalog Commons tab (S542, #2662):** full width; each row's calls cell reads **Decision Sheet Library**, its count
bold, a 0 in green; answered calls sit under **Completed Decision Sheets**, one line each that opens (Sam, 2026-11-01).
**Next (Sam, 2026-11-01):** everything in the Commons' Exhibit row joins the Exhibits tab's tiles above the list, folded into the existing tiles where it fits and as new tiles where it does not (*"I like the tiles above the list ... capture everything from 1st into Exhibits view"*); one source for both pages, so they stay aligned.


**The List norms (Sam, 2026-11-01: *"consistent views for all the folding and consolidation work"*):** every reference's List follows [`reference-catalog-commons-list-norms`](../../kb-notes/reference-catalog-commons-list-norms.md); a PR names which of the ten norms it carries and why it leaves any out. Step 1 of its three landed in S544: the engine's `suggest` slot and the visit's changed set, with CR's rung proposals (*Suggested groups*, Confirm the group) and the Subjects open picks (*Suggested picks*, Confirm this pick) wired in; step 2 put every filter word's count in the engine (S544), and *Selected* on every List; step 3, bands from the spec (the engine's `bands` hook, with `order` for a band named by something other than its key), landed in S543 for Courses and S545 for CR's groups. The Exhibits List moved onto the engine's suggestion slot and changed set in S545, so all three steps have landed.

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

**Steps 1 and 2 (S419 #2237, S423): the shared Progress module `commons_progress.js` and the five run logs under `kb/status/`.** The record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*).

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

**Step 3's Progress views, Subjects (S425, #2260), Exhibit (S436) and CR (S437), with Sam's keep rulings (Sheets 107 and 108):** the record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*). Each host brought a 60-line spec to the shared module and needed no change to it.

Each reference's Progress view now draws the opened page; Course's landed last (S559, above).

**To do, later (Sam, 2026-10-26 ~15:00Z, S490):** *"The Commons program numbers don't match the PR tabs numbers. Need
to make sure the numbers on all tabs on the commons match the commons summaries."* His two screenshots, the same morning:
the Commons' Program Requirements card read **13,194 of 20,282 complete at 114 colleges** (3,731 failing a check, 3,357
with no record; figures read 6:16 AM PT), while the Program Requirements tab's Progress read **17,529 records read at 114
colleges** and **3,274 fail a machine check** (7:38 AM PT). The two count different things (complete active programs
against records read) and from different reads, but neither page says so. Make every tab's figures and the Commons
summary agree, or name the difference on both. The same screenshot shows both Progress cards reading *Could not be read*
(`coci_college_programs` answered 500): check that read first, since an empty denominator can move every figure.
