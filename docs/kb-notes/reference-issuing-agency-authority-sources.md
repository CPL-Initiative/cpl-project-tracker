---
title: "Issuing-agency authority sources for CER exhibit canonicalization"
date: 2026-07-07
kb-status: published
type: reference
tags: [cer, exhibit-canonicalization, issuing-agency, authority-sources, apprenticeship, nccer, dir-das]
artifacts:
  - kb/_preseed_unclassified.py
  - kb/unclassified_preseed.json
  - .claude/skills/exhibit-canonicalization/SKILL.md
related:
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/kb-notes/reference-statewide-credit-recommendations]]"
---

# Issuing-agency authority sources

Where to get **authoritative exhibit names + agency names** when triaging CER
unclassified rows. Sam's doctrine (Session 101): when a house family already
exists, retarget to it verbatim — these sources are for rows with **no** house
family yet, and for getting the ISSUER string right the first time.

⚠ **Sandbox note:** every site below except CareerOneStop 403-blocks the agent
environment (policy denial at the proxy). Verify names via a browser, or add a
runner-as-proxy fetch (the `cos-authority-sync` pattern,
`docs/kb-notes/playbook-runner-as-external-api-proxy.md`) if a lane needs bulk
data.

## California DIR — Division of Apprenticeship Standards (DAS)

The registry of every California-registered apprenticeship **program sponsor**
— the authoritative issuer name for apprenticeship exhibits.

- Occupation search entry point: <https://www.dir.ca.gov/databases/das/aigstart.asp>
- Per-occupation program list: `https://www.dir.ca.gov/databases/das/results_aigdetail.asp?varOccId=<id>`
  - **Carpenter = `varOccId=2180`** (the page Sam used 2026-07-07 for the
    carpentry exhibits): <https://www.dir.ca.gov/databases/das/results_aigdetail.asp?varOccId=2180>
  - **Carpenter (JATC detail) = `varOccId=82`** (Sam, 2026-07-08 — resolves the
    Southwest Carpenters sponsor for the Norco/Santiago Canyon rows):
    <https://www.dir.ca.gov/databases/das/results_aigdetail.asp?varOccId=82>
  - **Electrician = `varOccId=490`** (Sam, 2026-07-08 — Riverside Area
    Electrical J. A. C. for Norco/Santiago Canyon electrician exhibits):
    <https://www.dir.ca.gov/databases/das/results_aigdetail.asp?varOccId=490>
  - The search is **not exact** — prepopulate the best option **by college
    region** and let the curator confirm (Sam, 2026-07-08; implemented as the
    `apprenticeship` lane in `kb/_preseed_null_issuers.py`).

Names in use (verbatim, per Sam's saves + the CTCNC/SAT-JATC public sites):

| Region | Program / committee | Used on |
|---|---|---|
| Southern CA | `Southwest Carpenter And Affiliated Trade J.A.T.C.` | the "Journeyman Certificate- Apprenticeship Carpentry, *" family + the Norco carpentry-module rows (pre-seeded 2026-07-08) |
| Riverside area | `Riverside Area Electrical J. A. C.` | Electrician exhibits at Norco / Santiago Canyon (armed in the pre-seed's electrical branch; the 6 existing IBEW-issuered rows were NOT re-pointed — never-overwrite guard, curator's call) |
| Northern CA (46 counties) | `Carpenters Training Committee for Northern California (CTCNC)` | the Cabrillo "Carpenters Apprenticeship — *" trades (Millwright, Pile Driver, Drywall/Lather, Insulator, Scaffold Erector, Hardwood Floor Layer, Shingler, Cabinetmaker, Modular Installer) |
| — | Ironworkers Locals **416 / 433** (LA area) | the Cerritos "Reinforcing/Structural Apprenticeship 416/433: Period N" rows (issuer left blank pending DIR confirmation, matching Sam's IW-* precedent) |

### DAS Completion Dashboard (Tableau) — statistics, not (yet) a sponsor resolver

Sam found (2026-07-08) the statewide **CA Apprenticeship Completion Dashboard**
— all registered apprenticeship programs in California:

- <https://public.tableau.com/app/profile/california.apprenticeship/viz/CompletionDashboard_16301020658110/CompletionDashboard>

Caveats before wiring it into the DIR-pending residual lane (~143 rows):

- **No CCC affiliation field** — it lists programs/sponsors + completions but
  does not tie a program to its partnering community college, which is the
  join we need to resolve a college's apprenticeship exhibit to its sponsor.
  Sam is still searching for a source that carries that affiliation.
- Tableau Public embeds are JS-rendered — bulk extraction would need the
  runner-as-proxy pattern against Tableau's data endpoints (or a manual CSV
  download via the dashboard's export), not a plain fetch.
- Until an affiliation source lands, the per-occupation `results_aigdetail`
  pages + college-region matching (above) remain the resolution path.

## NCCER

**NCCER** (formerly the National Center for Construction Education and
Research) — construction-craft curricula (Levels 1–4) and **journey-level
assessments** (Commercial/Industrial Electrician, Commercial/Industrial
Carpenter, …).

- Assessments catalog (the page Sam used): <https://www.nccer.org/assessments/>
- Craft catalog (curriculum levels): <https://www.nccer.org/craft-catalog/>

House conventions: exhibit titles keep NCCER's own naming **verbatim**
(`NCCER Commercial Electrician Level 2` — levels and journey-level assessments
are distinct credentials, never folded); issuer = `NCCER` (Sam's existing
`NCCER Welding Level 1` family precedent).

## CSLB (LANE LIVE — Session 104)

The `C-## <Trade> Contractor` / `Class A|B(-2)` rows are California
**Contractors State License Board** license classifications:

- License classifications list: <https://www.cslb.ca.gov/About_Us/Library/Licensing_Classifications/>

House shape (staged Session 104, Sam reviews before saving): title kept
**VERBATIM** (Rule 8b — the classification code is the credential's identity;
they are also statewide CCC-collaborative exhibits under those exact titles);
issuer `Contractors State License Board (CSLB)`. `stage_cslb` guards to 1-2
digit codes so wildland C-190/C-290 course bundles are never claimed.

## Fire-service accreditors (Session 104)

Fire certification exhibits often name their **accreditation system** in a
parenthetical — `(IFSAC/ProBoard)`, `(ProBoard)`. Rule 4: same credential,
issuer discriminates; the staged family lane captures the parenthetical as the
issuer (canonical long forms):

- **International Fire Service Accreditation Congress (IFSAC)** —
  <https://ifsac.org/>
- **Pro Board (National Board on Fire Service Professional Qualifications)** —
  <https://theproboard.org/>
- California's own certifying body for the SFT ladder stays
  `California State Fire Training (SFT)`; NWCG codes (S-###) →
  `National Wildfire Coordinating Group (NWCG)`.

## FAA — Federal Aviation Administration (LANE LIVE — 2026-07-08)

The certifying body behind the aviation exhibit family. House spelling:
**`Federal Aviation Administration (FAA)`** (the existing 12-record house
family in `kb/credentials.json` — Mechanic Certificate A&P / Airframe /
Powerplant ratings, pilot certificates, CFI/CFII, Remote Pilot Part 107).

- Airmen certification overview: <https://www.faa.gov/licenses_certificates/airmen_certification>
- Mechanic (A&P) certification — 14 CFR Part 65; Part 147 school curriculum
  (Airframe / Powerplant subjects): <https://www.faa.gov/mechanics/become>
- Pilot certificates — 14 CFR Parts 61/141; Remote Pilot — Part 107.

The **cert-family pre-seed lane** (`CERT_FAMILIES` in
`kb/_preseed_null_issuers.py`) stages FAA on the family's **course-side**
rows — Part-147 AMT curriculum courses (Airframe Structures, Powerplant:
Reciprocating and Turbine Engines, Basic Electricity for Airframe and
Powerplant), pilot ground school + the Reedley FLGHT flight-training ladder,
drone-pilot courses — the welding/AWS precedent: the exam/portfolio evidence
behind the Cx row is the family's own credential. Precision guard: `drone
pilot`, never bare `drone` ("Drone Photography" is a photography course).

## Already-wired authorities (for completeness)

- **CareerOneStop (COS)** certification registry — synced live
  (`kb/_sync_cos_certifications.py`, Session 101); CER ✓/≈ match chips.
- **College Board** (AP/CLEP) — the Session-102 brand-family pre-seed
  (`kb/_preseed_unclassified.py` FAMILIES table).
- **COCI course list** (`kb/reference/coci_course_list.xlsx`) — the Rule 5c
  course-content title source for Cx/portfolio/HS-articulation exhibits
  (issuer `California Community Colleges`).
