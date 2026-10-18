---
title: "CER procedures and the simpler CER tab — lane state"
created: 2026-10-18
updated: 2026-10-18
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

## Status

🔨 **Sheet 94's three rulings are built (S416, 2026-10-18): the fold holds each conflict by itself, a sure result saves under its procedure, and the Initiated sign-off and the Curate panel left the tab.** The procedures run is live, the classifier has made two passes (S412, S413), and the tab is three views: Needs you, Procedures, Reference (#2221, S413).

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
  (tallies and the Needs-you list). **Nothing saves**: every proposal pre-fills (Rule 5e).
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

**NEXT:** watch the first saving run (the receipt in `kb/cer_procedures_out/saved/`, the tab's Unclassified lane
showing the cohort as the saver) and the next daily fold carrying the saved rows into the reference; then the 18 fold
holds, one word each on Needs you. A guidance procedure for an *Industry for* title (the credential tied to a course,
never the course's own title) is a candidate.
