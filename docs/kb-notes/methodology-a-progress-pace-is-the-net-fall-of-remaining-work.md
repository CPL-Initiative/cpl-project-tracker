---
title: A progress pace is the net fall of remaining work
created: 2026-11-15
updated: 2026-11-16
tags: [methodology, measurement, commons, eta, progress]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/commons_lessons]]"
  - "[[docs/reference/lanes/commons]]"
artifacts:
  - commons_curation_eta.js
  - kb/_build_commons_status.py
  - kb/status/commons_history.json
---

# A progress pace is the net fall of remaining work

> **One-sentence summary** — a projected finish date must come from how fast the remaining work actually falls, and people's share of that pace counts only the confirmations that lowered it.

## Context

S661 built the Commons Curation ETA (#3375, merged `f44a0fcd`): a date for each common reference, from a daily series of its remaining work. Two easy measures each produce a confident date that is false. The story is in [`docs/commons_lessons.md`](../commons_lessons.md), S661.

## The claim

### The pace is net, over a fixed universe

Remaining work is the universe less what is settled. The pace is the fall of remaining work a day over a window (seven days here), net of new work arriving. A count of things done in the window is not a pace: when new titles or cards arrive as fast as old ones settle, the count grows and the remaining work stands still. A reference is dated only when its remaining work falls; one that does not fall shows that it does not, with the counts.

### People's share is min(confirmed, net fall)

A person's confirmation counts toward the pace only as far as it lowered the remaining work. A confirmation that moved none of it (the card reopened, or new work replaced it) is real labor and no progress toward the date. Any lever that scales people's work (a chip for more reviewers) multiplies that bounded share, never the raw confirmation count. A multiplier on raw confirmations invents a date.

### A universe that grows with the stamps hides all progress

Check that the universe does not move with the work it measures. The exhibit universe was the length of `kb/unified_titles.json`, and that file grows by exactly the titles stamped that day, so exhibit remaining never fell however much was stamped. The cause (S662, #3378): a title MAP carries with no entry joins the reference already stamped when a CER procedure classifies it, so the backlog sat outside the universe until the moment it was settled.

### Count the work not yet entered, and take the larger reading, never the sum

The universe must include the work that exists but has no entry yet: for exhibits, the audit's unclassified backlog. When the universe comes from two files written at different times (the reference's titles, and the audit's titles plus its backlog), the two overlap, since a title the audit saw may be stamped before the next audit. Take the larger of the two readings; their sum double-counts (COBIx on #3378). Work that arrives and settles between two readings counts as new work and settlement at once, which a net fall reads correctly. Stale entries left in the universe are a constant offset and do not bend the pace.

## How we got here

`commons_curation_eta.js` reads `pairs` (universe and settled per reference) that `kb/_build_commons_status.py` records daily in `kb/status/commons_history.json`, backfilled Oct 18 to Nov 15. The exhibit series showed no net fall on days that stamped titles; comparing the day's stamps with the day's growth in the universe found them equal (`q-exhibit-universe-grows-with-stamps-s661`, `cpl_memory`).

## When this applies (and when it doesn't)

Any burn-down, ETA or "how far we are" figure over work that keeps arriving: harvest queues, curation queues, clean-up worklists. It does not apply to a fixed, closed list, where done and remaining are the same count, or to throughput reports whose question is effort rather than a date.

## See also

- [`methodology-a-summary-must-share-the-unit-of-its-detail`](methodology-a-summary-must-share-the-unit-of-its-detail.md)
- [`docs/reference/lanes/commons.md`](../reference/lanes/commons.md), the Commons Curation ETA
