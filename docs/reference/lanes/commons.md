---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-06
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

**The opened page, one renderer (S556 to S559).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws
the mock's opened page for any reference: the progress line over one denominator, *Needs attention* with an action each,
and three question groups over that denominator; an unread count says *Could not be read*. First Light tokens. **Every
reference carries it** as a **Progress** view, one word from the List the card opens (Sam, 2026-11-03: *"open the List view as the default for all the commons actions"*; held exhibit titles keep Review, Courses keeps SkyView):
Exhibits `#exhibits/progress` (questions read `credCounts()`, the tiles' own counts), CR Reference
`#cr-reference/progress`, Subjects (`canonical-subj4`), CPL Pathways (`#program-requirements`, denominator COCI's active
program) and the Common Course Reference in COCI Lookup (`#coci-lookup/progress`, the row's pair: ready of the auditor's
cards). Guards `tests/exhibits_progress_page.test.js`, `cr_progress`, `csr_progress`, `program_requirements_page`,
`coci_progress`; a11y targets `<view>-progress` and `-dark`. Per-view detail: `docs/commons_lessons.md` (*Moved from the
lane, 2026-11-03*). **Complete is the auditor's *ready*** (Sam, Open Asks Sheet 160, *keep*, 12:44Z 2026-11-03): a common course counts
before a person confirms it; a confirmation is an attribute the reference gains, counted beside it. His words are in
`docs/commons_lessons.md` (*Sheet 160 answered*). **Confirmed by a person, on all five** (Sam, S565: *"yes to both, build them for all four"*): each row's second `pair`,
a line on the card and under each Progress bar. 2026-11-03: Programs 32 (synced daily, `kb/_sync_program_checked.py`),
Exhibits 1,173, Courses 957 (a save on the card or placing a course into it), CR 97, Subjects 122. Detail in the lessons (*The confirmed count*).

**FIXED: the first view, from Sam's recording (SkyBeacon, 2026-11-06, #2857).** Sam: *"I don't think the various items
and procedures are updating and wired properly."* (1) Details: a completed decision sheet's line widened its cell over
*Last run* and past the card (3,414px in a 1,920px window) because each Details list is a grid with an auto column; one
`minmax(0, 1fr)` column cuts it with its ellipsis. (2) Subjects: the card's 30 scan findings were 9 weak mnemonics Sam had
noted on Nov 5 and 21 anchor entries keyed off a Common SUBJ that changed; a recorded note now settles a weak mnemonic
(`cs6_mnemonic_noted`, `kb/_csr_trail.py`), and the anchor findings are their own re-key item beside the identity codes,
on the card and the Subjects page (one skip list). (3) Mark done and the done marks: the card read a lapsed reviewer token
as signed out, so Sam's Monterey mark (saved on CPL Pathways, 19:29Z) never left the band; it now renews first and re-reads
on the keeper's announcement ([`reviewer-session-lifetime`](reviewer-session-lifetime.md)). The write stays reviewer-only.
**COCI Lookup is named Courses and Programs** (Sam, 2026-11-06, #2858); the tab key and every `#coci-lookup/...` address
stay.

**NEXT:** from the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; a stalled routine or a backlog that stops shrinking becomes a queue item; the confidence count for the CR rule rungs and the Course auditor; the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500). `npm run a11y -- cobi:commons` passes at both widths with the queue (S573).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List view from a spec the tab
hands it (Sam, 2026-11-01: *"This new list view is so helpful that I want one now for each of our Catalog Commons
groups"*). Exhibits (#2656), the Common CR Reference (#2657, with your flag #2659), Subjects (#2658) and Program
Requirements (#2660) run on it. **The Courses List is the COCI Lookup tab's Courses view** (#2670, live): 141,738
local courses banded by today's M-ID (from `unified_courses_members.js`, never the extract's older column), Open in
SkyView on each band; an M-ID move is a re-mint, done in SkyView. A course's panel carries its common course's card and, for a signed-in reviewer, Rename, Set the discipline and Confirm, carried from the Common Course Reference tab before it retires (SkyJujube, 2026-11-04, `tests/coci_list_cc_card.test.js`). Sam, 2026-11-01 ~23:02Z: *"WE have the
COCI lookup tab in COBI...maybe courses in that?"*; SkyView stays the map alone. The engine filters before it sorts and
sorts on per-column ranks (a settled finder keystroke 228 ms at 141,738 rows). A change to the engine reaches every List: a List spans the window and its table scrolls in its own box
only when the window is narrower than its columns (#2661, Sam: *"full screen width and allow for a horizontal scroll
bar when needed"*). **All five Lists carry the line, the fold and the side panel** (2026-11-04). **All five carry Check alignment** (Sam, 2026-11-04: *"We could use that feature on all our commons list views"*; S578
added the last three): one audit and one recommendation beside the edit, reading what the page holds and writing nothing.
Subjects audits a typed code, Exhibits a title and issuer, CR a reference (its applied official name, a cited course its
wordings never reach, another group's name, a wording's unit count up front), Courses a name (its local courses' titles,
its discipline's other common courses) and a discipline (where colleges file the same subject codes; a TOP-sourced one
corroborates only), Programs a record in *Your reading* (its machine checks, COCI's title and units, the same award under
the same CIP elsewhere). The shared text tests are `CPL_COMMONS_LIST.alignNorm` and `alignClose`. Guards
`tests/cr_list.test.js` (12), `tests/coci_list_cc_card.test.js` (7), `tests/program_requirements_list_record_port.test.js` (16).

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04).** The inventory found `unified_courses.js` landing every COBI magic link (moved into `cpl_session.js`, #2775) and writes curators had stopped using (`kb_curation` on 2026-11-04, all time / last 30 days: merges 23,143 / 0, renames 7,787 / 0, discipline 245 / 1; description edits and merge notes never). #2776 carried the common course's card and Rename, Set the discipline and Confirm into the List's panel. NEXT: the ways in (SkyView's three `#unified-courses/list` links, Quickstart's routing, Subjects' *Fix on CCR*, `excel_to_dashboard.py`'s script injection) and the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Suggested merges (about 7,300 written daily, none acted on since Sep 27): carry or retire, asked in chat 2026-11-04 (recommended: retire). Handoff: `docs/courses_retirement_handoff.md`.

**LIVE: the one queue (S573, 2026-11-04, Sam: "yes, start building the one queue").** Every issue in `kb/status/commons.json` names its `carry` (`routine`, or a person's reason: `no_procedure`, `unsure`, `reaches`, `keep_call`); the file's `queue` groups the person items, and an issue naming none lands under `unsorted`. The tab draws it as *Waiting on a person*, under the decisions band. Guards: `tests/commons_status_build_test.py`, `tests/commons.test.js` (queue 1 to 10).

**LIVE: the confidence count (S573, 2026-11-04, Sam: "start on the confidence count next").** `kb/status/commons.json`'s `confidence` says what a person did with each procedure's work afterward: the Exhibit procedures' receipts (`kb/cer_procedures_out/saved/`) against `kb/unified_titles.json`, the nightly Subjects confirm's (`kb/csr_out/confirm/`) against the seed. A result a person looked at is kept, renamed with its family (its old name is gone and its siblings moved together), or moved (a correction). 2026-11-04: of 1,178 titles placed, a person looked at 94, kept 23, renamed 71, moved 0; none of the 13 confirmed picks looked at yet. The tab shows it as *How far to trust the procedures*.

**RULED: a count opens its job, filtered; the queue in process order; TOP waits on no one (Sam, S574, 2026-11-04).** *"the links on all surfaces should open to the filtered view of the job needed"*; *"put the procedural things to act in a process order within their cards"* (subjects, courses, exhibits, CR, programs); TOP disagreements *"are input unchecked by colleges. CIP from the COCI programs records should be more dependable"*, so they left the queue. Guards `tests/commons_jobs_filtered.test.js`, `tests/coci_list_jobs.test.js` (the Courses jobs and the strays). **The Courses List first, SkyView beside it** (Sam, same day: *"I want to be able to use list or skyview. Skyview is still too buggy to make the main workspace"*), reversing 2026-11-03's SkyView first. Exhibits' 622 open `#exhibits/list/left`. **The look on every Commons view** (S574): `commons_look.js` gives the five references' tabs commons.js's palette and, in light mode, maps First Light's roles onto it (dark keeps First Light's); `tests/commons_look.test.js`, `npm run a11y` passes on all 13 Commons routes.

**RULED: every Commons view in Malone's look, and the path (Sam, S573, 2026-11-04, in chat).** *"Use the new UI format rather than first light on this and all commons views."* This widens Sheet 158 card 2 from the first view to every Commons view (the Lists, the Progress pages, the side panels); First Light stays the rule for the rest of COBI. The same morning he asked for a visual of the curator's steps and decision points, *"available on every commons surface"*, plain words, with *"a generic term"* for him. The mock is **the path** (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9, source in `CPLBrain/04-projects/cpl-initiative/commons-path-mock/`): six steps every reference shares (know what belongs, let the daily check run, work the list, get the lead's call, check the connections, clean), the CPL Commons view and the Common Subjects view. NEXT: his reaction, then the other references' paths, then the port (`commons_page.js` and `commons_list.js` onto the `--cmn` tokens, the path as a fold above each List).


**The Commons tab's first build (S417, 2026-10-18)**, its machine side, session side and the Course row's SkyView-alone ruling (since reversed: the Courses List first, S574), moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04, SkyJujube*).

**Steps 1 and 2 (S419 #2237, S423): the shared Progress module `commons_progress.js` and the five run logs under `kb/status/`.** The record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*).

**What the tab leaves for the build** (2026-10-18) moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04*): a count now opens its job's filtered list.

**Fable's advice, the Sheet 95 ruling and step 3's Progress views (2026-10-18 to 2026-10-25)** moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, SkyBeacon, 2026-11-06*).

Each reference's Progress view now draws the opened page; Course's landed last (S559, above).

**To do, later (Sam, 2026-10-26 ~15:00Z, S490):** *"The Commons program numbers don't match the PR tabs numbers. Need
to make sure the numbers on all tabs on the commons match the commons summaries."* His two screenshots, the same morning:
the Commons' Program Requirements card read **13,194 of 20,282 complete at 114 colleges** (3,731 failing a check, 3,357
with no record; figures read 6:16 AM PT), while the Program Requirements tab's Progress read **17,529 records read at 114
colleges** and **3,274 fail a machine check** (7:38 AM PT). The two count different things (complete active programs
against records read) and from different reads, but neither page says so. Make every tab's figures and the Commons
summary agree, or name the difference on both. **The Program Requirements pair is done (S560, #2721):** both pages
headline complete active programs of COCI's active (S558); *Needs attention* now counts active programs whose record
fails, the card's unit, where it had counted every failing record; and each page names the one difference left, timing
(the card counts the records committed at the last checkpoint, the tab reads live: 13,553 committed against 13,542
live on 2026-11-03). **The other four pairs, checked (S561):** Course reads the Commons row itself and CR reads the
same committed worklist build, so both agree by construction. **Subjects disagreed:** the page counted 17 scan findings
to confirm or note and the card 16, since the card counted two rules and left out the dead-format anchor; both now
count one set, the findings needing judgment less the ones another item counts (`ASK_SKIP` in `canonical_subj4.js`,
`CSR_ASK_SKIP` in the builder; the page also lists a missed alignment, as the card does), and each names its timing
(the card counts the daily sync, the page reads the picks live). **Exhibits would have counted held titles twice** on
a night the procedures run held any (live from the review file, and again from the Commons row); the page now drops
the row's held and conflict copies once the review file is read, and both pages say why the card's list is shorter
(the page adds the tab's own queues). Guards: `tests/csr_progress.test.js` (79), `tests/exhibits_progress_page.test.js`
(43), `tests/commons_status_build_test.py` (85). The same screenshot shows both Progress cards reading *Could not be read*
(`coci_college_programs` answered 500): check that read first, since an empty denominator can move every figure.
