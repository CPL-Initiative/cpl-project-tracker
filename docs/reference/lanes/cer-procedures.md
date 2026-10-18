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

🔨 **The procedures run is built (S412); the tab's three views are not.**

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
- **Measured on 2026-10-18 (rules only):** 1,498 in the queue, 176 saved and waiting on the fold, 1,322
  waiting; the rules settle 189 (125 by course identity, 53 brand families); 1,133 wait for the classifier.
  The pre-fill file had last been written 2026-07-07 (97 of 451 then).

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

**NEEDS SAM** (Open Asks Sheet 93, three cards):

1. Let the fold apply the clean assignments and hold only the conflicts (proposed: yes).
2. Let a result the classifier is sure of save under its procedure, reversible by procedure; this revises his
   2026-07-07 ruling that pre-seeds stay "ready to save, not yet saved" (proposed: yes).
3. Retire the Initiated sign-off and the Curate panel (proposed: yes).

**NEXT:** after the PR merges, dispatch `cer-procedures.yml` on `main` with `classify=15` (one call, the
smoke test), read its tallies, then `classify=1200` for the first pass. Read Sheet 93's replies; then the
fold change (card 1: a test that a conflict holds only itself), the save step if card 2 says so (a bot
cohort and a receipt, `cer-decision-apply.yml`'s shape), and the tab's three views reading
`kb/cer_procedures_out/latest.json`, as the UI pass on `cobi:credential-reference`.
