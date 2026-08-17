---
title: One assistant, three files — compare them in a test or they drift
created: 2026-08-17
updated: 2026-08-17
tags: [methodology, drift, testing, design-system, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_surface_alignment_lessons]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - tests/sierra_surfaces_aligned.test.js
---

# One assistant, three files — compare them in a test or they drift

> **One-sentence summary** — When one product surface is implemented in several
> standalone files, the only thing that keeps them saying the same thing is a
> test that reads both and compares them; a rule written down, applied once, and
> trusted thereafter will hold on exactly the file the author had open.

## Context

Sierra is mounted by three files with no module boundary between them:
`cpl_chat.js` (the dashboard), `sierra/sierra.js` (the standalone page) and
`fact-sheet/factsheet_sierra.js` (the Fact Sheet drawer). A design rule was
applied to the first in one PR. The other two kept the old presentation for a
week, and the divergence was found by a person looking at two screens.

Story: `docs/sierra_surface_alignment_lessons.md`.

## The general failure

This is the same shape as two other findings already in this vault, and naming
the family is the point:

- *"A recorded rule is not an applied rule"* — the no-glyphs rule sat in
  `cpl_memory` while a tab shipped covered in emoji that same week.
- *"A settled ruling does not enforce itself, the consumer has to change"* — the
  statewide-source ruling was recorded, and the sync that predated it was never
  rechecked.

Adding: **a rule applied to one implementation is not applied to the others.**
Documentation, memory rows and PR descriptions all describe intent. Only a test
that reads *both* artifacts can assert agreement.

## What to compare

Not everything — pick the values where divergence has a **user-visible
consequence**, and where the two copies are genuinely supposed to be identical:

- **Shared-key state.** The strongest case. Sierra's audience pick persists
  under one same-origin key and travels to the same backend, so a visitor can
  choose "Faculty" on one surface and meet a differently-worded list on another.
  A label difference here is one assistant introducing itself two ways to the
  same person.
- **Anything a rule was just applied to.** If a design rule crossed one file
  this week, that is exactly the value most likely to be inconsistent now.
- **Anything the backend keys on.** Divergent option *values* (as opposed to
  labels) are a routing bug, not a cosmetic one.

Deliberately *not* the whole file. These are separate implementations for good
reasons — different hosts, different CSS, different chrome — and asserting they
are identical everywhere would be a bound that rots on the first legitimate
divergence.

## Pair every negative assertion with a positive one

A scan for what must be **absent** passes trivially on emptiness. Strip the
glyphs and blank the labels and the glyph scan still goes green. So:

- assert the forbidden thing is gone, **and** that the replacement is present;
- assert sibling states stay **distinct** from one another — collapsing two
  labels into one satisfies both of the above and is still wrong;
- if the check iterates a collection, require the collection's **size** in the
  same condition, because `.some()` and `.every()` are vacuously true on an
  empty list. (An unbooted page renders zero controls and passes everything.)

## Read string literals, not lines

When scanning source for a presentational property, walk the source tracking
quote state and inspect **string literals**. Line-based scanning trips on prose
in block-comment headers and on trailing notes beside real code — and the fix
for that ("skip comment lines") then makes it impossible for a comment to
explain *why* a character was removed by naming it.

⚠️ A literal walker must skip **regex literals**. A regex containing a backtick
or a quote will desync a naive walker for the rest of the file, silently turning
code into "strings" — and a scanner that has lost sync can swallow the very
thing it was written to find. A wrong scanner is worse than no scanner.
