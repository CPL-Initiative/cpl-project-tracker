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

**The Exhibits tab's Review queue — built (SkyRowanberry, 2026-10-31).** COBI tab `#exhibits` (`exhibits.js`), in
Reference & Curation after the Commons and linked from the Commons' CER row (*Open Exhibits*); the CER and Exhibit
Adoption stay, and the view line links both. It draws the card of version 26: the *What is it called?* tiles (Names,
Aligned course, Students waiting), the step tiles as filters with their plain hovers, *Go to an exhibit*, and one card
per held title: the canonical title editable and in focus, issuer, training site (read from the reference; editing it
is the credential panel's, build step 2), the local titles, *Articulated at* and *Could adopt* chips, students, the MAP
source. Its data:

- `kb/_build_exhibits_review.py` writes `kb/exhibits_review.json` (one held title a line) and
  `kb/exhibits_review_courses.json` (a could-adopt chip's courses, by identity, fetched on the first click), from the
  procedures run's `needs_you`, `kb/unclassified_suggestions.json` `aligned`, `statewide_data.js`,
  `unified_courses_members.js`, `kb/unified_titles.json` and `kb/credentials.json`. An aligned course names the
  proposal (*C-ID ARTS 250*) and the classifier's title stays beside it with *Use it*; a conflict proposes the
  reference's title; a title the fold settled or a person saved since the run leaves the queue. Run at the end of
  `cer-procedures.yml` and in `daily-dashboard.yml`. Measured on the 2026-10-30 run with the 2026-10-31 `aligned`
  (a local build): 468 held, 209 aligned, 466 with an exhibit ID, 162 with same-identity adopters.
- **Students:** `exhibit_title_students(p_keys, p_ids)` (`kb/migrations/2026-10-31_exhibit_title_students.sql`,
  applied 2026-10-31 through the MCP), distinct students in `map_student_credit` per title, an allowed reviewer only,
  k=10 inside the function (1 to 9 return null and *suppressed*, 0 returns 0), so the page never holds a count under
  ten and the public file holds none. Verified live: 442 (Digital Media), 398 (AP Computer Science A), suppressed for
  the Juvenile Justice pair, no rows for a non-reviewer, no execute for anon. Governance: `rpc:exhibit_title_students`
  dismissed (a read under the base table's own gate) and `tab:exhibits` mapped to DR-07.
- **The buttons.** The current title is the exhibit's latest decision (its local title, or the title saved for a
  conflict); the proposed title is the box. *Change to Proposed Title* writes the CER's own two `kb_curation` rows
  (`_UNCLASSIFIED::<local title>`, title and issuer, merge on the key); *Keep Current Title* saves the local title as
  its own. On a conflict, *Change to Proposed Title* with the reference's title clears the saved assignment (the CER's
  *Keep the reference's title*); keeping the saved title, or any other title, re-keys a person-reviewed entry and stays
  a session's reviewed change, which the card says. *Teach a rule* copies the rule in plain words for a session.
- Not yet drawn from version 26: the *Held titles by group* table (one rule, accept as a group, 25 at a time).

**Drawn in version 26 (2026-10-31):** each could-adopt college chip is a button that opens that college's aligned
courses (the identity's members there, from `unified_courses_members.js`, units or noncredit) and the Request Quick
Adopt link to the held exhibit's ID; a college EACR lists without a same-identity course reads that its faculty
choose the course.

## Status

🔨 **Sheet 94's three rulings are on main (built S416, merged S417 as b36286d7 at 16:50Z 2026-10-18): the fold holds each conflict by itself, a sure result saves under its procedure, and the Initiated sign-off and the Curate panel left the tab.**

**The first saving run landed (S418, `cer-procedures.yml` run 39150222312, 17:37Z 2026-10-18), on Sam's Sheet 96 ruling (17:23Z, *keep*; `cpl_memory` `sam-sheet-96-rulings-2026-10-18`): a rule procedure's settlement saves at the rule's word, the course-identity rule's 0.8 included.** 926 titles saved to `kb_curation` as 1,852 rows (a title row and an issuer row each) under 7 cohorts: classifier 737, course-identity 125, brand-family 53, nccer-verbatim 5, statewide-catalog 3, cslb-classification 2, apprenticeship-trades 1; none held by a live row, none a duplicate; receipt `kb/cer_procedures_out/saved/saved_2026-10-18T17-37-29Z.json`. The dispatch waited on #2232: the workflow's options list read a bare on and off as YAML booleans, so GitHub offered true, preview, false. The run's tallies: queue 1,498, waiting 1,322, proposed 1,287, Needs you 414, 0 not yet asked. The daily run of 17:44Z (run 39150946369), the fold's first apply since 2026-07-08, folded 1,102 assignments (the 176 that waited and the 926 the saving run wrote), 12 supersedes and 455 credential records, held the 18 conflicts, and left the reference at 4,915 titles (`kb/unclassified_fold/2026-10-18/applied.json`). The procedures run is live, the classifier has made two passes (S412, S413), and the tab is three views: Needs you, Procedures, Reference (#2221, S413).

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
  their words. Seven **rule** procedures settle a title by code, in order: brand families, the statewide
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
- **First pass (run 39097682221, 2026-10-18):** 75 calls, all answered, $8.30. Of 1,322 waiting titles, 1,116
  pre-fill (the rules 189, the classifier the rest) and 428 are held for Sam, mostly "the classifier is unsure";
  105 were dropped by an exact match on a non-breaking space. A 30-answer sample: the sure band (606) is right; the
  middle (311) plausible; the low band (111) is mostly code-only titles.
- **Follow-up pass (run 39103573166, S413, `classify=200`):** 13 calls, $2.67. 1,287 of 1,322 pre-fill, 396 held,
  none left unasked. The 105 dropped answers came back (#2219's spacing-free match, landed in #2220); the 195 hinted
  code-only titles read at 0.8 to 0.9. One to watch: *Industry for GDDM 53* took the course's title (*Adobe Photoshop 1*)
  where the credential tied to the course was meant; lessons S413.
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

**NEXT:** the redesign in Sam's Sheet 147 order, Review built (above): (1) read the first published
`kb/exhibits_review.json` (the daily run after the merge, then each night after the procedures run) and Sam's first
saves from the card; the *Held titles by group* table if he asks for it; (2) the credential panel with issuer and
training sites editable (a training site for a new title needs a field the fold reads; today only
`training_agency_override` on an existing credential exists); (3) EACR folds in; (4) the public adoption page on
settled credentials only, in Malone's CPL/AI look, its name still Sam's to give. Watch the first nightly save of
`high-school-rop` (expected 55) and read its receipt.
