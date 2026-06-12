# Auto-merge pass 1 — DRY-RUN plan (2026-06-12)

Worklist payload: `2026-06-12 22:14` · curation overlay: synced same run · marker: `automerge-v1` · **nothing applied**.

## Planned: **2292 groups** → 3589 merge rows + 2270 title rows (5859 curation upserts)

| lane | planned |
|---|---|
| anchored (merge into existing identity) | 1351 |
| singleton (mint new unified course) | 941 |

## Excluded (stays human / already handled)

| reason | groups |
|---|---|
| anchored: Keep-as-is dismissed | 4 |
| anchored: band mix credit/noncredit (stays human) | 231 |
| singleton: band mix credit/noncredit (stays human) | 94 |
| singleton: same_college (stays human) | 214 |

## Units spread across planned groups (2292)

| spread | groups |
|---|---|
| 0 (uniform) | 1193 |
| ≤1u | 740 |
| ≤2u | 192 |
| ≤4u | 127 |
| >4u | 40 |

## Title regularizations (16 of 2292 planned groups)

First 25 (longest-member title → chosen unified title):

- `Women in American History - HONORS` → **Women in American History Honors**
- `American Sign Language 2 - Honors` → **American Sign Language 2 Honors**
- `History of California - HONORS` → **History of California Honors**
- `Introduction to Religious Studies - Honors` → **Introduction to Religious Studies Honors**
- `General Biology - Honors` → **General Biology Honors**
- `Introduction to Film Studies, Honors` → **Introduction to Film Studies Honors**
- `Introduction to the Theatre - Honors` → **Introduction to the Theatre Honors**
- `American Sign Language 1 - Honors` → **American Sign Language 1 Honors**
- `International Political Economy - Honors` → **International Political Economy Honors**
- `American Sign Language 3 - Honors` → **American Sign Language 3 Honors**
- `Composition and Critical Thinking - Honors` → **Composition and Critical Thinking Honors**
- `Rock Music History and Appreciation - Honors` → **Rock Music History and Appreciation Honors**
- `The Anthropology of Magic, Witchcraft, and Religion - Honors` → **The Anthropology of Magic, Witchcraft, and Religion Honors**
- `Dance History and Appreciation - Honors` → **Dance History and Appreciation Honors**
- `Introduction to Asian American Studies - Honors` → **Introduction to Asian American Studies Honors**
- `Astronomy with Lab - Honors` → **Astronomy with Lab Honors**

## Random sample of 60 planned groups (seeded — reproducible)

### anchored → `CSIS M1395` (M-ID) · title: unchanged → **Information Systems Security**
- `CSIS M1395` (M-ID) Information Systems Security · 3.0u
- `CSIS M12FJ` (Stand-Alone) Information Security Systems · 3.0u

### singleton → `UC-CUR-AUTOEFB58642` (Unified (new)) · title: unchanged → **Acting for Film and Television 3**
- `THEA M10HS` (Stand-Alone) Acting/Film & Television 3 · 3.0u
- `THEA M10HT` (Stand-Alone) Acting for Film and Television 3 · 3.0u

### singleton → `UC-CUR-AUTO6E038E55` (Unified (new)) · title: unchanged → **Hospitality and Tourism Marketing**
- `FCSH M10HO` (Stand-Alone) Hospitality and Tourism Marketing · 3.0u
- `MRKT M10BO` (Stand-Alone) Tourism and Hospitality Marketing · 3.0u

### anchored → `BIOL M1100` (M-ID) · title: unchanged → **Genetics and Molecular Biology**
- `BIOL M1100` (M-ID) Genetics and Molecular Biology · 5.0u
- `BIOL M10OJ` (Stand-Alone) Molecular Biology & Genetics · 4.0u

### singleton → `UC-CUR-AUTOBB9F2C53` (Unified (new)) · title: unchanged → **Network and Systems Security**
- `CSIS M12LC` (Stand-Alone) Network Systems Security · 4.0u
- `CSIS M12LD` (Stand-Alone) Network and Systems Security · 3.0u

### anchored → `CULN M1124` (M-ID) · title: unchanged → **Food and Wine Pairing**
- `CULN M1124` (M-ID) Food and Wine Pairing · 2.0u
- `CULN M10VL` (Stand-Alone) Wine and Food Pairing · 1.5u
- `AGPR M10EO` (Stand-Alone) Pairing Wine and Food · 0.5u

### anchored → `CRIM M1027` (M-ID) · title: unchanged → **Basic Police Academy, Module 3**
- `CRIM M1027` (M-ID) Basic Police Academy Module 3 · 7.0u
- `CRIM M10BO` (Stand-Alone) Basic Police Academy, Module 3 · 6.0u

### singleton → `UC-CUR-AUTO5B811454` (Unified (new)) · title: unchanged → **Dispatcher Update, Public Safety**
- `CRIM M11HB` (Stand-Alone) Dispatcher Update, Public Safety · 1.0u
- `CRIM M11HC` (Stand-Alone) Public Safety Dispatcher-Update · 1.0u

### singleton → `UC-CUR-AUTO9C41E251` (Unified (new)) · title: unchanged → **Topics in Architecture**
- `ARCH M10KY` (Stand-Alone) Topics in Architecture · 0.3u
- `ARCH M10KX` (Stand-Alone) Architecture Topics · 1.0u

### anchored → `KINE M1065` (M-ID) · title: unchanged → **Advanced Care and Prevention of Athletic Injuries**
- `KINE M1065` (M-ID) Advanced Care and Prevention of Athletic Injuries · 3.0u
- `KINE M10LC` (Stand-Alone) Advanced Prevention and Care of Athletic Injuries · 3.0u

### anchored → `CRIM M1135` (M-ID) · title: unchanged → **Control and Supervision in Corrections**
- `CRIM M1135` (M-ID) Control and Supervision in Corrections · 3.0u
- `PUBS M10AG` (Stand-Alone) Control and Supervision in Corrections · 3.0u

### singleton → `UC-CUR-AUTO635E63B8` (Unified (new)) · title: unchanged → **Conditioning Dance: Pilates 3**
- `DANC M10ZL` (Stand-Alone) Conditioning Dance: Pilates 3 · 2.0u
- `DANC M10ZM` (Stand-Alone) Dance Conditioning/Pilates 3 · 0.5u

### singleton → `UC-CUR-AUTO0714D921` (Unified (new)) · title: unchanged → **Dance Ensemble Performance**
- `DANC M11DR` (Stand-Alone) Dance Ensemble Performance · 2.0u
- `DANC M11DS` (Stand-Alone) Performance Dance Ensemble · 1.0u

### anchored → `MUSI M1518` (M-ID) · title: unchanged → **A Survey of World Music**
- `MUSI M1518` (M-ID) A Survey of World Music · 3.0u
- `MUSI M12PM` (Stand-Alone) Survey of World Music · 3.0u

### anchored → `KINE M1297` (M-ID) · title: unchanged → **Rock Climbing: Beginning (Bay Area)**
- `KINE M1297` (M-ID) Beginning Rock Climbing · 1.0u
- `WELD M10MU` (Stand-Alone) Rock Climbing: Beginning · 1.5u
- `WELD M10LD` (Stand-Alone) Rock Climbing: Beginning (Bay Area) · 1.8u
- `WELD M10MV` (Stand-Alone) Rock Climbing: Beginning (Tahoe) · 1.8u

### singleton → `UC-CUR-AUTOB8530F6C` (Unified (new)) · title: unchanged → **Elementary Filipino (Tagalog)**
- `FILI M10AB` (Stand-Alone) Elementary Filipino · 5.0u
- `FLTA M10AI` (Stand-Alone) Elementary Filipino (Tagalog) · 5.0u

### singleton → `UC-CUR-AUTO80AA4692` (Unified (new)) · title: unchanged → **Geologic Field Studies of the Mojave Desert**
- `GEOL M10EA` (Stand-Alone) Geologic Field Studies - Mojave Desert · 2.0u
- `GEOL M10EB` (Stand-Alone) Geologic Field Studies of the Mojave Desert · 1.0u

### singleton → `UC-CUR-AUTOAB4F679E` (Unified (new)) · title: unchanged → **Technology and Ethics**
- `PHIL M10FB` (Stand-Alone) Ethics of Technology · 3.0u
- `PHIL M10FC` (Stand-Alone) Technology and Ethics · 3.0u

### anchored → `BUSI M1195` (M-ID) · title: unchanged → **Business Management**
- `BUSI M1195` (M-ID) Business Management · 3.0u
- `BUSI M10VE` (Stand-Alone) Management-Business · 3.0u

### anchored → `REAL M1022` (M-ID) · title: unchanged → **Real Estate Economics**
- `REAL M1022` (M-ID) Real Estate Economics · 3.0u
- `REAL M10AH` (Stand-Alone) Real Estate Economics · 3.0u

### singleton → `UC-CUR-AUTOD5BDF89D` (Unified (new)) · title: unchanged → **Hazardous Materials Management (HMM) Applications**
- `ESCI M10CY` (Stand-Alone) Hazardous Materials Management (HMM) Applications · 4.0u
- `ELET M10DT` (Stand-Alone) Hazardous Materials Management Applications · 4.0u

### anchored → `DANC M1227` (M-ID) · title: unchanged → **Dance Production 1**
- `DANC M1227` (M-ID) Dance Production 1 · 2.0u
- `DANC M10BC` (Stand-Alone) Dance Production 1 · 1.0u

### anchored → `COUN M1074` (M-ID) · title: unchanged → **Orientation to College**
- `COUN M1074` (M-ID) College Orientation · 1.0u
- `COUN M1075` (M-ID) Orientation to College · 0.5u
- `COUN M10MN` (Stand-Alone) Orientation/College · 0.5u

### singleton → `UC-CUR-AUTO7636966D` (Unified (new)) · title: unchanged → **Polynesian Dance 2**
- `DANC M10DA` (Stand-Alone) Polynesian Dance 2 · 1.0u
- `DANC M11JU` (Stand-Alone) Polynesian Dance 2 · 1.0u

### anchored → `CNST M1047` (M-ID) · title: unchanged → **Methods of Construction**
- `CNST M1047` (M-ID) Construction Methods · 3.0u
- `ARCH M10NS` (Stand-Alone) Methods of Construction · 2.0u

### singleton → `UC-CUR-AUTO0E630885` (Unified (new)) · title: unchanged → **Natural Hazards and Disasters**
- `GEOG M10EI` (Stand-Alone) Natural Hazards and Disasters · 3.0u
- `PHSC M10DX` (Stand-Alone) Natural Disasters and Hazards · 3.0u

### anchored → `FLFR M1048` (M-ID) · title: unchanged → **Topics in French**
- `FLFR M1048` (M-ID) Topics in French · 0.3u
- `FLFR M10DU` (Stand-Alone) French Topics · 0.5u

### anchored → `DANC M1080` (M-ID) · title: unchanged → **Intermediate Ballet A**
- `DANC M1080` (M-ID) Intermediate Ballet · 1.0u
- `DANC M1081` (M-ID) Intermediate Ballet A · 2.0u
- `DANC M1082` (M-ID) Ballet - Intermediate · 1.0u
- `DANC M10BK` (Stand-Alone) Intermediate Ballet · 1.5u

### singleton → `UC-CUR-AUTOB173E8B2` (Unified (new)) · title: unchanged → **Principles of Graphic Design**
- `GRAF M10AI` (Stand-Alone) Graphic Design Principles · 3.0u
- `MULT M10PV` (Stand-Alone) Principles of Graphic Design · 3.0u

### anchored → `FIMS M1095` (M-ID) · title: unchanged → **Screenwriting: Intermediate**
- `FIMS M1095` (M-ID) Intermediate Screenwriting · 3.0u
- `ENGL M11GV` (Stand-Alone) Screenwriting: Intermediate · 3.0u

### anchored → `FIRE M1192` (M-ID) · title: unchanged → **Fire Control 4A (Ignitable Liquids and Gases Awareness/Operations)**
- `FIRE M1192` (M-ID) Fire Control 4A (Ignitable Liquids and Gases Awareness/Operations) · 0.3u
- `FIRE M10QI` (Stand-Alone) Fire Control 4A · 0.5u

### anchored → `CRIM M1086` (M-ID) · title: unchanged → **Requalification – Basic Course**
- `CRIM M1086` (M-ID) Requalification – Basic Course · 7.0u
- `CRIM M10QU` (Stand-Alone) Basic Course Requalification · 5.5u

### anchored → `OTEC M1172` (M-ID) · title: unchanged → **Filing and Records Management**
- `OTEC M1172` (M-ID) Filing/Records Management · 1.0u
- `BUSI M1303` (M-ID) Filing and Records Management · 3.0u
- `OTEC M1173` (M-ID) Records Management and Filing · 2.0u

### anchored → `ARCH M1021` (M-ID) · title: unchanged → **Introduction to Computer Aided Design (CAD)**
- `ARCH M1021` (M-ID) Introduction to Computer Aided Design · 3.0u
- `ENGR M10BA` (Stand-Alone) Introduction to Computer Aided Design (CAD) · 3.0u

### singleton → `UC-CUR-AUTO410E4B07` (Unified (new)) · title: unchanged → **Fundamentals of Digital Audio**
- `MULT M10JU` (Stand-Alone) Fundamentals of Digital Audio · 3.0u
- `MULT M10JV` (Stand-Alone) Digital Audio Fundamentals · 3.0u

### anchored → `PSYC M1083` (M-ID) · title: unchanged → **Psychology and Film**
- `PSYC M1083` (M-ID) Psychology in Film · 3.0u
- `PSYC M10HD` (Stand-Alone) Psychology of Film · 3.0u
- `PSYC M10HE` (Stand-Alone) Psychology and Film · 3.0u

### singleton → `UC-CUR-AUTO9D684DC7` (Unified (new)) · title: unchanged → **Low Intermediate ESL A**
- `ESOL M91KL` (Stand-Alone) ESL Low Intermediate · 0.0u
- `ESOL M91KM` (Stand-Alone) Low Intermediate ESL A · 0.0u

### anchored → `ATHL M1183` (M-ID) · title: unchanged → **Softball, Women, Off Season Intercollegiate**
- `ATHL M1183` (M-ID) Softball, Women, Off Season Intercollegiate · 1.0u
- `ATHL M10SD` (Stand-Alone) Intercollegiate Softball-Women Off Season · 1.0u
- `ATHL M10SC` (Stand-Alone) Off Season Intercollegiate Softball - Women · 1.0u

### singleton → `UC-CUR-AUTO44166FCD` (Unified (new)) · title: unchanged → **ESL - Writing A**
- `ESOL M91ME` (Stand-Alone) ESL Writing · 0.0u
- `ESOL M91MF` (Stand-Alone) ESL - Writing A · 0.0u

### anchored → `KINE M1725` (M-ID) · title: unchanged → **Weight Training 3**
- `KINE M1725` (M-ID) Weight Training 3 · 1.0u
- `KINE M10TT` (Stand-Alone) Weight Training 3 · 1.3u

### singleton → `UC-CUR-AUTOB45B60C2` (Unified (new)) · title: unchanged → **Sculpture: Intermediate Life**
- `ARTS M12CE` (Stand-Alone) Intermediate Life Sculpture · 3.0u
- `ARTS M12CF` (Stand-Alone) Sculpture: Intermediate Life · 3.0u

### anchored → `CSIS M1312` (M-ID) · title: unchanged → **Web Design 1**
- `CSIS M1312` (M-ID) Web Design 1 · 3.0u
- `GRAF M10AE` (Stand-Alone) Web Design 1 · 3.0u

### singleton → `UC-CUR-AUTOE2CBB7C6` (Unified (new)) · title: unchanged → **Furniture Design and Woodworking: Beginning**
- `ARTS M11AV` (Stand-Alone) Beginning Woodworking/Furniture Design · 1.0u
- `ARTS M11AW` (Stand-Alone) Furniture Design and Woodworking: Beginning · 3.0u

### anchored → `INTD M1007` (M-ID) · title: unchanged → **Kitchen and Bath Design**
- `INTD M1007` (M-ID) Kitchen & Bath Design · 2.0u
- `INTD M1008` (M-ID) Kitchen and Bath Design · 3.0u

### anchored → `AGRI M1085` (M-ID) · title: unchanged → **Facility Management for Food Safety**
- `AGRI M1085` (M-ID) Facility Management for Food Safety · 1.5u
- `AGRI M10RO` (Stand-Alone) Facility Food Safety Management · 3.0u

### anchored → `RECR M1001` (M-ID) · title: unchanged → **School-Age Child Care and Recreation Activities (DS5)**
- `RECR M1001` (M-ID) School-Age Child Care and Recreation Activities · 3.0u
- `ECED M10BF` (Stand-Alone) School-Age Child Care and Recreation Activities (DS5) · 3.0u

### anchored → `PSYC M1053` (M-ID) · title: unchanged → **An Introduction to Cognitive Psychology**
- `PSYC M1053` (M-ID) Introduction to Cognitive Psychology · 3.0u
- `PSYC M10EP` (Stand-Alone) An Introduction to Cognitive Psychology · 4.0u

### singleton → `UC-CUR-AUTOF908AD48` (Unified (new)) · title: unchanged → **Introduction to Radio, TV and Film**
- `MCOM M10AN` (Stand-Alone) Introduction to Radio, TV, Film · 3.0u
- `BCST M10HL` (Stand-Alone) Introduction to Radio, TV and Film · 3.0u

### singleton → `UC-CUR-AUTOBAB72585` (Unified (new)) · title: unchanged → **JavaScript for Web Development**
- `CISC M10OY` (Stand-Alone) Web Development - JavaScript · 3.0u
- `CISC M10OZ` (Stand-Alone) JavaScript for Web Development · 4.0u

### singleton → `UC-CUR-AUTO003AE051` (Unified (new)) · title: unchanged → **Intercollegiate Sports: Cross-Country (Women)**
- `ATHL M11CW` (Stand-Alone) Intercollegiate Sports-Cross Country · 3.0u
- `ATHL M11CX` (Stand-Alone) Intercollegiate Sports: Cross-Country (Women) · 3.0u

### anchored → `MUSI M1043` (M-ID) · title: unchanged → **The Music of Multicultural America**
- `MUSI M1043` (M-ID) Music of Multicultural America · 3.0u
- `MUSI M10LR` (Stand-Alone) The Music of Multicultural America · 3.0u
- `MUSI M10LS` (Stand-Alone) Multicultural Music in America · 3.0u

### anchored → `AUTO M1106` (M-ID) · title: unchanged → **Automotive Engine Repair (Lower End)**
- `AUTO M1106` (M-ID) Automotive Engine Repair · 4.0u
- `AUTO M10UD` (Stand-Alone) Automotive Engine Repair (Lower End) · 4.0u
- `AUTO M10UG` (Stand-Alone) Automotive Engine Repair (Upper End) · 4.0u

### singleton → `UC-CUR-AUTO44895F31` (Unified (new)) · title: unchanged → **General Astronomy of the Solar System**
- `ASTR M10AX` (Stand-Alone) General Astronomy of the Solar System · 3.0u
- `ASTR M10AY` (Stand-Alone) General Astronomy: Solar System · 5.0u

### singleton → `UC-CUR-AUTO53679748` (Unified (new)) · title: unchanged → **Elementary French (Second Semester)**
- `FLFR M10CL` (Stand-Alone) Elementary French (First Quarter) · 5.0u
- `FLFR M10CM` (Stand-Alone) Elementary French (First Semester) · 4.0u
- `FLFR M10CP` (Stand-Alone) Elementary French (Second Quarter) · 5.0u
- `FLFR M10CR` (Stand-Alone) Elementary French (Second Semester) · 4.0u
- `FLFR M10CQ` (Stand-Alone) Elementary French (Third Quarter) · 5.0u

### anchored → `CISC M1089` (M-ID) · title: unchanged → **Internet for Research**
- `CISC M1089` (M-ID) Internet for Research · 0.5u
- `CSIS M12GJ` (Stand-Alone) Internet Research · 2.0u

### anchored → `CSIS M1131` (M-ID) · title: unchanged → **Introduction to Artificial Intelligence (AI)**
- `CSIS M1131` (M-ID) Introduction to Artificial Intelligence · 3.0u
- `CISC M10DH` (Stand-Alone) Introduction to Artificial Intelligence (AI) · 3.0u

### anchored → `ARTS M1375` (M-ID) · title: unchanged → **Life Drawing - Intermediate**
- `ARTS M1375` (M-ID) Intermediate Life Drawing · 3.0u
- `ARTS M11SP` (Stand-Alone) Life Drawing - Intermediate · 3.0u
- `ARTD M10BH` (Stand-Alone) Drawing: Life-Intermediate · 3.0u

### anchored → `DENT M1092` (M-ID) · title: unchanged → **General and Oral Pathology**
- `DENT M1092` (M-ID) General and Oral Pathology · 4.0u
- `DENT M1093` (M-ID) General & Oral Pathology · 2.0u
- `HLTH M10YP` (Stand-Alone) Pathology-General and Oral · 3.0u

### anchored → `HIST M1081` (M-ID) · title: unchanged → **The Asian American in the History of the United States**
- `HIST M1081` (M-ID) The Asian American in the History of the United States · 3.0u
- `HIST M10LJ` (Stand-Alone) History of the Asian American in the United States · 3.0u

### anchored → `PLGL M1013` (M-ID) · title: unchanged → **Business Organizations**
- `PLGL M1013` (M-ID) Business Organizations · 3.0u
- `PLGL M10AF` (Stand-Alone) Business Organizations · 3.0u

## Apply procedure (NOT tonight — after Sam's skim)

1. Re-run this planner against fresh `main` (post-cron) in the apply sitting.
2. Execute `supabase_ops.sql` in batches via the Supabase session (ON CONFLICT DO NOTHING — human rows always win).
3. Fold the overlay (`kb/_apply_curation.py`) or let the daily cron publish.
4. Second-look handle: `select * from kb_curation where reviewed_by = 'automerge-v1'`.
