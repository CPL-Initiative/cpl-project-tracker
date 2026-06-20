---
title: COBI — the masthead rename and the Mamba brand layer
created: 2026-06-19
updated: 2026-06-19
tags: [lessons, cobi, branding, masthead, ui, easter-egg]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/first_light_lessons]]"
artifacts:
  - cobi_brand.js
  - excel_to_dashboard.py
  - tests/cobi_brand.test.js
---

# COBI — the masthead rename + the Mamba brand layer

Workstream scratchpad for renaming the dashboard masthead to **COBI —
Chancellor's Office Business Intelligence**, a light Kobe homage Sam asked for.

## Session 65 (2026-06-19, Skyloft) — shipped PR #475

### What shipped

- **Masthead → COBI.** The wordmark **COBI** + the backronym tagline
  *Chancellor's Office Business Intelligence* (Sam's improvement on his own
  "Interface" → "Intelligence": it *is* a BI/analytics surface). Nav label
  "CPL Project Tracker" → "COBI"; CPL stays discoverable in the project
  description + the data tabs.
- **`cobi_brand.js`** — a STATIC, regen-proof asset (the `first_light.js`
  pattern): injects its own CSS + runtime DOM. Three touches:
  1. a **rotating "Mamba" subtitle**, a fresh phrase each load (Mamba Mentality ·
     Bean Counting 🫘 · Mamba Time · Mambadata · Black Mambanator · Job's Not
     Finished · Every Unit Counts · Data Don't Lie · Mambacademics · …);
  2. an **8 → 24 jersey wink** — a tiny superscript on the wordmark that flips
     between Kobe's two retired numbers on hover;
  3. **Mamba Day (Aug 24)** — the masthead goes purple & gold for the day.
- **Generator (`excel_to_dashboard.py`)** — the `<title>`/`<h1>` now emit COBI,
  **decoupled from `proj_title`** so the Word reports keep the project's own
  name. Rule 1 honored (the generator still owns the h1; the static template
  carries the same COBI fallback).
- **Tests** — `tests/cobi_brand.test.js`, 17 jsdom checks (Rule 4, the rotating
  slot drawn from the lineup, the 8→24 hover flip, Mamba Day). Full suite green
  (59 files).

### Lessons worth remembering

1. **Decouple the masthead from `proj_title`.** The generator built the h1 from
   `proj_title`, which also (potentially) names other outputs. Hardcoding the
   COBI h1/title literally — rather than repurposing `proj_title` — kept the
   rename scoped to the dashboard surface and out of the Word reports.
2. **Keep the generator-replaced h1 simple.** The generator's `<h1>[^<]*</h1>`
   regex only matches plain text — so the wordmark is `<h1>COBI</h1>` and all
   the personality (the 8→24 span, the sizing) is layered on at runtime by
   `cobi_brand.js`. Same regen-proof move as First Light's chip.
3. **A double-quoted Python string for the apostrophe.** "Chancellor's" inside a
   single-quoted f-string would break; the `re.sub` replacement uses a
   double-quoted literal.
4. **The homage winks, it doesn't shout.** A rotating subtitle + a hover flip +
   a once-a-year color flip read as warmth to those who notice and as a normal
   BI masthead to everyone else — defensible on an org-facing CO dashboard.

### Current state / next steps

- **DONE + LIVE** (PR #475 merged to `main`). COBI is the masthead now.
- Tunables on the table if Sam wants: wordmark size/letter-spacing, the Mamba
  lineup (add/cut phrases in `cobi_brand.js` `MAMBA`), the Mamba-Day colors.
- No follow-on work queued. The rename is self-contained.
