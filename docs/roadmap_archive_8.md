---
title: CPL Project Tracker — Roadmap Archive, part 8
date: 2026-11-24
tags: [archive, roadmap, project-memory, session-history]
related:
  - docs/roadmap_archive.md (part 1)
  - docs/roadmap_archive_7.md (part 7, at the 150 KB archive budget)
status: archive
---

# Roadmap Archive, part 8

Opened on 2026-11-24 (S718 checkpoint) because part 7 reached the 150 KB archive budget. Text here moved verbatim from
the lane file or index it names.

## Moved from lanes/commons.md (S718 checkpoint)

The Subjects paragraph as it stood at handoff 718:

**LIVE: Subjects, by confidence (#3620 to #3725; #3655 is the brief).** The paragraph as it stood at handoff 717, every surface, save and guard named, [`docs/roadmap_archive_7.md`](../../roadmap_archive_7.md), *Moved from lanes/commons.md (S717 checkpoint)*; before S712, the same file's *(S712 checkpoint)*. **RULED** `r-confidence-not-person-settled-sam-2026-11-23` (settled means Confident, 90% or more, from the data or a person) and `r-statewide-codes-every-college-sam-2026-11-23`. Standing: the statewide list (`kb/_statewide_subject_codes.py`, `#commons/subjects/statewide`), the re-mint gate (`kb/_mid_readiness.py`), figures that count the live saves (`d-subjects-figures-live-s715`), the card from the mock's Main artboard, the code history (`d-subject-code-history-s715`). **LIVE (#3724, S717): Colleges by source,** `#commons/subjects/sources`, the mock's Colleges artboard (handoff 717's open work 1, closed): all 118 colleges, each with its catalog platform, codes, titled, a status word (Read, Probing, To try, Blocked, Not needed, No system) for each way to look (catalog, catalog system, class schedule, department list) and Next. `kb/_subject_sources.py` writes `kb/status/subject_sources.json` nightly from `commons_data.json`, `statewide_subject_codes.json`, `local_subject_titles.json` and the attempts register `kb/reference/subject_source_attempts.json` (seeded with S712's probes at Allan Hancock, Antelope Valley and Bakersfield, and Clovis's hand filing; add an entry when an attempt starts or ends, never delete one). Today the catalog reads Read at 19 colleges and To try at 99; the catalog system No system at 76, Probing at 3, To try at 38. Guards `tests/subject_sources_test.py`, `tests/commons_subjects_sources.test.js`. **LIVE (#3725, S717): the course panel's move tools,** asked by Sam while moving Cerritos AED construction courses: Collapse all and Expand all in the frozen top row; each course group folds and has its own move row (a subject picker and *Move the checked courses*, acting on that group's checked boxes); the picker lists the credit codes A to Z by discipline name, then the noncredit ones; VOCE reads *Vocational: Noncredit*; the foot move bar pins once a course is checked. Guard `tests/commons_subjects_tools.test.js`. **ON #3727 (open; merge after #3726): a sidebar opens beside the view, never over it** (`r-sidebar-beside-view-sam-2026-11-23`): the view gives up the panel's width and takes it back on Close (`beside()` in `commons_subjects.js`, class `csb-beside` on `#commons-root`); below 900px the panel covers the view; the rule joins CLAUDE.md's presentation rules and `presentation_doctrine`. The panel still covers the right end of COBI's top header bar. **RULED, not built:** `r-sidebar-tables-sort-resize-and-stack-sam-2026-11-23` (a sidebar's tables sort and resize like the main table; a count in a sidebar opens a second sidebar). **NEXT, in order:** (1) the MQ view under Subjects, `#commons/subjects/mq` (Sam: *"let's run with it"*; the data is the CSR lane's): the mock's Commons look (https://claude.ai/artifact/SHS5eNN4nb5vLkNCzzWvVE), the Subjects statewide list filtered to a code as its sidebar (the new piece: that filter at its own address), and a link on the Commons Subjects card; (2) the panel over the top header bar, then the sidebar tables' sort, resize and second sidebar; other sidebars convert at their UI pass; (3) the same process on every other Commons card (Sam's S715 ask 3; `subjectsParts` in `commons_front.js` is the pattern); (4) the code history's next readers: a "Former code of…" field in the panel (a new `kb_curation` field, through Governance as Rule 10 (a3) asks), the held list and the mint resolving through it, the catalogs' course "Formerly:" lines; and check the statewide call of SOC and SOCI (ETHS at 99 to 100%; Sociology looks right); (5) the subject-list reads: probe round 2 (`kb/college_reads/s712_*_2.json`), then the eLumen, curriQunet and CourseLeaf filers, class schedules and department lists, each logged in the attempts register; (6) the mint takes Confident calls (1,025 of 1,341 held release; reconcile with the 98% floor; route p releases ordinary titles only); (7) raise the 787 Unsure codes; (8) Sam's two rulings (FLNG, Athletics into KINE); his twelve AED titles, then one re-mint (`r-fix-twelve-then-one-remint-sam-2026-11-23`).

## Moved from docs/INDEX.md Update history (S718 checkpoint)

- 2026-11-22 (S703 SkyDovekie, the CPL Queue routine's collection run, conductor, full checkpoint): #3676 (a recall count binds to its own trial's parser), #3678 (`ge_units_not_read`, 131 rows), #3679 (three hours gaps, 50 rows), #3677 (San Diego College of Continuing Education's outlines: 198 objective rows, 1,860 objectives), #3681 (Clovis and Cosumnes River pins), #3685 (`lists_past_their_figure`, 17 rows); #3686, #3675, #3683 and #3684 (Peralta) in flight. The harvest lessons doc compacted to archive 8; a section on a named gap's self-recall in `methodology-a-test-must-not-take-its-rule-as-the-truth`. Handoff 704 is the routine's; a plain session follows handoff 703.

## Moved from lanes/commons.md (S719 checkpoint)

The Subjects paragraph as it stood at handoff 719:

**LIVE: Subjects, by confidence (#3620 to #3734; #3655 is the brief).** The paragraph as it stood at handoff 718, with Colleges by source (#3724), the move tools (#3725) and every guard, [`docs/roadmap_archive_8.md`](../../roadmap_archive_8.md), *Moved from lanes/commons.md (S718 checkpoint)*; earlier, `roadmap_archive_7.md`. **RULED** `r-confidence-not-person-settled-sam-2026-11-23`, `r-statewide-codes-every-college-sam-2026-11-23`, `r-sidebar-beside-view-sam-2026-11-23` (LIVE, #3727). **LIVE (#3732, S718): Needs attention,** Sam, 2026-11-23: *"the most important thing to see on the list is a column to indicate the number of subjects that our confidence score indicates need attention. the sidebar should show immediate ways to take action."* **DECIDED** `d-subjects-needs-attention-rule-s718`: the college table's column after College counts a college's codes whose common code is below Confident, or with no title, no saved title and no High recommended title; a code the statewide list does not name at that college counts only when it has no common code. The table opens sorted by it; the count opens those codes. The page's words follow the confidence rule. The course panel leads with *Act on it* (Save, Confirm statewide, Search the web, Open the catalog, Sky's filed search); course lines read *INST 273 …*. The Commons Subjects card carries up to five quick links under its headline and opens with Collect, Curate and Connect folded (Sam, 21:37Z). Name matching ignores punctuation (Los Angeles Trade-Technical), but `levels()` in `commons_subjects.js` still matches exactly, so the card's 83% misses that college. **LIVE (#3733, #3734, S718): the code-address and search-page reads.** **DECIDED** `d-code-address-read-s718`: a code COCI carries that the catalog index omits is read once at its code's address (`kb/_subject_code_address_probe.py`); a heading files under rule `code_address` only when the page names the code in parentheses, and a 404 or another code's page goes to `code_address_tried`. It amends S698's never-at-an-address rule for those codes alone. Run 45275042093 filed Cerritos INST (Interdisciplinary Studies) and Long Beach City CART (Creative Arts); 22 others were tried, 20 of them 404s (all 15 at Southwestern). **DECIDED** `d-search-page-read-s718`: a filed web search that found a page and no title gets that page read (rule `search_page`); run 45283003411 read 11, none names its code. Southwestern's PE/I page reads *Exercise Science/Intercollegiate (ES/I)* and PE/D's *Dance (DANC)*, a likely rename, not filed. **NEXT, in order:** (1) the web-search pass for the 206 untitled codes with no filed search (156 not read, mostly Los Angeles district colleges; 50 not in the catalog; Sam's 2026-11-21 ruling); (2) `levels()` matches names ignoring punctuation, so the card agrees with the table; (3) Southwestern PE/* to ES/*: find a printed source, then file it in `kb/reference/subject_code_history/`; (4) the MQ view under Subjects, `#commons/subjects/mq` (the mock https://claude.ai/artifact/SHS5eNN4nb5vLkNCzzWvVE; the statewide list filtered to a code as its sidebar, at its own address; a link on the card); (5) the panel over the top header bar, then the sidebar tables' sort, resize and second sidebar (`r-sidebar-tables-sort-resize-and-stack-sam-2026-11-23`, not built); (6) Sam's S715 ask 3, the same process on every other Commons card (`subjectsParts` in `commons_front.js`); (7) the code history's next readers (a "Former code of…" field through Governance, Rule 10 (a3); the held list and the mint through it; the catalogs' "Formerly:" lines); (8) probe round 2 and the eLumen, curriQunet and CourseLeaf filers, each in the attempts register; (9) the mint takes Confident calls (1,025 of 1,341 held; the 98% floor; route p ordinary titles only); raise the 787 Unsure codes; Sam's FLNG and Athletics-into-KINE rulings; his twelve AED titles, then one re-mint (`r-fix-twelve-then-one-remint-sam-2026-11-23`).

## Moved from lanes/common-subjects-reference.md (S719 checkpoint)

The List view and Local subjects List paragraph as it stood at handoff 719:

**LIVE: the List view (2026-11-01).** `#canonical-subj4/list`, the third word beside Progress and Reference, is the
Catalog Commons' shared List (`commons_list.js`, lazy-loaded) with this reference's spec in `canonical_subj4.js` (Sam,
2026-11-01: *"I want one now for each of our Catalog Commons groups"*): one row per MQ discipline (147; 246 once #3726 lands), A to Z, with its
Common SUBJ, status (confirmed by a person, by the nightly procedure `csr-confirm-authority@bot`, by a session cohort,
or open), any collision, the Local SUBJs colleges use and how many, local courses, M-IDs, authority and note. Edit, Edit
every row and the Status drawer's Confirm this pick write through one path (`canonCheck`, `writeCanon`,
`writeNote`): the same `_CANON_SUBJ4::` kb_curation rows, no new write surface. No flag
column (no flag field) and no find and replace (a replace on Common SUBJ hands one code to several MQ disciplines; a
note where no code row exists stands in as the review, so a replace across notes would confirm picks). Guard
`tests/csr_list.test.js`; a11y `canonical-subj4-list`, `canonical-subj4-list-dark`. **A pick waiting for a person
opens the List on Open** (`#canonical-subj4/open`, `TO.confirm`): the Commons card's unconfirmed issue and the Progress
view's *Confirm them* once led to a filter whose box saved only a changed code, so Sam found nothing to press
(2026-11-03). **The List is the workspace
(2026-11-04, the List norms):** over the List, the engine's line of the subjects row in `kb/status/commons.json` (Open
and Confirmed by a person set the List's own filters), and the Progress view's opened page folded behind *Hide the
summary* (prefix `csl-pg-`). A press on a row opens its edit row and its side panel: its local subjects (most used first, each
share), the codes it shares (a collision, or shared by design; another MQ discipline's name opens its panel),
*Confirm this pick* with its own status line, and the authority, note and identity codes folded. Guard
`tests/csr_list_panel.test.js`. **The Reference view retired into the List (2026-11-04, SkyPawpaw):** its lists are
List filters (*No code yet*, *Confirmed*, *On the CCN code*, *On the C-ID code*, *An official code differs*, *Proposed*),
and every Progress count, old address (`/reference` too) and quickstart hint opens the List; a TOP column takes the TOP
filter's place (a fuzzy filter only); the head carries the sign-in and *Run the SUBJ check*, whose *show* opens a
discipline's panel; the panel folds the CPL window and the C-ID and CCN courses on its codes, and lists the *Codes it
could take* (the box's suggestions, each a *Take* word). Guards `tests/csr_list_reference_port.test.js` and the
table's suites ported onto the List (`csr_alias_chip`, `csr_authority_chip`, `csr_fl_split`, `csr_ui_tweaks`,
`csr_subj_check`; harness `tests/csr_list_harness.js`). The table's rules left the tab's `<style>` (both HTMLs) and
the injected box CSS with it. **The List as Sam's workspace (SkyJujube, 2026-11-04/05; the story in `docs/common_subject_code_tab_lessons.md`):** saves
read the session at write time (`freshSess`) and a lapsed sign-in says so; a row press edits the row and moves the panel
(engine `editByRow`); *Check alignment* audits a typed code (`edit.extra`; Exhibits carries its own); a code edit seeds
the Note, keeping a code asks its reason; the panel's local codes show Colleges beside Courses (from
`kb/discipline_local_courses/`, `kb/_build_discipline_local_courses.py`), name their courses, and carry *Use <code>*;
a row saved since the scan ran leaves *A scan finding to confirm or note*; *What a Common SUBJ is*
(`prototype/common_subj_explainer.html`). Every Commons view: *Hide the top*, side panels resize, both remembered.
**Sync:** `phase-1e-sync.yml` is manual, and a code change must land with its re-mint: the 2026-11-05 00:15Z sync put
Sam's new codes in the file ahead of the M-IDs, broke `tests/csr_trail_rules_test.py` on main, and was reverted. His
saves stay in `kb_curation`; the re-mint run syncs and folds them in one window. The evening's codes landed
(*APPLIED*, under NEXT below; re-key 41958042347 green; S583 read back no row left on an old code). **NEXT:** ECONMT and Electricity's
adult-education codes, his refile in Local subjects.
**The Local subjects List** (Sam, 2026-11-03: *"yes on
local subjects"*; `csr_local_subjects.js`, the fourth view, `#canonical-subj4/local[/<filter>]`): one row per local
code the subject map names (320), leaves out on purpose (18) or the seed's courses use (1,376 more), with its MQ
discipline, Common SUBJ, courses and where they land. *Confirm* records a filing as `_SUBJ_DISC::<CODE>` /
`subject_discipline_confirm`, a note as `subject_discipline_note` (both DR-25, Sam's); the map file changes only when a
session applies the filings under DR-25 with its ripple check. Guard `tests/csr_local_subjects.test.js`; a11y
`canonical-subj4-local`, `-dark`. NEXT: the Commons card's second count (local codes confirmed by a person) needs the
confirms synced to a committed file.

## Moved from docs/INDEX.md Update history (S719 checkpoint)

- 2026-11-22 (S705 SkyTystie, Sam's plain session, light checkpoint): #3687, one Save that settles a code's common subject code at every college using it (#3655 item 0), then Sam's four asks: Cerritos's department list as a title source with a source link, the frozen and resizable panel, moving courses, sortable and resizable columns; and the Exhibits Review card's tools (Previous and Next, Undo, what Change saves, Changes this visit, training sites in place, Articulated with and its no-credit-recommendation flag, another subject), with every Commons List side panel's top frozen. The queue ran beside it as S703 (#3674). Handoff 706.

## Moved from docs/INDEX.md Update history (S720 checkpoint)

- 2026-11-22 (S707 SkyPrion, Sam's plain session, full checkpoint): #3691 (main green again: the Exhibits card's duplicate check reads Sam's CAL FIRE title against the shipped titles after a CER run cleared its proposal), #3687 merged, #3693 (the subject map leaves AED unmapped; it had given 45 shared M-IDs an ELEC prefix); Sam's call to settle subjects before re-mints and the draft M-ID readiness gate; the commons lane compacted; four memory rows; handoff 708.

## Moved from docs/INDEX.md Update history (S721 checkpoint)

- 2026-11-22 (S709 SkyMurrelet, Sam's plain session, light checkpoint): #3697, the re-mint readiness count by the draft gate (`kb/status/mid_readiness.json`, nightly): the AED scope is 127 M-IDs (120 ELEC) on the live members file, 34 ready; the outcomes compare reran on 45,673 rows and gzips past the 5 MB limit; four memory rows; handoff 710.
