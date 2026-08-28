---
title: A screen and its export must share a scope, not a shape
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, exports, csv, ui, data-integrity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-fixed-table-layout-off-pane-columns]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
---

# A screen and its export must share a scope, not a shape

> **One-sentence summary** — "the spreadsheet must match the screen" is right
> about *what information is present* and wrong about *how it is laid out*;
> deleting an export column to mirror a retired screen column can remove data
> rather than remove duplication.

## Context

The funding table retired its `NC $` column because it printed the same money
twice: a college's noncredit carve-out appeared in its credit row's `NC $` cell
**and** in its noncredit row's total. (The noncredit row's own cell rendered `↑`
with the hover *"the same money, summarized"* — the duplication was documented
rather than fixed.)

The obvious follow-through — *screen and export must agree, so drop the column
from the CSV too* — was **wrong**, and was stated out loud before it was
checked.

The screen could drop its column because it had gained a second **row** carrying
that figure. The CSV has **no noncredit rows**: it is one line per college. Its
noncredit column was therefore the *only* place noncredit money appeared in the
export. Removing it would have deleted the figure from every downstream
spreadsheet — silently, and in service of a consistency that was never the
requirement.

## The rule

**The invariant is scope: every fact present on one surface is present on the
other. The layout is free to differ, because the carriers differ.**

A table can move a figure from a column into a row. A flat export has no rows to
move it into. Two surfaces can be perfectly consistent while looking nothing
alike.

## How to check it

Before changing an export to match a screen, ask:

1. **What carries this fact on each surface?** A column, a row, a hover, a
   sub-line? If the screen's new carrier does not exist on the export, the
   export cannot follow.
2. **After the change, is the fact still reachable on both?** If the answer on
   either side is "no", the change is a deletion wearing a consistency
   argument.
3. **Is there a third surface?** A hover is a carrier too — the retired column
   held the college/standalone split *only* in its tooltip, which had to be
   relocated rather than lost.

## Leave the divergence explained

A screen and an export that deliberately differ will look like a bug to the next
reader, who will "fix" it. Comment the divergence **at the export site**, in
terms of the carrier:

> This export keeps its noncredit column even though the screen dropped one, and
> that is deliberate. The table pairs every institution as CR/NC rows, so a row
> carries the figure there. This CSV has no noncredit rows, so this column is
> the only place the figure appears. Removing it to match the screen would
> delete it rather than de-duplicate it.

## See also

- [`docs/cpl_funding_lessons.md`](../cpl_funding_lessons.md)
- The EACR precedent: filter, column and export drive off **one** function, so
  the spreadsheet cannot drift from the screen in *scope* — which is the half
  that must not drift.
