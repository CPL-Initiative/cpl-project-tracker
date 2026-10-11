---
title: A path filter compares pushes, not branches
created: 2026-10-11
updated: 2026-10-11
tags: [methodology, ci, github-actions, cost]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - .github/workflows/program-requirements-extract.yml
  - tests/program_requirements_pilot_test.py
---

# A path filter compares pushes, not branches

> **A workflow's `paths:` filter fires on what changed between a push and the branch's previous push, so merging or
> rebasing main into a branch fires it for files the branch never touched. When that workflow costs money, guard the job
> by comparing the branch with main.**

## Context

`program-requirements-extract.yml` runs the harvest's pilot extraction, 22 model calls at about seven cents each, on any
`claude/**` push that touches `kb/_program_requirements_extract.py`. The intent, written in its header, was "when this
workflow or its script changes": test a branch's own change to the extraction.

## The claim

GitHub evaluates `on.push.paths` against the files changed between the commit before the push and the commit after it. It
does not ask whether the branch differs from its base. Three consequences follow:

- **Merging main** into a branch that predates a change to a filtered path brings that change into the push, and the
  workflow runs. The branch changed nothing there.
- **Rebasing** a branch onto a main that carries such a change does the same.
- **A force push** after a rebase fired it too (run 38104914021), although the branch's own change to the script was
  the same before and after the rebase.

For a free check this costs a few runner minutes. For a workflow that spends model calls, posts to a live service or
writes data, it spends for nothing. Cancelling by hand fails as soon as someone forgets.

The fix is a first step in the job, on a push only, that fetches main and compares the filtered file with main's copy
(`git fetch --depth=1 origin main` then `git diff --quiet FETCH_HEAD -- <path>`). Every later step waits on that answer.
A dispatch skips the guard, so a person can always run the workflow on purpose.

## How we got here

S360 canceled two pilot runs that its own rules branch started. In S361, merging main into the checkpoint branch after
#1974 ran the full pilot (run 38105582450, $1.59, nothing written). #1976 added the guard and a test that fails on the
unguarded workflow. The guard's own push (a workflow change, the script equal to main's) ran the guard and skipped setup
and the extraction (run 38106437059).

## When this applies (and when it doesn't)

It applies to any `on.push.paths` (or `paths-ignore`) workflow whose run has a cost or a side effect. A pull-request
trigger has a different base: `on.pull_request.paths` compares the PR's head with its base, so it does not have this
fault. A workflow that is free and idempotent, such as a lint, can keep the plain filter. The guard compares one named
file; a workflow filtered on many paths compares each, or the whole set with `git diff --quiet FETCH_HEAD -- <paths>`.

## See also

- `[[docs/program_requirements_harvest_lessons]]`: S360 and S361
- PR `#1976`: the guard and its test
- GitHub Docs, "Workflow syntax for GitHub Actions", `on.push.paths`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
