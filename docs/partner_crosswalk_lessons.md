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
what's new. This is the single decision that turns a favour into an instrument.

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
