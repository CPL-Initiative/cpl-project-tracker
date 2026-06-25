---
title: Playbook — a standalone public page on the COBI Pages site (sits alone, live data, prints to PDF)
created: 2026-06-25
updated: 2026-06-25
tags: [playbook, public-page, github-pages, live-data, print-to-pdf, tabs]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb_portal_lessons]]"
artifacts:
  - fact-sheet/index.html
  - fact-sheet/factsheet.js
  - fact-sheet/factsheet.css
  - kb-portal/index.html
---

# Playbook — a standalone public page on the COBI Pages site

> **One-sentence summary** — to give an audience a public web view that "sits
> alone" (no COBI nav, no access to the internal tabs) yet pulls live data and
> prints to a clean PDF, build a self-contained page under its own subdirectory
> (`fact-sheet/`, like `kb-portal/`) and link to it from the nav rail with a
> *non-tab* anchor.

## Context

COBI is one big tabbed SPA (`index.html` / `CPL_Dashboard.html`). Sometimes you
need a page for an *external* audience — consultants, journalists, the public —
that must be shareable on its own URL but must **not** expose the internal
curation/data tabs. A tab can't do this (every tab carries the full rail). The
answer is a separate page in its own folder, served by the same GitHub Pages
site. First instance: the **CPL Fact Sheet** (`fact-sheet/`,
[`docs/fact_sheet_lessons.md`](../fact_sheet_lessons.md)); prior cousin: the
**KB Portal** (`kb-portal/`, same pattern + a Supabase auth gate).

## The claim

### 1. The page is a subdirectory bundle, not a tab

`fact-sheet/{index.html, factsheet.css, factsheet.js, img/}` — its own
`<!doctype html>` with **no COBI nav rail**. GitHub Pages serves the whole repo
from `main`, so it's instantly public at
`…/cpl-project-tracker/fact-sheet/`. It is **static and NOT a daily-cron
artifact** (don't add it to the workflow `git add` list).

### 2. Live data with zero server: fetch the cron's own artifact

`live_metrics.json` is published daily at the site root. A page one level down
reads it relatively and binds it:

```js
fetch('../live_metrics.json', { cache: 'no-store' })   // same Pages origin
  .then(r => r.json())
  .then(d => /* fill [data-bind] spans from d.metrics */ )
  .catch(() => /* keep the baked-in snapshot, label it "snapshot" */ );
```

Bake the current values straight into the HTML as the **fallback** — the page is
fully readable with JS off or the feed unreachable; live data just enhances it.
Only what's in `live_metrics.json` (the 6 headline KPIs + breakdowns) auto-
updates; anything from the Custom Reporting Module is a **labeled snapshot**.

### 3. "Launch from COBI" = a non-tab anchor in the rail

`tabs.js` derives its tabs from `nav.cpl-tabs .cpl-tab[data-tab]`. An anchor with
the `cpl-tab` class but **no `data-tab`** is styled like a nav item, is ignored
by the router, and just navigates:

```html
<a class="cpl-tab cpl-tab-external" href="fact-sheet/" target="_blank"
   rel="noopener" style="text-decoration:none;display:block">📄 CPL Fact Sheet ↗</a>
```

Mirror it in BOTH `index.html` and `CPL_Dashboard.html` (Rule 4). It lives in the
static template, so the daily regen leaves it alone.

### 4. Print-to-PDF is the "export"

A print stylesheet (`@media print { @page { margin: 0.4in } … }`) that hides the
on-screen chrome turns the browser's "Save as PDF" into the deliverable — always
current, no docx pipeline. If the page has `<details>`, open them all on
`beforeprint` and restore on `afterprint` so collapsed content prints.

## How we got here

Built for the CPL Fact Sheet, Session 74 (SkyBlaster), PRs #537 + #540 — see
[`docs/fact_sheet_lessons.md`](../fact_sheet_lessons.md). Verified headless with
the pre-installed Chromium served over a local `http.server` (so `../` resolves).
Merged on the required TruffleHog secret-scan only; publishing to `main` makes
the URL live but does not broadcast it (the owner shares the link), so
merge-on-green is low-risk for this kind of page.

## When this applies (and when it doesn't)

- **Applies** to any audience-facing micro-page that should be public + isolated
  from the app's tabs and benefits from the daily live metrics (a one-pager, a
  campaign landing, a printable brief).
- **Does NOT apply** when the surface needs the app's shared filters/auth/state —
  that's a real tab. And when content must be **gated**, add the bundle's own
  Supabase auth like `kb-portal/` rather than relying on obscurity.
- **Don't** route a non-`live_metrics` figure through the live fetch and call it
  "live" — label Custom-Reporting-Module numbers as a snapshot.

## See also

- [`docs/fact_sheet_lessons.md`](../fact_sheet_lessons.md) — the workstream story
- [`docs/kb_portal_lessons.md`](../kb_portal_lessons.md) — the gated cousin
- `CLAUDE.md` §2 (File Inventory → `fact-sheet/`), §7b (Tab Layout)
