---
title: When every merge conflicts a generated file, land the work as one wave pull request, not a chain
created: 2026-11-18
updated: 2026-11-18
tags: [methodology, merging, generated-files, ci, conductor]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/engineering_practices_lessons]]"
  - "[[docs/kb-notes/methodology-stacked-pr-empty-squash]]"
  - "[[docs/reference/conductor_mode]]"
artifacts:
  - kb/_build_dependency_map.py
  - scripts/check_generated.sh
  - kb/migrations/.apply
---

# When every merge conflicts a generated file, land the work as one wave pull request, not a chain

> **One-sentence summary** — when each merge to `main` rewrites a generated file that every open pull request also
> carries, a chain of branches (each holding the one before it) survives one link and then conflicts, because a squash
> on `main` and a branch carrying the same change plus more both edit the same hunks; land the rest as one wave pull
> request: one merge of `main`, one CI run, one squash, and each carried pull request closed with a pointer.

## Context

The tracker regenerates `kb/dependency_map.json` and its `.md`, and the Commons data (`commons_data.json`), and CI
`--check`s them. Every code PR changes them, so the moment one merges, every other open code PR conflicts with `main`. A
PR in conflict gets no `pull_request` CI at all, and the `test` gate is the one sanctioned merge wait. S679 ran nine
merges in series at about 11 minutes each; on S680's night (2026-11-18) the runner pool was saturated and CI took 25 to
40 minutes. Detail: `docs/engineering_practices_lessons.md`, *S679* and *S680*.

## The claim

1. **A chain breaks after its first link.** S680 built five code PRs as a chain, each branch merging the one before it
   and regenerating the generated files. #3496 merged (`71548415`). #3498 then reported conflicts: `main` held #3496 as
   one squash commit, and #3498's branch held #3496's commits plus its own regenerations, and both edited the same
   hunks of the dependency maps and the Commons data. Git does not see the squash as the branch's commits, so every
   later link needed a merge of `main`, a new head and a new CI run, the serial cost the chain was meant to avoid.
2. **One wave PR lands the rest.** #3504 carried #3498 with #3501, #3490, #3503 and #3502, and the outcome PRs #3387,
   #3493, #3488, #3489 and #3421: one merge of `main`, generated files rebuilt once by their builders, one CI run, one
   squash. Each carried PR closes with a pointer to the wave.
3. **A merged branch carries its `kb/migrations/.apply` line.** Chaining copied #3496's `.apply` line onto other
   branches, and each push of such a branch re-triggered #3496's full-row apply (runs 44269433074 and 44272782139). The
   count guard refused both ("the UPDATE matched 0 rows, the plan names 39"), so nothing was written twice. A branch
   that merges another branch keeps `main`'s `.apply` text, and every apply file stays guarded and idempotent
   (`kb/_guarded_sql.py`).
4. **The checkpoint lands last**, after merging `main` with the wave on it, so it carries every generated file at its
   final state.
5. **Confirm each landing by `git log origin/main`**, never by the merged flag alone (`d-stack-top-retarget-s655`).

## When it does not apply

A PR that touches no generated file merges on its own. A wave whose carried work has not all passed its second reader
waits for it, or leaves that PR out.
