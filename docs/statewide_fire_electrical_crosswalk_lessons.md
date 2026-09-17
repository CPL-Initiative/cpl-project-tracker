---
title: Statewide Fire / Wildland / Cal-JAC / Electrical CPL crosswalk — lessons
date: 2026-09-09
tags: [lessons, cpl, crosswalk, fire, wildland, caljac, electrical, apprenticeship, statewide, partners]
artifacts:
  - kb/_build_domain_cpl_crosswalk.py
  - kb/fire_electrical_domain_map.json
  - kb/domain_crosswalk_out/2026-09-09-fire-electrical/crosswalk.json
related:
  - "[[CLAUDE]]"
  - "[[docs/partner_crosswalk_lessons]]"
  - "[[docs/delta_college_crosswalk_lessons]]"
  - "[[docs/fire_ems_eligibility_lessons]]"
---

# Statewide Fire / Wildland / Cal-JAC / Electrical CPL crosswalk — lessons

Workstream scratchpad. Append a dated section every checkpoint.

---

## 2026-09-09 — SkyChain (Session 249): the third instrument, and a chain that breaks

### What prompted it

**Ashley again** — third engagement in this lineage, after the statewide SJCOE run
(2026-08-05) and the Delta college-scoped run (2026-08-19). She asked to expand the
San Joaquin approach **statewide** and narrow it to four training domains: Fire,
Wildland Fire, Cal-JAC and Electrical. Her framing named the deliverable exactly:

> Training/Occupation → Cal-JAC/Industry Credential → CPL → College Course → Certificate/Degree

…and, load-bearingly, *"prioritize opportunities where students can receive the
**maximum applicable CPL** toward a certificate or degree, rather than simply
identifying similar courses."*

### What we learned

**1. ⭐ THE FINDING: follow the chain to its LAST link, because that is where it
breaks.** Every prior crosswalk in this lineage stopped at "a credit
recommendation exists". Following it one step further — *does any college actually
teach the course the recommendation names?* — splits the four lanes into three
different problems:

| Lane | Statewide creds | Dedup units | Receiving courses | Taught at | Verdict |
|---|---|---|---|---|---|
| Fire | 19 | **90.2u** | 35, several C-ID | 64 / 56 / 40 colleges | **completes** |
| Wildland | 6 | 15.0u | 5, no C-ID | **0 colleges** | **half-completes** |
| Electrical | 12 | 11.5–18.0u | 4, no C-ID | 1 / 4 / 22 colleges | **breaks** |
| EMS | 3 | 31.5–38.0u | 4 | widely | completes |

The electrical case is the sharpest: **all 12 statewide electrical credentials**
(IBEW, NCCER Levels 1–4, C-10, C-46, both apprenticeships) **collapse onto four
generic construction courses** — *Rough Electrical* (taught at **1** college),
*Construction Law* (4), *Introduction to Construction Safety* (22),
*Electives/Work Experience – Construction*. Meanwhile **106 colleges teach 1,047
electrical-trade courses**. The credential exists, the teaching exists, and the
recommendation does not connect them. No amount of adoption work fixes that; it is
a build.

**2. ⭐ "Maximum applicable CPL" means DEDUPLICATE BY RECEIVING COURSE, not sum
credentials.** The 19 statewide fire credentials sum to **147.2 units**. The
distinct receiving-course ceiling is **90.2** — **39% of the naive figure is
double-counting**, because Firefighter 1, the Cal-JAC Firefighter EMT Certificate
and the Fire Officer series all name *Building Construction for Fire Protection*,
*Fire Behavior and Combustion* and *Fire Protection Organization*. A student banks
**courses**, not credentials. Quoting 147 units to a college would have been an
overstatement of 57 units, in a document whose entire purpose is unit counting.

**3. ⚠️ Two unit encodings in one field, and reading only one scores a whole lane
at zero.** Fire and EMS publish a point value in `u`. Electrical publishes a
**range inside the line text** — `"1-3 hours in Rough Electrical"` — with `u`
blank. The first pass summed `u` alone and reported **electrical statewide
credentials as carrying 0.0 CPL units**. That is not "no credit", it is a
different encoding; shipping it would have told colleges the electrical lane
carries nothing. Parse both, and keep **unknown** distinct from **zero**.

**4. ⚠️ The false-positive lists are the load-bearing part of domain scoping, and
half of them were inherited.** `docs/kb-notes/methodology-area-eligibility-rollup-from-cer.md`
already carried the fire exclusions (`firearm|firestop|fireproof|pc 832|working
drawings`) from the July StarEmber run — reused unchanged. The **electrical** lane
needed a new one: a naive `/electric/` match pulled in **ASE A6 Electrical/
Electronic Systems** (automotive, **24 adopters**) and **AP Physics C: Electricity
and Magnetism** (**80 adopters**). Either would have topped an "electrical
adoption" ranking with something that is not the electrical trade.

**5. ⭐ Ranking by "coverage" was degenerate and had to be thrown away.** The first
ranking scored each college by *available CPL units ÷ certificate units*. But
available units are a **lane constant**, so coverage reduced to *1 ÷ certificate
size* — it ranked American River first purely because its fire certificate is 11
units. A ratio whose numerator does not vary across the things being ranked is not
a ranking. Replaced with **teaching depth** (courses + programs + certificates)
among colleges that have a certificate and have adopted nothing, with bankable
units shown alongside rather than used as the sort key.

**6. ⚠️ A credential named in the request may not exist at all.** *Wildland Fire
Fighter Specialist* was asked for explicitly. It appears **nowhere in MAP** — zero
hits across all 2,903 exhibit records, searched across unified titles **and** the
raw titles colleges typed themselves. Verified before saying so, per the absence-claim
rule from the Delta run.

**7. ⭐ The Cal-JAC ladder is missing its bottom rung.** Cal-JAC has exactly **five**
credentials in MAP, found by **issuer** (`California Joint Apprenticeship Committee
(Cal-JAC)`) rather than by title guessing. Four are statewide. The fifth —
**Firefighter Journeyperson Certificate**, the apprenticeship completion itself —
is flagged **Local**, yet carries the **highest potential-adopter count of the five
(98)**. It is the credential a new firefighter earns *first*. Note the two
definitions of "statewide" here (the CER flag means "has a CCC-Collaborative
articulation", not "on the statewide page"), so this may be a flag artifact rather
than a decision — which is itself the question to ask.

**8. Exemplars exist, and naming them is more useful than naming the laggards.**
**City College of San Francisco** holds all six statewide wildland credentials —
the only college with the full set. **Cabrillo College** holds all twelve statewide
electrical credentials (86.5u) — the only one. **San Diego Miramar** leads fire at
132.0u. Each is a working proof that the lane can be adopted, and a natural
reference for a college being asked to.

### The numbers

221 in-scope credentials · 40 statewide · 5 Cal-JAC · 331 college × lane rows ·
609 active in-scope COCI programs at 102 colleges. Colleges with a program that
have adopted **nothing**: Fire **38 of 63**, Wildland **16 of 19**, Electrical
**53 of 63**, EMS **33 of 55**.

### Current state

Shipped: the generator, `kb/fire_electrical_domain_map.json` (scoping rules,
aliases, cached receipts, findings) and the run receipt. Ashley has the workbook
(7 tabs) and the HTML page; both come from the same tool so they cannot drift, and
both are gitignored as regenerable.

Two guards, each **verified by making it fail**: `check_chain_claims()` rejects a
findings block stating unit figures the computed ceiling does not support, and the
join exits on any COCI college name that does not resolve to the roster rather than
letting a college vanish (LATTC and City College of San Francisco both needed
explicit aliases — LATTC is the largest electrical trades college in the state and
would have been silently absent).

### Strategic roadmap

- **The electrical rebuild is the highest-value item to come out of any crosswalk
  in this lineage.** Four generic courses carrying twelve credentials, no C-IDs, at
  colleges that overwhelmingly do not teach them. LATTC (76 electrical courses, 13
  programs) is the natural pilot.
- **The wildland fix may be nearly free**: re-express five recommendations against
  course titles colleges actually use, or assign C-IDs. Worth 15 units — a whole
  small certificate — to 19 colleges.
- **Parked, and worth pairing with this:** the O\*NET SOC → certification spine
  from the SJCOE run. It is what would let a receiving-course mapping be *defended*
  rather than asserted.

### Next concrete step

Ashley takes this into the statewide conversations. The single highest-value input
back is **which colleges confirm they do not teach the named receiving courses** —
that turns the "chain breaks" finding from a measurement into a documented
requirement for new exhibits.

---

## 2026-09-11 — SkyLine (Ashley crosswalk lane): the correction, and what a classifier miss costs

### What prompted it

**Ashley, fourth engagement in this lineage.** She asked to take the SJCOE occupation
list statewide for Fire, Wildland Fire and Electrical, with a specified 16-column
structure, four alignment tiers, and — new — **source links and explicit flags on
anything unverified**. She described attached documents; **none reached the session**,
but every one of them was already committed here, so the run proceeded from the
originals rather than blocking.

### What we learned

**1. ⭐ THE CORRECTION: a classifier miss reads exactly like an absent pathway.**
On 2026-09-09 this lane reported the lineworker / utility cluster — **16 of the 60
in-scope occupations** — as having no college pathway in California. That was wrong.
**Six colleges run 18 active lineworker / powerline programs**: College of the Desert,
Imperial Valley, Los Angeles Trade-Technical, Mission, San Diego City and Santiago
Canyon. The cause was a one-word gap in a regex — the program-title pattern matched
`lineworker` and `line worker` but not **`Lineman`** or **`Powerline`**.

The lesson is not "write better regexes". It is that **a classifier's false negative
becomes an ABSENCE CLAIM, and absence is the thing people act on.** "No college teaches
this" sends a partnership down a build-it path; "six colleges teach it" sends it down an
adopt-it path. Nothing in the output distinguished the two — the row was simply not
there. This is the same failure class as
[`methodology-follow-the-recommendation-to-the-course-that-receives-it`](kb-notes/methodology-follow-the-recommendation-to-the-course-that-receives-it.md),
one layer earlier: that note says measure the last link; this one says **make sure your
filter can see the thing you are about to declare missing.**

**What changes:** the largest gap on the SJCOE list is an **adoption** gap, not a
training gap. The training exists (California-Nevada JATC, four utilities, Northwest
Lineman College Oroville), the college programs exist, and **ACE has already published a
25-semester-credit recommendation** for the electrical training ALLIANCE Outside
Apprenticeship, with year bundles of 16 / 16 / 19. Nobody in California has written it
down as CPL. **Santiago Canyon is the first call** — it already articulates the
Cal-Nev JATC apprenticeship into both a Certificate of Achievement and an A.S.

**What stands:** there is still no MAP credit-recommendation exhibit anywhere in
California for these occupations. That half of the earlier finding was correct.

**2. ⚠️ VERIFICATION WAS IMPOSSIBLE AND HAD TO BE SAID, NOT WORKED AROUND.** The request
asked for confirmation against official sources. **Every authoritative domain is blocked
at the network level** — `osfm.fire.ca.gov`, `caljac.org`, `dir.ca.gov`, `cslb.ca.gov`,
`nwcg.gov`, `nccer.org`, `acenet.edu`, `cccco.edu` all refuse connection, tested
directly rather than inferred from an agent's report. Domain-restricted **search** still
returns content extracted from those pages, which is how the external credential set was
assembled — but that is not a fetch, and the workbook says so on every row that depends
on it. The Sources & Verification tab lists each unconfirmed fact with the URL to check.

**3. ⭐ 60 occupations are only 31 credential signatures — dedupe before emitting.**
All five "Electrician" variants share one seven-credential set; sixteen utility
occupations share the empty set. A row per occupation per college would have been
**2,342 near-duplicates**. Grouping the signatures into **14 credential families** — the
grain a college conversation actually happens at — brought it to **872 actionable rows**
with every occupation still listed and filterable.

**4. ⚠️ A sort key can empty a filter.** The shortlist was sorted by priority, so the
top 260 were *all* P2 — the Promote and Build-new filters rendered empty and the six
lineworker rows, the whole point of the run, never appeared. Fixed with a balanced slice
(120 P2 / 110 P3 / 57 P4). **Check that every control you ship has something to show.**

**5. ⚠️ Two classifier bugs caught before shipping.** A SQL `CASE` sent anything that was
not fire or wildland to the electrical lane, so hazmat courses read as electrical — 131
courses (9% of the matched set) were in the wrong lane. And a verification script's own
`crit.startswith('P')` branch caught `"Possible - Additional Research Needed"` and
reported a false mismatch. **The checker needs checking too.**

### The numbers

60 in-scope occupations · 31 credential signatures · 14 families · **872 actionable
college connections** across 106 colleges · 102 existing articulations · 388 adopt-now ·
306 promote-to-statewide · 57 build-new. Cal-JAC holds exactly 5 credentials in MAP,
14 colleges have already made Cal-JAC credit determinations, and the Firefighter
Journeyperson Certificate — the apprenticeship completion — has **98 potential adopters
and zero published credit-recommendation lines**.

### Next concrete step

Santiago Canyon on lineworker, and the ACE 25-credit recommendation as the instrument.
Separately: ask whether the Firefighter Journeyperson Certificate's Local flag is a
decision or an artifact — promoting it reaches 98 colleges.

---

## 2026-09-14 — the occupation-anchored crosswalk, and 56% phantom rows

### What prompted it

**Ashley, fourth engagement in this lineage.** She sent the San Joaquin Department
of Adult Education occupation list (160 program-area names) and asked for a
field-facing Excel crosswalk scoped to **Electrical, Fire and Wildland Fire only**,
with a fixed eight-column shape:

> Occupation · Region · Credit Recommendation · Discipline · Exhibit ID ·
> Exhibit Title · College · Course Name

…and the standard she set for a row: *"Do not include an exhibit unless it can be
verified as available through the MAP platform."* Explicitly a student/field
resource, explicitly not a research report.

### What we learned

**1. ⭐ THE FINDING: an articulation's college list belongs to the GROUP, not to
each course in it.** Joining `local[].colleges` pairwise to `local[].subj/num`
claimed San Diego Miramar teaches `FIRE B1`, `FIRETEC 2`, `FT 1` and `FSC 111`. Its
fire prefix is `FIPT`; it teaches 6 of the 27 rows that join produced. Across the
build, **4,106 of 7,332 rows — 56% — named a course at a college that does not
offer it**, every one carrying a real exhibit ID, real recommendation, real college
and real course title. Gating each pair on the COCI per-college catalog
(`tmc_college_courses.js`) left 3,207 verified rows. Full note:
[[methodology-an-articulation-college-list-belongs-to-the-group-not-the-course]].

⚠️ **The spot check confirms the wrong reading.** 57% of multi-course articulations
do carry a distinct college list per course, so a small sample looks right. The
error scales with group size, which means **the most-adopted credential is the
worst offender** — Firefighter 1 produced the worst cell we found.

**2. ⚠️ The discipline on an articulation is the COURSE's, not the credential's.**
`articulations[].disc` labeled *CEM 155 Blueprint Reading* under *General
Electrician Certification* as **Welding**. A "discipline of the credit
recommendation" column has to come from the credential (`disc_modal`), with the
articulation value as fallback — not the reverse, which is what the first build did.

**3. ⚠️ The electrical false-positive list needed extending AGAIN, and the 2026-09-09
list was not the place to do it.** The committed list catches automotive and AP
Physics. Six more survived it: *Planets and the Solar System with Lab* (Astronomy)
and *Passive Solar Design and Construction* via `/solar/`; *Basic Electricity for
Airframe and Powerplant* (Aviation), *Boatworks 101 — Yacht Electrical Systems*,
*Heavy Machinery Electrical Systems* (Agriculture) and *Exit and Electrical Security
Devices* (Carpentry) via `/electric/`. They live in
`kb/sjcoe_occupation_scope_map.json` as `extra_electrical_false_positives`, layered
on top, so `kb/fire_electrical_domain_map.json` keeps meaning what it meant on
2026-09-09 and that run stays reproducible.

**4. ⚠️ Anchor a family regex or the variant exhibit leaks.** `general electrician
certification` unanchored also matches the separate *General Electrician
Certification — Solar* exhibit, which put Solar Photovoltaic Design in front of
cable splicers and line workers. `^…$` confines it to occupations carrying the
solar family. Ashley asked for *meaningful alignment, not keyword similarity*; this
is the mechanical half of that.

**5. The canonical roster is the wrong authority for DISPLAY names.**
`kb/college_short_names.json` canonicalizes to *City College Of San Francisco* and
*Mt San Antonio College*. MAP's own adopter names — *City College of San Francisco*,
*Mt. San Antonio College* — are the correctly spelled ones. Resolve identity through
the roster; print what MAP says.

**6. Row volume is a scoping signal, not just a formatting problem.** 52 in-scope
occupations, and the fire lane alone produced 2,379 rows against wildland's 14.
That ratio is the 2026-09-09 chain finding showing through from the other side:
wildland credentials exist and are adopted almost nowhere. The thin lane is the
honest answer, and padding it would have hidden the finding.

### State

- `kb/_build_occupation_cpl_crosswalk.py` — fourth instrument in the lineage.
- `kb/sjcoe_occupation_scope_map.json` — occupation scope + family map (data, not code).
- Receipt: `kb/occupation_crosswalk_out/2026-09-14-sjcoe-electrical-fire/crosswalk.json`.
- Delivered: 3,207 opportunities · 52 occupations · 130 exhibits · 36 colleges · 9 regions.

### Next

- Ashley may want the same shape for the other SJCOE program areas (health care,
  construction trades, IT) — the tool is occupation-agnostic; only the map changes.
- The catalog gate belongs in the other three crosswalk builders; they have the
  same pairwise join and have not been re-measured against it.

### 2026-09-14, second pass — MAP's taxonomy, not ours

Ashley, after reviewing the first build: *"use the knowledge base in the MAP
Platform and only provide information on Electrical and Fire/Wildland
occupations."*

**7. ⭐ The platform's own taxonomy outranks a regex built to approximate it.** I
had attached EMT and Paramedic credentials to three fire-service occupations
(FIRE MEDIC, FIRE FIGHTER PARAMEDIC, Firefighter EMT) on the reasoning that the
occupation requires the credential. MAP does not agree, and MAP is the authority:
`map.rccd.edu/statewidecpl/` files **Firefighter EMT Certificate** and **Fire
Fighter Paramedic Journeyperson Certificate** under **Emergency Medical
Services**, a program area distinct from Fire Technology — and its own fallback
patterns test `paramedic` / `emt` / `emergency medical` *before* `fire` so that a
fire-shaped title cannot capture them. 266 rows removed. The judgment was mine,
flagged as mine, and wrong.

⚠️ **The mirror of that taxonomy was already committed** as
`kb/statewide_exhibit_categories.json` and I did not consult it — I wrote lane
regexes instead. Scoping now resolves in MAP's order: explicit assignment, then
MAP's patterns, then the repo regex only for titles MAP's list does not reach.

**8. ⚠️ MAP has no Electrical category.** Its electrical credentials (C-10, C-46,
NCCER Commercial/Industrial Electrician 1–4, both apprenticeships) live inside
**Construction Technology**, beside masonry, plumbing and carpentry. That category
needs an electrical-trade test layered on top, not wholesale inclusion.

**9. ⭐ All 12 of MAP's statewide electrical credentials have adopters and ZERO
recorded receiving courses.** 1–2 adopters each, no `local` articulation lines.
Not one can produce a verified row, so every electrical row in the deliverable
comes from a *local* exhibit (IBEW apprenticeship, General Electrician
Certification, Introduction to Electricity). This is the 2026-09-09 "electrical
chain breaks" finding confirmed from the articulation side rather than the
receiving-course side.

**Second pass:** 2,941 rows · 52 occupations · 118 exhibits · 24 colleges · 9
regions. Colleges fell 36 → 24 because EMT Certification alone carried 28
adopters.
