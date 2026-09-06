---
title: A view swap that does not move the hash strands the user
created: 2026-09-06
updated: 2026-09-06
tags: [methodology, ui, routing, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/skyview.html
  - docs/skyview_video2_findings.md
---

# A view swap that does not move the hash strands the user

> **One-sentence summary** — In a single-page view that routes on the hash,
> painting a new view without updating the hash removes the user's every way
> back at once, and each loss is silent.

## Context

`prototype/skyview.html` hosts several views — the map, the comprehensive view,
the workspace, ESL — and `__ccrRoute()` reads `location.hash` to decide which to
paint. Double-clicking the map is an accelerator for the panel's "Open the work
surface" button: it calls `__ccrDiscipline(name)`, which sets `state.v`, sets the
crumbs, and replaces `#view`.

It never calls `syncHash()`.

## What was measured

| step | `location.hash` | canvas present | `h1` |
|---|---|---|---|
| start | `#skyview` | yes | SkyView |
| `__ccrDiscipline('Welding')` | **`#skyview`** | **no** | **Welding** |
| `__ccrRoute()` | `#skyview` | yes (rebuilt) | SkyView |

The URL keeps asserting `#skyview` while a different view is on screen.

## Four failures, one cause

Every route back out depends on the hash, so all of them break together:

1. **Back does nothing** — no history entry was ever created.
2. **`hashchange` cannot fire**, so the router never learns the view changed.
3. **The view menu disagrees with the screen** — it reads the route, which still
   says the user is where they no longer are. The user's words:
   *"now I'm over here in no man's land."*
4. **A refresh silently returns to the old view**, discarding the work.

And because the way back re-runs the router, the return **rebuilds from
scratch**: every selection is lost. The user predicted this before testing it —
*"it's going to reset sky view… I have to start all over"* — which is what a
person does after being burned once.

## The lesson

**The hash is not a bookmarking nicety; it is the state the browser's own
affordances read.** Back, refresh, history, and any menu that reflects "where am
I" are all derived from it. A view swap that skips it doesn't degrade one
feature — it removes the entire category of ways out, and none of them announce
their absence.

So: **if painting a view is a navigation to the user, it must be a navigation to
the browser.** Any code path that replaces the main view sets the route, and the
router is the only thing that paints. A swap that deliberately does not create
history (a transient overlay, say) has to supply its own way back explicitly.

⚠️ **A stale label can make a swap look like a page load.** This page's masthead
read "SkyView — prototype v1", so both the user and the session reviewing the
recording believed a navigation to an old prototype file had occurred. It had
not — one page, two views. Measuring the hash is what corrected it.
