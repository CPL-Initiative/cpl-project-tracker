---
title: Follow a credit recommendation to the course that receives it
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, cpl, crosswalk, credit-recommendations, articulation, data-quality]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/statewide_fire_electrical_crosswalk_lessons]]"
  - "[[methodology-a-scoped-question-may-need-a-different-instrument]]"
artifacts:
  - kb/_build_domain_cpl_crosswalk.py
  - kb/fire_electrical_domain_map.json
---

# Follow a credit recommendation to the course that receives it

> **One-sentence summary** — "A statewide credit recommendation exists" is not the
> end of the chain; ask whether any college teaches the course it names, because a
> recommendation pointing at a course nobody offers cannot award anyone credit, and
> it looks identical to a healthy one until you check.

## Context

Crosswalks in this repo have generally stopped at existence: does a credential have
a credit recommendation, and which colleges adopted it? That answers the referral
question. It does not answer whether the credit can actually *land*, which is the
question a college asks.

A credit recommendation names a **receiving course** ("3 units in Fire Behavior and
Combustion"). That name is the last link in the chain

    training → credential → CPL recommendation → college course → certificate

and it is the only link nothing in MAP validates.

## The claim

**Measure the last link. Count how many colleges teach a course matching each
receiving-course name, and treat a low count as a defect in the recommendation, not
in the colleges.**

Three outcomes, needing three different actions:

| Receiving course is… | Reading | Action |
|---|---|---|
| taught widely, ideally C-ID'd | the chain **completes** | adoption work — paperwork, not curriculum |
| taught nowhere under that name | the chain **half-completes** | re-express the recommendation against real titles, or assign C-IDs |
| taught at a handful of colleges | the chain **breaks** | build new recommendations against what colleges teach |

Worked case, 2026-09-09, four training domains across all 116 California Community
Colleges:

- **Fire** — 19 statewide credentials → 35 distinct receiving courses, several
  carrying C-IDs. *Fire Behavior and Combustion* is taught at 64 colleges,
  *Building Construction for Fire Protection* at 56. **Completes.**
- **Wildland** — 6 statewide credentials → 5 courses named
  `Wildland 101 – 105 (Wildland Fire Behavior)`. **Zero** colleges have a course by
  that name, though 58 teach 293 wildland courses. **Half-completes**, and 16 of the
  19 colleges with a wildland program have adopted nothing — the naming is the most
  plausible reason.
- **Electrical** — 12 statewide credentials (IBEW, NCCER 1–4, C-10, C-46, both
  apprenticeships) → **4 generic construction courses**, no C-IDs. *Rough
  Electrical* is taught at **1** college. Against **1,047 electrical-trade courses
  at 106 colleges**. **Breaks.**

The electrical lane looks healthy by every prior measure — twelve statewide
credentials, published units, a hundred-plus colleges with capacity. Only the last
link shows why almost nobody adopts it.

### Corollary: deduplicate on the receiving course before quoting units

Summing a lane's credential unit values double-counts, because several credentials
name the same course. Fire sums naively to **147.2 units**; the distinct ceiling is
**90.2** — 39% is repetition of *Building Construction for Fire Protection*, *Fire
Behavior and Combustion* and *Fire Protection Organization* across Firefighter 1,
the Cal-JAC Firefighter EMT Certificate and the Fire Officer series. **A student
banks courses, not credentials.** Take the max unit value per distinct course, and
cap the total at the size of the certificate it is applied to.

## How we got here

Ashley (SJCOE) asked for opportunities where students receive the *maximum
applicable CPL toward a certificate or degree, rather than simply identifying
similar courses*. Taking that literally forced the unit arithmetic onto the
receiving course, which in turn made it obvious the course names could be checked
against the college catalogs — and that two lanes fail the check.

## Consequences and caveats

- **Title matching is a floor.** A college may teach the same content under another
  name, so a low count is a prompt to ask, not proof of absence. It is still
  decisive at the extremes: zero colleges teaching "Wildland 101" is not a naming
  near-miss.
- **A C-ID makes the link checkable and portable**; its absence is why the wildland
  and electrical lanes are ambiguous. Where a lane matters and has no C-IDs, that is
  the fix worth asking for.
- **This is a defect in the recommendation, not the college.** Framing it the other
  way round tells 106 colleges with real electrical programs that they are behind,
  when the recommendation never reached them.
