---
title: Crosswalking a partner's occupation list to CPL — curate the judgment, not the run
created: 2026-08-05
updated: 2026-08-05
tags: [methodology, cpl, partners, crosswalk, occupations, workforce]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-dormant-asset-worklist]]"
  - "[[noncredit_cpl_thinking]]"
artifacts:
  - kb/_build_partner_crosswalk.py
  - kb/occupation_credential_map.json
  - kb/partner_crosswalk_regions.json
  - tests/partner_crosswalk_test.py
---

# Crosswalking a partner's occupation list to CPL

> **One-sentence summary** — When a workforce partner asks "which of the occupations
> we train for can our students already get college credit for, and where?", the
> expensive part is the occupation→credential judgment, so persist *that* in a shared
> map and let the run itself be disposable.

## Context

An employment/training partner sends a list of the occupations they serve and asks
which map to CPL. Their list carries **job and apprenticeship titles** —
`RESIDENTIAL WIREMAN`, `Hydro Plant Operator`, `U.C.F.W. NORTHERN CA MEAT | MEAT
CUTTER` — while MAP is keyed by **credential titles** (`Residential Electrical
Apprenticeship`, `AWS D1.1 SMAW Qualified Welder`). There is no mechanical join
between the two vocabularies, and no authoritative crosswalk to borrow.

First instance: San Joaquin County Office of Education, 2026-08-05 (Ashley's ask,
160 rows → 139 unique occupations).

## The claim

### The judgment is the asset; the run is disposable

Matching an occupation to a credential is subject-matter reasoning that costs real
effort and does not get cheaper on the second partner. So it is stored, not
recomputed: `kb/occupation_credential_map.json`, keyed by a **normalized occupation
string** (lowercase, punctuation collapsed) so the next partner's `Plumber` reuses
the ruling curated for the last one's `PLUMBER`. Each run writes an `unmapped.json`
— **that file is the curator worklist**. Coverage compounds across engagements
instead of restarting. The workbook is a regenerable artifact and is not committed.

### "No CPL exists" and "nobody has looked" are different facts

An occupation with an **empty credentials list** is a curated finding: we looked,
nothing exists, and that is a build-it opportunity worth reporting. An occupation
**absent from the map** simply has not been reviewed. Collapsing the two launders
unreviewed rows into confident "no CPL anywhere" claims inside a partner-facing
deliverable. The engine keeps them as separate statuses (`No CPL found` vs
`Not yet mapped`) and the test asserts they never merge.

### Every match carries a Direct/Related tier

`Direct` = the credential IS the occupation's own certification or licence.
`Related` = commonly held in that occupation, or covers part of the role. Partners
need this: Direct matches are safe to advertise to a student, Related ones are worth
a conversation first. A crosswalk that flattens the two over-promises.

### Statewide comes from the ADOPTION file, not the credential reference

The two data files disagree, and **not symmetrically**:

| Source | Statewide titles |
|---|---|
| `statewide_data.js` (`collaborative_type == "CCC Collaborative"`) | **138** |
| `credential_reference_data.js` (`statewide: true`) | **84** |

The 84 is a strict **subset**. The 54-title delta is the newer statewide cohort —
CSLB contractor licences, Carpenters Apprenticeship, NCCER, child development — i.e.
precisely the building-trades rows a workforce partner's list is full of. Take the
adoption file. `tests/partner_crosswalk_test.py` asserts the subset relationship so
an upstream change surfaces as a failure rather than a silent under-count.

### Adopters are a union, deliberately

`adopters` unions `adopter_names` across every exhibit record sharing a unified
title — statewide adoptions **and** local articulations. The partner's question is
"where can my student get credit for this?", and a local articulation answers it as
well as a statewide one. Consequence: a credential's adopter count here can legally
**exceed** the count shown on the Statewide Exhibits tab, which counts the
CCC-Collaborative record alone. Say so in the deliverable's Read Me.

### Report regional capacity split academic vs career

A partner assumes their in-county college is the referral target. Often it is not,
and the reason is invisible in a raw credential count: **split each nearby college's
portfolio into academic credit-by-exam (AP/CLEP/DSST) versus career/technical.** For
SJCOE this was the headline — San Joaquin Delta College carries 69 credentials of
which **exactly one** is career/technical (POST Basic Academy); Sacramento City and
Folsom Lake have zero; Cosumnes River has none at all. The nearest real capacity is
Modesto Junior College at **265** career credentials, the largest in the state. A
referral plan built on the county college would have failed silently.

## How we got here

Built in one session from the SJCOE list. The engine
(`kb/_build_partner_crosswalk.py`) reproduces the hand-curated deliverable exactly —
139 occupations, 51 statewide / 53 local-only / 35 no-CPL, 406 occupation×credential
matches — which is the parity check that made it safe to commit the generator and
throw the ad-hoc scripts away.

Findings worth carrying forward from run 1:

- **75% coverage** (104 of 139) is higher than expected for a trades-heavy list.
- **Utility line work is a total desert.** Lineworker, lineman, substation
  electrician, hydro plant, gas control, metering, cable splicer, power dispatcher —
  ~20 rows — have **zero** CPL anywhere in the system. Also empty: tile/terrazzo/
  marble setting, pest control, surgical technologist, central sterile processing,
  painting, nuclear operations.
- **Fire service is the strongest cluster** — Firefighter 1 at 17 colleges, EMT at
  29, the full Fire Officer 2A–2E and Fire Inspector 1A–1D series statewide — then
  IT/CompTIA, welding, ASE automotive, and the building-trades apprenticeships.

## When this applies (and when it doesn't)

**Applies** to any partner arriving with a list of occupations, programs, or job
titles: workforce boards, AJCCs, county offices of education, apprenticeship
sponsors, employers, adult schools. The `--region-preset` mechanism generalizes to
any geography.

**Does not apply** as an authoritative crosswalk. This is judgment, and the
deliverable says so on its Read Me. It is *not* a substitute for a real
occupation→credential spine (O*NET SOC → certification), which would let the match
be defended rather than asserted. If this instrument gets published rather than
hand-delivered, build that spine first.

**Do not** let a college's presence in the adopter list read as a guarantee of an
award. The college has articulated the credential; the student still applies through
that college's CPL process and unit awards vary.

## See also

- `kb/_build_partner_crosswalk.py` — the engine, with the full source-semantics
  docstring
- `kb/occupation_credential_map.json` — the shared, growable rulings
- [[methodology-dormant-asset-worklist]] — the sibling "what exists but is unused"
  instrument
- [[noncredit_cpl_thinking]] — learning-partner modes; an employment training centre
  is an M2/M5 partner
