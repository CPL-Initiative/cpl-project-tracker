---
title: A second PR stacked on a just-merged branch can squash to an empty commit — verify main
created: 2026-06-23
updated: 2026-06-23
tags: [methodology, git, github, pr, squash-merge, workflow, safety]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-resume-frozen-session-check-main-first]]"
artifacts: []
---

# A stacked PR can squash to an *empty* commit — always verify `main` has the diff

## The failure (observed Session 70, PR #499)

A session opened **PR #499** off a feature branch, then — before #499 merged —
kept working on the **same branch** and opened **PR #500** containing #499's
commits *plus* new work. #499 squash-merged first. When #500 was then
squash-merged, GitHub reported **"merged"** with a green check, but the squash
landed an **empty commit on `main`**: #499's content (a label sweep, a KB note,
a test) was **never actually on `main`**.

The "merged" status was truthful about the merge event and lied about the
delta. Nothing failed loudly; the changes simply evaporated.

## Why it happens

GitHub computes a squash as the diff of the PR branch **against its merge
base**. Once PR #499 squash-merged, its changes were on `main` — so when #500
(branched from the *same* line, carrying the same commits) was diffed against
the updated `main`, the overlapping changes read as **already present**. If the
unique-to-#500 delta is what you expected, fine; but the *re-landed* #499
portion contributes **zero** to the squash. Stacked/overlapping branches +
sequential squash-merges = the second squash can be partially or wholly empty.

## The two-part rule

1. **Branch fresh per independent PR, off `main`.** Don't stack a second PR on a
   branch that still has an unmerged PR open against it. (CLAUDE.md's
   sibling-branch policy exists for exactly this: one concern per branch,
   created off `main`.) If you *must* stack, rebase the second branch onto
   `main` after the first merges, so its base is correct.

2. **After every squash-merge, verify `main` actually contains the diff** —
   don't trust the green "merged". One command:

   ```bash
   git fetch origin main -q
   git diff --stat origin/main~1 origin/main   # must be non-empty + the files you expect
   git show origin/main:path/to/file | grep -c 'a marker string from your change'
   ```

   An empty `diff --stat` on a "merged" PR is the tell. Re-land by cherry-picking
   the lost change onto a fresh branch off the new `main` and opening a clean PR
   (this is how #500 recovered #499).

## Generalization

Any time a "succeeded" signal describes the *operation* rather than the
*resulting state*, verify the state. Squash-merge "merged" ✓, a 200 from an API
that no-ops, a cron that ran but committed nothing — the receipt is not the
outcome. Check the artifact, not the status code.
