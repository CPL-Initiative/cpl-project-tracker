---
title: "Session 392 handoff: Sheet 81, San Joaquin Delta's extraction, Palo Verde's 2026-27 read after Sunday"
date: 2026-10-14
session: 391 (SkyJuniper)
tags: [handoff, program-requirements, acalog, catalog-year, decision-sheet, ui-pass, pii]
status: current
superseded: true
superseded_by: session_394_handoff.md
---

# You are Session 392

Your moniker is **SkyTamarack**. Session 391 (**SkyJuniper**, `session_014Q86kDoJ8LW6PDGshzAWWm`) wrote this at a
context checkpoint (about 109,000 tokens left). Run `list_sessions` first, and agree on one writer with any session still working.

## What shipped (S391)

- **Session 390's queue merged:** #2121 (Records filters), #2120 (Fresno City, 211 records, displayed), #2122 (checkpoint), and
  CPLBrain #343 (braindump).
- **#2123 / CPLBrain #344:** Sheet 80 card 4. Who may read the sign-in email of a reviewer who tables a project
  (`project_lifecycle.updated_by` is public; one RCCD reviewer's sign-in is already public on 3,222 rows of four other tables;
  `cpl_memory` `reviewer-emails-public-read-measured-2026-10-14`).
- **#2124:** the UI pass on Program Requirements. Clean in light and dark at every width. The view switch, the verdict's actions,
  the record toggles and Expand/Collapse are underlined words now. New a11y target `program-requirements-filter` (light and dark).
- **#2125 / CPLBrain #345:** San Joaquin Delta's catalog year. The Acalog reader reads the year from the catalog's own menu (the
  option for its catoid; *Summer 2026 - Summer 2027 College Catalog* reads 2026-2027), and only where the registry names none.
  Re-run 38619208635 filed 2026-2027: 203 of 233 programs found, 125 at full coverage. The harvest lane was compacted
  under its budget.

## Decisions Sam made this run

None. Sam wrote only the opening line. Sheets 79 and 80 had no replies when they were superseded.

## Priority, in order

1. **Read [Open Asks Sheet 81](https://claude.ai/artifact/ExZErAUjsA1vh4kLHRfkt3)** (current; no replies at publish, 19:24Z).
   Cards: 1 *count* (degree total inside the span, 31 records), 2 *adt* (Palo Verde 5), 3 *extract* El Camino, 4 *public* or
   *reviewers* (reviewer sign-in emails), 5 *extract* San Joaquin Delta (about $12 to $22). Carry out each answer, and change its lane marker in
   the same PR (tracker first, then the vault). Card 4 *reviewers* means a column grant on five tables, plus the ledger and browser
   reads dropping `updated_by`: draft it as a paste for Sam, because `apply_migration` has been timing out.
2. **Palo Verde's 2026-27 catalog** after Sunday's census apply (2026-10-18 10:29 UTC): read all 52 with `extract=1` through the
   Acalog reader (it now reads the catalog year too), then `step=reread`.
3. **The UI pass:** `python3 scripts/ui_pass.py --next` names **GR Priorities** (never passed).
4. A `cpl_memory` row (`reviewer-emails-public-read-measured-2026-10-14`) calls the 43 `team_members` emails public *by design*.
   That is S391's inference; a guard blocked the correction. File a corrected row if it matters.

## Docs to read

- `docs/program_requirements_harvest_lessons.md` (S391 section)
- `docs/reference/lanes/program-requirements-harvest.md`, `docs/reference/lanes/workplan-annual-goals.md` (the card 4 marker)
- `docs/ui_pass_lessons.md` (S391)

## Patterns that worked

- A capture-only dispatch (`extract=0`) reads a page the session's proxy refuses, and the report it files on the branch is the
  evidence. `limit` does not shorten an Acalog capture (it reads every program page, about 25 minutes).
- Before you call an a11y pass proven, check the seeded state rendered. A browser probe of the seed (scratch script: serve the
  repo, run the target's `seed`, query the DOM) confirmed the open dropdown. The greeting modal over a screenshot does not void
  the contrast and target checks.
- When a sheet gains a card, read the old store first, publish a fresh `SHEET_ID`, keep earlier cards at their positions, and
  point §11 and every lane link at the new sheet in the same PR.

## Subscriptions and check-ins

S391 dropped every watch at this checkpoint: #2125, CPLBrain #345 and its safety-net check-in are closed out. Sheet 80 and Sheet 81
were published with artifact wake subscriptions; they wake this session only on a republish or a comment sent to Claude. No
check-in is armed. Subscribe to each PR you drive. The CPL Queue routine fires next at 2026-10-15 05:12 UTC.
