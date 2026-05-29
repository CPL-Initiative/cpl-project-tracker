---
title: Cross-discipline Over-merge Re-mint Dry-Run
date: 2026-05-29
status: DRY-RUN — no kb files mutated, no Supabase writes
tags: [remint, dry-run, over-merge, member-top-divergence, m-id]
artifacts:
  - kb/overmerge_out/2026-05-29/alias_map.json
  - kb/overmerge_out/2026-05-29/review_hold.json
  - kb/overmerge_out/2026-05-29/collisions.json
  - kb/overmerge_out/2026-05-29/coherence.json
---

# Cross-discipline Over-merge Re-mint Dry-Run

## TL;DR

- Flagged by `member_top_divergence`: **1299** M-IDs (members span ≥2 two-digit TOP divisions, minority share ≥ 0.30).
- **52** HELD for curator veto (not split): sister_pair 47, interdisciplinary_token 5.
- **1247** split into discipline pieces via the member **SUBJ4→subject_map→TOP→description cascade** (title keep-whole map applied first; container titles split per-member).
  - **255** kept WHOLE (one piece, no split): **23** by the curator title→discipline map + **232** by **description coherence** (iteration 2).
  - **5** matched a container pattern (Independent Study / Special Topics / …) → split per-member.
  - **858** fully de-corroborate (dissolve to singletons — the title collision was never a real consolidated course).
  - **389** plurality groups keep their old corroborated id.
  - **314** NEW corroborated groups minted (fresh ids).
  - **2052** members peel to singleton status.
- Corroborated catalog: **1299 → 755** (**-544**) — spurious corroborations removed.
- Pieces: **2755** total; **1001** (**36.3%**) stayed blank-discipline (subject-separated for curator review).

## Discipline-source breakdown

How the cascade resolved each piece's discipline (`raw_subject` + `blank` = the blank-discipline residue, subject-separated).

| disc_source | pieces |
|---|---:|
| `subj4` | 501 |
| `subject_map` | 155 |
| `top_code` | 842 |
| `description` | 21 |
| `title_map` | 23 |
| `raw_subject` | 981 |
| `description_coherence` | 232 |
| **total** | **2755** |

## Description-coherence keep-vs-split (iteration 2)

Some flagged M-IDs are ONE course whose members merely carry different TOP/subject codes by college (the cascade wrongly SPLITS them); others are genuine over-merges of different courses (correctly split). The discriminator is **catalog-description coherence** — the mean pairwise **token-set Jaccard** of members' boilerplate-stripped descriptions (only members that HAVE a description count; <2 ⇒ `insufficient_desc` ⇒ left split). An **in-betweener** is a flagged M-ID the cascade split into ≥2 pieces that is NOT held / title-map keep-whole / container — exactly the population this layer decides.

- In-betweeners: **1077** (measurable **1003**, insufficient-desc **74**).
- Active threshold: **0.55** → **232** collapsed to one piece (kept whole); the rest stay split.
- Metric choice: token-set **Jaccard** over cosine-TF — pure set arithmetic (deterministic) and it scores slightly lower on the borderline, so it leans toward **preserving splits** (a wrong split is recoverable via the title-map; a wrong merge re-buries an over-merge).

### Measure-first — would-collapse by threshold

How many in-betweeners (of the **1003** measurable) would collapse to keep-whole at each candidate threshold. The active default is **0.55**.

| threshold | would-collapse | of measurable |
|---:|---:|---:|
| 0.30 | 368 | 1003 |
| 0.40 | 283 | 1003 |
| 0.50 | 243 | 1003 |
| 0.55 | 232 | 1003 ← **active** |
| 0.60 | 222 | 1003 |
| 0.70 | 196 | 1003 |
| _insufficient-desc_ | 74 | _(left split — undefined coherence)_ |

### Named examples (Sam-flagged)

| M-ID | title | coherence | n_with_desc | cascade pieces | outcome @ active |
|---|---|---:|---:|---|---|
| `CRIM M1130` | Introduction to Conflict Resolutio | `0.508` | 4 | Administration of Justice, Political Science, Psychology, RAW:CMUN | split (kept) |
| `HEIT M1042` | Information Technology | `0.029` | 4 | Health Information Technology, Library Technology, Office Technologies, RAW:ITIS | split (kept) |

### Borderline samples (coherence 0.40–0.60)

For threshold calibration by eye — title + per-piece disciplines + coherence score, sorted ascending.

| M-ID | title | coherence | n_with_desc | cascade pieces |
|---|---|---:|---:|---|
| `PSYC M1012` | DEVELOPMENTAL PSYCHOLOGY-CHILDHO | `0.401` | 3 | Child Development/Early Childhood Education, Psychology, RAW:PSYCH |
| `CISC M1570` | Technical and Professional Writi | `0.404` | 3 | English, RAW:CIS, RAW:ENG |
| `CISC M1086` | Advanced Web Development | `0.405` | 5 | Computer Information Systems, Multimedia |
| `ENGL M1063` | African American Literature - Ho | `0.406` | 3 | English, Ethnic Studies |
| `KINE M1586` | Pilates Mat Instructor Training | `0.406` | 3 | Kinesiology, RAW:KIN, RAW:PRO CR |
| `GRAF M1046` | Digital Media | `0.408` | 3 | Graphic Arts, RAW:ARTG |
| `ENGT M1021` | Construction Surveying | `0.410` | 3 | Architecture, Engineering Technology |
| `OSHA M1004` | Medic First Aid Training/CPR | `0.412` | 3 | Emergency Medical Technologies, Industrial Safety |
| `ETHS M1057` | African American Humanities | `0.415` | 3 | Ethnic Studies, RAW:HUM |
| `JOUR M1093` | Photography for Publication | `0.415` | 3 | Journalism, Photography |
| `ENVR M1019` | Energy and Sustainability | `0.416` | 3 | Forestry/Natural Resources, RAW:EVST |
| `ENGL M1026` | Literature by and About Women | `0.417` | 3 | English, RAW:GWOS |

## Apply gate

**✅ READY FOR APPLY** — all four gates PASS, collisions empty.

## Gates

- ✅ **V1_every_split_yields_a_group**: PASS
- ✅ **V2_member_conservation**: PASS
  - global split member sum 4590 == orig sum 4590
- ✅ **V3_collision_free**: PASS
  - 0 collision(s) (see `collisions.json` — must be 0)
- ✅ **V4_article_routability**: PASS
  - routable 92 · multi 6 · unroutable 0

## Split-factor distribution

How many discipline pieces each SPLIT M-ID partitions into (held M-IDs excluded; keep-whole M-IDs are 1).

| pieces | M-IDs |
|---:|---:|
| 1 | 397 |
| 2 | 534 |
| 3 | 190 |
| 4 | 56 |
| 5 | 28 |
| 6 | 16 |
| 7 | 7 |
| 8 | 4 |
| 9 | 3 |
| 10 | 3 |
| 11 | 4 |
| 13 | 4 |
| 26 | 1 |

## Top 30 split previews

Old M-ID → its pieces (`discipline` (n_colleges col, kind, disc_source)). Ranked by split factor then member count. A `*(blank)*` piece is subject-separated for curator review.

| old M-ID | title | pieces |
|---|---|---|
| `MUSI M1512` | Independent Projects | Physical Education (1 col, sing, top_code) · *(blank: RAW:ET)* (1 col, sing, raw_subject) · Administration of Justice (1 col, sing, top_code) · Agricultural Production (1 col, sing, top_code) · Business (1 col, sing, top_code) · Chemistry (1 col, sing, subj4) · Communication Studies (1 col, sing, subj4) · Computer Information Systems (1 col, sing, top_code) · Dance (1 col, sing, subj4) · Electronics (1 col, sing, top_code) · English (1 col, sing, subj4) · Geography (1 col, sing, subj4) · History (1 col, sing, subj4) · Interior Design (1 col, sing, top_code) · Machine Tool Technology (1 col, sing, top_code) · Mathematics (1 col, sing, subj4) · Multimedia (1 col, sing, top_code) · Music (1 col, sing, top_code) · Office Technologies (1 col, sing, top_code) · Political Science (1 col, sing, top_code) · *(blank: RAW:ASL)* (1 col, sing, raw_subject) · *(blank: RAW:CS)* (1 col, sing, raw_subject) · *(blank: RAW:FRCH)* (1 col, sing, raw_subject) · *(blank: RAW:ITAL)* (1 col, sing, raw_subject) · *(blank: RAW:WLDT)* (1 col, sing, raw_subject) · Theater Arts (1 col, sing, top_code) |
| `KINE M1606` | Introduction to Kinesiology | Physical Education (12 col, corr, top_code) · *(blank: RAW:KIN)* (13 col, keep, raw_subject) · *(blank: RAW:KINES)* (6 col, corr, raw_subject) · Kinesiology (5 col, corr, subj4) · *(blank: RAW:EXSC)* (3 col, corr, raw_subject) · Health (2 col, corr, top_code) · *(blank: RAW:KINS)* (2 col, corr, raw_subject) · *(blank: RAW:KNES)* (2 col, corr, raw_subject) · *(blank: RAW:PE)* (2 col, corr, raw_subject) · *(blank: RAW:KIN MAJ)* (1 col, sing, raw_subject) · *(blank: RAW:KINL)* (1 col, sing, raw_subject) · *(blank: RAW:Kinesiology (KIN))* (1 col, sing, raw_subject) · *(blank: RAW:PET)* (1 col, sing, raw_subject) |
| `PSYC M1092` | Human Sexuality | Psychology (15 col, keep, subj4) · Health (7 col, corr, subj4) · *(blank: RAW:PSYCH)* (5 col, corr, raw_subject) · *(blank: RAW:SOC)* (6 col, corr, raw_subject) · Biological Sciences (5 col, corr, subj4) · *(blank: RAW:PSY)* (5 col, corr, raw_subject) · *(blank: RAW:IDS)* (2 col, corr, raw_subject) · Humanities (1 col, sing, subj4) · *(blank: RAW:BEHS)* (1 col, sing, raw_subject) · *(blank: RAW:IDST)* (1 col, sing, raw_subject) · *(blank: RAW:Psychology (PSYCH))* (1 col, sing, raw_subject) · Social Science (1 col, sing, top_code) · Sociology (1 col, sing, subj4) |
| `ARTS M1376` | Portfolio Development | Multimedia (3 col, corr, subject_map) · Interior Design (3 col, corr, subj4) · Art (2 col, keep, top_code) · Computer Information Systems (2 col, corr, subject_map) · Fashion and Related Technologies (2 col, corr, subj4) · Graphic Arts (2 col, corr, top_code) · *(blank: RAW:ARC)* (2 col, corr, raw_subject) · *(blank: RAW:PHOTO)* (2 col, corr, raw_subject) · Broadcasting Technology (1 col, sing, top_code) · Counseling (1 col, sing, subj4) · Media Production (1 col, sing, top_code) · Photography (1 col, sing, subj4) · *(blank: RAW:ART)* (1 col, sing, raw_subject) |
| `ETHS M1232` | Field Studies | Biological Sciences (2 col, corr, top_code) · Earth Science (1 col, sing, subj4) · Economics (1 col, sing, subj4) · Emergency Medical Technologies (1 col, sing, top_code) · English (1 col, sing, subj4) · Ethnic Studies (1 col, sing, top_code) · Geography (1 col, sing, subj4) · History (1 col, sing, subj4) · Music (1 col, sing, top_code) · Political Science (1 col, sing, top_code) · *(blank: RAW:BUS)* (1 col, sing, raw_subject) · *(blank: RAW:PSYCH)* (1 col, sing, raw_subject) · *(blank: RAW:SOCIO)* (1 col, sing, raw_subject) |
| `HLTH M1139` | Introduction to Public Health | Health (31 col, keep, subj4) · Physical Education (2 col, corr, top_code) · *(blank: RAW:PH)* (1 col, sing, raw_subject) · Biological Sciences (1 col, sing, top_code) · *(blank: RAW:APHC)* (1 col, sing, raw_subject) · *(blank: RAW:HCRS)* (1 col, sing, raw_subject) · *(blank: RAW:Health Education (HED))* (1 col, sing, raw_subject) · *(blank: RAW:KIN)* (1 col, sing, raw_subject) · *(blank: RAW:NTR)* (1 col, sing, raw_subject) · *(blank: RAW:PUB)* (1 col, sing, raw_subject) · *(blank: RAW:PUBH)* (1 col, sing, raw_subject) |
| `KINE M1632` | Stress Management | Health (6 col, corr, top_code) · Physical Education (5 col, corr, top_code) · *(blank: RAW:PSYCH)* (3 col, keep, raw_subject) · Business (1 col, sing, top_code) · Counseling (1 col, sing, subj4) · Kinesiology (1 col, sing, subj4) · Management (1 col, sing, subj4) · *(blank: RAW:ALCB)* (1 col, sing, raw_subject) · *(blank: RAW:HEAL)* (1 col, sing, raw_subject) · *(blank: RAW:ST)* (1 col, sing, raw_subject) · *(blank: RAW:WORK)* (1 col, sing, raw_subject) |
| `ESLN M1001` | Intermediate Conversation | *(blank: RAW:ESL NC)* (5 col, keep, raw_subject) · *(blank: RAW:ESL)* (2 col, corr, raw_subject) · *(blank: RAW:SPA)* (3 col, corr, raw_subject) · *(blank: RAW:FR)* (1 col, sing, raw_subject) · Foreign Languages (1 col, sing, subject_map) · *(blank: RAW:AESL)* (1 col, sing, raw_subject) · *(blank: RAW:ARA)* (1 col, sing, raw_subject) · *(blank: RAW:ELDN)* (1 col, sing, raw_subject) · *(blank: RAW:FREN)* (1 col, sing, raw_subject) · *(blank: RAW:ITAL)* (1 col, sing, raw_subject) · *(blank: RAW:SPAN)* (1 col, sing, raw_subject) |
| `OTEC M1213` | Medical Office Procedures | Health Care Ancillaries (3 col, corr, top_code) · Office Technologies (3 col, keep, subject_map) · *(blank: RAW:BOT)* (2 col, corr, raw_subject) · *(blank: RAW:GNBUS)* (2 col, corr, raw_subject) · *(blank: RAW:HCRS)* (1 col, sing, raw_subject) · *(blank: RAW:BUS)* (1 col, sing, raw_subject) · *(blank: RAW:CAWT)* (1 col, sing, raw_subject) · *(blank: RAW:CIT)* (1 col, sing, raw_subject) · *(blank: RAW:MDA)* (1 col, sing, raw_subject) · *(blank: RAW:MEDA)* (1 col, sing, raw_subject) · *(blank: RAW:OFTECH)* (1 col, sing, raw_subject) |
| `GEOG M1036` | Weather and Climate | Geography (12 col, keep, subj4) · Earth Science (3 col, corr, subj4) · *(blank: RAW:PHYN)* (3 col, corr, raw_subject) · *(blank: RAW:GEG)* (2 col, corr, raw_subject) · Physical Sciences (1 col, sing, top_code) · *(blank: RAW:EAS)* (1 col, sing, raw_subject) · *(blank: RAW:MET)* (1 col, sing, raw_subject) · *(blank: RAW:PGEOG)* (1 col, sing, raw_subject) · *(blank: RAW:PHS)* (1 col, sing, raw_subject) · *(blank: RAW:PHSC)* (1 col, sing, raw_subject) |
| `MATH M1237` | Introduction to Data Science | Mathematics (7 col, keep, top_code) · Computer Information Systems (2 col, corr, top_code) · Computer Science (2 col, corr, top_code) · Office Technologies (1 col, sing, top_code) · *(blank: RAW:CS)* (2 col, corr, raw_subject) · *(blank: RAW:C S)* (1 col, sing, raw_subject) · *(blank: RAW:CIS)* (1 col, sing, raw_subject) · *(blank: RAW:COMPSCI)* (1 col, sing, raw_subject) · *(blank: RAW:CSCI)* (1 col, sing, raw_subject) · *(blank: RAW:DS)* (1 col, sing, raw_subject) |
| `EDUC M1041` | Tutor Training | Education (5 col, keep, subj4) · *(blank: RAW:LA)* (2 col, corr, raw_subject) · *(blank: RAW:LST)* (1 col, sing, raw_subject) · Interior Design (1 col, sing, subj4) · Mathematics (1 col, sing, subj4) · *(blank: RAW:ASC)* (1 col, sing, raw_subject) · *(blank: RAW:EDUCC)* (1 col, sing, raw_subject) · *(blank: RAW:INS)* (1 col, sing, raw_subject) · *(blank: RAW:PDC)* (1 col, sing, raw_subject) · *(blank: RAW:ST)* (1 col, sing, raw_subject) |
| `FIMS M1084` | Introduction to Film | Theater Arts (6 col, corr, top_code) · English (4 col, corr, subj4) · *(blank: RAW:FILM)* (4 col, corr, raw_subject) · *(blank: RAW:TAFILM)* (3 col, keep, raw_subject) · Media Production (2 col, corr, top_code) · Broadcasting Technology (1 col, sing, top_code) · *(blank: RAW:FTV)* (1 col, sing, raw_subject) · *(blank: RAW:HUM)* (1 col, sing, raw_subject) · *(blank: RAW:RTVF)* (1 col, sing, raw_subject) |
| `HLTH M1145` | Health and Social Justice | Health (13 col, keep, subj4) · *(blank: RAW:PH)* (1 col, sing, raw_subject) · Physical Education (1 col, sing, subject_map) · *(blank: RAW:ALD HTH)* (1 col, sing, raw_subject) · *(blank: RAW:KIN)* (1 col, sing, raw_subject) · *(blank: RAW:PHS)* (1 col, sing, raw_subject) · *(blank: RAW:PHSC)* (1 col, sing, raw_subject) · *(blank: RAW:SOC)* (1 col, sing, raw_subject) · *(blank: RAW:SOC S)* (1 col, sing, raw_subject) |
| `KINE M1652` | Sport Psychology | Physical Education (7 col, corr, top_code) · *(blank: RAW:KIN)* (3 col, keep, raw_subject) · Psychology (2 col, corr, subj4) · *(blank: RAW:KINES)* (2 col, corr, raw_subject) · *(blank: RAW:PE)* (2 col, corr, raw_subject) · *(blank: RAW:PSYCH)* (2 col, corr, raw_subject) · Health (1 col, sing, subj4) · *(blank: RAW:KIINES)* (1 col, sing, raw_subject) · *(blank: RAW:KNPR)* (1 col, sing, raw_subject) |
| `ARTS M1338` | History of Graphic Design | Graphic Arts (10 col, corr, top_code) · Multimedia (8 col, corr, top_code) · Art (1 col, sing, top_code) · Art History (1 col, sing, subj4) · Commercial Art (1 col, sing, subj4) · *(blank: RAW:ART)* (1 col, sing, raw_subject) · *(blank: RAW:DAID)* (1 col, sing, raw_subject) · *(blank: RAW:MAD)* (1 col, sing, raw_subject) |
| `BIOL M1201` | Environmental Science | Biological Sciences (8 col, keep, subj4) · Forestry/Natural Resources (4 col, corr, top_code) · *(blank: RAW:ENVS)* (3 col, corr, raw_subject) · *(blank: RAW:BIO)* (2 col, corr, raw_subject) · *(blank: RAW:ENVIR)* (2 col, corr, raw_subject) · Earth Science (1 col, sing, subj4) · Environmental Technologies (1 col, sing, top_code) · *(blank: RAW:Environmental Science (ENVIR))* (1 col, sing, raw_subject) |
| `KINE M1136` | First Aid and CPR | *(blank: RAW:KIN)* (4 col, keep, raw_subject) · Health (3 col, corr, top_code) · *(blank: RAW:KIN MAJ)* (2 col, corr, raw_subject) · Emergency Medical Technologies (1 col, sing, top_code) · Physical Education (1 col, sing, top_code) · *(blank: RAW:AH)* (1 col, sing, raw_subject) · *(blank: RAW:HEA)* (1 col, sing, raw_subject) · *(blank: RAW:NHSN)* (1 col, sing, raw_subject) |
| `ENGL M1102` | Film Appreciation | Theater Arts (4 col, corr, top_code) · English (3 col, keep, subj4) · *(blank: RAW:CINE)* (1 col, sing, raw_subject) · *(blank: RAW:ECOL)* (1 col, sing, raw_subject) · *(blank: RAW:FMA)* (1 col, sing, raw_subject) · *(blank: RAW:HUMAN)* (1 col, sing, raw_subject) · *(blank: RAW:HUMN)* (1 col, sing, raw_subject) · *(blank: RAW:LLS)* (1 col, sing, raw_subject) |
| `CISC M1301` | Computer Literacy | Office Technologies (7 col, corr, subject_map) · *(blank: RAW:CIS)* (6 col, keep, raw_subject) · Computer Information Systems (2 col, corr, top_code) · *(blank: RAW:CS)* (2 col, corr, raw_subject) · *(blank: RAW:APTE)* (1 col, sing, raw_subject) · *(blank: RAW:CIT)* (1 col, sing, raw_subject) · *(blank: RAW:CL)* (1 col, sing, raw_subject) |
| `NUTR M1056` | Sports Nutrition | Dietetics/Nutritional Science (6 col, keep, subj4) · Culinary Arts/Food Technology (4 col, corr, top_code) · Health (5 col, corr, subj4) · *(blank: RAW:KIN)* (2 col, corr, raw_subject) · Biological Sciences (1 col, sing, subj4) · *(blank: RAW:NF)* (1 col, sing, raw_subject) · *(blank: RAW:PEMA)* (1 col, sing, raw_subject) |
| `BIOL M1262` | Pathophysiology | Biological Sciences (4 col, keep, subj4) · Health Care Ancillaries (3 col, corr, top_code) · *(blank: RAW:DMS)* (2 col, corr, raw_subject) · Nursing (1 col, sing, top_code) · *(blank: RAW:BIO)* (1 col, sing, raw_subject) · *(blank: RAW:NURS)* (1 col, sing, raw_subject) · *(blank: RAW:PTA)* (1 col, sing, raw_subject) |
| `OTEC M9057` | Introduction to Computers | Office Technologies (5 col, keep, top_code) · Disabled Student Programs and (2 col, corr, subj4) · Computer Information Systems (1 col, sing, top_code) · Older Adults: Noncredit (1 col, sing, subj4) · Plumbing (1 col, sing, subj4) · *(blank: RAW:COSA)* (1 col, sing, raw_subject) · *(blank: RAW:INFS)* (1 col, sing, raw_subject) |
| `BUSI M9084` | Communication in the Workplace | Business (3 col, keep, top_code) · Management (3 col, corr, subj4) · *(blank: RAW:AEWP)* (1 col, sing, raw_subject) · *(blank: RAW:BSM)* (1 col, sing, raw_subject) · *(blank: RAW:NCWFP)* (1 col, sing, raw_subject) · *(blank: RAW:WORK)* (1 col, sing, raw_subject) · *(blank: RAW:WORKNC)* (1 col, sing, raw_subject) |
| `OTEC M1106` | Medical Coding | *(blank: RAW:BOT)* (2 col, keep, raw_subject) · *(blank: RAW:GNBUS)* (2 col, corr, raw_subject) · Health Care Ancillaries (1 col, sing, top_code) · *(blank: RAW:BIS)* (1 col, sing, raw_subject) · *(blank: RAW:BUS)* (1 col, sing, raw_subject) · *(blank: RAW:MAP)* (1 col, sing, raw_subject) · *(blank: RAW:Medical Assisting (MA))* (1 col, sing, raw_subject) |
| `ARTS M1502` | INDEPEN STUDY | Art (1 col, sing, subj4) · Dietetics/Nutritional Science (1 col, sing, subj4) · Interior Design (1 col, sing, top_code) · *(blank: RAW:GERMAN)* (1 col, sing, raw_subject) · *(blank: RAW:HEBREW)* (1 col, sing, raw_subject) · *(blank: RAW:ITAL)* (1 col, sing, raw_subject) · *(blank: RAW:PHOTO)* (1 col, sing, raw_subject) |
| `COMM M1076` | Voice and Diction | Communication Studies (6 col, keep, subj4) · Theater Arts (5 col, corr, subj4) · *(blank: RAW:SPCH)* (2 col, corr, raw_subject) · Drama/Theater Arts (1 col, sing, subj4) · *(blank: RAW:SPEECH)* (1 col, sing, raw_subject) · *(blank: RAW:THART)* (1 col, sing, raw_subject) |
| `ARTS M1363` | Introduction to Web Design | Multimedia (3 col, corr, top_code) · Computer Information Systems (3 col, corr, top_code) · Art (1 col, sing, top_code) · Office Technologies (1 col, sing, top_code) · *(blank: RAW:ART)* (1 col, sing, raw_subject) · *(blank: RAW:INFS)* (1 col, sing, raw_subject) |
| `ENGL M1111` | Basic Reading | English (2 col, keep, subj4) · Reading (3 col, corr, subj4) · *(blank: RAW:EMLS)* (1 col, sing, raw_subject) · *(blank: RAW:ABSE)* (1 col, sing, raw_subject) · *(blank: RAW:DSL)* (1 col, sing, raw_subject) · *(blank: RAW:ESL)* (1 col, sing, raw_subject) |
| `GEOG M1031` | Global Climate Change | Geography (4 col, keep, subj4) · Earth Science (2 col, corr, subj4) · Physical Sciences (2 col, corr, top_code) · Biological Sciences (1 col, sing, subj4) · *(blank: RAW:ENV SCI)* (1 col, sing, raw_subject) · *(blank: RAW:ENVS)* (1 col, sing, raw_subject) |

## Review-hold (curator veto)

**52** flagged M-IDs held — NOT split (kept old id). High-precision heuristic: known sister-pair split OR an interdisciplinary-compound title token.

| M-ID | title | reason | disciplines / tokens |
|---|---|---|---|
| `ARTS M1014` | COMPUTER GRAPHICS 2: 3D COMPUTER GRAPHIC | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1035` | 3D Texturing and Lighting | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1139` | DIGITAL ART | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1187` | Introduction to Digital Arts | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1312` | Introduction to Computer Graphics | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1373` | Designing for the Web | sister_pair | Graphic Arts, Multimedia |
| `ARTS M1450` | Fundamentals of Typography | sister_pair | Graphic Arts, Multimedia |
| `BIOL M1205` | Ethnobotany/Ethnoecology Lab | interdisciplinary_token | ethnobotany, ethnoecology |
| `BIOL M1206` | Ethnoecology | interdisciplinary_token | ethnoecology |
| `BUSI M1126` | Microsoft Applications for Business | sister_pair | Computer Information Systems, Office Technologies |
| `BUSI M1190` | Business Information Systems | sister_pair | Computer Information Systems, Office Technologies |
| `BUSI M1412` | MULTIMEDIA PRESENTATIONS---POWERPOINT | sister_pair | Computer Information Systems, Office Technologies |
| `BUSI M9024` | ADVANCED MICROSOFT WORD | sister_pair | Business, Office Technologies |
| `CISC M1043` | Microsoft Access: Comprehensive | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1078` | ADVANCED WEB APPLICATION DEVELOPMENT | sister_pair | Computer Information Systems, Computer Science |
| `CISC M1186` | Building Business Web Sites | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1377` | DESIGNING WEB GRAPHICS | sister_pair | Computer Information Systems, Computer Science |
| `CISC M1522` | Introduction to WordPress | sister_pair | Computer Information Systems, Office Technologies |
| `CISC M1575` | Server-Side Ruby Web Programming | sister_pair | Computer Information Systems, Computer Science |
| `CISC M9047` | Business Web Graphics | sister_pair | Computer Information Systems, Office Technologies |
| `FIMS M1102` | Introduction to Multimedia | sister_pair | Graphic Arts, Multimedia |
| `FIRE M1348` | Health and Fitness for the Fire Service | sister_pair | Kinesiology, Physical Education |
| `GRAF M1003` | Typography 2 | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1014` | Advanced Typography | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1036` | Typography and Graphic Design | sister_pair | Graphic Arts, Multimedia |
| `GRAF M1057` | Storyboarding | sister_pair | Graphic Arts, Multimedia |
| `JOUR M1015` | Basic Photojournalism | interdisciplinary_token | photojournalism |
| `JOUR M1094` | Photojournalism | interdisciplinary_token | photojournalism |
| `KINE M1184` | Clinical Experiences in Athletic Trainin | sister_pair | Kinesiology, Physical Education |
| `KINE M1185` | Clinical Experiences in Athletic Trainin | sister_pair | Kinesiology, Physical Education |
| `KINE M1675` | Spinning | sister_pair | Kinesiology, Physical Education |
| `MULT M1001` | User Experience Design 1 | sister_pair | Graphic Arts, Multimedia |
| `MULT M1002` | User Experience Design 2 | sister_pair | Graphic Arts, Multimedia |
| `MULT M1018` | 3D Animation and Modeling | sister_pair | Graphic Arts, Multimedia |
| `MULT M1036` | Animation | sister_pair | Graphic Arts, Multimedia |
| `MULT M1062` | Motion Graphics, Compositing and Visual  | sister_pair | Graphic Arts, Multimedia |
| `MULT M1070` | Digital Illustration for Graphic Design  | sister_pair | Graphic Arts, Multimedia |
| `MULT M1072` | Digital Illustration for Graphic Design  | sister_pair | Graphic Arts, Multimedia |
| `MULT M1082` | MOBILE GAME DESIGN | sister_pair | Graphic Arts, Multimedia |
| `MULT M1084` | Graphic Design Studio II | sister_pair | Graphic Arts, Multimedia |
| `MULT M1099` | Fundamentals of Digital Media | sister_pair | Graphic Arts, Multimedia |
| `MULT M1100` | Digital Illustration II | sister_pair | Graphic Arts, Multimedia |
| `MULT M1106` | Introduction to Digital Painting | sister_pair | Graphic Arts, Multimedia |
| `MUSI M1118` | JAZZ LAB BAND | sister_pair | Commercial Music, Music |
| `NUTR M1057` | Topics in Nutrition | sister_pair | Culinary Arts/Food Technology, Dietetics/Nutritional Science |
| `OTEC M1036` | Advanced Excel | sister_pair | Computer Information Systems, Office Technologies |
| `OTEC M1078` | Beginning Word Processing | sister_pair | Business, Office Technologies |
| `OTEC M1124` | Introduction to Computers and Keyboardin | sister_pair | Computer Information Systems, Office Technologies |
| `OTEC M1223` | Microsoft Project | sister_pair | Computer Information Systems, Office Technologies |
| `PHOT M1034` | BEGINNING PHOTOJOURNALISM | interdisciplinary_token | photojournalism |
| `PHYS M9002` | Adapted Body Conditioning | sister_pair | Kinesiology, Physical Education |
| `VOCE M9045` | COMPUTER LITERACY FOR COLLEGE | sister_pair | Computer Information Systems, Office Technologies |

## Articulation impact

- Articulations referencing flagged M-IDs: **98** (across 66 M-IDs).
- Routing (primary: earned_by_colleges ∩ piece colleges; fallback: top_code division): routable **92**, multi **6**, unroutable **0**.

## Cluster member-ref impact

- Clusters in `coci_unified_courses.json` with ≥1 flagged member: **52**.
- Sample old-member → new-id(s) mappings:
  - `UC-00126` · `GRAF M1005` → ['GRAF M1005']
  - `UC-00159` · `KINE M1092` → ['PHYS M14CN', 'KINS M10AB']
  - `UC-00174` · `KINE M1103` → ['PHYS M14CP', 'KINS M10AD']
  - `UC-00191` · `ARCH M1020` → ['DRAF M1012']
  - `UC-00210` · `DANC M1051` → ['DANC M11WE']
  - `UC-00281` · `HLTH M1026` → ['OTEC M10QR', 'MEDA M10AB']
  - `UC-00311` · `KINE M1156` → ['PHYS M1421', 'KINS M10AG']
  - `UC-00312` · `KINE M1157` → ['KINE M12FS', 'KINE M12FT']
  - `UC-00395` · `DANC M9005` → ['PHYS M9023', 'DANC M90AC']
  - `UC-00404` · `KINE M1213` → ['PHYS M14DI', 'KINE M12GB']
  - `UC-00409` · `BIOL M1047` → ['BIOL M11BL']
  - `UC-00465` · `KINE M1272` → ['PHYS M1817', 'KINS M10AJ']
  - `UC-00475` · `BUSI M1141` → ['OTEC M1148']
  - `UC-00489` · `PSYC M1035` → ['PSYC M10KU']
  - `UC-00490` · `PSYC M1037` → ['PSYC M10KV', 'PSYC M10KW', 'PSYC M1037']

## How to proceed

1. Review the split previews + the review-hold list. Confirm the held set looks like genuine interdisciplinary courses.
2. Re-run `python3 kb/_overmerge_dryrun.py` after any auditor / canonical-map refresh to see the impact move.
3. When all four gates are ✅, the apply step (`kb/_overmerge_apply.py` + Supabase + `workflow_dispatch`) re-keys minted M-IDs, memberships, articulations, and cluster member-refs atomically in one cron window.
4. Rollback inverse alias lives in `kb/overmerge_out/2026-05-29/alias_map.json`.
