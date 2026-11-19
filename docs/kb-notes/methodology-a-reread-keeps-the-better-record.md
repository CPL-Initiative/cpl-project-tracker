---
title: A reread keeps the better record
created: 2026-11-19
updated: 2026-11-19
tags: [methodology, reread, data-quality, program-requirements-harvest]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/methodology-a-self-check-must-see-what-the-rule-writes]]"
artifacts:
  - kb/program_requirements_reread_plan_s683.json
  - docs/program_requirements_harvest_lessons.md
---

# A reread keeps the better record

> **A paid re-read of a filed record is a candidate, never a replacement: compare it with the record it would replace and keep whichever is better.**

## Context

The program requirements harvest re-reads records whose first read went wrong, after a reader fix. S683 ran the
first wave of these rereads (444 records planned at 73 colleges). Lessons doc: [S683](../program_requirements_harvest_lessons.md).

## The claim

A reader fix aimed at some records reaches others too. A college's re-read covers every program the reader reaches,
and some of those were right before the fix. Writing every re-read over its filed record trades known-good rows for
unknown ones. So the step after the paid read compares each re-read with the filed record and restores the filed one
when the re-read is worse, or when it does not name the program it was read for (a sign the reader landed on another
program's page). Only a re-read that is at least as good replaces.

Two consequences follow. A reread replaces and never inserts: a program with no live row needs the ordinary load
after it. And a replaced row takes its labels with it, so any gap label applied to the old record has to be applied
again to the new one.

## How we got here

The S683 plan said to pay only when a college's preview listed its aim rows. Previews listed every program the reader
reached, many passing, so the condition failed as written. The conductor paid within $40 a college and added
`kb/_program_reread_keep_better.py` (two review rounds, 6 findings fixed). Across 15 colleges the wave replaced 133 rows
and inserted 72 by load. The labels finding came the same night: live `catalog_figures_differ` read 19 of the 21 rows
a named-gaps apply had labeled hours earlier.

## When this applies (and when it doesn't)

Any second read of a source over records already filed: program requirements, course outlines, catalog fields. It
does not apply to a first read (nothing to compare), or where a person settled the filed record: a person's save is
terminal and a re-read never replaces it.

## See also

- [A self-check must see what the rule writes](methodology-a-self-check-must-see-what-the-rule-writes.md)
- [Program requirements harvest lane](../reference/lanes/program-requirements-harvest.md)
