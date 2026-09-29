---
title: "A store's freshness tracks whether its update is unconditional"
created: 2026-08-29
updated: 2026-08-29
tags: [methodology, docs-corpus, guards, checkpoint, memory]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - CLAUDE.md
  - .claude/commands/checkpoint.md
  - kb/_doctrine_scenarios.py
related:
  - "[[methodology-push-what-cannot-be-asked-for-pull-everything-else]]"
  - "[[methodology-a-knowledge-base-needs-a-lint-pass]]"
---

# A store's freshness tracks whether its update is unconditional

Measured across nine knowledge stores in three repos on 2026-08-29, while trying
to work out why some go stale and others do not. The answer is not effort, and it
is not whether anyone intended to maintain them.

## The natural experiment

Rule 9's `CPLBrain` bullet lists three stores **in a single paragraph** — same
repo, same rule, same author, written the same day. The only thing that varies is
the grammar:

| store | how the rule words it | last write |
|---|---|---|
| `07-session-notes/` | *"**REQUIRED** for any non-trivial session"* | same day |
| `04-projects/…/SESSION-NOTES.md` | *"**when** the run worked inside a project folder"* | **41 days** |
| `07-session-notes/README.md` | *"**only if** the convention itself changed"* | untouched, correctly |

And the same store supplies a before/after: `07-session-notes/` ran
**2026-07-20 → 08-09 → nothing for 19 days → 08-28**, resuming the day it was
added to the checkpoint list. The store did not change. The **sentence** did.

## The three tiers, in order of strength

1. **Unconditional in the always-loaded checkpoint list** → fresh (≤1 day, every
   time). `docs/kb-notes/`, `docs/reference/`, `INDEX`, the To-Do feed,
   `07-session-notes/`.
2. **Conditional** → stale. `04-projects/` at 41 days.
3. **Absent** → stale, and invisibly so, because nothing reports the absence.

A guard is a *fourth* tier that catches regressions in tier 1 — but note the
ordering: **being listed unconditionally did more work than being guarded.**
`07-session-notes/` has no lint at all and is fresh; the public KB has a pointer
and is 43 days old (correctly — it is human-gated by design).

## ⚠️ The conditional is not the bug

*"Update it when you worked in that folder"* is a **correct** instruction. The
defect is that **nothing can observe whether the condition was met**, so a missed
update is indistinguishable from a run the condition never applied to. That is
why it decays silently: there is no state in which it looks wrong.

So the intervention is a choice, not a fix:

- **Make it unconditional** — cheap, and it works, but it adds a step to runs
  that do not need it.
- **Make the condition observable** — for `04-projects/` the condition is
  literally "did this run touch `04-projects/`?", which a guard could read from
  the diff. More work, and it needs to see a second repo.

## What this means for adding a store

Before adding one, answer: **which tier will it be in?** A store that lands in
tier 2 or 3 will rot, however good the intent behind it — and the rot is silent,
so you will find out weeks later from a date rather than from a failure.

`kb/_doctrine_scenarios.py` carries this as a scenario, currently **uncaught**,
so the gap stays visible rather than becoming folklore.
