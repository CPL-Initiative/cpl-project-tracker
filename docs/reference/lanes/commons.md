---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-15
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
**DECIDED** `d-data-collection-two-bases-s648` (every card names its base: the captures count Active, Teachout and Approved, passing and completeness count Active) and `d-course-key-normalized-s648` (a course is one college and code key, uppercased, spaces and hyphens removed; an SLO matches on it). The paragraphs as they stood: lessons, *Moved from the lane (S650 checkpoint)*.
**DECIDED** `d-data-collection-links-open-in-panel-s649`: on Sam's ask 2, every link opens in the side panel at an address of its own, with *Open in a new tab* the panel's one link out; this reverses #3257's new-tab links.
**LIVE: three cards on a college's panel (#3316 `2702a652`, S654; #3310 items 2 and 5):** *How it's collected*, *Program pathway maps* and *Data sources*, drawn by `commons_data_cards.js` through `CARD_MODULES` in `commons_data.js` from the builder's `collection` keys. No SIS or integration is inferred: the integration line reads none known until `SIS_CMS_INTEGRATION` records one the MAP team confirms. Guards `tests/commons_data_cards.test.js`, `tests/commons_data_status_build_test.py` (16). The paragraph as it stood: lessons, *Moved from the lane (S654 checkpoint)*.
**DECIDED (S653, #3310 items 1 and 3):** the list opens highest overall completeness first (Sam: "show progress first"), never stored; the side panel is a non-modal dialog, so the page beside it stays live: a college word replaces the panel's college, a heading sorts, a figure applies its filter. The aria-modal panel set `inert` on the page (COBIx on #3231), which is why a click there did nothing. Guards `tests/commons_data.test.js` (*live 1* to *9*) and the `commons-data-panel` keyboard pass in `a11y.config.js`.
**The CDC's four PRs and its classes (S653, S654):** **DECIDED** `d-cdc-four-prs-and-classes-s653`, `d-cdc-held-means-not-shared-s654` and `d-cdc-restricted-class-s654` all stand (held means left out of an outside share; the restricted class the site never serves). The paragraph: lessons, *Moved from the lane (S661 checkpoint)*.
**DECIDED** `d-data-collection-one-base-per-card-s649` (follows `d-data-collection-two-bases-s648`): where the live census holds a college, the card's Passing now and Still to pass, the list's columns and the statewide card read it (5,751 still to pass), so the causes sum to the figure; the capture's own figures keep the label *the capture*.
**The College Data Collection wording and order (Sam, Nov 13 on #3229) and the harvest's throughput (S644):** lessons, *Moved from the lane (S654 checkpoint)*. **Catalog links (S650):** only Copper Mountain's link is broken; `CATALOG_LINKS` splits `catalog_url`, `capture_root` and `catalog_now`. The paragraph: lessons, *Moved from the lane (S653 checkpoint)*.
**The strategic plan (S651):** **DECIDED** `d-strategic-plan-generated-in-commons-builder-s651`, not built. The paragraph: lessons, *Moved from the lane (S653 checkpoint)*.

**LIVE (S661, #3375 `f44a0fcd`): the Commons Curation ETA tops the CPL Commons tab** (Sam, in session: *"Design another ETA widget to estimate completion date on the CPL Commons curation work. This one doesn't so much depend on collecting data but on honing the procedures used to auto-canonicalize and/or speed the human curation/canonicalization process."*). `commons_curation_eta.js`: each reference's pace is the net fall of its remaining work (new work counts against it) over the last 7 days or the 7 before, with people's share apart, from the new daily `pairs` series in `kb/status/commons_history.json` (`kb/_build_commons_status.py` records it each build; backfilled from the committed status file from Oct 18). Procedure chips are the queue's no-procedure blocks (a new procedure settles a stated share on a stated start); people chips multiply people's pace. A reference whose remaining work does not fall is not dated, and the ETA then reads Not dated yet. On Nov 15 the CR wordings do not move, and the exhibit universe (keys in `kb/unified_titles.json`) grows by exactly the count of new stamps each day, so exhibit remaining work does not fall; a people chip multiplies only confirmations that lowered remaining work, so it cannot date them from that. The honest headline is Not dated yet. **OPEN (COBIx on #3375):** why the exhibit universe grows with the stamps; until that is traced, measure exhibit remaining from the titles MAP carries (the auditor's `title_cards`) rather than `len(ut) - stamped`. **DECIDED** `d-curation-eta-net-pace-s661`. The top cards' explainers (Waiting on a person, How far to trust the procedures) fold behind About this by default (Sam: *"Save real estate on cpl commons by default collapsing the text explainer part of the top cards"*). Guard `tests/commons_curation_eta.test.js`.

**NEXT (the Curation ETA, S661):** (1) Measure exhibit remaining from the titles MAP carries (`exhibit_audit` `title_cards`): `q-exhibit-universe-grows-with-stamps-s661` (proposed) found the universe, the length of `kb/unified_titles.json`, grows by exactly the day's new stamps, so exhibit remaining never falls. Method: [`methodology-a-progress-pace-is-the-net-fall-of-remaining-work`](../../kb-notes/methodology-a-progress-pace-is-the-net-fall-of-remaining-work.md). (2) COBIx's optional nit on #3375: in `commons_curation_eta.js` `paceWords`, check `w.fell === 0` on its own, so a missing day cannot print "two days". (3) The ETA cost feed (the College Collections ETA's NEXT). COBIx's go-live point: the ETA page is public at its address, spend figures and the Oct 26-27 runaway note included.

**DONE (S660): the restricted tables are measured.** `kb/reference/restricted_table_access.json` holds each restricted row's table, its grants and select policies (read live about 16:20Z, 2026-11-15), and `kb/_build_cdc_sharing.py` fails a table missing there or open to anyone (RLS off, or a policy condition other than the named gates). COBIx asked for a list of tables with no anon or authenticated select; four of the five grant select to both, and RLS passes a row only through `is_allowed_reviewer()`, `is_funding_reviewer()` or `team_pass_ok()`, so the build checks the gates instead and the doc names who reads each table. Only `stg_map_student_credit` is closed. **FINDING** `cdc-restricted-tables-read-by-team-phrase-s660`: `map_college_contacts`, `map_college_users` and `map_college_nudges` also open to anyone sending the team phrase, so the restricted class now says so; whether a phrase should reach staff rosters is the org-and-phrase lane's call, not this view's. Re-measure the file when a grant, policy or gate changes. Guard `tests/cdc_sharing_build_test.py` (11). **NEXT (the data dashboard), in order:** (2) MIS course matches and COE regional demand, each after a definition of the per-college figure. (3) Copper Mountain's registry `catalog_url` at its next capture. (4) The Coming next items as their sources exist; the College view on Sam's word.

**LIVE (S661, #3360): the College Collections ETA.** Sam, in session: *"add the 'College Collections ETA' widget to the College Data Collections tab and add a card to the cdc tab to open the full ETA in sidebar."* The band tops the college list (module hook `top`), a card among the figures (hook `tiles`) opens the full clock in the side panel (pane `clock`, `#commons/data/clock`), and the clock keeps its page at `#commons/data/eta`; the three share one set of picks for the visit. Built from the mock: Sam approved COBIx's canvas mock to build as is (comment of 17:02Z; source SHA-256 `62d517f7`). `commons_eta_clock.js` ports it through the College Data Collection module hook: the compact band (college selector, the Phase 1 date with Soonest or Latest, the P1 to P3 connection chips with their factors and start dates, the 30-day bars, Show costs, Assumptions) and the full clock (phases, dates, how far we have come, datasets, levers, the #3111 plan link). **DECIDED** `d-eta-clock-reads-files-s661`: the clock computes from the committed files (the headline series for the program pace, the live read for SLOs, objectives and each college, `commons.json`, the integrations registry, the skills' harvest days) rather than the mock's frozen constants; it keeps the mock's estimate rates, stall shares, factors and the pasted daily spend, each with its source. **RULED (Sam, in session, S661)** `d-eta-date-controls-are-chips-sam-s661`: *"I know it breaks with format norms but can you make the items Cobix designed as chips be chips instead of link buttons. The aren't intended to open views but to change projected eta"*: every control that moves the projected date is a bordered chip (bold, accent border over a wash when on); Detailed View and Plan, Assumptions, the phases and Clear levers stay words. Then: *"Keep them quite small font so they do t grab the focus which should be the eta and bar graph"*: the chip face is 11px type on a hairline border, inside a 24px target; the band's two words match. The CO palette stays as `--eta` tokens. Guard `tests/commons_eta_clock.test.js` (the mock's worked dates from its own inputs). **Every college row carries CPL Pathways** (Sam: *"brings it all into perspective, the vision made real"*), opening the college's own Pathways view framed in the side panel (`cobi_framed.js`: `?framed=1` hides COBI's header and menu), with the panel's Open in a new tab. **NEXT:** a cost feed from the handoffs' `Spend:` lines, no billing credentials in the repo (COBIx's ask).


**NEXT:** (1) the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER, military. (2) From the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; the confidence count for the Course auditor, which needs a receipt of what the auditor scored before a person changed the card (none is committed today); the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500).

**The List, one engine (S542, 2026-11-01).** `commons_list.js` draws every reference's List from a spec the tab hands it. The record moved verbatim to [`docs/commons_lessons.md`](../../commons_lessons.md), *Moved from the lane (S624, 2026-11-10)*.

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04).** Why (the inventory): `docs/commons_lessons.md`, *The CCR tab's inventory*. #2776 carried the common course's card and Rename, Set the discipline and Confirm into the List's panel. NEXT: the ways in (SkyView's three `#unified-courses/list` links, Quickstart's routing, Subjects' *Fix on CCR*, `excel_to_dashboard.py`'s script injection) and the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Suggested merges, carry or retire: lessons, *Moved from the lane (S649 final refresh)*. Handoff: `docs/courses_retirement_handoff.md`.

**IN PROGRESS: M-ID re-clustering by outcomes, Step 1 (S642, issue #2962; reports and plans under `kb/reclustering_s6*_out/`).** Sam's rulings (Sheets 186, 191, 195, 197; `sam-honors-own-mid-2026-11-13`, `sam-sheet-195-answers-2026-11-14`, `sam-ccn-structures-gold-standard-2026-11-14`: *"CCN structures should be our gold standard"*) and `d-math-m1044-stays-no-one-asked-s652`, `d-huma-m10oi-into-m1110-s652` (not done) stand. The paragraph as it stood: lessons, *Moved from the lane (S654 checkpoint)*.

**The identities map, APPLIED and DROPPED (S652; `sam-identities-apply-and-drop-2026-11-14`):** 2,316 entries; undo in order by `python3 kb/_identities_rebuild.py --undo` (the drop receipt, then 14b). The paragraph: lessons, *Moved from the lane (S653 checkpoint)*.

**Honors, the field (#3313 `1ef02a84`; follow-ups #3325 `faaa7a9b`, S654, COBIx verified):** `kb/honors_of.py` (the fold guard, a trial check over every pair), `kb/curation_pointers.py` re-keys `merge_into` and `honors_of`, the Allocator refuses an H id; the hold covers every base of a list value, the CCR worklist fails closed, the daily Summary counts joined pairs. `d-honors-open-questions-s653` stands. The paragraph as it stood: lessons, *Moved from the lane (S654 checkpoint)*.

**APPLIED: Honors step 1** (#3329 `7e017287`; **DECIDED** `d-honors-step1-applied-s653`; undo `kb/migrations/2026-11-14_s653_honors_of_field_rollback.sql`, run BEFORE the S652 follow-ups rollback): lessons, *Moved from the lane (S655 checkpoint)*.

**Honors step 2: the plan merged, the apply HELD (#3315 `f90be0d6`, S655; plan and drafted SQL only, `kb/migrations/.apply` equal to main's).** **DECIDED** `d-honors-anchored-rows-s654` and `d-honors-no-mint-on-split-candidate-s654` stand. Redrawn on the 06:19Z payload: 382 rows (step 2 writes 380; rows md5 `29667c07`, class md5 `8240706b`), 129 mints, 179 rows with the mint held (handoff 655's 157 was the design doc's count of mints the split-candidate rule moved). COBIx's two 04:20Z findings fixed (`e3242d3c`): `SUBJECT_FAMILY_APART` reads ENGR, COMP and BIOT apart; `HONORS_SUBJECTS` is keyed by college (Victor Valley CHEMH, HISTH); `tests/honors_subject_reading_test.py` (31 checks). The second reader's verdict was apply (rollback proved 91/91 on Postgres 16; the 8 generated JS files and `discipline_cpl_rollup` byte-identical on simulated post-apply data; a 19-row sample right). The live read at 07:28:57Z was clean (`honors-step2-ready-held-s655`), `--check` passed at 07:29Z, and **the permission check refused the worker's edit to `.apply`**: a denial is a hold, so nothing applied (`p-apply-edit-refused-by-permission-check-s655`). The --check receipt was not committed (it goes stale when `main` moves). The paragraph as it stood: lessons, *Moved from the lane (S655 checkpoint)*.

**NEXT:** (1) Honors step 2's apply, on Sam's word or in a session where the `.apply` edit is permitted: on a `claude/**` branch off `main`, rerun the plan's `--check` and commit `kb/honors_of_s653_out/<date>/check_receipt.json` with `.apply` set to `file=kb/migrations/2026-11-14_s653_honors_of_rows.sql` and `name=s653_honors_of_rows`; push (`supabase-migrate.yml` applies on push); pull the runner's receipt; push one real change; confirm 380 rows under `honors-rows-s653@bot` live. Either daily cron landing first means rerun the check; a person's `honors_of` row on any planned id voids all 380 (redraw). Reader's minors: `kb/coci_curation.json` grows by 341 `honors_of`-only entries; `unified_courses.js` `fetchHonorsOf` stops after six hops. Then *Before the mints* (base plus H on the CCN pattern); HUMA M10OI into M1110; `kb/coci_minted_courses.json` still lists LIBR M10CJ under LIBR M1040. (2) FIRE 130 X's row-audit card. (3) Price the model pass (to Sam first). (4) A potential-CPL column. (5) The Leadership outlines. (6) The #3298 and #3302 follow-ups: lessons, *Moved from the lane (S653 checkpoint)*.

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
