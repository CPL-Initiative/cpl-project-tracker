---
title: Resuming a frozen session — check main before rebuilding its in-flight work
created: 2026-06-02
updated: 2026-06-02
tags: [playbook, git, multi-session, recovery, parallel-work, claude-code]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/eacr_consolidation_lessons.md]]"
artifacts: []
---

# Resuming a frozen session — check `main` before rebuilding its in-flight work

> **One-sentence summary** — before you re-do work a frozen/hung session was in
> the middle of, `git fetch` and check what's already on `main` (and the PR's
> `mergeable_state`) — a parallel actor (or the recovering session) may have
> already shipped it.

## Context

This is a **multi-actor repo**: several Claude sessions plus Sam can be working at
once, and squash-merges land on `main` continuously. When a session **freezes
mid-task**, the natural recovery is "pick up where it left off and finish." But
"where it left off" may already be done — by #254 in our case, shipped in parallel
while the frozen session was stuck in `/checkpoint`. Rebuilding it from scratch
produced a **conflicting duplicate PR (#255)** that had to be closed unmerged.

A second trap: the session container caches a **stale `origin/main`**. Ours sat at
an old SHA (a force-push from a prior PII-history purge made it a non-ff ref), so
local `git log origin/main` looked frozen in the past until an explicit
`git fetch`.

## The claim

When recovering a frozen/interrupted session, do this **before writing any code**:

1. **`git fetch origin main`** — defeat the stale cached ref (a force-pushed `main`
   shows as a "forced update"; that's expected here, not alarming).
2. **`git log <branch-base>..origin/main --oneline`** — see exactly what landed
   since your branch point. Look for a commit that already does your task.
3. **If a PR exists, read its `mergeable_state`.** `dirty` = someone else touched
   the same lines (a conflict — often *because* they shipped the same fix);
   `behind` = main moved. Either is a signal to reconcile, not to plow ahead.
4. **Only then decide:** already shipped → close/abandon your redo (don't merge a
   duplicate); not shipped → rebase onto fresh `main` and continue.

Corollary: **a freeze loses only uncommitted work.** Anything already
squash-merged is durable on `main` — so triage is "what was *uncommitted* when it
froze?" (usually just the in-progress edits / the handoff), not "is everything
lost?" Merge early and the blast radius of a freeze stays tiny.

## How we got here

Session 28 merged PR-4 (#253), started `/checkpoint`, and froze for ~30 min. The
recovery session confirmed #252/#253 were safe on `main`, then independently
rebuilt the v2 contrast fix — only to find #254 had already shipped it (identical
diff). Closing #255 + `git reset --hard origin/main` cost a round-trip that a
2-minute `git fetch` + `mergeable_state` check would have saved. Full narrative in
`docs/eacr_consolidation_lessons.md` (Session 28).

## When this applies (and when it doesn't)

- **Applies** to any session resuming after a freeze, context consolidation, or a
  long gap, in this multi-actor repo — and any time a PR comes back `dirty`/`behind`
  unexpectedly.
- **Less critical** for a brand-new task on a fresh branch with no parallel
  activity — though `git fetch` first is cheap insurance regardless.

## See also

- PR `#254` (the parallel fix) · `#255` (the closed duplicate)
- `[[docs/eacr_consolidation_lessons.md]]` — Session 28 close-out
- CLAUDE.md Branch Policy — auto-merge gates / `mergeable_state` (`clean`/`unstable`
  merge; `dirty`/`behind`/`blocked` gate)

---

*Authoring check: durable, reusable (every freeze/resume in a multi-session repo),
distilled (one concept), self-contained.*
