---
title: A not-applicable score must be confirmed by the source
created: 2026-10-04
updated: 2026-10-04
tags: [methodology, scoring, program-requirements, extraction]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_program_requirements_score.py
  - tests/program_requirements_pilot_test.py
---

# A not-applicable score must be confirmed by the source

> **When a check cannot apply to a record, the scorer passes it only after the
> source itself shows there was nothing to check; the record's own silence is
> never enough.**

## Context

The program requirements harvest scores each extracted record on unit
arithmetic: the blocks must add to the total the catalog states. Mt. San
Antonio's Vocational Nursing certificate prints no hours, no units and no
total, so no record of it can reach "equal". The scorer needed an outcome for
that case. See [`docs/program_requirements_harvest_lessons.md`](../program_requirements_harvest_lessons.md),
lesson 27.

## The claim

A third outcome ("unstated", "not applicable", "nothing to compare") is a hole
unless something outside the record confirms it. A record that leaves every
figure blank looks the same whether the source printed none or the reader
dropped them, and the blank record is the one an extractor produces when it
fails.

So the scorer passes "unstated" only when three independent facts agree:

- **The record carries no figure.** No total, no block total, no course units.
- **The reference list stores none.** The state's course file holds 0 or no
  units for every listed course, which marks a noncredit program. A credit
  program's units are on file, so its record can never be "unstated".
- **The source text names none.** No "136 Hours", "4.5-9 hours" or "6 units"
  anywhere in the catalog text the record was read from.

The scorer reports the outcome by name (`status: "unstated"`) rather than as a
plain pass, so a person reviewing the records sees which ones passed on that
path.

## How we got here

Extraction run 1 (37167619551) wrote Riverside City's Food Service certificate
with every course's hours blank and no total, though the catalog prints 246
hours. Two shortcuts were tried against run 1's records before the rule held:

- Passing any record with no figures would have passed that Riverside record.
  The source-text check fails it, naming "240 Hours".
- Checking the record and the text alone would have passed a credit record
  stripped of its units, because a catalog's table of units often prints bare
  numbers ("3.0") that no "N units" pattern finds. The reference-list check
  closes that path: stripping every figure from each of run 1's credit records
  failed all of them.

Mutating the reference-list condition out of the scorer flips the guard's
credit-record check, and the guard re-scores every filed record on each run.

## When this applies (and when it doesn't)

Any scorer, audit or test with an outcome that means "this check had nothing to
check": a dedupe with no candidates, a contrast check on a page with no text, a
coverage figure with an empty denominator. Look for a second, independent
witness of emptiness. The source is the best one, and an authoritative reference
list is the next.

It does not apply when emptiness is the expected, verified state of every
record (an audit run against a list known to be empty); there the outcome is
the normal case, not an exception to defend.

## See also

- [`docs/program_requirements_harvest_lessons.md`](../program_requirements_harvest_lessons.md): lessons 27 and 28
- [`methodology-a-capped-list-must-never-read-as-a-census`](methodology-a-capped-list-must-never-read-as-a-census.md): the same posture toward a number that looks complete
- PR #1845: the scorer's version 2

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
