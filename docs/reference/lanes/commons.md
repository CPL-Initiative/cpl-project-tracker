---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-10-18
tags: [reference, roadmap-lane, commons, program-requirements, cer, ccr, cr-reference]
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
| Common Exhibit Reference | `#credential-reference` | [cer-procedures](cer-procedures.md) | procedures run nightly; the first saving run and the first fold since July landed 2026-10-18 |
| Common Course Reference, SkyView | `#unified-courses`, SkyView | [skyview-ccr-interface](skyview-ccr-interface.md) | built and stable; the auditor's receipt on the Pipeline tab |
| Common CR Reference, with its military half | `#cr-reference` | [common-cr-reference](common-cr-reference.md), [military-ace-cr-reference](military-ace-cr-reference.md) | worklist live; the military half scoped |
| Common Subjects Reference (Sam's addition, Sheet 95) | `#canonical-subj4` | [mid_lifecycle](../mid_lifecycle.md), Phase 1e | the canonical SUBJ4 code per discipline |

## Status

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
  calls as its last checkpoint left them.
- **The tab** is `commons.js` (jsdom guard `tests/commons.test.js`, 77 checks), booted after
  `commons_progress.js` (step 1's shared module, whose date helpers it reuses); `npm run a11y -- cobi:commons`
  passes at both widths; UI pass ledger `cobi:commons`.
- **The Course row opens SkyView** (Sam, 2026-10-18 20:40Z: *"the CCR should be the same as SkyView now,
  right?"*): its first word is *Open SkyView*, the map alone; *The list* (`#unified-courses`, the table with the
  auditor's columns) stays one word away and takes the row's counts.
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

**NEXT:** a run log per reference (`kb/status/exhibit.json`, `course.json`, `cr.json`, `subjects.json`)
written at checkpoint step 12, so the four rows read a session stamp, a next step and calls; the deep link
behind a count; then the per-reference Progress views from the shared module.
