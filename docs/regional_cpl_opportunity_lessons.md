---
title: Regional CPL opportunity (region occupations × colleges) — lessons
date: 2026-09-16
tags: [lessons, crosswalk, regional, occupations, colleges, cpl, coe, swp, handout]
artifacts:
  - kb/_build_regional_cpl_opportunity.py
  - kb/reference/coe_occupation_demand_2024_2029.json
  - kb/reference/bay_region_coe_demand_2024_2029.json
  - kb/regional_cpl_out/
related:
  - "[[CLAUDE]]"
  - "[[docs/delta_college_crosswalk_lessons]]"
  - "[[docs/partner_crosswalk_lessons]]"
  - "[[docs/statewide_fire_electrical_crosswalk_lessons]]"
---

# Regional CPL opportunity — lessons

Workstream scratchpad. Append a dated section every checkpoint.

---

## 2026-09-16 — the fifth instrument, and a matcher that flatters itself

### What prompted it

Sam, with **Ashley and Sigrid** in the room: scale the Delta prototype so any
college, district or Strong Workforce region can be pulled up in a regional
meeting and shown what CPL it could create or adopt.

### What we learned

**1. ⭐ TWO THIRDS OF THE ASK WAS ALREADY BUILT.** `college_briefing.js` ships a
scope-first picker with five scopes — college, district and statewide live, SWP
and ASCCC disabled with their reason. Reading the code before designing turned a
new tab into an extension.

**2. ⭐ A SHARED TOKEN IS NOT A MATCH, AND THE COUNT TELLS YOU SO.** The first
matcher returned **233** "adopt now" rows for Santa Rosa against Delta's 42 for a
comparable list. That ratio was the bug report. Requiring the shared tokens to
COVER half the occupation title cut it to 24 and killed *Medical Assisting for
Diagnostic Medical Sonographers*. ⚠️ Rarity alone is not enough: on a 150-row
program corpus a 2% threshold makes *medical* and *manufacturing* "rare" while
they carry almost no meaning.

**3. ⚠️ SOC TITLES USE "EXCEPT" AS A NEGATION.** *Dispatchers, Except Police,
Fire, and Ambulance* matched a police academy, because tokenizing the whole
string inverts the title's meaning. `clean_title()` strips `except …` and
`, all other` clauses before anything else happens.

**4. ⚠️ EXCEL MANGLES SOC CODES, LOSSILY.** The Bay-only export arrived with 8
Management codes date-parsed: `11-3071` renders as `Nov-71`. **The mangling is
not invertible** — 11-3071, 11-9071 and 11-9171 all render `Nov-71` — so repair
keys on Description, which is unique. Only SOC major group 11 is affected; 13+
exceeds 12 and was never date-parsed. The full statewide export Sam supplied is
clean, and supersedes it.

**5. ⭐ RAW DEMAND IS THE WRONG SORT KEY.** Ranked by openings the Bay list leads
with Home Health Aides, Fast Food, Cashiers and Waiters — volume with no
credential to award against. The CPL-relevant band (training beyond high school,
below a bachelor's) is **104 of 541 occupations and 47,520 of 419,820 annual
openings**. Same shape as the Delta run's degenerate coverage ranking.

**6. ⭐ THE BAY'S CPL SHAPE IS NOT SAN JOAQUIN'S.** Only **17 of 139** existing
occupation rulings match the Bay list by exact title, and all 17 are electrical
or mechanical — SJCOE's list was an IBEW and utility apprenticeship roster. The
Bay's top CPL-relevant demand is health care, early childhood and transportation.
Occupation→credential rulings do not travel between regions for free.

**7. ⭐ THE CURATOR IS IN THE ROOM.** A regional meeting reframes the judgment
problem: college staff are present and reject a bad match on sight. The tool's
job is a short checkable list with its evidence attached, which is why every row
carries the program, course and exhibit that produced it.

**8. ⚠️ A LOGO BUILT FOR A DARK HEADER DISAPPEARS ON PAPER.** The CPL Initiative
logo ships white-on-transparent for Sierra. Recolored to seal blue at full alpha
for the printable handout; the CCCCO seal needed its white box made transparent.

### Sam's rulings this run

- **"Single pick is fine"** — My College tab, single pick as the default.
- **No "it's this, not that."** *"Just make positive, active voice
  declarations."* Recorded in `CLAUDE.md`'s house-voice section, which had been
  instructing the opposite reflex.
- **Mannerly language and asides** apply to session replies, restated.
- Keep it plain: Sigrid was in the room and the jargon was excluding her.

### State

- `kb/_build_regional_cpl_opportunity.py` — workbook, screen page, print handout.
- `kb/reference/coe_occupation_demand_2024_2029.json` — 4,869 rows, nine regions.
- Matcher is roughly half right and NOT shippable.

### Next

1. Tune the matcher offline against Delta's 139 human rulings as a test set.
2. Port into the My College tab behind the existing picker.
3. `cpl_occupation_match` verdict queue — Governance first, per Rule 10(a3).
4. The college-to-region roster, which is Sam's to supply.
