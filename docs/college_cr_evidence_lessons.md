---
title: Lessons — finding a credit recommendation for a course a college already approved
date: 2026-08-27
tags: [lessons, cpl, military, ace, jst, articulation, credit-recommendation, lattc, evidence]
artifacts:
  - kb/_match_courses_to_ace_recs.py
  - kb/college_cr_evidence/lattc_military_2026-08-27.json
  - kb/college_cr_evidence/lattc_military_2026-08-27.html
related:
  - "[[CLAUDE]]"
  - "[[military_cr_reference_scope]]"
  - "[[local_course_alignment_lessons]]"
---

# Finding a CR for a course a college already approved

## 2026-08-27 — LATTC's 139 military-CPL courses (Jessica)

**The problem, in Jessica's words:** *"They can easily identify that a course can be
approved for a certain CPL type, but do not have the evidence specified."* LATTC sent
139 courses approved for military CPL and no credit recommendation for any of them —
and MAP requires a CR before an articulation can exist. This is a **recurring class of
ask**, not a one-off, which is why the matcher is committed rather than run in a
scratchpad.

### What the corpus actually supports

- **The CRs exist; the peer articulations mostly do not.** `map_college_cr_unit` holds
  **200,364 ACE rows / 7,156 distinct recommendations / 5,318 exhibits**, but only
  **5,442 rows (2.7%)** name a local college course. Grouped, that is **3,663 peer rows
  across 60 colleges** — and after dropping `CPL-N Elective Course Credits` placeholders,
  only **15 colleges** supply precedent anywhere near LATTC's trades.
- ⚠️ **The peer corpus is skewed to management, supervision and computer courses** — the
  military-CPL default. Before the run: **zero** carpentry, plumbing, water/wastewater or
  architecture peer courses; welding 12, electrical 33, HVAC 7. A college whose catalog is
  trades will get thin peer coverage, and that has to be said out loud rather than papered
  over with a weak match.
- ⭐ **But the ACE recommendation vocabulary is rich exactly where the peer table is
  empty**: `3 hours in welding` (13 exhibits / 40 colleges), `1 hour in blueprint reading`
  (31 / 69), `3 hours in technical mathematics` (21 / 77), `3 hours in carpentry` (4 / 12),
  `3 hours in plumbing` (7 / 36), `3 hours in water treatment operations` (9 / 35).

### Two signals, reported separately, never blended

Per `methodology-two-signals-for-a-judgment-proposal`:

- **A — the recommendation exists.** ACE publishes it and CA students already hold it.
  This makes an articulation *possible*. It is a proposal.
- **B — peer precedent.** A named college attached that CR to a named course. A *fact*.

Result on LATTC: **87 courses A+B · 46 A only · 6 with neither.**

⚠️ **Ranking on B first is wrong.** The first cut sorted peer-backed candidates above
everything and answered *Water Distribution I* with **"3 hours in distribution
management"** (business distribution) over *"water storage and distribution"*, and
*Construction Wiring* with *"introduction to construction"* over the wiring recs.
**Whether anyone has done it does not change what it IS.** Score primary, peer as the
tiebreak inside a 0.1 band.

### The gate that matters: a strong token, not any token

Reusing `cx_align_tokens()`'s stopword list is not enough — its remaining "content" words
include generic nouns that match anything. Uncaught, they produced:

- *Street Maintenance (Applied Calculations in Public Works)* → **"3 hours in mechanical
  maintenance"** (shared: `maintenance`)
- *Piping Principles And Practices* → **"1 hour in laboratory practices"** (shared:
  `practices`) — while *"plumbing and pipefitting"* sat unmatched
- *Calculations and Measurement for Woodworking Students* → **"1 hour in medication
  calculations"** and **"3 hours in student teaching"**

Two rules fix all of them: a **WEAK set** (maintenance · systems · practices · planning ·
principles · technology · materials …) that may contribute to a score but may never be the
only thing shared; and a **DOMAIN GATE** — the recommendation must also sit in the course's
trade, unless **two** independent content words agree.

⚠️ **No "closest match anyway" fallback tier.** It was tempting for the 6 leftovers, and
`CLAUDE.md` already forbids it: built and withdrawn once because it proposed *AUTO 160
Introduction to Automotive Electrical* for a **policing** rec. A course with no
title-word match goes to a human. The 6 are honest: GIS planning, green jobs, grounding,
foundations of design, street maintenance ×2 — **no ACE CR for `conduit` or `grounding`
exists at all** (measured, 0 rows).

⭐ **Show the word the match was made on.** `matched_on` is rendered on every proposal, so
a reviewer kills a bad one in a second. It is also what keeps a domain-word-only match
honest: *History of Architecture* → *"architectural drawing"* reads as **matched on:
architecture**, and a human sees instantly that it is a discipline match, not a content one.

### Keyed to the CR, never to the MOS

⭐ **Jessica, 2026-08-27:** *"colleges often say a service member can get credit based on
their MOS or rate. Service members can have multiple MOS/rates so it is optimal to award
credit based on the credit recommendation on the JST."* The deliverable is therefore
keyed on the recommendation, and each one lists the **exhibits that carry it** — the
JST entries that reach the same credit. `3 hours in welding` arrives via *Hull Maintenance
Technician*, *Steelworker*, *Allied Trades Specialist* and 10 more; a per-MOS mapping would
have had to state that route by route and would go stale as ACE revises exhibits.

### NCCER — what we hold, and what is missing

Same evidence problem in the industry-certification lane. We hold **19 NCCER credentials**;
**14 are statewide with published recommendations and ZERO adopters**, and only **NCCER
Welding Levels 1–4** have ever been articulated, by exactly **three** colleges (Bakersfield,
Barstow, Santa Ana).

⭐ **The statewide recommendations are already at roughly MODULE grain** — *Thermal Cutting
Processes*, *Printreading and Welding Symbols Interpretation*, *Rough Electrical* are NCCER
module names, not level names. So the certificate→module structure is partly encoded already.
⚠️ **In MAP, colleges name NCCER at the LEVEL grain** (`raw_variants` are all
`NCCER <craft> Level N`, plus one `(10 Certificates)` bundle) — the module citing happens
off-platform, which is exactly why the evidence cannot be found later.

⛔ **The authoritative certificate→module map needs the NCCER catalog, and `nccer.org` is
egress-blocked from the sandbox** (proxy returns 403 CONNECT). It must be attached to the
session, as the LATTC workbook was.

### Next

1. LATTC faculty work the 87 peer-backed proposals first — cheapest to defend.
2. The 46 recommendation-only rows are the **ready-to-adopt shelf**: LATTC would be the
   first California college to articulate them.
3. The 6 leftovers need a faculty call, not a better matcher.
4. NCCER: get the catalog PDF attached, then build certificate → module → CR.
