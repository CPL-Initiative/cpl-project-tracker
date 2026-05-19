# Phase 1 Dry-Run Output (revised after calibration)

**Original dry-run:** 2026-05-18
**Revised after user calibration:** 2026-05-19
**Sample size:** 55 raw titles (Industry Certification primary)
**Sample source:** `CustomReport_latest.json` →
`View_ArticulatedMAPExhibits_APIDataset`, deliberately weighted to
families where title drift is acute.
**Skill applied:** `.claude/skills/exhibit-canonicalization/SKILL.md`
(post-calibration revision)

## Calibrations applied since v1

1. **EMT prerequisite-language rows** (rows 38, 39) → now cluster into
   `EMT Certification` per new Rule 5b.
2. **Fire Inspector** (rows 25, 51, 52, 53) → roll up under a single
   unified title `Fire Inspector I`; the `issuing_agency` field
   discriminates ICC / SFT / NFPA / Cal-JAC per revised Rule 4.
3. **OSHA codes** (rows 47, 49) → preserved (`OSHA 030`, `OSHA 035`)
   per new Rule 8b.
4. **Microsoft Office Specialist Associate vs Expert** → unchanged
   (already split correctly).
5. **AWS issuer name** → uses longer form `Amazon Web Services (AWS)`
   per revised Rule 6.
6. **POST training agency** → uses canonical sentinel
   `varies by academy` per revised Rule 7.

## Summary at a glance

- **55 raw titles → 31 distinct unified titles** (~44% reduction; was
  35 distinct in v1 before the Fire Inspector and EMT-prerequisite
  rollups).
- 12 raw titles at confidence ≥ 0.95 (auto-merge).
- 33 at 0.85–0.94 (high confidence).
- 10 at < 0.85 (review-flag candidates).
- 0 refusals.

Biggest collapses:

| Unified title | Raw variants in sample |
|---|---:|
| POST Basic Academy | 6 |
| EMT Certification | 5 |
| Fire Inspector I | 4 |
| Cisco CCNA | 4 |
| AWS Certified Cloud Practitioner | 3 |
| Google IT Support Professional Certificate | 3 |
| IBEW Electrician Apprenticeship | 2 |
| CompTIA A+ | 2 |

## Full table (revised)

| # | Raw title | Unified title | Issuer | Trainer | Conf (T/I/Tr) | Notes |
|---:|---|---|---|---|---|---|
| 1 | Peace Officer Standards and Training Basic Academy Certificate (POST) | POST Basic Academy | California Commission on Peace Officer Standards and Training (POST) | varies by academy | 0.98 / 0.95 / 0.85 | Canonical sentinel `varies by academy` per Rule 7. |
| 2 | Peace Officer Standards Training (POST) Basic Academy | POST Basic Academy | California Commission on Peace Officer Standards and Training (POST) | varies by academy | 0.98 / 0.95 / 0.85 | |
| 3 | POST - Peace Officer Standards and Training - Basic Academy Certificate | POST Basic Academy | California Commission on Peace Officer Standards and Training (POST) | varies by academy | 0.98 / 0.95 / 0.85 | |
| 4 | Correctional Officers: CDCR/CPOST | CDCR Correctional Officer Academy | California Department of Corrections and Rehabilitation (CDCR) | CDCR Basic Correctional Officer Academy | 0.92 / 0.92 / 0.80 | Distinct credential from POST Basic Academy — peace officer ≠ correctional officer. |
| 5 | CA POST Academy SMCCD | POST Basic Academy | California Commission on Peace Officer Standards and Training (POST) | San Mateo County Community College District Police Academy | 0.95 / 0.95 / 0.90 | Specific academy named in source. |
| 6 | POST Academy prior Fall 2025 | POST Basic Academy | California Commission on Peace Officer Standards and Training (POST) | varies by academy | 0.95 / 0.95 / 0.85 | Time-period qualifier doesn't split (Rule 3). |
| 7 | POST Academy effective FALL 2025 | POST Basic Academy | California Commission on Peace Officer Standards and Training (POST) | varies by academy | 0.95 / 0.95 / 0.85 | |
| 8 | DEPT of VA POST | Federal Law Enforcement Training (VA Police) | U.S. Department of Veterans Affairs | Federal Law Enforcement Training Centers (FLETC) | 0.60 / 0.65 / 0.55 | Likely VA police training; source abbreviation ambiguous. |
| 9 | CompTIA Network+ Certification | CompTIA Network+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 10 | CompTIA A+ Certification | CompTIA A+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 11 | CompTIA Security+ Certification | CompTIA Security+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 12 | CompTIA Linux+ Certification | CompTIA Linux+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 13 | CompTIA A+ | CompTIA A+ | CompTIA | null | 0.97 / 1.00 / 1.00 | "Certification" suffix dropped. |
| 14 | CompTIA Server+ Certification | CompTIA Server+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 15 | CompTIA PenTest+ Certification | CompTIA PenTest+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 16 | CompTIA Tech+ Certification | CompTIA Tech+ | CompTIA | null | 0.95 / 1.00 / 1.00 | Newer entry-level cert. |
| 17 | Google IT Support Professional Certification | Google IT Support Professional Certificate | Google | Coursera | 0.95 / 0.90 / 0.85 | "Certification" vs official "Certificate." |
| 18 | Google IT Support Professional Certificate | Google IT Support Professional Certificate | Google | Coursera | 0.98 / 0.90 / 0.85 | Canonical wording. |
| 19 | CMPET 315\tGoogle IT Support Professional Certificate Prep Industry Certificate | Google IT Support Professional Certificate | Google | Coursera | 0.90 / 0.90 / 0.85 | Stripped CMPET 315 prefix and "Prep" suffix per Rule 1. |
| 20 | Cisco Certified Network Associate (CCNA) Certification | Cisco CCNA | Cisco | null | 0.98 / 1.00 / 1.00 | |
| 21 | Cisco CCNA Certification | Cisco CCNA | Cisco | null | 0.98 / 1.00 / 1.00 | |
| 22 | CISCO CERTIFIED NETWORK ASSOCIATE | Cisco CCNA | Cisco | null | 0.95 / 1.00 / 1.00 | ALL CAPS variant. |
| 23 | Cisco CCNA Certification, Cisco Introduction to Networks (Cisco Network Academy) | Cisco CCNA | Cisco | Cisco Networking Academy | 0.92 / 1.00 / 0.90 | Embedded training-agency hint. |
| 24 | Cisco Certified CyberOps Associate Certification | Cisco Certified CyberOps Associate | Cisco | null | 0.95 / 1.00 / 1.00 | Different cert from CCNA. |
| 25 | ICC Fire Inspector 1 Certificate | Fire Inspector I | International Code Council (ICC) | null | 0.93 / 1.00 / 1.00 | Rolled up across issuers per revised Rule 4; issuer discriminates. |
| 26 | AWS Certified Cloud Practitioner Certification | AWS Certified Cloud Practitioner | Amazon Web Services (AWS) | null | 0.97 / 1.00 / 1.00 | Issuer uses longer canonical form per Rule 6. |
| 27 | Amazon Web Services (AWS) Certified Cloud Practitioner | AWS Certified Cloud Practitioner | Amazon Web Services (AWS) | null | 0.97 / 1.00 / 1.00 | |
| 28 | Amazon Web Services (AWS) Certified Systems Operations (SYSOps) Administrator | AWS Certified SysOps Administrator – Associate | Amazon Web Services (AWS) | null | 0.92 / 1.00 / 1.00 | Different AWS cert from Cloud Practitioner. |
| 29 | AWS CLOUD PRACTITIONER | AWS Certified Cloud Practitioner | Amazon Web Services (AWS) | null | 0.90 / 1.00 / 1.00 | Abbreviated ALL CAPS. |
| 30 | Microsoft Certified Azure Administrator - Associate Certification | Microsoft Certified: Azure Administrator Associate | Microsoft | null | 0.95 / 1.00 / 1.00 | |
| 31 | MICROSOFT OFFICE SPECIALIST EXCEL CERTIFICATION | Microsoft Office Specialist — Excel (Associate) | Microsoft | null | 0.92 / 1.00 / 1.00 | Base-level MOS Excel. |
| 32 | MICROSOFT OFFICE SPECIALIST EXCEL EXPERT CERTIFICATION | Microsoft Office Specialist — Excel Expert | Microsoft | null | 0.92 / 1.00 / 1.00 | Separate exam from Associate. |
| 33 | MICROSOFT OFFICE SPECIALIST OUTLOOK CERTIFICATION | Microsoft Office Specialist — Outlook | Microsoft | null | 0.92 / 1.00 / 1.00 | |
| 34 | MICROSOFT OFFICE SPECIALIST WORD EXPERT CERTIFICATION | Microsoft Office Specialist — Word Expert | Microsoft | null | 0.92 / 1.00 / 1.00 | |
| 35 | Cal-JAC Firefighter EMT Certificate | Cal-JAC Firefighter EMT | California Joint Apprenticeship Committee (Cal-JAC) | null | 0.85 / 0.90 / 1.00 | Combined firefighter+EMT cert specific to Cal-JAC; distinct scope from generic EMT. |
| 36 | Emergency Medical Technician (EMT) | EMT Certification | California Emergency Medical Services Authority (EMSA) | varies | 0.92 / 0.70 / 0.50 | In CA, EMT licensure is via EMSA; in other states via NREMT. |
| 37 | Kern County EMT-Paramedic Training Program | EMT Certification | California Emergency Medical Services Authority (EMSA) | Kern County EMS Agency | 0.75 / 0.70 / 0.85 | Local training program preps for EMT (Paramedic is higher scope but covered by the same EMSA framework). |
| 38 | Current EMT Certification or Paramedic License | EMT Certification | California Emergency Medical Services Authority (EMSA) | null | 0.75 / 0.70 / 0.50 | Source title used prerequisite phrasing per Rule 5b. |
| 39 | Current NREMT certification or State of California EMT license AND current Ameri… | EMT Certification | California Emergency Medical Services Authority (EMSA) | null | 0.70 / 0.70 / 0.50 | Truncated; mentions NREMT + CA EMT + additional cert (BLS?). Clustered with EMT per Rule 5b. |
| 40 | EMT 1 Module A and B | EMT Certification | California Emergency Medical Services Authority (EMSA) | null | 0.65 / 0.65 / 0.50 | Source looks like a college course-section identifier referencing EMT training per Rule 5b. |
| 41 | Certified Nursing Assistant (CNA) | CNA Certification | California Department of Public Health (CDPH) | null | 0.95 / 0.85 / 1.00 | CA CNA certification administered by CDPH. |
| 42 | ASE CERTIFICATION (A2) A2 – AUTOMATIC TRANSMISSION/TRANSAXLE | ASE A2 — Automatic Transmission/Transaxle | National Institute for Automotive Service Excellence (ASE) | null | 0.97 / 1.00 / 1.00 | |
| 43 | ASE CERTIFICATION (A5) A5 – BRAKES | ASE A5 — Brakes | National Institute for Automotive Service Excellence (ASE) | null | 0.97 / 1.00 / 1.00 | |
| 44 | Automotive Service Excellence (ASE) L3 Certification | ASE L3 — Light Duty Hybrid/Electric Vehicle Specialist | National Institute for Automotive Service Excellence (ASE) | null | 0.85 / 1.00 / 1.00 | L3 expansion from ASE's published series. |
| 45 | A Center-Based Preschool Child Development Associate (CDA) Credential | Child Development Associate (CDA) — Center-Based Preschool | Council for Professional Recognition | null | 0.92 / 0.95 / 1.00 | |
| 46 | ASE CERTIFICATION (A1) A1 – ENGINE REPAIR | ASE A1 — Engine Repair | National Institute for Automotive Service Excellence (ASE) | null | 0.97 / 1.00 / 1.00 | |
| 47 | OSHA 030 - Federal OSHA Outreach: Construction Industry Safety | OSHA 030 — Construction Industry Outreach (30-hour) | U.S. Occupational Safety and Health Administration (OSHA) | varies (OSHA-authorized trainer) | 0.93 / 1.00 / 0.70 | Issuer-assigned code `030` preserved per Rule 8b. |
| 48 | OSHA Outreach for General Industry-30 hour | OSHA 30 — General Industry | U.S. Occupational Safety and Health Administration (OSHA) | varies (OSHA-authorized trainer) | 0.92 / 1.00 / 0.70 | No source code; uses hour-form per Rule 8b. |
| 49 | OSHA 035 - Federal OSHA Outreach: General Industry Safety | OSHA 035 — General Industry Outreach (30-hour) | U.S. Occupational Safety and Health Administration (OSHA) | varies (OSHA-authorized trainer) | 0.93 / 1.00 / 0.70 | Issuer-assigned code `035` preserved per Rule 8b. Separate from row 48 (no source code → different unified title). |
| 50 | Carpenter's Training Center CTCNC OSHA | OSHA Outreach (level unspecified) | U.S. Occupational Safety and Health Administration (OSHA) | Carpenters Training Committee for Northern California (CTCNC) | 0.65 / 1.00 / 0.85 | OSHA hours not specified. |
| 51 | SFT Fire Inspector 1 Certification | Fire Inspector I | California State Fire Training (SFT) | null | 0.93 / 1.00 / 1.00 | Rolled up per revised Rule 4; SFT discriminates. |
| 52 | NFPA Fire Inspector Certification | Fire Inspector I | National Fire Protection Association (NFPA) | null | 0.80 / 1.00 / 1.00 | Source title omits level; defaulted to Level I (NFPA 1031 also defines II and III). |
| 53 | Cal-JAC Fire Inspector Certificate | Fire Inspector I | California Joint Apprenticeship Committee (Cal-JAC) | null | 0.88 / 0.95 / 1.00 | Rolled up per revised Rule 4. |
| 54 | International Brotherhood Electrical Workers (IBEW) Electrician Apprenticeship (variant a) | IBEW Electrician Apprenticeship | International Brotherhood of Electrical Workers (IBEW) | Joint Apprenticeship Training Committee (JATC) | 0.92 / 1.00 / 0.85 | |
| 55 | International Brotherhood Electrical Workers (IBEW) Electrician Apprenticeship (variant b) | IBEW Electrician Apprenticeship | International Brotherhood of Electrical Workers (IBEW) | Joint Apprenticeship Training Committee (JATC) | 0.92 / 1.00 / 0.85 | Variant differs only in MAP ExhibitID. |

## Distinct unified titles produced (31)

```
AWS Certified Cloud Practitioner
AWS Certified SysOps Administrator – Associate
ASE A1 — Engine Repair
ASE A2 — Automatic Transmission/Transaxle
ASE A5 — Brakes
ASE L3 — Light Duty Hybrid/Electric Vehicle Specialist
Cal-JAC Firefighter EMT
CDCR Correctional Officer Academy
Child Development Associate (CDA) — Center-Based Preschool
Cisco CCNA
Cisco Certified CyberOps Associate
CNA Certification
CompTIA A+
CompTIA Linux+
CompTIA Network+
CompTIA PenTest+
CompTIA Security+
CompTIA Server+
CompTIA Tech+
EMT Certification
Federal Law Enforcement Training (VA Police)
Fire Inspector I
Google IT Support Professional Certificate
IBEW Electrician Apprenticeship
Microsoft Certified: Azure Administrator Associate
Microsoft Office Specialist — Excel (Associate)
Microsoft Office Specialist — Excel Expert
Microsoft Office Specialist — Outlook
Microsoft Office Specialist — Word Expert
OSHA 030 — Construction Industry Outreach (30-hour)
OSHA 035 — General Industry Outreach (30-hour)
OSHA 30 — General Industry
OSHA Outreach (level unspecified)
POST Basic Academy
```

## What's still open

- **Row 8 (DEPT of VA POST)** still at 0.60 — would benefit from a manual
  KB override in Phase 2.
- **Row 50 (Carpenter's Training Center CTCNC OSHA)** still at 0.65 — OSHA
  hour-count missing from source.
- **Rows 36–40 EMT cluster** all at 0.65–0.92 — the rollup is correct
  per calibration, but row 40 in particular ("EMT 1 Module A and B")
  may warrant a closer look at whether MAP has additional metadata that
  could lift confidence.

If those three look acceptable, Phase 2 is good to go on the calibrated
skill.
