# Credential Rename Dry-Run — 2026-07-09

Generated: `2026-07-09T19:04:13Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 23 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |
|---|---|---:|---:|---:|---:|
| `Juvenile Justice Procedures` | ⇒ `Juvenile Law and Procedures` | 2 | 2 | 2 | 1 |
| `Keyboarding` | ⇒ `Music Keyboards 1` | 1 | 1 | 1 | 1 |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Basic Photography` | → | `Photography Beginning` | 1 | 1 | ✓ |
| `Leadership (High School Articulation)` | → | `Leadership` | 1 | 1 | ✓ |
| `Leadership in Agriculture` | → | `Leadership in Agriculture B` | 2 | 2 | ✓ |
| `Long Beach City College Auto 603` | → | `Automotive Brake Inspection` | 1 | 1 | ✓ |
| `Long Beach City College Auto 611` | → | `Automative Engine Repair` | 1 | 1 | ✓ |
| `Long Beach City College Auto 612` | → | `Automative Automatic Transmissions` | 1 | 1 | ✓ |
| `Long Beach City College Auto 613` | → | `Automative Manual Transmission` | 1 | 1 | ✓ |
| `Long Beach City College Auto 614` | → | `Automative Wheel Alignment` | 1 | 1 | ✓ |
| `Long Beach City College Auto 615` | → | `Automative Brake System` | 1 | 1 | ✓ |
| `Long Beach City College Auto 616` | → | `Automative Electrical Systems` | 1 | 1 | ✓ |
| `Long Beach City College Auto 617` | → | `Automotive Air Conditioner` | 1 | 1 | ✓ |
| `Long Beach City College Auto 618` | → | `Automative Fuel Systems` | 1 | 1 | ✓ |
| `Long Beach City College Auto 619` | → | `Automotive Light Diesel Engines` | 1 | 1 | ✓ |
| `Maternal and Newborn Health Care (Nursing)` | → | `Maternal and Newborn Health Care` | 1 | 1 | ✓ |
| `Mathematics (MATH 095)` | → | `Intermediate Algebra` | 2 | 1 | ✓ |
| `Medical Assisting Clinical` | → | `Medical Assisting Clinical Procedures` | 2 | 1 | ✓ |
| `Medical Assisting Lab Procedures` | → | `Medical Assisting Laboratory Procedures` | 2 | 1 | ✓ |
| `Medical Core (High School Articulation) — Canyon High School` | → | `Medical Core` | 1 | 1 | ✓ |
| `Mexican Folklorico I` | → | `Mexican Folklorico 1` | 1 | 1 | ✓ |
| `Mexican Folklorico II` | → | `Mexican Folklorico 2` | 1 | 1 | ✓ |
| `Mexican Folklorico III` | → | `Mexican Folklorico 3` | 1 | 1 | ✓ |
| `Mexican Folklorico IV` | → | `Mexican Folklorico 4` | 1 | 1 | ✓ |
| `Microsoft Excel I` | → | `Microsoft Excel 1` | 1 | 1 | ✓ |
| `Pharmacology (Nursing)` | → | `Pharmacology` | 2 | 1 | ✓ |
| `Spanish 2` | → | `Elementary Spanish 2` | 4 | 3 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `Culinary Fundamentals I` | → | `Culinary Fundamentals` | 1 | collision_with_existing_credential |
| `Culinary Internship II` | → | `Culinary Internship` | 1 | collision_with_existing_credential |
| `Cybersecurity Competition 1B` | → | `Cybersecurity Competition` | 1 | collision_with_existing_credential |
| `Cybersecurity Competition 2A` | → | `Cybersecurity Competition` | 1 | collision_with_existing_credential |
| `Cybersecurity Competition 2B` | → | `Cybersecurity Competition` | 1 | collision_with_existing_credential |
| `Cybersecurity Competition 3A` | → | `Cybersecurity Competition` | 1 | collision_with_existing_credential |
| `Cybersecurity Competition 3B` | → | `Cybersecurity Competition` | 1 | collision_with_existing_credential |
| `ESL — High-Beginning Grammar for Reading and Writing` | → | `ESL Grammar for Reading and Writing Beginning` | 1 | collision_with_existing_credential |
| `ESL — High-Beginning Reading and Writing` | → | `ESL Reading and Writing Beginning` | 1 | collision_with_existing_credential |
| `ESL — Intermediate Grammar for Reading and Writing` | → | `ESL Grammar for Reading and Writing Intermediate` | 1 | collision_with_existing_credential |
| `ESL — Intermediate Reading and Writing` | → | `ESL Reading and Writing Intermediate` | 1 | collision_with_existing_credential |
| `Elementary American Sign Language I` | → | `American Sign Language 1` | 1 | collision_with_existing_credential |
| `Fire Science 34C` | → | `Fire Science` | 1 | collision_with_existing_credential |
| `Generic Credit by Exam â€” San Diego City College` | → | `Credit by Exam` | 1 | collision_with_existing_credential |
| `Generic Credit by Exam â€” San Diego Mesa College` | → | `Credit by Exam` | 1 | collision_with_existing_credential |
| `High School Articulation — Anatomy and Physiology Honors (Colton-Redlands-Yucaipa ROP)` | → | `Anatomy and Physiology Honors` | 1 | collision_with_existing_credential |
| `Intermediate American Sign Language II` | → | `American Sign Language Intermediate` | 1 | collision_with_existing_credential |
| `Intermediate Spanish I` | → | `Spanish Intermediate` | 1 | collision_with_existing_credential |
| `Law Enforcement (High School Articulation)` | → | `Law Enforcement` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — El Modena High School` | → | `Medical Core` | 0 | intra_batch_same_target |
| `Medical Core (High School Articulation) — Orange High School` | → | `Medical Core` | 0 | intra_batch_same_target |
| `Medical Core (High School Articulation) — Santiago High School` | → | `Medical Core` | 0 | intra_batch_same_target |
| `Medical Core (High School Articulation) — Villa Park High School` | → | `Medical Core` | 0 | intra_batch_same_target |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
