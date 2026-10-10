---
title: A sweep of a gated view measures the gate
created: 2026-10-10
updated: 2026-10-10
tags: [methodology, a11y, ui-pass]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[ui_pass_lessons]]"
artifacts:
  - a11y.config.js
  - scripts/a11y.js
  - tests/map_users_first_light.test.js
---

# A sweep of a gated view measures the gate

> **An accessibility sweep that loads a view signed out, with its data reads blocked, measures the sign-in prompt or the
> error box and passes; seed the view the way its reader sees it before trusting the pass.**

## Context

`npm run a11y` loads every COBI tab with requests that leave the origin aborted, so a tab that draws from a gated
Supabase table paints its could-not-load state. MAP Users (S358's UI pass) passed both light and dark sweeps that way,
while the roster a signed-in reviewer opens held the faults the rules exist to catch.

## The claim

A pass is a statement about what was painted. For a view behind a sign-in or a live read, the painted view is the gate,
so the pass says nothing about the view. Measure the reader's view by seeding it: a `seed` function in
`a11y.config.js` sets the session, fills the tab's state with data in the real shape, opens the panes a reader opens
(a roster, an editor), and renders. One target per state worth measuring, one per theme.

## How we got here

S358 added four seeded MAP Users targets (the roster lens with a roster open, the contact worklist with a proposal
editor open, light and dark). Against the unchanged code they found 28 controls under 24px, the search box's focus ring
removed, two tables pushing the page 17px and 102px sideways at 390px, and a 16px link. The signed-out sweep had passed
all of it. After the fixes the seeded targets caught one more fault the fix introduced: `--on-accent` turns dark in dark
mode while `--seal-blue` stays navy, so ink set with it measured 1.43:1. A signed-out sweep would have passed that too.
The Program Requirements targets (S343, S347) were seeded for the same reason.

## When this applies (and when it doesn't)

It applies to any view whose content depends on a session, a role or a live read: COBI tabs over gated tables, a
reviewer's editor, a dialog that opens on a click. It does not apply to a public, static page whose markup is the
content. A seed shows the layout and color of the view; it does not prove the live data is right, which is the
wiring check's job.

## See also

- `docs/ui_pass_lessons.md` (S358) and `.claude/commands/a11y-pass.md`.
- [`methodology-a-phrase-sweep-misses-what-a-line-break-splits`](methodology-a-phrase-sweep-misses-what-a-line-break-splits.md):
  the glyph sweep missed MAP Users' emoji labels for the same reason a phrase sweep misses split text; the labels sat on
  their own concatenated lines.
