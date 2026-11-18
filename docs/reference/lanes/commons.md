---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-18
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



**College Data Collection reaches the words (#3412 items 2 and 3, S669, #3422; `d-3412-built-s669`):** in the SLO panel a subject opens to its courses and a course to its SLO and objective text (public `course_outcomes`, read once a college, 500 a page); a Program learning outcomes section reuses the committed PLO list. **NEXT:** verify on the deployed tab that a college's `course_outcomes` rows carry the same college name (a twin spelling would show the empty sentence).

**The first view opens on one batch, and the batch is capped (S604, #2921, #2923; Exhibits queue-first, S611, #2933; the panel's trail, #2934):** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S648 checkpoint)*. All stand. **NEXT (#2921):** the CCR (below); Subjects' 93 stray codes stay with the curator. Sam's path still waits on his reaction to the mock.

**LIVE: the Docket, steps 1 to 3 (#2963, #2966, #2968, #2969, 2026-11-09).** Batches close in place and offer the next; a case in `kb/docket/cases.json` is ruled in place; `kb/_docket_process.py` carries rulings out nightly or from *Process my rulings now*. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**Malone's look on the first view and the *CPL Commons* menu label (Sheet 158 cards 2 and 3) the one queue (S573), and the S574 rulings (a count opens its job filtered; the queue in process order; TOP waits on no one; the Courses List first, SkyView beside it; the look on every Commons view)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S647 afternoon)*. Both stand.

**LIVE: the first view (S552, #2697) and the opened page's one renderer (S556 to S559, `commons_page.js`):** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S651 checkpoint)*.

**LIVE: a stalled routine becomes a queue item (S624).** `kb/status/commons.json` `queue.stalled`; the record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S639, 2026-11-11)*.

**DECIDED: every credential gets a Common SUBJ (SkyTamarind, S638)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S648 checkpoint)*; it stands (`kb/_exhibit_subject_fill.py`, nightly in `cer-procedures.yml`, cohort `exhibit-subject-s638@bot`, a stored subject always wins).

**BUILT: the ASE slice (S641, #3152):** `commons_ase.js`, read-only, at `#commons/ase` and `#commons/ase/<title>`; the paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*. Guard `tests/commons_ase.test.js`.

**LIVE: College Data Collection at `#commons/data` (S647, #3215) and its live read (#3232, job `live-counts`):** the two paragraphs as they stood: lessons, *Moved from the lane (S662 checkpoint)*. Guard `tests/commons_data.test.js`.
**DECIDED** `d-commons-data-coming-next-s647` (a feature with no source sits under Coming next; #3219 open, Sam approves the PR; #3217 parked until Sam lifts it, build and pull nothing from CVC): lessons, *Moved from the lane (S662 checkpoint)*.
**DECIDED** `d-data-collection-two-bases-s648` (every card names its base: the captures count Active, Teachout and Approved, passing and completeness count Active) and `d-course-key-normalized-s648` (a course is one college and code key, uppercased, spaces and hyphens removed; an SLO matches on it). The paragraphs as they stood: lessons, *Moved from the lane (S650 checkpoint)*.
**DECIDED** `d-data-collection-links-open-in-panel-s649`: on Sam's ask 2, every link opens in the side panel at an address of its own, with *Open in a new tab* the panel's one link out; this reverses #3257's new-tab links.
**LIVE: three cards on a college's panel (#3316, S654) and the non-modal side panel (S653, #3310):** the two paragraphs: lessons, *Moved from the lane (S662 checkpoint)*.
**The CDC's four PRs and its classes (S653, S654):** **DECIDED** `d-cdc-four-prs-and-classes-s653`, `d-cdc-held-means-not-shared-s654` and `d-cdc-restricted-class-s654` all stand (held means left out of an outside share; the restricted class the site never serves). The paragraph: lessons, *Moved from the lane (S661 checkpoint)*.
**DECIDED** `d-data-collection-one-base-per-card-s649`, the wording and order, and catalog links: the paragraphs: lessons, *Moved from the lane (S662 checkpoint)*.
**The strategic plan (S651):** **DECIDED** `d-strategic-plan-generated-in-commons-builder-s651`, not built. The paragraph: lessons, *Moved from the lane (S653 checkpoint)*.

**LIVE (S661, #3375): the Commons Curation ETA tops the CPL Commons tab** (`commons_curation_eta.js`; pace is the net fall of remaining work; **DECIDED** `d-curation-eta-net-pace-s661`, `d-exhibit-universe-includes-map-backlog-s662`; guard `tests/commons_curation_eta.test.js`). **LIVE (S662): the ETA cost feed** reads `kb/reference/model_spend_daily.json` (Sam's billing paste, by hand) and `kb/status/session_spend.json`, built at deploy from each handoff's `Spend:` line (**DECIDED** `d-eta-cost-feed-two-files-s662`; COBIx's two leftovers done in #3381). The runner and session parts are measured since #3465 (below). Both paragraphs as they stood: lessons, *Moved from the lane (S666 checkpoint)*.

**Plain words in a Commons decision (S666).** **#3398 (draft):** Sam's Sheet 195 card 4 CVMA answer is written to `kb/status/exhibit.json` (the fix was already carried out), and a Commons decision batch now reads *We went with this: <default>. It stands unless you change it.* with a *Change it* link, the ask test's shape (`d-person-saved-never-returns-s666` and the [governance lane](governance-team-enablement.md)). **#3400 (draft):** `tests/plain_words_for_sam_test.py` (lints job) refuses COBIx's insider terms in open calls and Commons strings unless the sentence defines them; the Commons *receipt* lines are reworded. **NEXT:** gate and merge both on a green `test`; one writer of `kb/status/exhibit.json` is #3398.

**DONE (S660): the restricted tables are measured** (`kb/reference/restricted_table_access.json`; guard `tests/cdc_sharing_build_test.py`); **FINDING** `cdc-restricted-tables-read-by-team-phrase-s660` is the org-and-phrase lane's call. The paragraph: lessons, *Moved from the lane (S662 checkpoint)*. **NEXT (the data dashboard), in order:** (2) MIS course matches and COE regional demand, each after a definition of the per-college figure. (3) Copper Mountain's registry `catalog_url` at its next capture. (4) The Coming next items as their sources exist; the College view on Sam's word.

**LIVE (S661, #3371 to #3373): the College Collections ETA** on College Data Collection (`commons_eta_clock.js`; **DECIDED** `d-eta-clock-reads-files-s661`; **RULED** `d-eta-date-controls-are-chips-sam-s661`); every college row opens CPL Pathways framed (`cobi_framed.js`). Guard `tests/commons_eta_clock.test.js`. The paragraph: lessons, *Moved from the lane (S662 checkpoint)*.

**LIVE: College Data Collection's cost and counts (S678, #3465):** `kb/_build_spend_daily.py` adds the measured `runner` and `sessions` parts to `kb/reference/model_spend_daily.json`; billing stays hand-pasted; cost per CRE in `kb/reference/cre_weights.json`. The paragraph as it stood: [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S680 checkpoint)*.

**DONE: the Commons Clarity units findings (S678, #3470):** the paragraph as it stood: [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S680 checkpoint)*.

**S680 (the CPL Queue routine's conductor night, 2026-11-18).** (1) **Discontinued programs** (#3491, `main` e50a87fb): 9 discontinued programs are flagged out of the gap census (Butte 2, Gavilan 2, Rio Hondo 1, Riverside City 2, Santa Ana 2), no data write. (2) **A named gap is a collected record (Sam, relayed by COBIx in paraphrase):** never drop a record for failing; collect it with its gaps noted and a confidence score, and report records collected and confidence gained, never "newly passing". #3497 stores 75 `no_units_read` gaps as `checks.gaps` and `checks.confidence` (pre-read run 44266799069 clean; applied, 75 rows returned (run 44273638344)); the units rules (#3496, 56 records) move 49 active programs from failing to passing on the Commons count. (3) **RULE: a PR that changes what the Commons data reads rebuilds `commons_data.json`** in the same PR. `scripts/check_generated.sh` does not run that check and CI's `lints` does, so three S680 PRs went red; **NEXT** (a plain session): add the check to `check_generated.sh`. (4) **The Spend line (#3503):** the `sessions` key of `kb/reference/model_spend_daily.json` is rebuilt at each checkpoint (`python3 kb/_build_spend_daily.py --sessions-only`, checked by `check_generated.sh`), and a handoff's line may tag its dollars `collection`, `curation` and `infrastructure` after the models: `Spend: $123.45 (Opus 5.5 $123.45); collection $100.00, curation $20.00, infrastructure $3.45; 2026-11-15T17:06Z to 2026-11-15T23:19Z.` **NEXT:** the retired-course drops (Sam, relayed by COBIx: *"Yes, drop all retired courses"*); the Exhibits items in [cer-procedures](cer-procedures.md) (#3482, then #3472, in a plain session); Sam's billing paste after Nov 15.



**NEXT:** (1) the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER, military. (2) From the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; the confidence count for the Course auditor, which needs a receipt of what the auditor scored before a person changed the card (none is committed today); the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List from a spec the tab hands it. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04).** Why (the inventory): `docs/commons_lessons.md`, *The CCR tab's inventory*. #2776 carried the common course's card and Rename, Set the discipline and Confirm into the List's panel. NEXT: the ways in (SkyView's three `#unified-courses/list` links, Quickstart's routing, Subjects' *Fix on CCR*, `excel_to_dashboard.py`'s script injection) and the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Suggested merges, carry or retire: lessons, *Moved from the lane (S649 final refresh)*. Handoff: `docs/courses_retirement_handoff.md`.

**M-ID re-clustering by outcomes, Step 1 (S642, #2962): the six cases are settled, nothing waits to apply (`d-six-cases-settled-s667`)**; the paragraph moved verbatim to [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S678 checkpoint)*. Open: `d-huma-m10oi-into-m1110-s652` (NEXT (1) below).

**The identities map (applied and dropped, S652) and Honors steps 1 and 2 (applied S653 and S666; the field, #3313 and #3325)** moved verbatim to [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S678 checkpoint)*. All stand; the undo order is there (Honors rows by cohort `honors-rows-s653@bot`, then step 1, then the S652 follow-ups).

**NEXT:** (1) Reader's minors after the apply: `kb/coci_curation.json` grows by 341 `honors_of`-only entries at the next daily run; `unified_courses.js` `fetchHonorsOf` stops after six hops. Then *Before the mints* (base plus H on the CCN pattern); HUMA M10OI into M1110; `kb/coci_minted_courses.json` still lists LIBR M10CJ under LIBR M1040. (2) FIRE 130 X's row-audit card. (3) Price the model pass (to Sam first). (4) A potential-CPL column. (5) The Leadership outlines. (6) The #3298 and #3302 follow-ups: lessons, *Moved from the lane (S653 checkpoint)*.

**OPEN: Courses, rulings stick and three rules clear the waiting pile (S678, #3467 draft, item 3; #3454, #3447).** `kb/_ccr_confidence_score.py` is a rebuild (the bot's v5 scripts are not in the repo); `--expect 3737` measured 3,268. HELD by the second reader: (1) the merge dialog's mint stamped `validated_at` (Verified) on a UC-CUR synthetic target, against Sam's 2026-06-10 rule; (2) self-recall: rules D and W fire on 0 and 1 of the 134 decided cards yet move 116 and 393 live, and the FPR precedent came from the same cards. The worker fixed both (W and D off by default, FPR leave-one-out, no Verified stamp; Keep always writes its discipline row), and the second reader now says merge (head 0b91f6985). **NEXT:** merge on green `test`.

**The CCR, next (ruling 4):** the seed re-check by descriptions and TOP is applied on Sam's rulings (Sheets 174, 175, 180); each discipline's receipt under `kb/ccr_seed_confirm_out/` reverses alone with `--undo`. The paragraph as it stood: lessons, *Moved from the lane (S652 final refresh)*.

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
