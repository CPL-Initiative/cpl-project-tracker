---
title: A name a join keys on is a key, whatever the table calls it
created: 2026-11-02
updated: 2026-11-02
tags: [methodology, college-identity, funding, joins]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-safe-fallback-is-caller-specific]]"
  - "[[college-district-identity]]"
  - "[[implementation-funding]]"
artifacts:
  - kb/_seed_college_short_names.py
  - funding/_build_funding_performance.py
  - tests/funding_name_resolver_test.py
---

# A name a join keys on is a key, whatever the table calls it

> **When a table's display names also join two datasets, changing a display name changes a key: keep the old name as an alias, and pin the join with a test that every row on the far side is still reached.**

## Context

`kb/college_short_names.json` holds each college's short name for chips and tables. The funding builder also joins MAP's college names to the funding roster through it, and the roster names colleges by the shorts as they stood when it was built. On 2026-10-30 two shorts were corrected for display (#2598). The display surfaces were checked; the join was not, and its misses went to an `unmatched` bucket no check read. Two colleges' outcomes and their JST condition dropped out of the funding model for two days (`docs/cpl_funding_lessons.md`, S544).

## The claim

1. **Find every reader of the name before changing it.** A name that a join reads is a key. Grep for the table's file name and its resolver functions; any caller that compares the name to another dataset's names is a join.
2. **Keep the old name as an alias, and make the join read aliases.** An alias costs nothing on a display surface, and it keeps every dataset that still carries the old name reachable. A join that matches only the current name turns every rename into a silent drop.
3. **Pin the join from the far side.** A test that walks the dataset being joined *to* (here the 115 funding roster rows) and fails when any row is unreached, or reached twice, catches a rename no one connected to the join. Run it against the committed files, so it fails in CI before the next build runs.
4. **Treat a soft bucket as a signal.** `unmatched` is the right shape: never guess a college onto another's row. But a bucket that nothing reads hides the failure it records. A consumer that prints per-entity rows (here Sierra's rollup, "no counts shown") is often what surfaces it, so read such a row as a join failure upstream before reading it as an absence.

## How to apply it

Before merging a change to `kb/college_short_names.json` (or any identity table), run `tests/funding_name_resolver_test.py` and `python3 kb/_seed_college_short_names.py`, whose report lists unresolved names. When a short changes, add the old short to `EXTRA_ALIASES` in the seed script in the same PR.

## Related

- `methodology-a-safe-fallback-is-caller-specific.md`: the fallback that returns a name unmatched is right for a chip and wrong for a money join.
- Lane state: `docs/reference/lanes/college-district-identity.md`, `docs/reference/lanes/implementation-funding.md`.
