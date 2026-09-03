---
title: Prefix fold — DRY-RUN (the worklist the 2026-09-03 land surfaced)
date: 2026-09-03
session: 224 (SkyTune)
status: DRY-RUN — nothing mutated; awaiting Sam's verdicts on the decision sheet before any apply
tags: [remint, dry-run, csr, subj4, prefix-fold, rule-7]
artifacts:
  - kb/prefix_fold_out/2026-09-03/alias_map.json
  - kb/prefix_fold_out/2026-09-03/collisions.json
  - kb/prefix_fold_out/2026-09-03/held.json
  - kb/prefix_fold_out/2026-09-03/supabase_ops.sql
related:
  - kb/_authority_recode_dryrun.py (the allocator)
  - kb/_subj4_dryrun.py (fold-verify)
  - docs/coursecontrolnumber_remint.md
---

# Prefix fold — DRY-RUN

## TL;DR

- **278** ids move (scope `all`): 132 materialized machine clusters, 146 legacy strays (33 of them stand-alone shapes).
- **153** keep their number; **125** gap-fill; overflow 0.
- **7** candidates HELD (discipline on TOP alone); 0 outside the scope.
- fold-verify fates on this tree: no_change 74,775, re_key 285, skip_no_discipline 591, skip_umbrella_offcode 30, skip_unknown_disc 43.
- validation: **9/9** pass.

## Groups (old prefix → canonical, discipline)

| old → new | discipline | rows | materialized | legacy | kept | gap-filled | examples |
|---|---|---:|---:|---:|---:|---:|---|
| `ITIS` → `COMP` | Computer Science | 26 | 26 | 0 | 25 | 1 | ITIS M1209 → COMP M1209 · Web 2.0 Social Media Strategies<br>ITIS M1490 → COMP M1490 · Linux 2, System Administration<br>ITIS M1491 → COMP M1491 · C++ Programming Language 2 |
| `ARTS` → `ARTH` | Art History | 15 | 6 | 9 | 15 | 0 | ARTS M1065 → ARTH M1065 · Arts of Africa, Oceania, and Indigenous North America<br>ARTS M1073 → ARTH M1073 · American Art<br>ARTS M1102 → ARTH M1102 · Asian Art History |
| `BUSI` → `BSOT` | Office Technologies | 13 | 9 | 4 | 11 | 2 | BUSI M1096 → BSOT M1261 · Microsoft Word: Advanced<br>BUSI M1289 → BSOT M1289 · Medical Billing and Coding 1<br>BUSI M1333 → BSOT M1333 · Keyboarding 1 |
| `HVAC` → `CNST` | Construction Technology | 10 | 8 | 2 | 0 | 10 | HVAC M1038 → CNST M1139 · Construction Fundamentals: Principles and Practices Lab<br>HVAC M1039 → CNST M1140 · Construction Fundamentals: Principles and Practices<br>HVAC M1079 → CNST M1130 · Residential Construction Skills 2: "Finish End" |
| `CNSC` → `CARP` | Carpentry | 9 | 0 | 9 | 0 | 9 | CNSC M10AK → CARP M10ER · Machinery Shaft Alignment<br>CNSC M10AR → CARP M10ES · Machinery Installation and Erection - B<br>CNSC M10AS → CARP M10ET · Millwright General Skills - B |
| `HVAC` → `ELEC` | Electricity | 9 | 4 | 5 | 7 | 2 | HVAC M1088 → ELEC M1088 · Advanced Motor Controls, Variable Frequency Drives, Programmable Logic Controls<br>HVAC M1097 → ELEC M1097 · Apprentice Plumbers, HVAC/Refrigeration, Fourth Semester<br>HVAC M1098 → ELEC M1098 · Apprentice Plumbers, HVAC/Refrigeration, Seventh Semester |
| `ITIS` → `BSOT` | Office Technologies | 8 | 8 | 0 | 4 | 4 | ITIS M1536 → BSOT M1536 · Spreadsheet Applications for Business<br>ITIS M1541 → BSOT M1541 · Google Apps for Business and Personal Use<br>ITIS M1582 → BSOT M1582 · Computer Keyboarding Proficiency |
| `NRSV` → `NRSR` | Nursing | 8 | 8 | 0 | 0 | 8 | NRSV M1019 → NRSR M1290 · Common Health Deviations 1<br>NRSV M1020 → NRSR M1291 · Common Health Deviations 1 Lab<br>NRSV M1022 → NRSR M1292 · Common Health Deviations 2 |
| `ARTS` → `ARTD` | Commercial Art | 7 | 7 | 0 | 7 | 0 | ARTS M1519 → ARTD M1519 · Wood and Stone Sculpture 1<br>ARTS M1569 → ARTD M1569 · Human Anatomy for Artists<br>ARTS M1635 → ARTD M1635 · Drawing the Head and Hands |
| `HVAC` → `AUTD` | Diesel Mechanics | 6 | 0 | 6 | 3 | 3 | HVAC M1009 → AUTD M1042 · Transit Vehicle Heating, Ventilation, Air Conditioning<br>HVAC M10FQ → AUTD M10FX · Heavy Duty Truck and Heavy Equipment Heating and Air Conditioning<br>HVAC M10FR → AUTD M10FY · Heavy Duty Heating, Ventilation, and Air Conditioning (HVAC) |
| `MANU` → `DRAF` | Drafting/CADD | 6 | 0 | 6 | 0 | 6 | MANU M1008 → DRAF M1089 · Creo Parametric: Top-Down Design and Advanced System Tools<br>MANU M1009 → DRAF M1090 · SolidWorks: Top-Down Design and Advanced System Tools<br>MANU M1012 → DRAF M1091 · Introduction to Computer Aided Design Using AutoCAD |
| `THTR` → `MUSI` | Music | 6 | 6 | 0 | 0 | 6 | THTR M1314 → MUSI M1081 · Thea 290 F<br>THTR M1340 → MUSI M1512 · Intermediate Broadway Voice<br>THTR M1345 → MUSI M1542 · Choral Ensemble Tour |
| `ARTS` → `GRAF` | Graphic Arts | 5 | 0 | 5 | 5 | 0 | ARTS M1300 → GRAF M1300 · Graphic Design 1<br>ARTS M1306 → GRAF M1306 · Introduction to Graphic Design<br>ARTS M1327 → GRAF M1327 · Package Design |
| `HVAC` → `AUTO` | Automotive Technology | 5 | 0 | 5 | 0 | 5 | HVAC M1015 → AUTO M1296 · Structural Analysis and Damage Repair<br>HVAC M1032 → AUTO M1315 · Climate Control<br>HVAC M10FU → AUTO M11PC · Air Conditioning, Heating, and Electrical Systems |
| `NUTR` → `FDNT` | Nutritional Science/Dietetics | 5 | 5 | 0 | 5 | 0 | NUTR M1043 → FDNT M1043 · Food and Nutrition: Cross Cultural Perspectives<br>NUTR M1044 → FDNT M1044 · Food, Nutrition Customs, and Culture<br>NUTR M1045 → FDNT M1045 · Nutrition, Weight Management, and Eating Disorders |
| `BUSI` → `MRKT` | Marketing | 4 | 0 | 4 | 4 | 0 | BUSI M1099 → MRKT M1099 · Introduction to Advertising<br>BUSI M1139 → MRKT M1139 · Consumer Behavior<br>BUSI M1363 → MRKT M1363 · Internet Marketing |
| `ARTS` → `PHOT` | Photography | 3 | 0 | 3 | 2 | 1 | ARTS M1043 → PHOT M1142 · Advanced Digital Photography<br>ARTS M1187 → PHOT M1187 · Beginning Digital Photography<br>ARTS M1208 → PHOT M1208 · Black and White Photography 1 |
| `AUTO` → `AUTD` | Diesel Mechanics | 3 | 3 | 0 | 3 | 0 | AUTO M1295 → AUTD M1295 · Individualized Skills Training (IST) Truck & Bus Chassis System I Laboratory<br>AUTO M1296 → AUTD M1296 · Individualized Skills Training (IST) Truck & Bus Power Train Systems Laboratory<br>AUTO M1315 → AUTD M1315 · Introduction to Heavy Equipment Mobile Hydraulics |
| `ELEC` → `ELCT` | Electronic Technology | 3 | 3 | 0 | 3 | 0 | ELEC M1055 → ELCT M1055 · Introduction to Electrical Blueprints<br>ELEC M1057 → ELCT M1057 · Electrical Power Distribution Systems and Machinery<br>ELEC M1059 → ELCT M1059 · State Electrician Trainee Topics |
| `MUSI` → `MUSC` | Commercial Music | 3 | 0 | 3 | 3 | 0 | MUSI M1081 → MUSC M1081 · Recording Arts 2<br>MUSI M1512 → MUSC M1512 · Live Sound<br>MUSI M1542 → MUSC M1542 · Studio Recording |
| `PHSC` → `GEOL` | Earth Science | 3 | 0 | 3 | 0 | 3 | PHSC M1012 → GEOL M1075 · Earth History Laboratory<br>PHSC M1038 → GEOL M1087 · Oceanography Laboratory<br>PHSC M1039 → GEOL M1088 · Physical Oceanography Laboratory |
| `ARTS` → `MULT` | Multimedia | 2 | 0 | 2 | 1 | 1 | ARTS M1166 → MULT M1174 · Introduction to Digital Media Arts<br>ARTS M1408 → MULT M1408 · Intermediate Motion Graphics |
| `CISC` → `ITIS` | Computer Information Systems | 2 | 0 | 2 | 0 | 2 | CISC M1020 → ITIS M1209 · Security in Amazon Web Services<br>CISC M1090 → ITIS M1490 · Introduction to Linux |
| `CISC` → `MULT` | Multimedia | 2 | 0 | 2 | 0 | 2 | CISC M1073 → MULT M1175 · Introduction to Digital Media<br>CISC M1092 → MULT M1176 · Introduction to Virtual Production |
| `COMM` → `MULT` | Multimedia | 2 | 0 | 2 | 0 | 2 | COMM M1069 → MULT M1177 · User Interface Design<br>COMM M1071 → MULT M1178 · Responsive Web Design |
| `CSIS` → `MULT` | Multimedia | 2 | 0 | 2 | 2 | 0 | CSIS M1312 → MULT M1312 · Web Design 1<br>CSIS M1313 → MULT M1313 · Web Design 2 |
| `ENGL` → `FTVE` | Film and Media Studies | 2 | 0 | 2 | 2 | 0 | ENGL M1320 → FTVE M1320 · Introduction to Media Writing<br>ENGL M1329 → FTVE M1329 · Introduction to Screenwriting |
| `ENGL` → `READ` | Reading | 2 | 0 | 2 | 2 | 0 | ENGL M1085 → READ M1085 · College Reading: Logical Analysis and Evaluation<br>ENGL M1158 → READ M1158 · College Reading |
| `FCSH` → `FASH` | Fashion and Related Technologies | 2 | 2 | 0 | 0 | 2 | FCSH M1002 → FASH M1134 · Tailoring Techniques 1<br>FCSH M1045 → FASH M1135 · Special Events Coordination and Promotion |
| `FIMS` → `FTVE` | Media Production | 2 | 0 | 2 | 0 | 2 | FIMS M1031 → FTVE M1166 · Introduction to Audio Production<br>FIMS M1032 → FTVE M1167 · Audio Production |
| `HTEC` → `HEIT` | Health Information Technology | 2 | 2 | 0 | 2 | 0 | HTEC M1088 → HEIT M1088 · ICD (International Classification of Diseases)-10-CM (Clinical Modification) Advanced Coding<br>HTEC M1089 → HEIT M1089 · ICD (International Classification of Diseases)-10-CM (Clinical Modification) Beginning Coding |
| `HVAC` → `CNSM` | Construction Management | 2 | 1 | 1 | 2 | 0 | HVAC M1087 → CNSM M1087 · Advanced Compressor and Motor Theory<br>HVAC M10SR → CNSM M10SR · Principles of Heating and Refrigeration Inspections |
| `HVAC` → `ELET` | Electronics | 2 | 2 | 0 | 2 | 0 | HVAC M1100 → ELET M1100 · Industrial Automation Using Plcs<br>HVAC M1117 → ELET M1117 · Principles of Electricity and Electronics |
| `HVAC` → `INTD` | Interior Design | 2 | 0 | 2 | 2 | 0 | HVAC M10KO → INTD M10KO · Kitchen and Bath Systems<br>HVAC M10LH → INTD M10LH · Interior Construction and Building Systems |
| `HVAC` → `MANU` | Manufacturing Technology | 2 | 0 | 2 | 2 | 0 | HVAC M10SB → MANU M10SB · Fundamentals of Thermodynamics<br>HVAC M10TY → MANU M10TY · Industrial Maintenance & Mechatronics |
| `IDST` → `BSKL` | Interdisciplinary-Basic Skills: Noncredit 53412 | 2 | 1 | 1 | 2 | 0 | IDST M9252 → BSKL M9252 · GED Test Preparation<br>IDST M9330 → BSKL M9330 · Anger Management Skills in the Workplace |
| `LIBS` → `LIBR` | Library Science | 2 | 0 | 2 | 0 | 2 | LIBS M1001 → LIBR M1045 · College Research Skills<br>LIBS M1003 → LIBR M1046 · Information Competency/Research Skills |
| `THEA` → `THES` | Stagecraft | 2 | 0 | 2 | 2 | 0 | THEA M1087 → THES M1087 · Beginning Stagecraft<br>THEA M1295 → THES M1295 · Stagecraft |
| `THTR` → `FTVE` | Film and Media Studies | 2 | 2 | 0 | 2 | 0 | THTR M1302 → FTVE M1302 · History of Film: 1950S to Present<br>THTR M1361 → FTVE M1361 · Survey of Film: Westerns and Musicals |
| `THTR` → `THES` | Stagecraft | 2 | 2 | 0 | 2 | 0 | THTR M1309 → THES M1309 · Costume Technology 2<br>THTR M1359 → THES M1359 · Introduction to Live Video Event Production |
| `AGRI` → `AGEQ` | Equine Science | 1 | 1 | 0 | 1 | 0 | AGRI M1039 → AGEQ M1039 · Rodeo Team Roping |
| `AGRI` → `HORT` | Ornamental Horticulture | 1 | 0 | 1 | 0 | 1 | AGRI M1062 → HORT M1115 · Landscape Construction and Installation |
| `ANTH` → `SOCI` | Sociology | 1 | 0 | 1 | 1 | 0 | ANTH M1099 → SOCI M1099 · Introduction to Queer Studies |
| `ARCH` → `ARTS` | Art | 1 | 0 | 1 | 0 | 1 | ARCH M1123 → ARTS M1043 · Freehand Drawing |
| `ARCH` → `CNSM` | Construction Management | 1 | 0 | 1 | 1 | 0 | ARCH M1106 → CNSM M1106 · Construction Estimating |
| `ARCH` → `DRAF` | Drafting/CADD | 1 | 0 | 1 | 0 | 1 | ARCH M1020 → DRAF M1088 · Computer-Aided Design and Drafting |
| `ARCH` → `INTD` | Interior Design | 1 | 0 | 1 | 1 | 0 | ARCH M1120 → INTD M1120 · Residential Design |
| `ARTD` → `PHOT` | Photography | 1 | 0 | 1 | 0 | 1 | ARTD M1009 → PHOT M1141 · Studio Lighting |
| `ARTS` → `HUMA` | Humanities | 1 | 0 | 1 | 1 | 0 | ARTS M1172 → HUMA M1172 · Survey of the Arts |
| `ARTS` → `INTD` | Interior Design | 1 | 0 | 1 | 1 | 0 | ARTS M1498 → INTD M1498 · Professional Practices |
| `ARTS` → `OLAD` | Older Adults: Noncredit | 1 | 0 | 1 | 0 | 1 | ARTS M9006 → OLAD M9063 · Painting for Older Adults |
| `AVIA` → `AUTO` | Automotive Technology | 1 | 0 | 1 | 0 | 1 | AVIA M1022 → AUTO M1295 · Automatic Transmissions & Transaxles |
| `BIOL` → `FDNT` | Nutritional Science/Dietetics | 1 | 0 | 1 | 1 | 0 | BIOL M1243 → FDNT M1243 · Introduction to Nutrition |
| `BIOL` → `HTEC` | Health Care Ancillaries | 1 | 0 | 1 | 1 | 0 | BIOL M1232 → HTEC M1232 · Medical Terminology 1 |
| `BUSI` → `MATH` | Mathematics | 1 | 0 | 1 | 0 | 1 | BUSI M1108 → MATH M1194 · Mathematical Analysis for Business |
| `BUSI` → `REAL` | Real Estate | 1 | 0 | 1 | 1 | 0 | BUSI M1288 → REAL M1288 · Escrow Procedures 1 |
| `CISC` → `MATH` | Mathematics | 1 | 0 | 1 | 0 | 1 | CISC M1066 → MATH M1357 · Principles of Data Science |
| `CNSR` → `BSOT` | Office Technologies | 1 | 1 | 0 | 0 | 1 | CNSR M1018 → BSOT M1259 · Business Software - Customer Relationship Management |
| `CNSR` → `CNSM` | Construction Management | 1 | 1 | 0 | 0 | 1 | CNSR M1017 → CNSM M1041 · Introduction to the International Building Code |
| `COMM` → `FTVE` | Media Production | 1 | 0 | 1 | 0 | 1 | COMM M1098 → FTVE M1165 · Video Production |
| `COMM` → `JOUR` | Journalism | 1 | 0 | 1 | 0 | 1 | COMM M1089 → JOUR M1106 · Introduction to Public Relations |
| `COMP` → `BSOT` | Office Technologies | 1 | 1 | 0 | 0 | 1 | COMP M9075 → BSOT M9125 · Introduction to Internet and Email for Business |
| `COUN` → `PARN` | Parent Education: Noncredit | 1 | 0 | 1 | 0 | 1 | COUN M9021 → PARN M9064 · Effective Parenting |
| `CRIM` → `BUSI` | Business | 1 | 1 | 0 | 0 | 1 | CRIM M1413 → BUSI M1096 · Street Law, Personal Law |
| `CRIM` → `COUN` | Counseling | 1 | 1 | 0 | 1 | 0 | CRIM M1379 → COUN M1379 · Counseling Youth in Gangs |
| `CRIM` → `PLGL` | Legal Assisting | 1 | 0 | 1 | 1 | 0 | CRIM M1183 → PLGL M1183 · Criminal Law and Procedure |
| `CSIS` → `FTVE` | Media Production | 1 | 0 | 1 | 1 | 0 | CSIS M1337 → FTVE M1337 · Digital Video Production |
| `CULN` → `MATH` | Mathematics | 1 | 0 | 1 | 0 | 1 | CULN M1104 → MATH M1361 · Culinary Math |
| `CULN` → `RMGT` | Restaurant Management | 1 | 0 | 1 | 1 | 0 | CULN M1054 → RMGT M1054 · Introduction to Food and Beverage Management |
| `DANC` → `MUSI` | Music | 1 | 0 | 1 | 0 | 1 | DANC M1144 → MUSI M1651 · Composition |
| `DSPS` → `ENGL` | English | 1 | 0 | 1 | 0 | 1 | DSPS M1007 → ENGL M1085 · Writing/Reading Strategies |
| `ELET` → `CNST` | Construction Technology | 1 | 0 | 1 | 0 | 1 | ELET M1074 → CNST M1137 · Residential Wiring |
| `ELET` → `ELEC` | Electricity | 1 | 0 | 1 | 0 | 1 | ELET M1054 → ELEC M1055 · Fundamentals of Electricity |
| `ESCI` → `CNST` | Construction Technology | 1 | 0 | 1 | 0 | 1 | ESCI M1001 → CNST M1138 · Solar Installer Level 1 |
| `ESOL` → `ESLN` | English as a Second Language Noncredit 53412 | 1 | 1 | 0 | 1 | 0 | ESOL M9274 → ESLN M9274 · English as a Second Language, Level 2B |
| `ETHS` → `POLS` | Political Science | 1 | 0 | 1 | 0 | 1 | ETHS M1069 → POLS M1002 · Ethnic Politics in America |
| `FCSH` → `CDEV` | Child Development/Early Childhood Education | 1 | 0 | 1 | 0 | 1 | FCSH M1019 → CDEV M1290 · Infant/Toddler Growth and Development |
| `FCSH` → `PARN` | Parent Education: Noncredit | 1 | 0 | 1 | 1 | 0 | FCSH M9076 → PARN M9076 · Positive Parenting |
| `FIMS` → `BCST` | Broadcasting Technology | 1 | 0 | 1 | 0 | 1 | FIMS M1039 → BCST M1057 · Beginning TV Studio Production |
| `FIMS` → `MULT` | Multimedia | 1 | 0 | 1 | 0 | 1 | FIMS M1098 → MULT M1179 · Introduction to Multimedia |
| `GEOL` → `ESCI` | Environmental Technologies | 1 | 1 | 0 | 0 | 1 | GEOL M1075 → ESCI M1001 · Practices of Environmental Stewardship |
| `HLTH` → `ARTS` | Art | 1 | 0 | 1 | 0 | 1 | HLTH M9036 → ARTS M9006 · Self-Directed Creative Careers |
| `HLTH` → `BUSI` | Business | 1 | 0 | 1 | 0 | 1 | HLTH M1061 → BUSI M1099 · Health Care Law |
| `HLTH` → `HTEC` | Health Care Ancillaries | 1 | 0 | 1 | 0 | 1 | HLTH M1020 → HTEC M1088 · Certified Home Health Aide |
| `HTEC` → `BSOT` | Office Technologies | 1 | 1 | 0 | 0 | 1 | HTEC M1099 → BSOT M1260 · Introduction to Medical Billing and Coding |
| `HUMA` → `JOUR` | Journalism | 1 | 0 | 1 | 1 | 0 | HUMA M1109 → JOUR M1109 · Public Relations |
| `HVAC` → `ARCH` | Architecture | 1 | 1 | 0 | 0 | 1 | HVAC M1105 → ARCH M1020 · Green Construction & Leed Certification for HVAC |
| `HVAC` → `AUTB` | Auto Body Technology | 1 | 1 | 0 | 1 | 0 | HVAC M1076 → AUTB M1076 · Smq-10 Basics of Architectural Sheet Metal |
| `HVAC` → `DRAF` | Drafting/CADD | 1 | 1 | 0 | 1 | 0 | HVAC M1112 → DRAF M1112 · Process Piping Design |
| `HVAC` → `ELCT` | Electronic Technology | 1 | 1 | 0 | 1 | 0 | HVAC M1083 → ELCT M1083 · Substation-Electrician 7 |
| `HVAC` → `ENGT` | Engineering Technology | 1 | 1 | 0 | 1 | 0 | HVAC M1113 → ENGT M1113 · Mechanical and Electrical Devices |
| `HVAC` → `ESCI` | Environmental Technologies | 1 | 0 | 1 | 0 | 1 | HVAC M10LF → ESCI M10RD · Commercial Building Science |
| `HVAC` → `ITIS` | Computer Information Systems | 1 | 0 | 1 | 0 | 1 | HVAC M10MA → ITIS M12NA · Data Center Infrastructure Essentials |
| `HVAC` → `MATH` | Mathematics | 1 | 0 | 1 | 0 | 1 | HVAC M1056 → MATH M1362 · Mathematics for Technical Fields |
| `HVAC` → `PLMB` | Plumbing | 1 | 0 | 1 | 1 | 0 | HVAC M10RO → PLMB M10RO · Pipe Fabrication and Installation Fundamentals |
| `IDST` → `BSOT` | Office Technologies | 1 | 1 | 0 | 1 | 0 | IDST M9349 → BSOT M9349 · Strategies for Employment |
| `IDST` → `COUN` | Counseling | 1 | 0 | 1 | 0 | 1 | IDST M1060 → COUN M1209 · Post-Secondary Education: The Scope of Career Planning |
| `INDT` → `AUTB` | Auto Body Technology | 1 | 0 | 1 | 1 | 0 | INDT M10FZ → AUTB M10FZ · Paint Preparation and Application |
| `INDT` → `ENGT` | Engineering Technology | 1 | 0 | 1 | 1 | 0 | INDT M10RV → ENGT M10RV · Principles of Engineering |
| `ITIS` → `EDUC` | Education | 1 | 1 | 0 | 1 | 0 | ITIS M1624 → EDUC M1624 · Orientation to Online Learning |
| `ITIS` → `GEOG` | Geography | 1 | 1 | 0 | 1 | 0 | ITIS M1613 → GEOG M1613 · Introduction to Geographical Information Systems (GIS) |
| `ITIS` → `GRAF` | Graphic Arts | 1 | 1 | 0 | 1 | 0 | ITIS M1598 → GRAF M1598 · UI/UX and Web Design |
| `KINE` → `LSKL` | Learning Assistance or Learning Skills | 1 | 0 | 1 | 1 | 0 | KINE M1040 → LSKL M1040 · Academic Study Skills for Student Athletes |
| `MAKR` → `ELET` | Electronics | 1 | 1 | 0 | 0 | 1 | MAKR M9010 → ELET M9027 · Engineering Project Prototyping |
| `MANU` → `MACH` | Machine Tool Technology | 1 | 0 | 1 | 0 | 1 | MANU M1028 → MACH M1081 · Print Interpretation & Sketching (Blueprint 1) |
| `MATH` → `BSOT` | Office Technologies | 1 | 1 | 0 | 1 | 0 | MATH M1357 → BSOT M1357 · Refresher Math |
| `MATH` → `IDST` | Interdisciplinary Studies | 1 | 0 | 1 | 0 | 1 | MATH M1194 → IDST M1060 · Introduction to STEM Careers |
| `MUSC` → `ELET` | Electronics | 1 | 1 | 0 | 0 | 1 | MUSC M1033 → ELET M1054 · Introduction to Computer Programming - Audio Focus |
| `NUTR` → `FASH` | Fashion and Related Technologies | 1 | 1 | 0 | 0 | 1 | NUTR M1042 → FASH M1136 · The Food System and Career Opportunities |
| `NUTR` → `HLTH` | Health | 1 | 1 | 0 | 0 | 1 | NUTR M1047 → HLTH M1020 · Introduction to the Nutrition Professions |
| `PHSC` → `ASTR` | Astronomy | 1 | 0 | 1 | 0 | 1 | PHSC M1002 → ASTR M1053 · Astronomy |
| `POLS` → `CRIM` | Administration of Justice | 1 | 0 | 1 | 0 | 1 | POLS M1002 → CRIM M1183 · Basic Law Enforcement Academy |
| `PSYC` → `ETHS` | Ethnic Studies | 1 | 0 | 1 | 0 | 1 | PSYC M1024 → ETHS M1069 · Psychology of the Asian American |
| `PTAS` → `RADT` | Radiological Technology | 1 | 0 | 1 | 0 | 1 | PTAS M1002 → RADT M1085 · Clinical Education 2 |
| `SOCI` → `WMST` | Women’s Studies | 1 | 0 | 1 | 1 | 0 | SOCI M1069 → WMST M1069 · Introduction to Women's Studies |
| `SOCS` → `ANTH` | Anthropology | 1 | 0 | 1 | 0 | 1 | SOCS M1014 → ANTH M1099 · Native American Cultures |
| `SOCS` → `FTVE` | Film and Media Studies | 1 | 0 | 1 | 0 | 1 | SOCS M1050 → FTVE M1164 · History of Film |
| `SOCS` → `GERO` | Gerontology | 1 | 0 | 1 | 1 | 0 | SOCS M1054 → GERO M1054 · Introduction to Gerontology |
| `SOCS` → `SOCI` | Sociology | 1 | 1 | 0 | 0 | 1 | SOCS M1073 → SOCI M1069 · Intro to the Social Sciences |
| `SONO` → `EMST` | Emergency Medical Technologies | 1 | 1 | 0 | 0 | 1 | SONO M1015 → EMST M1106 · Emergency Medical Technician Clinical Observation |
| `SONO` → `HLTH` | Health | 1 | 1 | 0 | 0 | 1 | SONO M1010 → HLTH M1034 · Diagnostic Procedures 2, Adult Echocardiography |
| `SONO` → `PTAS` | Physical Therapy Assisting | 1 | 1 | 0 | 0 | 1 | SONO M1009 → PTAS M1002 · Pathophysiology 1 |
| `WELD` → `AUTB` | Auto Body Technology | 1 | 0 | 1 | 0 | 1 | WELD M10FI → AUTB M10FN · Unitized Body Panel, Section, & Frame; Replacement & Alignment |

## Held (Rule 7: TOP alone)

| id | would go to | discipline | title | members' evidence |
|---|---|---|---|---|
| `CNSC M1004` | `CARP` | Carpentry | Hand and Power Tool Application | top_code, top_code |
| `COMP M9074` | `BSOT` | Office Technologies | Introduction to iOS Application Development | top_code, top_code |
| `FCSH M1042` | `FASH` | Fashion and Related Technologies | Apparel and Textiles | top_code, top_division |
| `FCSH M9084` | `FASH` | Fashion and Related Technologies | Quilting and Patchwork (Ei) | top_code, top_division |
| `HLTH M1222` | `HEIT` | Health Information Technology | Introduction to Pathology | top_code, top_division |
| `ITIS M9056` | `BSOT` | Office Technologies | Computer Keyboarding Basics | top_code, top_division |
| `OSHA M1014` | `INDT` | Industrial Technology | Foreman Training and Ironworkers Union History | top_division, top_code |

## Gap-filled

| old | wanted | new | why |
|---|---|---|---|
| `HVAC M1105` | `ARCH M1105` | `ARCH M1020` | HVAC->ARCH: Architecture owns ARCH |
| `CRIM M1413` | `BUSI M1413` | `BUSI M1096` | CRIM->BUSI: Business owns BUSI |
| `ITIS M9050` | `COMP M9050` | `COMP M9075` | ITIS->COMP: Computer Science owns COMP |
| `CNSR M1017` | `CNSM M1017` | `CNSM M1041` | CNSR->CNSM: Construction Management owns CNSM |
| `HVAC M1079` | `CNST M1079` | `CNST M1130` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M1089` | `CNST M1089` | `CNST M1131` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M1091` | `CNST M1091` | `CNST M1132` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M1103` | `CNST M1103` | `CNST M1133` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M1109` | `CNST M1109` | `CNST M1134` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M1115` | `CNST M1115` | `CNST M1135` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M1123` | `CNST M1123` | `CNST M1136` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M9010` | `CNST M9010` | `CNST M9041` | HVAC->CNST: Construction Technology owns CNST |
| `MAKR M9010` | `ELET M9010` | `ELET M9027` | MAKR->ELET: Electronics owns ELET |
| `MUSC M1033` | `ELET M1033` | `ELET M1054` | MUSC->ELET: Electronics owns ELET |
| `SONO M1015` | `EMST M1015` | `EMST M1106` | SONO->EMST: Emergency Medical Technologies owns EMST |
| `GEOL M1075` | `ESCI M1075` | `ESCI M1001` | GEOL->ESCI: Environmental Technologies owns ESCI |
| `FCSH M1002` | `FASH M1002` | `FASH M1134` | FCSH->FASH: Fashion and Related Technologies owns FASH |
| `FCSH M1045` | `FASH M1045` | `FASH M1135` | FCSH->FASH: Fashion and Related Technologies owns FASH |
| `NUTR M1042` | `FASH M1042` | `FASH M1136` | NUTR->FASH: Fashion and Related Technologies owns FASH |
| `NUTR M1047` | `HLTH M1047` | `HLTH M1020` | NUTR->HLTH: Health owns HLTH |
| `SONO M1010` | `HLTH M1010` | `HLTH M1034` | SONO->HLTH: Health owns HLTH |
| `THTR M1314` | `MUSI M1314` | `MUSI M1081` | THTR->MUSI: Music owns MUSI |
| `THTR M1340` | `MUSI M1340` | `MUSI M1512` | THTR->MUSI: Music owns MUSI |
| `THTR M1345` | `MUSI M1345` | `MUSI M1542` | THTR->MUSI: Music owns MUSI |
| `THTR M1346` | `MUSI M1346` | `MUSI M1648` | THTR->MUSI: Music owns MUSI |
| `THTR M1366` | `MUSI M1366` | `MUSI M1649` | THTR->MUSI: Music owns MUSI |
| `THTR M1372` | `MUSI M1372` | `MUSI M1650` | THTR->MUSI: Music owns MUSI |
| `NRSV M1019` | `NRSR M1019` | `NRSR M1290` | NRSV->NRSR: Nursing owns NRSR |
| `NRSV M1020` | `NRSR M1020` | `NRSR M1291` | NRSV->NRSR: Nursing owns NRSR |
| `NRSV M1022` | `NRSR M1022` | `NRSR M1292` | NRSV->NRSR: Nursing owns NRSR |
| `NRSV M1023` | `NRSR M1023` | `NRSR M1293` | NRSV->NRSR: Nursing owns NRSR |
| `NRSV M1024` | `NRSR M1024` | `NRSR M1294` | NRSV->NRSR: Nursing owns NRSR |
| `NRSV M1025` | `NRSR M1025` | `NRSR M1295` | NRSV->NRSR: Nursing owns NRSR |
| `NRSV M1028` | `NRSR M1028` | `NRSR M1296` | NRSV->NRSR: Nursing owns NRSR |
| `NRSV M1029` | `NRSR M1029` | `NRSR M1297` | NRSV->NRSR: Nursing owns NRSR |
| `CNSR M1018` | `BSOT M1018` | `BSOT M1259` | CNSR->BSOT: Office Technologies owns BSOT |
| `COMP M9075` | `BSOT M9075` | `BSOT M9125` | COMP->BSOT: Office Technologies owns BSOT |
| `HTEC M1099` | `BSOT M1099` | `BSOT M1260` | HTEC->BSOT: Office Technologies owns BSOT |
| `ITIS M9055` | `BSOT M9055` | `BSOT M9126` | ITIS->BSOT: Office Technologies owns BSOT |
| `ITIS M9057` | `BSOT M9057` | `BSOT M9127` | ITIS->BSOT: Office Technologies owns BSOT |
| `ITIS M9058` | `BSOT M9058` | `BSOT M9128` | ITIS->BSOT: Office Technologies owns BSOT |
| `ITIS M9059` | `BSOT M9059` | `BSOT M9129` | ITIS->BSOT: Office Technologies owns BSOT |
| `SONO M1009` | `PTAS M1009` | `PTAS M1002` | SONO->PTAS: Physical Therapy Assisting owns PTAS |
| `SOCS M1073` | `SOCI M1073` | `SOCI M1069` | SOCS->SOCI: Sociology owns SOCI |
| `POLS M1002` | `CRIM M1002` | `CRIM M1183` | POLS->CRIM: Administration of Justice owns CRIM |
| `SOCS M1014` | `ANTH M1014` | `ANTH M1099` | SOCS->ANTH: Anthropology owns ANTH |
| `ARCH M1123` | `ARTS M1123` | `ARTS M1043` | ARCH->ARTS: Art owns ARTS |
| `HLTH M9036` | `ARTS M9036` | `ARTS M9006` | HLTH->ARTS: Art owns ARTS |
| `PHSC M1002` | `ASTR M1002` | `ASTR M1053` | PHSC->ASTR: Astronomy owns ASTR |
| `WELD M10FI` | `AUTB M10FI` | `AUTB M10FN` | WELD->AUTB: Auto Body Technology owns AUTB |
| `AVIA M1022` | `AUTO M1022` | `AUTO M1295` | AVIA->AUTO: Automotive Technology owns AUTO |
| `HVAC M1015` | `AUTO M1015` | `AUTO M1296` | HVAC->AUTO: Automotive Technology owns AUTO |
| `HVAC M1032` | `AUTO M1032` | `AUTO M1315` | HVAC->AUTO: Automotive Technology owns AUTO |
| `HVAC M10FU` | `AUTO M10FU` | `AUTO M11PC` | HVAC->AUTO: Automotive Technology owns AUTO |
| `HVAC M10GJ` | `AUTO M10GJ` | `AUTO M11PD` | HVAC->AUTO: Automotive Technology owns AUTO |
| `HVAC M10HH` | `AUTO M10HH` | `AUTO M11PE` | HVAC->AUTO: Automotive Technology owns AUTO |
| `FIMS M1039` | `BCST M1039` | `BCST M1057` | FIMS->BCST: Broadcasting Technology owns BCST |
| `HLTH M1061` | `BUSI M1061` | `BUSI M1099` | HLTH->BUSI: Business owns BUSI |
| `CNSC M10AK` | `CARP M10AK` | `CARP M10ER` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10AR` | `CARP M10AR` | `CARP M10ES` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10AS` | `CARP M10AS` | `CARP M10ET` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10AV` | `CARP M10AV` | `CARP M10EU` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10BN` | `CARP M10BN` | `CARP M10EV` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10BS` | `CARP M10BS` | `CARP M10EW` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10BX` | `CARP M10BX` | `CARP M10EX` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10BY` | `CARP M10BY` | `CARP M10EY` | CNSC->CARP: Carpentry owns CARP |
| `CNSC M10CA` | `CARP M10CA` | `CARP M10EZ` | CNSC->CARP: Carpentry owns CARP |
| `FCSH M1019` | `CDEV M1019` | `CDEV M1290` | FCSH->CDEV: Child Development/Early Childhood Education owns CDEV |
| `CISC M1020` | `ITIS M1020` | `ITIS M1209` | CISC->ITIS: Computer Information Systems owns ITIS |
| `CISC M1090` | `ITIS M1090` | `ITIS M1490` | CISC->ITIS: Computer Information Systems owns ITIS |
| `HVAC M10MA` | `ITIS M10MA` | `ITIS M12NA` | HVAC->ITIS: Computer Information Systems owns ITIS |
| `ELET M1074` | `CNST M1074` | `CNST M1137` | ELET->CNST: Construction Technology owns CNST |
| `ESCI M1001` | `CNST M1001` | `CNST M1138` | ESCI->CNST: Construction Technology owns CNST |
| `HVAC M1038` | `CNST M1038` | `CNST M1139` | HVAC->CNST: Construction Technology owns CNST |
| `HVAC M1039` | `CNST M1039` | `CNST M1140` | HVAC->CNST: Construction Technology owns CNST |
| `IDST M1060` | `COUN M1060` | `COUN M1209` | IDST->COUN: Counseling owns COUN |
| `HVAC M1009` | `AUTD M1009` | `AUTD M1042` | HVAC->AUTD: Diesel Mechanics owns AUTD |
| `HVAC M10FQ` | `AUTD M10FQ` | `AUTD M10FX` | HVAC->AUTD: Diesel Mechanics owns AUTD |
| `HVAC M10FR` | `AUTD M10FR` | `AUTD M10FY` | HVAC->AUTD: Diesel Mechanics owns AUTD |
| `ARCH M1020` | `DRAF M1020` | `DRAF M1088` | ARCH->DRAF: Drafting/CADD owns DRAF |
| `MANU M1008` | `DRAF M1008` | `DRAF M1089` | MANU->DRAF: Drafting/CADD owns DRAF |
| `MANU M1009` | `DRAF M1009` | `DRAF M1090` | MANU->DRAF: Drafting/CADD owns DRAF |
| `MANU M1012` | `DRAF M1012` | `DRAF M1091` | MANU->DRAF: Drafting/CADD owns DRAF |
| `MANU M1017` | `DRAF M1017` | `DRAF M1092` | MANU->DRAF: Drafting/CADD owns DRAF |
| `MANU M1037` | `DRAF M1037` | `DRAF M1093` | MANU->DRAF: Drafting/CADD owns DRAF |
| `MANU M1063` | `DRAF M1063` | `DRAF M1094` | MANU->DRAF: Drafting/CADD owns DRAF |
| `PHSC M1012` | `GEOL M1012` | `GEOL M1075` | PHSC->GEOL: Earth Science owns GEOL |
| `PHSC M1038` | `GEOL M1038` | `GEOL M1087` | PHSC->GEOL: Earth Science owns GEOL |
| `PHSC M1039` | `GEOL M1039` | `GEOL M1088` | PHSC->GEOL: Earth Science owns GEOL |
| `ELET M1054` | `ELEC M1054` | `ELEC M1055` | ELET->ELEC: Electricity owns ELEC |
| `HVAC M10BZ` | `ELEC M10BZ` | `ELEC M10HI` | HVAC->ELEC: Electricity owns ELEC |
| `HVAC M10FV` | `ELEC M10FV` | `ELEC M10HJ` | HVAC->ELEC: Electricity owns ELEC |
| `DSPS M1007` | `ENGL M1007` | `ENGL M1085` | DSPS->ENGL: English owns ENGL |
| `HVAC M10LF` | `ESCI M10LF` | `ESCI M10RD` | HVAC->ESCI: Environmental Technologies owns ESCI |
| `PSYC M1024` | `ETHS M1024` | `ETHS M1069` | PSYC->ETHS: Ethnic Studies owns ETHS |
| `SOCS M1050` | `FTVE M1050` | `FTVE M1164` | SOCS->FTVE: Film and Media Studies owns FTVE |
| `HLTH M1020` | `HTEC M1020` | `HTEC M1088` | HLTH->HTEC: Health Care Ancillaries owns HTEC |
| `MATH M1194` | `IDST M1194` | `IDST M1060` | MATH->IDST: Interdisciplinary Studies owns IDST |
| `COMM M1089` | `JOUR M1089` | `JOUR M1106` | COMM->JOUR: Journalism owns JOUR |
| `LIBS M1001` | `LIBR M1001` | `LIBR M1045` | LIBS->LIBR: Library Science owns LIBR |
| `LIBS M1003` | `LIBR M1003` | `LIBR M1046` | LIBS->LIBR: Library Science owns LIBR |
| `MANU M1028` | `MACH M1028` | `MACH M1081` | MANU->MACH: Machine Tool Technology owns MACH |
| `BUSI M1108` | `MATH M1108` | `MATH M1194` | BUSI->MATH: Mathematics owns MATH |
| `CISC M1066` | `MATH M1066` | `MATH M1357` | CISC->MATH: Mathematics owns MATH |
| `CULN M1104` | `MATH M1104` | `MATH M1361` | CULN->MATH: Mathematics owns MATH |
| `HVAC M1056` | `MATH M1056` | `MATH M1362` | HVAC->MATH: Mathematics owns MATH |
| `COMM M1098` | `FTVE M1098` | `FTVE M1165` | COMM->FTVE: Media Production owns FTVE |
| `FIMS M1031` | `FTVE M1031` | `FTVE M1166` | FIMS->FTVE: Media Production owns FTVE |
| `FIMS M1032` | `FTVE M1032` | `FTVE M1167` | FIMS->FTVE: Media Production owns FTVE |
| `ARTS M1166` | `MULT M1166` | `MULT M1174` | ARTS->MULT: Multimedia owns MULT |
| `CISC M1073` | `MULT M1073` | `MULT M1175` | CISC->MULT: Multimedia owns MULT |
| `CISC M1092` | `MULT M1092` | `MULT M1176` | CISC->MULT: Multimedia owns MULT |
| `COMM M1069` | `MULT M1069` | `MULT M1177` | COMM->MULT: Multimedia owns MULT |
| `COMM M1071` | `MULT M1071` | `MULT M1178` | COMM->MULT: Multimedia owns MULT |
| `FIMS M1098` | `MULT M1098` | `MULT M1179` | FIMS->MULT: Multimedia owns MULT |
| `DANC M1144` | `MUSI M1144` | `MUSI M1651` | DANC->MUSI: Music owns MUSI |
| `BUSI M1096` | `BSOT M1096` | `BSOT M1261` | BUSI->BSOT: Office Technologies owns BSOT |
| `BUSI M1357` | `BSOT M1357` | `BSOT M1262` | BUSI->BSOT: Office Technologies owns BSOT |
| `ARTS M9006` | `OLAD M9006` | `OLAD M9063` | ARTS->OLAD: Older Adults: Noncredit owns OLAD |
| `AGRI M1062` | `HORT M1062` | `HORT M1115` | AGRI->HORT: Ornamental Horticulture owns HORT |
| `COUN M9021` | `PARN M9021` | `PARN M9064` | COUN->PARN: Parent Education: Noncredit owns PARN |
| `ARTD M1009` | `PHOT M1009` | `PHOT M1141` | ARTD->PHOT: Photography owns PHOT |
| `ARTS M1043` | `PHOT M1043` | `PHOT M1142` | ARTS->PHOT: Photography owns PHOT |
| `ETHS M1069` | `POLS M1069` | `POLS M1002` | ETHS->POLS: Political Science owns POLS |
| `PTAS M1002` | `RADT M1002` | `RADT M1085` | PTAS->RADT: Radiological Technology owns RADT |

## Validation

- ✅ V1_conservation
- ✅ V2_new_ids_unique
- ✅ V3_new_ids_disjoint_from_untouched
- ✅ V4_discipline_unchanged
- ✅ V5_alias_invertible
- ✅ V6_all_new_subj4_four_letters
- ✅ V7_no_overflow
- ✅ V9_no_swap_cycles
- ✅ V8_parity_with_fold_verify

Identities-map ghosts: 1604 (healed by this fold: 8; vacated keys still in identities: 0).
