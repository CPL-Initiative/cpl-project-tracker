---
title: SUBJ4 Canonicalization Dry-Run — Phase 1e
date: 2026-06-12
session: 5b (Bruh Quad)
status: DRY-RUN — no kb files mutated, no Supabase writes
tags: [remint, dry-run, phase-1e, subj4-canonicalization, m-id]
artifacts:
  - kb/subj4_dryrun/alias_map.json
  - kb/subj4_dryrun/collisions.json
  - kb/subj4_dryrun/blocked.json
---

# SUBJ4 Canonicalization Dry-Run — Phase 1e

## TL;DR

- Canonical map: **148 / 148** disciplines reviewed; **0** still need a 4-letter canonical SUBJ4.
- M-IDs total: **71710** (corroborated catalog: 15554, singletons: 56156)
  - **10974** would re-key to new SUBJ4 (minted 2254, singletons 8720)
  - **60063** already on canonical SUBJ4 (no change) (minted 13203, singletons 46860)
  - **0** blocked on missing canonical (minted 0, singletons 0)
  - 577 skipped (no discipline)
  - 1 skipped (discipline not in canonical map)
  - 95 skipped (umbrella-discipline row whose SUBJ4 is outside the umbrella's allowance — per-umbrella review, never auto-folded)
- Sequence-reallocation buckets: **517** new (SUBJ4, band, kind) buckets contain ≥2 old M-IDs.

## Apply gate (5c readiness)

**🟡 NOT READY for apply** — open items:
  - 19 bucket(s) contain ≥2 curated M-IDs — operator decision required

## Curation impact

`coci_curation.json` has **128** entries. Per-entry fate:

| old_id | fate | new_id | discipline | old → new SUBJ4 |
|---|---|---|---|---|
| `AGRI M1002` | no_change | `AGRI M1001` | Agriculture | AGRI → AGRI |
| `ARTS M10BJ` | no_change | `ARTS M10BJ` | Art | ARTS → ARTS |
| `ARTS M1159` | re_key | `ARTH M1022` | Art History | ARTS → ARTH |
| `ARTS M11AH` | no_change | `ARTS M11AH` | Art | ARTS → ARTS |
| `ARTS M1201` | skip_unknown_disc | `—` | Ceramic Technology | ARTS → — |
| `AUTB M1002` | no_change | `AUTB M1002` | Auto Body Technology | AUTB → AUTB |
| `AUTB M1003` | no_change | `AUTB M1003` | Auto Body Technology | AUTB → AUTB |
| `AUTB M1037` | no_change | `AUTB M1037` | Auto Body Technology | AUTB → AUTB |
| `AUTB M10BJ` | re_key | `AGRI M10AL` | Agriculture | AUTB → AGRI |
| `AUTB M10BN` | no_change | `AUTB M10BM` | Auto Body Technology | AUTB → AUTB |
| `AUTO M1005` | no_change | `AUTO M1004` | Automotive Technology | AUTO → AUTO |
| `AUTO M1006` | no_change | `AUTO M1005` | Automotive Technology | AUTO → AUTO |
| `AUTO M1007` | no_change | `AUTO M1006` | Automotive Technology | AUTO → AUTO |
| `AUTO M10AG` | no_change | `AUTO M10AF` | Automotive Technology | AUTO → AUTO |
| `AUTO M10BK` | no_change | `AUTO M10BJ` | Automotive Technology | AUTO → AUTO |
| `AUTO M10BL` | no_change | `AUTO M10BK` | Automotive Technology | AUTO → AUTO |
| `AUTO M10BT` | no_change | `AUTO M10BS` | Automotive Technology | AUTO → AUTO |
| `AUTO M10CX` | no_change | `AUTO M10CW` | Automotive Technology | AUTO → AUTO |
| `AUTO M10PB` | no_change | `AUTO M10OX` | Automotive Technology | AUTO → AUTO |
| `AUTO M11AA` | no_change | `AUTO M10ZP` | Automotive Technology | AUTO → AUTO |
| `AUTO M11CW` | no_change | `AUTO M11CL` | Automotive Technology | AUTO → AUTO |
| `AUTO M11DB` | no_change | `AUTO M11CQ` | Automotive Technology | AUTO → AUTO |
| `AUTO M11NQ` | no_change | `AUTO M11NF` | Automotive Technology | AUTO → AUTO |
| `AUTO M1217` | no_change | `AUTO M1211` | Automotive Technology | AUTO → AUTO |
| `BBK M1001` | re_key | `BUSI M1002` | Business | BBK → BUSI |
| `BBK M10AC` | re_key | `BUSI M11PA` | Business | BBK → BUSI |
| `BBK M9001` | re_key | `BUSI M9003` | Business | BBK → BUSI |
| `BSIC M9001` | re_key | `BSKL M9001` | Interdisciplinary-Basic Skills: Noncredit 53412 | BSIC → BSKL |
| `BUAC M10AE` | re_key | `BUSI M11BL` | Business | BUAC → BUSI |
| `BUSA M1003` | re_key | `BUSI M1300` | Business | BUSA → BUSI |
| `BUSA M10AF` | re_key | `BUSI M10ZQ` | Business | BUSA → BUSI |
| `BUSA M10AJ` | re_key | `BUSI M10MO` | Business | BUSA → BUSI |
| `BUSA M9003` | re_key | `BUSI M9058` | Business | BUSA → BUSI |
| `BUSI M1170` | no_change | `BUSI M1167` | Business | BUSI → BUSI |
| `CISC M12GG` | re_key | `BUSI M11CM` | Business | CISC → BUSI |
| `CISC M9029` | re_key | `BUSI M9038` | Business | CISC → BUSI |
| `CISC M9030` | re_key | `BUSI M9039` | Business | CISC → BUSI |
| `CISC M90AQ` | re_key | `BUSI M90BV` | Business | CISC → BUSI |
| `COUN M1045` | no_change | `COUN M1038` | Counseling | COUN → COUN |
| `COUN M10JJ` | no_change | `COUN M10JI` | Counseling | COUN → COUN |
| `COUN M10JK` | no_change | `COUN M10JJ` | Counseling | COUN → COUN |
| `CULN M1003` | no_change | `CULN M1002` | Culinary Arts/Food Technology | CULN → CULN |
| `CULN M90AE` | no_change | `CULN M90AE` | Culinary Arts/Food Technology | CULN → CULN |
| `DRAF M1002` | no_change | `DRAF M1002` | Drafting/CADD | DRAF → DRAF |
| `ELEC M1028` | no_change | `ELEC M1016` | Electricity | ELEC → ELEC |
| `ENGL M10WP` | no_change | `ENGL M10WM` | English | ENGL → ENGL |
| `ENGL M10YQ` | no_change | `ENGL M10YN` | English | ENGL → ENGL |
| `ENGL M11HY` | no_change | `ENGL M11HU` | English | ENGL → ENGL |
| `ENGL M11HZ` | no_change | `ENGL M11HV` | English | ENGL → ENGL |
| `ENGL M1217` | no_change | `ENGL M1197` | English | ENGL → ENGL |
| `ENGL M1367` | no_change | `ENGL M1330` | English | ENGL → ENGL |
| `ENTR M1001` | no_change | `ENTR M1001` | Small Business Development | ENTR → ENTR |
| `ENTR M10BZ` | no_change | `ENTR M10BU` | Small Business Development | ENTR → ENTR |
| `FINC M9006` | re_key | `BUSI M9144` | Business | FINC → BUSI |
| `FLSP M1019` | no_change | `FLSP M1001` | Foreign Languages | FLSP → FLSP |
| `FLSP M1040` | no_change | `FLSP M1003` | Foreign Languages | FLSP → FLSP |
| `FLSP M1125` | no_change | `FLSP M1035` | Foreign Languages | FLSP → FLSP |
| `FLSP M1130` | no_change | `FLSP M1036` | Foreign Languages | FLSP → FLSP |
| `FLSP M1175` | no_change | `FLSP M1047` | Foreign Languages | FLSP → FLSP |
| `FLSP M1176` | no_change | `FLSP M1048` | Foreign Languages | FLSP → FLSP |
| `FLSP M1194` | no_change | `FLSP M1056` | Foreign Languages | FLSP → FLSP |
| `FLSP M1235` | no_change | `FLSP M1068` | Foreign Languages | FLSP → FLSP |
| `FLSP M1245` | no_change | `FLSP M1070` | Foreign Languages | FLSP → FLSP |
| `FLSP M1272` | no_change | `FLSP M1074` | Foreign Languages | FLSP → FLSP |
| `FLSP M1279` | no_change | `FLSP M1075` | Foreign Languages | FLSP → FLSP |
| `FLSP M1282` | no_change | `FLSP M1077` | Foreign Languages | FLSP → FLSP |
| `FLSP M1295` | no_change | `FLSP M1078` | Foreign Languages | FLSP → FLSP |
| `FLSP M1322` | no_change | `FLSP M1081` | Foreign Languages | FLSP → FLSP |
| `FLSP M1323` | no_change | `FLSP M1082` | Foreign Languages | FLSP → FLSP |
| `FLSP M1334` | no_change | `FLSP M1085` | Foreign Languages | FLSP → FLSP |
| `FLSP M1335` | no_change | `FLSP M1086` | Foreign Languages | FLSP → FLSP |
| `FLSP M1336` | no_change | `FLSP M1087` | Foreign Languages | FLSP → FLSP |
| `FLSP M1347` | no_change | `FLSP M1091` | Foreign Languages | FLSP → FLSP |
| `FLSP M1349` | no_change | `FLSP M1092` | Foreign Languages | FLSP → FLSP |
| `FLSP M1357` | no_change | `FLSP M1095` | Foreign Languages | FLSP → FLSP |
| `FLSP M1359` | no_change | `FLSP M1096` | Foreign Languages | FLSP → FLSP |
| `HIST M10CQ` | no_change | `HIST M10CP` | History | HIST → HIST |
| `HIST M10RS` | no_change | `HIST M10RP` | History | HIST → HIST |
| `HIST M1152` | no_change | `HIST M1140` | History | HIST → HIST |
| `KINE M1015` | no_change | `KINE M1013` | Kinesiology | KINE → KINE |
| `KINE M10SU` | no_change | `KINE M11MI` | Kinesiology | KINE → KINE |
| `KINE M11XF` | no_change | `KINE M13RT` | Kinesiology | KINE → KINE |
| `KINE M1289` | no_change | `KINE M1341` | Kinesiology | KINE → KINE |
| `KINE M12BJ` | no_change | `KINE M13YC` | Kinesiology | KINE → KINE |
| `KINE M12CC` | no_change | `KINE M14AA` | Kinesiology | KINE → KINE |
| `KINE M1371` | no_change | `KINE M1455` | Kinesiology | KINE → KINE |
| `KINE M13FH` | no_change | `KINE M11WI` | Kinesiology | KINE → KINE |
| `KINE M13FJ` | no_change | `KINE M11UI` | Kinesiology | KINE → KINE |
| `KINE M13FV` | no_change | `KINE M10MA` | Kinesiology | KINE → KINE |
| `KINE M13FX` | no_change | `KINE M11QW` | Kinesiology | KINE → KINE |
| `KINE M13FY` | no_change | `KINE M11YW` | Kinesiology | KINE → KINE |
| `KINE M13MA` | no_change | `KINE M11YX` | Kinesiology | KINE → KINE |
| `KINE M13QS` | no_change | `KINE M12OW` | Kinesiology | KINE → KINE |
| `KINE M13VG` | no_change | `KINE M14AB` | Kinesiology | KINE → KINE |
| `KINE M14HW` | no_change | `KINE M11MH` | Kinesiology | KINE → KINE |
| `KINE M1704` | no_change | `KINE M1401` | Kinesiology | KINE → KINE |
| `KINE M1873` | no_change | `KINE M1350` | Kinesiology | KINE → KINE |
| `KINE M1925` | no_change | `KINE M1137` | Kinesiology | KINE → KINE |
| `KINE M1946` | no_change | `KINE M1777` | Kinesiology | KINE → KINE |
| `MGMT M10AI` | no_change | `MGMT M10AI` | Management | MGMT → MGMT |
| `NC M90LW` | re_key | `BUSI M90GN` | Business | NC → BUSI |
| `NC M90LX` | re_key | `BUSI M90GO` | Business | NC → BUSI |
| `NCBU M90AO` | re_key | `BUSI M90LE` | Business | NCBU → BUSI |
| `NCBU M90AP` | re_key | `BUSI M90EY` | Business | NCBU → BUSI |
| `OFFT M90AJ` | re_key | `BUSI M90DJ` | Business | OFFT → BUSI |
| `OFFT M90BB` | re_key | `BUSI M90IJ` | Business | OFFT → BUSI |
| `OTEC M1025` | no_change | `OTEC M1025` | Office Technologies | OTEC → OTEC |
| `OTEC M10CK` | no_change | `OTEC M10CK` | Office Technologies | OTEC → OTEC |
| `OTEC M10IN` | no_change | `OTEC M10IL` | Office Technologies | OTEC → OTEC |
| `OTEC M10IT` | no_change | `OTEC M10IR` | Office Technologies | OTEC → OTEC |
| `OTEC M10PM` | no_change | `OTEC M10PH` | Office Technologies | OTEC → OTEC |
| `OTEC M1132` | no_change | `OTEC M1134` | Office Technologies | OTEC → OTEC |
| `OTEC M9008` | no_change | `OTEC M9008` | Office Technologies | OTEC → OTEC |
| `OTEC M9013` | no_change | `OTEC M9013` | Office Technologies | OTEC → OTEC |
| `OTEC M9014` | no_change | `OTEC M9014` | Office Technologies | OTEC → OTEC |
| `OTEC M9015` | no_change | `OTEC M9015` | Office Technologies | OTEC → OTEC |
| `OTEC M90DB` | no_change | `OTEC M90DB` | Office Technologies | OTEC → OTEC |
| `OTEC M90DC` | no_change | `OTEC M90DC` | Office Technologies | OTEC → OTEC |
| `OTEC M90DG` | no_change | `OTEC M90DG` | Office Technologies | OTEC → OTEC |
| `REAL M1017` | no_change | `REAL M1014` | Real Estate | REAL → REAL |
| `REAL M10AE` | no_change | `REAL M10AE` | Real Estate | REAL → REAL |
| `VBUS M90BG` | re_key | `BUSI M90KM` | Business | VBUS → BUSI |
| `VOCE M90CX` | re_key | `BUSI M90BO` | Business | VOCE → BUSI |
| `VOCE M90CY` | re_key | `BUSI M90BU` | Business | VOCE → BUSI |
| `VOCE M90CZ` | re_key | `BUSI M90BW` | Business | VOCE → BUSI |
| `VOCE M90DA` | re_key | `BUSI M90BY` | Business | VOCE → BUSI |
| `VOCE M90DB` | re_key | `BUSI M90BZ` | Business | VOCE → BUSI |
| `VOCE M90QC` | re_key | `BUSI M90KH` | Business | VOCE → BUSI |

### Curated-M-ID collisions (operator decision points)

These buckets contain ≥2 curated M-IDs whose old keys all rename into the same canonical bucket. The dry-run assigns sequence numbers by (normalized_title, old_id); the operator approves at apply.

**Bucket `BUSI M1* (corroborated)`:**
- `BBK M1001` → `BUSI M1002` · QuickBooks Level 2
- `BUSI M1170` → `BUSI M1167` · Entrepreneurship and Small Business Management
- `BUSA M1003` → `BUSI M1300` · Federal Income Tax Law

**Bucket `BUSI M9* (corroborated)`:**
- `BBK M9001` → `BUSI M9003` · QuickBooks Level 1
- `CISC M9029` → `BUSI M9038` · QuickBooks Fundamentals for Financial Office Applications, Intermediate
- `CISC M9030` → `BUSI M9039` · Quickbooks Fundamentals for Financial Office Applications
- `BUSA M9003` → `BUSI M9058` · Payroll Fundamentals for Bookkeepers
- `FINC M9006` → `BUSI M9144` · Income Tax Training

**Bucket `AUTO M1* (corroborated)`:**
- `AUTO M1005` → `AUTO M1004` · Smog Check Procedures Training Level 2
- `AUTO M1006` → `AUTO M1005` · Smog Check Training Level 2
- `AUTO M1007` → `AUTO M1006` · Smog Inspector - Level 2 Training
- `AUTO M1217` → `AUTO M1211` · Smog Level One and Level Two

**Bucket `AUTB M1* (corroborated)`:**
- `AUTB M1002` → `AUTB M1002` · Advanced Auto Body Collision and Damage Repair
- `AUTB M1003` → `AUTB M1003` · Advanced Auto Collision Repair
- `AUTB M1037` → `AUTB M1037` · SMOG CHECK II

**Bucket `OTEC M1* (corroborated)`:**
- `OTEC M1025` → `OTEC M1025` · COMPUTER ACCOUNTING APPLICATIONS: QUICKBOOKS
- `OTEC M1132` → `OTEC M1134` · Data Entry Using Quickbooks

**Bucket `ENGL M1* (corroborated)`:**
- `ENGL M1217` → `ENGL M1197` · Creative Nonfiction Writing
- `ENGL M1367` → `ENGL M1330` · Introduction to Shakespeare

**Bucket `KINE M1* (corroborated)`:**
- `KINE M1015` → `KINE M1013` · Weight Training 1
- `KINE M1925` → `KINE M1137` · Weight Training and Aerobics
- `KINE M1289` → `KINE M1341` · Weight Training - Beginning
- `KINE M1873` → `KINE M1350` · Body Conditioning and Physical Fitness
- `KINE M1704` → `KINE M1401` · WEIGHT TRAINING AND CARDIOVASCULAR
- `KINE M1371` → `KINE M1455` · Weight Training and Conditioning I
- `KINE M1946` → `KINE M1777` · Introduction to Weight Training

**Bucket `OTEC M9* (corroborated)`:**
- `OTEC M9008` → `OTEC M9008` · Sage 50 Automated Accounting
- `OTEC M9013` → `OTEC M9013` · ADVANCED ACCOUNT CLERK
- `OTEC M9014` → `OTEC M9014` · BEGINNING ACCOUNT CLERK
- `OTEC M9015` → `OTEC M9015` · QuickBooks Automated Accounting

**Bucket `FLSP M1* (corroborated)`:**
- `FLSP M1019` → `FLSP M1001` · Spanish 1
- `FLSP M1040` → `FLSP M1003` · Spanish 2
- `FLSP M1125` → `FLSP M1035` · Beginning Spanish II
- `FLSP M1130` → `FLSP M1036` · Beginning Spanish
- `FLSP M1175` → `FLSP M1047` · College Spanish I
- `FLSP M1176` → `FLSP M1048` · College Spanish II
- `FLSP M1194` → `FLSP M1056` · Continuation of Elementary Spanish
- `FLSP M1235` → `FLSP M1068` · First Course in Spanish
- `FLSP M1245` → `FLSP M1070` · Second Course in Spanish
- `FLSP M1272` → `FLSP M1074` · Elementary Spanish I
- `FLSP M1279` → `FLSP M1075` · Elementary Spanish II
- `FLSP M1282` → `FLSP M1077` · Introduction to Elementary Spanish
- `FLSP M1295` → `FLSP M1078` · ELEMENTARY SPANISH FOR SPANISH SPEAKERS
- `FLSP M1322` → `FLSP M1081` · FUNDAMENTALS OF SPANISH I
- `FLSP M1323` → `FLSP M1082` · FUNDAMENTALS OF SPANISH II
- `FLSP M1334` → `FLSP M1085` · Spanish for Heritage Speakers I
- `FLSP M1335` → `FLSP M1086` · Spanish for Heritage Speakers II
- `FLSP M1336` → `FLSP M1087` · Spanish for Heritage Students
- `FLSP M1347` → `FLSP M1091` · Spanish for Native Speakers I
- `FLSP M1349` → `FLSP M1092` · SPANISH FOR SPANISH SPEAKERS I
- `FLSP M1357` → `FLSP M1095` · Spanish for Native Speakers II
- `FLSP M1359` → `FLSP M1096` · SPANISH FOR SPANISH SPEAKERS II

**Bucket `BUSI M1* (standalone)`:**
- `BUSA M10AJ` → `BUSI M10MO` · External Auditing
- `BUSA M10AF` → `BUSI M10ZQ` · Computer Income Tax Return Preparation- Individuals
- `BUAC M10AE` → `BUSI M11BL` · Income Tax - Individuals / CTEC
- `CISC M12GG` → `BUSI M11CM` · QuickBooks Desktop
- `BBK M10AC` → `BUSI M11PA` · Payroll Record Keeping and Reporting

**Bucket `BUSI M9* (standalone)`:**
- `VOCE M90CX` → `BUSI M90BO` · ADVANCE QUICKBOOKS ACCOUNTING
- `VOCE M90CY` → `BUSI M90BU` · The Accounting Cycle
- `CISC M90AQ` → `BUSI M90BV` · Excel for Accounting Principle
- `VOCE M90CZ` → `BUSI M90BW` · INTERMEDIATE QUICKBOOKS ACCOUNTING
- `VOCE M90DA` → `BUSI M90BY` · INTRODUCTION TO QUICKBOOKS ACCOUNTING
- `VOCE M90DB` → `BUSI M90BZ` · Payroll and Tax Accounting
- `OFFT M90AJ` → `BUSI M90DJ` · Compensation and Basic Payroll II
- `NCBU M90AP` → `BUSI M90EY` · Quickbooks: Set-up and Services Business
- `NC M90LW` → `BUSI M90GN` · TAX PREPARATION/INCOME TAX COURSE I
- `NC M90LX` → `BUSI M90GO` · TAX PREPARATION/INCOME TAX COURSE II
- `OFFT M90BB` → `BUSI M90IJ` · Year-end Procedures Using Quickbooks
- `VOCE M90QC` → `BUSI M90KH` · Intro to Tax Preparation
- `VBUS M90BG` → `BUSI M90KM` · Introduction to Quickbooks
- `NCBU M90AO` → `BUSI M90LE` · Quickbooks: Merchandising and Payroll

**Bucket `AUTO M1* (standalone)`:**
- `AUTO M10AG` → `AUTO M10AF` · Level 1 and Level 2 Smog Inspector Training
- `AUTO M10BK` → `AUTO M10BJ` · Smog Check Training Inspection Procedures - Level 2
- `AUTO M10BL` → `AUTO M10BK` · Level 2 - Smog Check Procedures Training
- `AUTO M10BT` → `AUTO M10BS` · Level 2 Smog Technician Training
- `AUTO M10CX` → `AUTO M10CW` · Standard Accounting Systems of the Automotive Industry
- `AUTO M10PB` → `AUTO M10OX` · Bureau of Automotive Repair (BAR) Smog Inspector Training II
- `AUTO M11AA` → `AUTO M10ZP` · BAR Level II Smog Check Inspector Training
- `AUTO M11CW` → `AUTO M11CL` · Level-II Smog Technician Training Course: Smog Check Inspection Procedures
- `AUTO M11DB` → `AUTO M11CQ` · Smog Check Level II
- `AUTO M11NQ` → `AUTO M11NF` · Smog Inspector Training Level II

**Bucket `KINE M1* (standalone)`:**
- `KINE M13FV` → `KINE M10MA` · Body Conditioning and Physical Fitness (Advanced)
- `KINE M14HW` → `KINE M11MH` · Basic Training and Physical Conditioning
- `KINE M10SU` → `KINE M11MI` · Basic Weight Training and Conditioning
- `KINE M13FX` → `KINE M11QW` · Body Conditioning and Physical Fitness (Beginners)
- `KINE M13FJ` → `KINE M11UI` · Beginning Weight Training and Fitness
- `KINE M13FH` → `KINE M11WI` · Beginning Weight Lifting and Weight Training
- `KINE M13FY` → `KINE M11YW` · Body Conditioning and Physical Fitness (Intermediate)
- `KINE M13MA` → `KINE M11YX` · Intermediate Body Conditioning and Physical Fitness
- `KINE M13QS` → `KINE M12OW` · Strength Training and Conditioning
- `KINE M11XF` → `KINE M13RT` · Resistance and Weight Training I
- `KINE M12BJ` → `KINE M13YC` · Weight Training - Introduction
- `KINE M12CC` → `KINE M14AA` · Weight Training and Lifting
- `KINE M13VG` → `KINE M14AB` · Weight Training/Weight Lifting

**Bucket `COUN M1* (standalone)`:**
- `COUN M10JJ` → `COUN M10JI` · Career and College Success
- `COUN M10JK` → `COUN M10JJ` · Success College and Career

**Bucket `OTEC M1* (standalone)`:**
- `OTEC M10CK` → `OTEC M10CK` · Computerized Accounting Lab
- `OTEC M10IN` → `OTEC M10IL` · QuickBooks Online for Small Business
- `OTEC M10IT` → `OTEC M10IR` · QuickBooks for Small Business
- `OTEC M10PM` → `OTEC M10PH` · Microsoft Office and QuickBooks Prep

**Bucket `ENGL M1* (standalone)`:**
- `ENGL M10WP` → `ENGL M10WM` · Writing in Creative Nonfiction
- `ENGL M10YQ` → `ENGL M10YN` · Introduction to Shakespeare (The Drama)
- `ENGL M11HY` → `ENGL M11HU` · An Introduction to Shakespeare
- `ENGL M11HZ` → `ENGL M11HV` · Shakespeare: Introduction

**Bucket `ARTS M1* (standalone)`:**
- `ARTS M10BJ` → `ARTS M10BJ` · History of Modern Art (1800 to Present)
- `ARTS M11AH` → `ARTS M11AH` · Ceramics-Handbuilding: Beginning

**Bucket `OTEC M9* (standalone)`:**
- `OTEC M90DB` → `OTEC M90DB` · QuickBooks Online: Managing a Service and Product Based Business
- `OTEC M90DC` → `OTEC M90DC` · QuickBooks Online: Managing a Service Based Business
- `OTEC M90DG` → `OTEC M90DG` · Compensation and Basic Payroll I

**Bucket `HIST M1* (standalone)`:**
- `HIST M10CQ` → `HIST M10CP` · History of Western Civilization (to 1660)
- `HIST M10RS` → `HIST M10RP` · History Western Civilization


## Top 25 disciplines by re-key impact

| discipline | canonical | n M-IDs | re-key | no-change | blocked | reviewed? |
|---|---|---:|---:|---:|---:|:---:|
| Computer Information Systems | `CSIS` | 2458 | 2458 | 0 | 0 | ✓ |
| Interdisciplinary Studies | `IDST` | 2106 | 2087 | 19 | 0 | ✓ |
| Industrial Technology | `INDT` | 853 | 850 | 3 | 0 | ✓ |
| Health | `HLTH` | 1306 | 811 | 495 | 0 | ✓ |
| Electronics | `ELET` | 511 | 511 | 0 | 0 | ✓ |
| Physical Education | `PEDU` | 505 | 505 | 0 | 0 | ✓ |
| Family and Consumer Studies/ Home Economics | `FCSH` | 494 | 494 | 0 | 0 | ✓ |
| Business | `BUSI` | 2101 | 422 | 1679 | 0 | ✓ |
| Health Care Ancillaries | `HTEC` | 408 | 408 | 0 | 0 | ✓ |
| Education | `EDUC` | 499 | 315 | 184 | 0 | ✓ |
| Agriculture | `AGRI` | 804 | 259 | 545 | 0 | ✓ |
| Public Safety | `PUBS` | 499 | 252 | 247 | 0 | ✓ |
| Humanities | `HUMA` | 522 | 250 | 272 | 0 | ✓ |
| Social Science | `SOCS` | 296 | 236 | 60 | 0 | ✓ |
| Physical Sciences | `PHSC` | 239 | 233 | 6 | 0 | ✓ |
| Instructional Design/Technology | `EDTC` | 143 | 143 | 0 | 0 | ✓ |
| Interdisciplinary-Basic Skills: Noncredit 53412 | `BSKL` | 117 | 117 | 0 | 0 | ✓ |
| Diagnostic Medical Technology | `SONO` | 116 | 116 | 0 | 0 | ✓ |
| Nutritional Science/Dietetics | `FDNT` | 97 | 97 | 0 | 0 | ✓ |
| Electromechanical Technology | `ELMT` | 55 | 55 | 0 | 0 | ✓ |
| Chicano Studies | `ETHN` | 50 | 50 | 0 | 0 | ✓ |
| Carpentry | `CARP` | 192 | 46 | 146 | 0 | ✓ |
| Biological Sciences | `BIOL` | 1028 | 42 | 986 | 0 | ✓ |
| Architecture | `ARCH` | 603 | 40 | 563 | 0 | ✓ |
| Environmental Technologies | `ESCI` | 590 | 26 | 564 | 0 | ✓ |

## Validation

- ✅ **all_new_subj4_are_4letter**: pass
- ✅ **one_subj4_per_discipline**: pass
- ✅ **new_course_ids_unique**: pass
- ✅ **new_id_disjoint_from_untouched**: pass
- ✅ **no_seq_overflow**: pass

## Sequence-collision summary

517 new buckets contain ≥2 old M-IDs. Top 10 by collision count:

| new bucket | colliding M-IDs |
|---|---:|
| `KINE M1* (standalone)` | 2889 |
| `MUSI M1* (standalone)` | 1831 |
| `CSIS M1* (standalone)` | 1690 |
| `ARTS M1* (standalone)` | 1526 |
| `THEA M1* (standalone)` | 1312 |
| `DANC M1* (standalone)` | 1226 |
| `CRIM M1* (standalone)` | 1201 |
| `BUSI M1* (standalone)` | 1187 |
| `NRSR M1* (standalone)` | 1156 |
| `AUTO M1* (standalone)` | 1068 |

## CCN / C-ID sequence reservations

The M-ID corroborated format `SUBJ M<band><seq:03d>` shares structure with CCN's `SUBJ C<band><seq:03d>` (only the prefix letter differs), and with the embedded sequence of C-ID `SUBJ <band><seq2>`. To prevent visual/sequence collisions, the allocator skips any seq already taken by a CCN/C-ID in the same `(SUBJ4, band)` bucket. Source: `kb/reference/ccn_courses.json` + `kb/reference/cid_descriptors.json`.

- Total reserved seqs across all (SUBJ4, band): **258**
- (SUBJ4, band) buckets with at least one M-ID landing in them: **20**
- Actual seq skips during this dry-run allocation: **164** (allocator walked past these to the next free seq)

Buckets with most reservations (these eat into the 999-seq capacity):

| (SUBJ4, band) | reserved seqs |
|---|---|
| `ITIS` band `1` | 010, 020, 030, 035, 036, 040, 045, 050 (+ 14 more) |
| `ENGL` band `1` | 000, 001, 002, 003, 005, 010, 020, 030 (+ 9 more) |
| `THTR` band `1` | 011, 012, 013, 014, 051, 052, 071, 072 (+ 5 more) |
| `MATH` band `2` | 010, 011, 020, 021, 030, 040, 050, 060 (+ 4 more) |
| `ARTS` band `2` | 000, 005, 010, 020, 030, 040, 050, 060 (+ 4 more) |

Buckets where the allocator actually skipped seqs this run:

| new bucket | seqs skipped |
|---|---:|
| `DANC M1* (standalone)` | 17 |
| `ENGL M1* (corroborated)` | 16 |
| `COMM M1* (corroborated)` | 12 |
| `GEOG M1* (corroborated)` | 10 |
| `ARTH M1* (corroborated)` | 8 |

## Downstream apply scope

Beyond `coci_minted_courses.json` + `coci_minted_singletons.json`, the apply step (5c) re-keys references in three downstream files. The numbers below count records that touch at least one old M-ID in this dry-run's alias map.

| file | records re-keyed |
|---|---:|
| `kb/coci_minted_memberships.json` | 15457 |
| `kb/coci_articulations.json` (articulations[]) | 3916 |
| `kb/coci_unified_courses.json` (clusters[].members) | 0 clusters, 0 member refs |
| `kb/coci_curation.json` (key rename) | 29 |

## How to proceed

1. Curators fill any blank `canonical_subj4` entries via the **Canonical SUBJ4** tab.
2. Re-run `python3 kb/_subj4_dryrun.py` to refresh this report.
3. When the apply-gate above goes ✅, Session 5c builds `kb/_subj4_apply.py` for the atomic re-key (producer + consumer + curation overlay + Supabase live kb_curation, all in one 10:17 UTC window).
4. Rollback inverse alias lives in `kb/subj4_dryrun/alias_map.json` (right-to-left).
