# Credential Rename Dry-Run — 2026-11-18

Generated: `2026-11-18T03:09:22Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 0 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

_None._ A queued collision becomes a confirmed merge when the curator clicks **✓ Confirm merge** in the CER triage lane (writes `unified_title_merge_confirm` naming the exact target).

## Held: folds into a family title

- `ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Certification (any A1–A8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician (A1–A8) or L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Medium/Heavy Truck Technician (T1–T8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags

## Held: saved folds on a title that holds no exhibit

- `ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)` (rename) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE A8 + L1 — Engine Performance and Advanced Engine Performance` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A1, A6, A8, L1` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A2, A3, A6` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A4, A5` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A4, A5, A6` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A6, A8, L1` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — L2, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T2, T5, T7, T8 + MACS/609` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T2, T6, T8 + Snap-on 604` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T2, T8` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T3, T4, T5, T8` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T3, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T4, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T5, T8` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T5, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T6, T8 + Snap-on 604` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T7, T8 + MACS/609` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE G1 + ALI Lift It Right Bundle` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Master Automobile Technician (A1–A8 + L1)` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Advanced Electrical and Electronic Systems` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Air Conditioner` (rename) into `Heating and Air Conditioning (ASE A7 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Braking Systems` (rename) into `Brakes (ASE A5 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)` (rename) into `Electrical/Electronic Systems 1 (ASE A6 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)` (rename) into `Electrical/Electronic Systems 2 (ASE A6 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Engine Performance 1 (ASE A8 Engine Performance)` (merge) into `Engine Performance (ASE A8 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Engine Performance 2 (ASE A8 Engine Performance)` (rename) into `Engine Performance 2 (ASE A8 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Heating and Air Conditioning` (merge) into `Heating and Air Conditioning (ASE A7 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing

## Ruled on a decision sheet (kb/cred_rename_plans/)

- `Adv ESL: Writing/Grammar` (rename) into `Adv ESL: Writing and Grammar`, plan slash-to-and-2026-11-18
- `Advanced Desserts and Pastry/Chocolate/Sugar` (rename) into `Advanced Desserts and Pastry, Chocolate, and Sugar`, plan slash-to-and-2026-11-18
- `Arboriculture/Urban Forestry` (rename) into `Arboriculture and Urban Forestry`, plan slash-to-and-2026-11-18
- `Architecture/Green Design: Implementation using AutoCAD` (rename) into `Architecture and Green Design: Implementation using AutoCAD`, plan slash-to-and-2026-11-18
- `Architecture/Green Design: Planning and Construction` (rename) into `Architecture and Green Design: Planning and Construction`, plan slash-to-and-2026-11-18
- `Architecture/Green Design: Principles and Practices` (rename) into `Architecture and Green Design: Principles and Practices`, plan slash-to-and-2026-11-18
- `Autodesk Certified User/Professional — AutoCAD` (rename) into `Autodesk Certified User and Professional — AutoCAD`, plan slash-to-and-2026-11-18
- `Autodesk Certified User/Professional — Revit Architecture` (rename) into `Autodesk Certified User and Professional — Revit Architecture`, plan slash-to-and-2026-11-18
- `Building Automation System (BAS) Certification — Manufacturer/Vendor` (rename) into `Building Automation System (BAS) Certification — Manufacturer and Vendor`, plan slash-to-and-2026-11-18
- `CCDET Clean Truck-Check & HD Safety/Pollution Certifications` (rename) into `CCDET Clean Truck-Check & HD Safety and Pollution Certifications`, plan slash-to-and-2026-11-18
- `Calculations in Water/Wastewater Technology` (rename) into `Calculations in Water and Wastewater Technology`, plan slash-to-and-2026-11-18
- `Carpenters Apprenticeship — Drywall/Lather` (rename) into `Carpenters Apprenticeship — Drywall and Lather`, plan slash-to-and-2026-11-18
- `Carpenters Apprenticeship — Drywall/Lather Journeyperson` (rename) into `Carpenters Apprenticeship — Drywall and Lather Journeyperson`, plan slash-to-and-2026-11-18
- `Carpenters Apprenticeship — Drywall/Lather Year 1` (rename) into `Carpenters Apprenticeship — Drywall and Lather Year 1`, plan slash-to-and-2026-11-18
- `Carpenters Apprenticeship — Drywall/Lather Year 2` (rename) into `Carpenters Apprenticeship — Drywall and Lather Year 2`, plan slash-to-and-2026-11-18
- `Carpenters Apprenticeship — Drywall/Lather Year 3` (rename) into `Carpenters Apprenticeship — Drywall and Lather Year 3`, plan slash-to-and-2026-11-18
- `Carpenters Apprenticeship — Drywall/Lather Year 4` (rename) into `Carpenters Apprenticeship — Drywall and Lather Year 4`, plan slash-to-and-2026-11-18
- `Concealed/Glue-Up/Staple-Up Ceiling Systems` (rename) into `Concealed, Glue-Up, and Staple-Up Ceiling Systems`, plan slash-to-and-2026-11-18
- `Confined Space Rescue Operations/Technician` (rename) into `Confined Space Rescue Operations and Technician`, plan slash-to-and-2026-11-18
- `Diesel Electrical/Electronic Systems` (rename) into `Diesel Electrical and Electronic Systems`, plan slash-to-and-2026-11-18
- `Doors, Windows, Exterior Systems/Building Documents` (rename) into `Doors, Windows, Exterior Systems and Building Documents`, plan slash-to-and-2026-11-18
- `Education / Careers in Education Intermediate` (rename) into `Education and Careers in Education Intermediate`, plan slash-to-and-2026-11-18
- `Emergency Medical Response — CPR Pro/Healthcare Provider` (rename) into `Emergency Medical Response — CPR Pro and Healthcare Provider`, plan slash-to-and-2026-11-18
- `Exterior/Advanced Fire Control System and Partitions` (rename) into `Exterior and Advanced Fire Control System and Partitions`, plan slash-to-and-2026-11-18
- `Fire Control 4A — Ignitable Liquids and Gases Awareness/Operations` (rename) into `Fire Control 4A — Ignitable Liquids and Gases Awareness and Operations`, plan slash-to-and-2026-11-18
- `Fuel Systems/Emission Controls` (rename) into `Fuel Systems and Emission Controls`, plan slash-to-and-2026-11-18
- `HAZWOPER First Responder Awareness/Operations` (rename) into `HAZWOPER First Responder Awareness and Operations`, plan slash-to-and-2026-11-18
- `Hairstyling Services/Haircutting 2` (rename) into `Hairstyling Services and Haircutting 2`, plan slash-to-and-2026-11-18
- `Heavy/Medium Duty Truck Technology Apprenticeship` (rename) into `Heavy and Medium Duty Truck Technology Apprenticeship`, plan slash-to-and-2026-11-18
- `Hydraulics/Pneumatics` (rename) into `Hydraulics and Pneumatics`, plan slash-to-and-2026-11-18
- `Infant/Toddler Practicum` (rename) into `Infant and Toddler Practicum`, plan slash-to-and-2026-11-18
- `Introduction to Engineering Design/Graphics` (rename) into `Introduction to Engineering Design and Graphics`, plan slash-to-and-2026-11-18
- `Introduction to UNIX/Linux` (rename) into `Introduction to UNIX and Linux`, plan slash-to-and-2026-11-18
- `Ironworker Apprenticeship — OSHA 30/Extension Review` (rename) into `Ironworker Apprenticeship — OSHA 30 and Extension Review`, plan slash-to-and-2026-11-18
- `Journeyman Certificate- Apprenticeship Carpentry, Drywall/Lather` (rename) into `Journeyman Certificate- Apprenticeship Carpentry, Drywall and Lather`, plan slash-to-and-2026-11-18
- `Journeyman Certificate- Apprenticeship Carpentry, Drywall/Lather (Interior Systems)` (rename) into `Journeyman Certificate- Apprenticeship Carpentry, Drywall and Lather (Interior Systems)`, plan slash-to-and-2026-11-18
- `Layout/Leveling Construction Site Practice` (rename) into `Layout and Leveling Construction Site Practice`, plan slash-to-and-2026-11-18
- `Maternal/Newborn Nursing Care` (rename) into `Maternal and Newborn Nursing Care`, plan slash-to-and-2026-11-18
- `Mathematics for Drywall/Lathers` (rename) into `Mathematics for Drywall and Lathers`, plan slash-to-and-2026-11-18
- `NCCER Commercial Electrician Level 4/Journey Level` (rename) into `NCCER Commercial Electrician Level 4 and Journey Level`, plan slash-to-and-2026-11-18
- `NCCER Industrial Electrician Level 4/Journey Level` (rename) into `NCCER Industrial Electrician Level 4 and Journey Level`, plan slash-to-and-2026-11-18
- `Nursing Skills/Clinical Simulation Laboratory Beginning` (rename) into `Nursing Skills and Clinical Simulation Laboratory Beginning`, plan slash-to-and-2026-11-18
- `Oil/Acrylic Painting: Beginning 1` (rename) into `Oil and Acrylic Painting: Beginning 1`, plan slash-to-and-2026-11-18
- `Prefab/Sound Panels` (rename) into `Prefab and Sound Panels`, plan slash-to-and-2026-11-18
- `Principles of Infant/Toddler Caregiving` (rename) into `Principles of Infant and Toddler Caregiving`, plan slash-to-and-2026-11-18
- `Principles of Power Mechanics/Small Engines` (rename) into `Principles of Power Mechanics and Small Engines`, plan slash-to-and-2026-11-18
- `Spanish/English Linguistics Analysis` (rename) into `Spanish and English Linguistics Analysis`, plan slash-to-and-2026-11-18
- `Standard First Aid/CPR/AED` (rename) into `Standard First Aid, CPR, and AED`, plan slash-to-and-2026-11-18
- `Tool/Equipment Applications — Emergency Response Procedures` (rename) into `Tool and Equipment Applications — Emergency Response Procedures`, plan slash-to-and-2026-11-18
- `Tool/Equipment Applications — Fall Protection` (rename) into `Tool and Equipment Applications — Fall Protection`, plan slash-to-and-2026-11-18
- `Transit Level/Laser` (rename) into `Transit Level and Laser`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship Work Experience` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship Work Experience`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 100` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 100`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 101` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 101`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 110` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 110`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 111` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 111`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 120` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 120`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 121` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 121`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 130` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 130`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 131` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 131`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 140` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 140`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 141` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 141`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 150` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 150`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 151` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 151`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 100` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 100`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 101` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 101`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 110` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 110`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 111` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 111`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 120` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 120`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 121` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 121`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 130` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 130`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 131` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 131`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 140` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 140`, plan slash-to-and-2026-11-18
- `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 141` (rename) into `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 141`, plan slash-to-and-2026-11-18
- `UA Plumbers/Pipefitters Apprenticeship — Journeyperson` (rename) into `UA Plumbers and Pipefitters Apprenticeship — Journeyperson`, plan slash-to-and-2026-11-18
- `UA Plumbers/Pipefitters Apprenticeship — Level 2` (rename) into `UA Plumbers and Pipefitters Apprenticeship — Level 2`, plan slash-to-and-2026-11-18
- `UA Plumbers/Pipefitters Apprenticeship — Level 3` (rename) into `UA Plumbers and Pipefitters Apprenticeship — Level 3`, plan slash-to-and-2026-11-18
- `UA Plumbers/Pipefitters Apprenticeship — Level 4` (rename) into `UA Plumbers and Pipefitters Apprenticeship — Level 4`, plan slash-to-and-2026-11-18
- `UNIX/Linux Systems and Programming` (rename) into `UNIX and Linux Systems and Programming`, plan slash-to-and-2026-11-18
- `Water/Wastewater Operator Certification` (rename) into `Water and Wastewater Operator Certification`, plan slash-to-and-2026-11-18

## Issuer of each folded title (preview, kb/fold_issuer.py)

_No folds._

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Adv ESL: Writing/Grammar` | → | `Adv ESL: Writing and Grammar` | 1 | 0 | ✓ |
| `Advanced Desserts and Pastry/Chocolate/Sugar` | → | `Advanced Desserts and Pastry, Chocolate, and Sugar` | 1 | 1 | ✓ |
| `Arboriculture/Urban Forestry` | → | `Arboriculture and Urban Forestry` | 2 | 0 | ✓ |
| `Architecture/Green Design: Implementation using AutoCAD` | → | `Architecture and Green Design: Implementation using AutoCAD` | 1 | 1 | ✓ |
| `Architecture/Green Design: Planning and Construction` | → | `Architecture and Green Design: Planning and Construction` | 1 | 1 | ✓ |
| `Architecture/Green Design: Principles and Practices` | → | `Architecture and Green Design: Principles and Practices` | 1 | 1 | ✓ |
| `Autodesk Certified User/Professional — AutoCAD` | → | `Autodesk Certified User and Professional — AutoCAD` | 1 | 1 | ✓ |
| `Autodesk Certified User/Professional — Revit Architecture` | → | `Autodesk Certified User and Professional — Revit Architecture` | 1 | 1 | ✓ |
| `Building Automation System (BAS) Certification — Manufacturer/Vendor` | → | `Building Automation System (BAS) Certification — Manufacturer and Vendor` | 1 | 0 | ✓ |
| `CCDET Clean Truck-Check & HD Safety/Pollution Certifications` | → | `CCDET Clean Truck-Check & HD Safety and Pollution Certifications` | 1 | 2 | ✓ |
| `Calculations in Water/Wastewater Technology` | → | `Calculations in Water and Wastewater Technology` | 2 | 1 | ✓ |
| `Carpenters Apprenticeship — Drywall/Lather` | → | `Carpenters Apprenticeship — Drywall and Lather` | 2 | 58 | ✓ |
| `Carpenters Apprenticeship — Drywall/Lather Journeyperson` | → | `Carpenters Apprenticeship — Drywall and Lather Journeyperson` | 1 | 0 | ✓ |
| `Carpenters Apprenticeship — Drywall/Lather Year 1` | → | `Carpenters Apprenticeship — Drywall and Lather Year 1` | 1 | 0 | ✓ |
| `Carpenters Apprenticeship — Drywall/Lather Year 2` | → | `Carpenters Apprenticeship — Drywall and Lather Year 2` | 1 | 0 | ✓ |
| `Carpenters Apprenticeship — Drywall/Lather Year 3` | → | `Carpenters Apprenticeship — Drywall and Lather Year 3` | 1 | 0 | ✓ |
| `Carpenters Apprenticeship — Drywall/Lather Year 4` | → | `Carpenters Apprenticeship — Drywall and Lather Year 4` | 1 | 0 | ✓ |
| `Concealed/Glue-Up/Staple-Up Ceiling Systems` | → | `Concealed, Glue-Up, and Staple-Up Ceiling Systems` | 1 | 1 | ✓ |
| `Confined Space Rescue Operations/Technician` | → | `Confined Space Rescue Operations and Technician` | 1 | 1 | ✓ |
| `Diesel Electrical/Electronic Systems` | → | `Diesel Electrical and Electronic Systems` | 1 | 0 | ✓ |
| `Doors, Windows, Exterior Systems/Building Documents` | → | `Doors, Windows, Exterior Systems and Building Documents` | 1 | 1 | ✓ |
| `Education / Careers in Education Intermediate` | → | `Education and Careers in Education Intermediate` | 1 | 1 | ✓ |
| `Emergency Medical Response — CPR Pro/Healthcare Provider` | → | `Emergency Medical Response — CPR Pro and Healthcare Provider` | 2 | 2 | ✓ |
| `Exterior/Advanced Fire Control System and Partitions` | → | `Exterior and Advanced Fire Control System and Partitions` | 1 | 1 | ✓ |
| `Fire Control 4A — Ignitable Liquids and Gases Awareness/Operations` | → | `Fire Control 4A — Ignitable Liquids and Gases Awareness and Operations` | 1 | 0 | ✓ |
| `Fuel Systems/Emission Controls` | → | `Fuel Systems and Emission Controls` | 1 | 0 | ✓ |
| `HAZWOPER First Responder Awareness/Operations` | → | `HAZWOPER First Responder Awareness and Operations` | 1 | 1 | ✓ |
| `Hairstyling Services/Haircutting 2` | → | `Hairstyling Services and Haircutting 2` | 1 | 0 | ✓ |
| `Heavy/Medium Duty Truck Technology Apprenticeship` | → | `Heavy and Medium Duty Truck Technology Apprenticeship` | 1 | 9 | ✓ |
| `Hydraulics/Pneumatics` | → | `Hydraulics and Pneumatics` | 2 | 2 | ✓ |
| `Infant/Toddler Practicum` | → | `Infant and Toddler Practicum` | 1 | 0 | ✓ |
| `Introduction to Engineering Design/Graphics` | → | `Introduction to Engineering Design and Graphics` | 6 | 0 | ✓ |
| `Introduction to UNIX/Linux` | → | `Introduction to UNIX and Linux` | 1 | 0 | ✓ |
| `Ironworker Apprenticeship — OSHA 30/Extension Review` | → | `Ironworker Apprenticeship — OSHA 30 and Extension Review` | 1 | 1 | ✓ |
| `Journeyman Certificate- Apprenticeship Carpentry, Drywall/Lather` | → | `Journeyman Certificate- Apprenticeship Carpentry, Drywall and Lather` | 2 | 0 | ✓ |
| `Journeyman Certificate- Apprenticeship Carpentry, Drywall/Lather (Interior Systems)` | → | `Journeyman Certificate- Apprenticeship Carpentry, Drywall and Lather (Interior Systems)` | 2 | 0 | ✓ |
| `Layout/Leveling Construction Site Practice` | → | `Layout and Leveling Construction Site Practice` | 2 | 1 | ✓ |
| `Maternal/Newborn Nursing Care` | → | `Maternal and Newborn Nursing Care` | 1 | 1 | ✓ |
| `Mathematics for Drywall/Lathers` | → | `Mathematics for Drywall and Lathers` | 1 | 1 | ✓ |
| `NCCER Commercial Electrician Level 4/Journey Level` | → | `NCCER Commercial Electrician Level 4 and Journey Level` | 1 | 0 | ✓ |
| `NCCER Industrial Electrician Level 4/Journey Level` | → | `NCCER Industrial Electrician Level 4 and Journey Level` | 1 | 0 | ✓ |
| `Nursing Skills/Clinical Simulation Laboratory Beginning` | → | `Nursing Skills and Clinical Simulation Laboratory Beginning` | 1 | 1 | ✓ |
| `Oil/Acrylic Painting: Beginning 1` | → | `Oil and Acrylic Painting: Beginning 1` | 2 | 0 | ✓ |
| `Prefab/Sound Panels` | → | `Prefab and Sound Panels` | 1 | 1 | ✓ |
| `Principles of Infant/Toddler Caregiving` | → | `Principles of Infant and Toddler Caregiving` | 1 | 1 | ✓ |
| `Principles of Power Mechanics/Small Engines` | → | `Principles of Power Mechanics and Small Engines` | 1 | 1 | ✓ |
| `Spanish/English Linguistics Analysis` | → | `Spanish and English Linguistics Analysis` | 1 | 0 | ✓ |
| `Standard First Aid/CPR/AED` | → | `Standard First Aid, CPR, and AED` | 2 | 2 | ✓ |
| `Tool/Equipment Applications — Emergency Response Procedures` | → | `Tool and Equipment Applications — Emergency Response Procedures` | 1 | 1 | ✓ |
| `Tool/Equipment Applications — Fall Protection` | → | `Tool and Equipment Applications — Fall Protection` | 1 | 1 | ✓ |
| `Transit Level/Laser` | → | `Transit Level and Laser` | 1 | 1 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship Work Experience` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship Work Experience` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 100` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 100` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 101` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 101` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 110` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 110` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 111` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 111` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 120` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 120` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 121` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 121` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 130` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 130` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 131` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 131` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 140` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 140` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 141` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 141` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 150` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 150` | 1 | 1 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SHME 151` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SHME 151` | 1 | 1 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 100` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 100` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 101` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 101` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 110` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 110` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 111` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 111` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 120` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 120` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 121` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 121` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 130` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 130` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 131` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 131` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 140` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 140` | 1 | 0 | ✓ |
| `UA Local 342 Plumbers/Pipefitters Apprenticeship — SMTEC 141` | → | `UA Local 342 Plumbers and Pipefitters Apprenticeship — SMTEC 141` | 1 | 1 | ✓ |
| `UA Plumbers/Pipefitters Apprenticeship — Journeyperson` | → | `UA Plumbers and Pipefitters Apprenticeship — Journeyperson` | 1 | 0 | ✓ |
| `UA Plumbers/Pipefitters Apprenticeship — Level 2` | → | `UA Plumbers and Pipefitters Apprenticeship — Level 2` | 1 | 0 | ✓ |
| `UA Plumbers/Pipefitters Apprenticeship — Level 3` | → | `UA Plumbers and Pipefitters Apprenticeship — Level 3` | 1 | 0 | ✓ |
| `UA Plumbers/Pipefitters Apprenticeship — Level 4` | → | `UA Plumbers and Pipefitters Apprenticeship — Level 4` | 1 | 0 | ✓ |
| `UNIX/Linux Systems and Programming` | → | `UNIX and Linux Systems and Programming` | 1 | 1 | ✓ |
| `Water/Wastewater Operator Certification` | → | `Water and Wastewater Operator Certification` | 1 | 0 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

_None._

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
