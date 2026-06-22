---
title: COBI — the masthead rename and the Mamba brand layer
created: 2026-06-19
updated: 2026-06-22
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

## Session 68 (2026-06-22, SkyAlizarin) — the masthead consolidation (PR #487)

Sam asked to make the whole title "as simple and cohesive as possible." Iterated
five prototypes (`prototype/cobi_header_v1..v5.html`, sent via `SendUserFile` with
real tokens/fonts) → locked a **single-row "app bar"**, then ported it regen-safe.

### What shipped (PR #487 — built, tested, ready; holding merge for the seal asset)
- **Layout**: `seal + COBI`​`CPL` / tagline` (left) · **centered "Where To?" search**
  (the quick-start, moved out of its own yellow band into the masthead center slot,
  label + box + Go on one line) · subtle utility cluster (**ℹ About** popover ·
  **Manually Refresh COBI** · Updated stamp).
- **ℹ About popover** collapses the three info links (Project Description / See
  Attachments / Cheat Sheet) + **Today's painting** into one menu — the top bar reads
  as identity + one action, not a row of competing chrome.
- **Brand**: tagline = "Chancellor's Office Business Intelligence" **under COBI** (the
  "for CPL" suffix dropped); the **Kobe 8→24 wink → a gold `CPL` superscript**; the
  rotating **Mamba subtitle retired** ("for now," Sam). A v5 hairline outline on the
  gold CPL was tried then **removed** (Sam). **COBI now renders in seal-navy**
  (`--seal-blue`, a new `:root` token) with a Chancellor's-Office **seal to its left**.

### Lessons worth remembering
1. **You can rework a generator-owned + Rule-4 region almost without touching the
   generator** — park its text-anchor (the now-hidden `#cobi-mamba`) *inside* the new
   structure so the existing PROJ-INFO inject lands where you want; inject the new
   layout CSS from `cobi_brand.js` (no Rule-4 `<style>` mirror); keep `<h1>COBI</h1>`
   plain for the regex; only the Refresh button needed a generator edit (label +
   **strip-by-id** so a label change can't orphan a duplicate). Full method:
   `docs/kb-notes/methodology-regen-safe-section-rework.md`.
2. **Prove idempotency by running `excel_to_dashboard.py` twice and diffing** — the
   only delta should be the timestamp. (Also cleared 159 blank lines the old header
   had silently accreted.) jsdom test rewritten to 26 checks; full suite 61 files green.
3. **Code-only PR** — reset the HTMLs to the cron's `main`, re-apply *only* the
   structure + token, leave PROJ-INFO empty + no Refresh seed; the post-merge dispatch
   repopulates. Never commit the regenerated `unified_courses_*.js` data artifacts.
4. **Graceful-degrade a pending hand-off asset** — the seal `<img onerror=…hide>` means
   the rework merges with no broken image, decoupled from the seal upload.
5. **An image binary can't be pulled from chat** in this sandbox — Sam must upload the
   seal to the repo (GitHub web upload to the branch). Plan the hand-off, don't fight it.

### Current state / next steps
- **PR #487 is READY**, all green, **holding the merge only on the seal upload**
  (`assets/cccco_seal.png` on `claude/awesome-brown-dyd33o`). Next session: pull it,
  point `<img src>` at it, **sample its exact navy into `--seal-blue` (both HTMLs)**,
  commit, squash-merge, **dispatch the daily workflow** to publish the populated header.
- The seal `<img>` onerror-hides, so "merge now" (seal-less, fills in later) is a safe
  fallback if Sam prefers.
