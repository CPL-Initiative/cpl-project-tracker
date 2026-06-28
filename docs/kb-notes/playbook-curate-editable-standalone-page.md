---
title: Curate-editable overlay for a standalone static page
created: 2026-06-28
updated: 2026-06-28
tags: [playbook, supabase, auth, fact-sheet, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[playbook-standalone-public-page]]"
  - "[[methodology-refresh-token-before-write]]"
  - "[[methodology-live-overlay-onto-generated-cards]]"
artifacts:
  - fact-sheet/factsheet_edit.js
  - fact-sheet/supabase_factsheet_overrides.sql
  - tests/factsheet_edit.test.js
---

# Curate-editable overlay for a standalone static page

> **One-sentence summary** — make any static HTML page editable-in-place by a
> logged-in reviewer (text + hide/show) via a *content-agnostic* Supabase overlay
> keyed by DOM-walked stable keys, so the page's HTML needs almost no change and
> the baked HTML stays the always-on fallback.

## Context

Sam wanted the public CPL Fact Sheet (`fact-sheet/`, a **standalone** page — no
COBI nav, its own JS) editable with a "sign in to Curate" affordance, the same
reviewer pattern the CCR / RACI / TMC tabs use, so he can change boxes (retire a
resource card, update a legislation reference) without a code change. A second
session was concurrently editing a *different* region of the same page, so the
edit had to land with **near-zero footprint in the shared HTML** to avoid a merge
conflict. Both goals point to the same design.

## The pattern

**1. Overlay table, not hard-edits.** One Supabase table keyed by a stable
per-box key → `{ html, hidden, edited_by, edited_at }`. Public **SELECT** (the
overlay is applied for every visitor); writes gated by `is_allowed_reviewer()`
(the shared magic-link reviewer list — reuse it, don't invent a new gate). The
baked HTML is always the fallback: **empty table = the page exactly as authored.**

**2. Assign keys by walking the DOM, not by hand-stamping HTML.** A standalone
edit module computes each editable box's key at load = `sectionId + '|' +
slug(box's baked text)`, stamped as `data-fsk`. Because the key is derived from
the *baked* text and computed *before* any override is applied, it doesn't drift
when a box is edited (the override changes the live DOM, not the baked HTML the
key is recomputed from on the next load). **This is the crux:** the page's
`index.html` needs only a button + a `<script>` tag — no per-box `data-edit-key`
attributes. Tiny diff → minimal merge-conflict surface (the whole reason this
beat hand-stamping when another session shared the file).

- Collisions on identical leading text are disambiguated with a per-(section,sig)
  ordinal (`key~2`, `key~3`).
- Stability is the property to test: two fresh loads of the same HTML must yield
  identical key sets (`tests/factsheet_edit.test.js`).

**3. Exclude the live / contended regions by selector, in JS.** Skip whole
sections (here: the live data-bound KPI grid `#progress`, the `#statewide-exhibits`
section another session owned, the `#contents` chrome) and skip any box that *is*
or *contains* a `[data-bind]` element (never let a reviewer hand-edit a live
metric). Because editability is JS-driven, **excluding a region needs no HTML
change** — it's a selector, so it never touches the other session's lines.

**4. Self-contained auth on the standalone page.** A standalone page has no host
app to process the magic-link callback, so the module does it itself: parse
`access_token`/`refresh_token` from `location.hash` on load → store the shared
`cpl_sb` sessionStorage session → `history.replaceState` to clean the hash (the
`cpl_news.js` pattern). Reuse the **refresh-token-before-write** guard
(`ensureFresh()`) so a format-valid-but-expired JWT doesn't 401 saves silently
(see [[methodology-refresh-token-before-write]]).

**5. Sanitize on the public render path.** Reviewer-authored `html` is injected as
`innerHTML` for everyone — writes are reviewer-gated, but defense-in-depth on a
public page is cheap: strip `<script>`/`<iframe>`/…, `on*` handlers, and
`javascript:`/`vbscript:`/non-image `data:` URLs before display (a `<template>` +
attribute walk). Formatting a box needs — links, bold, lists — survives untouched.

## The one external dependency: the magic-link redirect URL

For a *direct* sign-in from the standalone page, the page's own URL must be in the
Supabase **Auth → URL Configuration → Redirect URLs** allow-list (the shared
project's list was set to the dashboard root only). Add the page path — or, better,
a wildcard `https://cpl-initiative.github.io/cpl-project-tracker/**` that also
covers `kb-portal/` and future standalone pages. Until it's added, GoTrue falls
back to the Site URL (the dashboard) and the session lands in a *different tab*
(sessionStorage is per-tab) — so the standalone page can't see it. **This is a
one-time dashboard toggle the human owner does** (auth config is off-limits to
sessions without sign-off, and the Supabase MCP doesn't expose an auth-config
setter). Flag it explicitly; don't assume it's set.

## Gotchas

- **jsdom boots oddly.** With `runScripts:"outside-only"`, `document.readyState`
  reads `"loading"` at `eval` time and DOMContentLoaded already fired, so a
  module's deferred-boot listener never runs in the test. Expose `boot()` on the
  module's test surface and call it explicitly (real browsers boot fine from an
  end-of-body script).
- **Don't inject edit controls *into* the box** — it pollutes the innerHTML you'd
  later save. Use a single capture-phase delegated click handler (clicking a box
  in curate mode opens the editor and is suppressed from navigating any link
  inside it) + a CSS `::after` "edit" badge. The box's content stays clean.
- **Capture `baked = el.innerHTML` at key-assignment time** (before any control
  or override touches it) — it's the "Reset to original" source of truth.
- **Hidden-while-curating must still hide in print.** A reviewer mid-curate sees
  hidden boxes as a dimmed placeholder; add a print rule so they don't print.

## Result

`fact-sheet/index.html` diff = a Curate button + a script tag + the one requested
box removal. All edit logic lives in `fact-sheet/factsheet_edit.js`; the data lives
in `public.factsheet_overrides`. 26 jsdom checks guard the keys, exclusions,
overlay, and sanitizer. Zero overlap with the concurrent Statewide-CRs work.
