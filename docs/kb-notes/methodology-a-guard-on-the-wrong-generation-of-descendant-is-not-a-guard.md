---
title: "A guard on the wrong generation of descendant is not a guard"
created: 2026-09-15
updated: 2026-09-15
tags: [methodology, css, testing, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
---

# A guard on the wrong generation of descendant is not a guard

## The defect

The funding tab's Columns menu hides a main-table column by emitting, for a hidden
column at position `p`:

```css
.cplfund-table tbody tr:not(.cplfund-detail) td:nth-child(p) { display:none }
```

The `:not(.cplfund-detail)` looks like it protects the drill-in. It does not. It
excludes the detail **row**; the per-priority table is nested **inside** that
row's `<td>`, so its rows are still descendants of `.cplfund-table tbody` and are
not themselves `.cplfund-detail`. The rule matched their `p`-th cell too.

`COL_PREFS` ships `{ district: true, working_adults: true }`, District is main
column 3, and NC funding is detail column 3 — so on the **shipped default**, with
nobody touching the menu, every reader lost the noncredit cell, watched the
remaining cells slide one column left under the wrong headers, and saw Total
Possible render empty. It was reported as *"the NC Funding column shows FTES"*,
because what landed under that header was the Target cell.

## The rule

A guard placed on the wrong generation of descendant is worse than no guard,
because it **stops anyone looking**. The `:not()` read as deliberate care, so
nobody asked what it actually excluded.

Write the containment into the combinator, not into a negation: every hop from
the container to the cell is a child combinator, and nothing nested can be
reached whatever gets nested there later.

```css
.cplfund-table > tbody > tr:not(.cplfund-detail) > td:nth-child(p) { display:none }
```

## Why no existing test caught it

**The markup was always correct.** Every row emitted all eight cells; the parity
guard written the day before passes on this exact defect because it counts
`<td>` elements. The corruption happened at **paint**, from CSS, and jsdom does
no layout.

The one question jsdom *can* answer is whether a selector matches an element.
So the guard asks that directly — take the generated `<style>`, split it into
rules, and assert `Element.matches()` returns false for every cell of the nested
table. It fails on the original defect by name.

⚠️ Split the rules before testing them. Joining two rules into one selector
string concatenates `td:nth-child(3)` with the next rule's leading
`.cplfund-table` into a compound selector that matches nothing — which reads as
"the bug is fixed". That cost the first run of this diagnosis.

## Generalization

Any styling rule scoped by a descendant combinator reaches into every table,
list or grid nested inside its container. A class is an API (see
`a-styling-class-is-an-api`); a **combinator is a contract about depth**, and
descendant combinators promise nothing.
