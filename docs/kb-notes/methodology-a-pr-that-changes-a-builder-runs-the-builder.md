---
title: A PR that changes a builder of a committed file runs the builder
created: 2026-11-11
updated: 2026-11-12
tags: [methodology, ci, generated-files, commons]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[exhibit_canonicalization_lessons]]"
artifacts:
  - kb/status/commons.json
  - tests/exhibit_progress.test.js
---

# A PR that changes a builder of a committed file runs the builder

> **One-sentence summary** — when a PR changes the code that writes a committed file, CI must rebuild that file from the PR's code, or the first scheduled run after the merge is the first test of the new output.

## Context

On 2026-11-11 (S638), #3119 added a count to the Commons' Exhibit card. Its tests passed on the PR's committed
`kb/status/commons.json`, which the old builder had written. At 21:41Z the nightly `cer-procedures.yml` run rebuilt
the file with the new count and committed it to `main`. `tests/exhibit_progress.test.js` did not know the new link,
and `main` went red. Lessons: `docs/exhibit_canonicalization_lessons.md`, S638.

## The claim

A test over a committed file tests the last builder that wrote the file. It does not test the builder the PR
changes. When a PR changes a builder, the PR (or its CI) runs the builder and commits or checks the output, so the
tests read what the next scheduled run will write.

## How we got here

Green CI on #3119, a red `main` 5 minutes after the nightly run; the fix rides #3120.

## When this applies (and when it doesn't)

It applies to every builder whose output is committed and read by a test or a view: `kb/status/*.json`, the
Exhibits JSON, the dependency map. A builder that needs a live read the PR cannot make runs in a check mode over a
recorded input instead. It does not apply to the generated `unified_courses_*.js` artifacts, which the artifact policy
keeps out of code PRs and the daily run publishes.

## The same failure from a data apply (S639, 2026-11-12)

An apply that rewrites committed data is a builder too. The Sheet 181 rename apply (`cred-rename-apply.yml`, commit
`da9f2f90`) renamed 22 titles in `kb/credentials.json` and `kb/unified_titles.json`. Two checks in
`tests/credential_family_test.py` read those committed titles and expected the pre-rename state, so `main` went red
on the apply's own commit, with every check on #3127 green. A review of an apply therefore runs the suite against the
data as it will stand after the apply: the dry run's output, or the apply run locally on a copy of the files.

## See also

- `docs/reference/conductor_mode.md`, *What went wrong in S638* and *in S639*
- `scripts/check_generated.sh`
