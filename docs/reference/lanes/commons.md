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

**LIVE: the first view (S552, #2697) and the opened page's one renderer (S556 to S559, `commons_page.js`):** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S651 checkpoint)*.

**LIVE: a stalled routine becomes a queue item (S624).** `kb/status/commons.json` `queue.stalled`; the record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S639, 2026-11-11)*.

**DECIDED: every credential gets a Common SUBJ (SkyTamarind, S638)** moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S648 checkpoint)*; it stands (`kb/_exhibit_subject_fill.py`, nightly in `cer-procedures.yml`, cohort `exhibit-subject-s638@bot`, a stored subject always wins).

**BUILT: the ASE slice (S641, #3152):** `commons_ase.js`, read-only, at `#commons/ase` and `#commons/ase/<title>`; the paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*. Guard `tests/commons_ase.test.js`.

**LIVE: College Data Collection (the Commons data dashboard) at `#commons/data`, four views (S647, #3215; slices #3222, #3231, #3232, #3236):** the dashboard, the list with each college's side panel at `#commons/data[/<filter>]/college/<slug>`, the dictionary and the API checklist, drawn by `commons_data.js` from `kb/status/commons_data.json` (`kb/_build_commons_data_status.py`, rebuilt by the census workflow). The paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S649 final refresh)*. Guard `tests/commons_data.test.js`.
**The live read (#3232).** Job `live-counts` in `harvest-gap-census.yml` (`kb/_commons_data_live.py`), read-only, on `main` in Sam's `live-counts` environment, writes the `live`, `overall`, `dictionary` and `apis` keys; the `census` job stays the one writer. Its controls (**DECIDED** `d-live-counts-controls-s647`) and the privacy sentence (**DECIDED** `d-student-boundary-wording-s647`): `docs/commons_lessons.md`, *Moved from the lane (S649 checkpoint)*.
**DECIDED** `d-commons-data-coming-next-s647`: a feature with no source is listed under one "Coming next" section with the source it waits on, never an empty panel: the College view (internal, no share link, never shared without Sam), AI workers, the JST funnel, SIS tiles, per-college PPM, descriptions, MIS and COE, planned datasets. **#3219** (Sam's COR-queue description step; his words: `docs/commons_lessons.md`, *Moved from the lane (S648)*) is still open: a COR-queue step, not a go; Sam approves the PR. **#3217** (the CVC chip) is parked until Sam lifts it: build and pull nothing from CVC.
**DECIDED (Sam, Nov 13 on #3229; `sam-upfocus-confidence-completeness-2026-11-13`, `sam-college-collection-not-in-cobi-2026-11-13`):** the College Data Collection wording and order; the paragraph as it stood: lessons, *Moved from the lane (S652 final refresh)*.
**DECIDED** `d-data-collection-two-bases-s648` (every card names its base: the captures count Active, Teachout and Approved, passing and completeness count Active) and `d-course-key-normalized-s648` (a course is one college and code key, uppercased, spaces and hyphens removed; an SLO matches on it). The paragraphs as they stood: lessons, *Moved from the lane (S650 checkpoint)*.
**S648 (#3257) and S649 (#3261):** the layout fixes, *Colleges by district*, and Sam's asks 1 to 5 (each cause opens its programs). The paragraphs as they stood: `docs/commons_lessons.md`, *Moved from the lane (S650 checkpoint)*. Guards `tests/commons_data_controls.test.js`, `tests/commons_data_status_build_test.py`.
**DECIDED** `d-data-collection-links-open-in-panel-s649`: on Sam's ask 2, every link opens in the side panel at an address of its own, with *Open in a new tab* the panel's one link out; this reverses #3257's new-tab links.
**DECIDED (S653, #3310 item 2 and item 5's college line):** three cards on a college's panel, drawn by `commons_data_cards.js` through one hook in `commons_data.js` (`CARD_MODULES`; a further card module is one row there): *How it's collected* (each lane's reader, workflow and run, last run, cost), *Program pathway maps* (the registry's live check beside the committed Program Pathways Mapper member list, `kb/supabase_program_source_ppm_hosts_s444.sql`, and the committed maps), *Data sources* (SIS, curriculum system, catalog platform, program maps, COCI: read directly, through an export, or not yet). The facts are the builder's `collection` keys (`collection_facts`). The SIS reads not known everywhere: no committed file names one, and none is inferred. The integration line reads none known for every college until `SIS_CMS_INTEGRATION` records one the MAP team confirms. The Pathway source line left the Catalog source card, and the PPM dataset row left the panel. Guards `tests/commons_data_cards.test.js`, `tests/commons_data_status_build_test.py` (16).
**DECIDED (S653, #3310 items 1 and 3):** the list opens highest overall completeness first (Sam: "show progress first"), never stored; the side panel is a non-modal dialog, so the page beside it stays live: a college word replaces the panel's college, a heading sorts, a figure applies its filter. The aria-modal panel set `inert` on the page (COBIx on #3231), which is why a click there did nothing. Guards `tests/commons_data.test.js` (*live 1* to *9*) and the `commons-data-panel` keyboard pass in `a11y.config.js`.
**DECIDED** `d-cdc-four-prs-and-classes-s653` (#3310, COBIx; Sam: *"ping him when you've reviewed them and let him know how you decide to move forward"*): #3310 ships in four PRs: the sort and panel (#3314 `99b64239`, merged), three college cards (#3316, ready, head `c60761f9`; How it's collected, Program pathway maps, Data sources; of 118 colleges, SIS not known 118, curriculum system not known 99, program maps 65 held, 48 none found, 5 not known), the data dictionary (#3323, after #3316; `kb/cdc_data_dictionary.json`, 52 fields: 40 public, 1 aggregate, 1 needs an agreement, 10 held; view `#commons/data/sharing`) and the integrations view (#3326, after #3323; `kb/cdc_integrations.json`, 9: 4 live, 4 proposed, 1 not started; view `#commons/data/integrations`). Classes: staff role contacts held and left out of any outside share; MAP articulation Status held; MAP student counts aggregate under the student-detail ADR. No MAP ingest path brings initiator or approver ids. The PPM member list holds 60 rows where the S444 header says 63 were pasted (`ppm-list-60-not-63-s653`); which three were never filed is not recorded.
**#3322** (merged `dc76b1bf`): the builder reads `cost_usd_filed` (fallback `cost_usd`); Glendale moves the statewide cost 1,327.28 to 1,343.32, passed at read 15,151 to 15,332, receipts 117 to 118.
**DECIDED** `d-data-collection-one-base-per-card-s649` (follows `d-data-collection-two-bases-s648`): where the live census holds a college, the card's Passing now and Still to pass, the list's columns and the statewide card read it (5,751 still to pass), so the causes sum to the figure; the capture's own figures keep the label *the capture*.
**Catalog links (S650):** only Copper Mountain's link is broken; `CATALOG_LINKS` splits `catalog_url`, `capture_root` and `catalog_now`. The paragraph: lessons, *Moved from the lane (S653 checkpoint)*.
**The strategic plan (S651):** **DECIDED** `d-strategic-plan-generated-in-commons-builder-s651`, not built. The paragraph: lessons, *Moved from the lane (S653 checkpoint)*.

**NEXT (the data dashboard), in order:** (1) #3316, then #3323, then #3326, reading COBIx on #3316 (18:26Z) first. (2) MIS course matches and COE regional demand, each after a definition of the per-college figure. (3) Copper Mountain's registry `catalog_url` at its next capture. (4) Which three Pathways Mapper members were never filed; the COMIS awards request (not found in the repo or the vault); Pedro's curriculum-system connections. (5) The Coming next items as their sources exist; the College view on Sam's word.

**The harvest's throughput (S644):** the gap census and the wave runner live in [program-requirements-harvest](program-requirements-harvest.md); the paragraph as it stood: `docs/commons_lessons.md`, *Moved from the lane (S647)*.

**NEXT:** (1) the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER, military. (2) From the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; the confidence count for the Course auditor, which needs a receipt of what the auditor scored before a person changed the card (none is committed today); the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List from a spec the tab hands it. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04).** Why (the inventory): `docs/commons_lessons.md`, *The CCR tab's inventory*. #2776 carried the common course's card and Rename, Set the discipline and Confirm into the List's panel. NEXT: the ways in (SkyView's three `#unified-courses/list` links, Quickstart's routing, Subjects' *Fix on CCR*, `excel_to_dashboard.py`'s script injection) and the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Suggested merges, carry or retire: lessons, *Moved from the lane (S649 final refresh)*. Handoff: `docs/courses_retirement_handoff.md`.

**IN PROGRESS: M-ID re-clustering by outcomes, Step 1 (S642, issue #2962; reports and plans under `kb/reclustering_s6*_out/`).** **RULED (Sam):** Sheet 186 card 6 (all six cases as recommended); Sheet 191 card 1 (`sam-honors-own-mid-2026-11-13`: an Honors course gets its own M-ID with a declared equivalence to its base); Open Asks Sheet 195 (`sam-sheet-195-answers-2026-11-14`); Sheet 197 card 2 *"delete"* (applied, #3304) and card 3 (*"Base number plus H (MATH M1036H)"*, *"Two-way: either satisfies the other"*, *"Build the field first, then the rows"*, *"Rows for all 508 pairs"*); in session, *"CCN structures should be our gold standard"* (`sam-ccn-structures-gold-standard-2026-11-14`). **DECIDED** `d-math-m1044-stays-no-one-asked-s652`, `d-huma-m10oi-into-m1110-s652` (not done). The paragraph with every receipt and undo through S652: lessons, *Moved from the lane (S653 checkpoint)*.

**The identities map, APPLIED and DROPPED (S652; `sam-identities-apply-and-drop-2026-11-14`):** 2,316 entries; undo in order by `python3 kb/_identities_rebuild.py --undo` (the drop receipt, then 14b). The paragraph: lessons, *Moved from the lane (S653 checkpoint)*.

**Honors, the field (#3313 `1ef02a84`, S653):** `kb/honors_of.py` (the fold guard, a trial check over every pair), `kb/curation_pointers.py` re-keys `merge_into` and `honors_of`, and the Allocator refuses an H id. Three review rounds; the design was replaced once (a `would_join` point check became the trial check). **#3325** (ready, head `3512698f`): the hold covers every base of a list value, the CCR worklist fails closed, the daily Summary counts joined pairs; COBIx's comment of 18:34Z is unread. **DECIDED** `d-honors-open-questions-s653`: rows on C-ID bases, yes; multi-base pairs wait; one H id per base; the three `promotions.json` pairs held, then released; HIST M10UP folds into HIST C1001H as its own change; #3304's dismissal rows stay; a pair beside a CCN H record is held.

**APPLIED: Honors step 1 (#3329; `supabase-migrate.yml` run 43627165705, receipt commit `5dfe4f10`, `kb/receipts/migration_s653_honors_of_field_43627165705.json`, status 201).** `honors_of` rows for HUMA M10ME (HUMA M1110) and LIBR M10CJ (LIBR M1040) under `honors-s653@bot`, and the two retitled base rows restamped to `honors-s652@bot`. Before-values `kb/honors_of_s653_out/2026-11-14/step1_restamp_before.json`; undo `kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql`, run BEFORE the S652 follow-ups rollback. Live reads at 18:32Z matched the plan; five readers judged step 1 safe; the live read at 18:49:43Z confirmed all four rows (`kb_curation` 40,711 to 40,713). **DECIDED** `d-honors-step1-applied-s653`. The next daily run folds it.

**Honors step 2 (draft #3315, head `4b4f2e4b`; nothing applied).** Redrawn twice: 553 pairs (267 row and mint, 78 row only, 4 fold, 88 none, 116 held); 349 rows, of which step 2 writes 347 under `honors-rows-s653@bot`. **DECIDED** `d-honors-two-signals-or-hold-s653`: a row only for a pair two independent derivations find; a base holding more than one course is held until split; `--check` recomputes the plan on the day. **PITFALL** `p-snapshot-test-pins-the-rule-s653` (the recall script's "right" was the matcher's pairs minus a wrong list; [note](../../kb-notes/methodology-a-test-must-not-take-its-rule-as-the-truth.md)).

**NEXT:** (1) Honors: #3325 (read COBIx first); step 2 after the second session's review comment on #3315, then `--check` after the daily run, then the apply; then *Before the mints* (numbered base plus H on the CCN pattern); HUMA M10OI into M1110; `kb/coci_minted_courses.json` still lists LIBR M10CJ under LIBR M1040. (2) FIRE 130 X's row-audit card. (3) Price the model pass (to Sam first). (4) A potential-CPL column. (5) The Leadership outlines. (6) The #3298 and #3302 follow-ups (the second session holds the two failing Python tests). The full list as it stood: lessons, *Moved from the lane (S653 checkpoint)*.

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
