---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-13
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

**The first view opens on one batch (Sam's Commons rulings relayed on #2921, 2026-11-08, *"yes to all"*; S604).** *Your next batch* leads the page: Another look's open cards in Exhibits, six at most (`next_batch` in `kb/status/commons.json`, from `kb/exhibits_sweep.json`), with what the answers teach and when to stop; *Start* opens `#exhibits/another-look`, so the cards and their saves stay in Exhibits. Under it one line counts what people did with the procedures' work (placed, checked, moved elsewhere; *the rest are unchecked, not proven*), its word opening the trust table. The pools and the trust table start folded. A reference whose headline pair is all done reads *Complete* (Subjects, 147 of 147); its repair jobs stay in its issues. Kept from the house rules where COBIx's mock departs: controls are underlined words, no arrows, live data only.

**The batch is capped (#2923, S604, COBIx's finding).** *Start* opens `#exhibits/another-look/batch`: the first six open cards, fixed for the visit, no bulk acceptance, a trail back to the Commons, and a stop screen after the last. Exhibits reconciles the nightly sweep with `kb_curation` saves written since it was built. **Exhibits queue-first (S611, #2933).** A Queue view leads the Exhibits views at `#exhibits/queue/<lens>`: six lenses in the ruled order, each a set of entry points into a list the tab already holds, counted from the set that list opens. A failed read or the classifier's errors show as Blocked on Sky. Review stays the default view; Park is named visit-only. **The panel's trail (S611, #2934):** the shared List's side panel opens on `CPL Commons / <List> / <filter> / <row>` (spec `trail` in `commons_list.js`), set on Exhibits, the CR Reference, Program Requirements and Subjects; the List's word, or the filter's when one is on, is the underlined return and keeps the filter and the row's place. **NEXT (#2921):** the CCR (below); Subjects' 93 stray codes stay with the curator. Sam's path still waits on his reaction to the mock.

**LIVE: the Docket, steps 1 to 3 (#2963, #2966, #2968, #2969, 2026-11-09).** Batches close in place and offer the next; a case in `kb/docket/cases.json` is ruled in place; `kb/_docket_process.py` carries rulings out nightly or from *Process my rulings now*. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**Malone's look on the first view and the *CPL Commons* menu label (Sheet 158 cards 2 and 3) the one queue (S573), and the S574 rulings (a count opens its job filtered; the queue in process order; TOP waits on no one; the Courses List first, SkyView beside it; the look on every Commons view)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S647 afternoon)*. Both stand.

**LIVE: the CPL Commons first view (S552, #2697).** `commons.js` draws the locked mock as the tab's first view. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**The opened page, one renderer (S556 to S559).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws the opened page for every reference. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**LIVE: a stalled routine becomes a queue item (S624).** `kb/status/commons.json` `queue.stalled`; the record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S639, 2026-11-11)*.

**DECIDED: every credential gets a Common SUBJ (SkyTamarind, S638, 2026-11-11, on Sam's in-session ask: *"add a check into that in our common plan and procedure so we can get those fill as automatically as possible"*).** Exhibits' List reads the subject as the Catalog does (M-ID and C-ID articulations, then a stored `subj_override`); its *No Common SUBJ* filter is where the Exhibit card's routine count opens. `kb/_exhibit_subject_fill.py`, a step in the nightly `cer-procedures.yml` (preview until a dispatch sets `subject_fill=on`), fills a blank from the credited courses (several colleges, then one, majority over half), else the issuer family (`kb/reference/issuer_family_subject.json`; ASE is automotive, Sam's MIL7 ruling), through the Common Subjects Reference; title words, TOP and CIP never decide; a family or cert link that disagrees with the courses holds the title. It writes `subj_override` and `subj_source` under `exhibit-subject-s638@bot`, insert-only, receipt first, `--undo` by cohort; a stored subject always wins. Governance DR-07 (the credential record's subject). The rest go to `kb/exhibit_subject_out/worklist.json` with a title-word suggestion for a later accept-all batch. Guards `tests/exhibit_subject_fill_test.py`, `tests/exhibits_list_subject.test.js`. First live run 21:41Z (run 43104720166): 747 filled, 362 left.

**BUILT: the ASE slice (S641, #3152, merged `ed886d36`; plan #3111 comment 6808952144; Sam's go, Sheet 181 card 10, "Go when built").** `commons_ase.js`, read-only, inside COBI: `#commons/ase` (52 ASE certifications by 120 colleges, 6,240 pairs, 18% with an answer) and `#commons/ase/<title>` (each college: *Lists credit*, *Likely match* or *No answer yet*, with sources). Titles resolve through `CPL_MAP_LINKS.nowTitle`. The page lists its gaps: Request CPL Review (no table holds the state; a new table goes through Rule 10 a3), CPL-AI coverage, the identity-signal list. Guard `tests/commons_ase.test.js`.

**LIVE: College Data Collection (the Commons data dashboard) at `#commons/data`, four views (S647, #3215; slice 1 #3222, slice 2 #3231 `3c161841`, the data #3232 `d87d21db`, slice 3 #3236 `1b630eeb`).** Sam's words for each slice: `docs/commons_lessons.md`, *Moved from the lane (S648)*. `commons_data.js` draws `kb/status/commons_data.json` (`kb/_build_commons_data_status.py`, rebuilt by the census workflow, fail-soft). The four views: the dashboard (figures that open their colleges, the overall bar's statewide tile opening the list lowest first, the API tile: 1 of 15 connected, 2 unverified and not counted); the list with a platform filter and the overall column, each college's row expanding, and its side panel (a dialog: everything outside it inert while open, released whenever the address leaves `#commons/data`) at `#commons/data[/<filter>]/college/<slug>`, carrying the overall bar's four parts and the live counts per college (Active, Teachout and Approved apart; records and passing; SLO, objective and PLO counts; the registry as held or not held), each labeled "live read, <date>"; the dictionary `#commons/data/dictionary` (the `dictionary` key, 19 datasets; #3220 landed as `docs/reference/data_dictionary.md`); the API checklist `#commons/data/apis`. Confidence comes from COBIx's receipts under `kb/spot_checks/`, with his two `confidence()` edge cases. Guard `tests/commons_data.test.js`.
**The live read (#3232).** Job `live-counts` in `harvest-gap-census.yml` (`kb/_commons_data_live.py`) runs in Sam's `live-counts` environment, on `main` only, read-only (no table, grant, function or migration), and writes the `live`, `overall`, `dictionary` and `apis` keys; the `census` job stays the one writer and one push. First run 43456843640, committed `6e4b4c0d` at 15:58Z: 118 colleges, none unmatched; Active 20,282, passing 14,525 (both equal to the 12:37Z headline); overall mean 0.6293. **DECIDED** `d-live-counts-controls-s647`: an error class only, never exception text; the key stripped, refused if it holds whitespace; no output may hold a 20-character run of the key's signature; floors (at least 90% of the crosswalk's colleges, Active within 85-125% of the last good block, 15,000 with none); dispatch input `accept_active_shift`, one logged override that never waives a floor; the guard refuses a query naming `checked_by` or `corrected_by`; person tables read by HEAD count only. **DECIDED** `d-student-boundary-wording-s647`: the dictionary's first privacy sentence was false; it now reads "Student records stay in MAP; COBI keeps counts." and names the boundary (pseudonymous rows pass through the runner and sit in reviewer-gated `map_student_credit` until the summarize-then-delete plan retires it; both ADRs).
**DECIDED** `d-commons-data-coming-next-s647`: a feature with no source is listed under one "Coming next" section with the source it waits on, never an empty panel: the College view (internal, no share link, never shared without Sam), AI workers, the JST funnel, SIS tiles, per-college PPM, descriptions, MIS and COE, planned datasets. **#3219** (Sam's COR-queue description step; his words: `docs/commons_lessons.md`, *Moved from the lane (S648)*) is still open: a COR-queue step, not a go; Sam approves the PR. **#3217** (the CVC chip) is parked until Sam lifts it: build and pull nothing from CVC.
**DECIDED (Sam, Nov 13 on #3229: his 5:56 AM PT renames, his 7:13 AM PT direction; built S648):** the title College Data Collection; *Collected* for Harvested; one *N of 118 Collected* card; no zero card; a definition under every card; confidence and completeness lead, each completeness figure with its confidence word; a person's review is never a headline; the asks read as team work.
**NEXT (the data dashboard):** (1) reconcile two figures before either is quoted outward: courses on Active programs, 88,736 in the live read against 89,192 in the checkpoint's harvest row, and courses with SLOs, 13,293 against 12,815 (likely course-code matching); (2) the Coming next items, each when its source exists (staff directions through a signed-in Sierra among them); the College view on Sam's word; (3) #3229's default list, lowest completeness first.

**The harvest's throughput (S644):** the gap census and the wave runner live in [program-requirements-harvest](program-requirements-harvest.md); the paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S647)*.

**NEXT:** (1) the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER, military. (2) From the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; the confidence count for the Course auditor, which needs a receipt of what the auditor scored before a person changed the card (none is committed today); the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List from a spec the tab hands it. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04).** Why (the inventory): `docs/commons_lessons.md`, *The CCR tab's inventory*. #2776 carried the common course's card and Rename, Set the discipline and Confirm into the List's panel. NEXT: the ways in (SkyView's three `#unified-courses/list` links, Quickstart's routing, Subjects' *Fix on CCR*, `excel_to_dashboard.py`'s script injection) and the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Suggested merges (about 7,300 written daily, none acted on since Sep 27): carry or retire, asked in chat 2026-11-04 (recommended: retire). Handoff: `docs/courses_retirement_handoff.md`.

**IN PROGRESS: M-ID re-clustering by outcomes, Step 1 (S642, issue #2962; #3165; revised #3182 `3189c403`).** Sam's go, the S643 re-rating (678 confirmed, 760 split, 71 merge candidates, 348 not enough text), the six cases and the two DECIDED lines: `docs/commons_lessons.md`, *Moved from the lane (S647)*. Report `kb/status/mid_outcomes_compare_2026-11-12.md`. **RULED (Sam, 13:16Z 2026-11-13, [Open Asks Sheet 186](https://claude.ai/artifact/XFkUDiDttRRAPmYaUxLCrt) card 6):** all six re-clustering cases as recommended. **DECIDED (Sam, 14:08Z 2026-11-13, [Sheet 191](https://claude.ai/artifact/NeR8fkQoj9GVd53NhT29b9) card 1, reply `two`; `sam-honors-own-mid-2026-11-13`):** an Honors course gets its own M-ID, with a declared equivalence to its base course. **NEXT:** (1) the next session carries out the seven (the six cases and the Honors split) under the lane's plan and the re-mint playbook (`docs/coursecontrolnumber_remint.md`); (2) price the model pass: a statewide read is outside the $40 limits, so the price goes to Sam first; (3) a potential-CPL column, from an aggregate the runner can read; (4) the Leadership outlines: Merced (for AGAB M1002) and Canyons inside the SLO $40, and a read-only committed export of the ACE Leadership and Supervision rows of `map_college_cr_unit`.

**The CCR, next (ruling 4).** The auditor's `seed_untouched_discipline` (14,523 cards capped at 0.79). Sam (Sheet 173): use descriptions, TOP alongside. `kb/_ccr_seed_recheck_dryrun.py` (88% held out, clear margin): of 12,504 cards, 1,964 confirmed by description and TOP, 1,823 for a curator; Kinesiology 627 and 8. **Applied** on Sam's rulings (Sheets 174, 175 and 180; S615, S621, S634): every confirmed card stamped `description_and_top`, each discipline's receipt under `kb/ccr_seed_confirm_out/` reversing alone with `--undo`; the cards where the two signals disagree stay in the *Discipline in doubt* job. The record: [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S644)*.

**The Courses List's filter words in two groups (S622, #2998) and its kept row (S623, #2995)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S642)*.

**LIVE: Discipline in doubt, a ruling that teaches the procedure (S614, 2026-11-09; #3025 adds a second discipline beside the home).** The Courses List's *Discipline in doubt* filter (`#coci-lookup/list/doubt`) carries the cards; a ruling with its reason marked for similar cards becomes a procedure. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**LIVE: the confidence count (S573; the CR rule rungs joined it S624, #3027).** `kb/status/commons.json`'s `confidence` says what a person did with each procedure's work afterward (kept, renamed, widened or moved); the tab shows it as *How far to trust the procedures*. The paragraph with its 2026-11-04 and 2026-11-10 counts: [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S644)*.

**RULED: every Commons view in Malone's look, and the path (Sam, S573, 2026-11-04, in chat).** *"Use the new UI format rather than first light on this and all commons views."* This widens Sheet 158 card 2 from the first view to every Commons view (the Lists, the Progress pages, the side panels); First Light stays the rule for the rest of COBI. The same morning he asked for a visual of the curator's steps and decision points, *"available on every commons surface"*, plain words, with *"a generic term"* for him. The mock is **the path** (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9, source in `CPLBrain/04-projects/cpl-initiative/commons-path-mock/`): six steps every reference shares (know what belongs, let the daily check run, work the list, get the lead's call, check the connections, clean), the CPL Commons view and the Common Subjects view. NEXT: his reaction, then the other references' paths, then the port (`commons_page.js` and `commons_list.js` onto the `--cmn` tokens, the path as a fold above each List).


**The Commons tab's first build (S417, 2026-10-18)**, its machine side, session side and the Course row's SkyView-alone ruling (since reversed: the Courses List first, S574), moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04, SkyJujube*).

**Steps 1 and 2 (S419 #2237, S423): the shared Progress module `commons_progress.js` and the five run logs under `kb/status/`.** The record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*).

**What the tab leaves for the build** (2026-10-18) moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04*): a count now opens its job's filtered list.

**Fable's advice, the Sheet 95 ruling and step 3's Progress views (2026-10-18 to 2026-10-25)** moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, SkyBeacon, 2026-11-06*).

Each reference's Progress view now draws the opened page; Course's landed last (S559, above).

**The figures agree across every Commons tab** (Sam, S490, 2026-10-26; done S560 and S561): the record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-09, SkyCigar*).
