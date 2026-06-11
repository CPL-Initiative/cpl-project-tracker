---
title: Statewide Exhibits KPI card + KPI grid UX — lessons
date: 2026-06-11
tags: [lessons, kpi-cards, statewide-exhibits, ccc-collaborative, asccc, categories, ui]
artifacts:
  - excel_to_dashboard.py (_parse_exhibits statewide rollup, merge_exhibit_metrics card, kpi-card-wide CSS)
  - kb/statewide_exhibit_categories.json (curated title→category map — THE editable source of truth)
  - kb/_seed_statewide_categories.py (merge-preserving seeder)
  - kpi_reorder.js (+ script tag in both HTMLs)
  - tests/statewide_kpi_test.py · tests/kpi_reorder.test.js
related:
  - CLAUDE.md §11 "Session 44" subsection
  - docs/engineering_practices_lessons.md (commit-the-test, var(--token), injected CSS)
---

# Statewide Exhibits KPI card + KPI grid UX

## Session 44 — 2026-06-11 (PRs #375, #376, #377 — all merged on green)

**What shipped.** (1) **#375** — a new headline **Statewide Exhibits** KPI card
(the CCC Collaborative / ASCCC focus surface, deliberately separate from the
CCC Collaborative Adoption card per Sam): exhibits + discipline coverage +
credit recs + adoptions, total and per area, with a methodology popover.
(2) **#376** — the per-area rollup re-keyed from broad TOP-code disciplines to
the **program-area categories on map.rccd.edu/statewidecpl** via a curated
JSON, and the card made **doublewide**. (3) **#377** — login-free
**drag-to-reorder** for the headline KPI grid (Sam's screenshot use case;
Session-25 strategic queue #2).

**Semantics locked into the card** (mirror these if the card is ever rebuilt):
- Grain = the **EACR credential group** `(unified_title, issuer, cpl_type)`;
  a group is statewide if ANY constituent row is CCC (reconciles with the MAP
  Exhibits card's CCC breakdown — 132 at ship time).
- **Credit Recommendations = distinct `(course, credit)` pairs on CCC rows**;
  **Adoptions = CCC rows carrying an Articulation College** (one row = one
  college articulating one rec). The older adoption card's "Collaborative
  Credit Recs" is the raw row count ≈ adoptions — the popovers spell out the
  difference so the two cards don't read as contradictory.
- Mixed Local+CCC groups: the **Local rows never feed rec/adoption counts**
  (they're not part of the statewide standard), but the group counts as
  statewide.

**The categories pattern (reusable).** Open-vocabulary rollup labels live in a
**curated JSON** (`kb/statewide_exhibit_categories.json`): exact title→category
map (all 132 current titles) + **ordered, `^`-anchorable keyword patterns** as
the generator's runtime fallback for future titles + an `Other Statewide`
residual bucket (shown in the rollup, excluded from the headline count, sorted
last) + an `in_progress` list (the HVAC workgroup line, mirroring the webpage).
The seeder is **merge-preserving** (re-runs keep existing assignments — curator
edits win — and only classify new titles), same philosophy as
`discipline_inference.json`. **Rule-order traps that bit during build:**
"AWS Certified" (Amazon→CIS) must precede the American Welding Society "AWS D…"
terms; `^ase ` (anchored) or "Database…" lands in Automotive; `^cisco` or
"…San Francisco" lands in CIS; EMT/Paramedic before the generic "fire"
(Firefighter EMT → EMS on the credential-being-recognized principle);
Corrections' CDCR/CPOST before AJ's "post". A pattern misfire is invisible
until a future title hits it — anchor early.

**Review queue for Sam:** "California State Bar Membership" + "HRCM 001" are
parked in `Other Statewide`; "Basic Military Training" → Kinesiology/Health was
a judgment call. The session container's network allowlist blocked
map.rccd.edu, so the category list came from Sam's screenshot — verify the
per-title placement against the live page when convenient (edit the JSON; no
code change).

**Doublewide KPI card.** `kpi-card-wide` spans 2 grid columns of the
auto-fit `.kpi-section` grid, with a 2-column footnote grid (header line spans
both) collapsing to normal under 640px. CSS rides `EXHIBIT_ANALYSIS_CSS` so the
daily regen injects it into BOTH HTMLs idempotently — zero Rule-4 hand mirror.
Any future card can opt in with `"wide": True`.

**KPI reorder (kpi_reorder.js).** Per-browser localStorage (`cplKpiOrder.v1`),
no auth/backend — "persists until someone reorders again" is exactly
localStorage semantics, and it can't surprise other viewers. Cards re-match by
**label text** each load because the KPI section markup regenerates daily
(node identity never survives); a renamed card falls back to its default spot;
a **new card re-enters at its default index** (never buried — the Statewide
card's same-day arrival proved new cards matter). ↺ Reset shows only while a
custom order is saved. Desktop-only HTML5 DnD. **jsdom gotcha:** with
`runScripts: "outside-only"`, `document.readyState` sits at `"loading"`, so a
DOMContentLoaded-deferred init never runs inside a synchronous test — make
`init()` idempotent and call it explicitly from the test.

**Ops note.** GitHub's GraphQL **secondary rate limit** trips on rapid
mutative MCP calls (create PR → mark ready → merge across multiple PRs).
Space mutations out with background-timer retries (~4 min); read calls were
unaffected. Unauthenticated REST polling from the shared egress IP is
rate-limited too — use the MCP tools, not curl.

**Next concrete steps.** (1) Sam reviews the category map (the two
Other-bucket titles + BMT placement) against the live webpage. (2) Decide
whether drag-to-reorder extends to the Activity-KPI grid (grouped under Goal
sub-headers — needs a product call: reorder cards within a group vs whole
groups; the module is generic enough either way). (3) Optional later add per
the strategic queue: an auth-gated **curated default order** writer (the
`kpi_order` column already exists server-side).
