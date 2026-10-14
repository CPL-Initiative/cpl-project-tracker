---
title: A red merge ref can be main's, and every open PR inherits it
created: 2026-10-14
updated: 2026-10-14
tags: [methodology, ci, pull-requests]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[program_requirements_harvest_lessons]]"
artifacts:
  - tests/pii_guard.test.js
  - tests/nav_groups_overlay.test.js
  - excel_to_dashboard.py
---

# A red merge ref can be main's, and every open PR inherits it

> **CI tests a PR's merge with `main`, so a fault that lands on `main` after the branch was cut turns every open PR red at once; read the failing check, find which side carries it, and fix it at the source before touching any branch.**

## Context

On 2026-10-14 (S390) two failures reached four PRs in an hour. The daily dashboard run baked a reviewer's email into
both HTMLs, and `pii_guard.test.js` failed the merge ref of every PR. Then `nav_groups_overlay.test.js` read 30 checks
against a floor of 31 on a loaded runner, on a PR that never touched it. Neither failure was the PR's own.

## The claim

- **Run the failing test on the branch head alone first.** It passed locally on the head in both cases; the failure
  came from `main`'s side of the merge (the baked email) or from timing (the test reported on a 900 ms timer).
- **Fix at the source, in its own PR.** The email came from a generator, so the generator changed, and the baked
  line was corrected to what the generator now writes (Rules 1 and 4).
- **Port the fix into each open PR on top of a merge of `main`.** It becomes a no-op when the fix PR lands, and each
  PR goes green without waiting on it. One comment per PR names the check, why it is not the PR's, and the port.
- **A test that reports on a fixed timer under-counts under load.** Report on `Promise.all` of its async blocks;
  reproduce by delaying the last block (the old file printed 30/30, the new one 31/31).
- **A ported fix can land through the PR it was ported into.** #2119 closed unmerged because #2116 carried it first.

## When this does not apply

A failure that reproduces on the branch head alone is the PR's to root-cause; porting nothing excuses it.
