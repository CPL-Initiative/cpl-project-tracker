---
title: "EACR — Exhibit & CR Adoption — lane state"
created: 2026-08-28
updated: 2026-08-28
tags: [reference, roadmap-lane]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
---

# EACR — Exhibit & CR Adoption

> **Relocated verbatim from `CLAUDE.md` §11 on 2026-08-28** (Session 206, the
> consolidation). This is **always-current lane state, not an archive** —
> update it at every checkpoint that moves this lane, exactly as you used to
> update the §11 cell. `CLAUDE.md` keeps the one-line pointer; the detail is
> here.

**What this lane is:** One place to see every exhibit, its credit recommendations, and the colleges that could adopt it.

## Status

✅ **FILTER REWORK + MATRIX SUB-TAB + CSV EXPORT ALL LIVE** (Sky162 #1221–#1223 · Sky163 #1226 · Sky165 #1229 · #1230). Three college scopes — `adopted` (default) · `likely` (the prescriptive M-ID layer, which **names the local course**) · `any` (*a lead, not a match* — TOP-derived, so Rule 7 forbids it as a primary determination); **Sam has used it and confirmed the arrangement** (2026-08-17). Matrix = CER titles × colleges, **green adopted / brown still-available** (in parentheses so it survives greyscale), default **434 rows × 118 cols, 17.0% inked**, 1.6s on tab select. **Sam's four rulings, locked:** brown is the **peer benchmark** · open on **colleges** · default rows **≥2 adopters** · brown on **credible cells only**. ⚠️ **FILTER, COLUMN AND EXPORTS MUST SHARE ONE SCOPE** — made structural, not remembered: `matrixCell()` is ONE function called by both grid and CSV, so the spreadsheet cannot drift from the screen. ⭐ **ONE COLLEGE WAS TWO COLUMNS — a fold at the LABEL layer is not a fold.** `CaÃ±ada` is `Cañada` read as latin-1 and `excel_to_dashboard.py` emits BOTH (26 pairs); invisible because every consumer counted *through* `cplCollegeShort()`, whose `normalize()` folds `Ã±`→`n` — the label count was right for the wrong reason. Would have rendered an empty twin column, **indistinguishable by eye from a college with no data**. Folded in the roster rules as a **SUM**, never a pick. [`methodology-a-fold-at-the-label-layer-is-not-a-fold`](docs/kb-notes/methodology-a-fold-at-the-label-layer-is-not-a-fold.md). ⚠️ **Roster rules (`kb/reference/map_college_roster_rules.json`) are the ONE place identity folds belong.** Axis = **118 = 115 credit + 3 noncredit**; the 4th, **Mt. SAC Noncredit, has no identity in `map_colleges`** (Learning Partners item 1). ⚠️ **BROWN CANNOT BE THE LINE TOTAL** — 83% of adoptions are PARTIAL (median **3.07 of 9.26**) and no college has ever reached the total. ⚠️ **`chatbox_peer_articulations` IS THE WRONG UNITS SOURCE** (32.5% coverage); the raw `View_ArticulatedMAPExhibits` row carries college+course+rec together, so `adopter_units` reads at 100%. NOT `map_college_cr_unit` (reviewer-gated, no k-anonymity). ⚠️ **A content filter must never drop a column** — that reads as "this college has nothing"; narrow only under college-shaped filters. **NEXT: Sam looks at the grid in a browser** — density is his call; then the tilde (`Canada College` today), then fix the mojibake at source in `_build_statewide_prescriptive()`. **Curation carryover:** 4 unclassified-only titles the CER knows · 2 statewide cards matching no college · sweep `{0,N}` test bounds · the 50-group credential-view cap. Story: [`docs/eacr_scope_lessons.md`](docs/eacr_scope_lessons.md).
