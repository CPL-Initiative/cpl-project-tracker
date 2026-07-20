---
title: CPL executive presentations — lessons (BOG update + CBO budget workshop)
date: 2026-07-20
tags: [lessons, presentations, pptx, funding, communications, bog, cbo]
artifacts:
  - presentations/build_bog_deck.py
  - presentations/build_cbo_slides.py
  - presentations/fill_template.py
  - presentations/20260716_CPL_Initiative_BOG_Update.pptx
  - presentations/20260720_CPL_CBO_Implementation_Funding.pptx
related:
  - "[[docs/kb-notes/playbook-building-cpl-executive-presentations]]"
  - "[[CLAUDE]]"
---

# CPL executive presentations — lessons

Workstream scratchpad for CPL board / executive slide decks. Append a dated section per checkpoint.
Distilled, reusable version:
[`docs/kb-notes/playbook-building-cpl-executive-presentations.md`](kb-notes/playbook-building-cpl-executive-presentations.md).

## 2026-07-20 — StarBOG: BOG update deck + CBO budget-workshop slides

### (a) What we learned

- **The tracker already holds everything an exec deck needs** — headline KPIs (`live_metrics.json`
  `metrics[]`), sector/exhibit/Fire numbers (`fact_sheet_metrics.json`), and the funding model incl.
  the COBI 3 priorities (`cpl_funding_data.js` → `year_priorities`: P1 Completion 30 / P2 Access 42 /
  P3 Capacity-mobility 28). No new data work needed; the risk is *staleness*, so fetch live.
- **Two build modes, very different effort.** (1) From-scratch with `python-pptx` (BOG deck) is
  fast once you have helper functions. (2) Filling *someone else's brand template* (CBO slides) is
  the higher-skill task: inspect the theme for the exact palette/fonts, reuse the template's own
  content layout, set the native Title placeholder, delete the empty Body placeholder, draw custom
  shapes in the body band, and reorder `sldId`s. Result looks genuinely native.
- **Sandbox tooling was missing** — LibreOffice **Impress** and **poppler-utils** are not
  preinstalled, so `.pptx` wouldn't render at first. Installed both (`apt-get`, sandbox disabled).
  Before that, a **faithful pptx→HTML renderer + Chromium** (read each shape, position it, screenshot)
  was the QA fallback and is worth keeping for environments where Impress can't be installed.
- **Legislative reconciliation matters.** SB 111 = $42M CPL / $7M ongoing → **$35M one-time**; an
  earlier DOF summary said $37M / $2M ongoing. SB 135/AB 135 makes CPL a **systemwide initiative**
  under the **Master Plan for Career Education** (evaluate incoming prior learning, adopt statewide
  recs, **accept transcribed CPL from other colleges**). Sam's rule: keep in-discussion **amounts**
  (weights, floor, carve-outs) off the slides; present the *framework* only.
- **Design discipline from the `pptx` skill paid off** — no under-title accent lines, no card
  edge-stripes; a circle motif (check-dots + numbered priority circles) carried across slides.

### (b) Current state

- **BOG deck** — `presentations/20260716_CPL_Initiative_BOG_Update.pptx`: 12 slides (cover ·
  positioning · statewide KPIs · the $7M+$35M funding win · COBI 3 priorities · portal soft-launch ·
  My CPL Story · EMT video placeholder · Moreno Valley EM B.S. pathway (illustrative) · partnerships ·
  Fire/CSTI hand-off to Miramar · close), speaker script in every slide's notes. Also published as a
  **private draft artifact**. PR #808 was opened then **closed by Sam** (he took the file directly).
- **CBO slides** — filled into the CO "2026 Annual Budget Workshop" template's CPL section (slides
  17–19 after the divider): *Standing Up CPL at Every College* · *Three Funding Priorities* ·
  *Guiding Principles*. Native CCC brand (Source Sans Pro, navy/blue/gold, watermark, footer).
  Standalone brand-navy version also generated (`20260720_CPL_CBO_Implementation_Funding.pptx`).
  Delivered as the full 33-slide workshop deck.

### (c) Roadmap / parked

- **Parked / optional** (offered, not yet requested): a one-page Miramar Fire talking-points brief;
  real student photos/names on the My CPL Story slide; PDF handout exports.
- **Flagged to Sam**: the CBO template's CPL divider reads "Samual Lee" (typo for *Samuel*) — left
  untouched as his content; offered to fix.
- **Reusable going forward**: the `presentations/` generators + the template-fill technique are the
  starting point for the next exec deck.

### (d) Next concrete step

Nothing pending unless Sam requests a follow-up (brief / photos / PDF, or the typo fix). This is a
self-contained side-lane; the CCR mainline handoff + `cpl_todos.json` were intentionally left
untouched.
