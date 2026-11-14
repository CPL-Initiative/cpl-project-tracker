---
title: "Stack scouting: one line per tool trial"
created: 2026-11-14
updated: 2026-11-14
tags: [reference, conductor, governance-team-enablement, scouting]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
  - "[[conductor_mode]]"
  - "[[governance-team-enablement]]"
---

# Stack scouting

**What this is:** the record of every outside tool, library or repo tried for the CPL stack, one line per trial, so a
later session can see what was tried, what it cost and whether it stayed.

**Where it started.** Sam, in session S652, about 15:50Z 2026-11-14: "Hoping Cobix can sniff out other repos that might
be helpful as we build out the stack". The conductor's four tests for a candidate are on issue #3306.

**The cadence (DECIDED `d-scouting-cadence-s653`, S653 conductor):** COBIx scans every other Monday, and off-cycle when a
cost is measured that a tool might cut. #3306 is the thread. A trial runs once, on one real task, and its line records
the measured cost and the result. A tool stays only when its line says kept.

## Trials

| Candidate | What it is tried on | Measured cost | Result | Kept or dropped |
|---|---|---|---|---|
| Serena (symbol-level code navigation) | the reader file `kb/_program_requirements_college.py` | not started | not started | not started |
| A session cost report | a checkpoint: tokens and model spend per worker | not started | not started | not started |
| pdfplumber | the PDF reader's wrapped headings | not started | not started | not started |
| pgTAP | rollback proofs for `kb/migrations/` files | not started | not started | not started |

Add a row when a trial starts; fill the cost and result when it ends; never delete a dropped row.
