---
title: A window saves only over the version it read
created: 2026-09-23
updated: 2026-09-23
tags: [methodology, supabase, concurrency, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/implementation-funding]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_save_over_newer.test.js
---

# A window saves only over the version it read

> **A page that saves a whole document must name the version it read. Otherwise any window left open writes its older copy over newer work, and neither screen says so.**

## Context

The Implementation Funding tab keeps its whole model in one row,
`cpl_funding_config` (`id = default`): every scenario, every card, and which
scenario the public reads. The tab reads the row once, at load, and every edit
PATCHes the whole `config`.

## The claim

1. **A whole-document save races every other open window, and the last write
   wins.** A window holds the version it loaded plus its own edits. When it
   saves, the server takes that copy whole, including every part another window
   changed since. Nothing errors, because the older copy is a valid document.
2. **The fix is a version check on the write.** The PATCH carries
   `updated_at=eq.<the value this window last read or wrote>`. A row that has
   moved on matches nothing, and PostgREST answers 200 with no rows. The page
   then loads the newer row and asks for the change again.
3. **An empty answer is ambiguous, so read the row before deciding.** An RLS
   refusal and a stale filter both return 200 with no rows. If the row's
   `updated_at` still equals what the window sent, the credential was refused.
   If it moved, the copy was stale.
4. **One save at a time from one window.** Two PATCHes in flight can land in
   either order, and the older state landing last is the same silent loss. A
   save asked for mid-flight waits, then sends the latest state and names the
   version the first save returned.

## How we got here

At 19:44 UTC on 2026-09-23, Sam published Scenario 1, which the tab stores as
`projects.<pid>.published`. At 21:30 he set Career attainment's factor to 0.5
and edited P2's measure. That save came from a window that had loaded before
the Publish, so it wrote the row back without `published`. Colleges kept seeing
Scenario 1 only because an unset marker falls back to it. The same sequence
with Scenario 3 published would have moved every college back to Scenario 1
without a word.

The row has no history table, only an `updated_at` touch trigger. The loss came
to light only because a session had read the row before the save and read it
again after. `tests/cpl_funding_save_over_newer.test.js` stubs the row with
both empty answers, and the code before the fix fails 12 of its 15 checks.

## When this applies (and when it doesn't)

It applies to any page that reads a single row holding a whole document and
writes it back whole. A page that PATCHes one field of one row per edit, keyed
by the row, can lose only a concurrent edit to that same field. The same check
guards it if that matters.

The check needs a column the server changes on every write, here `updated_at`
set by a trigger. A timestamp the client sets does not work, because two
windows can send the same one.

## See also

- [`lanes/implementation-funding`](../reference/lanes/implementation-funding.md)
- [`methodology-a-saved-setting-is-not-the-effective-value`](methodology-a-saved-setting-is-not-the-effective-value.md)
