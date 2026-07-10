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
2026-07-10; PRs #732 + #733, both merged same-day). This is a NAMED workstream
handoff — the numbered `session_<N>_handoff.md` lane belongs to the CSR/CER
mainline (SkyMighty wrote `session_112_handoff.md`); don't collide with it.
Read `docs/cpl_pathways_lessons.md` first — it holds the full story.

## What this is

An audience-facing tab for the **California Apprenticeship Council — Third
Quarter Meeting, 2026-08-13** (topic: CPL and the CCC baccalaureate in CTE
disciplines). It shows Cerritos College's **Field Ironworker Supervisor BS**
as a course map where a journeyworker sees exactly what their card is worth:
**✓ 31.5 units of CPL** (all 15 MAP-articulated IWAP courses — covers the
27–29u A.S. major) + **◆ 15 GE units CLEP-eligible** (ESLEI 24-35 → the CGEC
areas) = **39% of the 120-unit degree, no seat time**. Sam sent the link to
colleagues 2026-07-10 for first-look feedback; expect iteration asks.

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
- Tab shell in BOTH HTMLs (Rule 4); everything else is the static JS pair.
  Tests: `tests/cpl_pathways.test.js` (69) — run `npm test` from repo root.

## Open items, in priority order

1. **Feedback wave from Sam's colleagues** — iterate the visual. Likely asks:
   wording, unit framing, a shareable standalone page (fact-sheet pattern),
   print polish.
2. **Real upper-division course list** — the regionalcte.org record's
   section-4 COURSES table is **JS-rendered: browser-only** (invisible to
   crawlers/archives; the sandbox egress also blocks the site). Sam can
   screenshot it — then replace the 10 topic-area rows in the data file with
   real codes/titles/units and drop the "publishes ahead of fall 2027" note.
3. **Start-term confirmation** — "Fall 2027" is Sam's premise + same-cohort
   precedent (Mesa PTA); confirm with Cerritos before the CAC deck is final.
4. **CGEC areas 3–7 numbering** — names+units verified, numbering only
   indirectly; check the Cerritos catalog when reachable.
5. **Pathway #2** — the model generalizes (one program object per pathway;
   the program picker appears automatically at 2+). Carpentry is the obvious
   next (CARP family freshly curated in the CER, S110).
6. **Watch the 40.07 units** — one older-catalog source said 3u vs MAP/COCI's
   4.0u; live derivation uses MAP's value, which is what CPL would grant.

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
  *.supabase.co / regionalcte.org.
- The pre-existing `uc_desc_lane.test.js` 16/17 failure (ECED fixture drift)
  is the MAINLINE's — don't chase it from this lane; it's flagged on #732.

Moniker suggestion: **SkyGirder** — or claim your own.
