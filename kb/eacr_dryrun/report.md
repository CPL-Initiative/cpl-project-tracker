# EACR Phase 4 (re-pivot) dry-run report

Generated: 2026-05-26

Measurement only. Reads the current MAP exhibit rows + the credential-
identity layer (`kb/unified_titles.json` + `kb/credentials.json`) and
projects what the EACR table would look like under the proposed grouping
key `(unified_title, issuing_agency, CPL Type, Collaborative Type)`.

Per vision doc §6.1, multi-issuer unified_titles (e.g. Fire Inspector I
issued by ICC vs NFPA) become **separate cards** rather than one.

## Headline

| Metric | Today | Proposed | Change |
|---|---:|---:|---:|
| EACR card count | **3,345** | **2,351** | -994 (+29.7%) |
| Raw exhibit rows | 11,004 | 11,004 | (unchanged) |
| Skipped rows (no eid/title) | 0 | 0 | (unchanged) |

## Card composition (proposed)

| Status | Cards | Notes |
|---|---:|---|
| Classified (KB-mapped) | 2,351 | raw_title was in `unified_titles.json` |
| Unclassified (raw-fallback) | 0 | preserved 1:1 from today; surfaces re-classification backlog |
| Quality-flagged | 193 | at least one constituent raw row carries `quality_flag = "suspect_course_as_exhibit"` |

### Row coverage

- Rows with classified unified_title + issuer: **11,004** / 11,004
- Rows with unified_title but missing credential entry (issuer unknown): **0**
- Rows with no unified_title (raw-fallback): **0**

## Confidence bands (classified cards, modal `confidence_title`)

| band | cards | % |
|---|---:|---:|
| 0.95–1.00 | 282 | 12.0% |
| 0.80–0.94 | 978 | 41.6% |
| 0.60–0.79 | 836 | 35.6% |
| 0.40–0.59 | 222 | 9.4% |
| <0.40 | 33 | 1.4% |

## Multi-issuer unified titles (each issuer → own card)

- unified titles with 2+ issuer records (`credentials.json`) active in the data: **19**
- additional cards introduced by multi-issuer splitting: **22**

Cases listed in `collisions.json`. Top 20 by issuer count:

  - **Fire Inspector I** — 4 issuers: `National Fire Protection Association (NFPA)` · `International Code Council (ICC)` · `California State Fire Training (SFT)` · `California Joint Apprenticeship Committee (Cal-JAC)`
  - **EMT Certification** — 3 issuers: `California Emergency Medical Services Authority (EMSA)` · `American Council on Education (ACE)` · `National Registry of Emergency Medical Technicians (NREMT)`
  - **Advanced Agricultural Welding** — 2 issuers: `(null)` · `American Council on Education (ACE)`
  - **Building Construction for Fire Protection** — 2 issuers: `(null)` · `California State Fire Training (SFT)`
  - **CDCR Corrections Officer Academy** — 2 issuers: `California Department of Corrections and Rehabilitation (CDCR)` · `California Department of Corrections and Rehabilitation (CDCR) / Corrections Standards Authority (CPOST)`
  - **Certified Payroll Professional (CPP)** — 2 issuers: `American Payroll Association (PayrollOrg)` · `PayrollOrg`
  - **Fire Instructor 1** — 2 issuers: `California State Fire Training (SFT)` · `International Fire Service Accreditation Congress (IFSAC) / Pro Board`
  - **First Responder with Healthcare Provider CPR** — 2 issuers: `(null)` · `American Heart Association (AHA)`
  - **Fundamental Payroll Certification (FPC)** — 2 issuers: `American Payroll Association (APA)` · `PayrollOrg`
  - **Human Anatomy** — 2 issuers: `(null)` · `American Council on Education (ACE)`
  - **IB Mathematics HL** — 2 issuers: `International Baccalaureate (IB)` · `International Baccalaureate Organization (IBO)`
  - **IB Mathematics: Analysis and Approaches HL** — 2 issuers: `International Baccalaureate Organization (IBO)` · `International Baccalaureate (IB)`
  - **IB Mathematics: Applications and Interpretation HL** — 2 issuers: `International Baccalaureate Organization (IBO)` · `International Baccalaureate (IB)`
  - **IB Physics HL** — 2 issuers: `International Baccalaureate Organization (IBO)` · `International Baccalaureate (IB)`
  - **IB Psychology HL** — 2 issuers: `International Baccalaureate Organization (IBO)` · `International Baccalaureate (IB)`
  - **IB Theatre HL** — 2 issuers: `International Baccalaureate Organization (IBO)` · `International Baccalaureate (IB)`
  - **Legal Aspects of Real Estate** — 2 issuers: `(null)` · `California Department of Real Estate (DRE)`
  - **Medical Terminology** — 2 issuers: `(null)` · `California Board of Vocational Nursing and Psychiatric Technicians (BVNPT)`
  - **Real Estate Principles** — 2 issuers: `(null)` · `California Department of Real Estate (DRE)`

## Top 50 biggest collapses (today-cards → new-card)

Each row shows how many of today's `(raw title, CPL Type, Collab Type)` cards
fold into a single new `(unified_title, issuer, CPL Type, Collab Type)` card.

| New card | Today cards folded | Raw rows | Adopters | Top raw variants |
|---|---:|---:|---:|---|
| **AP World History: Modern** / College Board / Standardized Assessment / Local | 26 | 129 | 82 | `AP World History: Modern (score 3-5): Cal-GETC Area 3B or 4` (79) · `AP Exam World History: Modern (Fall 2025 and after)` (7) · `AP Exam World History: Modern (prior to Fall 2025)` (5) |
| **AP Calculus BC** / College Board / Standardized Assessment / Local | 20 | 131 | 83 | `AP Calculus BC (score 3-5): Cal-GETC Area 2` (78) · `AP Exam Calculus BC (Score 3-5)` (11) · `AP Exam: Calculus BC` (8) |
| **AP Spanish Language and Culture** / College Board / Standardized Assessment / Local | 19 | 60 | 20 | `AP Spanish Language and Culture` (9) · `AP Exam: Spanish and Language` (6) · `AP Exam - Spanish Language & Culture` (6) |
| **EMT Certification** / National Registry of Emergency Medical Technicians (NREMT) / Industry Certification / Local | 17 | 31 | 12 | `Current EMT Certification or Paramedic License` (7) · `Emergency Medical Technician` (4) · `Emergency Medical Technician NRE and CPR` (3) |
| **AP English Language and Composition** / College Board / Standardized Assessment / Local | 17 | 39 | 19 | `AP Exam English Language and Composition (Score 3-5)` (11) · `AP English Language and Composition` (6) · `AP - English Language/Composition` (3) |
| **AP Calculus AB** / College Board / Standardized Assessment / Local | 17 | 193 | 82 | `AP Calculus AB (score 3-5): Cal-GETC Area 2` (78) · `AP Calculus BC/ AB sub score (score 3-5): Cal-GETC Area 2` (78) · `AP Exam Calculus AB (Score 3-5)` (14) |
| **AP Physics C: Mechanics** / College Board / Standardized Assessment / Local | 16 | 182 | 81 | `AP Physics C: Mechanics (score 3-5): Cal-GETC Area 5A and 5C` (156) · `AP - Physics C Mechanics` (4) · `AP Exam: Physics C- Mechanics` (3) |
| **AP Physics C: Electricity and Magnetism** / College Board / Standardized Assessment / Local | 15 | 179 | 80 | `AP Physics C: Electricity/Magnetism (score 3-5): Cal-GETC Area 5A and 5C` (156) · `AP - Physics C Electricity/Magnetism` (4) · `AP Exam Physics C: Electricity and Magnetism Score of 4 or 5` (3) |
| **AP English Literature and Composition** / College Board / Standardized Assessment / Local | 14 | 52 | 17 | `AP Exam English Literature and Composition (Score 3-5)` (14) · `AP English Literature and Composition` (9) · `AP - English Literature/Composition` (4) |
| **AP Biology** / College Board / Standardized Assessment / Local | 13 | 190 | 81 | `AP Biology (score 3-5): Cal-GETC Area 5B and 5C` (156) · `AP Biology` (7) · `AP Exam: Biology` (7) |
| **AP Macroeconomics** / College Board / Standardized Assessment / Local | 13 | 99 | 81 | `AP Macroeconomics (score 3-5): Cal-GETC Area 4` (78) · `AP Exam: Macroeconomics` (4) · `AP Exam Macroeconomics (Score 3-5)` (4) |
| **AP Microeconomics** / College Board / Standardized Assessment / Local | 13 | 101 | 81 | `AP Microeconomics (score 3-5): Cal-GETC Area 4` (78) · `AP Microeconomics` (5) · `AP Exam Microeconomics (Score 3-5)` (4) |
| **AP European History** / College Board / Standardized Assessment / Local | 13 | 111 | 81 | `AP European History (score 3-5): Cal-GETC Area 3B or 4` (79) · `AP European History` (7) · `AP Exam European History (Score 3-5)` (6) |
| **AP Psychology** / College Board / Standardized Assessment / Local | 13 | 105 | 81 | `AP Psychology (score 3-5): Cal-GETC Area 4` (79) · `AP Psychology` (8) · `AP Exam: Psychology` (4) |
| **AP Spanish Literature and Culture** / College Board / Standardized Assessment / Local | 13 | 30 | 15 | `AP Spanish -Literature and Culture` (5) · `AP Spanish Literature` (4) · `AP Exam Spanish Literature and Culture` (4) |
| **IB History HL** / International Baccalaureate Organization (IBO) / Standardized Assessment / Local | 13 | 94 | 81 | `IB History (any region) HL (score 5-7): Cal-GETC Area 3B or 4` (79) · `IB Exam History (Any Region) HL` (3) · `IB Exam History (any region) HL (Score 5-7)` (2) |
| **AP Chemistry** / College Board / Standardized Assessment / Local | 12 | 184 | 81 | `AP Chemistry (score 3-5): Cal-GETC Area 5A and 5C` (156) · `AP Chemistry` (7) · `AP Exam: Chemistry` (6) |
| **AP Latin** / College Board / Standardized Assessment / Local | 12 | 100 | 81 | `AP Latin (score 3-5): Cal-GETC Area 3B` (78) · `AP Latin` (6) · `AP Latin - Virgil` (3) |
| **AP French Language and Culture** / College Board / Standardized Assessment / Local | 12 | 27 | 12 | `AP French Language` (4) · `AP French Language and Culture` (4) · `AP French - Language & Culture` (3) |
| **AP Art History** / College Board / Standardized Assessment / Local | 12 | 116 | 82 | `AP Art History (score 3-5): Cal-GETC Area 3A or 3B` (78) · `AP Art History` (12) · `AP Exam: Art History` (7) |
| **AP United States History** / College Board / Standardized Assessment / Local | 11 | 33 | 15 | `AP Exam United States History` (6) · `AP Exam: U. S. History` (6) · `AP U.S. History` (5) |
| **AP Chinese Language and Culture** / College Board / Standardized Assessment / Local | 11 | 23 | 12 | `AP Chinese Language and Culture` (4) · `AP Chinese - Language & Culture` (3) · `AP - Chinese Language & Culture` (3) |
| **AP German Language and Culture** / College Board / Standardized Assessment / Local | 11 | 21 | 11 | `AP German Language` (4) · `AP German -Language & Culture` (3) · `AP - German Language & Culture` (3) |
| **AP United States Government and Politics** / College Board / Standardized Assessment / Local | 11 | 23 | 17 | `AP Exam United States Government and Politics` (5) · `AP Government and Politics - United States` (3) · `AP U.S. Government & Politics` (3) |
| **POST Basic Academy** / California Commission on Peace Officer Standards and Training (POST) / Industry Certification / Local | 10 | 100 | 22 | `Peace Officer Standards Training (POST) Basic Academy` (25) · `POST - Peace Officer Standards and Training - Basic Academy Certificate` (23) · `CA POST Academy SMCCD` (22) |
| **EMT Certification** / National Registry of Emergency Medical Technicians (NREMT) / Credit By Exam / Local | 10 | 15 | 7 | `CA EMT Credit by Exam 2` (4) · `Emergency Medical Technician  (2 Semesters) -Los Alamitos HS / North Orange County ROP` (2) · `Emergency Medical Technician (2 Semesters) La Habra H.S./North Orange County ROP` (2) |
| **AP Environmental Science** / College Board / Standardized Assessment / Local | 10 | 176 | 81 | `AP Environmental Science (score 3-5): Cal-GETC Area 5A and 5C` (156) · `AP Environmental Science` (5) · `AP - Environmental Science` (4) |
| **AP Computer Science A** / College Board / Standardized Assessment / Local | 10 | 20 | 11 | `AP Computer Science - A Exam` (3) · `AP Computer Science A` (3) · `AP Exam Computer Science A (Score 3-5)` (3) |
| **AP Comparative Government and Politics** / College Board / Standardized Assessment / Local | 10 | 20 | 16 | `AP Comparative Government and Politics` (4) · `AP Exam Comparative Government and Politics (Score 3-5)` (4) · `AP Exam: Comparative Government & Politics` (3) |
| **AP Japanese Language and Culture** / College Board / Standardized Assessment / Local | 10 | 20 | 13 | `AP Japanese Language and Culture` (4) · `AP Japanese - Language & Culture` (3) · `AP Japanese Language and Culture (Score of 4 or 5)` (2) |
| **AP Statistics** / College Board / Standardized Assessment / Local | 10 | 102 | 81 | `AP Statistics (score 3-5): Cal-GETC Area 2` (78) · `AP Statistics` (6) · `AP Exam Statistics` (5) |
| **AP Human Geography** / College Board / Standardized Assessment / Local | 9 | 102 | 82 | `AP Human Geography (score 3-5): Cal-GETC Area 4` (78) · `AP Human Geography` (7) · `AP Exam Human Geography (Score 3-5)` (4) |
| **AP Italian Language and Culture** / College Board / Standardized Assessment / Local | 9 | 19 | 11 | `AP Italian Language and Culture` (4) · `AP Italian - Language & Culture` (3) · `AP - Italian Language & Culture` (3) |
| **AP Physics 2** / College Board / Standardized Assessment / Local | 9 | 172 | 81 | `AP Physics 2: Algebra-Based (score 3-5): Cal-GETC Area 5A and 5C` (156) · `AP Exam: Physics 2` (7) · `AP Physics 2: Algebra-Based` (2) |
| **AP Precalculus** / College Board / Standardized Assessment / Local | 9 | 15 | 11 | `AP Precalculus (Score of 3-5)` (4) · `AP Precalculus` (3) · `AP Exam Precalculus (Score 3-5)` (2) |
| **CLEP Western Civilization I** / College Board / Standardized Assessment / Local | 9 | 13 | 9 | `CLEP Western Civilization I` (4) · `CLEP Exam Western Civilization I (Score of 50 or higher)` (2) · `CLEP Exam: Western Civilization I: Ancient Near East to 1648` (1) |
| **AP Computer Science Principles** / College Board / Standardized Assessment / Local | 8 | 14 | 11 | `AP Computer Science - Principles` (3) · `AP Exam Computer Science Principles (Score 3-5)` (3) · `AP: Computer Science Principles` (2) |
| **AP Music Theory** / College Board / Standardized Assessment / Local | 8 | 20 | 17 | `AP Music Theory` (9) · `AP Exam: Music Theory (Score of 4 or 5)` (3) · `AP Exam Music Theory (Score 3-5)` (2) |
| **AP Physics 1** / College Board / Standardized Assessment / Local | 8 | 170 | 81 | `AP Physics 1: Algebra-Based (score 3-5): Cal-GETC Area 5A and 5C` (156) · `AP Exam: Physics 1` (6) · `AP Physics 1: Algebra-Based` (2) |
| **IB Geography HL** / International Baccalaureate Organization (IBO) / Standardized Assessment / Local | 8 | 88 | 81 | `IB Geography HL (score 5-7): Cal-GETC Area 4` (78) · `IB Exam Geography HL` (3) · `IB Geography HL` (2) |
| **Paramedic License** / California Emergency Medical Services Authority (EMSA) / Industry Certification / Local | 8 | 72 | 9 | `Paramedic NCTI (EMS-60/91)` (12) · `California Paramedic License` (12) · `Paramedic Certificate` (12) |
| **IB Chemistry HL** / International Baccalaureate Organization (IBO) / Standardized Assessment / Local | 7 | 90 | 81 | `IB Chemistry HL (score 5-7): Cal-GETC Area 5A` (78) · `IB Exam Chemistry HL` (3) · `IB Chemistry HL` (3) |
| **ASE A6 — Electrical/Electronic Systems** / National Institute for Automotive Service Excellence (ASE) / Industry Certification / Local | 6 | 10 | 8 | `ASE CERTIFICATION (A6) A6 – ELECTRICAL/ELECTRONIC SYSTEMS` (4) · `Basic Electricity and Electrical Systems Fundamentals ASE A6` (2) · `ASE Certifications: A6 + Residency Units` (1) |
| **Generic Credit by Exam — San Bernardino Valley College Culinary** / (null issuer) / Credit By Exam / Local | 6 | 6 | 1 | `CULART010` (1) · `CULART 011 CBE` (1) · `CULART 044 CBE` (1) |
| **CLEP Analyzing and Interpreting Literature** / College Board / Standardized Assessment / Local | 6 | 11 | 9 | `CLEP Analyzing and Interpreting Literature` (5) · `CLEP Exam: Analyzing and Interpreting Literature` (2) · `CLEP Analyzing & Interpreting Literature` (1) |
| **CLEP Introductory Psychology** / College Board / Standardized Assessment / Local | 6 | 9 | 9 | `CLEP Introductory to Psychology` (3) · `CLEP Introductory Psychology` (2) · `CLEP Exam: Introductory Psychology` (1) |
| **CLEP Introductory Sociology** / College Board / Standardized Assessment / Local | 6 | 11 | 11 | `CLEP Introductory to Sociology` (3) · `CLEP Exam: Introductory Sociology` (3) · `CLEP Introductory Sociology` (2) |
| **IB Biology HL** / International Baccalaureate Organization (IBO) / Standardized Assessment / Local | 6 | 90 | 81 | `IB Biology HL (score 5-7): Cal-GETC Area 5B` (78) · `IB Exam Biology HL` (6) · `IB Biology HL` (3) |
| **IB Economics HL** / International Baccalaureate Organization (IBO) / Standardized Assessment / Local | 6 | 90 | 81 | `IB Economics HL (score 5-7): Cal-GETC Area 4` (78) · `IB Exam Economics HL` (6) · `IB Economics HL` (3) |
| **IB Psychology HL** / International Baccalaureate (IB) / Standardized Assessment / Local | 6 | 89 | 81 | `IB Psychology HL (score 5-7): Cal-GETC Area 4` (78) · `IB Exam Psychology HL` (3) · `IB Psychology HL` (3) |

## Re-classification backlog

- Raw titles in current MAP with no `unified_titles.json` entry: **0**
- Rows affected: **0**

Full list in `unclassified.json`. These keep raw-title grouping in PR-C1 so
coverage is preserved; running `kb/classify_exhibits.py` against this set is
the natural follow-up (see Session 7 handoff §2).

## PR-D flag-key migration plan

PR-D's `_EACR_FLAG::<exhibit_id || title>` rows in Supabase need to be re-keyed
when the EACR cards change identity. `alias_map.json` carries the mapping:

- old EACR cards: **3,345**
  - unchanged (same merged_id post-pivot): **2,041**
  - folded into a larger card (new merged_id): **1,304**
- new cards receiving 2+ old flag namespaces (potential conflict if both flagged differently): **310**

`alias_map.json` provides two lookup tables:

- `by_merged_id` — old `'|'-joined sorted exhibit ids` → new merged_id
- `by_title` — old raw title → new merged_id (PR-D's fallback key)

Migration step (executed during PR-C2 land, atomic within one cron window):

1. Pull all `_EACR_FLAG::*` rows from Supabase `kb_curation`.
2. For each, look up the new key in `alias_map.json`.
3. If 2+ old rows map to the same new card with different flag values, halt and
   surface for curator decision (per re-mint playbook).
4. Write new rows; delete old. Atomic.

## Decisions encoded in this dry-run

1. Grouping key: `(unified_title, issuing_agency, CPL Type, Collaborative Type)`
2. Multi-issuer per unified_title → separate cards (vision §6.1)
3. Issuer pick per raw row: highest-`confidence_issuer` from `credentials.json[unified_title]`
4. Sector + discipline: modal across raw rows (PR-C1 will encode this)
5. Raw titles missing from `unified_titles.json`: keep raw-title grouping (preserves coverage)
6. PR-D flag migration: alias-map re-key, atomic at PR-C2 land

## What's NOT in the dry-run (PR-C1+ scope)

- The new `statewide_data.js` schema (`raw_titles[]`, `confidence_*`, `quality_flag`, …)
- The `statewide_interactive.js` 'also entered as…' disclosure
- Issuing-agency filter typeahead
- Visual confidence badge (threshold TBD, vision §6.2 suggests 0.75)
- Live Supabase query of `_EACR_FLAG::*` (the alias map is precomputed; the
  actual migration runs at PR-C2 land with a Supabase fresh-read)
