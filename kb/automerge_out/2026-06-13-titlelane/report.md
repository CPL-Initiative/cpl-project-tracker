# Auto-merge pass 1 — DRY-RUN plan (2026-06-13)

Worklist payload: `2026-06-13 15:11` · curation overlay: synced same run · marker: `automerge-titlelane-v1` · **nothing applied**.

## Planned: **5456 groups** → 16801 merge rows + 5224 title rows (22025 curation upserts)

| lane | planned |
|---|---|
| anchored (merge into existing identity) | 0 |
| singleton (mint new unified course) | 0 |
| title (merge into M-ID, else mint) | 5456 |

## Excluded (stays human / already handled)

| reason | groups |
|---|---|
| title: already consumed (<2 live members) | 1 |

## Units spread across planned groups (5456)

| spread | groups |
|---|---|
| 0 (uniform) | 2635 |
| ≤1u | 1287 |
| ≤2u | 863 |
| ≤4u | 480 |
| >4u | 191 |

## Title regularizations (4 of 5456 planned groups)

First 25 (longest-member title → chosen unified title):

- `Genetics and Society - Honors` → **Genetics and Society Honors**
- `Professional and Organizational Speaking - Honors` → **Professional and Organizational Speaking Honors**
- `Introduction to World Religions - Honors` → **Introduction to World Religions Honors**
- `History of Asia from Pre-History to Early Modern - Honors` → **History of Asia from Pre-History to Early Modern Honors**

## Random sample of 60 planned groups (seeded — reproducible)

### title → `UC-CUR-AUTO8EC79622` (Unified (new)) · title: unchanged → **California Naturalist Certification**
- `ENVR M10BM` (Stand-Alone) California Naturalist Certification · 1.5u
- `ENVR M10BP` (Stand-Alone) California Naturalist Program · 4.5u

### title → `UC-CUR-AUTO5E8A29EF` (Unified (new)) · title: unchanged → **Evidence-Based Practice in Occupational Therapy Interventions**
- `OCTA M10AV` (Stand-Alone) Evidence Based Practice · 2.0u
- `PTAS M10BH` (Stand-Alone) Evidence-Based Physical Therapy · 1.0u
- `RSPT M10ER` (Stand-Alone) Principles of Evidence Based Medicine · 3.0u
- `OCTA M10AU` (Stand-Alone) Evidence-Based Practice in Occupational Therapy Interventions · 3.0u
- `RSPT M10EO` (Stand-Alone) Respiratory Care Management Using Evidence Based Medicine · 3.0u
- `RSPT M10EN` (Stand-Alone) Evidence Based Critical Care Research in Respiratory Therapy · 3.0u

### title → `AVIA M1043` (M-ID) · title: unchanged → **Commercial Pilot Aviation Ground School**
- `AVIA M1043` (M-ID) Instrument Ground School · 3.0u
- `AVIA M1036` (M-ID) Commercial Pilot Ground School · 3.0u
- `AVIA M1042` (M-ID) Instrument Rating Ground School · 3.0u
- `AVIA M1044` (M-ID) Private Pilot Ground School · 5.0u
- `AVIA M10AP` (Stand-Alone) Private Pilot 2 Ground School · 4.0u
- `AVIA M10KI` (Stand-Alone) Commercial Pilot Aviation Ground School · 3.0u
- `AVIA M10LF` (Stand-Alone) Instrument Pilot Aviation Ground School · 3.0u
- `AVIA M10LG` (Stand-Alone) Private Pilot Aviation Ground School · 5.0u
- `AVIA M10LH` (Stand-Alone) Aviation - Pilot Ground School · 3.0u

### title → `UC-CUR-AUTO41DA97B1` (Unified (new)) · title: unchanged → **Metal Sculpture - Lost Wax Bronze Casting**
- `ARTS M11CQ` (Stand-Alone) Lost Wax Bronze Casting · 3.0u
- `ARTS M11CP` (Stand-Alone) Metal Sculpture - Lost Wax Bronze Casting · 3.0u

### title → `UC-CUR-AUTO62D236DB` (Unified (new)) · title: unchanged → **Civil Litigation and Trial Preparation**
- `PLGL M10AW` (Stand-Alone) Advanced Civil Litigation · 3.0u
- `PLGL M10DF` (Stand-Alone) Civil Litigation/Trial Prep. · 3.0u
- `PLGL M10AX` (Stand-Alone) Advanced Civil Litigation Procedures · 4.0u
- `PLGL M10CT` (Stand-Alone) Discovery in Civil Litigation · 2.0u
- `PLGL M10DG` (Stand-Alone) Civil Litigation and Trial Preparation · 3.0u

### title → `ECED M1070` (M-ID) · title: unchanged → **Bilingual Education in the United States: Yesterday and Today**
- `ECED M1070` (M-ID) Introduction to Bilingual Education · 3.0u
- `EDUC M10DA` (Stand-Alone) Bilingual Education in the United States · 3.0u
- `EDUC M10CZ` (Stand-Alone) Bilingual Education in the United States: Yesterday and Today · 3.0u

### title → `MUSI M1421` (M-ID) · title: unchanged → **Keyboard Improvisation 2**
- `MUSI M1421` (M-ID) Keyboard Skills 2 · 1.0u
- `MUSI M12EV` (Stand-Alone) Keyboard Improvisation 2 · 2.0u

### title → `UC-CUR-AUTOB5FDAEA3` (Unified (new)) · title: unchanged → **Conditioning and Injury Prevention for Beach Volleyball**
- `ETHS M10KW` (Stand-Alone) Conditioning and Injury Prevention for Athletics · 1.5u
- `ETHS M10LA` (Stand-Alone) Conditioning and Injury Prevention for Beach Volleyball · 1.5u

### title → `UC-CUR-AUTO85A1F2F7` (Unified (new)) · title: unchanged → **Psychrometrics and Load Calculations**
- `HVAC M10LR` (Stand-Alone) Psychrometrics and Load Calculations · 2.0u
- `CNST M10HI` (Stand-Alone) Load Calculations and Circuit Design · 3.0u

### title → `ARTS M1229` (M-ID) · title: kept curator title
- `ARTS M1229` (M-ID) Ceramics - Handbuilding 1 · 3.0u
- `ARTS M10ZU` (Stand-Alone) Ceramics-Beg Wheel · 3.0u
- `ARTS M11FH` (Stand-Alone) Ceramic Handbuilding · 3.0u
- `ARTS M11FK` (Stand-Alone) Ceramic Sculpture/Handbuilding · 3.0u
- `ARTS M11HN` (Stand-Alone) Ceramics-Handbuilding: Introduction · 3.5u
- `ARCE M10AC` (Stand-Alone) Ceramic Handbuilding 1 · 3.0u
- `ARTS M10ZT` (Stand-Alone) Beg. Handbuilding Ceramics · 3.0u
- `ARTS M11HK` (Stand-Alone) Interm. Handbuilding Ceramics · 3.0u
- `ARTS M11FJ` (Stand-Alone) Introduction to Ceramic Handbuilding · 3.0u

### title → `FIMS M1067` (M-ID) · title: unchanged → **Introduction to Documentary Film Studies**
- `FIMS M1067` (M-ID) Documentary Film: Studies and Practice · 4.0u
- `FIMS M10KK` (Stand-Alone) Documentary Studies · 3.0u
- `FTMA M10AO` (Stand-Alone) Introduction to Documentary Studies · 3.0u
- `FIMS M10KE` (Stand-Alone) Introduction to Documentary Film Studies · 3.0u

### title → `CRIM M1223` (M-ID) · title: unchanged → **Ethical Reasoning in the Justice System**
- `CRIM M1223` (M-ID) Ethical Reasoning in the Justice System · 3.0u
- `CRIM M11DB` (Stand-Alone) Ethical Reasoning in Criminal Justice · 3.0u

### title → `UC-CUR-AUTO108E1653` (Unified (new)) · title: unchanged → **AMGA Single Pitch Instructor Assessment**
- `WELD M10VI` (Stand-Alone) Single Pitch Instructor · 3.0u
- `WELD M10FS` (Stand-Alone) AMGA Single Pitch Instructor Assessment · 1.0u
- `WELD M10FU` (Stand-Alone) AMGA Single Pitch Instructor Course · 1.5u

### title → `UC-CUR-AUTO36128B79` (Unified (new)) · title: unchanged → **Advanced Dairy Cattle Selection & Evaluation**
- `AGRI M10LQ` (Stand-Alone) Dairy Cattle Selection & Evaluation · 3.0u
- `AGRI M10AT` (Stand-Alone) Advanced Dairy Cattle Selection & Evaluation · 3.0u

### title → `UC-CUR-AUTO526FAB8C` (Unified (new)) · title: unchanged → **Joining and Fastening 2**
- `AUTO M11LU` (Stand-Alone) Joining and Fastening · 2.0u
- `AUTO M11LT` (Stand-Alone) Joining and Fastening 2 · 2.0u

### title → `UC-CUR-AUTO1FEF459D` (Unified (new)) · title: unchanged → **Hand Tools - Introduction and Safety**
- `MAKR M90AZ` (Stand-Alone) Hand Tools - Production · 0.0u
- `MAKR M90AU` (Stand-Alone) Hand Tools - Design and Testing · 0.0u
- `MAKR M90AY` (Stand-Alone) Hand Tools - Introduction and Safety · 0.0u

### title → `BUSI M1298` (M-ID) · title: unchanged → **Fundamentals of Importing and Exporting**
- `BUSI M1298` (M-ID) Principles of Importing and Exporting · 3.0u
- `BUSI M11HY` (Stand-Alone) Fund Importing/Exporting · 3.0u
- `BUSI M10NO` (Stand-Alone) Basics of Exporting · 1.0u
- `BUSI M10NR` (Stand-Alone) Basics of Importing · 1.0u
- `BUSI M11KC` (Stand-Alone) Fundamentals of Importing · 1.0u
- `BUSI M10NP` (Stand-Alone) Basics of Importing and Exporting · 3.0u
- `BUSI M11IA` (Stand-Alone) Fundamentals of Importing and Exporting · 3.0u
- `BUSI M11IC` (Stand-Alone) Survey of Exporting and Importing · 3.0u

### title → `UC-CUR-AUTO6494BB5D` (Unified (new)) · title: unchanged → **Mock Lab as Coreq ENGL 330 EVC**
- `ENGL M10AP` (Stand-Alone) ENGL Mock Lab Coreq Engl 102 · 0.0u
- `ENGL M10AR` (Stand-Alone) ENGL Mock Lab Coreq ENGL 104 · 0.0u
- `ENGL M10DX` (Stand-Alone) Mock Lab as Coreq ENGL 330 EVC · 0.0u

### title → `UC-CUR-AUTO5863316B` (Unified (new)) · title: unchanged → **Vehicle Theft for Patrol and Traffic Officers**
- `CRIM M11QE` (Stand-Alone) Vehicle Theft Investigation, Patrol · 0.3u
- `PUBS M10ES` (Stand-Alone) Advanced Vehicle Theft Investigation · 2.3u
- `PUBS M10QW` (Stand-Alone) Vehicle Theft for Patrol Officers · 1.5u
- `CRIM M11SH` (Stand-Alone) Vehicle Theft for Patrol and Traffic Officers · 0.3u

### title → `UC-CUR-AUTOB820CAA2` (Unified (new)) · title: unchanged → **Contemporary Case Furniture Production**
- `CSTF M10BT` (Stand-Alone) Contemporary Case Furniture Design · 3.0u
- `CSTF M10BU` (Stand-Alone) Contemporary Case Furniture Production · 3.0u
- `CSTF M10BV` (Stand-Alone) Period Case Furniture Design · 3.0u
- `CSTF M10BW` (Stand-Alone) Period Case Furniture Production · 3.0u

### title → `UC-CUR-AUTO516A83DD` (Unified (new)) · title: unchanged → **BLS for Healthcare Providers & Heartsaver CPR/ First Aid**
- `EMST M90AS` (Stand-Alone) Community First Aid/CPR/AED · 0.0u
- `EMST M90AT` (Stand-Alone) HeartSaver First Aid, CPR, AED (Hands-On) · 0.0u
- `EMST M90AU` (Stand-Alone) HeartSaver First Aid, CPR, AED (Lecture) · 0.0u
- `HTEC M90AI` (Stand-Alone) First Aid and CPR/AED for PCA Noncredit · 0.0u
- `EMST M90AL` (Stand-Alone) Adult and Pediatric CPR, First Aid, and AED · 0.0u
- `EMST M90AZ` (Stand-Alone) BLS for Healthcare Providers & Heartsaver CPR/ First Aid · 0.0u

### title → `SOCS M1023` (M-ID) · title: unchanged → **Boronda Study Program - Life and Culture**
- `SOCS M1023` (M-ID) Boronda Study Group · 3.0u
- `SOCS M1022` (M-ID) Boronda Study Program - Life and Culture · 3.0u

### title → `FLRU M1007` (M-ID) · title: unchanged → **Elementary Russian - Level 2**
- `FLRU M1007` (M-ID) Elementary Russian 2 · 5.0u
- `FLRU M10AK` (Stand-Alone) Beginning Russian 2 · 5.0u
- `FLRU M10AT` (Stand-Alone) Elementary Russian Part 2 · 3.0u
- `FLRU M10AD` (Stand-Alone) Elementary Russian - Level 2 · 5.0u

### title → `FLSP M1027` (M-ID) · title: unchanged → **French and Francophone Short Story in Translation**
- `FLSP M1027` (M-ID) Latin American Short Story · 4.0u
- `FLSP M1028` (M-ID) Spanish American Short Story in Translation · 3.0u
- `FLSP M10CU` (Stand-Alone) The Short Story: Latin America · 4.0u
- `FLFR M10DC` (Stand-Alone) French and Francophone Short Story in Translation · 3.0u

### title → `UC-CUR-AUTO85CEE727` (Unified (new)) · title: unchanged → **Basic Life Support-CPR Renewal American Heart Association**
- `EMST M90BC` (Stand-Alone) Basic Life Support-CPR Renewal American Heart Association · 0.0u
- `EMST M90BB` (Stand-Alone) Basic Life Support (BLS) - American Heart Association · 0.0u

### title → `THEA M1030` (M-ID) · title: unchanged → **Advanced Improvisational Acting**
- `THEA M1030` (M-ID) Improvisational Acting · 3.0u
- `THEA M10FR` (Stand-Alone) Advanced Improvisational Acting · 3.0u

### title → `COUN M1106` (M-ID) · title: unchanged → **Treatment Considerations with Diverse Populations**
- `COUN M1106` (M-ID) Issues of Diverse Populations · 3.0u
- `COUN M1107` (M-ID) Working with Diverse Populations · 3.0u
- `COUN M10QQ` (Stand-Alone) Diverse Populations · 3.0u
- `COUN M10QR` (Stand-Alone) Serving Diverse Populations · 3.0u
- `COUN M10EB` (Stand-Alone) Addictions and Diverse Populations · 3.0u
- `COUN M10NQ` (Stand-Alone) Treatment Considerations with Diverse Populations · 3.0u
- `COUN M10QO` (Stand-Alone) Diverse Populations in Human Services · 3.0u

### title → `UC-CUR-AUTO1C890D03` (Unified (new)) · title: unchanged → **Natural Gas Installation, Drainage**
- `HVAC M10PW` (Stand-Alone) Natural Gas Installation, Drainage · 5.0u
- `PLMB M10CL` (Stand-Alone) Gas Installation and Drainage · 4.0u

### title → `UC-CUR-AUTO44DC08DC` (Unified (new)) · title: unchanged → **Spanish for Heritage and Bilingual Speakers 1B**
- `FLSP M10AS` (Stand-Alone) Spanish for Heritage Speakers 1B · 3.0u
- `FLSP M10AR` (Stand-Alone) Spanish for Heritage and Bilingual Speakers 1B · 3.0u

### title → `UC-CUR-AUTODE919F9B` (Unified (new)) · title: unchanged → **Apple Mac OS Support Essentials**
- `CSIS M10RT` (Stand-Alone) Apple Mac Hardware · 3.0u
- `CSIS M10RU` (Stand-Alone) Apple Mac Operating System · 2.0u
- `OTEC M10OE` (Stand-Alone) Introduction to Mac OS · 1.0u
- `CSIS M10RS` (Stand-Alone) Apple Mac OS Support Essentials · 3.5u

### title → `HTEC M1015` (M-ID) · title: unchanged → **Medical-Surgical Nursing: Nutrition/Elimination/ Surgical Asepsis**
- `HTEC M1015` (M-ID) Medical Asepsis and Surgical Procedures · 3.0u
- `NRSR M10MV` (Stand-Alone) Medical-Surgical Nursing: Nutrition/Elimination/ Surgical Asepsis · 6.0u
- `NRSR M10MU` (Stand-Alone) Medical-Surgical Nursing: Nutrition, Elimination, Surgical Asepis · 7.0u

### title → `DENT M1094` (M-ID) · title: unchanged → **Contemporary Dental Materials for the Dental Hygienist**
- `DENT M1094` (M-ID) Periodontics 1 · 2.0u
- `DENT M1068` (M-ID) Periodontics for the Dental Hygienist · 2.0u
- `DENT M1069` (M-ID) Pharmacology for the Dental Hygienist · 3.0u
- `DENT M10NE` (Stand-Alone) Periodontics for Dental Hygiene 1 · 2.0u
- `DENT M10LV` (Stand-Alone) Dental Materials for the Dental Hygienist · 2.0u
- `DENT M10OC` (Stand-Alone) Oral Pathology for the Dental Hygienist · 2.0u
- `DENT M10LC` (Stand-Alone) Contemporary Dental Materials for the Dental Hygienist · 1.5u

### title → `RSPT M1043` (M-ID) · title: unchanged → **Interventional Pulmonology Theory & Application**
- `RSPT M1043` (M-ID) Interventional Pulmonology Procedures · 5.0u
- `RSPT M10MF` (Stand-Alone) Interventional Pulmonology Research Project · 1.0u
- `RSPT M10DJ` (Stand-Alone) Interventional Pulmonology Theory & Application · 5.0u

### title → `FIRE M1390` (M-ID) · title: unchanged → **Emergency Trench Rescue Operations**
- `FIRE M1390` (M-ID) Trench Rescue · 1.5u
- `FIRE M1312` (M-ID) Emergency Trench Rescue · 0.5u
- `FIRE M1389` (M-ID) Trench Rescue Technician · 0.5u
- `FIRE M11FX` (Stand-Alone) Emergency Trench Rescue Operations · 1.0u

### title → `HVAC M1062` (M-ID) · title: unchanged → **Safe Refrigerant Handling & Management**
- `HVAC M1062` (M-ID) Safe Refrigerant Handling & Management · 3.0u
- `HVAC M10SK` (Stand-Alone) Refrigerant Handling Procedures · 2.0u

### title → `UC-CUR-AUTOF24BC3AA` (Unified (new)) · title: unchanged → **Accelerated Track Obstetrics and Pediatric Nursing Clinical**
- `NRSR M10DZ` (Stand-Alone) Accelerated Track Normal and Advanced Obstetrics Nursing · 1.5u
- `NRSR M10EA` (Stand-Alone) Accelerated Track Normal and Advanced Pediatric Nursing · 1.5u
- `NRSR M10EH` (Stand-Alone) Accelerated Track Obstetrics and Pediatric Nursing Clinical · 2.0u

### title → `CULN M1045` (M-ID) · title: unchanged → **Professional Baking and Pastry Production 2**
- `CULN M1045` (M-ID) Baking and Pastry · 4.0u
- `CULN M1043` (M-ID) Introduction to Baking and Pastry
- `CULN M10HA` (Stand-Alone) Baking and Pastry 2 · 2.5u
- `CULN M10FN` (Stand-Alone) Components of Baking and Pastry · 2.0u
- `CULN M10FX` (Stand-Alone) Culinary Fundamentals: Baking and Pastry · 4.5u
- `CULN M10GK` (Stand-Alone) Fundamentals of Baking and Pastry · 8.5u
- `CULN M10GB` (Stand-Alone) Food Production - Baking and Pastry · 3.0u
- `CULN M10HB` (Stand-Alone) Professional Baking and Pastry Production 2 · 5.0u
- `CULN M10FU` (Stand-Alone) Baking & Pastry Skills for Cul Students · 3.0u
- ⚠ wide units spread (6.5u)

### title → `UC-CUR-AUTOBA477950` (Unified (new)) · title: unchanged → **Introduction to Investigative Reporting**
- `FIMS M10OD` (Stand-Alone) Investigative Reporting On-Line · 3.0u
- `JOUR M10GT` (Stand-Alone) Introduction to Investigative Reporting · 3.0u

### title → `DSPS M9006` (M-ID) · title: unchanged → **Adaptive Art for Disabled Adults**
- `DSPS M9006` (M-ID) Adaptive Music-Disabled · 0.0u
- `DSPS M90AM` (Stand-Alone) Adaptive Art for Disabled Adults · 0.0u

### title → `UC-CUR-AUTO818FCD52` (Unified (new)) · title: unchanged → **Scenic Adventure Field Trips in Geology**
- `GEOL M10GR` (Stand-Alone) Geology Field Trips · 1.0u
- `GEOL M10AD` (Stand-Alone) Scenic Adventure Field Trips in Geology · 1.5u

### title → `PLMB M1003` (M-ID) · title: unchanged → **Advanced Plan Reading for the Piping Trades**
- `PLMB M1003` (M-ID) Advanced Drawing in the Piping Trades · 2.0u
- `STMF M1018` (M-ID) Related Science in the Piping Trades · 1.5u
- `STMF M10AI` (Stand-Alone) Advanced Plan Reading for the Piping Trades · 1.5u

### title → `UC-CUR-AUTO9E15A6BA` (Unified (new)) · title: unchanged → **Chocolate, Confectionary Art, and Specialty Desserts**
- `CULN M10MU` (Stand-Alone) Introduction to Chocolate and Confectionary · 2.0u
- `CULN M10DA` (Stand-Alone) Chocolate, Confectionary Art, and Specialty Desserts · 3.0u

### title → `MATH M1028` (M-ID) · title: kept curator title
- `MATH M1028` (M-ID) College Algebra for Liberal Arts with Support
- `MATH M1042` (M-ID) Just in Time Support for College Algebra · 1.0u
- `MATH M1173` (M-ID) Just in Time Support for Calculus 2 · 1.0u
- `MATH M10KN` (Stand-Alone) Just-In-Time Support for Intermediate Algebra · 2.0u
- `MATH M10FZ` (Stand-Alone) College Algebra for Liberal Arts and Humanities · 3.0u
- `MATH M10GA` (Stand-Alone) Just-In-Time Support for College Algebra for Liberal Arts · 1.0u
- `MATH M10OE` (Stand-Alone) Just-In-Time Support for Calculus and Analytical Geometry 2 · 1.5u
- `MATH M10IB` (Stand-Alone) Just in Time Support for College Algebra for STEM · 0.5u
- `MATH M10PM` (Stand-Alone) Just in Time Support for Math for Liberal Arts · 0.5u

### title → `THEA M1132` (M-ID) · title: unchanged → **Performance Workshop: Styles, Periods and Skills 2**
- `THEA M1132` (M-ID) Costume Periods and Styles · 3.0u
- `THEA M1007` (M-ID) Performance Workshop: Styles, Periods and Skills 2 · 3.0u

### title → `CRIM M1259` (M-ID) · title: unchanged → **Intelligence Analysis and Security Management for Homeland Security**
- `CRIM M1259` (M-ID) Homeland Security · 3.0u
- `CRIM M1257` (M-ID) Introduction to Homeland Security · 3.0u
- `CRIM M1260` (M-ID) Terrorism and Homeland Security · 3.0u
- `CRIM M1255` (M-ID) Homeland Security and Intelligence Gathering · 3.0u
- `CRIM M1258` (M-ID) Introduction to Homeland Security and Terrorism · 3.0u
- `CRIM M10XM` (Stand-Alone) Contemporary Issues in Homeland Security · 3.0u
- `PUBS M10PM` (Stand-Alone) Homeland Security: Leadership, Policy and Practice · 3.0u
- `CRIM M10MM` (Stand-Alone) Intelligence Analysis and Security Management for Homeland Security · 3.0u

### title → `UC-CUR-AUTOCF5712D9` (Unified (new)) · title: unchanged → **Computer Programming Structured Cobol**
- `CSIS M11HG` (Stand-Alone) Cobol Programming 1 · 4.0u
- `CSIS M11HF` (Stand-Alone) Computer Programming Structured Cobol · 4.0u
- `CSIS M11HE` (Stand-Alone) Computer Prog Inter Structured Cobol · 4.0u

### title → `ARTS M1467` (M-ID) · title: unchanged → **Graphic Arts Production and Pre-Press**
- `ARTS M1467` (M-ID) Introduction to Pre-Press · 4.0u
- `GRAF M10GT` (Stand-Alone) Digital Pre-Press · 3.0u
- `GRAF M10CM` (Stand-Alone) Graphic Arts Production and Pre-Press · 4.0u

### title → `HORT M1020` (M-ID) · title: unchanged → **Advances in Vineyard Integrated Pest and Disease Management**
- `HORT M1020` (M-ID) Pest Control Licensing or Certification · 2.0u
- `HORT M1040` (M-ID) Landscape and Vineyard Pest and Disease Management · 3.0u
- `HORT M10FO` (Stand-Alone) Home Pest Control · 1.0u
- `HORT M10FQ` (Stand-Alone) Sustainable Pest Control · 3.0u
- `AGPR M10CZ` (Stand-Alone) Plant Pest Identification and Control · 3.0u
- `AGPR M10DL` (Stand-Alone) Plant Pest and Disease Management · 3.0u
- `AGPR M10DM` (Stand-Alone) Vineyard Pest and Disease Management · 3.0u
- `HORT M10EM` (Stand-Alone) Pest Control Certification and Safety · 3.0u
- `AGPR M10AW` (Stand-Alone) Advances in Vineyard Integrated Pest and Disease Management · 0.5u

### title → `UC-CUR-AUTOCA6F2888` (Unified (new)) · title: unchanged → **FrameCAD Workshop 1 Noncredit**
- `ARCH M90AC` (Stand-Alone) FrameCAD Studio 1 Noncredit · 0.0u
- `ARCH M90AD` (Stand-Alone) FrameCAD Workshop 1 Noncredit · 0.0u

### title → `UC-CUR-AUTO4BA33C8F` (Unified (new)) · title: unchanged → **International Classification of Diseases, Diagnostic Coding**
- `HEIT M10BO` (Stand-Alone) International Classification of Diseases, Diagnostic Coding · 2.0u
- `HEIT M10BR` (Stand-Alone) International Classification of Diseases, Procedural Coding · 3.0u
- `HEIT M10BP` (Stand-Alone) International Classification of Diseases, (ICD) Coding 1 · 4.0u

### title → `UC-CUR-AUTOD2622FBF` (Unified (new)) · title: unchanged → **Introduction to Carpentry and Construction Fundamentals**
- `CARP M90AC` (Stand-Alone) Construction Finish Carpentry · 0.0u
- `CNST M90BE` (Stand-Alone) Finish Carpentry Fundamentals · 0.0u
- `CARP M90AD` (Stand-Alone) Intermediate Construction Finish Carpentry · 0.0u
- `CARP M90AE` (Stand-Alone) Introduction to Carpentry and Construction Fundamentals · 0.0u

### title → `FIRE M1159` (M-ID) · title: unchanged → **Air Tactical Group Supervisor (ATGS) Workshop (RT-378)**
- `FIRE M1159` (M-ID) Air Support Group Supervisor (S-375) · 2.0u
- `FIRE M10NV` (Stand-Alone) Air Tactical Group Supervisor (ATGS) Workshop (RT-378) · 1.0u

### title → `UC-CUR-AUTO56560477` (Unified (new)) · title: unchanged → **Agricultural Ambassadors - Public Relations**
- `AGRI M10BX` (Stand-Alone) Agricultural Ambassadors - Introduction · 2.0u
- `AGRI M10BZ` (Stand-Alone) Agricultural Ambassadors - Recruitment · 2.0u
- `AGRI M10BY` (Stand-Alone) Agricultural Ambassadors - Public Relations · 2.0u

### title → `UC-CUR-AUTOBF787C65` (Unified (new)) · title: unchanged → **CompTIA Security+ Computer Hardware Systems**
- `INDT M10KP` (Stand-Alone) CompTIA Network+ Certification Training · 3.0u
- `ELET M10IH` (Stand-Alone) CompTIA Network+ Computer Hardware Systems · 3.0u
- `ELET M10II` (Stand-Alone) CompTIA Security+ Computer Hardware Systems · 3.0u
- `INDT M10LW` (Stand-Alone) CompTIA A+ Computer Hardware Systems · 3.0u
- `INDT M10LV` (Stand-Alone) CompTIA Server+ Computer Hardware Systems 2 · 3.0u

### title → `UC-CUR-AUTO01BC3268` (Unified (new)) · title: unchanged → **Product Design and Rapid Prototyping Workshop**
- `ENGR M10FA` (Stand-Alone) Design and Prototyping · 2.0u
- `DRAF M10BE` (Stand-Alone) Advanced 3D Modeling/Rapid Prototyping · 3.0u
- `DRAF M10JF` (Stand-Alone) Rapid Design and Prototyping · 3.0u
- `MANU M10IV` (Stand-Alone) Innovation Using Rapid Prototyping · 3.0u
- `DRAF M10AW` (Stand-Alone) 3D Printing/3D Modeling for Prototyping · 3.0u
- `MANU M10JF` (Stand-Alone) Introduction to Rapid Prototyping Technology · 3.0u
- `DRAF M10JD` (Stand-Alone) Product Design and Rapid Prototyping Workshop · 3.0u

### title → `CSTF M1003` (M-ID) · title: unchanged → **Traditional Furniture Lab**
- `CSTF M1003` (M-ID) Traditional Furniture Lab · 1.5u
- `CSTF M10AH` (Stand-Alone) Advanced Furniture Lab · 0.5u

### title → `UC-CUR-AUTO48EECAE0` (Unified (new)) · title: unchanged → **Playwriting/Screenwriting for Production**
- `THEA M11SU` (Stand-Alone) Introductory Playwriting/Screenwriting · 3.0u
- `THEA M11WT` (Stand-Alone) Playwriting/Screenwriting for Production · 3.0u
- `THEA M11WU` (Stand-Alone) Playwriting and Screenwriting · 3.0u

### title → `BIOL M1252` (M-ID) · title: unchanged → **Introduction to Medical Microbiology**
- `BIOL M1252` (M-ID) Medical Microbiology · 4.0u
- `BIOL M1242` (M-ID) Introduction to Microbiology · 4.0u
- `BIOL M11AW` (Stand-Alone) Introduction to Medical Microbiology · 4.0u

### title → `NRSV M1017` (M-ID) · title: unchanged → **Fundamentals of Voc Nursing**
- `NRSV M1017` (M-ID) Pharmacology for Nurses · 2.0u
- `NRSR M11QB` (Stand-Alone) Nursing Perspectives · 1.5u
- `NRSR M11QC` (Stand-Alone) Voc Nursing Perspectives · 1.5u
- `NRSR M11EZ` (Stand-Alone) Fundamentals of Voc Nursing · 1.5u
- `NRSR M11IB` (Stand-Alone) Pharmacology for Nurses 1 · 2.0u
- `NRSR M11IH` (Stand-Alone) Voc Nursing Pharmacology 1 · 1.0u
- `NRSR M11IM` (Stand-Alone) Voc Nursing Seminar 1 · 1.0u
- `NRSR M11PR` (Stand-Alone) Pharmacology for Voc Nurses · 2.0u

### title → `BARB M1001` (M-ID) · title: unchanged → **Barbering Techniques and Hair Design Concepts**
- `BARB M1001` (M-ID) Barbering Chemical Concepts · 0.0u
- `BARB M1003` (M-ID) Barbering Fundamental Concepts · 4.5u
- `BARB M1004` (M-ID) Barbering Techniques and Hair Design · 4.5u
- `BARB M1002` (M-ID) Barbering Techniques and Hair Design Concepts · 6.0u
- `BARB M10AB` (Stand-Alone) Barbering Advanced Concepts · 4.5u
- `COSM M10HL` (Stand-Alone) Cosmetology Hair Design Concepts · 6.0u
- `COSM M10ES` (Stand-Alone) Barbering Theory Exam Readiness Concepts · 0.5u
- ⚠ wide units spread (6.0u)

## Apply procedure (NOT tonight — after Sam's skim)

1. Re-run this planner against fresh `main` (post-cron) in the apply sitting.
2. Execute `supabase_ops.sql` in batches via the Supabase session (ON CONFLICT DO NOTHING — human rows always win).
3. Fold the overlay (`kb/_apply_curation.py`) or let the daily cron publish.
4. Second-look handle: `select * from kb_curation where reviewed_by = 'automerge-titlelane-v1'`.
