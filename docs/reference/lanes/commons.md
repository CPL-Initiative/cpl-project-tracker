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
   (`kb/queue_status.json`, `scripts/queue_status.py`, checkpoint step 12).

## The common references

| Reference | Tab | Lane | Where it stands |
|---|---|---|---|
| Program Requirements (Catalog ROEP) | `#program-requirements` | [program-requirements-harvest](program-requirements-harvest.md) | carries all five parts |
| Common Exhibit Reference | `#credential-reference` | [cer-procedures](cer-procedures.md) | procedures run nightly; Sheet 94's rulings to build |
| Common Course Reference, SkyView | `#unified-courses`, SkyView | [skyview-ccr-interface](skyview-ccr-interface.md) | built and stable; the auditor's receipt on the Pipeline tab |
| Common CR Reference, with its military half | `#cr-reference` | [common-cr-reference](common-cr-reference.md), [military-ace-cr-reference](military-ace-cr-reference.md) | worklist live; the military half scoped |
| Common Subjects Reference (Sam's addition, Sheet 95) | `#canonical-subj4` | [mid_lifecycle](../mid_lifecycle.md), Phase 1e | the canonical SUBJ4 code per discipline |

## Status

**RULED (Sam, Open Asks Sheet 95 card 1, 14:43Z 2026-10-18, his own call, "build"; `cpl_memory` `sam-sheet-95-rulings-2026-10-18`):** *"Yes, and include Common Subjects in the mix."* The order: lift the Progress view out of `program_requirements.js` into one shared module and one status file per project (`kb/status/<project>.json`, today's `kb/queue_status.json` generalized), with nothing changing on screen and its 417 checks guarding the lift; then each reference's Progress view (Exhibit, Course, CR, Subjects), each with its definition of complete on a card for Sam; then the Commons tab from a mock-up: one row per reference with its complete pair, where it stands, known issues by owner, settled procedures, calls waiting on Sam and its last run, in the order he sets.

**Fable's review of the plan (2026-10-18, at Sam's suggestion; advice, the calls stay Sam's):**

- *Complete differs in kind.* Program Requirements' complete is a machine state and nearly only grows; an Exhibit or
  Course complete is a curator's judgment a merge or a re-mint can undo; Subjects counts a few hundred disciplines
  against 20,282 programs. Each Commons row carries its definition's phrase and the test behind it (machine-checked,
  curator-confirmed, assigned) beside the pair, and a percentage stays inside its row, never a sortable column.
- *A status file is only as live as its writer.* One routine writes `kb/queue_status.json`; the other references have
  none. Keep the machine stamp (the nightly CER run, the auditor) apart from the session stamp (next step, calls), and
  show each as an age against a declared cadence, so a stale row reads stale.
- *Calls have one source.* The decision sheet's store holds Sam's answers; a Commons cell counting calls from a
  status file shows an answered call as open. Read it the way the Progress view's `callAnswered` does.
- *Order:* mock the Commons row, with today's real numbers filled by hand, before step 1 fixes the status-file shape:
  the row's cells are that file's contract. Recommended: run the mock-up beside step 1, a small reorder of Sam's
  "build"; he may say otherwise.
- *What the mock-up must show:* five real rows at today's counts, including one stale row, one that could not be read
  and one with a call open; each count opening its list; phone width; and the control Sam sets the order with. Show
  the mock-up to Fable before Sam.

**The mock-up is published (S416, 2026-10-18):** https://claude.ai/artifact/JmaUvTxUqqrL4aPaq2rizi, source `docs/visuals/2026-10-18-commons-mockup.html`. Five rows at the day's counts in the Progress shape: the pair with its definition of complete and the test behind it (machine-checked, curator-confirmed, scored by the auditor, assigned by rung), where it stands, known issues by owner, settled procedures, the calls on Sam, and the machine and session stamps as ages against a cadence (the CR row's session stamp stale at 28 days, the Course row's could not be read, the CER row with one call open), with Move up and Move down setting the order. Sam has not seen it.

**Fable's review of the mock-up (2026-10-18, after S416's checkpoint; advice, the calls stay Sam's):**

- *Four cells fall short.* Every count links to a bare tab hash and the tab reads no list from the URL, so "a count opens its list" is a build item to name. An owner like "the catalogs disagree on units" is a cause; the actor is a curator. The CR row lists two non-issues (88 range-named groups, 185 collapsed strings). The Program Requirements pair plus its first two counts sum to 20,631 against 20,282.
- *Definitions of complete.* Exhibit: the 615 carry a review stamp and no reviewer (416 on one day, 86 on the June 2 bulk stamp), so say "carries a review stamp"; the 3,813 omits the 1,498 queued and keeps 605 titles gone from MAP; the credential unit reads 1,368 of 2,187 records, and the first saving night adds about 900. Course: a seed-untouched discipline caps a card at 0.79 and 14,511 cards carry that tag, so the 0.85 tier measures discipline curation, a Subjects dependency. CR: 30 decided by a curator and 156 collapsed by rule are two figures, or count rows covered (51 verdicts reached 1,459 of 9,413). Subjects: 11 of the 122 were set by session cohorts, so 111 are a person's, and "closed" sits above 25 unconfirmed.
- *The stamps.* Course and CR both lack a run log yet render two ways; say "no run log" for both and keep "could not be read" for a file that fails to load. Row 1's two stamps are one event (13:18Z is the session writing the status file; the display build applied at 14:15Z).
- *Copy.* "X, never Y" appears six times; two asides to cut; "the completes differ in kind" is awkward.
- *The one change before Sam sees it:* the calls cell. It cites Sheet 96 card 1, which is deferred, and reads "None" on Program Requirements beside a real proceeded-on call (Sierra reads every complete record, #2230). Calls read from the sheet's store: build Sheet 96 with both cards first, or label the cell a sample.

**NEXT:** revise the mock-up on Fable's five points, build Open Asks Sheet 96 with both proceeded-on cards (the CER lane's rule-settlement save and the Sierra read) so the calls cell reads the store, then hand Sam the link; then step 1, the shared Progress module (no change on screen).
