---
title: "Methodology — a hybrid live-vs-manual value column (single source by construction)"
kb-status: published
created: 2026-06-30
session: 85 (SkyLight)
tags: [methodology, dashboard, kpi, supabase, generator, drift]
related:
  - docs/annual_workplan_authoritative_lessons.md
  - excel_to_dashboard.py
  - workplan_goals.js
---

# A hybrid live-vs-manual value column

**Problem.** A table column shows "the current value" of some metric, but a
*subset* of its rows have an authoritative **live** source (a scrape, an API, a
computed KPI) while the rest only have a **hand-entered** value. If you keep a
single manual store for the whole column, the live-backed rows silently **drift**
from wherever that live value is displayed elsewhere (a headline card, a widget).
If you make the whole column live, you have nowhere to put the rows that have no
live equivalent.

**Pattern — per-row source flag, live wins by construction.**

1. **One authoritative map** `id → live_key` (here `PID_TO_KPI_KEY`). Keep it at
   module scope so every consumer (the column, any card, the ordering) shares it.
   Audit it — a stale mapping (`3.2→eligible_units` when 3.2 is *transcription*)
   is exactly the drift you're trying to kill.
2. **Mapped rows** render the live value **verbatim** + a `live · as of <date>`
   badge, **read-only** (no edit affordance at all → read-only *by construction*,
   not by a JS guard you can forget). Verbatim matters: live values are often
   pre-formatted/abbreviated strings (`"100k"`, `"$321M"`) — reformatting them
   would (a) break parity with the surface you're trying to match and (b) fail to
   round-trip through a number formatter.
3. **Unmapped rows** get a real **manual** store (a new nullable column) + a
   click-to-edit affordance, falling back to the legacy value when null
   (back-compat + offline snapshots).
4. A per-row **`source: 'live' | 'manual'`** flag drives both the renderer
   (badge + read-only vs editable + `✎`) and the editor (the live cells carry no
   edit attribute, so the delegated handler never fires on them).

**Sequencing gotcha (the part that bites).** The structure that *builds* the
table often runs **before** the live values are merged/available. Don't reorder
the pipeline to fix this. Instead, the build only **stamps the live_key + a manual
baseline**, and a small **post-pass** runs *after* the live merge to flip the
mapped rows to `source='live'` and attach the live display string. The post-pass
**degrades gracefully**: a mapped row whose live value is missing stays manual.

**Single-store titles (the sibling fix).** When the same label lives in two
tables and drifts, pick one store, **repoint the render to it** (join by id,
fallback to the old field), and add an editor on the **new authoritative surface**
that PATCHes that one store — the same field every other editor writes. The edit
then shows everywhere on the next regen.

**Why it's robust.** "Live cells have no edit attribute" makes read-only a
property of the markup, not of runtime auth state. "Verbatim live string" makes
the column equal the headline surface by construction — there's no formatter to
disagree. "Post-pass after merge" keeps the heavy build untouched and the live
wiring in one tiny, testable function.

**Tests to write.** Unit-test the helper precedence (live_key stamping, manual
baseline + fallback), the post-pass (flip mapped, leave unmapped, skip-on-missing),
and the render (live badge present + cell NOT editable; manual cell editable).
Integration-test the editors end-to-end in jsdom: a live cell opens no editor and
fires no write; a manual cell PATCHes the right column; signed-out fires nothing.
(jsdom `runScripts:"outside-only"` leaves `readyState="loading"` — dispatch
`DOMContentLoaded` so a deferred IIFE binds.)

First applied: the Annual Workplan "Current" column (Session 85) — mapped
sub-activities track the live headline KPI; unmapped ones use
`workplan_goals.current`.
