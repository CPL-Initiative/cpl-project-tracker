---
title: A proof run needs a same-day baseline
created: 2026-11-12
updated: 2026-11-12
tags: [methodology, program-requirements, harvest, review]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[program_requirements_harvest_lessons]]"
artifacts:
  - .github/workflows/program-requirements-college.yml
---

# A proof run needs a same-day baseline

> **One-sentence summary** — a run that proves a reader change must be compared against the current reader's output on the same source the same day, or the comparison measures every change since the baseline was filed.

## Context

The PDF reader change (#3135) was proved by capture-only reads at five colleges, each compared against the records
`main` already held. The program requirements harvest lessons, *S640*, hold the run numbers.

## The claim

A baseline is the output of the code the change replaces, run on the same source, close in time to the proof. A
filed record older than the last change to the code or to the source is no baseline: the comparison then credits the
change with every difference since. Make the baseline on purpose: run `main`'s code on a scratch branch (no pull
request) on the same day, one source at a time, and delete the branch when the change merges.

## How we got here

Three of #3135's five proofs compared against reads `main` filed on 2026-10-17, before the reader had changed on
`main`. They showed 37 and 50 changed picks, and the changes came from the reader's own history rather than from
the pull request. The S640 conductor ran a copy of `main` at `dd50e246` on `claude/harvest-pdf-baseline-s640` to
file same-day baselines (Sacramento City, run 43159025892, first), and ordered fresh proof reads on the pull request's
branch.

## When this applies (and when it doesn't)

Any proof that compares a new output to an old one: a reader, a scorer, a builder, a classifier prompt. It does not
apply where the baseline is fixed by definition, such as a pinned test fixture, or where the old output is the thing
being judged, such as a regression against what colleges already see.

## See also

- [`methodology-a-pr-that-changes-a-builder-runs-the-builder`](methodology-a-pr-that-changes-a-builder-runs-the-builder.md)
- `docs/program_requirements_harvest_lessons.md`, *S640*
