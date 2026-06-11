---
title: "Auto-layout tables silently park columns off-pane: diagnose with the inspector, defend with fixed layout"
date: 2026-06-11
kb-status: published
type: methodology
tags: [methodology, front-end, css, tables, layout, debugging, jsdom, perf, ccr]
artifacts:
  - unified_courses.js (ensureUcFixCss #3 + the render() colgroup — the defense)
  - tests/uc_fixed_layout.test.js (guards the defense, NOT the layout — see §4)
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 43 — the discovery story)
  - docs/kb-notes/reference-ui-design-system.md (the no-horizontal-scroll mandate)
---

# Auto-layout tables silently park columns off-pane

## 1. The failure class

A wide data table (`width:100%`, default `table-layout: auto`) lives inside a
scroll wrapper (`overflow: auto; max-height: 70vh`). One unusually wide cell
in the *current row set* inflates its column; the table outgrows the wrapper;
the trailing columns land **past the wrapper's right edge**. Three properties
make this look like data loss instead of overflow:

1. **The horizontal scrollbar renders at the BOTTOM of the wrapper** — below
   70vh of rows — so nobody discovers the content is scrollable.
2. **Headers vanish too** (they're columns like any other), which reads as
   "the table is missing columns," not "the table is wide."
3. **It varies with the filtered row set** (each set lays out its own column
   widths), which masquerades as a data bug — "discipline X broken,
   discipline Y fine."

## 2. Why the usual repro lies to you

A jsdom/DOM-level repro — even one driving the real filter controls over the
real payload — renders the **complete, correct DOM** and passes. jsdom does
not implement CSS layout; this failure exists *only* in layout. If a DOM
repro is clean while the user's screenshot shows missing columns, suspect
layout immediately and skip ahead to the inspector rung.

## 3. The diagnostic ladder (each rung kills a hypothesis class)

1. **Payload scan** — do the rows carry the fields? (kills: data bug)
2. **DOM repro** with real renderer + real data + real overlays, driving the
   real controls (kills: render-path bug, thrown exceptions)
3. **Incognito / second browser** (kills: extensions, profile cache)
4. **Console** (kills: runtime errors; a lone 404 is usually noise — expand
   its URL before chasing it)
5. **Elements inspector on the "missing" region** — the decisive rung. All
   `<th>`s present with text + a `scroll` badge on the wrapper = off-pane
   columns, case closed.

Ask for rung 5 *early* when rungs 1–2 pass: one user screenshot of the
Elements panel replaces hours of remote theorizing.

## 4. The defense

- **`table-layout: fixed`** on the table + an **explicit `<colgroup>`** with
  per-column percentage widths (without one, fixed layout splits all columns
  evenly — unusable for mixed content). No cell content can ever widen a
  column past its share, so the table can never outgrow the wrapper at
  desktop widths.
- **`min-width`** on the table (e.g. 900px) keeps the wrapper's
  `overflow-x: auto` as the *deliberate* narrow-screen safety net.
- **Overflow-clip ONLY the text-bearing columns.** Under fixed layout, long
  content wraps inside its column; clipping is needed only where unbreakable
  tokens could overpaint neighbors. A blanket `td { overflow: hidden }`
  creates a paint-clip context per cell — at 500 rows × 15 columns that was
  ~7,500 contexts and a user-noticeable interaction slowdown. Scope it
  (here: title / subject / discipline / TOP / flags), and keep a full-value
  `title` hover or detail-modal path for anything clippable.
- A jsdom test **cannot assert the layout**; pin the *defense* instead
  (the injected rules exist; the colgroup col-count matches the header
  count; every `<col>` carries a width) and say so in the test header.

## 5. Reusable checklist

When a user reports "missing columns / blank cells" in a wrapped table:

1. Scan the payload for the fields (rung 1) — don't trust the symptom.
2. DOM-repro with the real assets (rung 2); if clean, say "layout" out loud.
3. Get incognito + console + **inspector** from the user (rungs 3–5).
4. Look for the `scroll` badge / compare `table.scrollWidth` to the wrapper.
5. Fix structurally (fixed layout + colgroup + min-width), not by hunting
   the one wide cell — the next row set will find another one.
6. Perf-check the fix at table scale before shipping; scope clip contexts.
