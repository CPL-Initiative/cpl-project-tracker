---
title: "A measured count verifies a rebuild of lost work"
created: 2026-10-23
updated: 2026-10-23
tags: [kb-note, methodology, sessions, harvest]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[program_requirements_harvest_lessons]]"
---

# A measured count verifies a rebuild of lost work

## The problem

A session's change can die with its container: the scorer rule S457 built, the 267 records it rescored and the receipt
it wrote were described on its pull request and never pushed. The next session has the words and no code.

## The method

Rebuild from the written rule, then accept the rebuild only when a number the first session measured comes out the
same. S457 wrote three: 258 program totals and 9 electives-filled degrees read under the narrow rule, 738 under the wide
one, Hartnell 7 of its 31 failures. The rebuild found 258, 9 and 7. A different count is a different rule.

## What it needs

A rule stated in plain words on the pull request or in the lessons doc, and at least one count measured over the same
data. Write both at the time of the build: the count is cheap then and priceless after.

## Where it was used

cpl-project-tracker#2387 (S459, 2026-10-23): `program_verdict()` in `kb/_program_requirements_score.py`, the rescore
receipt `kb/receipts/program_requirement_records_rescore_2026-10-23_s457.json`.
