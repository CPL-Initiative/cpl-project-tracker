---
title: Session 49 handoff — the First Light retheme (spec BLESSED, go paint the dashboard)
created: 2026-06-12
updated: 2026-06-12
tags: [handoff, session-49, first-light, retheme, design-system]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 49

You inherit the **First Light design sprint** (Session 48, 2026-06-12 — ten
PRs #391–#400, all merged same-day). Sam BLESSED the spec ("Looks great!",
16:41 UTC). **Your headline workstream: the live-dashboard token retheme.**

## What shipped in Session 48 (read in this order)

1. `docs/first_light_lessons.md` — the whole arc + lessons + next steps.
2. `prototype/first_light_theme_v1.html` (**v1.6 = THE SPEC**, live at
   `/prototype/first_light_theme_v1.html` on Pages) + `prototype/check_contrast.py`
   (run it; 31/31 — every token derived + measured).
3. `docs/kb-notes/methodology-derived-aa-token-palette.md` +
   `docs/kb-notes/reference-public-domain-art-sourcing.md`.
4. `first_light.js` — LIVE production feature: once-a-day plein air greeting
   (3 PD paintings), gallery lightbox, read-aloud, reflection box → Supabase
   `cpl_reflections` (anon WRITE-ONLY RLS — verified as anon: insert ✓,
   select 0 rows). Tests: `tests/first_light.test.js` (27),
   `tests/first_light_prototype.test.js` (43).

## The retheme — what Sam approved

Monochrome warm base + glass CHROME / opaque DATA + ghosted grayscale
painting behind the page + five accents with fixed jobs:
**cobalt `#0047AB`** interactive · **crimson `#920000`** negative ·
**hunter `#2C601A`** positive · **violet `#6D28D9`** machine-generated ·
mustard (bright `#E3B341` dots/banners only; labels use `--mustard-text
#8B6800`). **Chips are GLASS-QUIET (v1.6, Sam: "Love the glass view. Let's
run with that!")**: translucent `rgba(255,255,255,.5)` fill with NO per-chip
backdrop blur, `--border-strong` gray outline, darker accent TEXT, .72rem
semibold, uniform 6.5rem × 26px, 8px corners, `chip-fit` for glyph-only
badges, glyph-paired semantics always. The solid family is ARCHIVED in the
mock's Chip Studio (option on file: re-solid crimson for findings if triage
scanning suffers). **Chip-restyle checklist** when you paint: CCR/CER/audit
badges, the 📋 To-Do chips (`cpl_todos.js`), and the CSR sweep chips (per
the sibling CCR/CSR session's note). Tab-subtitle proposals
(Basecamp/Atlas/Field Guide/…) are demo content — confirm with Sam before
shipping them live.

## Retheme implementation notes (hard-won, honor these)

- Token NAMES already mirror the live `:root` (both HTMLs, ~line 19) — the
  retheme is a VALUE swap + new tokens. Rule 4: byte-identical HTMLs.
- `EXHIBIT_ANALYSIS_CSS` in `excel_to_dashboard.py` carries generator-emitted
  colors — retheme those via tokens too or the daily cron repaints old hexes.
- Glass: chrome only (rail/masthead/hero/modals); tables stay opaque;
  `prefers-reduced-transparency` + `prefers-contrast` + worst-case scrims per
  the spec; ghosted painting = grayscale `filter`, ~10% opacity, body text
  always on surfaces.
- **KPI drag-reorder must survive** (`kpi_reorder.js` re-matches by label) —
  add a retheme regression test; its keyboard path is the conformance gap to
  close (Sam explicitly wants drag-drop kept).
- Grow `check_contrast.py` into the CI contrast lint over the live `:root`
  (non-required check, js-tests pattern).
- Sam iterates by SCREENSHOT — keep the versioned banner pattern; bump
  `?v=N` cache-busts in links; ship small PRs, merge on `unstable`.
- Git loop per squash-merge: `git fetch --prune origin && git rebase
  origin/main` then plain push (lease chokes on auto-deleted branches).

## Carryover (not yours unless Sam steers there)

- First Light: manifest growth 3 → 60–90 (PD diligence per the sourcing KB
  note), reflections themes job (service-role mining → a community card),
  Almanac gallery (stub link exists).
- The Session-47 M-ID queue (CSR collisions, smog residuals, canonical-SUBJ4
  fold scope) — see `docs/session_48_handoff.md` + `kb/cpl_todos.json`.

## Safety patterns

Rule 1 (generator owns regenerated sections), Rule 4 (two HTMLs), Rule 5
(never force-push main), merge-on-green incl. `unstable`, write-only tables
stay write-only (never add a SELECT policy to `cpl_reflections`), no PII in
committed artifacts (pii_guard), bright mustard is never text.

## Moniker

Session 48 = **Bruh Glasstronaut** (Sam-christened at session close). Claim
your own — **"The Painter"** suits the retheme. Good light to you. 🚀
