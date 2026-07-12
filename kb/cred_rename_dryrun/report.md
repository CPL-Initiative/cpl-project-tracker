# Credential Rename Dry-Run — 2026-07-12

Generated: `2026-07-12T14:32:46Z`

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

| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |
|---|---|---:|---:|---:|---:|
| `Carpenters Apprenticeship — CARP 005` | ⇒ `Blueprint Reading-Residential` | 1 | 1 | 1 | 0 |
| `Carpenters Apprenticeship — CARP 017` | ⇒ `Introduction to Welding and Cutting` | 1 | 1 | 1 | 0 |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 310` | ⇒ `Layout/Leveling Construction Site Practice` | 1 | 1 | 1 | 0 |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 315` | ⇒ `Blueprint Reading-Commercial` | 1 | 1 | 1 | 0 |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 605` | ⇒ `Blueprint Reading-Residential` | 1 | 1 | 1 | 0 |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 702` | ⇒ `Blueprint Reading-Residential` | 1 | 1 | 1 | 0 |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 704` | ⇒ `Interior Systems` | 1 | 1 | 1 | 0 |
| `Medical Core (High School Articulation) — El Modena High School` | ⇒ `Medical Core` | 1 | 1 | 1 | 1 |
| `Medical Core (High School Articulation) — Orange High School` | ⇒ `Medical Core` | 1 | 1 | 1 | 1 |
| `Medical Core (High School Articulation) — Santiago High School` | ⇒ `Medical Core` | 1 | 1 | 1 | 1 |
| `Medical Core (High School Articulation) — Villa Park High School` | ⇒ `Medical Core` | 1 | 1 | 1 | 1 |
| `Spanish for Spanish Speakers 1` | ⇒ `Spanish for Heritage Speakers 1` | 1 | 1 | 1 | 1 |
| `Spanish for Spanish Speakers 2` | ⇒ `Spanish for Heritage Speakers 2` | 1 | 1 | 2 | 2 |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Apparel Construction I` | → | `Apparel Construction 1` | 1 | 1 | ✓ |
| `Apparel Construction I Lab` | → | `Apparel Construction 1 Lab` | 1 | 1 | ✓ |
| `Applied Biotechnology I` | → | `Applied Biotechnology 1` | 1 | 1 | ✓ |
| `Architectural Design I` | → | `Architectural Design 1` | 3 | 0 | ✓ |
| `Architectural Drawing I` | → | `Architectural Drawing 1` | 2 | 1 | ✓ |
| `Art of Graphic Design I` | → | `Art of Graphic Design 1` | 2 | 2 | ✓ |
| `BIM and Sustainable Design Strategies I` | → | `BIM and Sustainable Design Strategies 1` | 1 | 1 | ✓ |
| `CLEP French Language Level I` | → | `CLEP French Language Level 1` | 6 | 1 | ✓ |
| `CLEP French Language Level II` | → | `CLEP French Language Level 2` | 14 | 1 | ✓ |
| `CLEP German Language Level I` | → | `CLEP German Language Level 1` | 5 | 1 | ✓ |
| `CLEP German Language Level II` | → | `CLEP German Language Level 2` | 14 | 1 | ✓ |
| `CLEP History of the United States I` | → | `CLEP History of the United States 1` | 12 | 2 | ✓ |
| `CLEP History of the United States II` | → | `CLEP History of the United States 2` | 11 | 2 | ✓ |
| `CLEP Spanish Language Level I` | → | `CLEP Spanish Language Level 1` | 5 | 0 | ✓ |
| `CLEP Spanish Language Level II` | → | `CLEP Spanish Language Level 2` | 17 | 3 | ✓ |
| `CLEP Spanish with Writing I` | → | `CLEP Spanish with Writing 1` | 3 | 0 | ✓ |
| `CLEP Spanish with Writing II` | → | `CLEP Spanish with Writing 2` | 3 | 1 | ✓ |
| `CLEP Spanish with Writing Level I` | → | `CLEP Spanish with Writing Level 1` | 1 | 0 | ✓ |
| `CLEP Western Civilization I` | → | `CLEP Western Civilization 1` | 12 | 2 | ✓ |
| `CLEP Western Civilization II` | → | `CLEP Western Civilization 2` | 9 | 2 | ✓ |
| `Calculus I With Analytic Geometry` | → | `Calculus 1 With Analytic Geometry` | 1 | 0 | ✓ |
| `Calculus II` | → | `Calculus 2` | 3 | 3 | ✓ |
| `Calculus II With Analytic Geometry` | → | `Calculus 2 With Analytic Geometry` | 1 | 0 | ✓ |
| `Center for Financial Training (CFT) — Human Relations (CFTA-0009)` | → | `Center for Financial Training (CFT) — Human Relations` | 1 | 1 | ✓ |
| `Center for Financial Training (CFT) — Human Resources Management (CFTA-0025)` | → | `Center for Financial Training (CFT) — Human Resources Management` | 2 | 1 | ✓ |
| `Center for Financial Training (CFT) — Management (CFTA-0019)` | → | `Center for Financial Training (CFT) — Management` | 1 | 1 | ✓ |
| `Center for Financial Training (CFT) — Marketing (CFTA-0012)` | → | `Center for Financial Training (CFT) — Marketing` | 1 | 1 | ✓ |
| `Center for Financial Training (CFT) — Supervision (CFTA-0015)` | → | `Center for Financial Training (CFT) — Supervision` | 1 | 1 | ✓ |
| `Class Piano — Beginning II` | → | `Class Piano — Beginning 2` | 1 | 0 | ✓ |
| `DSLR and Lighting for Professional Production I Beginning` | → | `DSLR and Lighting for Professional Production 1 Beginning` | 1 | 0 | ✓ |
| `DSST Principles of Physical Science I` | → | `DSST Principles of Physical Science 1` | 2 | 0 | ✓ |
| `Diagnostic Medical Sonography — Clinical Education IV` | → | `Diagnostic Medical Sonography — Clinical Education 4` | 1 | 0 | ✓ |
| `Digital Video I` | → | `Digital Video 1` | 1 | 1 | ✓ |
| `EMT-II Certification` | → | `EMT-2 Certification` | 1 | 3 | ✓ |
| `Elementary Spanish I` | → | `Elementary Spanish 1` | 8 | 8 | ✓ |
| `Engineering Design II Honors Advanced` | → | `Engineering Design 2 Honors Advanced` | 2 | 1 | ✓ |
| `Exploring Culture through Academic Discourse I` | → | `Exploring Culture through Academic Discourse 1` | 1 | 0 | ✓ |
| `Exploring Culture through Academic Discourse II` | → | `Exploring Culture through Academic Discourse 2` | 1 | 0 | ✓ |
| `Field Studies & Seminar I` | → | `Field Studies & Seminar 1` | 1 | 1 | ✓ |
| `Fire Inspector I` | → | `Fire Inspector 1` | 5 | 35 | ✓ |
| `Fire Officer II` | → | `Fire Officer 2` | 1 | 4 | ✓ |
| `Floral Design and Practices I` | → | `Floral Design and Practices 1` | 1 | 1 | ✓ |
| `French — Level II` | → | `French — Level 2` | 1 | 0 | ✓ |
| `Funeral Service Administration II` | → | `Funeral Service Administration 2` | 1 | 0 | ✓ |
| `Funeral Service Ethics and Laws I` | → | `Funeral Service Ethics and Laws 1` | 1 | 0 | ✓ |
| `Funeral Service Ethics and Laws II` | → | `Funeral Service Ethics and Laws 2` | 1 | 0 | ✓ |
| `Garde Manger II` | → | `Garde Manger 2` | 1 | 1 | ✓ |
| `Graphic Design I` | → | `Graphic Design 1` | 3 | 2 | ✓ |
| `Introduction to Acoustical Apprenticeship II` | → | `Introduction to Acoustical Apprenticeship 2` | 1 | 0 | ✓ |
| `Introduction to Apprenticeship I` | → | `Introduction to Apprenticeship 1` | 1 | 0 | ✓ |
| `Introduction to Apprenticeship II` | → | `Introduction to Apprenticeship 2` | 1 | 0 | ✓ |
| `Ironworker Apprenticeship — Post Tensioning I` | → | `Ironworker Apprenticeship — Post Tensioning 1` | 1 | 1 | ✓ |
| `Ironworker Apprenticeship — Post Tensioning II` | → | `Ironworker Apprenticeship — Post Tensioning 2` | 1 | 1 | ✓ |
| `Ironworker Apprenticeship — Reinforcing II` | → | `Ironworker Apprenticeship — Reinforcing 2` | 1 | 1 | ✓ |
| `Ironworker Apprenticeship — Welding I` | → | `Ironworker Apprenticeship — Welding 1` | 1 | 0 | ✓ |
| `Ironworker Apprenticeship — Welding II` | → | `Ironworker Apprenticeship — Welding 2` | 1 | 1 | ✓ |
| `Ironworker Architectural II` | → | `Ironworker Architectural 2` | 1 | 0 | ✓ |
| `Ironworker Architectural III` | → | `Ironworker Architectural 3` | 1 | 0 | ✓ |
| `Ironworker Structural Steel I` | → | `Ironworker Structural Steel 1` | 1 | 0 | ✓ |
| `Ironworker Structural Steel II` | → | `Ironworker Structural Steel 2` | 1 | 0 | ✓ |
| `Ironworker Structural, Architectural and Ornamental I` | → | `Ironworker Structural, Architectural and Ornamental 1` | 1 | 0 | ✓ |
| `Ironworker Welding III` | → | `Ironworker Welding 3` | 1 | 0 | ✓ |
| `Jazz and Popular Music Guitar I` | → | `Jazz and Popular Music Guitar 1` | 1 | 0 | ✓ |
| `Landscape Installation and Maintenance I` | → | `Landscape Installation and Maintenance 1` | 2 | 1 | ✓ |
| `McDonald's MCD-0051 Business Leadership Practices` | → | `McDonald's Business Leadership Practices` | 2 | 1 | ✓ |
| `McDonald's MCD-0056 Business Management` | → | `McDonald's Business Management` | 1 | 1 | ✓ |
| `McDonald's MCD-0057 Operations Supervisor MDP` | → | `McDonald's Operations Supervisor MDP` | 1 | 1 | ✓ |
| `McDonald's MCD-0069 General Manager Business Leader Capstone` | → | `McDonald's General Manager Business Leader Capstone` | 1 | 1 | ✓ |
| `McDonald's MCD-0072 Mid-Management Development Advanced Curriculum` | → | `McDonald's Mid-Management Development Advanced Curriculum` | 1 | 1 | ✓ |
| `McDonald's MCD-0074 Mid-Management Foundations Curriculum` | → | `McDonald's Mid-Management Foundations Curriculum` | 2 | 1 | ✓ |
| `Metal Building Erection I / Foreman Training` | → | `Metal Building Erection 1 / Foreman Training` | 1 | 0 | ✓ |
| `Musical Theater Workshop I` | → | `Musical Theater Workshop 1` | 1 | 0 | ✓ |
| `OSHA 030 — Construction Industry Outreach (30-hour)` | → | `OSHA 30 — Construction Industry Outreach (30-hour)` | 1 | 1 | ✓ |
| `Patient-Centered Care I and Family-Centered Care of Children` | → | `Patient-Centered Care 1 and Family-Centered Care of Children` | 1 | 1 | ✓ |
| `Patient-Centered Care II and Maternal Newborn and Mental Health Nursing` | → | `Patient-Centered Care 2 and Maternal Newborn and Mental Health Nursing` | 2 | 2 | ✓ |
| `Patient-Centered Care III and Transition to Professional Practice` | → | `Patient-Centered Care 3 and Transition to Professional Practice` | 2 | 2 | ✓ |
| `Piano II` | → | `Piano 2` | 1 | 0 | ✓ |
| `Programming Concepts and Methodology I` | → | `Programming Concepts and Methodology 1` | 1 | 1 | ✓ |
| `Recording Arts Workshop I` | → | `Recording Arts Workshop 1` | 1 | 0 | ✓ |
| `Recording Arts Workshop II` | → | `Recording Arts Workshop 2` | 1 | 0 | ✓ |
| `Recording Arts Workshop III` | → | `Recording Arts Workshop 3` | 1 | 0 | ✓ |
| `Red Hat Linux Administration I` | → | `Red Hat Linux Administration 1` | 2 | 2 | ✓ |
| `Restaurant Service and Catering II` | → | `Restaurant Service and Catering 2` | 4 | 4 | ✓ |
| `SFT Firefighter II` | → | `SFT Firefighter 2` | 1 | 1 | ✓ |
| `Single Variable Calculus I Early Transcendentals` | → | `Single Variable Calculus 1 Early Transcendentals` | 4 | 4 | ✓ |
| `SolidWorks I` | → | `SolidWorks 1` | 1 | 2 | ✓ |
| `Spanish I` | → | `Spanish 1` | 2 | 1 | ✓ |
| `Spanish II` | → | `Spanish 2` | 2 | 1 | ✓ |
| `Street Dance I` | → | `Street Dance 1` | 1 | 1 | ✓ |
| `Street Dance II` | → | `Street Dance 2` | 1 | 1 | ✓ |
| `Street Dance III` | → | `Street Dance 3` | 1 | 1 | ✓ |
| `Street Dance IV` | → | `Street Dance 4` | 1 | 1 | ✓ |
| `Strength of Architectural Materials I` | → | `Strength of Architectural Materials 1` | 1 | 1 | ✓ |
| `Swiftwater Rescue Technician I` | → | `Swiftwater Rescue Technician 1` | 1 | 1 | ✓ |
| `Visual Basic Programming I` | → | `Visual Basic Programming 1` | 1 | 1 | ✓ |
| `Voice Development I` | → | `Voice Development 1` | 1 | 1 | ✓ |
| `Voice Development II` | → | `Voice Development 2` | 1 | 1 | ✓ |
| `Voice Technique I` | → | `Voice Technique 1` | 1 | 1 | ✓ |
| `Voice Technique II` | → | `Voice Technique 2` | 1 | 1 | ✓ |
| `Wastewater Treatment Plant Operator Grade I` | → | `Wastewater Treatment Plant Operator Grade 1` | 1 | 1 | ✓ |
| `Wastewater Treatment Plant Operator Grade II` | → | `Wastewater Treatment Plant Operator Grade 2` | 1 | 1 | ✓ |
| `Water Distribution Operator I` | → | `Water Distribution Operator 1` | 1 | 0 | ✓ |
| `Web Publishing I` | → | `Web Publishing 1` | 1 | 1 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

_None._

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
