---
title: Audit by rendered value, not by file — thousands of failures collapse to a few source lines
created: 2026-09-04
updated: 2026-09-04
tags: [methodology, accessibility, audit, ui, tooling]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/public_pages_a11y_lessons]]"
artifacts:
  - scripts/check_cobi_header_layout.js
  - scripts/a11y.js
---

# Audit by rendered value, not by file — thousands of failures collapse to a few source lines

> **One-sentence summary** — A rendered-surface audit counts *instances*, which
> makes any systemic defect look impossibly large; clustering the findings by the
> offending VALUE rather than by file or view converts an unfaceable backlog into
> a short list of edits, and usually reveals the defect is one decision, not many.

## The claim

**Rendered counts measure repetition, not work.** A dense grid paints the same
CSS rule thousands of times; an audit walking the DOM reports thousands of
failures. Both numbers are true and the second one is useless for planning,
because the remediation cost tracks *source sites*, not renders.

**So cluster by value first.** Group failures by the computed property that
failed — the exact color, the exact size — then count the source occurrences of
each. The ratio between them is what decides where to start, and it is routinely
three orders of magnitude.

**Do that before you triage anything**, because the clustering usually
reclassifies the problem. A list of failing views suggests a long remediation
per view. The same data clustered by color revealed a *single unreconciled
palette*, which is one decision.

## How we got here

An accessibility sweep across 38 COBI views (2026-09-04) reported ~7,000
contrast failures. Clustered by text color, the top five values accounted for
~97% of them — and grep put those five values in roughly **270 source lines**.
The single worst, `#94a3b8` at 2.34:1, produced **4,827 rendered failures from
32 occurrences in 4 files**: 65% of everything, from half a screen of CSS.

The clustering also identified *what* the defect was. These were not First Light
tokens misused; they were a Tailwind-family slate/grey palette in **raw hex**,
living in two tab modules — a second, unreconciled palette that had bypassed the
design system entirely. `CLAUDE.md` already forbids raw hex in new CSS; the
audit showed where that rule had been arriving too late.

## When this applies (and when it doesn't)

**Applies** to any audit over a rendered surface where one rule paints many
nodes: contrast, target size, font sizing, spacing, focus styling. Also to lint
output over generated files.

**Does not apply** where each finding is genuinely independent — a missing
`aria-label` is usually per-control, and clustering by "no name" tells you
nothing about the fix.

**⚠️ It does not license trusting the totals.** The same sweep double-counted
shared chrome (the nav rail measured again on each of 38 views) and flagged
inline targets that WCAG 2.2 SC 2.5.8 exempts — so its absolute numbers were
wrong while its *ranking* was sound. Clustering is robust to that kind of
harness error precisely because the source-site counts come from grep, not from
the DOM walk. Report the ranking; verify a total before quoting it.

## Confirmed, and now built in (2026-09-04)

A purpose-built sweep (`npm run a11y`, 42 views) re-measured the same surface
and the ratio held: **4,042 sub-24px targets across COBI collapse to 54
selectors**, and 2,200 of those renders are ONE button in one dense grid
(`button.cr-title-toggle`). The remediation list is 54 lines long, not 4,042.

Two refinements the second pass taught:

- **Do the clustering IN the harness, not after it.** The measurement now keys
  on selector + size and reports "distinct kinds" beside the raw count, because
  a reader given 4,042 findings does not cluster them — they stop reading. The
  raw number is kept: it is what says how much of the surface is affected.
- **Shared chrome is the same insight one level up.** The rail, the search box
  and the brand link were 41 findings each *because* they paint on every view;
  fixing five source lines cleared about 200 findings at once. A finding that
  appears on every route is not 38 problems — it is one, and it is the one to
  fix first.

## See also

- `[[docs/public_pages_a11y_lessons]]` — the sweep, its findings and its flaws
- `[[docs/kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument]]`
  — the other half: how much of a first run is the harness rather than the page
- `[[docs/kb-notes/methodology-a-rule-you-wrote-is-not-a-rule-you-applied]]`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
