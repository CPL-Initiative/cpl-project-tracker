---
title: A rebuild runs the same build script, never an imitation of the runner
created: 2026-11-12
updated: 2026-11-12
tags: [methodology, ci, workflows, governance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/governance_lessons]]"
  - "[[docs/reference/lanes/governance-team-enablement]]"
artifacts:
  - scripts/daily_build.sh
  - .github/workflows/daily-dashboard.yml
  - tests/apply_concurrency_test.py
---

# A rebuild runs the same build script, never an imitation of the runner

> **One-sentence summary** — when a workflow must run its build a second time inside the same job, move the build steps into one script that both the first run and the rebuild call, rather than writing code that reads the workflow and replays its steps.

## Context

The daily dashboard run lost its push when `main` moved under it, and COBIx's finding 8 (#3110) asked for the run to
rebuild on the new `main` inside the job. Lessons: [`governance_lessons`](../governance_lessons.md), *2026-11-12*.

## The claim

A workflow's steps carry more than their commands: the shell and its flags, workflow-level `env` and `defaults`, each
step's own secrets. Code that parses the YAML and replays the steps has to reproduce every one of those, and each it
misses makes the rebuild differ from the run it replaces in a way no test of the happy path shows. A build script
called as one step has none of those gaps: the scheduled run and the rebuild execute the same file, and each block
keeps only the secrets its former step declared.

## How we got here

#3150's first design was a Python runner that read `daily-dashboard.yml` and executed its steps. Three readers found it
ran with different shell flags, neither copied nor refused workflow-level env and defaults, and handed every rebuilt
step both secrets. The redesign moved the 40 build commands into `scripts/daily_build.sh`, byte-identical to the former
steps and in the same order (a reader checked), and the commit step runs the new `main`'s copy of it once on a
conflicted rebase. `tests/apply_concurrency_test.py` runs the commit step's shell against a stand-in script.

## When this applies (and when it doesn't)

Any job that must repeat part of itself: a retry after a lost push, a rerun on fresh inputs. It does not cover a rerun
that a fresh dispatch can do safely; here a dispatch was ruled out because the conflicted run would have ended green
having published nothing.

## See also

- [`methodology-a-pr-that-changes-a-builder-runs-the-builder`](methodology-a-pr-that-changes-a-builder-runs-the-builder.md)
