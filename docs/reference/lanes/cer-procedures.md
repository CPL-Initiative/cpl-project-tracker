---
title: "CER procedures and the simpler CER tab — lane state"
created: 2026-10-18
updated: 2026-10-31
tags: [reference, roadmap-lane, cer, exhibit-canonicalization]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# CER procedures and the simpler CER tab

**What this lane is:** the Common Exhibit Reference (COBI's *Common Exhibit Reference* tab, `credential_reference.js`)
run on procedures. Sam adds a rule in plain words; the nightly run applies the rules, then the classifier
(`kb/classify_exhibits.py`, which reads the exhibit-canonicalization skill as its system prompt) settles the rest; Sam
sees only the exceptions. Sam, 2026-10-18 ~02:55Z (vault braindump
`braindump-2026-10-18-0300-cer-procedures-automate-curation`): *"I want to be able to add more procedures to have you
classify and complete common exhibit titles and elements as we go. I don't have enough time to curate the growing list
and want to further automate so curation is manageable."*

## The redesign (2026-10-30, side session beside S531)

Sam, 2026-10-30: *"Have a good look at the current CER and notice how crowded it is and not intuitive to navigate. It is
now part of our Catalog Commons overall project and I want you to help me make it much more manageable and simple."*
Design record: mock-up https://claude.ai/artifact/6fTBpjkrGseEb7h3gaPnSM (version 26), source
`docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html` (#2595, merged). Built so far: the high school and ROP
rule and the CPL-AI dialog (#2601); the Exhibits tab's Review queue (SkyRowanberry, 2026-10-31, below). What Sam ruled in the
mock-up, each his words in the lessons doc (`docs/cer_v2_redesign_lessons.md`, 2026-10-30):

- **One Exhibits tab in the Catalog Commons replaces CER and EACR** (recommended; his "we might be able to consolidate
  the EACR tab with CER if we are careful"). Three questions organize it: *What is it called? What credit does it
  carry? Who could adopt it?* ("I do like your 3 categories"). Views: Review, Credentials, Rules.
- **A status bar of tiles per question**, the Commons pattern; the **CER step tiles filter the Review queue** (All held
  468, Proposed 401, Wording check 36, Two issuers 13, Conflict with the reference 18, Saved not folded 0), each step a
  chip with a plain hover.
- **Review sorts by students** with credit (106 held exhibits carry 3,000 students; the 40 with ten or more carry at
  least 84%; Cabrillo's high school articulations lead). **The canonical title is always the focus**, editable; issuer
  and training site sit in gray-labeled boxes under it; local titles in small print, the one being decided
  highlighted, the rest *and N more*; college chips for *Articulated at* and *Could adopt* (same-identity course, else
  EACR's list). Buttons: Keep Current Title, Change to Proposed Title, Teach a rule, Skip. A search goes to any exhibit.
- **The aligned course names the proposal** (cpl_memory `sam-cer-aligned-course-names-the-exhibit-2026-10-30`): 394 of
  468 held titles articulate to a course with a CCN, C-ID or M-ID. A conflict proposes the reference's person-reviewed
  title.
- **One issuer, many training sites**, set from the panel (cpl_memory `sam-cer-issuer-and-training-sites-2026-10-30`):
  363 of 2,465 credentials name a site; 17 say only JATC.
- **Why it matters (vault braindumps of 2026-10-30):** the public adoption page and Malone's new MAP exhibit module
  both read the CER's canonical titles and issuers.

**Sam's rulings, Open Asks Sheet 147** ([the sheet](https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB), completed 00:06Z 2026-10-31, all five his own call; cpl_memory `sam-sheet-147-rulings-2026-10-31`). Build in this order:

1. **One Exhibits tab** in the Catalog Commons replaces the CER and EACR; **Review is built first**. The two tabs stay until Exhibits carries everything they show.
2. **The high school and ROP rule — built (SkyGooseberry, 2026-10-31).** `kb/_suggest_unclassified.py` writes each queue title's aligned course under `aligned` (the course its exhibit's credit recommendation names at the college that built it; CCN, then C-ID, then M-ID, then the college's title; leading zeros fold; a join must share a word with the title; exam brands never align): 209 of 450 on 2026-10-31. Procedure `high-school-rop` (`kb/cer_procedures.json`, lane `school`) takes that title and the school, district or county office the classifier named (its trailing acronym dropped); adult schools and training centers stay with the classifier. Dry run: 55 settle, 29 held where the title already exists under another issuer; needs-you 468 to 413. The nightly run saves them under `cer-procedure-high-school-rop@bot`; `python3 kb/_cer_procedures.py --undo high-school-rop` takes them back.
3. **The public adoption page lists settled credentials only** (a person's or a rule's stamp), so it grows as the CER finishes. Its name is still his to give; *Credentials Your College Can Adopt* holds the place.
4. **The page takes Malone's CPL/AI look**, beside the Library and Sierra (the mock-up's First Light was proposed and set aside).
5. **The CPL-AI matching in the Program Requirements dialog — built (SkyGooseberry, 2026-10-31).** `kb/_build_cpl_ai.py --fetch` reads https://map.rccd.edu/CPL-AI/preview-data/catalog.json into the dated snapshot `kb/cpl_ai/pairs.json` (33,232 pairs, 115 certifications, 121 colleges; keeps tiers 1 and 2, *Strong evidence* and *Faculty interpretation*: 20,166 pairs) with the page's credit and caveat word for word. The dialog lists a course's certifications under *CPL-AI recommendations (N)*, and a course whose only lead is a match shows its 0 as a button. Refreshed by hand (`--fetch`) until a schedule is chosen. Sierra and the public pages wait on his word.

**The Exhibits tab** (`#exhibits`, `exhibits.js`; built 2026-10-31 in #2602, #2603 and #2604, history in the lessons
doc's 2026-10-31 sections). *Review* draws mock-up v26's card per held title, the step tiles as filters and *Go to an
exhibit*; `#exhibits/held`, `/conflict` and `/credentials` open one place, read once per visit, and the Commons' CER row
links them (#2612). *Credentials* lists every credential, most students first, with a panel whose issuer and training
sites (each with its college) save as `_CREDENTIAL_REVIEW::` rows; `resolve_sites` and `resolveSites` decide which
stands (`tests/credential_review_sites_test.py`); `field:kb_curation.training_sites_override` maps to DR-07. The panel
reads `kb/exhibits_adoption.json`: each college's lines and units, the course a could-adopt college already teaches,
the peer median. **Could adopt never reads the TOP and C-ID overlap** (Sam, 2026-09-24; Rule 7; KB note
`methodology-a-fold-carries-the-folded-tabs-rulings`). EACR's matrix, filters, exports and Create Handout live on the
public Credential Catalog. Not built: sites for a title new to the reference, and the *Held titles by group* table.

- `kb/_build_exhibits_review.py` writes `kb/exhibits_review.json` and the lazy `kb/exhibits_review_courses.json` from the
  procedures run's `needs_you`, the `aligned` course, `statewide_data.js`, the identity members, the reference and the
  overlay's training sites; nightly at the end of `cer-procedures.yml` and daily. A title settled or saved since the
  run leaves the queue. First published 2026-10-31 02:12Z: 468 held (401, 36, 13, 18), 209 aligned.
- **Students:** `exhibit_title_students(p_keys, p_ids)` (`kb/migrations/2026-10-31_exhibit_title_students.sql`),
  distinct students per title, an allowed reviewer only, k=10 inside the function. Governance:
  `rpc:exhibit_title_students` dismissed, `tab:exhibits` mapped to DR-07.
- **The buttons** write the CER's own `_UNCLASSIFIED::<local title>` rows (title and issuer). A conflict's *Change to
  Proposed Title* with the reference's title clears the saved assignment; any other title on a conflict re-keys a
  person-reviewed entry and stays a session's change. *Teach a rule* copies the rule for a session.

**The Credential Catalog, the public adoption page — built (SkyTwinberry, 2026-10-31; Sheet 147 cards 1, 3 and 4; named
on Sheet 148).** `library/adopt/`, Pages-served, linked from the Library and the public header.
`kb/_build_adopt_page.py` writes `library/adopt/adopt_data.json` daily from `kb/exhibits_adoption.json`: **settled means a
local title under the credential carries a review stamp** in `kb/unified_titles.json`, a person's or a cohort's, the
classifier's sure saves included (the mock-up's Reviewed tile, which Sam answered on). That gives 957 credentials of 2,232
in the reference, against 677 without the classifier's stamps and 495 on a person's alone. Columns are the 119 colleges
`college_lookup.js` holds; CSU Los Angeles takes none. The page has Malone's CPL/AI look and the Library's header with the
Library linked. Its filters are College, Show (*Not adopted yet*, *Adopted here*, *Every credential*), Field (CIP sector),
CPL type, SW Region, ASCCC Area, District and Search. The **Credentials** view puts the college's own course first, then
the most colleges, with Request Quick Adopt chips per building college (a scope never sees its own) and each college's
units and credit lines. The **College matrix** is windowed like EACR's, shows units or *C* for a college that already
teaches a matching course, has arrow keys and a tooltip, and a content filter never drops a column. The page also offers
both CSVs and **Create Handout** (the college's `library/cpl-opportunity/` visual). It writes nothing and remembers no
filter, and `?college=` follows the pick. Guards: `tests/public_adopt.test.js` (44), `tests/adopt_page_build_test.py` (19),
`npm run a11y -- public-adopt public-adopt-dark public-adopt-matrix` passing at every width. *Worth a faculty review* (#2613) lists Credential
Engine's top-50 credentials MAP has no exhibit for (28), from the hand check `kb/reference/credential_engine_top50_map_check.json`;
the IT/AI catalog's own join now needs the issuer to agree and reads that check (#2615; in MAP 89 to 102).

## Status

✅ **Live: the procedures run saves nightly, the fold applies per assignment, and the CER tab is three views (Needs
you, Procedures, Reference).** Sheet 94's three rulings landed in S416 and S417 and the first saving run in S418
(2026-10-18, 926 titles under 7 cohorts, receipt `kb/cer_procedures_out/saved/saved_2026-10-18T17-37-29Z.json`); the
run-by-run figures are in the lessons doc's S416 to S418 sections.

- **The fold holds per assignment (card 1, `kb/_fold_unclassified.py`).** V1 and V4 were an all-or-nothing hold; now a
  conflict with a human-reviewed classification, or a raw whose articulation rows carry another title, holds only
  itself and is listed in the report's `held` (with the standing title). On the real overlay the first apply folds 176
  clean assignments and 12 supersedes, adds 157 credential records, and holds the 18 conflicts. The daily workflow
  runs it unchanged (`--apply-if-safe`, which never fails the run). Guard: `tests/fold_unclassified_test.py`.
- **The 18 conflicts are not in the queue.** The reference already classifies each raw under a human-reviewed entry
  (a bulk review stamp of 2026-06-02), and the worklist assignment of the days after disagrees. The procedures run
  reads the newest fold report's `held` and puts each on Needs you › Held with the standing title and a word, *Keep the
  reference's title*, which clears the saved assignment (`clearUnclass`); the other way, re-keying a human-reviewed
  entry, is a session's reviewed change.
- **A sure result saves under its procedure (card 2, `kb/_cer_procedures.py --save on`, nightly default).** Every
  pre-fill no reason holds (a rule procedure settled it, or the classifier is sure at 0.85 or better, a clean title,
  no issuer conflict) is written to `kb_curation` as the tab's Save would write it, `_UNCLASSIFIED::<raw>` title and
  issuer rows, under the cohort **`cer-procedure-<id>@bot`** of the procedure that decided it. Rule 10: a fresh
  Range-paginated read first (a live row for the raw, whoever wrote it, holds the save), INSERT-only with duplicates
  ignored, the receipt (`kb/cer_procedures_out/saved/saved_<ts>.json`) written before the INSERT and committed by the
  workflow even when the run fails. **Undo by procedure:** `--undo <id>` deletes that cohort's rows in one call and
  receipts them; rows the daily fold already carried into `kb/unified_titles.json` (their `reviewed_by` is the cohort)
  are counted, and the fold commit that carried them is reverted. A rule procedure's settlement saves at the rule's
  word, the course-identity rule's 0.8 included (the college's own course title, 96 of its 125; the 29 anchored to a
  CCN or C-ID read 0.85). The first night's preview: 926 titles under 7 procedures (classifier 737, course-identity
  125, brand-family 53, nccer-verbatim 5, statewide-catalog 3, cslb-classification 2, apprenticeship-trades 1).
  `save=preview` on the workflow lists them and writes no row. Governance: `workflow:cer-procedures.yml` → DR-07.
- **The sign-off and the Curate panel left (card 3, `credential_reference.js`).** Reference keeps All and Industry
  credentials; the checkbox column, the bulk *Mark N initiated*, the Init button, the worklist's *Initiate all
  assigned* bar and the Curate panel are gone, with their CSS in both HTMLs. The quality flag sits at the top of the
  open row as a select for a signed-in curator (a word for a reader); the other four fields already edit in the grid's
  cells. Past sign-offs still load from the overlay for the export's Initiated columns and the Generated Title chip.

- **The store:** `kb/cer_procedures.json`, each procedure a rule in plain words with who set it, when, and
  their words. Seven **rule** procedures settle a title by code, in order: brand families (an AP title takes College Board's official
exam name, `kb/_ap_official_titles.py`, its `ap` lane first; Sam, 2026-10-31, #2614), the statewide
  catalog, NCCER, CSLB, the apprenticeship trades, one-off singles (the pre-seed lanes of
  `kb/_preseed_unclassified.py`) and the course-identity lookup (Rule 5c, `kb/unclassified_suggestions.json`,
  which must share words with the college's own title: HIST 035 *History of African Americans* had joined
  *Western Civilization II*). Five **guidance** procedures go to the classifier with the skill: the issuer
  issues the card (2026-10-05), a named school is the agency (5f), level words last (5g), method words
  collapse (8c), join and let faculty pull out (2026-09-20).
- **The run:** `kb/_cer_procedures.py`, nightly in `cer-procedures.yml` (07:47 UTC, after the daily
  dashboard refreshes the queue). A quality gate holds a proposal left with a dangling word, a method
  word, a course code or a high school code. The **cx, hs and ic lanes only hint**: on today's queue they
  wrote "for MUS 27" and "Kaiser High School". Writes `kb/unclassified_preseed.json` (the tab's
  pre-fills, the file it already reads), `kb/cer_classified.json` and `kb/cer_procedures_out/latest.json`
  (tallies and the Needs-you list). **Saving is card 2 above**: since the run of 17:37Z 2026-10-18 a pre-fill no reason holds saves under its procedure; the rest pre-fill.
- **The classifier:** Edge Function `cer-classify` (v1, deployed S412; reads and writes nothing; service
  key only; `claude-opus-5-5`, effort medium, 15 titles a call). The run sends the skill, every procedure
  and the house families (about 48,000 tokens, cached). A title is asked once, and again when the
  procedures change and its answer was unsure. First pass over the queue: about $8.
- **The first two passes (2026-10-18, runs 39097682221 and 39103573166):** $10.97 in all; 1,287 of 1,322 titles
  pre-filled and 396 held. A 30-answer sample read the sure band right. Figures and the one to watch (*Industry for
  GDDM 53*): `docs/exhibit_canonicalization_lessons.md`, its 2026-10-18 sections.
- **Code-only titles get the college's own course (#2219, landed in #2220):** the run looks a trailing code up in COCI at the
  college that entered the title and hands the title on as a hint (94 titles); a record carries its hints'
  fingerprint, so an unsure title is asked again when its hints change. The workflow installs `openpyxl`.
- **The tab's three views (#2221, S413; the S411 mock-up):** **Needs you** (Held, the titles the run held for a
  person, 25 at a time with why, each opening alone in Unclassified where its proposal saves; then Unclassified, No
  issuer, Merge confirms), **Procedures** (each procedure with its words, who set it and what it settled), **Reference**
  (All, Industry credentials, and the Initiated sign-off's two lanes until card 3). It opens on Held when the report
  holds titles, else on Reference; a quickstart hint opens Reference. UI pass: `docs/ui_pass_lessons.md` S413.

**The design** (S411 mock-up https://claude.ai/artifact/Gu6HTwqSwMYLSy4C4xRag3, source
`docs/visuals/2026-10-18-cer-procedures-mockup.html`): three views, **Needs you** (the exceptions, each with
its proposal, why it came, Accept · Change · Teach a procedure), **Procedures** (each rule with who set it,
what it settled and held, See what it did · Turn off; Add a procedure with a free preview), **Reference**
(search, two filters, a Decided by column). The run's report already carries each view's numbers.

**What the S411 map found** (counts from `kb/exhibit_audit/latest.json` of 2026-10-17 and
`kb/unclassified_fold/2026-10-17/report.json`):

- **The fold has applied nothing since 2026-07-08.** `kb/_fold_unclassified.py --apply-if-safe` is all-or-nothing
  (`v1 = not conflict`): 18 conflicts hold back 176 clean saved assignments, 157 credential adds and 12 supersedes.
  The tab's copy promises they fold "automatically on the next daily refresh."
- **The backlog grows about 200 a month:** 241 unclassified (2026-07-16), 1,015 (09-25), 1,498 (10-17). No new KB
  entry since July; the last curator assignment is 2026-07-12.
- **A procedure's write shape to copy, when one may save:** `cer-decision-apply.yml` (a plan under a
  `<lane>-s<N>@bot` cohort, a fresh read that holds a curator's change, a receipt before the insert, rollback
  by cohort). `kb_curation` has no reason column; Sheet 3 card 10 (2026-09-29) asked for a CER decisions store
  routed through Governance (DR-07).

**RULED (Sam, Open Asks Sheet 94, 13:42-13:43Z 2026-10-18, each his own call; `cpl_memory`
`sam-sheet-94-rulings-2026-10-18`):**

1. **apply:** the fold applies the clean assignments and holds only the conflicts.
2. **save:** a result the classifier is sure of saves under its procedure, reversible by procedure; this revises his
   2026-07-07 ruling that pre-seeds stay "ready to save, not yet saved".
3. **retire:** the Initiated sign-off and the Curate panel leave the tab.

**RULED (Sam, Open Asks Sheet 96 card 1, 17:23Z 2026-10-18, his own call; `cpl_memory`
`sam-sheet-96-rulings-2026-10-18`): keep.** A rule procedure's settlement saves at the rule's word, the course-identity
rule's 0.8 included (the college's own course title for a code-only title; 96 of its 125 on the preview);
`python3 kb/_cer_procedures.py --undo course-identity` stays the reversal. The sheet: https://claude.ai/artifact/Gta7x4T2NfFwbymH4nddui.

**Sam's rulings, Open Asks Sheet 148** (https://claude.ai/artifact/NnrRFjJVpMLd2NQt84GFX5, completed 12:09Z 2026-10-31,
both his own call; `cpl_memory` `sam-sheet-148-rulings-2026-10-31`): card 1 *note*, the page is the **Credential Catalog**;
card 2 *link-retire*, link it from the Library and the public header and retire the CER and EACR tabs. Built by
SkyTwinberry the same hour: the name, `noindex` dropped, a *Credential Catalog* line in `header.html` and on every page
carrying the header, the Library's own Links. The two tabs were already off the side menu: Sam hid both `cobi_nav` rows
himself at 23:51Z 2026-10-30, and they still open at `#credential-reference` and `#exhibit-adoption`; their files stay.

**NEXT:** (1) **NEEDS SAM (Open Asks Sheet 149):** (a) the AP fold in the reference: 74 local titles under
non-official AP twins (*AP U.S. History*, *AP Calculus BC — AB Subscore*, *AP Physics 1*) move to College Board's names,
46 of them stamped (`python3 kb/_ap_official_titles.py` lists them); (b) running a rule from the Exhibits tab: the
recommendation is a request row the tab writes and a routine that builds the rule, runs the dry run and writes it back
for *Turn on* or *Discard*. (2) IB on the AP pattern, then CLEP's official names. (3) The Catalog's *Courses that may
align*, once a source names courses. (4) Training sites for a held title new to the reference, and the *Held titles by
group* table, only if Sam asks.
