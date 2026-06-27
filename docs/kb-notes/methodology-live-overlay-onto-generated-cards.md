---
title: Overlay live data onto generated cards via a stamped data-key hook
created: 2026-06-26
updated: 2026-06-26
tags: [methodology, dashboard, supabase, generator]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
artifacts:
  - card_updates.js
  - excel_to_dashboard.py
  - tests/card_updates.test.js
---

# Overlay live data onto generated cards via a stamped data-key hook

> **One-sentence summary** — to show always-fresh Supabase data on cards that the daily cron
> regenerates, have the generator stamp a stable, hidden `data-*` hook keyed to the row, and let a
> small static read-only JS overlay fill it on load — don't bake the value into the HTML.

## Context

The Activities & Projects cards are regenerated daily by `excel_to_dashboard.py`. The RACI tab's 📝
composer writes status updates to the Supabase `item_updates` table, but the cards still showed the
creation-era `projects.latest_update`. We needed the newest posted update to appear on the card face,
live — without coupling it to the daily cron's cadence. (Session 78, PR #564.)

## The claim

For live data on generator-regenerated cards, split the work in two:

1. **Generator stamps the hook, not the value.** Emit a hidden, empty element keyed to the row's
   identity — `<div class="cpl-live-update" data-update-key="project:1.1" style="display:none">` — on
   every card, plus a class (`cpl-static-update`) on any creation-era line the live value supersedes.
   The key MUST be the exact same string the writer used (here `item_type:item_id`, e.g. `project:1.1`
   / `activity:1`), so one identity addresses the card, the RACI row, the deep-link, and the nudge.
2. **A static, read-only JS overlay fills the hook.** On load (and on `cpl-tab-activated`) it fetches
   the table with the public anon key, reduces to the newest row per key, fills each matching hook
   (escaping the body — untrusted on a public page), reveals it, and hides the superseded
   `.cpl-static-update` within the same card (`closest('.activity-kpi-card,.project-card,…')`).

Why an overlay beats baking the value into the HTML during the cron run (even though the cron *has* the
service key): one static JS file covers **both** mirrored HTMLs with no Rule-4 duplication; it's live the
instant a row is written (not at the next cron); and it stays strictly read-only (no auth, no writes).

## How we got here

`card_updates.js` (`window.CPL_CARD_UPDATES`) + the generator hooks in `excel_to_dashboard.py`, PR #564.
The hook-key reuse leaned on a prior decision (Session 76) that a sub-activity is itself a `project:<id>`
RACI row, so the same key already existed. Guarded by `tests/card_updates.test.js` (latest-by-key
reduction, XSS escape, hook fill/reveal/static-hide, unmatched-key no-op, idempotent re-run).

## When this applies (and when it doesn't)

- **Applies** when the surface is regenerated on a schedule but the data wants to be live, the table has
  a safe public (anon) read path, and a stable per-row key exists on both sides. Pairs with the
  "static asset = live on merge; code-only PR + post-merge workflow dispatch" pattern.
- **Doesn't apply** when the value must be in the committed HTML (SEO, no-JS, print/PDF export) — bake it
  in the generator instead. Don't use it for data with no anon read policy (would force auth into a
  read-only widget) or where there's no stable shared key (you'd be matching on fragile text).

## See also

- `[[docs/cobi_raci_nudge_lessons]]` — Session 78, the workstream that produced this
- `[[docs/kb-notes/methodology-refresh-token-before-write]]` — the companion write-side lesson
- PR `#564` — the implementation

---

*Authoring check: durable (the split generalizes to any cron-regenerated surface over live data),
reusable (peer sessions/tabs), distilled (one concept: stamp the hook, overlay the value), self-contained.*
