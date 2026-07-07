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

Names in use (verbatim, per Sam's saves + the CTCNC/SAT-JATC public sites):

| Region | Program / committee | Used on |
|---|---|---|
| Southern CA | `Southwest Carpenter And Affiliated Trade J.A.T.C.` | the "Journeyman Certificate- Apprenticeship Carpentry, *" family |
| Northern CA (46 counties) | `Carpenters Training Committee for Northern California (CTCNC)` | the Cabrillo "Carpenters Apprenticeship — *" trades (Millwright, Pile Driver, Drywall/Lather, Insulator, Scaffold Erector, Hardwood Floor Layer, Shingler, Cabinetmaker, Modular Installer) |
| — | Ironworkers Locals **416 / 433** (LA area) | the Cerritos "Reinforcing/Structural Apprenticeship 416/433: Period N" rows (issuer left blank pending DIR confirmation, matching Sam's IW-* precedent) |

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

## CSLB (future lane — the C-## contractor licenses)

The ~10 residual `C-## <Trade> Contractor` / `Class A|B` rows are California
**Contractors State License Board** license classifications:

- License classifications list: <https://www.cslb.ca.gov/About_Us/Library/Licensing_Classifications/>

Pre-seedable once Sam decides the house family shape (e.g. `CSLB C-10 —
Electrical Contractor License`); issuer `Contractors State License Board
(CSLB)`. Queue: C-5, C-6, C-8, C-10, C-29, C-36, C-46, C-47, Class A, Class B,
Class B-2.

## Already-wired authorities (for completeness)

- **CareerOneStop (COS)** certification registry — synced live
  (`kb/_sync_cos_certifications.py`, Session 101); CER ✓/≈ match chips.
- **College Board** (AP/CLEP) — the Session-102 brand-family pre-seed
  (`kb/_preseed_unclassified.py` FAMILIES table).
- **COCI course list** (`kb/reference/coci_course_list.xlsx`) — the Rule 5c
  course-content title source for Cx/portfolio/HS-articulation exhibits
  (issuer `California Community Colleges`).
