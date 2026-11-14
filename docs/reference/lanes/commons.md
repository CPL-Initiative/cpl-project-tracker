---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-14
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



**The first view opens on one batch, and the batch is capped (S604, #2921, #2923; Exhibits queue-first, S611, #2933; the panel's trail, #2934):** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S648 checkpoint)*. All stand. **NEXT (#2921):** the CCR (below); Subjects' 93 stray codes stay with the curator. Sam's path still waits on his reaction to the mock.

**LIVE: the Docket, steps 1 to 3 (#2963, #2966, #2968, #2969, 2026-11-09).** Batches close in place and offer the next; a case in `kb/docket/cases.json` is ruled in place; `kb/_docket_process.py` carries rulings out nightly or from *Process my rulings now*. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**Malone's look on the first view and the *CPL Commons* menu label (Sheet 158 cards 2 and 3) the one queue (S573), and the S574 rulings (a count opens its job filtered; the queue in process order; TOP waits on no one; the Courses List first, SkyView beside it; the look on every Commons view)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S647 afternoon)*. Both stand.

**LIVE: the CPL Commons first view (S552, #2697).** `commons.js` draws the locked mock as the tab's first view. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**The opened page, one renderer (S556 to S559).** `commons_page.js` (`window.CPL_COMMONS_PAGE.render(spec)`) draws the opened page for every reference. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**LIVE: a stalled routine becomes a queue item (S624).** `kb/status/commons.json` `queue.stalled`; the record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S639, 2026-11-11)*.

**DECIDED: every credential gets a Common SUBJ (SkyTamarind, S638)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S648 checkpoint)*; it stands (`kb/_exhibit_subject_fill.py`, nightly in `cer-procedures.yml`, cohort `exhibit-subject-s638@bot`, a stored subject always wins).

**BUILT: the ASE slice (S641, #3152):** `commons_ase.js`, read-only, at `#commons/ase` and `#commons/ase/<title>`; the paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*. Guard `tests/commons_ase.test.js`.

**LIVE: College Data Collection (the Commons data dashboard) at `#commons/data`, four views (S647, #3215; slices #3222, #3231, #3232, #3236):** the dashboard, the list with each college's side panel at `#commons/data[/<filter>]/college/<slug>`, the dictionary and the API checklist, drawn by `commons_data.js` from `kb/status/commons_data.json` (`kb/_build_commons_data_status.py`, rebuilt by the census workflow). The paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 final refresh)*. Guard `tests/commons_data.test.js`.
**The live read (#3232).** Job `live-counts` in `harvest-gap-census.yml` (`kb/_commons_data_live.py`), read-only, on `main` in Sam's `live-counts` environment, writes the `live`, `overall`, `dictionary` and `apis` keys; the `census` job stays the one writer. Its controls (**DECIDED** `d-live-counts-controls-s647`) and the privacy sentence (**DECIDED** `d-student-boundary-wording-s647`): `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*.
**DECIDED** `d-commons-data-coming-next-s647`: a feature with no source is listed under one "Coming next" section with the source it waits on, never an empty panel: the College view (internal, no share link, never shared without Sam), AI workers, the JST funnel, SIS tiles, per-college PPM, descriptions, MIS and COE, planned datasets. **#3219** (Sam's COR-queue description step; his words: `docs/commons_lessons.md`, *Moved from the lane (S648)*) is still open: a COR-queue step, not a go; Sam approves the PR. **#3217** (the CVC chip) is parked until Sam lifts it: build and pull nothing from CVC.
**DECIDED (Sam, Nov 13 on #3229: his 5:56 AM PT renames, his 7:13 AM PT direction; built S648, #3243 `ac7c6595`, #3247 `7cd72253`; `sam-upfocus-confidence-completeness-2026-11-13`, `sam-college-collection-not-in-cobi-2026-11-13`):** the title College Data Collection; *Collected* for Harvested; one *N of 118 Collected* card; no zero card; a definition under every card; confidence and completeness lead, each completeness figure with its confidence word; a person's review is never a headline; the asks read as team work; the list opens lowest completeness first, the order in words, a person's sort for the visit only.
**DECIDED (`d-data-collection-two-bases-s648`):** every College Data Collection card names its base; the captures count Active, Teachout and Approved (22,335 = 20,282 + 630 + 1,423), passing and completeness count Active. Sam's 9:18 AM PT note (*"college collection changes don't seem to have hit cobi yet"*, relayed by COBIx) came before #3243 merged at 17:55Z.
**DECIDED (`d-course-key-normalized-s648`):** a course is one college and code key (uppercased, spaces and hyphens removed), and an SLO matches on that key, in the harvest row and the data dashboard alike. Read live 17:33Z 2026-11-13: the raw code gave 89,192 courses and 12,815 with SLOs, the key 88,736 and 13,293.
**S648 (#3229; #3257 `f2883f87`):** figures no longer break one digit a line; cards in columns; *Colleges by district* (`#commons/data/districts`, a district at `district/<slug>`). The list is a table when its box is 760px or wider. Guards `tests/commons_data_controls.test.js`; `scripts/commons_data_values_check.js` by hand.
**S649 (#3261 `58d46cc4`): each cause opens its programs, and Sam's asks 1 to 5** (`sam-data-collection-six-asks-2026-11-13`): full width, an *SLOs and objectives* column, links open in the side panel, CPL Pathways per college, `#commons/data/slos`, each cause opens its programs from the live gap census. The paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 final refresh)*. Guards `tests/commons_data_status_build_test.py`, `tests/commons_data_controls.test.js`.
**DECIDED** `d-data-collection-links-open-in-panel-s649`: on Sam's ask 2, every link opens in the side panel at an address of its own, with *Open in a new tab* the panel's one link out; this reverses #3257's new-tab links.
**DECIDED** `d-data-collection-one-base-per-card-s649` (follows `d-data-collection-two-bases-s648`): where the live census holds a college, the card's Passing now and Still to pass, the list's columns and the statewide card read it (5,751 still to pass), so the causes sum to the figure; the capture's own figures keep the label *the capture*.
**Catalog links (COBIx's correction on #3229, 23:35Z 2026-11-13):** only Copper Mountain's link is broken. The displayed link (https://www.cmccd.edu/academic-catalogs/) splits from the capture root (the PDF); a 500 from Pingora with an empty body reads "unreachable from here". The default sort is built. No session has yet seen the page as #3261 left it on the deployed site (verified in tests, a local browser review and committed data only).
**NEXT (the data dashboard), in order:** (1) the Copper Mountain link split; (2) MIS course matches; (3) COE regional demand (COBIx's items 2 and 3); (4) `#commons/data` joins `a11y.config.js`; (5) the page builder takes its no-objectives list from `OBJECTIVES_BY_SYSTEM` (#3263, on `main`), the one source; (6) the Coming next items, each when its source exists (staff directions through a signed-in Sierra among them, Sam's 7:13 AM PT words); the College view on Sam's word.

**The harvest's throughput (S644):** the gap census and the wave runner live in [program-requirements-harvest](program-requirements-harvest.md); the paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S647)*.

**NEXT:** (1) the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER, military. (2) From the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; the confidence count for the Course auditor, which needs a receipt of what the auditor scored before a person changed the card (none is committed today); the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List from a spec the tab hands it. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04).** Why (the inventory): `docs/commons_lessons.md`, *The CCR tab's inventory*. #2776 carried the common course's card and Rename, Set the discipline and Confirm into the List's panel. NEXT: the ways in (SkyView's three `#unified-courses/list` links, Quickstart's routing, Subjects' *Fix on CCR*, `excel_to_dashboard.py`'s script injection) and the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Suggested merges, carry or retire: lessons, *Moved from the lane (S649 final refresh)*. Handoff: `docs/courses_retirement_handoff.md`.

**IN PROGRESS: M-ID re-clustering by outcomes, Step 1 (S642, issue #2962; #3165; revised #3182; case 2, #3245 `c09ef2b3`; the BUSI split, #3274 `a7af46ee`).** The paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)* and *(S649 final refresh)*. Report `kb/status/mid_outcomes_compare_2026-11-12.md`; plans `kb/reclustering_s648_out/2026-11-13/`, `kb/reclustering_s649_out/2026-11-14/`. **RULED (Sam, Sheet 186 card 6):** all six cases as recommended. **DECIDED (Sam, Sheet 191 card 1; `sam-honors-own-mid-2026-11-13`):** an Honors course gets its own M-ID, with a declared equivalence to its base. **APPLIED (S648):** case 2, FIRE M1274 merge_into FIRE 130 X (run 43493272194; undo `kb/migrations/2026-11-13_s648_reclustering_cohort_rollback.sql`). **RULED (Sam, Open Asks Sheet 195, Complete pressed 01:18Z 2026-11-14, his own call; `sam-sheet-195-answers-2026-11-14`):** card 3 *"Remove the row"*; card 2 *"Take every recommendation"*: Honors reaches M-IDs only; AJ 160, MUS 130 and REAL M1038 with M1040 stay as they are (kept, no write); MATH M1044 into M1036 waits until the MAP team settles the refrigeration lab articulation. **APPLIED and merged, card 3 (DECIDED `d-busi-split-delete-only-s649`, `d-busi-split-delete-applied-s649`):** one guarded DELETE of the bot row BUSI M10XW merge_into BUSI M1228 (`automerge-titlelane-v1@bot`, 2026-06-13T17:47:56.243497+00), `kb/migrations/2026-11-14_s649_busi_split_delete.sql`, `supabase-migrate.yml` run 43542044321; the receipt `kb/receipts/migration_s649_busi_split_delete_43542044321.json` holds the row whole and the rollback file re-inserts it; nothing inserted. The conductor's live reads: before, the row present and unvalidated, no person's row naming either id, no pointer into BUSI M10XW; after, 0 rows. The daily run `bb25d373` (02:40Z) moved BUSI M10XW to `unified_courses_standalone.js`; BUSI M1228 lost one member. **Card 2's Honors step is stopped, nothing written (DECIDED `d-honors-mint-stopped-s649`, `d-honors-mids-stopped-for-design-s649`).** NEEDS SAM (a), *Needs your word*, a card on the next sheet: HUMA M1110's and LIBR M1040's Honors courses already have their own records, HUMA M10ME and LIBR M10CJ, which `automerge-v1@bot` folded in on 2026-06-12; separating them deletes those two bot rows, which his answer did not cover. NEEDS SAM (b), the Honors design choices, a card on the next sheet: (i) the numbering of a new Honors M-ID (its base's number plus H, or the next free number in its bucket); (ii) a one-way or two-way equivalence; (iii) the `honors_of` field, which `kb/_apply_curation.py` does not fold yet; (iv) equivalence rows for the 508 pairs already apart; (v) who is asked about MATH M1044 (San Diego City College's credit-by-exam exhibit MAPCBES-CBES-1-001, *Basic Refrigeration & AC Lab*), which waits on the MAP team. IDST M1120's two Glendale courses take a true mint once (i) to (iii) are settled. **DONE (S649 side session, #3272):** the identities map's rebuild is a builder with a reviewed dry-run plan (fill 651, refresh 578, held 625); FIRE 130 X's lists take FIRE M1274's on the apply, which has not run. **NEXT:** (1) the Honors design and its two sheet cards (above); (2) FIRE 130 X's row-audit card, still unchecked (on `main`: 51 members, units 3-4, eligible credits 1,022.4, students 58, FIRE M1274 gone); (3) the identities apply, after Sam's word on the 625 held entries and the side session's refused commit (its ask goes on the next sheet); (4) price the model pass: a statewide read is outside the $40 limits, so the price goes to Sam first; (5) a potential-CPL column, from an aggregate the runner can read; (6) the Leadership outlines: Merced (for AGAB M1002) and Canyons inside the SLO $40, and a read-only committed export of the ACE Leadership and Supervision rows of `map_college_cr_unit`.

**The CCR, next (ruling 4).** The auditor's `seed_untouched_discipline` (14,523 cards capped at 0.79). Sam (Sheet 173): use descriptions, TOP alongside. `kb/_ccr_seed_recheck_dryrun.py` (88% held out, clear margin): of 12,504 cards, 1,964 confirmed by description and TOP, 1,823 for a curator; Kinesiology 627 and 8. **Applied** on Sam's rulings (Sheets 174, 175 and 180; S615, S621, S634): every confirmed card stamped `description_and_top`, each discipline's receipt under `kb/ccr_seed_confirm_out/` reversing alone with `--undo`; the cards where the two signals disagree stay in the *Discipline in doubt* job. The record: [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S644)*.

**The Courses List's filter words in two groups (S622, #2998) and its kept row (S623, #2995)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S642)*.

**LIVE: Discipline in doubt, a ruling that teaches the procedure (S614, 2026-11-09; #3025 adds a second discipline beside the home).** The Courses List's *Discipline in doubt* filter (`#coci-lookup/list/doubt`) carries the cards; a ruling with its reason marked for similar cards becomes a procedure. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**LIVE: the confidence count (S573; the CR rule rungs joined it S624, #3027).** `kb/status/commons.json`'s `confidence` says what a person did with each procedure's work afterward (kept, renamed, widened or moved); the tab shows it as *How far to trust the procedures*. The paragraph with its 2026-11-04 and 2026-11-10 counts: [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S644)*.

**RULED: every Commons view in Malone's look, and the path (Sam, S573, 2026-11-04):** *"Use the new UI format rather than first light on this and all commons views."* The mock is the path (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9); the paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*. NEXT: his reaction, then the other references' paths, then the port onto the `--cmn` tokens.


**The Commons tab's first build (S417, 2026-10-18)**, its machine side, session side and the Course row's SkyView-alone ruling (since reversed: the Courses List first, S574), moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04, SkyJujube*).

**Steps 1 and 2 (S419 #2237, S423): the shared Progress module `commons_progress.js` and the five run logs under `kb/status/`.** The record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-02*).

**What the tab leaves for the build** (2026-10-18) moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-04*): a count now opens its job's filtered list.

**Fable's advice, the Sheet 95 ruling and step 3's Progress views (2026-10-18 to 2026-10-25)** moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, SkyBeacon, 2026-11-06*).

Each reference's Progress view now draws the opened page; Course's landed last (S559, above).

**The figures agree across every Commons tab** (Sam, S490, 2026-10-26; done S560 and S561): the record moved verbatim to `docs/commons_lessons.md` (*Moved from the lane, 2026-11-09, SkyCigar*).
