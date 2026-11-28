---
title: "The Commons — one tracking system for the common references, and a Commons dash — lane state"
created: 2026-10-18
updated: 2026-11-28
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

## The pattern, named

Five parts, from Program Requirements: a universe and a definition of complete, versioned procedures, machine checks
on every item, milestones and parts, a run log. The list as it stood: [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 start)*.

## The common references

| Reference | Tab | Lane | Where it stands |
|---|---|---|---|
| Program Requirements (Catalog ROEP) | `#program-requirements` | [program-requirements-harvest](program-requirements-harvest.md) | carries all five parts |
| Common Exhibit Reference | `#credential-reference` | [cer-procedures](cer-procedures.md) | procedures run nightly; the Progress view since S436 |
| Common Course Reference, SkyView | `#unified-courses`, SkyView | [skyview-ccr-interface](skyview-ccr-interface.md) | built and stable; the auditor's receipt on the Pipeline tab |
| Common CR Reference, with its military half | `#cr-reference` | [common-cr-reference](common-cr-reference.md), [military-ace-cr-reference](military-ace-cr-reference.md) | worklist live; the military half scoped |
| Common Subjects Reference (Sam's addition, Sheet 95) | `#canonical-subj4` | [common-subjects-reference](common-subjects-reference.md) | carries all five parts since S425: the Progress view, a procedure per card, the daily scan, the run log |

## Status

**LIVE (#3554, `5a7a6f24`; #3533, Sam's go Nov 19): the CPL Commons front page.** `commons_front.js` draws the bare `#commons`: the header and Sam's lede, the Phase 1 Dates widget and its daily chart, Needs you, the cards in Collect / Curate / Connect and the Plan (fold keys
in `cplCommons.fold.v1`; their current shape is the clarity paragraph below), the Building, More collection detail and scorecard lines. College Data Collection moved to
`#collect` (`tabs.js` folds it into this tab and rewrites every old `#commons/data...` address); the earlier first view
stays at `#commons/details` under `cplCommons.detailsOrder.v1` / `detailsFold.v1`.
Figures with no source on main sit in `ASKED`, each named. **NEXT:** the open data questions
on the ask (the 6-college status file against 0 blocked, the kinesiology rulings, the readable-course count, a COCI-only
recount); the generators' `#commons/data` links to `#collect`. Guard `tests/commons_front.test.js`. **DECIDED** `d-commons-front-page-routes-3554`, `d-commons-front-card-layout-3554`.

**LIVE (PR "Commons page clarity", Sam's eleven asks of 2026-11-21 in session): the front page reads clearer:** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S700 checkpoint)*. Guards `tests/commons_page_clarity.test.js`, `tests/commons_way_back.test.js`. **DECIDED** `d-term-reports-named-term-s698`. **NEXT:** a per-college credential count for the CDC card's third line; the readable-course count so SLOs and objectives join the collection date; `commons_handover_summary()` carrying the term our reader names, so the page's term match has data.

**LIVE: Needs you, one path per item, a way back, live saves (#3570 `c2ef4ce1`, S687):** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (plain session, 2026-11-20)*. Guard `tests/commons_needs_you.test.js`. **DECIDED** `d-commons-needs-you-ranking-s687`.


**LIVE: Course Outline and Catalog Fixes Needed (Sam's work order, 2026-11-20):** Sam answered all 12 hunt courses; the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 checkpoint)*. Guard `tests/commons_outline_fixes.test.js`. **Met (S737 read):** the mock of 2026-11-20 (https://claude.ai/artifact/68ERWyrwiApcF3QM1KuYM2) is carried by the front page as Sam's 2026-11-21 to 11-23 asks rebuilt it: Collect holds Colleges and catalogs, Programs, Courses data and College Data Collection (`commons_front.js`), Credentials sit under Curate (his item 4), and the set-aside rides the Courses data card's term reports. No separate NEXT stands from the mock.

**LIVE: hand it over in place, slice 1 (S692, #3608 `5507826e`; notes and the named list since S693):** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S700 checkpoint)*. Where it writes, the pickup, the guards: [`reference-commons-hand-over`](../../kb-notes/reference-commons-hand-over.md). **DECIDED** (the three `d-handover-*-2026-11-20` rows). **NEXT, in order:** (1) find why `handover-try-link` answered 503 to Sam's three presses (read the function's log after the next press, then set or renew `HANDOVER_DISPATCH_TOKEN`); (2) pasted data into a read file the loader keeps; (3) a dropped outline's parsed outcomes loaded with the title check; (4) a link that reads saved as the registry's source; (5) the box on the other references' views; (6) a college's panel over the front page; (7) the Courses card's controls in the panel; (8) a dropped term report read for its term.

**RULED (Sam, 2026-11-20): *no longer offered* and hand it over in place:** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S700 checkpoint)*. `r-no-longer-offered-sam-2026-11-20` (nothing is set aside until the term reports and the catalog check exist), `r-hand-over-in-place-sam-2026-11-20`; **DECIDED** `d-college-opens-cdc-panel-2026-11-20`.

**LIVE: Needs an M-ID, the one gap pile, the Closest M-ID column and Assign from the panel (S693, S694):** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S700 checkpoint)*. Guards `tests/coci_list_needs_mid.test.js`, `tests/closest_mid_links_test.py`, `tests/coci_list_assign.test.js`, `tests/assign_from_panel_build_test.py`. **RULED** `r-mids-first-then-course-exhibit-titles-sam-2026-11-20`, `r-closest-mid-column-sam-2026-11-20`. **DECIDED** `d-joined-course-keeps-the-mid-row-2026-11-20`, `d-assign-first-slice-existing-only-2026-11-20`. **NEXT, in order:** (1) the pile mint's next steps, below; (2) Jev as the second stage, a same-course yes or no on the top candidates (`kb/_jev_harvest.py` is the repo's Jev caller); (3) SLOs and objectives in the score where `course_outcomes` holds them.

**LIVE (S723 to S730): the Commons top, the Courses List's Common subject in doubt and its bottom bar, Gather and its saved filters, the adapt gather (34 merges, 133 moves; `f-adapt-gather-landed-s729`), Common and Local course rows, a card's title folding the page (`#commons/card/<key>`) and Needs you folding to its item:** the paragraph as it stood, every DECIDED and guard named, verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *Moved from lanes/commons.md (S736 checkpoint)*. **NEXT:** the nightly auto combining that reads saved filters (its confidence score first); the SLOs and objectives look-in and the add bars (each a new write surface, Rule 10 a3); mount a list under the trail once one renders into a given container; Subjects, Credit Recommendations and Exhibits on the anchor pattern; Sam's remaining doubt rulings; "Noncredit Course for MUS 15" into the review file's held list; "2 Rename batch" to curator work. ESL: the monthly pass after 2026-11-29.

**LIVE (#3893, S736): the lightning round, `#commons/subjects/rapid`, takes Sam's asks of 2026-11-26** (*"needs to pop off the list"*, *"add hover over on the course listed on each card showing the course description"*, *"have the catalog link open in bottom bar rather than to a new tab. collapse the bottom section with all the explanation text. add a place for me to add a training note for our procedures"*): *Not a subject* saves `{not_a_subject: true}`, *Skip* sets a code aside for the visit (**DECIDED** `d-lightning-round-not-a-subject-and-skip-s736`), *Save this title*, the example course opens its description or a web search, the catalog opens in a bottom bar, *How this works* folds, and *Add a training note* writes a `kb_curation` row, field `procedure_note`, key `NOTE:<view>|<time>` (dismissed in `kb/governance_surface_map.json`). **LIVE (S746 port of COBIx's #3917):** Sam, 2026-11-27: *"there should be a way to ask you to run a routine to reparse based on the note and perhaps all the cerro coso items could be resolved quickly"*: the note box's *Ask COBI to act on this* checkbox writes `value.act = true`, and the builder honors `not_a_subject` ([`common-subjects-reference`](common-subjects-reference.md)). **NEXT:** a session-start read of `procedure_note` rows with act true.

**LIVE (#3921, S745): Connections, the outside tools.** `kb/_college_page_read.py` `frame_check` (`frame_verdict`, guard `tests/college_page_read_frame_test.py`; plan `kb/college_reads/outside_tools_frame_check.json`) reads whether a tool's page may sit in a bottom bar, and the Interconnectivity card lists *Priority connections for CPL Pathways cards*: PPM, CVC and ASSIST, with the chip goal. What each tool allows: [`data_sources`](../data_sources.md). **RULED** `r-partner-chips-like-cpl-sam-2026-11-27` (a partner's chip on a course, like the CPL chip); `r-co-owned-no-vendor-lockin-sam-2026-11-27` (*"we all want to do this as a CO owned endeavor ... itpi is the vendor for map and CO owns the ip"*); `v-grand-consolidation-sam-2026-11-27`. Sketches (private until Sam shares): PPM https://claude.ai/artifact/4rRKYwJaeTwXmfiYQ6DW7v, ASSIST https://claude.ai/artifact/Vi6yN9NUH2cckKJYqt7KxQ; sources in `CPLBrain/04-projects/cpl-initiative/connections/`. **NEXT:** the CVC sketch once Sam sends his saved search; send the three request drafts (vault note of 2026-11-27) on Sam's word; then a partner chip on the live cards.

**LIVE (#3928, S746): the Commons click-through agrees with the List (#3555).** `scripts/commons_clickthrough.js` reads `#canonical-subj4/list/scan` by the Subjects List's scan note (class `cs-scan-note`, the same `ASK_SKIP` findings as the card); `#exhibits/list/nosubj` re-read 2026-11-28 at 597 and 1,344, the same two units. `kb/_build_commons_status.py` now counts a confirmed subject by the List's `isConfirmed` rule (any four-letter code with a review stamp; the builder had counted only `curator_override`, so Sam's FLTR pick on an S717 assigned entry read 137 against 138): person 138, confirmed and settled 151 to 246. Guard `tests/csr_person_count_agrees.test.js`. **S747:** the dispatched run 46117050856 on main passed 13 of 15: `#canonical-subj4/list/scan` and `/person` now agree; `#exhibits/list/nosubj` read 597 on both sides, so its written difference became an equality (`compare: filter_label`); `#program-requirements/list/fail` did not land selected once (it passed Nov 24 to 27; the Programs List reads the live tables as anon). **NEXT:** close #3555 once a run comes back clean; if the fail landing misses again, read the run's `out/commons_clickthrough.json` for what the List showed.

**NEXT, Commons Clarity (Sam's list):** (1) the front page's 433 against 514: **not reproduced (S747)**, the held-codes totals read 433 codes, 1,394 courses and 699 pairs at every commit from Nov 26 to 28, and no Commons data file holds 514, so it waits on Sam naming where he saw 514; (2) Needs you's link opens the card instead of the lightning round, with no way back: **held (S747)**, opening the view directly would reverse Sam's S723 ruling (a Needs you item lands on the card link, highlighted, and a second press opens the view), so it waits on his words; (3) **DONE (S747)** Exhibits (`#exhibits`, every view) carries *Back to CPL Commons* however it is reached (`commons_front.js` `commonsView`; guard `tests/commons_way_back.test.js`); (4) **DONE (S747)** the Aligned course tile reads *None held* when no title is held, and *Saved, waiting for the nightly run* shows only while a save waits (`exhibits.js`; guard `tests/exhibits.test.js`); (5) Sam's open question: are procedure notes meant to stay hidden, and may a signed-out viewer see the credentials?

**LIVE, first record: the pile mint (S694 #3621, S695 #3626; plans `kb/pile_mint_out/`):** `LSKL M9004`; the paragraph as it stood, its DECIDED rows named, verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *Moved from lanes/commons.md (S746 checkpoint)*. **NEXT:** (1) the 168 other tutoring titles: 76 that name a subject to Assign under `LSKL M9004`, 70 that prepare tutors as a later LSKL mint, 22 for a person; (2) a Common SUBJ per local subject code for the rest, worked from `#commons/subjects/held`, saved in `kb/reference/subject_discipline_map.json`; (3) *Propose a new M-ID* in the panel, on this apply; (4) the state course list is a May export that no workflow rebuilds.

**LIVE: Subjects, by confidence (#3620 to #3771; #3655 is the brief):** the paragraph as it stood, its RULED and DECIDED rows named, verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *Moved from lanes/commons.md (S746 checkpoint)*. **NEXT, in order:** (1) carry derived titles into `kb/status/local_subject_titles.json` as their own column (never `printed_name`, which the recommender votes from), so the committed totals agree with the page; (2) measure `WEB_SHARE` once titled codes have searches; (3) the bar on every other confidence display (CLAUDE.md rule; each view at its UI pass); (4) Southwestern PE/A, PE/I, PE/T, PE/L and PE/D to ES/A, ES/I, ES/T, ES/S and DANC on Sam's word or a printed source; (5) the printed MICROTK to IT line (LATTC) and DSPS to ACCS (Mt. San Antonio); (6) the code history's next readers, probe round 2 and the filers; the mint takes Confident calls; the 787 Unsure codes; Sam's FLNG and Athletics-into-KINE rulings; his twelve AED titles, then one re-mint (`r-fix-twelve-then-one-remint-sam-2026-11-23`).

**LIVE (#3743, #3748, S719): every Commons card but Plan takes the Subjects card's design, and the cards answer their own edits:** the paragraph as it stood, [`docs/roadmap_archive_8.md`](../../roadmap_archive_8.md), *Moved from lanes/commons.md (S729 checkpoint)*. Guards `tests/commons_cards_checks.test.js`, `tests/commons_cards_live_figures.test.js`. **DECIDED** `d-cards-checks-design-s719`, `d-cards-live-figures-s719`. **NEXT:** College Data Collection's stuck colleges live (a `commons_data.js` state change), and the CR Progress view reading the same live count as the card.

**LIVE (S711): outlines to find by hand,** `#collect/slos` (Sam's ask, 2026-11-23): `kb/_outline_hunt.py` → `kb/status/outline_hunt.json`, nightly; rule `d-outline-hunt-ranking-s711`. Guards `tests/outline_hunt_test.py`, `tests/commons_outline_hunt.test.js`. **LIVE (S712):** a course opens its hand-over pane (`#collect/slos/outline/<college>-<code>`), Previous and Next, and its row shows what was handed over (`d-outline-hunt-handover-in-place-s712`). **NEXT:** load each outline Sam hands over or drops, rerun the compare and the list.

**Older records, all standing** (S417 to S683): the pointer line and its DECIDED rows, verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *Moved from lanes/commons.md (S746 checkpoint)*. **NEXT:** on the deployed tab, check that a college's `course_outcomes` rows carry its college name; Subjects' 93 stray codes stay with the curator.

**The restricted tables (S660) and the College Collections ETA (S661, #3371 to #3373):** the two paragraphs as they stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 start)*. **FINDING** `cdc-restricted-tables-read-by-team-phrase-s660` is the org-and-phrase lane's call; **DECIDED** `d-eta-clock-reads-files-s661`; **RULED** `d-eta-date-controls-are-chips-sam-s661`. **NEXT (the data dashboard):** MIS course matches and COE regional demand, each after a definition of the per-college figure; Copper Mountain's registry `catalog_url` at its next capture; the Coming next items as their sources exist; the College view on Sam's word.

**S680 (2026-11-18), discontinued programs and the Spend line (#3491, #3503):** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 start)*. **RULE (stands):** a PR that changes what the Commons data reads rebuilds `commons_data.json` in the same PR. **NEXT:** add that check to `scripts/check_generated.sh`; Sam's billing paste after Nov 15; `tests/course_outcomes_objectives_standing_test.py` in `course-outcomes-load.yml` before its load step.

**S683 daytime (#3517):** the paragraph as it stood, its NEXT included, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S701 checkpoint)*.

**NEXT:** (1) the ASE slice's public copy on the Credential Catalog; then CompTIA, the American Welding Society, NCCER, military. (2) From the path mock (https://claude.ai/artifact/PYzUNKC3Ni6F8nhbcKdSr9): Teach a rule on every reference; the confidence count for the Course auditor, which needs a receipt of what the auditor scored before a person changed the card (none is committed today); the other references' paths; then every Commons view on the `--cmn` tokens. Data sources: [`data_sources`](../data_sources.md). When a Progress card reads *Could not be read*, check the `coci_college_programs` read first (it once answered 500).

**IN PROGRESS: the Common Course Reference tab retires into the Courses List (SkyJujube, 2026-11-04; #2776):** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 start)*. **NEXT:** the ways in, then the auditor's other triage tags as List filters, then delete the tab and its `uc_*` suites. Handoff: `docs/courses_retirement_handoff.md`.

**M-ID re-clustering Step 1, the identities map and Honors steps 1 and 2:** verbatim in [`roadmap_archive_8`](../../roadmap_archive_8.md), *Moved from lanes/commons.md (S745 checkpoint)*.

**LIVE: rules G and M last in the confidence scorer, and their apply (S683, #3513; #3529, S688):** the paragraph as it stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 start)*. **DECIDED** `d-rule-g-two-mapped-colleges-s683`; the M and FPR moves wait on a re-mint. **NEXT:** `python3 kb/_ccr_confidence_apply.py --rule G --fill-members` (dry run), then `--apply --expect <that dry run's own count> --run <the session label>`, committing `kb/coci_minted_courses.json` with the receipt.

**The CCR seed re-check (ruling 4) and Discipline in doubt (S614, #3025; `#coci-lookup/list/doubt`):** both stand; the lines as they stood, [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 start)*.

**RULED: every Commons view in Malone's look, and the path (Sam, S573, 2026-11-04):** [`docs/roadmap_archive.md`](../../roadmap_archive.md), *Moved from lanes/commons.md (S694 start)*; its NEXT is (2) above.

