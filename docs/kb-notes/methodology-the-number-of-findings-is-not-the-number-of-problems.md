---
title: "The number of findings is not the number of problems — rank an audit by blast radius before you read it"
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, accessibility, tooling, triage, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-token-with-two-jobs-cannot-be-themed]]"
  - "[[docs/reference/lanes/cobi-dark-mode]]"
---

# The number of findings is not the number of problems

Any audit that walks a product surface-by-surface reports **occurrences**. The
work is measured in **causes**. When shared code paints every surface, those two
numbers differ by more than an order of magnitude, and reading the report in the
order it was written means fixing the least important thing first.

## The measurement

COBI's first dark-mode accessibility sweep, 2026-09-08:

| | |
|---|---|
| Routes failing | **38 of 38** |
| Findings | **511** |
| Distinct selectors | 252 |
| Findings from the top **six** selectors | **~227** |

Six selectors were 44% of the report. They were not subtle: the rail's tab
links, the rail wordmark, the sign-in line, the To-Do button, First Light's
button, and every `h2`/`h3`. All six live in **shared chrome** — code that paints
on every tab — so one CSS line is 38 findings, and the report lists it 38 times
without ever saying it is one line.

The remaining 246 selectors were 1–9 routes each: real, but each one a tab's own
CSS and worth a fraction of the same effort.

## Why reading it in order fails

The report is grouped by **route**, because that is how it was gathered. Route 1
fails on six shared selectors plus two of its own; so does route 2; so do all 38.
A reader working top to bottom starts on route 1's private CSS having never
noticed that six of its eight findings will vanish when a single rule changes.

Worse, the fixes look like they are not working. Fix a route's own fault and the
total drops by one out of 511 — which reads as no progress at all, on a report
where a single well-chosen line drops it by 38.

## The rule

**Before reading an audit, group it by cause and sort by how many surfaces carry
each one.** Then work top-down, and re-measure after each cause rather than at
the end, because the count is the only proof the cause was really the cause.

Three signals do most of the sorting:

- **A selector on *every* route is shared chrome.** One rule fixes all of them.
- **A ratio repeated *exactly* across routes is one color, not many.** `1.74:1`
  on 38 routes is a single hex, wherever it lives.
- **A fault on one route is that surface's own code**, and it is worth exactly
  one route's attention.

## Two cautions the tooling should carry

⚠️ **Name the shape as a question, never a diagnosis.** A report cannot see the
CSS. On the run above, "shared chrome" was read as "fix `.cpl-tab`" — and
`.cpl-sidebar .cpl-tab` was the rule that actually painted the rail, so the sweep
came back unchanged. *Fixing the rule you found is not fixing the rule that
applies.*

⚠️ **Key the grouping on the stable part.** The obvious key — the whole finding
string — contains the element's label and its measured box, which differ per
route and per width. Keyed that way, 511 findings collapse into 500 "causes" and
the ranking says nothing. Keyed on the selector alone they collapse into 252, and
the top six are visible immediately.

## Worked implementation

`scripts/a11y_triage.js` in `cpl-project-tracker`, driven by
[`/a11y-pass`](../../.claude/commands/a11y-pass.md). It reads a **saved** report
rather than re-measuring, so triage is free and can be re-read; run against the
pre-fix report above it reproduces all six root causes, in the order they should
be worked, in about a second — against the two manual re-reads it took a session
to find them by hand.
