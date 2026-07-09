# Credential Rename Dry-Run — 2026-07-09

Generated: `2026-07-09T00:23:48Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 18 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |
|---|---|---:|---:|---:|---:|
| `C++ Programming II` | ⇒ `C++ Programming` | 1 | 1 | 1 | 1 |
| `Calculus III` | ⇒ `Multivariable Calculus` | 1 | 1 | 1 | 1 |
| `Child Growth and Development` | ⇒ `Child Development` | 1 | 1 | 2 | 2 |
| `Choreography II` | ⇒ `Choreography` | 1 | 1 | 1 | 1 |
| `Critical Thinking and the Nursing Process II` | ⇒ `Critical Thinking and the Nursing Process` | 1 | 1 | 1 | 1 |
| `EMT (High School/Adult School Articulation)` | ⇒ `Emergency Medical Technician` | 1 | 1 | 1 | 1 |
| `EMT Fundamentals (High School Articulation)` | ⇒ `Emergency Medical Technician` | 1 | 1 | 1 | 1 |
| `Elementary Spanish` | ⇒ `Spanish 1` | 1 | 1 | 1 | 1 |
| `Elementary Spanish I` | ⇒ `Spanish 1` | 1 | 1 | 3 | 4 |
| `Elementary Spanish II` | ⇒ `Spanish 2` | 1 | 1 | 1 | 1 |
| `Emergency Medical Responder (High School Articulation)` | ⇒ `Emergency Medical Responder` | 1 | 2 | 1 | 1 |
| `Emergency Medical Responder — Baldy View ROP` | ⇒ `Emergency Medical Responder` | 1 | 2 | 1 | 1 |
| `Engine Performance` | ⇒ `ASE A8 — Engine Performance` | 2 | 1 | 1 | 1 |
| `Engine Performance I` | ⇒ `ASE A8 — Engine Performance` | 1 | 1 | 1 | 1 |
| `Engine Performance II` | ⇒ `ASE A8 — Engine Performance` | 1 | 1 | 1 | 1 |
| `Engineering Graphics` | ⇒ `Engineering Design Graphics` | 1 | 1 | 1 | 1 |
| `Engineering Graphics with CAD` | ⇒ `Engineering Design Graphics` | 1 | 1 | 1 | 1 |
| `Environmental Conservation` | ⇒ `Introduction to Environmental Science` | 1 | 1 | 2 | 2 |
| `Fire Prevention (High School Articulation)` | ⇒ `Fire Prevention` | 1 | 1 | 1 | 1 |
| `Fire Science 34A` | ⇒ `Fire Investigation 1A` | 1 | 1 | 1 | 1 |
| `Fire Technology (High School Articulation)` | ⇒ `Fire Technology` | 1 | 1 | 2 | 2 |
| `Fontana High School Emergency Medical Responder (Articulated CTE)` | ⇒ `Emergency Medical Responder` | 1 | 2 | 1 | 1 |
| `Fontana High School Emergency Medical Technician (Articulated CTE)` | ⇒ `Emergency Medical Technician` | 1 | 1 | 1 | 1 |
| `Fontana High School Fire Behavior (Articulated CTE)` | ⇒ `Fire Behavior and Combustion` | 1 | 1 | 1 | 1 |
| `General Psychology (high school articulation)` | ⇒ `General Psychology` | 1 | 1 | 1 | 1 |
| `Generic Credit by Exam — San Bernardino Valley College (MATH 108)` | ⇒ `Introduction to Statistics` | 1 | 1 | 1 | 1 |
| `Generic Industry Certification — Culinary` | ⇒ `Sanitation and Safety` | 1 | 1 | 1 | 2 |
| `Guitar I` | ⇒ `Guitar 1` | 1 | 1 | 1 | 1 |
| `HRCM 001` | ⇒ `Introduction to Hospitality Management` | 1 | 1 | 1 | 0 |
| `Hanford West High School Articulated Course (HS-005)` | ⇒ `Medical Terminology` | 1 | 2 | 1 | 1 |
| `History of Architecture I` | ⇒ `History of Architecture 1` | 1 | 1 | 2 | 1 |
| `Intermediate Algebra` | ⇒ `College Algebra` | 2 | 2 | 1 | 1 |
| `Introduction to Accounting: Bookkeeping Concepts` | ⇒ `Introduction to Accounting` | 1 | 1 | 1 | 1 |
| `Introduction to Biotechnology (with Lab)` | ⇒ `Introduction to Biotechnology` | 1 | 1 | 1 | 1 |
| `Introduction to Computer Information Systems — Cajon High School` | ⇒ `Introduction to Computer Information Systems` | 1 | 1 | 1 | 1 |
| `Introduction to Hybrid and Electric Vehicle Technology` | ⇒ `ASE L3 — Light Duty Hybrid/Electric Vehicle Specialist` | 1 | 1 | 1 | 1 |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Computer Information Systems` | → | `Computer Information Systems, Computer Concepts, Information Technology Concepts` | 1 | 2 | ✓ |
| `Culinary Arts (CUL ART 041)` | → | `Desserts and Pastries` | 2 | 1 | ✓ |
| `Culinary Arts (CULART 250)` | → | `Wine, Beverage, and Food Pairing Concepts` | 2 | 1 | ✓ |
| `Culinary Arts (High School Articulation)` | → | `Culinary Arts` | 2 | 2 | ✓ |
| `Culinary Arts 040` | → | `Introduction to Baking` | 1 | 1 | ✓ |
| `Culinary Essentials` | → | `Culinary Fundamentals` | 1 | 1 | ✓ |
| `Culinary Internship I` | → | `Culinary Internship` | 1 | 0 | ✓ |
| `Cyber Forensics (High School Articulation)` | → | `Cyber Forensics` | 2 | 2 | ✓ |
| `Cybersecurity Competition 1A` | → | `Cybersecurity Competition` | 1 | 1 | ✓ |
| `DC and AC Circuit Analysis and Laboratory` | → | `DC and AC Circuit Analysis` | 2 | 4 | ✓ |
| `Dance Rehearsal and Performance III` | → | `Dance Rehearsal and Performance` | 1 | 1 | ✓ |
| `Database Programming with SQL` | → | `Database Development with SQL` | 1 | 1 | ✓ |
| `Dental Assisting (Adult School)` | → | `Dental Assisting` | 1 | 2 | ✓ |
| `Diesel Engine Fuel Systems and Diagnosis` | → | `Diesel Engine Fuel Systems & Diagnosis` | 1 | 1 | ✓ |
| `Drawing I` | → | `Drawing` | 1 | 1 | ✓ |
| `ESL — Beginning Grammar for Reading and Writing` | → | `ESL Grammar for Reading and Writing Beginning` | 1 | 1 | ✓ |
| `ESL — Beginning Reading and Writing` | → | `ESL Reading and Writing Beginning` | 1 | 1 | ✓ |
| `ESL — High-Intermediate Grammar for Reading and Writing` | → | `ESL Grammar for Reading and Writing Intermediate` | 1 | 1 | ✓ |
| `ESL — High-Intermediate Reading and Writing` | → | `ESL Reading and Writing Intermediate` | 1 | 1 | ✓ |
| `Ear Training III` | → | `Ear Training` | 1 | 1 | ✓ |
| `Economic Geography` | → | `Global Issues` | 1 | 1 | ✓ |
| `Electrical Motors and Controls I` | → | `Electrical Motors and Controls 1` | 1 | 1 | ✓ |
| `Electrical Motors and Controls II` | → | `Electrical Motors and Controls 2` | 1 | 1 | ✓ |
| `Electrical Troubleshooting Techniques` | → | `Troubleshooting Techniques` | 3 | 3 | ✓ |
| `Electrical and Electronics Technology 223` | → | `CAL-OSHA 30-Hour Construction Industry Training for Electrical & Electronics Technology` | 1 | 1 | ✓ |
| `Elementary American Sign Language 1` | → | `American Sign Language 1` | 1 | 1 | ✓ |
| `Elementary American Sign Language II` | → | `American Sign Language 2` | 2 | 2 | ✓ |
| `Elementary Hmong I` | → | `Hmong 1` | 1 | 1 | ✓ |
| `Elementary Hmong II` | → | `Hmong 2` | 1 | 1 | ✓ |
| `Elementary Japanese` | → | `Japanese 1` | 2 | 2 | ✓ |
| `Elementary Piano I` | → | `Piano 1` | 1 | 1 | ✓ |
| `Elements of Agricultural Economics` | → | `Agriculture Economics` | 2 | 2 | ✓ |
| `Engine Repair (HS Articulation)` | → | `Engine Repair` | 1 | 1 | ✓ |
| `FIT Academy Conditioning` | → | `Fire Academy Conditioning` | 1 | 1 | ✓ |
| `FIT Academy Experience` | → | `Fire Academy Experience` | 1 | 5 | ✓ |
| `FMT 100 (San Jose City College)` | → | `Introduction to Facilities Maintenance` | 1 | 1 | ✓ |
| `Film (High School Articulation)` | → | `Film` | 1 | 1 | ✓ |
| `Fire Science (High School Articulation)` | → | `Fire Science` | 1 | 1 | ✓ |
| `Fire Science 34B` | → | `Fire Investigation 1C` | 1 | 1 | ✓ |
| `Fire Service (High School/Local Articulation)` | → | `Fire Service` | 1 | 1 | ✓ |
| `Fire Service Career Development` | → | `Fire Science Career Devopment Promotions` | 3 | 3 | ✓ |
| `Fire Service Tactics and Strategy` | → | `Fire Science Tactics & Strategy` | 4 | 4 | ✓ |
| `Firefighting Technology — Baldy View ROP` | → | `Firefighting Technology` | 1 | 3 | ✓ |
| `Flight Training — FLGHT 101 (Reedley)` | → | `Flight Training` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 104 (Reedley)` | → | `Remote Pilot Ground School for small Unmanned Aircraft Systems (sUAS)` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 105 (Reedley)` | → | `Private Pilot 1 Flight Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 106 (Reedley)` | → | `Private Pilot 2 Flight Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 107 (Reedley)` | → | `Private Pilot 1 Simulation Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 108 (Reedley)` | → | `Private Pilot 2 Ground School` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 109 (Reedley)` | → | `Private Pilot 2 Simulation Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 111 (Reedley)` | → | `Instrument Rating Ground School` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 115 (Reedley)` | → | `Instrument Rating Flight Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 117 (Reedley)` | → | `Instrument Rating Simulation Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 121 (Reedley)` | → | `Commercial Pilot Ground School` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 125 (Reedley)` | → | `Commercial Pilot 1 Flight Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 126 (Reedley)` | → | `Commercial Pilot 2 Flight Lab` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 131 (Reedley)` | → | `Flight Instructor Ground School` | 1 | 1 | ✓ |
| `Flight Training — FLGHT 135 (Reedley)` | → | `Flight Instructor Flight Lab` | 1 | 1 | ✓ |
| `Fontana High School Advanced Law Enforcement (Articulated CTE)` | → | `Advanced Law Enforcement` | 1 | 2 | ✓ |
| `Fontana High School Law Enforcement (Articulated CTE)` | → | `Law Enforcement` | 1 | 0 | ✓ |
| `Fontana High School Safety & Survival (Articulated CTE)` | → | `Safety & Survival` | 1 | 1 | ✓ |
| `Foundation for First-Year College Success` | → | `Foundation for First Year College Success` | 1 | 1 | ✓ |
| `Fuel, Ignition, and Emission Control Systems` | → | `Automotive Fuel, Ignition, and Emission Control Systems` | 1 | 1 | ✓ |
| `Fundamentals of Music` | → | `Music Fundamentals` | 2 | 2 | ✓ |
| `GIST 12` | → | `Introduction to Geospatial Technology` | 1 | 0 | ✓ |
| `GIST 58` | → | `Remote Sensing & Digital Image Processing` | 1 | 0 | ✓ |
| `General Physics: Mechanics` | → | `Calculus-Based Physics for Scientists and Engineers: ABC` | 1 | 1 | ✓ |
| `Generic Credit by Exam â€” Saddleback College` | → | `Credit by Exam` | 1 | 89 | ✓ |
| `Generic Credit by Exam — Culinary CUL 007` | → | `Culinary Production and Operations` | 1 | 0 | ✓ |
| `Generic Credit by Exam — East Los Angeles College (ARC 161)` | → | `Introduction to Computer-Aided Architectural Design` | 1 | 1 | ✓ |
| `Generic Credit by Exam — Laney College (JOURN 21)` | → | `Introduction to Reporting and Newswriting` | 1 | 1 | ✓ |
| `Generic Credit by Exam — San Bernardino Valley College Culinary` | → | `Restaurant Service and Catering II` | 4 | 4 | ✓ |
| `Generic Portfolio Review — Madera College` | → | `Portfolio Review` | 1 | 1 | ✓ |
| `Generic Portfolio Review — San Bernardino Valley College (Water Supply Technology)` | → | `Water Supply Technology` | 1 | 1 | ✓ |
| `Geriatric Health Care (Nursing)` | → | `Geriatric Health Care` | 1 | 1 | ✓ |
| `Global Business Design (High School Articulation)` | → | `Global Business Design` | 1 | 1 | ✓ |
| `Global Logistics & Concepts — Cajon High School` | → | `Global Logistics & Concepts` | 1 | 1 | ✓ |
| `Guitar II` | → | `Guitar 2` | 1 | 1 | ✓ |
| `Guitar III` | → | `Guitar 3` | 1 | 1 | ✓ |
| `Guitar IV` | → | `Guitar 4` | 1 | 1 | ✓ |
| `HORT 60D` | → | `Landscape Design: Planting` | 1 | 0 | ✓ |
| `HORT 60J` | → | `Sketchup for Landscape Designers` | 1 | 0 | ✓ |
| `HORT 90E` | → | `Horticultural & Landscape Photography` | 1 | 0 | ✓ |
| `HORT 90K` | → | `Landscaping with Edibles` | 1 | 0 | ✓ |
| `HORT 90U` | → | `Landscape Design: Perspective Sketching` | 1 | 0 | ✓ |
| `HOSP 100` | → | `Introduction to Hospitality and Customer Service` | 1 | 1 | ✓ |
| `HTML and CSS — Beginning` | → | `HTML and CSS Beginning` | 1 | 1 | ✓ |
| `HVAC/R 007` | → | `Welding for HVAC/R` | 1 | 1 | ✓ |
| `Hanford West High School Articulated Course (HS-061)` | → | `Nurse Assistant Training` | 1 | 1 | ✓ |
| `Healthful Living` | → | `Personal Health and Wellness` | 1 | 1 | ✓ |
| `High School Articulation — Advanced Engineering Design II Honors (Rancho Cucamonga HS)` | → | `Engineering Design II Honors Advanced` | 2 | 1 | ✓ |
| `High School Articulation — Anatomy and Physiology (Honors)` | → | `Anatomy and Physiology Honors` | 1 | 1 | ✓ |
| `High School Articulation — Automotive Technology 3A/3B` | → | `Automotive Technology 3A/3B` | 1 | 1 | ✓ |
| `Historical Geology` | → | `Historical Geology with Lab` | 1 | 1 | ✓ |
| `History of World Civilizations I` | → | `History of World Civilizations 1` | 1 | 1 | ✓ |
| `History of World Civilizations II` | → | `History of World Civilizations 2` | 1 | 1 | ✓ |
| `History of the United States Since 1865` | → | `United States History from 1865` | 1 | 1 | ✓ |
| `Honors Biology and Human Anatomy & Physiology — Mater Dei High School` | → | `Biology and Human Anatomy & Physiology Honors` | 1 | 1 | ✓ |
| `Human Services Field Studies and Seminar I` | → | `Field Studies & Seminar I` | 1 | 1 | ✓ |
| `Hydraulics and Pneumatics` | → | `Hydraulics/Pneumatics` | 2 | 2 | ✓ |
| `IT Support Fundamentals` | → | `IT Support Fundamentals 1` | 1 | 1 | ✓ |
| `Intermediate 3D Animation` | → | `3D Animation Intermediate` | 1 | 2 | ✓ |
| `Intermediate Air Conditioning` | → | `Air Conditioning Intermediate` | 1 | 1 | ✓ |
| `Intermediate American Sign Language I` | → | `American Sign Language Intermediate` | 1 | 1 | ✓ |
| `Intermediate Berry Production` | → | `Berry Production Intermediate` | 1 | 1 | ✓ |
| `Intermediate Child Development` | → | `Child Development Intermediate` | 3 | 3 | ✓ |
| `Intermediate Computer-Aided Design and Drafting` | → | `Computer-Aided Design and Drafting Intermediate` | 1 | 1 | ✓ |
| `Intermediate Creo and SolidWorks` | → | `Creo and SolidWorks Intermediate` | 1 | 2 | ✓ |
| `Intermediate Culinary Arts` | → | `Culinary Arts Intermediate` | 1 | 2 | ✓ |
| `Intermediate Education / Careers in Education` | → | `Education / Careers in Education Intermediate` | 1 | 1 | ✓ |
| `Intermediate Fashion Design and Merchandising` | → | `Fashion Design and Merchandising Intermediate` | 1 | 1 | ✓ |
| `Intermediate HTML and CSS` | → | `HTML and CSS Intermediate` | 1 | 1 | ✓ |
| `Intermediate Medical-Surgical Nursing` | → | `Medical-Surgical Nursing Intermediate` | 1 | 1 | ✓ |
| `Intermediate Medical-Surgical Nursing Laboratory` | → | `Medical-Surgical Nursing Laboratory Intermediate` | 1 | 1 | ✓ |
| `Intermediate Microsoft Word` | → | `Microsoft Word Intermediate` | 1 | 1 | ✓ |
| `Intermediate Nursing Skills / Clinical Simulation Laboratory` | → | `Nursing Skills Clinical Simulation Laboratory Intermediate` | 1 | 1 | ✓ |
| `Intermediate Patient Care` | → | `Patient Care Intermediate` | 6 | 7 | ✓ |
| `Intermediate Piano` | → | `Piano Intermediate` | 1 | 1 | ✓ |
| `Intermediate Spanish` | → | `Spanish Intermediate` | 1 | 1 | ✓ |
| `Intermediate Web Design and Development` | → | `Web Design and Development Intermediate` | 1 | 1 | ✓ |
| `Intermediate Word Processing` | → | `Word Processing Intermediate` | 1 | 1 | ✓ |
| `Introduction to Agribusiness Management` | → | `Introduction to Agriculture Business` | 1 | 1 | ✓ |
| `Introduction to Agricultural Mechanical Technology` | → | `Introduction to Mechanical Technology` | 2 | 2 | ✓ |
| `Introduction to Automotive Vehicle Systems (HS Articulation)` | → | `Introduction to Automotive Vehicle Systems` | 1 | 1 | ✓ |
| `Introduction to Baking and Pastry` | → | `Introduction to Baking & Pastry` | 2 | 2 | ✓ |
| `Introduction to Computer Graphics` | → | `Introduction to Digital Art` | 1 | 1 | ✓ |
| `Introduction to Curriculum (Early Childhood Education)` | → | `Introduction to Curriculum Early Childhood Education` | 1 | 1 | ✓ |
| `Introduction to Drone Piloting` | → | `Introduction to Drone Pilot Training` | 1 | 1 | ✓ |
| `Introduction to Geographic Information Systems` | → | `Introduction to Geographic Information Systems and Laboratory` | 5 | 3 | ✓ |
| `Introduction to Global Positioning Systems` | → | `Introduction to Global Positioning Systems (GPS)` | 2 | 2 | ✓ |
| `Introduction to Preventative Maintenance Inspection (HS Articulation)` | → | `Introduction to Preventative Maintenance Inspection` | 1 | 1 | ✓ |
| `Introduction to Programmable Automation Controllers (PACs)` | → | `Introduction to PACS: Programmable Automation Controllers` | 3 | 3 | ✓ |
| `Introduction to Programming` | → | `Introduction to Programming Concepts and Methodologies` | 1 | 1 | ✓ |
| `Introduction to UNIX/Linux System and Programming` | → | `UNIX/Linux Systems and Programming` | 1 | 1 | ✓ |
| `Introductory College Chemistry` | → | `Introduction to Chemistry` | 3 | 3 | ✓ |
| `Introductory Human Physiology` | → | `Human Physiology with Lab` | 1 | 1 | ✓ |
| `Jurupa Hills High School — Transport and Technology I` | → | `Transport and Technology 1` | 2 | 2 | ✓ |
| `Jurupa Hills High School — Transport and Technology II` | → | `Transport and Technology 2` | 1 | 2 | ✓ |
| `Keyboard Skills 1` | → | `Office Keyboarding 1` | 1 | 1 | ✓ |
| `Keyboards I` | → | `Music Keyboards 1` | 1 | 1 | ✓ |
| `Keyboards II` | → | `Music Keyboards 2` | 1 | 1 | ✓ |
| `Keyboards III` | → | `Music Keyboards 3` | 1 | 1 | ✓ |
| `Keyboards IV` | → | `Music Keyboards 4` | 1 | 1 | ✓ |
| `Microsoft Excel II` | → | `Microsoft Excel 2` | 1 | 1 | ✓ |
| `Music Skills I` | → | `Music Skills 1` | 1 | 1 | ✓ |
| `Music Skills II` | → | `Music Skills 2` | 2 | 1 | ✓ |
| `Music Theory I` | → | `Music Theory 1` | 5 | 6 | ✓ |
| `Music Theory III` | → | `Music Theory 3` | 2 | 2 | ✓ |
| `Music Theory IV` | → | `Music Theory 4` | 1 | 1 | ✓ |
| `Musicianship I` | → | `Musicianship 1` | 1 | 2 | ✓ |
| `Musicianship II` | → | `Musicianship 2` | 1 | 1 | ✓ |
| `Musicianship III` | → | `Musicianship 3` | 1 | 1 | ✓ |
| `Musicianship IV` | → | `Musicianship 4` | 1 | 1 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `Culinary Fundamentals I` | → | `Culinary Fundamentals` | 0 | intra_batch_same_target |
| `Culinary Internship II` | → | `Culinary Internship` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 1B` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 2A` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 2B` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 3A` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 3B` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `ESL — High-Beginning Grammar for Reading and Writing` | → | `ESL Grammar for Reading and Writing Beginning` | 0 | intra_batch_same_target |
| `ESL — High-Beginning Reading and Writing` | → | `ESL Reading and Writing Beginning` | 0 | intra_batch_same_target |
| `ESL — Intermediate Grammar for Reading and Writing` | → | `ESL Grammar for Reading and Writing Intermediate` | 0 | intra_batch_same_target |
| `ESL — Intermediate Reading and Writing` | → | `ESL Reading and Writing Intermediate` | 0 | intra_batch_same_target |
| `Elementary American Sign Language I` | → | `American Sign Language 1` | 0 | intra_batch_same_target |
| `Fire Science 34C` | → | `Fire Science` | 0 | intra_batch_same_target |
| `Generic Credit by Exam â€” San Diego City College` | → | `Credit by Exam` | 0 | intra_batch_same_target |
| `Generic Credit by Exam â€” San Diego Mesa College` | → | `Credit by Exam` | 0 | intra_batch_same_target |
| `High School Articulation — Anatomy and Physiology Honors (Colton-Redlands-Yucaipa ROP)` | → | `Anatomy and Physiology Honors` | 0 | intra_batch_same_target |
| `Intermediate American Sign Language II` | → | `American Sign Language Intermediate` | 0 | intra_batch_same_target |
| `Intermediate Spanish I` | → | `Spanish Intermediate` | 0 | intra_batch_same_target |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
