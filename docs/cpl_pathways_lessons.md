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

---

## 2026-07-14 — StarRunner: the DIRECTORY tier — every CCC baccalaureate

Sam's ask: expand CPL Pathways to **all CCC baccalaureate degrees in the
system**, so students/faculty see CPL along the whole associate→bachelor's
pathway and colleges see where peers already approved CPL they could adopt.
"Rather than a chip for each pathway, make a drop down." + "Push back or
recommend a better strategy."

### The strategy call (the pushback)

Hand-curating 40+ full course-by-course maps like the 3 featured ones is
**infeasible and unsourceable** — the per-college catalogs that carry the exact
course lists are the same CourseLeaf/COCI pages that bot-block us, and there's
no course→program join in our data. So the tab became **two-tier**:

- **Featured** (`cpl_pathways_data.js`, unchanged) — the 3 deep hand-curated
  maps (Cerritos Ironworker, Foothill DH / Respiratory). Full course lists,
  stage banner, campaign, PDF.
- **Directory** (`cpl_baccalaureates_data.js`, NEW) — one auto-generated card
  per baccalaureate (45 today), **program metadata only**; the CPL picture is
  **derived live** in `cpl_pathways.js` from the CER dataset.

### The keystone: CER carries a TOP code on every articulation line

`unified_titles[].articulations[].top` (+ `.local[].colleges/subj/num/u`) lets
us join each baccalaureate to live MAP CPL data by **TOP-family + college** — no
course list needed. Per card we derive:
- ✓ **CPL this college already articulates in the field** (byCollegeTop4).
- ⊕ **Adoption pool** — credentials peers articulate that this college does NOT
  (byTop4 minus the home college's own), sorted by #colleges, ⚡ Quick Adopt on
  each (reuses the featured `buildQuickAdopt` + `cpl_adoption_interest`).
- 🏛 **field cohort** — the same-TOP baccalaureate colleges (the peer network an
  adopted articulation travels; home chip green, non-Active status-tagged).
- ◆ GE-by-CLEP count (systemwide, reused).

The picture is honest at both extremes: **Automotive (0948)** = 5 own + **82
adoptable from 27 colleges**; **Biomanufacturing (0430) / Respiratory (1210)** =
the mustard **"CPL frontier — be first"** banner (0/0). Cards track MAP live —
a new articulation lights up with no edit.

### Build notes

- Generator `kb/_build_baccalaureate_pathways.py` reads
  `tmc/source_data/coci_program_export_2026-06-17.csv` (AWARD =
  "Baccalaureate of Science/Arts"), filters non-Inactive (45 of 46 rows; drops
  the superseded Rio Hondo Auto), and resolves the **COCI→CER college-name
  bridge** ("FOOTHILL"→"Foothill College", "WEST L.A."→"West Los Angeles
  College") to an exact `cer_college` key (7 have no CER CPL → frontier cards).
  Re-run when a newer COCI export drops in.
- Renderer: `buildDirectoryIndex` (global, over the same CER payload — the
  featured `buildLiveIndexes` is single-college), `resolveDirectory`,
  `renderDirectory`; the chip picker → a grouped `<select>` (★ Featured optgroup
  + one optgroup per field). Adoption pool caps at `DIR_POOL_CAP=20` with a
  "Show all N" toggle so the Automotive wall (82) stays digestible.
- Boot: both HTMLs load `cpl_baccalaureates_data.js` (Rule 4); `activate()`
  lazy-loads it too as a fallback.
- Tests: `tests/cpl_pathways.test.js` **97 → 132** (directory index, resolver,
  dropdown routing featured↔directory, frontier college, pool cap/toggle, data
  file parses + join keys, boot in both HTMLs). Real-Chromium verified all four
  card shapes (featured deep map, rich pool, frontier, capped) — 0 console
  errors.

### Open items / next steps

1. **Feedback wave** — Sam to react to the directory shape; likely asks: card
   density, whether to fold GE-CLEP detail in, per-field landing.
2. **Deepen-on-request** — convert any directory program into a full featured
   course map when Sam flags a priority (the hybrid loop).
3. **Refresh cadence** — the COCI export is a 2026-06-17 snapshot missing newer
   approvals (e.g. Cerritos Field Ironworker isn't in it — it's a featured map).
   Drop a newer export + re-run the generator to add programs.
4. **Cohort precision** — grouping is by TOP4; a couple of broad TOP families
   (2199 "Other Public/Protective") mix arguably-distinct programs. Fine for v1.

### Safety patterns honored (this pass)

- Rule 4 (both HTMLs byte-identical — test enforces); static-consumer (no
  generator/cron files touched); `var(--token)` only, no raw hex; createElement/
  textContent only (XSS). `cpl_adoption_interest` RLS unchanged (no public
  SELECT). `package.json` reverted after a local-only Playwright install.

### Same-day iteration 5 — the metric: units → "sus" → COURSE COUNTS

Sam poked the live tab and asked for two things: the **total on the ✓ tile**,
and **current/potential per dropdown entry** ("e.g. 12/32"). First cut used CPL
**units** — and Sam's instinct flagged Automotive's `127/357u` as "sus." He was
right, and the dig became the valuable part:

- **The unit totals were course-catalog footprints, not student-claimable CPL.**
  Santa Ana articulates 31 automotive courses = 127u, but **4 different courses
  all map to ASE A4**; a student holding A4 gets one course, not four. CPL is
  granted **per credential**, so summing course-units double-counts competencies.
  (Also caught a real double-count: a course articulated to several credentials
  — `AVIATEK 1` → FAA Airframe AND Powerplant — counted twice.)
- **Fix (Sam's call): course COUNTS, not unit sums.** `current` = distinct
  courses articulated; `potential` = current + adoptable credentials. A count
  reads as *coverage*, not degree-credit, so no "357 units" that makes a dean
  wince. `resolveDirectory` dedups by distinct course; the ✓ list groups by
  course listing its credential(s). #777. Tests 132 → **137**.
- **Lesson (`methodology-verify-consumer-before-migrating` cousin):** when a
  metric looks inflated, check whether you're counting the *catalog footprint*
  vs *what a person actually holds*. The unit of account here is the credential,
  not the course-unit.

### The CER credential-merge doctrine (Rule 8c) — spun out of the "sus count"

Chasing the inflation opened a **new curation lane**: merging redundant CER
credential titles. This is the **CER exhibit-credential lane** (`_CREDENTIAL_
REVIEW::` + confirm-merge), **NOT** the CCR's M-ID course convergence — wave 4
(multi-college course ranks 2,001–4,000) would roll right past it. Ratified
doctrine, now **Rule 8c** in `.claude/skills/exhibit-canonicalization/SKILL.md`:

1. **Mechanism/assessment qualifiers collapse** — `(with Practical Assessment)`
   is *how* credit is verified, not a competency → fold into the base cert.
2. **Industry cert vs local course-Cx is a SPLIT, not a merge** — the CPL basis
   is the axis. *This is why the automotive count is legitimately large, not
   junk-redundant* (ASE certs + bundles + local Cx courses are all distinct).
3. **Narrower competency doesn't fold** (Brake *Inspection* ≠ Brake *Service*).
4. **Read the curator's own curation before assuming a mis-issue (Rule 9).**

Two passes APPLIED via the `cred-rename-apply` workflow (Rule-9 pre-flight —
fresh read, pending-merge cross-check, INSERT-only cohort rows, doctrine in
Supabase `merge_doctrine_notes`):

- **#778** — the **10 ASE `(with Practical Assessment)` → base-cert** folds
  (A1–A8, G1, L1). Verified: `credentials.json` 2016 → 1993 keys, all 10 gone.
- **#779** — the **Long Beach `Automative` cluster** (AUTO 611–619, catalogued
  with LB's OWN "Automative" typo). Rule 8c-4 self-corrected mid-flight: the
  Rule-9 read showed **Sam had deliberately set `issuer = ASE`** + CPL Type
  Industry Certification, so these are ASE-competency exhibits, **not** local
  Cx. **6 folded** into ASE certs where the competency matched exactly (611→A1,
  612→A2, 613→A3, 615→A5, 616→A6, 619→A9); **2 spelling-only fixes** where the
  competency is narrower per 8c-3 (614 alignment ⊊ A4, 618 fuel ⊊ A8, keeping
  Sam's ASE issuer); 617 A/C left as-is. Scope: `docs/ase_practical_merge_scope.md`.

**The big reframe for the pathways tab:** the adoption-pool counts are **mostly
legitimate** — a rich field genuinely carries the ASE cert family AND distinct
local Cx courses. The only true dupes were the mechanism variants + a college's
catalog typos. So `/100` on Automotive isn't loose; it's real.

### Checkpoint state (2026-07-14, StarRunner — session close)

**Shipped + merged:** #774 directory tier · #775 handoff · #777 course-count
metric · #778 practical-variant merge + Rule 8c · #779 Automative cluster +
8c-4 correction. All on `main`, tree clean, Supabase migrations verified.
**Side-lane discipline:** left `kb/cpl_todos.json` + the numbered
`session_<N>_handoff.md` untouched (CER mainline owns those).
**Open, non-urgent:** (a) directory feedback/polish; (b) deepen a directory
program into a featured map on request; (c) refresh the COCI export to add newer
baccalaureates; (d) the credential lane could use a **calibration re-seed** now
that Rule 8c exists; (e) generalize 8c-1 (`(with Practical Assessment)`-style
suffixes) beyond automotive.

## 2026-07-14 — StarMarathon: the retired-course filter (the "sus count" root cause)

Picked up StarRunner's **🔑 PRIORITY finding**: the directory ✓ counts are
inflated by **retired/renumbered course numbers the MAP platform still carries
as articulations**. Santa Ana Automotive read **31 courses** but the truth is
**~18 credentials** — MAP holds the retired `AT`-series (`AT 106`, `AT 112`, …)
*and* old `AUTO` numbers (`AUTO 53/54/A1/B33`) alongside the current
`AUTO 111–119`, so each ASE competency is articulated two or three times.

### What I verified before writing code (the join is the crux)

- Reproduced `resolveDirectory`'s `mine` list in Python for Santa Ana (0948) and
  joined it to the current MAP course catalog (`coci_course_list.xlsx` →
  `coci_lookup_data.js`, keyed by **college + SUBJ + normalized number**).
  Result: **31 distinct courses → 12 current** (19 dropped = 5 retired `AT` + 14
  old `AUTO` numbers). The 12 survivors map cleanly to ASE A1–A9 + Master + G1.
- **College-scoped is the right key, not subject-only.** All 19 stale courses
  are `coci_subjonly=True` (the SUBJ exists *somewhere*) but
  `coci_collegescoped=False`. A subject-only check would keep every stale one.
- Confirmed Santa Ana's catalog = **72 `AUTO`, 0 `AT`** (matches the handoff).

### Sam's data-quality question (mid-session) — and why the answer is safe

Sam asked whether the course export includes inactive/historical/draft rows (he
wants to count **only Active/Approved**). Findings:
- The **program** export (`coci_program_export_*.csv`) has a `STATUS` column; the
  **course** export ("Course List from MAP") has **no status column** — can't
  filter by status *within* it.
- But two independent tests show it's **already an active catalog**: retired
  numbers are absent, and only **0.04%** of `(college, subj, num)` codes carry a
  second control number (no historical versions retained).
- **The safety property that settles it:** the filter can only ever *drop a
  course absent from the catalog*. An active course is always in the catalog, so
  **the filter can never drop a genuinely active course** — worst case (if some
  inactive row leaked in) it's a no-op for that row. Sam chose **proceed with the
  MAP course list**.

### What shipped

- **Generator** (`kb/_build_coci_lookup.py`) emits a new sidecar
  **`cpl_coci_course_keys.js`** (`window.CPL_COCI_COURSE_KEYS`, ~1.85 MB /
  0.36 MB gz): `{ colleges:[…], keys:{ "<idx>": ["SUBJ NNN.NN", …] } }`, built
  from the same rows as `coci_lookup_data.js` so the two can never drift. Static
  (not a cron artifact) → committed, like `coci_lookup_data.js`.
- **Consumer** (`cpl_pathways.js`): `getCociKeyMap()` builds a
  `collegeUpper → Set("SUBJ NNN.NN")` once; `isRetiredCourse()` returns *drop*
  only when the college IS in the catalog and the course is NOT — **fail-open**
  otherwise (no catalog loaded, or college absent). `resolveDirectory` filters
  the ✓ `rawMine` list; a footnote names the catalog snapshot. Lazy-loads the
  sidecar in `activate()` (fail-soft), so it costs nothing outside this tab.
- **Scope decision:** filter **only the home college's ✓ list**, leave the ⊕
  adoption pool **inclusive** — a peer's recognized competency is still adoptable
  even if its local course number has rolled, and inclusiveness avoids ever
  hiding a real opportunity against a slightly-stale snapshot. The pool count is
  credential-based, so it wasn't inflated anyway.
- **Tests** `cpl_pathways.test.js` **137 → 143**: fail-open with no catalog,
  drop on catalog match (4 → 2), normalization guard, college-absent fail-open,
  boot wiring. **Real-Chromium verified:** Santa Ana Automotive now reads
  **✓ 12 courses · 18 credentials** (dropdown "12/81 courses"), list is all
  current `AUTO`, zero `AT`, catalog footnote present, no console errors.

### The reusable lesson (→ KB note)

`docs/kb-notes/methodology-filter-live-counts-against-current-catalog.md`:
live-derived counts inflate when the upstream keeps **retired identifiers**
alive; filter against a **current-catalog snapshot**, keyed **precisely**
(college-scoped, not subject-only), and **fail-open per entity** so you can only
ever remove a confirmably-stale record — never a valid one.

### Still open / flagged to the numbered mainline

- **ROOT fix (#1) is a mainline candidate** — a systemwide **stale-articulation
  data-quality signal** in the CER/CCR generator (flag any articulation whose
  `(college, subj, num)` is absent from the current course catalog). That
  tightens *every* count (CSR, CER tab, everything), not just this tab, and the
  all-college `CPL_COCI_COURSE_KEYS` set (or the same join) is reusable for it.
  Left for the next numbered session per side-lane discipline.
- Untouched: `kb/cpl_todos.json` + numbered `session_<N>_handoff.md`.
