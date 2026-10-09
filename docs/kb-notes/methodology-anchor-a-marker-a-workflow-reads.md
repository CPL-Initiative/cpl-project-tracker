---
title: Methodology — anchor a marker a workflow reads in a commit message
created: 2026-10-09
updated: 2026-10-09
tags: [methodology, ci, github-actions, cost]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/program_requirements_harvest_lessons]]"
---

# Methodology — anchor a marker a workflow reads in a commit message

> **One-sentence summary** — a workflow that spends money when a commit message
> carries a marker must match the marker at the START of the message, because
> the commit that introduces the marker describes it.

## The claim

`if: contains(github.event.head_commit.message, '[extract]')` reads as "run the
paid step only when asked". The first commit to ship that workflow explained the
feature in its body ("extraction runs on a dispatch or a commit marked
[extract]"), so the gate opened on its own description. The program requirements
read of Cerritos (run 37961137169, S353) extracted all 283 programs, $15.80,
before anyone had read whether the pages were matched right.

**Rule:** gate on `startsWith(github.event.head_commit.message, '[marker]')`, and
pin it in a test that also fails on `contains(` over the message.

## Why it generalizes

Any marker that a person writes deliberately is also a word people write about:
release notes, a revert message quoting the original, a squash commit that
concatenates bodies. Anchoring keeps the request and the description apart; the
dispatch input stays the plain way to ask.

## See also

- `tests/program_requirements_college_test.py` — the pin.
- `.github/workflows/program-requirements-college.yml` — the gate.
