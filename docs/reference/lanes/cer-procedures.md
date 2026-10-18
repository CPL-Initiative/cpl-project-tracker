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

🔨 **Designed, not built (S411).** Mock-up: https://claude.ai/artifact/Gu6HTwqSwMYLSy4C4xRag3 (source
`docs/visuals/2026-10-18-cer-procedures-mockup.html`): three views, **Needs you** (the exceptions, each with its
proposal, why it came, Accept · Change · Teach a procedure), **Procedures** (each rule with who set it, what it settled
and held, See what it did · Turn off; Add a procedure with a free preview, Try it on the queue), **Reference** (search,
two filters, a Decided by column). Leaving the tab: the Initiated sign-off (its tooltip says it changes nothing), the
Curate panel (it repeats the row's editing), seven view chips become three words.

**What the S411 map found** (research read, 2026-10-18; counts from `kb/exhibit_audit/latest.json` of 2026-10-17 and
`kb/unclassified_fold/2026-10-17/report.json`):

- **The fold has applied nothing since 2026-07-08.** `kb/_fold_unclassified.py --apply-if-safe` is all-or-nothing
  (`v1 = not conflict`): 18 conflicts hold back 176 clean saved assignments, 157 credential adds and 12 supersedes.
  The tab's copy promises they fold "automatically on the next daily refresh."
- **The backlog grows about 200 a month:** 241 unclassified (2026-07-16), 1,015 (09-25), 1,498 (10-17). No new KB
  entry since July. 3,813 raw titles fold into 1,986 unified titles.
- **The classifier was never wired:** no workflow calls `classify_exhibits.py`. The mechanized rules: the pre-seed
  lanes (`kb/_preseed_unclassified.py`, `kb/_preseed_null_issuers.py`, last staged 2026-07-07 and 07-09), the
  suggestions (`kb/_suggest_unclassified.py`, daily), Trail Crew (`kb/_trail_crew.py`), Jev's `CER_RULES`.
- **A procedure's shape to copy:** `cer-decision-apply.yml` (a plan under a `<lane>-s<N>@bot` cohort, a fresh read that
  holds a curator's change, a receipt before the insert, rollback by cohort) for the writes; the reconcile steps
  (`kb/program_requirements_reconcile.json`) and `sierra_guidance` rows for where a rule lives and who adds it.
  `kb_curation` has no reason column; Sheet 3 card 10 (2026-09-29) asked for a CER decisions store routed through
  Governance (DR-07).

**NEEDS SAM** (Open Asks Sheet 93, three cards):

1. Let the fold apply the clean assignments and hold only the conflicts (proposed: yes).
2. Let a result the classifier is sure of save under its procedure, reversible by procedure; this revises his
   2026-07-07 ruling that pre-seeds stay "ready to save, not yet saved" (proposed: yes).
3. Retire the Initiated sign-off and the Curate panel (proposed: yes).

**NEXT:** read Sheet 93's replies; then the build, as the UI pass on `cobi:credential-reference`: the fold change
first (a test that a conflict holds only itself), then the procedures store (a committed `kb/cer_procedures.json`
seeded from the skill's rules and Sam's rulings, each with its words and date), the nightly classifier run under a bot
cohort with a receipt, and the tab's three views.
