---
title: Cross-discipline Over-merge Re-mint Dry-Run
date: 2026-05-29
status: DRY-RUN — no kb files mutated, no Supabase writes
tags: [remint, dry-run, over-merge, member-top-divergence, m-id]
artifacts:
  - kb/overmerge_out/2026-05-29/alias_map.json
  - kb/overmerge_out/2026-05-29/review_hold.json
  - kb/overmerge_out/2026-05-29/collisions.json
---

# Cross-discipline Over-merge Re-mint Dry-Run

## TL;DR

- Flagged by `member_top_divergence`: **1299** M-IDs (members span ≥2 two-digit TOP divisions, minority share ≥ 0.30).
- **63** HELD for curator veto (not split): sister_pair 58, interdisciplinary_token 5.
- **1236** split into discipline-pure pieces by 2-digit TOP division.
  - **752** fully de-corroborate (dissolve to singletons — the title collision was never a real consolidated course).
  - **484** plurality groups keep their old corroborated id.
  - **212** NEW corroborated groups minted (fresh ids).
  - **1951** members peel to singleton status.
- Corroborated catalog: **1299 → 759** (**-540**) — spurious corroborations removed.

## Apply gate

**✅ READY FOR APPLY** — all four gates PASS, collisions empty.

## Gates

- ✅ **V1_every_split_yields_a_group**: PASS
- ✅ **V2_member_conservation**: PASS
  - global split member sum 4507 == orig sum 4507
- ✅ **V3_collision_free**: PASS
  - 0 collision(s) (see `collisions.json` — must be 0)
- ✅ **V4_article_routability**: PASS
  - routable 77 · multi 21 · unroutable 0

## Split-factor distribution

How many division groups each SPLIT M-ID partitions into (held M-IDs excluded).

| division groups | M-IDs |
|---:|---:|
| 2 | 1103 |
| 3 | 110 |
| 4 | 16 |
| 5 | 5 |
| 8 | 1 |
| 14 | 1 |

## Top 30 split previews

Old M-ID → its pieces (`discipline` (n_colleges col, kind)). Ranked by split factor then member count.

| old M-ID | title | pieces |
|---|---|---|
| `MUSI M1512` | Independent Projects | *(blank)* (1 col, sing) · Theater Arts (1 col, sing) · *(blank)* (1 col, sing) · Business (1 col, sing) · Computer Information Systems (1 col, sing) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) · English (1 col, sing) · *(blank)* (1 col, sing) · Agricultural Production (1 col, sing) · Multimedia (1 col, sing) · Interior Design (1 col, sing) · Mathematics (1 col, sing) · Administration of Justice (1 col, sing) |
| `ETHS M1232` | Field Studies | *(blank)* (1 col, sing) · Biological Sciences (2 col, keep) · *(blank)* (1 col, sing) · Music (1 col, sing) · Emergency Medical Technologies (1 col, sing) · English (1 col, sing) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) |
| `PSYC M1092` | Human Sexuality | *(blank)* (28 col, keep) · Health (7 col, corr) · *(blank)* (7 col, corr) · Biological Sciences (5 col, corr) · *(blank)* (3 col, corr) |
| `ARTS M1376` | Portfolio Development | *(blank)* (8 col, keep) · Multimedia (5 col, corr) · Interior Design (4 col, corr) · *(blank)* (3 col, corr) · *(blank)* (2 col, corr) |
| `KINE M1632` | Stress Management | Health (11 col, keep) · *(blank)* (4 col, corr) · *(blank)* (3 col, corr) · Business (2 col, corr) · *(blank)* (2 col, corr) |
| `BUSI M1375` | Leadership | Business (3 col, keep) · Nursing (2 col, corr) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) |
| `MULT M1009` | Visual Communication | Multimedia (2 col, keep) · *(blank)* (1 col, sing) · Graphic Arts (1 col, sing) · Interior Design (1 col, sing) · *(blank)* (1 col, sing) |
| `LSKL M1025` | LEARNING RESOURCES | *(blank)* (1 col, sing) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) |
| `OTEC M9057` | Introduction to Computers | Office Technologies (6 col, keep) · Office Technologies (3 col, corr) · *(blank)* (2 col, corr) · Plumbing (1 col, sing) |
| `BUSI M1361` | Introduction to Online Learning | *(blank)* (4 col, keep) · Office Technologies (3 col, corr) · *(blank)* (2 col, corr) · Instructional Design/Technology (1 col, sing) |
| `GEOG M1031` | Global Climate Change | *(blank)* (4 col, keep) · *(blank)* (4 col, corr) · *(blank)* (2 col, corr) · Biological Sciences (1 col, sing) |
| `COMM M1105` | Storytelling | *(blank)* (5 col, keep) · Multimedia (1 col, sing) · Theater Arts (1 col, sing) · Library Technology (1 col, sing) |
| `GERO M1004` | Introduction to Gerontology | Gerontology (3 col, keep) · Counseling (2 col, corr) · *(blank)* (2 col, corr) · *(blank)* (1 col, sing) |
| `COUN M1130` | Emotional Intelligence | Counseling (2 col, keep) · Management (1 col, sing) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) |
| `MATH M1210` | Introduction to STEM Careers | *(blank)* (1 col, sing) · *(blank)* (1 col, sing) · Biological Sciences (1 col, sing) · Mathematics (1 col, sing) |
| `MATH M1262` | Undergraduate Research Experience | *(blank)* (1 col, sing) · Biological Sciences (1 col, sing) · Mathematics (1 col, sing) · *(blank)* (1 col, sing) |
| `OTEC M1212` | Social Media | Office Technologies (2 col, keep) · Multimedia (2 col, corr) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) |
| `SOCI M1032` | Death and Dying | *(blank)* (1 col, sing) · *(blank)* (2 col, keep) · Gerontology (1 col, sing) · *(blank)* (1 col, sing) |
| `ARTS M1056` | Advanced Desktop Publishing | Graphic Arts (2 col, keep) · Office Technologies (1 col, sing) · *(blank)* (1 col, sing) · Office Technologies (1 col, sing) |
| `AUTB M1043` | Production Management | Media Production (2 col, keep) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) · Restaurant Management (1 col, sing) |
| `JOUR M9001` | Digital Literacy | Office Technologies (2 col, keep) · Journalism (1 col, sing) · *(blank)* (1 col, sing) · *(blank)* (1 col, sing) |
| `CRIM M1130` | Introduction to Conflict Resolution | *(blank)* (1 col, sing) · *(blank)* (1 col, sing) · Administration of Justice (1 col, sing) · Political Science (1 col, sing) |
| `HEIT M1042` | Information Technology | Office Technologies (1 col, sing) · *(blank)* (1 col, sing) · Health Information Technology (1 col, sing) · Library Technology (1 col, sing) |
| `HLTH M1139` | Introduction to Public Health | Health (29 col, keep) · *(blank)* (12 col, corr) · Biological Sciences (1 col, sing) |
| `FIMS M1084` | Introduction to Film | *(blank)* (12 col, keep) · Theater Arts (5 col, corr) · English (3 col, corr) |
| `BIOL M1201` | Environmental Science | *(blank)* (12 col, keep) · Biological Sciences (5 col, corr) · Forestry/Natural Resources (4 col, corr) |
| `HLTH M1145` | Health and Social Justice | Health (11 col, keep) · *(blank)* (8 col, corr) · *(blank)* (1 col, sing) |
| `CISC M1301` | Computer Literacy | *(blank)* (13 col, keep) · Office Technologies (5 col, corr) · *(blank)* (1 col, sing) |
| `KINE M1652` | Sport Psychology | *(blank)* (8 col, keep) · Physical Education (8 col, corr) · *(blank)* (4 col, corr) |
| `NUTR M1056` | Sports Nutrition | Culinary Arts/Food Technology (13 col, keep) · Health (5 col, corr) · *(blank)* (2 col, corr) |

## Review-hold (curator veto)

**63** flagged M-IDs held — NOT split (kept old id). High-precision heuristic: known sister-pair split OR an interdisciplinary-compound title token.

| M-ID | title | reason | disciplines / tokens |
|---|---|---|---|
| `ARTD M1007` | Motion Design | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1014` | COMPUTER GRAPHICS 2: 3D COMPUTER GRAPHIC | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1035` | 3D Texturing and Lighting | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1104` | Introduction to Animation | sister_pair | Art, Multimedia |
| `ARTS M1139` | DIGITAL ART | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1187` | Introduction to Digital Arts | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1312` | Introduction to Computer Graphics | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1338` | History of Graphic Design | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1373` | Designing for the Web | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1378` | Digital Drawing and Painting | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1383` | Digital Imaging I | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1388` | Introduction to Digital Imaging | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1395` | Figure Drawing | sister_pair | Art, Multimedia |
| `ARTS M1405` | Drawing Fundamentals | sister_pair | Art, Multimedia |
| `ARTS M1450` | Fundamentals of Typography | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1455` | Introduction to Motion Graphics | sister_pair | Graphic Arts, Multimedia |
| `BIOL M1205` | Ethnobotany/Ethnoecology Lab | interdisciplinary_token | ethnobotany, ethnoecology |
| `BIOL M1206` | Ethnoecology | interdisciplinary_token | ethnoecology |
| `BUSI M1126` | Microsoft Applications for Business | sister_pair | Computer Information Systems, Office Technologies |
| `BUSI M1190` | Business Information Systems | sister_pair | Computer Information Systems, Office Technologies |
| `BUSI M1412` | MULTIMEDIA PRESENTATIONS---POWERPOINT | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1043` | Microsoft Access: Comprehensive | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1078` | ADVANCED WEB APPLICATION DEVELOPMENT | sister_pair | Computer Information Systems, Computer Science |
| `CISC M1186` | Building Business Web Sites | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1377` | DESIGNING WEB GRAPHICS | sister_pair | Computer Information Systems, Computer Science |
| `CISC M1385` | Web Development I | sister_pair | Computer Information Systems, Computer Science |
| `CISC M1387` | Web Development II | sister_pair | Computer Information Systems, Computer Science |
| `CISC M1390` | Web Development with PHP and MySQL | sister_pair | Computer Information Systems, Computer Science |
| `CISC M1391` | Web Page Development | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1522` | Introduction to WordPress | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1575` | Server-Side Ruby Web Programming | sister_pair | Computer Information Systems, Computer Science |
| `CISC M9047` | Business Web Graphics | sister_pair | Computer Information Systems, Office Technologies |
| `FIMS M1102` | Introduction to Multimedia | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1003` | Typography 2 | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1005` | Advanced Adobe Illustrator | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1010` | Adobe Illustrator | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1014` | Advanced Typography | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1036` | Typography and Graphic Design | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1053` | Multimedia Production | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1057` | Storyboarding | sister_pair | Graphic Arts, Multimedia |
| `JOUR M1015` | Basic Photojournalism | interdisciplinary_token | photojournalism |
| `JOUR M1094` | Photojournalism | interdisciplinary_token | photojournalism |
| `MULT M1001` | User Experience Design 1 | sister_pair | Graphic Arts, Multimedia |
| `MULT M1002` | User Experience Design 2 | sister_pair | Graphic Arts, Multimedia |
| `MULT M1018` | 3D Animation and Modeling | sister_pair | Graphic Arts, Multimedia |
| `MULT M1035` | Animal Drawing | sister_pair | Graphic Arts, Multimedia |
| `MULT M1036` | Animation | sister_pair | Graphic Arts, Multimedia |
| `MULT M1062` | Motion Graphics, Compositing and Visual  | sister_pair | Graphic Arts, Multimedia |
| `MULT M1070` | Digital Illustration for Graphic Design  | sister_pair | Graphic Arts, Multimedia |
| `MULT M1072` | Digital Illustration for Graphic Design  | sister_pair | Graphic Arts, Multimedia |
| `MULT M1082` | MOBILE GAME DESIGN | sister_pair | Graphic Arts, Multimedia |
| `MULT M1084` | Graphic Design Studio II | sister_pair | Graphic Arts, Multimedia |
| `MULT M1099` | Fundamentals of Digital Media | sister_pair | Graphic Arts, Multimedia |
| `MULT M1100` | Digital Illustration II | sister_pair | Graphic Arts, Multimedia |
| `MULT M1101` | Digital Imaging II | sister_pair | Graphic Arts, Multimedia |
| `MULT M1103` | Introduction to Digital Illustration | sister_pair | Graphic Arts, Multimedia |
| `MULT M1106` | Introduction to Digital Painting | sister_pair | Graphic Arts, Multimedia |
| `MULT M1136` | Social Media for Professionals | sister_pair | Graphic Arts, Multimedia |
| `OTEC M1036` | Advanced Excel | sister_pair | Computer Information Systems, Office Technologies |
| `OTEC M1120` | Computer Keyboarding | sister_pair | Computer Information Systems, Office Technologies |
| `OTEC M1124` | Introduction to Computers and Keyboardin | sister_pair | Computer Information Systems, Office Technologies |
| `PHOT M1034` | BEGINNING PHOTOJOURNALISM | interdisciplinary_token | photojournalism |
| `VOCE M9045` | COMPUTER LITERACY FOR COLLEGE | sister_pair | Computer Information Systems, Office Technologies |

## Articulation impact

- Articulations referencing flagged M-IDs: **98** (across 66 M-IDs).
- Routing (primary: earned_by_colleges ∩ piece colleges; fallback: top_code division): routable **77**, multi **21**, unroutable **0**.

## Cluster member-ref impact

- Clusters in `coci_unified_courses.json` with ≥1 flagged member: **52**.
- Sample old-member → new-id(s) mappings:
  - `UC-00126` · `GRAF M1005` → ['GRAF M1005']
  - `UC-00159` · `KINE M1092` → ['PHYS M14CS', 'KINE M12FK']
  - `UC-00174` · `KINE M1103` → ['PHYS M14CW', 'KINE M12FN']
  - `UC-00191` · `ARCH M1020` → ['ARCH M1020', 'DRAF M1010']
  - `UC-00210` · `DANC M1051` → ['PHYS M14DC', 'DANC M11VY']
  - `UC-00281` · `HLTH M1026` → ['HLTH M10TD', 'HLTH M10TE']
  - `UC-00311` · `KINE M1156` → ['KINE M1156', 'KINE M12FT']
  - `UC-00312` · `KINE M1157` → ['PHYS M14DF', 'KINE M12FU']
  - `UC-00395` · `DANC M9005` → ['DANC M9005', 'DANC M90AC']
  - `UC-00404` · `KINE M1213` → ['PHYS M14DQ', 'KINE M12GG']
  - `UC-00409` · `BIOL M1047` → ['BIOL M11BN', 'BIOL M11BO']
  - `UC-00465` · `KINE M1272` → ['KINE M1272', 'KINE M12GK']
  - `UC-00475` · `BUSI M1141` → ['BUSI M1141', 'OTEC M1027']
  - `UC-00489` · `PSYC M1035` → ['PSYC M10KT', 'PSYC M10KU']
  - `UC-00490` · `PSYC M1037` → ['PSYC M1025', 'PSYC M1037']

## How to proceed

1. Review the split previews + the review-hold list. Confirm the held set looks like genuine interdisciplinary courses.
2. Re-run `python3 kb/_overmerge_dryrun.py` after any auditor / canonical-map refresh to see the impact move.
3. When all four gates are ✅, the apply step (`kb/_overmerge_apply.py` + Supabase + `workflow_dispatch`) re-keys minted M-IDs, memberships, articulations, and cluster member-refs atomically in one cron window.
4. Rollback inverse alias lives in `kb/overmerge_out/2026-05-29/alias_map.json`.
