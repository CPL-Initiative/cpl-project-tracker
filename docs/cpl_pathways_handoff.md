---
title: "CPL Pathways handoff — pick up the course-map lane after SkyIron"
date: 2026-07-10
tags: [handoff, cpl-pathways, cerritos, ironworker, cac-presentation]
artifacts:
  - cpl_pathways.js
  - cpl_pathways_data.js
  - tests/cpl_pathways.test.js
related:
  - "[[cpl_pathways_lessons]]"
  - "[[methodology-live-derived-pathway-checkoffs]]"
---

You are picking up the **🎓 CPL Pathways** workstream (SkyIron's side-lane,
2026-07-10; PRs #732/#733/#735/#736/#740 all merged same-day, plus checkpoint
#734). This is a NAMED workstream handoff — the numbered
`session_<N>_handoff.md` lane belongs to the CSR/CER mainline (SkyMighty wrote
`session_112_handoff.md`); don't collide with it.
Read `docs/cpl_pathways_lessons.md` first — it holds the full story.

## What this is

An audience-facing tab for the **California Apprenticeship Council — Third
Quarter Meeting, 2026-08-13** (topic: CPL and the CCC baccalaureate in CTE
disciplines). THREE course-map views on the program picker, one story each:

1. **Cerritos — Field Ironworker Supervisor BS** (*CPL done right*): a
   journeyworker sees what their card is worth — **✓ 31.5 units of CPL**
   (all 15 MAP-articulated IWAP courses — covers the 27–29u A.S. major) +
   **◆ 15 GE units CLEP-eligible** (ESLEI 24-35 → the CGEC areas) = **39%
   of the 120-unit degree, no seat time**.
2. **Foothill — Dental Hygiene BS** (*the ADOPTION map*): ✓0 today (12 AP
   lines are Foothill's whole MAP presence); six violet **⊕ chips**
   live-derive the precedent — West LA's RDA License (11 courses) + RDH
   License (capstone/pharmacology/nutrition) — as an adoption menu.
3. **Foothill — Respiratory Care BS** (*the VISIBILITY map*): Foothill's own
   catalog already awards **24 quarter units of CPL** for NBRC TMC(hi)+CSE +
   RCP license + Law & Ethics — scoped to the 68qu completion year
   (✓24/44-in-class/35%); the pitch: put catalog CPL in MAP so every
   counselor sees it.

**⚡ Quick Adopt v1 (#736)**: every ⊕ panel takes an adoption request →
Supabase **`cpl_adoption_interest`** (anon INSERT-only, NO public SELECT,
team SELECT via `is_allowed_reviewer() OR team_pass_ok()`; schema
`kb/supabase_adoption_interest.sql`, migration applied live). Sam sent the
link to colleagues 2026-07-10 for first-look feedback; expect iteration asks.

## Architecture (don't fight it)

- `cpl_pathways_data.js` = curated REQUIREMENTS only (+ `stage` = the
  published status). `cpl_pathways.js` DERIVES the ✓ marks live from
  `credential_reference_data.js` (college+subj+num match, numbers normalized
  so "40.5" ≡ "40.50") and the CLEP ◆ options from `ge_credit`.
  KB note: `methodology-live-derived-pathway-checkoffs.md`.
- `no_count: true` sections (the Structural "articulations in progress" card)
  render + live-resolve but never enter the unit buckets.
- Status stages: 📝 discussion-draft (shipped default) / ✓ active / ⏸ tabled.
  Data `stage` = published truth; the on-page selector writes localStorage
  only (`cplPathwaysStage.<id>` — a per-browser presenting flip).
- ⬇ PDF = print-window clone (toolbar stripped, CLEP panels expanded,
  literal-hex token block injected because the window has no `:root`).
- **⊕ adoption chips**: curated `adopt:{credentials|disc}` stamps → live
  cross-college derivation (home college excluded); `no_count`-safe;
  ✓-covered rows never chip. **⚡ Quick Adopt** = the intake form inside each
  ⊕ panel (validation → anon POST, success swap, fail-soft).
- Quarter campuses: `unit_system:"quarter"` (tile word + CLEP 4-qu minimum);
  `cpl.source` phrases college-awarded-outside-MAP CPL; `total_tile_label` /
  `cpl_tile_label` override tile wording per program.
- Tab shell in BOTH HTMLs (Rule 4); everything else is the static JS pair.
  Tests: `tests/cpl_pathways.test.js` (97) — run `npm test` from repo root.

## Open items, in priority order

1. **Feedback wave from Sam's colleagues** — iterate the visual. Likely asks:
   wording, unit framing, a shareable standalone page (fact-sheet pattern),
   print polish.
2. **The adoption-queue lane** — a team-gated view over
   `cpl_adoption_interest` (the sierra_feedback lane pattern; triage statuses
   already in the schema) + a status-transition RPC. Re-point ⚡ Quick Adopt
   at the MAP Exhibit Module's authenticated adoption flow when Malone
   exposes one.
3. **Real upper-division course list (Cerritos)** — the regionalcte.org
   record's section-4 COURSES table is **JS-rendered: browser-only**. Sam can
   screenshot it — then replace the 10 topic-area rows with real
   codes/titles/units.
4. **Start-term confirmation** — "Fall 2027" is Sam's premise + same-cohort
   precedent (Mesa PTA); confirm with Cerritos before the CAC deck is final.
5. **Foothill unit verification** — CHEM/ENGL/COMM (DH) and RSPT 300/304 (RC)
   units are inferred/unmarked; CGEC areas 3–7 numbering indirect. Check the
   catalogs from a real browser when convenient.
6. **Pathway #4** — carpentry is the obvious next (CARP family freshly
   curated in the CER, S110).
7. **Sam's parked mission**: the CCC catalog course+program → Supabase
   harvest loop (see `kb/cpl_todos.json` `ccc-catalog-harvest` — scope first;
   COCI already covers courses, programs are the gap, CourseLeaf bot-blocks).
8. **Watch the IWAP 40.07 units** — one older-catalog source said 3u vs
   MAP/COCI's 4.0u; live derivation uses MAP's value.

## Patterns that worked

- Scout local reference data BEFORE web research (`kb/reference/
  coci_course_list.xlsx` had the full 24-course IWAP inventory all along).
- Research fleet + adversarial verify (4/4 CONFIRMED) for anything headed to
  a public audience.
- Screenshot the real render (Playwright + the preinstalled Chromium against
  `python3 -m http.server`) — the dashboard's First Light modal intercepts
  clicks; remove `.cplfl-overlay` first.

## Safety patterns to honor

- Rule 4 (both HTMLs identical — the test enforces it) · merge on `unstable` ·
  poll CI via MCP github tools, never curl · sandbox can't reach github.io /
  *.supabase.co / regionalcte.org / foothill.edu.
- `cpl_adoption_interest` carries contact PII — its no-public-SELECT RLS is
  the boundary; never widen. The page `<title>`/og:title are GENERATOR-owned
  (`COBI_TITLE` in excel_to_dashboard.py, #740) — change them there.
- The uc_desc_lane red-X saga resolved 2026-07-10: the ECED fixture drift was
  fixed presence-conditionally on the mainline (#739); suite fully green.

Moniker suggestion: **SkyGirder** — or claim your own.
