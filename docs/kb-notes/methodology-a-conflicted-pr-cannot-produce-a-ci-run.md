---
title: A conflicted pull request cannot produce a CI run, so read mergeable_state before blaming CI
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, ci, github, pull-requests, debugging]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - .github/workflows/js-tests.yml
---

# A conflicted pull request cannot produce a CI run

> **One-sentence summary** — GitHub runs `pull_request` workflows against the
> *merge commit*, so a PR with a merge conflict has nothing to test and produces
> **zero** check runs; the absence looks exactly like a broken CI system.

## Context

On 2026-08-28 a PR sat with no checks at all across **five consecutive pushes**.
The session handoff concluded *"no workflow has run repo-wide"* and proposed
three explanations: Actions disabled on the repo, Actions out of quota, or a
GitHub incident. All three are plausible, all three are expensive to check, and
**all three would have come back clean.**

Two workflows had in fact run successfully in the same window, both on `main`.
The PR's own pushes produced nothing because the PR was `mergeable_state:
"dirty"`. Merging the base branch in resolved the conflict, and CI appeared on
the very next push — the same workflows, the same runner, no configuration
change.

## The rule

**When a PR shows no checks at all, read `mergeable_state` before you
investigate the CI system.**

A `dirty` PR explains the total absence of `pull_request` runs completely.
Every infrastructure theory downstream of that is a detour, and each one costs
more to disprove than the one field costs to read.

## Why the absence is so misleading

Three things make this hard to see:

1. **It presents as a repo-wide outage.** You are looking at one PR, seeing
   nothing, and the natural generalization is "CI is down."
2. **Stale runs are attributed by branch name.** If the branch was deleted on an
   earlier merge and recreated, GitHub may list runs belonging to a *previous*
   head against the current PR. Those runs are green, which makes the picture
   worse: it reads as "CI ran and passed" while the current head is untested.
3. **The remedies for the wrong diagnosis are all forbidden or useless.** Empty
   commits and close/reopen cycles are explicitly banned for kicking CI, and a
   `workflow_dispatch` may not exist. So a wrong diagnosis leads straight to a
   dead end.

## What to check, in order

```
1. pull_request_read → mergeable_state
     "dirty"    → merge the base branch in; CI will run on the resulting push
     "blocked"  → a REQUIRED check is failing or pending; read the checks
     "unstable" → required checks passed; only a non-required one is outstanding
     "behind"   → update the branch
2. Only if mergeable_state is healthy: check whether workflows ran anywhere
   else in the repo (actions_list WITHOUT a branch filter). If other runs
   succeeded in the same window, Actions is fine and the problem is this PR's.
3. Only if nothing has run anywhere: consider Actions being disabled, quota,
   or an incident.
```

Step 1 answers it most of the time and costs one API call.

## The corollary

A merge commit that resolves a real conflict is **not** an empty commit and
**not** a CI-kicking trick — it is a required change that also happens to
restore CI. That distinction matters, because the rule against pushing commits
to trigger CI can otherwise read as a reason not to resolve the conflict.

## See also

- [`docs/cpl_funding_lessons.md`](../cpl_funding_lessons.md) — the run this came from.
- `CLAUDE.md` → Branch policy → the `clean` / `unstable` / `blocked` merge gate.
