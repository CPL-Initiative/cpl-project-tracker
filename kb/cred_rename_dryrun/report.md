# Credential Rename Dry-Run — 2026-07-09

Generated: `2026-07-09T19:29:31Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 6 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |
|---|---|---:|---:|---:|---:|
| `Administration of Justice 105` | ⇒ `Administration of Justice` | 1 | 1 | 1 | 1 |
| `Culinary Fundamentals I` | ⇒ `Culinary Fundamentals` | 1 | 1 | 1 | 1 |
| `Culinary Internship II` | ⇒ `Culinary Internship` | 1 | 1 | 1 | 0 |
| `Cybersecurity Competition 1B` | ⇒ `Cybersecurity Competition` | 1 | 1 | 1 | 1 |
| `Cybersecurity Competition 2A` | ⇒ `Cybersecurity Competition` | 1 | 1 | 1 | 1 |
| `Cybersecurity Competition 2B` | ⇒ `Cybersecurity Competition` | 1 | 1 | 1 | 1 |
| `Cybersecurity Competition 3A` | ⇒ `Cybersecurity Competition` | 1 | 1 | 1 | 1 |
| `Cybersecurity Competition 3B` | ⇒ `Cybersecurity Competition` | 1 | 1 | 1 | 1 |
| `ESL — High-Beginning Grammar for Reading and Writing` | ⇒ `ESL Grammar for Reading and Writing Beginning` | 1 | 1 | 1 | 1 |
| `ESL — High-Beginning Reading and Writing` | ⇒ `ESL Reading and Writing Beginning` | 1 | 1 | 1 | 1 |
| `ESL — Intermediate Grammar for Reading and Writing` | ⇒ `ESL Grammar for Reading and Writing Intermediate` | 1 | 1 | 1 | 1 |
| `ESL — Intermediate Reading and Writing` | ⇒ `ESL Reading and Writing Intermediate` | 1 | 1 | 1 | 1 |
| `Elementary American Sign Language I` | ⇒ `American Sign Language 1` | 1 | 1 | 1 | 1 |
| `Fire Science 34C` | ⇒ `Fire Science` | 2 | 1 | 1 | 1 |
| `Generic Credit by Exam â€” San Diego City College` | ⇒ `Credit by Exam` | 1 | 1 | 1 | 24 |
| `Generic Credit by Exam â€” San Diego Mesa College` | ⇒ `Credit by Exam` | 1 | 1 | 1 | 34 |
| `High School Articulation — Anatomy and Physiology Honors (Colton-Redlands-Yucaipa ROP)` | ⇒ `Anatomy and Physiology Honors` | 1 | 1 | 2 | 1 |
| `Intermediate American Sign Language II` | ⇒ `American Sign Language Intermediate` | 1 | 1 | 1 | 1 |
| `Intermediate Spanish I` | ⇒ `Spanish Intermediate` | 1 | 1 | 2 | 3 |
| `Law Enforcement (High School Articulation)` | ⇒ `Law Enforcement` | 1 | 1 | 2 | 2 |
| `Nursing Course CBE — NURS 161 (SBVC)` | ⇒ `Medical Surgical Nursing Beginning` | 1 | 1 | 1 | 1 |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `ABA Bank Management (ABAN-0181)` | → | `ABA Bank Management` | 1 | 1 | ✓ |
| `Academic Reading & Writing I (ESL) Advanced` | → | `ESL Academic Reading & Writing Advanced` | 1 | 0 | ✓ |
| `Adult Health Care I` | → | `Adult Health Care 1` | 1 | 1 | ✓ |
| `Adult Health Care II` | → | `Adult Health Care 2` | 1 | 1 | ✓ |
| `Adult Health Care III` | → | `Adult Health Care 3` | 1 | 1 | ✓ |
| `Adult Health Care IV` | → | `Adult Health Care 4` | 1 | 1 | ✓ |
| `Aircraft Powerplant: Reciprocating and Turbine Engines Laboratory` | → | `Aircraft Powerplant: Reciprocating and Turbine Engines Lab` | 1 | 1 | ✓ |
| `Basic Electrical System Fundamentals` | → | `Basic Automotive Electrical System Fundamentals` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 001` | → | `The Acoustical Apprentice, Safety, and the Trade` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 004` | → | `Foundations and Floors` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 006` | → | `Structural Framing` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 007` | → | `Form Detailing, Construction & Erection` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 008` | → | `Exterior Finish` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 009` | → | `Blueprint Reading-Commercial` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 010` | → | `Concrete - Precast and Prestressed` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 011` | → | `Interior Finish` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 012` | → | `Layout/Leveling Construction Site Practice` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 013` | → | `Engineered Structural Systems` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 014` | → | `Interior Systems` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 015` | → | `Stair Building` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 016` | → | `Roof Framing` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 018` | → | `Commercial Concrete` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 020` | → | `Commercial Door Hardware` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 102` | → | `Basic Applications` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 103` | → | `Mathematics for Drywall/Lathers` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 104` | → | `Exterior/Advanced Fire Control System and Partitions` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 105` | → | `Doors, Windows, Exterior Systems/Building Documents` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 106` | → | `Blueprint Reading 1` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 107` | → | `Blueprint Reading 2` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 108` | → | `Blueprint Reading 3` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 110` | → | `Welding 1` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 111` | → | `Residential Metal Framing` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 112` | → | `Exterior Systems and Trims` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 113` | → | `Interior Metal Lathing System, Sound Control` | 1 | 1 | ✓ |
| `Carpenters Apprenticeship — CARP 114` | → | `Ceilings, Shaft Protection and Demountable Partitions` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 115` | → | `Arches, Furring and Advanced Systems` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 116` | → | `Advanced Construction Techniques` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 117` | → | `Drywall Lathing Trade Safety` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1201` | → | `Modular System Installer Safety` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1202` | → | `Introduction to Office Modular Systems Installation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1204` | → | `Print Reading Measurement and Layout` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1205` | → | `Modular Systems Construction and Quality Control 1` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1206` | → | `Modular System Construction and Quality Control 2` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1207` | → | `Drapery, Window Coverings, and Fine Furnishings` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1208` | → | `Floor to Ceiling Wall System Construction` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 278` | → | `Worker Safety and Tool Skills for Pile Drivers` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 279` | → | `Pile Driver Math Applications` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 280` | → | `Pile Driver Rigging` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 281` | → | `Form Detailing, Construction, and Erection for Pile Drivers` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 282` | → | `Welding 1: Introduction to SMAW` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 283` | → | `Introduction to Land and Water Pile Driving` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 285` | → | `Advanced Pile Driving Land and Water` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 286` | → | `Wharfage and Marine Structures` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 287` | → | `Welding 3: Advanced SMAW` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 288` | → | `Introduction to Structural Blueprints and Layout Instruments` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 289` | → | `Advanced Structural Blueprints and Bridge Building` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 290` | → | `Falsework, Shoring, and Heavy Timber Framing` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 291` | → | `Advanced Formwork` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 292` | → | `Welding 3 FCAW` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 293` | → | `Welding 4 FCAW Pipe` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 294` | → | `Welding 6: FCAW 4G Certification` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 302` | → | `Introduction to Scaffolds and Confined Space` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 305` | → | `Welded Frame and Mobile Tower Scaffold` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 306` | → | `Blueprint Reading-Residential` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 307` | → | `System Scaffold` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 308` | → | `Suspended Scaffolds and Shoring Systems` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 309` | → | `Tube and Clamp Scaffold` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 311` | → | `Blueprint Reading for Scaffold Erectors` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 313` | → | `Introduction to Welding and Cutting` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 314` | → | `Welding 2` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 316` | → | `Hazard Awareness for Scaffold Erectors` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 404` | → | `Tools of the Trade and Installation of Hardwood Floors` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 405` | → | `Finishing and Repairing Floors` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 503` | → | `Introduction to Working Drawings, Construction Math and Fire Stop Installation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 504` | → | `Residential Blueprint Reading and Forklift Safety` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 505` | → | `Residential Insulation and Weatherization` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 506` | → | `Commercial Blueprint Reading and Mobile Tower Scaffolds` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 507` | → | `Commercial and Industrial Insulation and Aerial Lift` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 508` | → | `Energy Conservation Codes and Standards` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 703` | → | `Introduction to Grid Ceiling Installation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 705` | → | `Specialty Ceiling Systems` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 706` | → | `Access Floor Systems` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 708` | → | `Suspended Framing Ceiling Systems` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 709` | → | `Infection Control Risk Assessment and Hospital Code for Acoustical Installers` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 711` | → | `Integrated Ceilings and Special Techniques` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 712` | → | `Advanced Grid Ceilings` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 714` | → | `Acoustical Blueprint Reading` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 715` | → | `Specialty Systems` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 856` | → | `Millwright Safety and Tool Skills` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 857` | → | `The Millwright Apprentice, the Trade, and 16 Hour Safety` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 858` | → | `Millwright Math Applications` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 859` | → | `Millwright Rigging` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 860` | → | `Materials of Construction` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 861` | → | `Layout Procedures for Millwrights` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 862` | → | `Precision Optical Instruments` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 863` | → | `Blueprint Reading and Aerial Lift` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 864` | → | `Cutting and Welding 1` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 865` | → | `Welding 2 SMAW` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 866` | → | `Monorails` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 867` | → | `Conveyors for Millwrights` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 868` | → | `Machinery Installation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 869` | → | `Machinery Maintenance for Millwrights` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 870` | → | `Precision Tools for Millwrights` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 871` | → | `Turbines` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 872` | → | `Cutting and Welding 3` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 901` | → | `Mill Cabinet Safety and Tool Skills` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 902` | → | `The Mill Cabinet Apprentice and the Trade` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 903` | → | `Math for the Mill Cabinet Trade` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 904` | → | `Basic Cabinet Making` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 905` | → | `Basic Blueprint Reading Mill Cabinet` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 906` | → | `Machinery Maintenance for Mill Cabinet` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 907` | → | `Cabinet Hardware Installation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 908` | → | `Sanding, Stains, and Finish Preparation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 909` | → | `Advanced Machinery Operation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 910` | → | `Advanced Blueprint Reading for Mill Cabinet` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 911` | → | `Advanced Cabinet Making` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 912` | → | `Veneers, Laminate, and Finishing` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 913` | → | `CAD Basics for Mill Cabinetry` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 914` | → | `Introduction to CNC` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 915` | → | `Solid Surface Material, Fabrication, and Installation` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 916` | → | `Advanced Project for Mill Cabinet` | 1 | 1 | ✓ |
| `Health Education Graduation Requirement — Woodland Community College` | → | `Health Education Graduation Requirement` | 1 | 1 | ✓ |
| `Modern Dance Techniques I` | → | `Modern Dance Techniques 1` | 2 | 1 | ✓ |
| `Modern Dance Techniques II` | → | `Modern Dance Techniques 2` | 2 | 2 | ✓ |
| `Motors, Controls, and Controllers` | → | `Motors, Controls and Controllers` | 1 | 1 | ✓ |
| `Music Skills III` | → | `Music Skills 3` | 1 | 1 | ✓ |
| `Music Theory II` | → | `Music Theory 2` | 2 | 3 | ✓ |
| `Napa Valley Cooking School — Advanced Culinary Graduate` | → | `Culinary Graduate Advanced` | 1 | 1 | ✓ |
| `Networking Essentials` | → | `Computer Network Fundamentals` | 1 | 1 | ✓ |
| `Nursing Course CBE — NURS 150 (SBVC)` | → | `Foundations of Nursing` | 1 | 1 | ✓ |
| `Nursing Course CBE — NURS 151 (SBVC)` | → | `Introduction to Medical Surgical Nursing` | 1 | 1 | ✓ |
| `Nursing Course CBE — NURS 160 (SBVC)` | → | `Nursing Care of the Childbearing Family and Newborn` | 1 | 1 | ✓ |
| `Nursing Process: Advanced Medical-Surgical` | → | `Nursing Process Advanced Medical-Surgical` | 1 | 0 | ✓ |
| `PLTW Civil Engineering and Architecture — Baldy View ROP` | → | `PLTW Civil Engineering and Architecture` | 2 | 3 | ✓ |
| `Painting 1 (Oil)` | → | `Introduction to Painting` | 1 | 1 | ✓ |
| `Paramedicine (Credit by Exam)` | → | `Paramedicine` | 1 | 7 | ✓ |
| `Pediatric Health Care (Nursing)` | → | `Pediatric Health Care` | 1 | 1 | ✓ |
| `Personal Fitness Trainer Certification` | → | `Exercise for Fitness` | 1 | 1 | ✓ |
| `Photography (PHOT 22 — local)` | → | `Photojournalism` | 1 | 0 | ✓ |
| `Photography (PHOT 74A — local)` | → | `Studio Photography Techniques 1` | 1 | 0 | ✓ |
| `Photography (PHOT 7A — local)` | → | `Darkroom 1` | 1 | 0 | ✓ |
| `Photography (PHOTO 74A — local)` | → | `DSLR and Lighting for Professional Production I Beginning` | 1 | 0 | ✓ |
| `Political Theory` | → | `Introduction to Political Theory and Thought` | 1 | 1 | ✓ |
| `Principles of Power Mechanics and Small Engines` | → | `Principles of Power Mechanics/Small Engines` | 1 | 1 | ✓ |
| `Private Pilot Ground School` | → | `Private Pilot 1 Ground School` | 1 | 1 | ✓ |
| `Problem Solving and Programming 1` | → | `Programming Concepts and Methodology I` | 1 | 1 | ✓ |
| `Programming with Visual BASIC` | → | `Programming With Visual BASIC` | 1 | 1 | ✓ |
| `Psychiatric Health Care (Nursing)` | → | `Psychiatric Health Care` | 1 | 1 | ✓ |
| `Psychological Aspects of Health Care (Nursing)` | → | `Psychological Aspects of Health Care` | 1 | 1 | ✓ |
| `Service and Repair` | → | `Automotive Service and Repair` | 1 | 1 | ✓ |
| `Spanish 1` | → | `Elementary Spanish I` | 8 | 8 | ✓ |
| `Spanish 157 (Local Course)` | → | `Spanish for Heritage Speakers 1` | 1 | 1 | ✓ |
| `Spanish 158 (Local Course)` | → | `Spanish for Heritage Speakers 2` | 1 | 1 | ✓ |
| `Substance Abuse in Criminal Justice` | → | `Substance Abuse` | 2 | 2 | ✓ |
| `Supervision in Agriculture Equipment Operation` | → | `Supervision In Agriculture Equipment Operation` | 1 | 1 | ✓ |
| `Supply Chain and Logistics (Arroyo Valley HS Articulation)` | → | `Supply Chain and Logistics` | 2 | 2 | ✓ |
| `Sustainable Gardening for Landscapes` | → | `Sustainable Gardening for Landscapes (Horticulture)` | 2 | 1 | ✓ |
| `Technical Drawing (High School Articulation)` | → | `Technical Drawing` | 1 | 1 | ✓ |
| `Transportation, Distribution and Logistics — Baldy View ROP` | → | `Transportation, Distribution and Logistics` | 1 | 1 | ✓ |
| `Trigonometry or Higher Math (Prior Coursework)` | → | `Trigonometry or Higher Mathematics` | 1 | 9 | ✓ |
| `Upland High School — Automotive Technology (HS Articulation)` | → | `Automotive Technology` | 1 | 1 | ✓ |
| `Veterinary Assistance and Nursing: Emergency Procedures` | → | `Veterinary Assistance & Nursing: Emergency Procedures` | 1 | 1 | ✓ |
| `Veterinary Equipment: Operation, Instrumentation, and Safety` | → | `Veterinary Equipment, Operation, Instrumentation and Safety` | 1 | 1 | ✓ |
| `Walk, Jog, Run (Kinesiology)` | → | `Fitness` | 1 | 1 | ✓ |
| `Welding (WELD 045)` | → | `Shielded Metal Arc Welding Beginning` | 2 | 1 | ✓ |
| `Welding (WELD 046)` | → | `Shielded Metal Arc Welding Intermediate` | 1 | 1 | ✓ |
| `Western Civilization Since 1648` | → | `Western Civilization 2` | 1 | 1 | ✓ |
| `Wheel Alignment, Chassis Dynamics, and ADAS` | → | `Wheel Alignment, Chassis Dynamics, ADAS` | 1 | 0 | ✓ |
| `Windows Server Operating System` | → | `Windows Server OS` | 1 | 1 | ✓ |
| `Work Experience (High School Articulation)` | → | `Work Experience` | 1 | 0 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `Medical Core (High School Articulation) — El Modena High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — Orange High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — Santiago High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — Villa Park High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Spanish for Spanish Speakers 1` | → | `Spanish for Heritage Speakers 1` | 0 | intra_batch_same_target |
| `Spanish for Spanish Speakers 2` | → | `Spanish for Heritage Speakers 2` | 0 | intra_batch_same_target |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
