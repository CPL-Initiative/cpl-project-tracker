---
title: Partner occupation → CPL crosswalk — lessons
date: 2026-08-05
tags: [lessons, partners, crosswalk, occupations, workforce, cpl, sjcoe]
artifacts:
  - kb/_build_partner_crosswalk.py
  - kb/occupation_credential_map.json
  - kb/partner_crosswalk_regions.json
  - tests/partner_crosswalk_test.py
  - docs/kb-notes/methodology-partner-occupation-crosswalk.md
related:
  - "[[CLAUDE]]"
  - "[[docs/noncredit_cpl_lessons]]"
  - "[[docs/kb-notes/methodology-dormant-asset-worklist]]"
---

# Partner occupation → CPL crosswalk — lessons

Workstream scratchpad. Append a dated section every checkpoint.

---

## 2026-08-05 — SkyWalker (Session 121): SJCOE run 1, and the engine behind it

### What prompted it

**Ashley opened the session, not Sam.** She had a spreadsheet of occupations from
an employment training center and a concrete goal: *"so they know which college
offers CPL for their work experience and industry certs."* Sam joined mid-session
twice — first to authorize a COBI tab if we thought it merited one, then with the
instruction that actually shaped the build: **"keep in mind wiring this so it can
be scaled for other similar crosswalks."**

Source list: San Joaquin County Office of Education, 160 rows → **139 unique**
occupations after case/punctuation dedup. Heavy on DAS apprenticeships, fire
service, utility trades, and a tail of healthcare and personal services.

### What we learned

**1. The two vocabularies don't join, and that's the whole problem.** Partner
lists carry **job and apprenticeship titles** (`RESIDENTIAL WIREMAN`, `Hydro Plant
Operator`, `U.C.F.W. NORTHERN CA MEAT | MEAT CUTTER`); MAP is keyed by
**credential titles** (`Residential Electrical Apprenticeship`, `AWS D1.1 SMAW
Qualified Welder`). No mechanical join exists and there's no authoritative
crosswalk to borrow. Everything else about the design follows from accepting that
the match is judgment.

**2. So persist the judgment, not the run.** `kb/occupation_credential_map.json`
holds the rulings keyed by a normalized occupation string; the workbook is a
regenerable artifact and is gitignored. Each run emits `unmapped.json`, which **is
the curator worklist**. Partner #2 inherits SJCOE's 139 rulings and pays only for
what's new. This is the single decision that turns a favor into an instrument.

**3. Token-overlap candidate generation, then curate by hand — in that order.**
Automated matching alone is badly noisy on generic multi-word titles (`Control
Technician` → *Traffic Control Technician*; `TELECOM-TECH` → *CompTIA Tech+*, on
the token "tech" alone). But going straight to hand-authoring means you don't know
what's in the index. Generating ~6 candidates per occupation first, reading the
landscape, *then* authoring the map explicitly was fast and accurate. The
validation gate — every mapped title must resolve in the index — caught nothing on
the first pass, which is the point: it's cheap and it will catch the next re-mint.

**4. The 138 vs 84 statewide discrepancy is real and it matters here.**
`statewide_data.js` (`collaborative_type == "CCC Collaborative"`) carries **138**
statewide titles; `credential_reference_data.js` (`statewide: true`) flags **84** —
a strict *subset*. The 54-title delta is the newer CSLB contractor licence /
Carpenters Apprenticeship / NCCER / child-development cohort, i.e. **exactly the
rows a trades-heavy partner list matches**. Using the credential reference's flag
would have under-reported statewide coverage on precisely the occupations SJCOE
cares most about. The test now asserts the subset relationship so an upstream
change fails loudly.

**5. Adopters should be a union, and you have to say so.** `adopters` unions
`adopter_names` across every exhibit record sharing a unified title — statewide
adoptions *and* local articulations — because the partner's question is "where can
my student get credit?". Consequence: counts here legitimately **exceed** the
Statewide Exhibits tab, which counts the CCC-Collaborative record alone. Anyone
comparing the two numbers without that note will think one is wrong.

**6. "No CPL exists" and "nobody has looked" must not collapse.** An empty
credentials list is a *curated finding* worth reporting as a build-it opportunity;
an occupation absent from the map simply hasn't been reviewed. Merging the two
would launder unreviewed rows into confident absence claims inside a
partner-facing deliverable. Separate statuses, and a test that asserts they stay
separate.

**7. ⭐ The finding that changed the deliverable: split regional capacity into
academic vs career.** A partner assumes their in-county college is the referral
target. Raw credential counts hide whether that's true. Splitting each nearby
college's portfolio into AP/CLEP/DSST credit-by-exam versus career/technical
produced the headline nobody expected — see below. The Regional Capacity sheet
exists because of it, and the engine derives its warning text automatically for
any future region.

### The numbers (SJCOE run 1)

| | Occupations |
|---|---|
| Statewide credit recommendation available | **51** |
| Local articulation only | **53** |
| No CPL anywhere | **35** |
| **Total unique** | **139** |

406 occupation×credential matches · 1,488 occupation×credential×college rows ·
188 rows at the 12 nearest colleges.

**Regional capacity — the headline.** San Joaquin Delta College, the in-county
college, carries **69 credentials of which exactly ONE is career/technical**
(POST Basic Academy); everything else is AP and CLEP. Sacramento City and Folsom
Lake have **zero** career credentials. Cosumnes River has none at all. The nearest
real capacity is **Modesto Junior College at 265 career credentials — the largest
portfolio in the state** — then Las Positas (62), Fresno City (80), Merced (34),
Sierra (18), Columbia (15). A referral plan built on the county college would have
failed silently.

**The gap.** ~20 rows — lineworker, lineman, substation electrician, hydro plant
operator/mechanic, gas control, metering, cable splicer, power dispatcher,
transmission system operator — have **zero CPL anywhere in the system**. Not thin
coverage; none. Also empty: tile / terrazzo / marble setting, pest control,
surgical technologist, central sterile processing, painting, nuclear operations.
If a partner's pipeline is IBEW- or utility-facing, there is nothing to refer them
to today.

**Where it's strong.** Fire service is the standout — Firefighter 1 at 17
colleges, EMT at 29, the full Fire Officer 2A–2E and Fire Inspector 1A–1D series
statewide — then IT (CompTIA A+ at 24), welding (AWS/ASME/NCCER/LA City), ASE
automotive, and the building-trades apprenticeships.

### Current state

Shipped and merged in **#995**: the engine, the shared map (139 occupations / 406
rulings / 35 curated no-CPL findings), the region presets, and
`tests/partner_crosswalk_test.py` (32 checks). KB note:
`docs/kb-notes/methodology-partner-occupation-crosswalk.md`. Ashley has her
workbook.

### Strategic roadmap

- **Parked deliberately: the COBI tab.** Sam authorized one; Ashley chose
  engine-only for the session and that was right. When it's revisited, the tab
  worth building is the **regional-capacity view** — pure data, no judgment, and
  it answers a question the dashboard currently can't: *does the college nearest
  this partner actually do career CPL, or only AP and CLEP?* The
  occupation-matching layer should **not** be published as-is; a live tab would
  imply more authority than subject-matter reasoning carries.
- **The real unlock is a spine.** An O*NET SOC → certification crosswalk would let
  each match be *defended* rather than asserted, and would let the map be grown
  semi-automatically instead of by hand. Scope that before anything here gets
  published rather than hand-delivered.
- **The 35-occupation gap list is a build-it backlog**, and the utility cluster is
  the strongest single case to come out of a partner list so far. Worth pairing
  with the NC/Learning-Partners workstream (an employment training centre is an
  M2/M5 partner in that taxonomy).

### Next concrete step

Run the engine against a second partner list — any workforce board or AJCC — and
work the resulting `unmapped.json`. The second run is where the "coverage
compounds" claim gets tested for real; until then it's a design intention, not a
demonstrated property.

---

## 2026-08-06 — SkyWalker, checkpoint 2: the flat extract, and what asking for exhibit IDs taught us

### What prompted it

Ashley used the first deliverable, then asked for two follow-ups: an **HTML visual**
of the findings (published as an artifact) and a **flat Excel extract** with a
specific column list — occupation, credit recommendation + discipline, exhibit ID,
exhibit title, college, course. The second one turned out to be the interesting
request, because *exhibit ID* was a field the engine had never touched.

### What we learned

**1. The obvious source was a stale preview — check `_status` before trusting shape.**
`kb/coci_articulations.json` has exactly the right shape for this question
(`exhibit_id`, `exhibit_title`, `unified_title`, `earned_by_colleges`,
`local_courses`) and would have been a one-file answer. Its `_status` reads
**PREVIEW** and it was last re-keyed **2026-05-23**. Measured against the live index
it **misses 41 of the 191 credentials (21%)** this partner list touches, and **18 of
the 150 it does carry disagree on the college set**. Shape matching the question is
not the same as being current. Cheap habit worth keeping: measure the divergence
before choosing a spine, don't reason about it.

**2. Exhibit→college attribution *is* available, one level up.** `statewide_data.js`
groups exhibits by `(unified_title × cpl_type)` and **each group carries its own
`adopter_names`**, so a college ties to the group it adopted rather than to the
credential wholesale. This matters: `EMT Certification` spans four groups with
different colleges in each, so credential-level tagging would have handed every
college all 34 of its exhibit IDs. **All 1,488 college rows resolved to a group;
none fell back.**

**3. Freehand exhibit titles are why the unified title exists.** `Firefighter 1`
carries seven college-entered spellings. Ship both columns and tell the partner which
one to join on.

**4. In a partner-facing sheet, absence has to be a phrase.** A spreadsheet travels
without its schema docs, so an empty cell can't distinguish "we looked and found
nothing" from "this column wasn't populated". Every absence became words, the 35
no-CPL occupations stayed *in* the sheet so it still accounts for all 139, and MAP's
internal `Not Mapped` sentinel (13 rows) now renders `— not assigned —`. A raw
sentinel reads as a data error to someone outside the system.

**5. Validating a chart palette is cheap and it changed the design.** For the HTML
visual, the first status trio and the first categorical pair both **failed** the
CVD/contrast validator — the red↔ochre pair sat at ΔE 11.7 for *normal* vision, below
the hard floor. Re-stepping took one search over OKLCH space and produced palettes
that pass in both light and dark. Never eyeball this.

**6. Rendering the page caught a real data bug that no test would have.** Screenshotting
the artifact surfaced `Engineering Designer` reading *Local only* with no colleges —
its two matched credentials exist in the reference but **no college has ever
articulated them**. The engine's status logic isn't wrong exactly, but the label
misleads. It now renders as an explicit "none" in both the artifact and the extract;
the underlying status vocabulary is a candidate fix (see next step).

### Current state

The flat extract is no longer a scratchpad script — it ships as a **Flat Extract
sheet** in the standard workbook (`kb/_build_partner_crosswalk.py`), so every future
partner gets it without anyone re-deriving the exhibit attribution. Suite **32 → 45
checks**. Ashley has the workbook, the artifact, and the flat extract.

### Strategic roadmap

Unchanged from checkpoint 1 — the second partner run is still the priority, the COBI
tab is still parked on the regional-capacity view, and an O\*NET SOC → certification
spine is still the real unlock. One addition: the **status vocabulary needs a fourth
state**. "Local CPL only" currently covers both *a college offers this* and *the
credential exists but nobody has adopted it*, which are very different answers for a
student.

### Next concrete step

Same as before — run a second partner list and work its `unmapped.json`. While doing
it, split the fourth status out; the second run is the natural moment to change the
vocabulary, because it is the first time the change costs nothing to re-issue.
