---
title: A ledger kept at its threshold fails every PR that adds a test
created: 2026-11-12
updated: 2026-11-12
tags: [methodology, tests, ci, governance-team-enablement, conductor]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/governance_lessons]]"
  - "[[docs/reference/conductor_mode]]"
artifacts:
  - tests/check_ledger.test.js
  - tests/check_floor.json
---

# A ledger kept at its threshold fails every PR that adds a test

> **A ratio guard sitting at its line turns into a rule about new files: each new test file has to carry its own
> entry, or the PR that adds it goes red for a reason its author never touched.**

## Context

`tests/check_ledger.test.js` check 4 requires that more than 60% of `tests/*.test.js` files carry a check-count floor
in `tests/check_floor.json`. On 2026-11-12 (S642) three worker PRs failed CI's `suite (6)` for this one reason, each
while adding a new, working test.

## The claim

A share threshold measured over the whole suite moves with the denominator. When the suite sits just above the line,
an unfloored new file lowers the share for everyone, and the failure lands on whichever PR adds it, far from the file
that failed. Measured at S642's checkpoint: 376 of 625 files floored, 60.2%; two more unfloored files take it under.

So, while the share sits near its line:

- Every brief or checklist that adds a test file says: add its floor to `tests/check_floor.json` in the same PR.
- A red `suite (6)` on a PR that added a test is read first as a missing floor, before any search for a real fault.
- The lasting fix is to raise the share (floor the files that print a count) so it stops sitting at the line, rather
  than lowering the threshold.

## How we got here

S641 noted the rule once (#3152's floor). S642 lost three CI rounds to it on three worker PRs (*as reported* by the
conductor) before every brief named it; #3162 added its floor in a follow-up commit (`docs/reference/conductor_mode.md`, *What went wrong in S642*).

## When this applies (and when it doesn't)

Any guard that checks a share of a growing set. It does not apply to a per-file floor, which fails only the file it
names.

## See also

- `docs/governance_lessons.md`, 2026-11-12
- `docs/kb-notes/methodology-the-floor-belongs-to-each-figure.md`
