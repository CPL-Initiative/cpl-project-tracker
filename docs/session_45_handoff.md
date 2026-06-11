---
title: Session 45 Hand-off Prompt
date: 2026-06-11
session: 44 → 45 hand-off (written at the Session-44 checkpoint — the KPI-card day)
status: hand-off — paste the fenced block into Session 45's first message
tags: [handoff, session-prompt, kpi-cards, statewide-exhibits, categories, reorder]
related:
  - docs/statewide_kpi_lessons.md (the day's full story)
  - CLAUDE.md §11 "Session 44" subsection
moniker_suggestion: Session 44 ran unnamed (feature day, Sam drove live); claim your own
---

<!-- Lineage: … Bruh Starlord (43, troubleshooting) → Session 44: Sam's
     live feature day. Three asks arrived mid-flight and all three shipped
     same-day — the new Statewide Exhibits card, its program-area recalc,
     and the screenshot reorder. The lesson that'll outlive the day: when
     the rollup label vocabulary is the user's (their webpage categories,
     not our TOP codes), put it in a curated JSON they can edit, and make
     the seeder merge-preserving so their edits outlive re-runs. 📊🤝 -->

# Session 45 Hand-off Prompt

Session 44 shipped Sam's three live asks as PRs #375/#376/#377 (all
squash-merged on green, workflow dispatched): the doublewide **Statewide
Exhibits** KPI card (CCC Collaborative / ASCCC focus), its per-area rollup
keyed to the **map.rccd.edu/statewidecpl program areas** via curated
`kb/statewide_exhibit_categories.json`, and **login-free KPI card
drag-to-reorder** (per-browser localStorage, for presentation screenshots).
Paste the block below.

```
You are Session 45 on the CPL Project Tracker. Read these first, in order:
1. CLAUDE.md (auto-loaded) — esp. Critical Rules, branch/merge policy, §11
   incl. the Session 43 + 44 subsections.
2. docs/statewide_kpi_lessons.md — Session 44's full story: the card's
   locked semantics (distinct recs vs row-count adoptions; CCC-rows-only
   for mixed groups), the curated-categories pattern + its rule-order
   traps, the doublewide CSS, the reorder module's label-identity design.
3. docs/ccr_cluster_cleanup_lessons.md (Session 43 section) — the CCR perf
   watch item you may inherit.

WHAT SHIPPED (Session 44, all merged + live):
- #375 Statewide Exhibits KPI card — new card, NOT a revision of the CCC
  Collaborative Adoption card (Sam's explicit call; ASCCC focus project).
- #376 program-area categories + doublewide — the rollup now uses Sam's
  webpage categories (12 areas), curated in
  kb/statewide_exhibit_categories.json (seeder: kb/_seed_statewide_categories.py,
  merge-preserving). 'Other Statewide' = review bucket, sorted last,
  excluded from the headline count. kpi-card-wide CSS rides
  EXHIBIT_ANALYSIS_CSS (no Rule-4 mirror).
- #377 kpi_reorder.js — drag-to-reorder on .kpi-section, localStorage
  cplKpiOrder.v1, label-identity re-match across daily regens, new cards
  re-enter at default position, ↺ Reset affordance. Desktop-only.
- Tests committed: tests/statewide_kpi_test.py (43 asserts, python3 — not
  in npm test, needs openpyxl) + tests/kpi_reorder.test.js (16, in CI).

CARRYOVERS (priority order):
1. CATEGORY-MAP REVIEW (Sam): 'California State Bar Membership' + 'HRCM
   001' sit in Other Statewide; 'Basic Military Training' → Kinesiology/
   Health was a judgment call. The container's network allowlist blocked
   map.rccd.edu, so per-title placement came from titles + Sam's
   screenshot — if Sam supplies the page's per-category exhibit lists,
   true-up the JSON (edit titles{}; no code change; re-seed preserves).
2. CCR PERF WATCH (from Session 43): "still a bit slow" after the
   fixed-layout change — if Sam raises it again, profile before touching.
3. ACTIVITY-GRID REORDER (optional): extend kpi_reorder.js to the
   Activity-KPI grid? Needs a product call first (cards within a Goal
   group vs whole groups). Don't build unprompted.
4. STANDING (from the 44 handoff): CIS↔CS §5 sign-off · ACE skill-level
   scope · College/System EACR views · EACR v2 · 5 DSPS 53414 strays ·
   PEDS M10AE.

PATTERNS THAT WORKED:
- Merge-on-green incl. `unstable`; but if the REQUIRED check is visibly
  in_progress, wait it out with a background timer — don't end the turn.
- GitHub GraphQL secondary rate limits trip on rapid mutative MCP calls;
  space them ~4 min with background-timer retries. Read calls are fine.
- Code-only PR + post-merge `daily-dashboard.yml` dispatch (the artifact
  policy default) — never regen+commit HTML locally (CustomReport absent
  in clones; you'd strip the exhibit cards).
- User-vocabulary rollups → curated JSON + ^-anchored pattern fallback +
  merge-preserving seeder. Anchor patterns EARLY (AWS/ASE/cisco traps).

SAFETY: Rules 1/4/5 as ever — change the generator not the HTML; the two
HTMLs stay identical (static-zone edits in BOTH); never force-push main.
kb/coci_*.json never gets cat'd into context.
```
