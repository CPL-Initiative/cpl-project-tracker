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

## 2026-09-16 (later) — the external credential registry, and a second matcher defect

Sam, Ashley and Sigrid were still in the meeting when Sam asked whether this
session could reach the Credential Registry. It cannot: `credentialfinder.org`
and `credentialengineregistry.org` are both refused by the network egress
policy, measured with curl and with WebFetch. He captured the pages himself and
passed them through Drive and the session upload, four of them in about forty
minutes.

### What a blocked domain costs, and what it does not

The instinct on a blocked domain is to report the block and stop. The better
move is to say precisely what a human capture would have to contain to be
useful, because a person with a browser is a working channel and they will
usually take one more step than you expect. Naming the four columns — credential
name, issuer, occupation code, CTID — is what turned "I can't reach it" into
four PDFs.

The corrected record matters too. Earlier in this session I said collection 151
was "almost certainly ours," meaning California's. It is the National
Certification Collection, owned by Credential Engine OPEN. Sam found the actual
California collection himself, and it is the better one.

### Capture methods are not equivalent, and the difference is large

Three methods, measured against Sam's own captures:

| Method | Reach |
|---|---|
| Browser save of the scrolled collection page | ~500 members, provider in rendered prose |
| The site's Print button, list not yet loaded | 8 members |
| The site's Print button, list loaded | ~490 members in LABELED fields |
| The site's Print button, on a credential detail page | that one credential's full record |

The loaded-list print is the best of them: `resource Name` / `resource Type` /
`provider` / `description` parse without a heuristic, where the rendered-prose
capture needed a provider vocabulary built from its own clean rows and still
left 53 rows on a word-count fallback.

The finding that makes hand capture tractable: **two captures of the same
collection overlapped on 15 rows out of roughly 490 each.** The list does not
return a stable window, so repeating the print accumulates coverage rather than
re-reading the same page. Two passes reached 974 of 6,738.

### No occupation code exists at any level

The list view, the collection print and the detail print all omit
`ceterms:occupationType`, the O\*NET-SOC code and the CIP code. That was the one
field that would have made the join exact against the 541 SOC-coded COE
occupations, and it is absent everywhere a human capture can reach.

What the detail print carries instead is better for CPL than a job code: 73 Task
statements, each with its own CTID, plus Knowledge and Skill statements. Faculty
award credit by comparing what a person can do against course outcomes, and a
task list is written in those terms. A SOC code never is. This is the same
substrate the parked Phase 4 (SLO ingestion) wants.

### California is the higher-value collection, and it is complete

369 licenses, every member, with the issuing state agency. California license
titles track occupational titles, so they join to the COE occupations by name
far better than "IBM Certified Solution Developer" ever will, and they are the
credentials a California student actually holds.

Measured join: 73 of 541 occupations matched, 115 pairs, 13%. Heating, Air
Conditioning and Refrigeration Mechanics reaches the Warm-Air Heating,
Ventilating and Air-Conditioning Contractor license cleanly.

### The join exposed a second matcher defect

`stem()` strips the agent suffixes `-er` and `-or` on any token past four
characters. **engineer** reduces to **engine**; **actor** reduces to **act**.
Eight false pairs rest on the first collision (Bus and Truck Mechanics and
Diesel Engine Specialists against *Engineer In Training*) and one on the second
(Actors against the *California Residential Mortgage Lending Act*).

This is the same family as the single-shared-token errors Sam caught earlier the
same day, and it is worth stating the general shape: **a stemmer that maps two
different words onto one token manufactures agreement that the coverage rule
then certifies.** Coverage cannot rescue it, because the collapsed token is a
genuine member of both sets by the time coverage is computed.

The plural suffixes are safe — `electricians` to `electrician` merges two forms
of one word. The agent suffixes are not, because English uses `-er` and `-or`
both to derive an agent and as ordinary word endings. The fix is measurable
rather than hand-listed: protect a token whose stem is itself a literal token
somewhere in either corpus.

Left unfixed deliberately. The same matcher drives the regional opportunity
build, whose output Sam has already reviewed, so the change gets its own run and
a look at what moves rather than riding along inside a reference-data commit.

### Sam's framing, which is the reason any of this matters

> "We've never had a table of active certificates and licenses--which is why I'm
> hyped about this:)"
>
> "Other than what we've catalogued in MAP"

MAP's 2,948 exhibits answer what the colleges have written down. A registry of
active licenses answers what a student already holds, and it grows whether or
not a college does the work. Joining the two is the interesting move: a license
with no matching MAP exhibit is an exhibit opportunity, stated in terms a
college already understands.

Captured in full at
`CPLBrain/03-professional/braindumps/braindump-2026-09-16-1420-never-had-a-table-of-active-certificates-and-licenses.md`.
