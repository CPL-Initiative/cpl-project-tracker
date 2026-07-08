# Credential Rename Dry-Run — 2026-07-08

Generated: `2026-07-08T20:11:09Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 6 |
| **Apply safe** | V1–V3 pass + at least one clean rename (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `AB Miller High School Pathway — Business and Finance` | → | `Business and Finance Pathway` | 1 | 1 | ✓ |
| `AB Miller High School Pathway — Global Business Design` | → | `Global Business Design Pathway` | 1 | 1 | ✓ |
| `Abutments (Carpentry — Norco IBEW/Carpenters Articulation)` | → | `Abutments` | 1 | 1 | ✓ |
| `Acoustical Soffits (Norco Apprenticeship Articulation)` | → | `Acoustical Soffits` | 1 | 1 | ✓ |
| `Administration of Justice 049` | → | `Narcotics and Vice Control` | 1 | 1 | ✓ |
| `Administration of Justice 106` | → | `Principles of Investigation` | 1 | 0 | ✓ |
| `Administration of Justice 14` | → | `Report Writing for Peace Officers` | 1 | 0 | ✓ |
| `Administration of Justice 160` | → | `Police Organization and Administration` | 1 | 1 | ✓ |
| `Administration of Justice 68 (CCSF)` | → | `Criminal Justice Report Writing` | 1 | 1 | ✓ |
| `Administration of Justice 72 (CCSF)` | → | `Police Work Experience` | 1 | 1 | ✓ |
| `Administration of Justice 85 (CCSF)` | → | `P.C. 832 Arrest and Control Certification` | 1 | 1 | ✓ |
| `Administration of Justice — Community Relations` | → | `Community Relations` | 1 | 2 | ✓ |
| `Administration of Justice — Lemoore HS Articulation` | → | `Administration of Justice` | 1 | 1 | ✓ |
| `Adult Health Care I (Nursing)` | → | `Adult Health Care I` | 1 | 1 | ✓ |
| `Adult Health Care II (Nursing)` | → | `Adult Health Care II` | 1 | 1 | ✓ |
| `Adult Health Care III (Nursing)` | → | `Adult Health Care III` | 1 | 1 | ✓ |
| `Adult Health Care IV (Nursing)` | → | `Adult Health Care IV` | 1 | 1 | ✓ |
| `Advanced Academic Reading & Writing I (ESL)` | → | `Academic Reading & Writing I (ESL) Advanced` | 1 | 0 | ✓ |
| `Advanced Acoustical Ceiling Installation (Norco Apprenticeship)` | → | `Advanced Acoustical Ceiling Installation` | 1 | 1 | ✓ |
| `Advanced Acoustical Ceiling Layout (Norco Apprenticeship)` | → | `Advanced Acoustical Ceiling Layout` | 1 | 1 | ✓ |
| `Advanced Automatic Finishing Tools (Norco Apprenticeship)` | → | `Advanced Automatic Finishing Tools` | 1 | 1 | ✓ |
| `Advanced Automotive Electrical Systems` | → | `Automotive Electrical Systems Advanced` | 2 | 1 | ✓ |
| `Advanced CAD, Rendering & Animation` | → | `CAD, Rendering & Animation Advanced` | 1 | 1 | ✓ |
| `Advanced Commercial Framing (Norco Apprenticeship)` | → | `Advanced Commercial Framing` | 1 | 1 | ✓ |
| `Advanced Composition and Introduction to Literature` | → | `Introduction to Literature and Composition` | 1 | 1 | ✓ |
| `Advanced Construction Inspection: International Building Code (IBC)` | → | `Construction Inspection: International Building Code (IBC) Advanced` | 2 | 2 | ✓ |
| `Advanced Construction Inspection: Uniform Plumbing Code (UPC)` | → | `Construction Inspection: Uniform Plumbing Code (UPC) Advanced` | 2 | 1 | ✓ |
| `Advanced Desserts and Pastry` | → | `Advanced Desserts and Pastry/Chocolate/Sugar` | 1 | 1 | ✓ |
| `Advanced Digital Photography` | → | `Digital Photography Advanced` | 1 | 1 | ✓ |
| `Advanced Engineering & Design (High School Articulation)` | → | `Engineering & Design Advanced` | 2 | 2 | ✓ |
| `Advanced Firearms and Range Application` | → | `Firearms and Range Application Advanced` | 1 | 1 | ✓ |
| `Advanced Floral Design` | → | `Floral Design Advanced` | 3 | 3 | ✓ |
| `Advanced Gas Tungsten Arc Welding (GTAW)` | → | `Gas Tungsten Arc Welding (GTAW) Advanced` | 1 | 4 | ✓ |
| `Advanced Hand Finishing` | → | `Hand Finishing Advanced` | 1 | 1 | ✓ |
| `Advanced Irrigation and Drainage` | → | `Irrigation and Drainage Advanced` | 1 | 1 | ✓ |
| `Advanced Machine Tool Technology Lab` | → | `Mach Tool Technology Lab Advanced` | 1 | 1 | ✓ |
| `Advanced Medical Surgical Nursing` | → | `Medical Surgical Nursing Advanced` | 1 | 1 | ✓ |
| `Advanced Medical Surgical Nursing Lab` | → | `Medical Surgical Nursing Lab Advanced` | 1 | 1 | ✓ |
| `Advanced Metal Framing` | → | `Metal Framing Advanced` | 2 | 1 | ✓ |
| `Advanced Print Reading — Digital Application` | → | `Print Reading — Digital Application Advanced` | 1 | 1 | ✓ |
| `Advanced Print Reading — Digital Planning` | → | `Print Reading — Digital Planning Advanced` | 1 | 1 | ✓ |
| `Advanced Roof Framing` | → | `Roof Framing Advanced` | 1 | 1 | ✓ |
| `Advanced Stairs` | → | `Stairs Advanced` | 1 | 1 | ✓ |
| `Agricultural Equipment Diagnosis and Repair` | → | `Equipment Diagnosis & Repair` | 1 | 1 | ✓ |
| `Agricultural Equipment Service and Safety` | → | `Equipment Service and Safety` | 2 | 2 | ✓ |
| `Agricultural Machinery Management` | → | `Machinery Management` | 1 | 1 | ✓ |
| `Agricultural Mechanical Systems Design and Evaluation 1` | → | `Mechanical Systems Design & Evaluation 1` | 1 | 1 | ✓ |
| `Agricultural Mechanical Systems Design and Evaluation 2` | → | `Mechanical Systems Design & Evaluation 2` | 1 | 1 | ✓ |
| `Agriculture Computer Applications` | → | `Agricultural Computer Applications` | 1 | 1 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames apply without them) until the curator picks a non-colliding target or explicitly confirms the merge (PR-5b/2).

| Old | → | New (collides) | Existing records on target |
|---|---|---|---:|
| `Administration of Justice 067` | → | `Community and the Justice System` | 1 |
| `Administration of Justice 075` | → | `Introduction to Corrections` | 1 |
| `Administration of Justice 102` | → | `Principles and Procedures of the Justice System` | 1 |
| `Administration of Justice 103` | → | `Concepts of Criminal Law` | 1 |
| `Administration of Justice — Community and the Justice System` | → | `Community and the Justice System` | 1 |
| `American Politics` | → | `American Government and Politics` | 1 |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
