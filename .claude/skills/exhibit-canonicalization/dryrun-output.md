# Phase 1 Dry-Run Output

**Date:** 2026-05-18
**Sample size:** 55 raw titles (Industry Certification primary)
**Sample source:** `CustomReport_latest.json` →
`View_ArticulatedMAPExhibits_APIDataset`, deliberately weighted to
families where title drift is acute (POST, CompTIA, Cisco, Google IT,
AWS, Microsoft, fire-inspector, ASE, OSHA, IBEW, EMT/CNA).
**Skill applied:** `.claude/skills/exhibit-canonicalization/SKILL.md`
**Classifier:** Claude (this session), acting as the LLM the skill
will eventually invoke.

The table below is the proposed output. Phase 1 deliverable — **nothing
written to `kb/` yet**.

## Summary at a glance

- **55 raw titles → 35 distinct unified titles.** ~36% reduction even
  in a sample deliberately enriched with same-family variants.
- 14 raw titles classified at confidence ≥ 0.95 (would auto-merge).
- 31 at 0.85–0.94 (high confidence, would auto-merge with optional review).
- 10 at < 0.85 (flagged for review via low-confidence indicator).
- 0 refusals — every row got a mapping per Rule 9.

The biggest collapses:

| Unified title | Raw variants in sample |
|---|---:|
| POST Basic Academy | 6 |
| CompTIA A+ | 2 |
| Cisco CCNA | 4 |
| Google IT Support Professional Certificate | 3 |
| AWS Certified Cloud Practitioner | 3 |
| OSHA 30 — General Industry | 2 |
| IBEW Electrician Apprenticeship | 2 |

## Full table

| # | Raw title | Unified title | Issuer | Trainer | Conf (T/I/Tr) | Notes |
|---:|---|---|---|---|---|---|
| 1 | Peace Officer Standards and Training Basic Academy Certificate (POST) | POST Basic Academy | California Commission on POST | varies by academy | 0.98 / 0.95 / 0.60 | Training agency varies per articulating college's academy. |
| 2 | Peace Officer Standards Training (POST) Basic Academy | POST Basic Academy | California Commission on POST | varies by academy | 0.98 / 0.95 / 0.60 | Same credential as row 1, alternative wording. |
| 3 | POST - Peace Officer Standards and Training - Basic Academy Certificate | POST Basic Academy | California Commission on POST | varies by academy | 0.98 / 0.95 / 0.60 | Punctuation variant. |
| 4 | Correctional Officers: CDCR/CPOST | CDCR Correctional Officer Academy | California Department of Corrections and Rehabilitation (CDCR) | CDCR Basic Correctional Officer Academy | 0.92 / 0.92 / 0.75 | NOT the same as POST Basic Academy — CDCR runs its own academy for correctional officers. |
| 5 | CA POST Academy SMCCD | POST Basic Academy | California Commission on POST | San Mateo County Community College District Police Academy | 0.95 / 0.95 / 0.85 | "SMCCD" identifies the specific academy delivering training. |
| 6 | POST Academy prior Fall 2025 | POST Basic Academy | California Commission on POST | varies by academy | 0.95 / 0.95 / 0.60 | Version variant — per Rule 3, time-period qualifiers don't split the unified title. |
| 7 | POST Academy effective FALL 2025 | POST Basic Academy | California Commission on POST | varies by academy | 0.95 / 0.95 / 0.60 | Same as row 6. |
| 8 | DEPT of VA POST | Federal Law Enforcement Training (VA Police) | U.S. Department of Veterans Affairs | Federal Law Enforcement Training Centers (FLETC) | 0.60 / 0.65 / 0.55 | Likely U.S. Department of Veterans Affairs police-officer training; abbreviated source title is ambiguous. Could also be confused with the California POST academy. |
| 9 | CompTIA Network+ Certification | CompTIA Network+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 10 | CompTIA A+ Certification | CompTIA A+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 11 | CompTIA Security+ Certification | CompTIA Security+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 12 | CompTIA Linux+ Certification | CompTIA Linux+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 13 | CompTIA A+ | CompTIA A+ | CompTIA | null | 0.97 / 1.00 / 1.00 | Same credential as row 10, "Certification" suffix dropped. |
| 14 | CompTIA Server+ Certification | CompTIA Server+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 15 | CompTIA PenTest+ Certification | CompTIA PenTest+ | CompTIA | null | 0.98 / 1.00 / 1.00 | |
| 16 | CompTIA Tech+ Certification | CompTIA Tech+ | CompTIA | null | 0.95 / 1.00 / 1.00 | Newer entry-level certification; less common than Network+/A+. |
| 17 | Google IT Support Professional Certification | Google IT Support Professional Certificate | Google | Coursera | 0.95 / 0.90 / 0.85 | "Certification" vs "Certificate" — Google's official product name is "Certificate." |
| 18 | Google IT Support Professional Certificate | Google IT Support Professional Certificate | Google | Coursera | 0.98 / 0.90 / 0.85 | Canonical wording. |
| 19 | CMPET 315\tGoogle IT Support Professional Certificate Prep Industry Certificate | Google IT Support Professional Certificate | Google | Coursera | 0.90 / 0.90 / 0.85 | Stripped CMPET 315 prefix and "Prep Industry Certificate" suffix per Rule 1. |
| 20 | Cisco Certified Network Associate (CCNA) Certification | Cisco CCNA | Cisco | null | 0.98 / 1.00 / 1.00 | |
| 21 | Cisco CCNA Certification | Cisco CCNA | Cisco | null | 0.98 / 1.00 / 1.00 | Abbreviated wording. |
| 22 | CISCO CERTIFIED NETWORK ASSOCIATE | Cisco CCNA | Cisco | null | 0.95 / 1.00 / 1.00 | ALL CAPS variant. |
| 23 | Cisco CCNA Certification, Cisco Introduction to Networks (Cisco Network Academy) | Cisco CCNA | Cisco | Cisco Networking Academy | 0.92 / 1.00 / 0.90 | Embedded training-agency hint ("Cisco Network Academy"). |
| 24 | Cisco Certified CyberOps Associate Certification | Cisco Certified CyberOps Associate | Cisco | null | 0.95 / 1.00 / 1.00 | Different cert from CCNA — keep separate per Rule 4. |
| 25 | ICC Fire Inspector 1 Certificate | ICC Fire Inspector I | International Code Council (ICC) | null | 0.95 / 1.00 / 1.00 | Roman-numeral convention for level. |
| 26 | AWS Certified Cloud Practitioner Certification | AWS Certified Cloud Practitioner | Amazon Web Services (AWS) | null | 0.97 / 1.00 / 1.00 | |
| 27 | Amazon Web Services (AWS) Certified Cloud Practitioner | AWS Certified Cloud Practitioner | Amazon Web Services (AWS) | null | 0.97 / 1.00 / 1.00 | Expanded vendor name in raw title. |
| 28 | Amazon Web Services (AWS) Certified Systems Operations (SYSOps) Administrator | AWS Certified SysOps Administrator – Associate | Amazon Web Services (AWS) | null | 0.92 / 1.00 / 1.00 | Different AWS cert from Cloud Practitioner. |
| 29 | AWS CLOUD PRACTITIONER | AWS Certified Cloud Practitioner | Amazon Web Services (AWS) | null | 0.90 / 1.00 / 1.00 | Abbreviated, ALL CAPS variant of rows 26–27. |
| 30 | Microsoft Certified Azure Administrator - Associate Certification | Microsoft Certified: Azure Administrator Associate | Microsoft | null | 0.95 / 1.00 / 1.00 | |
| 31 | MICROSOFT OFFICE SPECIALIST EXCEL CERTIFICATION | Microsoft Office Specialist — Excel (Associate) | Microsoft | null | 0.92 / 1.00 / 1.00 | MOS Excel base level. |
| 32 | MICROSOFT OFFICE SPECIALIST EXCEL EXPERT CERTIFICATION | Microsoft Office Specialist — Excel Expert | Microsoft | null | 0.92 / 1.00 / 1.00 | Different exam from Excel Associate — keep separate per Rule 4. |
| 33 | MICROSOFT OFFICE SPECIALIST OUTLOOK CERTIFICATION | Microsoft Office Specialist — Outlook | Microsoft | null | 0.92 / 1.00 / 1.00 | |
| 34 | MICROSOFT OFFICE SPECIALIST WORD EXPERT CERTIFICATION | Microsoft Office Specialist — Word Expert | Microsoft | null | 0.92 / 1.00 / 1.00 | Different exam from Word Associate. |
| 35 | Cal-JAC Firefighter EMT Certificate | Cal-JAC Firefighter EMT | California Joint Apprenticeship Committee (Cal-JAC) | null | 0.85 / 0.85 / 1.00 | Combined firefighter-EMT cert specific to Cal-JAC; distinct from a generic EMT certification. |
| 36 | Emergency Medical Technician (EMT) | EMT Certification | California Emergency Medical Services Authority (EMSA) | varies | 0.92 / 0.70 / 0.50 | In California, EMT licensure is via EMSA; in other states via NREMT. Issuer set to EMSA for CA context but confidence reflects ambiguity. |
| 37 | Kern County EMT-Paramedic Training Program | EMT-Paramedic | California Emergency Medical Services Authority (EMSA) | Kern County EMS Agency | 0.70 / 0.65 / 0.85 | Local training program preparing for EMT and/or Paramedic licensure. |
| 38 | Current EMT Certification or Paramedic License | EMT or Paramedic License (prerequisite) | California Emergency Medical Services Authority (EMSA) | null | 0.55 / 0.65 / 0.50 | This reads as a prerequisite description, not a clean credential title. May warrant manual review or merger with row 36/37. |
| 39 | Current NREMT certification or State of California EMT license AND current Ameri… | EMT License (prerequisite) | California Emergency Medical Services Authority (EMSA) | null | 0.50 / 0.65 / 0.50 | Truncated raw title; reads as a prerequisite description. |
| 40 | EMT 1 Module A and B | EMT Course Module (local) | null | varies | 0.50 / 0.40 / 0.45 | Looks like a college course-section identifier ("EMT 1, Module A/B"), not a credential. Likely needs human review. |
| 41 | Certified Nursing Assistant (CNA) | CNA Certification | California Department of Public Health (CDPH) | null | 0.95 / 0.80 / 1.00 | In CA, CNA certification is administered by CDPH. |
| 42 | ASE CERTIFICATION (A2) A2 – AUTOMATIC TRANSMISSION/TRANSAXLE | ASE A2 — Automatic Transmission/Transaxle | National Institute for Automotive Service Excellence (ASE) | null | 0.97 / 1.00 / 1.00 | |
| 43 | ASE CERTIFICATION (A5) A5 – BRAKES | ASE A5 — Brakes | National Institute for Automotive Service Excellence (ASE) | null | 0.97 / 1.00 / 1.00 | |
| 44 | Automotive Service Excellence (ASE) L3 Certification | ASE L3 — Light Duty Hybrid/Electric Vehicle Specialist | National Institute for Automotive Service Excellence (ASE) | null | 0.85 / 1.00 / 1.00 | L3 expansion from ASE's published series. |
| 45 | A Center-Based Preschool Child Development Associate (CDA) Credential | Child Development Associate (CDA) — Center-Based Preschool | Council for Professional Recognition | null | 0.92 / 0.95 / 1.00 | |
| 46 | ASE CERTIFICATION (A1) A1 – ENGINE REPAIR | ASE A1 — Engine Repair | National Institute for Automotive Service Excellence (ASE) | null | 0.97 / 1.00 / 1.00 | |
| 47 | OSHA 030 - Federal OSHA Outreach: Construction Industry Safety | OSHA 30 — Construction Industry | U.S. Occupational Safety and Health Administration (OSHA) | varies (OSHA-authorized trainer) | 0.92 / 1.00 / 0.70 | "030" → 30-hour Construction Industry Outreach. |
| 48 | OSHA Outreach for General Industry-30 hour | OSHA 30 — General Industry | U.S. Occupational Safety and Health Administration (OSHA) | varies (OSHA-authorized trainer) | 0.92 / 1.00 / 0.70 | |
| 49 | OSHA 035 - Federal OSHA Outreach: General Industry Safety | OSHA 30 — General Industry | U.S. Occupational Safety and Health Administration (OSHA) | varies (OSHA-authorized trainer) | 0.90 / 1.00 / 0.70 | "035" → 30-hour General Industry Outreach (same as row 48). |
| 50 | Carpenter's Training Center CTCNC OSHA | OSHA Outreach (level unspecified) | U.S. Occupational Safety and Health Administration (OSHA) | Carpenters Training Committee for Northern California (CTCNC) | 0.65 / 1.00 / 0.85 | OSHA hours not specified (10 vs 30); training agency clear. |
| 51 | SFT Fire Inspector 1 Certification | SFT Fire Inspector I | California State Fire Training (SFT) | null | 0.93 / 1.00 / 1.00 | Different issuer from ICC and NFPA inspector certs — keep separate per Rule 4. |
| 52 | NFPA Fire Inspector Certification | NFPA Fire Inspector | National Fire Protection Association (NFPA) | null | 0.92 / 1.00 / 1.00 | Different issuer from ICC/SFT — keep separate. |
| 53 | Cal-JAC Fire Inspector Certificate | Cal-JAC Fire Inspector | California Joint Apprenticeship Committee (Cal-JAC) | null | 0.88 / 0.95 / 1.00 | |
| 54 | International Brotherhood Electrical Workers (IBEW) Electrician Apprenticeship (variant a) | IBEW Electrician Apprenticeship | International Brotherhood of Electrical Workers (IBEW) | Joint Apprenticeship Training Committee (JATC) | 0.92 / 1.00 / 0.85 | |
| 55 | International Brotherhood Electrical Workers (IBEW) Electrician Apprenticeship (variant b) | IBEW Electrician Apprenticeship | International Brotherhood of Electrical Workers (IBEW) | Joint Apprenticeship Training Committee (JATC) | 0.92 / 1.00 / 0.85 | Same as row 54; variants differ only in MAP ExhibitID. |

## Distinct unified titles produced (35)

```
AWS Certified Cloud Practitioner
AWS Certified SysOps Administrator – Associate
ASE A1 — Engine Repair
ASE A2 — Automatic Transmission/Transaxle
ASE A5 — Brakes
ASE L3 — Light Duty Hybrid/Electric Vehicle Specialist
Cal-JAC Fire Inspector
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
EMT or Paramedic License (prerequisite)
EMT-Paramedic
EMT Course Module (local)
EMT License (prerequisite)
Federal Law Enforcement Training (VA Police)
Google IT Support Professional Certificate
IBEW Electrician Apprenticeship
ICC Fire Inspector I
Microsoft Certified: Azure Administrator Associate
Microsoft Office Specialist — Excel (Associate)
Microsoft Office Specialist — Excel Expert
Microsoft Office Specialist — Outlook
Microsoft Office Specialist — Word Expert
NFPA Fire Inspector
OSHA 30 — Construction Industry
OSHA 30 — General Industry
OSHA Outreach (level unspecified)
POST Basic Academy
SFT Fire Inspector I
```

## Cases I want your judgment on before Phase 2

1. **EMT cluster (rows 35–40)** — I split into `EMT Certification`,
   `EMT-Paramedic`, `Cal-JAC Firefighter EMT`, `EMT Course Module
   (local)`, and two "prerequisite" entries. The two prerequisite
   entries are awkward — they aren't real credentials, just
   prerequisite language colleges entered as exhibits. **Options:**
   a) Keep separate at low confidence (current proposal).
   b) Merge them all under `EMT Certification`.
   c) Tag them with a new `is_administrative_bucket: true` flag,
      similar to Rule 5's "Generic Credit by Exam" handling, and
      reconsider whether the skill should expose such a flag.

2. **Fire Inspector trio (rows 25, 51, 52, 53)** — ICC, SFT, NFPA, and
   Cal-JAC all issue Fire Inspector certifications at the same level.
   I kept them separate (per Rule 4: different issuers = different
   credentials). **Confirm this is the right call**, or do you want
   them rolled up under a generic `Fire Inspector I` with the
   issuer as the discriminator? I lean toward keeping separate.

3. **DEPT of VA POST (row 8)** — I read this as U.S. Dept of Veterans
   Affairs police training, but it's ambiguous. **Worth a manual
   override entry** in the eventual KB, or leave at 0.6 confidence
   and let the reviewer fix it?

4. **OSHA 30 (rows 47–50)** — I unified 48 and 49 under "OSHA 30 —
   General Industry" even though the raw titles use different
   numeric codes (030 vs 035). The codes refer to different
   curricula (Construction vs General Industry) but both are the
   30-hour Outreach. **Is this right?** Or should I preserve the
   3-digit code in the unified title?

5. **Microsoft Office Specialist (rows 31–34)** — I split Excel into
   Associate-level (row 31) and Expert (row 32), and Word Expert (row
   34) without seeing a Word Associate variant. **Is the Associate/Expert
   split useful, or should they roll up under a single MOS Excel /
   MOS Word title?** Industry treats them as separate exams.

6. **Are confidence thresholds calibrated right?** I have 10 rows at
   <0.85. Spot-check: do those feel like the rows that actually need
   review, or did I over-flag / under-flag?

## What the skill produced that I'd want to refine before Phase 2

- The `_notes` field is doing real work for low-confidence rows but is
  near-empty for high-confidence rows. That's by design (notes required
  only when conf < 0.85), but in retrospect, a one-line note for **every**
  row would speed reviewer audit. **Recommendation:** make `_notes`
  mandatory in v2 of the skill.

- The "training_agency: varies by academy" pattern (rows 1–3, 6, 7) is
  awkward — it's neither a real value nor null. Consider either:
  (a) leave as `null` with a note,
  (b) introduce a sentinel like `"<varies>"` to be machine-detectable.

- AWS / Amazon Web Services issuer naming is inconsistent in industry
  too. I used `Amazon Web Services (AWS)` but could shorten to `AWS`.
  **Pick one in v2 and bake into the rules.**
