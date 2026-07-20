---
title: CPL presentations — workstream handoff (StarBOG)
date: 2026-07-20
tags: [handoff, presentations, pptx, side-lane]
related:
  - "[[docs/cpl_presentations_lessons]]"
  - "[[docs/kb-notes/playbook-building-cpl-executive-presentations]]"
---

# CPL presentations — workstream handoff

> Side-lane handoff (does **not** replace the CCR mainline's numbered
> `session_<N>_handoff.md`, which StarBOG left untouched).

You are picking up the **CPL executive-presentations** side-lane. Read in order:
1. [`docs/cpl_presentations_lessons.md`](cpl_presentations_lessons.md) — what shipped + what was learned.
2. [`docs/kb-notes/playbook-building-cpl-executive-presentations.md`](kb-notes/playbook-building-cpl-executive-presentations.md) — the reusable how-to (data map, python-pptx, template-fill, tooling).

## What shipped (StarBOG, 2026-07-20)
- **BOG update deck** (12 slides, speaker scripts): `presentations/20260716_CPL_Initiative_BOG_Update.pptx`
  + generator `build_bog_deck.py`. Also a private draft artifact. PR #808 opened → **closed by Sam** (took the file directly).
- **CBO budget-workshop slides**: filled the CO "2026 Annual Budget Workshop" template's CPL section
  (slides 17–19) natively — *Standing Up CPL* / *Three Funding Priorities* / *Guiding Principles*.
  Generators: `build_cbo_slides.py` (standalone brand-navy) + `fill_template.py` (drops into the template).

## Carryover (offered, not requested)
- One-page **Miramar Fire** talking-points brief (their BOG segment has no slides).
- **Real student photos/names** on the My CPL Story slide.
- **PDF handout** exports of either deck.
- Fix the **"Samual Lee" → "Samuel Lee"** typo on the CBO template's CPL divider (his content — flagged, left untouched).

## Patterns that worked
- Fetch numbers **live** from `live_metrics.json` / `fact_sheet_metrics.json` / `cpl_funding_data.js` — never hardcode.
- To match a brand template: read `ppt/theme/theme1.xml` for the palette+fonts, reuse the template's own content layout,
  set the native Title placeholder, delete the empty Body placeholder, draw shapes in the body band, reorder `sldId`s.
- QA-render every slide (install `libreoffice-impress` + `poppler-utils` first; else the pptx→HTML+Chromium fallback).
- Honor the naming rules + keep in-discussion funding **amounts** off the slides.

## Safety / conventions honored
- Side-lane: **left `kb/cpl_todos.json` and the numbered `session_<N>_handoff.md` untouched** (CCR mainline owns those).
- **Did not** write to the public `cpl-knowledge-base` (human-gated curation only).

## Moniker
StarBOG (Board-of-Governors deck). Next in this lane: pick your own.
