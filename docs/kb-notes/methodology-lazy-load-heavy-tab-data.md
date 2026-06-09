---
title: Lazy-load heavy per-tab data behind tab activation
created: 2026-06-09
updated: 2026-06-09
tags: [methodology, performance, dashboard, tabs, front-end]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[reference-daily-dashboard-data-pipeline]]"
artifacts:
  - tabs.js
  - unified_courses.js
  - statewide_interactive.js
  - credential_reference.js
  - excel_to_dashboard.py
  - tests/lazy_tab_data.test.js
---

# Lazy-load heavy per-tab data behind tab activation

> **One-sentence summary** — A tab-routed single-page dashboard must NOT eager
> `<script>`-load a tab's multi-MB data payload at page boot; defer it to the
> tab's first activation so the default view stays fast.

## Context

Session 36: the dashboard had grown to eager-load **~17 MB of per-tab JSON**
before the page was interactive — `unified_courses_data.js` (7.1 MB, CCR),
`statewide_data.js` (6.6 MB, EACR), `credential_reference_data.js` (2.6 MB,
CER), `statewide_prescriptive.js` (0.6 MB, EACR) — via plain `<script src>`
tags, **none needed by the default Dashboard tab**. Parse alone measured ~880 ms
on fast V8 (realistically 1.5–4 s in the browser), and each tab's consumer ALSO
rendered its full (hidden) table at `DOMContentLoaded`. The result tripped the
browser's "a script is slowing down this page" warning. It crept up gradually as
the datasets grew, so it read as "suddenly sluggish."

## The claim

For a hash-routed tabbed SPA, the per-tab data payload + the tab's first render
belong **behind the tab's first activation**, not at page boot. The default tab
should load only its own assets. Concretely, the pattern is two tiny helpers on
the tab router + a one-block boot in each heavy consumer:

- **`CPL_TABS.onActivate(tab, cb)`** — fire `cb` once, the first time `tab` is
  activated. Also fire immediately if that tab is *already* active (deep-link /
  refresh onto it). The router dispatches a `cpl-tab-activated` CustomEvent from
  `activate()` and tracks `_currentTab`.
- **`CPL_TABS.loadScript(src, globalName, cb)`** — inject `src` once
  (idempotent by `src`); call `cb` on load, or immediately if `window[globalName]`
  is already set. **Fail soft** (`cb` on error too) so the consumer's own
  missing-data guard renders a graceful empty state.
- **Consumer boot:** `onActivate("<my-tab>", () => loadScript("<my_data>.js",
  "<MY_GLOBAL>", init))`. Keep a defensive `else` that eager-inits when
  `CPL_TABS` is absent (unit tests eval the consumer in isolation; also guards a
  load-order regression).

Eager → lazy split, per file:

| Keep eager (small, registers the boot) | Lazy-load on tab open (heavy data) |
|---|---|
| `unified_courses.js`, `statewide_interactive.js`, `credential_reference.js` | `unified_courses_data.js`, `statewide_data.js` + `statewide_prescriptive.js`, `credential_reference_data.js` |

## How we got here / traps

1. **Verify each heavy global is read by ONLY its own tab's consumer** before
   deferring (`grep` the `window.CPL_*` reader set). Here each was — nothing on
   the Dashboard or in shared features (report generators, quickstart) touched
   them, so deferring was safe.
2. **Top-level data reads break under lazy load.** `statewide_interactive.js`
   captured `var DATA = window.CPL_STATEWIDE` *and derived filter vocab from
   `exhibits`* at IIFE-execution time. Those must move into a `start()` /
   `deriveFromData()` that runs after the data lands — declare the closure vars
   unassigned at top (so the other functions still close over them), assign
   inside `start()`. (`unified_courses.js` / `credential_reference.js` already
   read their global inside `init()`, so they only needed the boot swap.)
3. **The generator re-injects script tags.** `excel_to_dashboard.py` maintains an
   `sw_scripts` eager-inject list AND the daily cron regenerates the HTML —
   removing a tag from the HTML alone won't survive. Drop the data files from
   `sw_scripts` (keep the consumers) **and** add a stale-tag stripper so an old
   HTML self-heals on the next regen (idempotent).
4. **Race:** the router's `init()` (on `DOMContentLoaded`) may activate the
   default tab *before* a consumer registers its `onActivate` — so `onActivate`
   must also check `_currentTab` synchronously, not rely on the event alone.
5. **Test the failure mode** (`tests/lazy_tab_data.test.js`, jsdom): the default
   tab injects **zero** heavy data scripts; each tab injects exactly its file,
   once, on activation; `loadScript` is idempotent + fails soft; and the two
   HTMLs stay byte-identical (Rule 4).

## Result

Default Dashboard load drops from ~17 MB to ~1 MB of eager JS; the heavy tabs
spin up (~0.5–1 s once) on first visit, then are cached for the session.
