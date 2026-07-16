---
title: CPL Pathways side-lane handoff — the Common Course Reference redesign
date: 2026-07-16
tags: [handoff, cpl-pathways, ccr, cobi, side-lane, starx]
artifacts:
  - kb/_build_cpl_pathway_ccr.py
  - cpl_pathways_ccr_data.js
  - kb/pathway_feeder_fields.json
  - cpl_pathways.js
  - tests/cpl_pathway_ccr.test.js
  - tests/cpl_pathways_ccr_render.test.js
related:
  - "[[cpl_pathways_lessons]]"
---

# CPL Pathways — Common Course Reference redesign (StarX, 2026-07-15/16)

## What shipped (all MERGED to main)

- **#794 — CCR engine.** `kb/_build_cpl_pathway_ccr.py` → `cpl_pathways_ccr_data.js`
  (`window.CPL_PATHWAY_CCR`), keyed `"<NORMCOLLEGE>|<top4>"` per baccalaureate. Per
  articulated course: local cert(s), the **Common Course Reference** (C-ID/CCN/minted
  M-ID via `coci_minted_memberships`), units, **field-agreement peers**, plus
  **course-grain opportunities** and a **cross-field over-merge flag**. Wired into
  `daily-dashboard.yml` (daily-fresh). Field is taken from the **catalog** (4-digit TOP),
  NOT `coci_articulations`' 2-digit division stamp (`"58"`) — that was the 0-rows bug.
- **#796 — feeder fields.** `kb/pathway_feeder_fields.json` lets a multidisciplinary
  program aggregate CPL across feeder disciplines under other TOP codes. Miramar Public
  Safety Management (TOP 2199, upper-div management → no CPL) now pulls Fire (2133) +
  EMS (1250) + AJ (2105): **0 → 34 courses / 104u**. The flag now compares each course's
  OWN catalog field (so feeder courses aren't false-flagged).
- **#797 — two-view render.** `cpl_pathways.js` `renderCcrViews()` — a Student/College
  toggle replaces the legacy ✓/⊕ sections when CCR data exists. **Student** = course +
  local cert ("Qualify with X OR Y"); **College** = + CCR chip, field-agreement,
  opportunities, ⚠ flags (all `.col-only`). Fails open → legacy sections if enrichment
  absent or render throws. Boots the data file in both HTMLs (Rule 4).

Mockup (locked live with Sam): https://claude.ai/code/artifact/647293d9-57b4-498c-9e41-418e0545be01
Tests: `cpl_pathway_ccr` (21) + `cpl_pathways_ccr_render` (17); full suite 164 files green.

## Next steps (priority order)

1. **Contact block (fast-follow).** Per-college **CPL coordinator + landing page** from
   Supabase `map_college_contacts` (`cpl_coordinator` / `cpl_coordinator_email` /
   `landing_page_url`; Miramar coord = Suzanne Freeman). Fetch client-side in
   `renderCcrViews` (anon key — verify RLS allows read; Sam said it's public via Sierra).
   Intro should route students to *submit through the landing page* (creates the MAP
   record), coordinator as "who to contact for help." No-coordinator fallback → "Contact
   *[College]* for help" using the school's general email.
2. **AUTO 116 → Construction split** — a CCR-mainline re-mint (Rule 7 dry-run). `AUTO 116`
   (Santa Ana, Electrical Fundamentals) is over-merged into `CNST M1062` (TOP 0957) with
   College of the Desert's `ACT 331A`. Split back to Automotive. The pathway flag surfaces
   it live.
3. **Publish** — after any merge, dispatch `daily-dashboard.yml` (or wait for cron) so
   `cpl_pathways_ccr_data.js` regenerates and the cards go live.
4. **Competency-spine adoption view** — Sam parked it ("explore later"). The ASE-area
   spine collapses the adoption pool to new competency areas; the structured `code`/
   competency is the seed.
5. **`in_coci: false` supplement** — extend `pathway_feeder_fields.json` (or its Supabase
   successor) with `supplemental_courses` for genuinely-not-yet-in-COCI programs.

## Patterns / safety honored

- Fails-open consumer; Rule 4 (both HTMLs); merge-on-green (clean OR unstable); daily-fresh
  generator so mints/re-mints/merges ripple. Prototype-in-artifact → lock → port.
- Don't amend the GitHub squash-merge / cron commits on `main` (Rule 5) — the stop-hook
  false-positives on them; refresh `~/.claude/stop-hook-git-check.sh` from the repo copy.
