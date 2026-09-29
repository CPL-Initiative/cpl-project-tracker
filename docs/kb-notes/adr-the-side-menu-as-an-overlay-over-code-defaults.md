---
title: The side menu as a curator overlay over code defaults
created: 2026-08-14
updated: 2026-08-14
tags: [adr, admin, cobi, navigation, fail-safe, architecture]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/adr-judgment-in-tables-mechanism-in-code]]"
  - "[[docs/admin_tab_lessons]]"
artifacts:
  - nav_overlay.js
  - nav_groups.js
  - cobi_orgs.js
  - chatbox/supabase_cobi_nav.sql
---

# ADR — the side menu as a curator overlay over code defaults

**Status:** accepted, shipped 2026-08-14 (#1195, #1196).
**Context:** Sam asked for the COBI side menu to be rearrangeable by drag and
drop — order, grouping, naming, per-site visibility and audience — from one
place. The menu lived in three code files with nothing for a drag to write to.

## Decision

`public.cobi_nav` **overlays** the code defaults; it never replaces them. The
page builds its menu from `nav_groups.js` + the markup and **paints it**, and the
overlay is applied only if and when it arrives.

This is the same shape as `sierra_rules`, adopted for a sharper reason.

## Why the overlay direction is not negotiable here

The nav is the entry point for **every** visitor including anonymous ones.

> A rules table that fails closed gives you an untuned bot.
> **A nav that fails closed gives you a site with no navigation.**

So the failure budget is asymmetric, and the tests are weighted to match: a
feature that silently does nothing is an annoyance; a menu that silently
disappears is an outage. Offline · HTTP error · malformed rows · a throwing
`plan()` · a corrupt cache · **a read that never resolves** each has a test
asserting the shipped menu survives intact.

The never-resolving case is the one worth copying. A promise that never settles
is what a blocked or very slow connection actually looks like, and it is the only
way to observe first paint:

```js
if (opts.pending) return new Promise(function () {});   // never settles
```

## The guarantee cannot live in the table

`admin` and `dashboard` cannot be hidden, cannot lose their pin, and refuse to be
dragged into a group; `admin` is **lifted out** of a group that gets hidden rather
than disappearing with it.

That has to be enforced in `nav_overlay.js`, because **the table is the thing
being guarded**: one row hiding the Admin tab removes the only surface that can
un-hide it, from every browser at once, with nothing to deploy in between. Same
reasoning as `PROTECTED_RULE_KEYS` in `cpl-chat`.

Enforce it at **three** points, because one is not enough:
1. `plan()` ignores a `hidden` flag on a protected tab (the render is honest),
2. `moveTab()` refuses the drag (the UI never accepts a move it would undo),
3. the row omits the control entirely (no button that does nothing — the
   `Clear owner` no-op lesson).

## Two lists, not one — recoverability is the axis

| List | Members | Why |
|---|---|---|
| `PROTECTED` (never `hidden`) | `admin`, `dashboard` | irrecoverable from the browser |
| `AUDIENCE_LOCKED` (never audience-filtered) | `dashboard` only | an audience rule IS recoverable — sign in and it returns |

`admin` may carry an audience rule precisely because signing in brings it back.
`dashboard` may not, because a public visitor arriving at a site with no home has
nowhere to go. **Ask "can the viewer get themselves back?" — that is the axis,
not "is this tab important".**

## Consequences

- **Delete IS the reset.** Unlike `sierra_rules`, `cobi_nav` has a DELETE policy:
  an empty table is exactly what "how it ships" means, and it is what a curator
  reaches for after a bad drag. There, the record of what was tried is worth more
  than a clean slate; here the **code is** the record, and `cobi_nav_log` keeps
  the history.
- **Rebuild MOVES the buttons.** `tabs.js` derives `VALID_TABS` from those
  elements and other modules hold bound listeners, so recreating them breaks
  navigation on click only — invisible until someone clicks.
- **A hidden tab keeps its button** (`data-nav-hidden`, `display:none`) so its
  deep link still routes. Hiding is a menu setting, not a takedown.
- **Display is not security.** `hidden`, `orgs` and `audience` change who SEES an
  item. The Admin tab prints the real RLS gate in the same row, and the audience
  control warns *on itself* when the data behind it is public-read.
