---
title: "CPL Pathways tab — apprenticeship-to-baccalaureate course maps (lessons)"
date: 2026-07-10
tags: [lessons, cpl-pathways, cerritos, ironworker, baccalaureate, clep, cac-presentation]
artifacts:
  - cpl_pathways.js
  - cpl_pathways_data.js
  - tests/cpl_pathways.test.js
related:
  - "[[reference-ui-design-system]]"
  - "[[reference-daily-dashboard-data-pipeline]]"
---

# CPL Pathways tab — apprenticeship-to-baccalaureate course maps

Workstream scratchpad. Session 112 side-lane (SkyIron, 2026-07-10), commissioned
by Sam for the **California Apprenticeship Council — Third Quarter Meeting,
August 13** (topic: CPL and the community college baccalaureate of applied
science in CTE disciplines), using **Cerritos College's Field Ironworker
Supervisor BS** (first cohort fall 2027) as the showcase.

## 2026-07-10 — v1 ships (SkyIron)

### What shipped

- **🎓 CPL Pathways tab** (`#cpl-pathways`, top-level nav — deliberately
  ungrouped so it stays prominent through the CAC-prep period; slot it into a
  `nav_groups.js` group later with a one-liner).
- `cpl_pathways.js` — static lazy renderer (map_export.js pattern: injected
  scoped CSS, createElement/textContent only, CONFIG-free).
- `cpl_pathways_data.js` — the curated pathway DEFINITION (requirements only).
- `tests/cpl_pathways.test.js` — 50 checks (Rule-4/static invariants, key
  normalization both directions, live-index building, unit buckets, `no_count`,
  baked fallback, full render, XSS, idempotent activate).

### The architecture call that matters: derive ✓ from live data

The tab does NOT bake "which courses are CPL". The data file carries the
degree's REQUIRED coursework; at render time the tab lazy-loads the CER
dataset (`credential_reference_data.js`, regenerated daily from the MAP
platform) and checks each course code against the college's articulation
lines (`subj`+`num`, number-normalized so "40.5" ≡ "40.50"). CLEP ◆ options
come from the ESLEI 24-35 systemwide chart already baked into CER rows
(`ge_credit`). Consequences:

- When Cerritos adds its Structural-track articulations in MAP, those courses
  flip ✓ on the dashboard **with no code or data edit**.
- The billboard number (31.5 units) is *live-verified*, not copywriter memory.
- Baked `cpl:`/`clep_fallback:` stamps cover a CER load failure (honest
  "showing the curated snapshot" note).
- `no_count: true` sections render + live-resolve but stay out of the unit
  buckets — used for the alternate-track course list so a future ✓ flip can't
  double-count the major (a student completes ONE track).

### The numbers (live-verified 2026-07-10)

- **15 Cerritos IWAP courses articulated in MAP = 31.5 units**, all Credit By
  Exam — the A.S. major (27–29 units, Reinforcing or Structural core) is fully
  covered. THE billboard stat: "your journeyworker card is worth 31.5 units."
- **24 CLEP exams** carry systemwide GE credit (ESLEI 24-35) across all four
  title 5 §55063 divisions → **15 GE units** of the CGEC admission gate are
  CLEP-eligible on the map. ✓31.5 + ◆15 = **46.5 units = 39% of the 120-unit
  degree** without repeating training or sitting GE seats.
- 9 more IWAP courses (21.5u, Structural track + welding) sit in COCI awaiting
  MAP articulation — rendered as the "articulations in progress" card.

### Program facts recovered (research fleet, 2026-07-10)

- **BS in Field Ironworker Supervision** (press name; regionalcte record says
  "Field Ironworker Supervisor"), TOP 095700. Two-part structure: A.S. + GE
  gate → 2 years upper-division, online for working ironworkers. Upper-division
  topics: industrial trades leadership, HR, labor law, operations, enterprise
  IT, cost estimating/control, negotiations, accounting, multicultural
  communication, advanced CAD.
- **Approval drama**: provisionally approved 2025 → CSU duplication objection →
  BOG January 2026 hearing → CSU withdrew → CCCCO final approval Feb 2026
  (AB 927). Developed with the California Field Ironworkers (Locals 416/433).
- **A.S.**: "Apprenticeship: Field Ironworkers" — 60u, 27–29 major units,
  Reinforcing or Structural core; stackable Certificates of Achievement
  (Reinforcing 34u / Structural 38u). GE gate = **CGEC 24–28u** (Cal-GETC 34u
  also accepted; Plans A/B/C retired fall 2025).
- **Sales facts**: 1,300+ supervisor openings/yr in LA County; +$34K/yr wage
  premium; ≈$10,560 total tuition ($46/u lower, $130/u upper).

### Research-access lessons (worth remembering)

- **regionalcte.org's COURSES section is JS-rendered** — invisible to every
  crawler, cache, and archive; the sandbox egress policy additionally denies
  regionalcte.org + archive.org CONNECTs, and WebFetch gets bot-403s from
  cerritos.edu/edsource/courseleaf. **WebSearch's server-side reads were the
  only channel** — everything recovered came through targeted search snippets.
  To get the literal course table, someone opens the page in a real browser
  (Sam can screenshot it; swap the topic rows for the real course list then).
- The **local COCI snapshot** (`kb/reference/coci_course_list.xlsx`) had the
  full 24-course IWAP inventory all along — check local reference data BEFORE
  burning web-research effort.

### Open items / next concrete steps

1. **Start-term confirmation** — "fall 2027" is Sam's premise + same-cohort
   precedent (Mesa PTA); not independently confirmed. Verify with Cerritos
   before the CAC deck goes final.
2. **Real upper-division course list** — replace the topic-area rows in
   `cpl_pathways_data.js` when Cerritos publishes the baccalaureate catalog
   (or from a browser screenshot of regionalcte.org section-4).
3. **CGEC category-level detail** — the GE card uses the title 5 divisions with
   a 24u total; refine to Cerritos's published CGEC areas when confirmed.
4. **Iterate the visual with Sam** toward the Aug 13 deck: print/export mode?
   A standalone shareable page (fact-sheet pattern)? Billboard mock?
5. **Next pathways** — the model generalizes: add a program object per
   pathway (carpentry → construction management BS is the obvious #2).

### Same-day iteration 2 (Sam's feedback): status stages + PDF extract

Sam: *"I want them to see that this is discussion draft only — a mock-up of
what it could be — and use it to ask for feedback."*

- **Status stages** — `discussion-draft` (mustard, 📝) / `active` (hunter, ✓) /
  `tabled` (neutral, ⏸). The published default is the pathway's `stage` in
  `cpl_pathways_data.js` (fallback discussion-draft — a mock-up can never
  accidentally present as Active). The above-the-fold **selector is a
  per-browser VIEW override** (localStorage `cplPathwaysStage.<id>`) so Sam can
  flip the label live while presenting; changing the published default = edit
  the data file. Big banner above the hero + a matching stage chip in the hero
  meta row (so a cropped hero screenshot still carries the label).
- **⬇ PDF** — opens a print window with a clone of the map (toolbar stripped,
  CLEP exam panels expanded for the handout) and calls `print()` → save as
  PDF. The print window has no `:root`, so `var()` can't resolve — a
  literal-hex First Light token block is injected there (the sanctioned
  canvas/SVG-style exception).

### Close-out (2026-07-10, end of the SkyIron side-lane)

**State:** #732 (the tab) + #733 (status stages + PDF) both merged same-day;
live on Pages. Sam sent the link to colleagues for a first look — the tab is
now in its feedback-collection phase, shipped as 📝 Discussion Draft.
**Roadmap:** iterate on colleague feedback → swap in the real upper-division
course list (browser screenshot of regionalcte section-4) → confirm fall 2027
→ pathway #2 (carpentry). **Next concrete step:** whatever the feedback wave
asks first; the continuation capsule is `docs/cpl_pathways_handoff.md`
(named, not numbered — the `session_<N>` lane belongs to the CSR mainline).
Durable learning distilled to
`docs/kb-notes/methodology-live-derived-pathway-checkoffs.md`.

### Same-day iteration 3 (Sam): Foothill BS views + the ⊕ adoption-option chips

Sam: *"They don't have as much CPL identified, but maybe this is an opportunity
to add in adoption option chips to courses where others have articulated…
I'm thinking of West LA and their solid work on Dental Hygiene."*

- **⊕ adoption-option chips** (violet, `adopt:{credentials|disc}` curated stamp
  → live-derived from every CER articulation line at OTHER colleges, home
  college excluded; expandable credential → college: course (units) panel;
  opportunity-not-credit — buckets untouched, ✓ rows never chip, legend line
  conditional). The chips turn a sparse map into an adoption menu.
- **Foothill Dental Hygiene BS** (SB 850 pilot original, fall 2016; quarter
  system): Foothill's MAP presence = 12 AP lines only → tiles read ✓0 / ◆17 /
  9%, and six ⊕ chips carry the story — West LA's RDA License (11 courses) +
  RDH License (capstone · pharmacology · nutrition) are the adoption model.
  Includes the 44-unit online RDH completion track card (`no_count`).
- **Foothill Respiratory Care BS** (AB 927 first cycle, fall 2024,
  RRT-to-BS completion, one online year): **the find — Foothill's catalog
  already awards 24 quarter units of CPL for the NBRC TMC (high cut) + CSE +
  RCP licensure + Law & Ethics**, so the map is scoped to the 68-unit
  completion path (24 CPL ✓ + 44 coursework) and the campaign line writes
  itself: catalog CPL nobody can see vs MAP CPL every counselor sees.
  New renderer knobs: `cpl.source` (college-awarded-outside-MAP phrasing),
  `total_tile_label`, `unit_system:"quarter"` (tile unit word + the CLEP
  panel's 4-quarter-unit chart minimum).
- Suite 69 → 84. Research: two agents, WebSearch-only again (Foothill's
  CourseLeaf bot-blocks like Cerritos's); unit values for CHEM/ENGL/COMM and
  RSPT 300/304 unverified — flagged in footnotes on the page itself.
- Parked (Sam, for another day): a looping harvest of all CCC catalog
  course/program data into Supabase — see the handoff's open items.

### Same-day iteration 4 (Sam): ⚡ Quick Adopt v1 — the intake queue

Sam picked "intake queue in COBI" from the v1 fork (vs MAP deep-link / both /
design-doc-first). Every ⊕ adoption panel now carries **⚡ Quick Adopt**: an
inline form (college* / name / work email* / note) POSTing to the new
**`cpl_adoption_interest`** table stamped with the full pathway context
(program, course, credentials, the other-college precedent lines). RLS = the
cpl_reflections write-only pattern: anon INSERT-only (`status='new'` check),
NO public SELECT (contact info never publicly readable), team SELECT via
`is_allowed_reviewer() OR team_pass_ok()`; rows immutable to the public after
insert (triage RPC comes with the lane build). Schema of record:
`kb/supabase_adoption_interest.sql`; migration `cpl_adoption_interest_intake`
applied 2026-07-10. Suite 84 → 97. **Next step on this thread:** a small
adoption-queue lane (team-gated) + re-point the button at the MAP Exhibit
Module's authenticated adoption flow when Malone exposes one.

### Day close (2026-07-10, the SkyIron high-rise)

Final riders: **#740** — Teams unfurls now read **"COBI ᶜᴾᴸ — …"** (Unicode
modifier-letter superscripts in the GENERATOR-owned title, `COBI_TITLE` in
`excel_to_dashboard.py`, + og:title/og:description in both HTMLs; the rewrite
proved idempotent so the daily cron won't churn). And the **uc_desc_lane red-X
saga**: diagnosed the pinned ECED fixture drift, raced the mainline to the
same presence-conditional fix — SkyMighty's #739 won by minutes; #738 closed
as superseded; **suite fully green (154/154)** for the first time in days.
Six SkyIron PRs merged (#732–#736, #740), one superseded (#738). The lane
rests in feedback-collection; continuation = `docs/cpl_pathways_handoff.md`.

### Safety patterns honored

- Rule 4: tab shell mirrored in both HTMLs (test enforces byte-identity).
- Static-consumer pattern: no generator changes, no cron-owned files touched.
- Design system: `var(--token)` only; glyph-paired status colors (✓ hunter /
  ◆ cobalt / ○ neutral); no raw hex; no innerHTML with data.
