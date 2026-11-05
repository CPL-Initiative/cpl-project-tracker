---
title: A renamed family is not a correction
created: 2026-11-04
updated: 2026-11-04
tags: [methodology, commons, procedures, confidence, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[commons]]"
artifacts:
  - kb/_build_commons_status.py
  - kb/cer_procedures_out/saved/
  - kb/unified_titles.json
---

# A renamed family is not a correction

> **One-sentence summary**: when you measure how often a person overrules a procedure, count a result whose whole family a person renamed or merged as kept, or the measure reads most of the procedure's good work as mistakes.

## Context

The CPL Commons' confidence count (S573, 2026-11-04) asks what a person did with each procedure's work afterward, so a
procedure can earn trust with evidence. The Exhibit procedures had placed 1,178 titles; a person had since stamped 94.
A plain comparison of the title each receipt saved against the title each row carries now read 71 of the 94 as changed.

## The finding

A sample of the 71 showed no corrections at all. Each was a person renaming or merging the common title the whole family
shares: *Class Piano I* to *Class Piano 1*, *AP U.S. History* to *AP United States History*, a family folded into
another. The procedure had put the title in the right family; the family's name moved. Of the 638 families the
procedures named, none has since been split.

## The rule

A result a person has looked at is one of three things:

1. **Kept**: it sits where the procedure put it.
2. **Renamed with its family**: its old common title no longer exists anywhere in the reference, and the other titles
   that shared it moved to the same new one.
3. **Moved**: it left its family while the family stayed, or its family split and it went the minority way. Only this
   counts against the procedure.

## Why the history has to come from receipts

`kb_curation` keeps one row per key and field (its primary key), so a person's save replaces the procedure's row and the
table forgets what the procedure wrote. The committed receipts each procedure writes (Rule 10) are the only record of
its original result, so the count compares receipts with the reference as committed now.

## Where it applies

Any measure of agreement between an automated step and a person's later edit: common exhibit titles, credit
recommendation groups, common course placements. Look for an edit that applies to the whole group before calling an
individual edit a correction.
