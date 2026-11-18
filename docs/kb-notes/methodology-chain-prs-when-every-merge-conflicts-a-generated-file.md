---
title: Chain pull requests when every merge conflicts a generated file, and land shared-data work as one wave
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
---

# Chain pull requests when every merge conflicts a generated file, and land shared-data work as one wave

> **One-sentence summary** — when each merge to `main` rewrites a generated file that every open pull request also
> carries, build the pull requests as a chain, each branch already holding the one before it, and land the PRs that
> share data as one wave, so CI runs once a PR instead of once a PR per merge ahead of it.

## Context

The tracker regenerates `kb/dependency_map.json` and its `.md` from the code, and CI `--check`s them. Every code PR
changes the map, so the moment one merges, every other open code PR conflicts with `main`. A PR in conflict gets no
`pull_request` CI at all, and the `test` gate is the one sanctioned merge wait. On S679's night nine merges ran one after
another at about 11 minutes each. On S680's night (2026-11-18) the runner pool was saturated by eight outcome reads, CI
took 25 to 40 minutes, and the same pattern would have cost hours. Detail: `docs/engineering_practices_lessons.md`, *S679*
and *S680*.

## The claim

1. **Order the PRs once, then chain them.** Pick the merge order (S680: #3496, #3498, #3490, #3503, #3502). Each branch
   merges the one before it and regenerates the generated files with their builders (never by picking a side). One
   worker assembles the chain, so there is one writer of the merge commits.
2. **CI then runs once a PR.** When the first PR merges, the second already contains it, so its diff against `main`
   shrinks and it stays clean; nothing needs a rebuild and a fresh 25-minute CI wait.
3. **PRs that touch shared data land as one wave.** The outcome PRs each rebuilt the Commons data (`commons_data.json`);
   merged one by one they would conflict on it as well. One wave branch (#3504) took them together, merged the chain's
   top, built the Commons data once, and lands as one PR.
4. **The checkpoint lands last.** The checkpoint branch merges the wave, so it carries every generated file at its final
   state and conflicts with nothing.
5. **The merge to `main` is still one PR at a time, each on a green `test` on its own head**, in the chain's order.
   Confirm each landing by `git log origin/main`, never by the merged flag alone (`d-stack-top-retarget-s655`): a
   chain is not a stack, and each PR targets `main` directly.

## How we got here

S679 measured the serial cost (one generated file, nine merges). S680's conductor built the chain after the first
merge put every other code PR in conflict, and the chain held: each PR stayed clean as the one before it merged. A gap
the chain exposed: `scripts/check_generated.sh` does not run CI's Commons data check, so three PRs went red before the
wave rebuilt it once; that check belongs in `check_generated.sh`.

## When it does not apply

A PR that touches no generated file merges beside the chain. A single PR needs no chain. A chain whose middle PR fails
review is rebuilt from that point, never merged past it.
