# Auto-merge pass 1 — DRY-RUN plan (2026-06-12)

Worklist payload: `2026-06-12 22:14` · curation overlay: synced same run · marker: `automerge-v1` · **nothing applied**.

## Planned: **2272 groups** → 3588 merge rows + 2250 title rows (5838 curation upserts)

| lane | planned |
|---|---|
| anchored (merge into existing identity) | 1331 |
| singleton (mint new unified course) | 941 |

## Excluded (stays human / already handled)

| reason | groups |
|---|---|
| anchored: Keep-as-is dismissed | 4 |
| anchored: already consumed (<2 live members) | 20 |
| anchored: band mix credit/noncredit (stays human) | 231 |
| singleton: band mix credit/noncredit (stays human) | 94 |
| singleton: same_college (stays human) | 214 |

## Units spread across planned groups (2272)

| spread | groups |
|---|---|
| 0 (uniform) | 1173 |
| ≤1u | 740 |
| ≤2u | 192 |
| ≤4u | 127 |
| >4u | 40 |

## Title regularizations (16 of 2272 planned groups)

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

### anchored → `COUN M1045` (M-ID) · title: unchanged → **Career Exploration and Life Planning**
- `COUN M1045` (M-ID) Career Exploration and Life Planning · 3.0u
- `IDST M10JV` (Stand-Alone) Career Planning and Life Exploration · 3.0u

### singleton → `UC-CUR-AUTOE2DA7A70` (Unified (new)) · title: unchanged → **High-Beginning ESL (Noncredit)**
- `ESOL M90VA` (Stand-Alone) ESL High Beginning · 0.0u
- `ESOL M90VF` (Stand-Alone) High-Beginning ESL (Noncredit) · 0.0u
- `ESOL M90VB` (Stand-Alone) High Beginning ESL A · 0.0u

### singleton → `UC-CUR-AUTO5E519903` (Unified (new)) · title: unchanged → **Neurorehabilitation for the PTA**
- `HLTH M11ES` (Stand-Alone) Neurorehabilitation for the PTA · 3.0u
- `PTAS M10DG` (Stand-Alone) Neurorehabilitation for PTA · 3.0u

### anchored → `COSM M1010` (M-ID) · title: unchanged → **Cosmetology: Level 4**
- `COSM M1010` (M-ID) Cosmetology: Level 4 · 9.0u
- `COSM M10IW` (Stand-Alone) Cosmetology, Level 4 · 9.5u

### singleton → `UC-CUR-AUTO0E55A6F4` (Unified (new)) · title: unchanged → **Conditioning Dance: Pilates 1**
- `DANC M10ZC` (Stand-Alone) Conditioning Dance: Pilates 1 · 2.0u
- `DANC M10ZE` (Stand-Alone) Dance Conditioning/Pilates 1 · 0.5u

### singleton → `UC-CUR-AUTO46ADC8AF` (Unified (new)) · title: unchanged → **Literacy and Basic Skills Beginning**
- `IDST M90QA` (Stand-Alone) Literacy and Basic Skills Beginning · 0.0u
- `IDST M90QB` (Stand-Alone) Literacy & Basic Skills Beginning · 0.0u

### anchored → `ASTR M1019` (M-ID) · title: unchanged → **Astronomy with Lab**
- `ASTR M1019` (M-ID) Astronomy Lab · 1.0u
- `PHSC M10BQ` (Stand-Alone) Astronomy with Lab · 4.0u

### singleton → `UC-CUR-AUTOF3723FB2` (Unified (new)) · title: unchanged → **3D Layout and Lighting (RVPA)**
- `DRAF M10CD` (Stand-Alone) 3D Layout and Lighting (RVPA) · 3.0u
- `MULT M10EM` (Stand-Alone) 3D Layout and Lighting · 3.0u

### singleton → `UC-CUR-AUTOC020D38A` (Unified (new)) · title: unchanged → **Practical Applications in Athletic Training 1**
- `HLTH M10HR` (Stand-Alone) Practical Applications in Athletic Training 1 · 2.0u
- `ATHL M10ZV` (Stand-Alone) Practical Applications of Athletic Training 1 · 3.0u

### anchored → `CRIM M1183` (M-ID) · title: unchanged → **Criminal Law and Procedure**
- `CRIM M1183` (M-ID) Criminal Law and Procedure · 3.0u
- `LEGL M1011` (M-ID) Criminal Law & Procedure · 3.0u

### anchored → `DANC M1108` (M-ID) · title: unchanged → **Beginning Dance - Jazz**
- `DANC M1108` (M-ID) Beginning Jazz Dance · 1.0u
- `KINE M11SX` (Stand-Alone) Beginning Dance - Jazz · 1.0u

### singleton → `UC-CUR-AUTOD037AB8C` (Unified (new)) · title: unchanged → **Mechanical and Electrical Devices**
- `HVAC M10PQ` (Stand-Alone) Mechanical and Electrical Devices · 2.0u
- `ENGT M10DG` (Stand-Alone) Electrical and Mechanical Devices · 3.0u

### singleton → `UC-CUR-AUTO69D5BCA4` (Unified (new)) · title: unchanged → **Fundamentals of Electronics**
- `ELCT M10DY` (Stand-Alone) Electronics Fundamentals · 6.0u
- `ELET M10LO` (Stand-Alone) Fundamentals of Electronics · 4.0u

### anchored → `HTEC M9015` (M-ID) · title: unchanged → **Personal Care Attendant 2: Dementia and End of Life Care**
- `HTEC M9015` (M-ID) Personal Care Attendant 2 Dementia and End of Life Care · 0.0u
- `HLTH M90AH` (Stand-Alone) Personal Care Attendant 2: Dementia and End of Life Care · 0.0u

### anchored → `ESOL M9162` (M-ID) · title: unchanged → **Beginning High A**
- `ESOL M9162` (M-ID) Beginning High · 0.0u
- `ESOL M90WC` (Stand-Alone) High Beginning · 0.0u
- `ESOL M90WD` (Stand-Alone) Beginning High A · 0.0u

### singleton → `UC-CUR-AUTO93588331` (Unified (new)) · title: unchanged → **Medical Billing and Coding 2**
- `BUSI M10AQ` (Stand-Alone) Medical Coding/Billing 2 · 3.0u
- `OTEC M10HA` (Stand-Alone) Medical Billing and Coding 2 · 3.0u

### singleton → `UC-CUR-AUTO423F8544` (Unified (new)) · title: unchanged → **Support Course for Math 150**
- `MATH M10CH` (Stand-Alone) Math 150 Support Course · 1.0u
- `MATH M10CI` (Stand-Alone) Support Course for Math 150 · 2.0u

### singleton → `UC-CUR-AUTO043A2728` (Unified (new)) · title: unchanged → **Fundamentals of Gas Tungsten Arc Welding**
- `WELD M10IV` (Stand-Alone) Fundamentals of Gas Tungsten Arc Welding · 2.0u
- `WELD M10IW` (Stand-Alone) Gas Tungsten Arc Welding Fundamentals · 2.0u

### anchored → `ETHN M1031` (M-ID) · title: unchanged → **Chicanx/Latinx Literature**
- `ETHN M1031` (M-ID) Chicanx/Latinx Literature · 3.0u
- `ETHS M1180` (M-ID) Latinx/Chicanx Literature · 3.0u

### anchored → `REAL M1022` (M-ID) · title: unchanged → **Real Estate Economics**
- `REAL M1022` (M-ID) Real Estate Economics · 3.0u
- `REAL M10AH` (Stand-Alone) Real Estate Economics · 3.0u

### singleton → `UC-CUR-AUTOBBFC2846` (Unified (new)) · title: unchanged → **ESL Conversation - Intermediate High**
- `ESOL M91DB` (Stand-Alone) ESL Conversation, High Intermediate · 0.0u
- `ESOL M91DC` (Stand-Alone) ESL Conversation - Intermediate High · 0.0u

### anchored → `ESOL M1306` (M-ID) · title: unchanged → **Intermediate Grammar for Reading and Writing**
- `ESOL M1306` (M-ID) Intermediate Grammar for Reading and Writing · 3.0u
- `ESOL M1307` (M-ID) Intermediate Reading, Writing, and Grammar · 6.0u

### anchored → `WELD M1046` (M-ID) · title: unchanged → **Intermediate Gas Tungsten Arc Welding (GTAW)**
- `WELD M1046` (M-ID) Intermediate Gas Tungsten Arc Welding · 2.5u
- `WELD M1042` (M-ID) Intermediate Gas Tungsten Arc Welding (GTAW) · 3.0u
- `WELD M10JJ` (Stand-Alone) Gas Tungsten Arc Welding - Intermediate · 4.0u
- `WELD M10JI` (Stand-Alone) Intermediate Gas Tungsten Arc Welding (TIG) · 3.0u

### singleton → `UC-CUR-AUTO857FDF8F` (Unified (new)) · title: unchanged → **The Craft of Writing Poetry: Beginning**
- `ENGL M10NV` (Stand-Alone) The Craft of Writing Poetry: Beginning · 3.0u
- `ENGL M10NW` (Stand-Alone) Beginning Craft of Writing - Poetry · 3.0u

### anchored → `DANC M1019` (M-ID) · title: unchanged → **Ballet, Advanced**
- `DANC M1019` (M-ID) Advanced Ballet · 2.0u
- `DANC M1020` (M-ID) Ballet, Advanced · 1.0u

### singleton → `UC-CUR-AUTO9DC29CBC` (Unified (new)) · title: unchanged → **Intercollegiate Sports: Soccer (Women)**
- `ATHL M11EV` (Stand-Alone) Intercollegiate Sports-Soccer · 3.0u
- `ATHL M11EW` (Stand-Alone) Intercollegiate Sports: Soccer (Women) · 3.0u

### anchored → `HIST M1157` (M-ID) · title: unchanged → **Ethnic Groups of the United States: Their Histories**
- `HIST M1157` (M-ID) Ethnic Groups of the United States: Their Histories · 3.0u
- `ETHS M10RT` (Stand-Alone) Ethnic Groups in the United States: Their Histories · 3.0u

### anchored → `INDT M1084` (M-ID) · title: unchanged → **Metal Fabrication and Layout**
- `INDT M1084` (M-ID) Metal Fabrication and Layout · 2.0u
- `WELD M10RQ` (Stand-Alone) Metal Layout for Fabrication · 3.0u

### singleton → `UC-CUR-AUTO5159B1EA` (Unified (new)) · title: unchanged → **Analytical and Critical Thinking in Reading**
- `ENGL M10KY` (Stand-Alone) Analytical and Critical Thinking in Reading · 3.0u
- `READ M10AZ` (Stand-Alone) Critical Reading for Analytical Thinking · 3.0u

### anchored → `CISC M9038` (M-ID) · title: unchanged → **Computer/Skills (Bilingual)**
- `CISC M9038` (M-ID) Computer Skills · 0.0u
- `OTEC M90EF` (Stand-Alone) Computer/Skills (Bilingual) · 0.0u

### anchored → `FIRE M1341` (M-ID) · title: unchanged → **Introduction to Fire Technology**
- `FIRE M1341` (M-ID) Introduction to Fire Technology · 3.0u
- `FIRE M10BY` (Stand-Alone) Introduction to Fire Technology · 3.0u

### anchored → `AUTO M1093` (M-ID) · title: unchanged → **Automotive Electrical and Electronic Systems**
- `AUTO M1093` (M-ID) Automotive Electrical and Electronic Systems · 3.0u
- `AUTO M1094` (M-ID) Automotive Electrical/Electronic Systems · 4.0u

### anchored → `FIRE M1187` (M-ID) · title: unchanged → **Safety Officer (S-404)**
- `FIRE M1187` (M-ID) Safety Officer (S-404) · 2.0u
- `CRIM M11SD` (Stand-Alone) Officer Safety · 3.0u
- `FIRE M11OJ` (Stand-Alone) Safety Officer (NWCG) · 1.5u

### anchored → `MUSI M1221` (M-ID) · title: unchanged → **Classical Guitar 4**
- `MUSI M1221` (M-ID) Classical Guitar 4 · 2.0u
- `MUSI M10FE` (Stand-Alone) Classical Guitar 4 · 2.0u

### singleton → `UC-CUR-AUTO06164037` (Unified (new)) · title: unchanged → **Vocabulary 2**
- `ENGL M11GA` (Stand-Alone) Vocabulary 2 · 1.0u
- `ESOL M10CQ` (Stand-Alone) Vocabulary 2 · 1.0u

### anchored → `EMST M1065` (M-ID) · title: unchanged → **EMT Refresher (24 Hours)**
- `EMST M1065` (M-ID) EMT Refresher · 0.0u
- `EMST M10DP` (Stand-Alone) EMT Refresher (24 Hours) · 1.8u
- `EMST M10EC` (Stand-Alone) EMT Refresher (40 Hours) · 2.5u

### singleton → `UC-CUR-AUTOAB10E208` (Unified (new)) · title: unchanged → **Intermediate Fire Behavior (S-290)**
- `FIRE M10JU` (Stand-Alone) Intermediate Fire Behavior (S-290) · 1.0u
- `PUBS M10HS` (Stand-Alone) Intermediate Fire Behavior · 1.0u

### anchored → `KINE M1076` (M-ID) · title: unchanged → **Advanced Tai Chi (Taiji)**
- `KINE M1076` (M-ID) Advanced Tai Chi · 1.0u
- `KINE M10MX` (Stand-Alone) Tai Chi - Advanced · 1.0u
- `KINE M10MY` (Stand-Alone) Advanced Tai Chi (Taiji) · 1.0u

### singleton → `UC-CUR-AUTO599A74EA` (Unified (new)) · title: unchanged → **The History of England**
- `HIST M10TE` (Stand-Alone) History of England · 3.0u
- `HIST M10TF` (Stand-Alone) The History of England · 3.0u

### anchored → `MULT M1026` (M-ID) · title: unchanged → **Adobe Illustrator, Advanced**
- `MULT M1026` (M-ID) Advanced Adobe Illustrator · 3.0u
- `GRAF M10AZ` (Stand-Alone) Adobe Illustrator, Advanced · 3.0u

### singleton → `UC-CUR-AUTO7F65EE46` (Unified (new)) · title: unchanged → **Basketball – Women's Intercollegiate Off-Season (Spring)**
- `ATHL M10GM` (Stand-Alone) Basketball – Women's Intercollegiate Off-Season (Spring) · 1.0u
- `ATHL M10GN` (Stand-Alone) Off Season Intercollegiate Women's Basketball · 1.0u

### anchored → `MUSI M1520` (M-ID) · title: unchanged → **Topics in Music**
- `MUSI M1520` (M-ID) Topics in Music · 0.5u
- `MUSI M12PQ` (Stand-Alone) Music Topics · 0.5u

### singleton → `UC-CUR-AUTOB9E47C01` (Unified (new)) · title: unchanged → **Building Construction 1**
- `CNST M10AB` (Stand-Alone) Building Construction 1 · 5.0u
- `CNST M10FZ` (Stand-Alone) Building Construction 1 · 4.0u

### anchored → `FLFR M1006` (M-ID) · title: unchanged → **Intermediate French 2**
- `FLFR M1006` (M-ID) Intermediate French 2 · 4.0u
- `FLFR M1042` (M-ID) Intermediate French 2 · 5.0u

### anchored → `CSIS M1372` (M-ID) · title: unchanged → **Introduction to Game Programming**
- `CSIS M1372` (M-ID) Introduction to Game Programming · 3.0u
- `CISC M10QK` (Stand-Alone) Game Programming, Introduction · 4.0u

### anchored → `ARTH M1023` (M-ID) · title: unchanged → **History of Mexican Art**
- `ARTH M1023` (M-ID) Mexican Art History · 3.0u
- `ETHS M10KG` (Stand-Alone) History of Mexican Art · 3.0u

### anchored → `ATHL M1195` (M-ID) · title: kept curator title
- `ATHL M1195` (M-ID) Intercollegiate Softball · 3.0u
- `ATHL M10UW` (Stand-Alone) Intercollegiate Softball (W) · 1.0u

### singleton → `UC-CUR-AUTOC546B5B8` (Unified (new)) · title: unchanged → **Electricity for Air Conditioning and Refrigeration 2**
- `HVAC M10FY` (Stand-Alone) Air Conditioning & Refrigeration Electricity 2 · 3.0u
- `HVAC M10FZ` (Stand-Alone) Electricity for Air Conditioning and Refrigeration 2 · 3.0u

### singleton → `UC-CUR-AUTO635E63B8` (Unified (new)) · title: unchanged → **Conditioning Dance: Pilates 3**
- `DANC M10ZL` (Stand-Alone) Conditioning Dance: Pilates 3 · 2.0u
- `DANC M10ZM` (Stand-Alone) Dance Conditioning/Pilates 3 · 0.5u

### singleton → `UC-CUR-AUTOE83866B0` (Unified (new)) · title: unchanged → **Varsity Track and Field for Women**
- `ATHL M10NH` (Stand-Alone) Track and Field, Varsity, Women · 3.0u
- `ATHL M10NI` (Stand-Alone) Varsity Track and Field for Women · 3.0u

### anchored → `ATHL M1120` (M-ID) · title: unchanged → **Intercollegiate Track and Field (W)**
- `ATHL M1120` (M-ID) Intercollegiate Track and Field · 3.0u
- `ATHL M10MZ` (Stand-Alone) Intercollegiate Track and Field (W) · 1.0u

### anchored → `ARCH M1034` (M-ID) · title: unchanged → **Architectural Design 1**
- `ARCH M1034` (M-ID) Architectural Design 1 · 3.0u
- `ARCH M10AD` (Stand-Alone) Architectural Design 1 · 4.0u

### singleton → `UC-CUR-AUTOF9BF2009` (Unified (new)) · title: unchanged → **Math and Science for the Young Child**
- `ECED M10UQ` (Stand-Alone) Math and Science for the Young Child · 3.0u
- `ECED M10UR` (Stand-Alone) Science and Math for the Young Child · 2.0u

### singleton → `UC-CUR-AUTO5E18A35F` (Unified (new)) · title: unchanged → **Anthropology International Field Studies**
- `ANTH M10EC` (Stand-Alone) Anthropology International Field Studies · 1.0u
- `ANTH M10ED` (Stand-Alone) International Anthropology Field Studies · 3.0u

### anchored → `DANC M1017` (M-ID) · title: unchanged → **Hip Hop 4**
- `DANC M1017` (M-ID) Hip Hop 4 · 1.0u
- `DANC M1352` (M-ID) Hip Hop 4 · 1.5u

### anchored → `COUN M1070` (M-ID) · title: unchanged → **Introduction to College and Strategies for Success**
- `COUN M1070` (M-ID) Introduction to College Success Strategies · 1.0u
- `COUN M10MH` (Stand-Alone) Introduction to College and Strategies for Success · 1.0u

### anchored → `WELD M1033` (M-ID) · title: unchanged → **Beginning Shielded Metal Arc Welding (Stick 7018/ 6010 Basic)**
- `WELD M1033` (M-ID) Shielded Metal Arc Welding - Beginning · 3.0u
- `WELD M10HL` (Stand-Alone) Beginning Shielded Metal Arc Welding · 3.0u
- `WELD M10CK` (Stand-Alone) Beginning Shielded Metal Arc Welding (Stick 7018/ 6010 Basic) · 3.0u

### anchored → `JOUR 170` (C-ID) · title: official (no title write)
- `JOUR 170` (C-ID) Introduction to Visual Communications · 2.0u
- `COMM M1047` (M-ID) Introduction to Visual Communications · 3.0u

### anchored → `KINE M1570` (M-ID) · title: unchanged → **Jogging for Fitness, Intermediate**
- `KINE M1570` (M-ID) Jogging for Fitness, Intermediate · 1.0u
- `KINE M13GU` (Stand-Alone) Intermediate Jogging for Fitness · 1.0u

### anchored → `MATH M1272` (M-ID) · title: unchanged → **Just in Time Support for Statistics**
- `MATH M1272` (M-ID) Just in Time Support for Statistics · 2.0u
- `MATH M11FR` (Stand-Alone) Just-In-Time Support-Statistics · 2.0u

## Apply procedure (NOT tonight — after Sam's skim)

1. Re-run this planner against fresh `main` (post-cron) in the apply sitting.
2. Execute `supabase_ops.sql` in batches via the Supabase session (ON CONFLICT DO NOTHING — human rows always win).
3. Fold the overlay (`kb/_apply_curation.py`) or let the daily cron publish.
4. Second-look handle: `select * from kb_curation where reviewed_by = 'automerge-v1'`.
