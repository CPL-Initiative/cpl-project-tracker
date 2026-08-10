---
title: Playbook — build a CPL executive/board deck, and fill an existing brand PPTX template
created: 2026-07-20
updated: 2026-08-10
tags: [playbook, presentations, pptx, funding, communications, speaker-notes]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_presentations_lessons]]"
artifacts:
  - presentations/build_bog_deck.py
  - presentations/build_cbo_slides.py
  - presentations/fill_template.py
  - live_metrics.json
  - fact_sheet_metrics.json
  - cpl_funding_data.js
---

# Playbook — build a CPL executive/board deck, and fill an existing brand PPTX template

> **One-sentence summary** — where the numbers/messaging come from for a CPL exec deck, how to
> build one with `python-pptx`, and — the higher-value half — how to drop new slides *natively*
> into someone else's brand PowerPoint template (theme colors, fonts, layouts, watermark, footer).

## Context

The StarBOG session (2026-07-20) built two deliverables: a 12-slide Board of Governors update deck
and three CBO budget-workshop slides dropped into the Chancellor's Office "2026 Annual Budget
Workshop" template. This note distills the reusable parts so the next session asked for "a few
CPL slides" doesn't re-derive the data map or re-learn the template-fill mechanics. Full narrative:
[`docs/cpl_presentations_lessons.md`](../cpl_presentations_lessons.md).

## The claim

### 1. Data sources — fetch live, never hardcode

| Need | Source | Key |
|---|---|---|
| Headline KPIs (students, units, savings, 20-yr impact, active colleges) | `live_metrics.json` | `metrics[]` (pre-formatted card values), `scraped_at` |
| Credit recs, statewide exhibits by sector, Fire Tech numbers | `fact_sheet_metrics.json` | `credit_recommendations`, `statewide_exhibits.by_sector` |
| Implementation funding model | `cpl_funding_data.js` (`window.CPL_FUNDING`) | `pool` (one-time / ongoing / floor / carve-outs), `year_priorities` |
| The COBI **3 priorities** | `cpl_funding_data.js` → `year_priorities` | P1 Completion **30%** · P2 Access **42%** · P3 Capacity/visibility/mobility **28%** |
| P2/P3 actuals per college | `cpl_funding_performance.js` | — |
| Baccalaureate / pathway maps | `cpl_baccalaureates_data.js`, `cpl_pathways_ccr_data.js`, `kb/pathway_feeder_fields.json` | — |

**Naming rules are mandatory** (CLAUDE.md → "Naming & terminology"): the program is the **CPL
Initiative**; the platform is the **MAP platform** (never "MAP Initiative"); "Military Articulation
Platform" is **history-only**.

### 2. Legislative facts (2026–27 budget) — reconcile before citing

- **SB 111** (appropriation): **$42M** for CPL, of which **$7M ongoing** → **$35M one-time**.
- A budget-summary figure of **$37M / $2M ongoing** exists in an **earlier** DOF draft — treat
  SB 111 as authoritative and reconcile before quoting either.
- **SB 135 / AB 135** establishes CPL as a **systemwide initiative** under the **Master Plan for
  Career Education**. New campus duties: evaluate incoming students' prior learning & credentials;
  adopt faculty-developed statewide credit recommendations; **accept transcribed CPL from other
  colleges**; intersegmental (CSU/UC) alignment; Calbright/COCC CPL recs to DOF+JLBC by **7/1/2027**.
- When a model detail is "still in discussion" (priority **weights**, the floor amount, carve-out
  amounts), keep the **number off the slide** and present the *framework* qualitatively.

### 3. Build from scratch with `python-pptx` (the BOG deck)

16:9 = `Inches(13.333) × Inches(7.5)`; blank layout `slide_layouts[6]`; small helpers for
rect / textbox / stat-tile; brand palette as `RGBColor`; a **speaker script in `slide.notes_slide.
notes_text_frame`** on every slide (users present from Presenter View). See `build_bog_deck.py`.

### 4. Fill an existing brand template (the CBO slides) — the higher-value technique

1. **Inspect**: `python scripts/thumbnail.py template.pptx template-thumbs` (pick layouts) and read
   `ppt/theme/theme1.xml` for the **exact brand palette + fonts**. (CCC brand: navy `002F6D`, blue
   `0066BA`, gold `FFB600`, cyan `40B4E5`, grey `555759`; font **Source Sans Pro**.)
2. **Find the blank content slides** and the layout they use (here **"Text Only One Area"** = a
   Title placeholder + a Body placeholder). Section decks follow a *divider → blank-content* rhythm.
3. **Fill with `python-pptx`**: set the **Title placeholder** text and *do not override its font* (it
   inherits the native title style); **delete the empty Body placeholder** so no "Click to add text"
   prompt renders; draw your own shapes in the body region (**y ≈ 2.0–6.45"**) using the brand palette
   and the theme font.
4. **Add a slide** with `prs.slides.add_slide(existing_slide.slide_layout)` (it appends at the end),
   then **reorder** by moving its `sldId` element in `<p:sldIdLst>` with lxml `target_sldId.addnext(new)`.
5. **Validate + QA**: `python scripts/office/validate.py out.pptx --original template.pptx`, then
   `soffice --convert-to pdf` → `pdftoppm` → view every touched slide.

### 5. Design + tooling gotchas

- **Anti-AI-tells** (from the `pptx` skill): no accent line under a title, no edge-stripes on cards.
  Use a consistent **circle motif** (check-dots, numbered circles) + subtle tint cards instead.
- **Keep titles ≤ ~32 chars** so they stay one line in a large title placeholder; long titles wrap
  into the body and collide with the intro line.
- **Source Sans Pro is QA-unreliable** in LibreOffice (it substitutes) — leave ~10% width slack and
  don't fully trust the render's text-fit for it.
- **The sandbox has no Impress/poppler by default.** `apt-get update && apt-get install -y
  --no-install-recommends libreoffice-impress poppler-utils` (run with `dangerouslyDisableSandbox`).
  Until then, `.pptx` won't render — fall back to reading each shape and emitting positioned HTML,
  screenshotting with the preinstalled Chromium (`/opt/pw-browsers/...`).

### 6. Speaker notes: write them into the deck, and give the presenter a run sheet

A deck someone *else* presents is not finished at the last slide. Two artifacts close it:

**Notes in the notes field, one structure per slide** so the presenter can find things under
pressure — `THE POINT` (the single thing this slide must land) / `SCRIPT` (speakable sentences, not
bullet fragments, with `[CLICK]` cues marked) / `NUMBERS` (every figure with its source and as-of
date) / `IF SHORT ON TIME` (what to cut). Set them with `python-pptx`
(`slide.notes_slide.notes_text_frame`), and **preserve any production note already in the deck** —
the CAC deck's slide 9 carried "Video – Need Audio", which is exactly the kind of thing that
matters on the day.

**Budget the time explicitly and under-fill it.** For a 15-minute slot, write ~13:00 of script and
say so. Put a running clock on each slide's note and name which slides to cut to headlines if the
session runs behind.

**A one-page run sheet beats scrolling presenter view.** A timing ladder (time · clicks · slide ·
the one thing it must land), the numbers that can be said out loud, and a boxed "check before you
present" list. Long background goes on page 2, not into the middle of the script. Render HTML with
headless Chromium `--print-to-pdf` — LibreOffice's HTML import is unreliable, and `@page` +
`page-break-before` give clean pagination.

**Mark every number that is not from the live dashboard.** The CAC pack's riskiest line was a
retention statistic reaching us through a policy source citing DAS — with DAS in the audience.
Flagging it as *attribute, don't assert* is worth more than the statistic.

## How we got here

BOG deck (12 slides, brand-navy, speaker scripts) → also published as a private draft artifact.
Then the CBO ask: 3 slides on the $35M one-time funds → COBI 3 priorities + guiding principles,
amounts held. Filled the CO's Annual Budget Workshop template's empty CPL content slides (17–18 +
one added) natively; validated `--original` and QA-rendered every slide. PRs from the earlier
BOG deck: #808 (opened, then closed by Sam — he took the file directly).

## When this applies (and when it doesn't)

- **Applies** to any exec / board / CBO CPL deck, and the §4 template-fill + §5 tooling steps
  generalize to filling *any* brand-template `.pptx`, CPL or not.
- **Does not** cover the public `cpl-knowledge-base` (audience-facing, human-gated curation — a deck
  is never promoted there as a checkpoint side effect).

## See also

- [`docs/cpl_presentations_lessons.md`](../cpl_presentations_lessons.md) — workstream narrative.
- The `pptx` skill (template-fill scripts: `thumbnail.py`, `add_slide.py`, `validate.py`, `office/soffice.py`).
- CLAUDE.md → "Naming & terminology" (mandatory naming rules for all output).
