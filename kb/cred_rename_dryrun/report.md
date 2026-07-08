# Credential Rename Dry-Run — 2026-07-08

Generated: `2026-07-08T22:31:12Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 4 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |
|---|---|---:|---:|---:|---:|
| `Administration of Justice 067` | ⇒ `Community and the Justice System` | 1 | 1 | 2 | 1 |
| `Administration of Justice 075` | ⇒ `Introduction to Corrections` | 1 | 1 | 1 | 2 |
| `Administration of Justice 102` | ⇒ `Principles and Procedures of the Justice System` | 1 | 1 | 1 | 0 |
| `Administration of Justice 103` | ⇒ `Concepts of Criminal Law` | 1 | 2 | 1 | 0 |
| `Administration of Justice — Community and the Justice System` | ⇒ `Community and the Justice System` | 1 | 1 | 2 | 1 |
| `American Politics` | ⇒ `American Government and Politics` | 1 | 1 | 1 | 1 |
| `Automatic and Manual Transmissions and Transaxles` | ⇒ `ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)` | 1 | 1 | 1 | 1 |
| `Automotive 102` | ⇒ `Basic Automotive Systems` | 2 | 2 | 1 | 1 |
| `Automotive Brakes` | ⇒ `ASE A5 — Brakes` | 1 | 1 | 1 | 1 |
| `Automotive Electrical Schematic Diagnosis` | ⇒ `ASE A6 — Electrical/Electronic Systems` | 1 | 1 | 1 | 0 |
| `Automotive Electrical Systems I` | ⇒ `ASE A6 — Electrical/Electronic Systems` | 1 | 1 | 1 | 1 |
| `Automotive Electricity and Electronics` | ⇒ `ASE A6 — Electrical/Electronic Systems` | 1 | 1 | 1 | 1 |
| `Automotive Electronics` | ⇒ `ASE A6 — Electrical/Electronic Systems` | 1 | 1 | 1 | 0 |
| `Automotive Suspension, Steering and Alignment` | ⇒ `ASE A4 — Suspension and Steering` | 1 | 1 | 1 | 0 |
| `Automotive Technology — Electrical Fundamentals` | ⇒ `ASE A6 — Electrical/Electronic Systems` | 1 | 1 | 2 | 3 |
| `Baking Experience` | ⇒ `Baking and Pastry` | 1 | 1 | 1 | 1 |
| `Basic Automotive Air Conditioning Systems` | ⇒ `ASE A7 — Heating and Air Conditioning` | 1 | 1 | 1 | 1 |
| `Community Relations (Administration of Justice 5)` | ⇒ `Community and the Justice System` | 2 | 1 | 1 | 1 |
| `Community Relations in Criminal Justice` | ⇒ `Community and the Justice System` | 2 | 1 | 2 | 2 |
| `Concepts of Criminal Law (Administration of Justice 2)` | ⇒ `Concepts of Criminal Law` | 2 | 2 | 1 | 1 |
| `Construction Fundamentals Lab` | ⇒ `Construction Fundamentals` | 1 | 1 | 1 | 1 |
| `Criminal Investigation (Administration of Justice 6)` | ⇒ `Criminal Investigation` | 2 | 2 | 1 | 1 |
| `Criminal Investigations` | ⇒ `Criminal Investigation` | 2 | 2 | 1 | 2 |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `ASHS 280 (Cuesta College Credit by Exam)` | → | `Counseling Skills, Law and Ethics` | 1 | 1 | ✓ |
| `Advanced Nursing Skills / Clinical Simulation Laboratory` | → | `Nursing Skills / Clinical Simulation Laboratory Advanced` | 1 | 1 | ✓ |
| `Arc and Gas Welding` | → | `Arc & Gas Welding` | 3 | 3 | ✓ |
| `Art of Graphic Design I (High School Articulation)` | → | `Art of Graphic Design I` | 2 | 2 | ✓ |
| `Assembly Language Programming` | → | `Computer Architecture and Organization` | 1 | 1 | ✓ |
| `Astronomy (High School Articulation)` | → | `Astronomy` | 1 | 1 | ✓ |
| `Automotive Collision Repair 1` | → | `Automotive Collision Repair` | 2 | 2 | ✓ |
| `Automotive Maintenance & Light Repair I & II (High School Articulation)` | → | `Automotive Maintenance & Light Repair` | 3 | 3 | ✓ |
| `Automotive Maintenance and Light Repair 3` | → | `Automotive Maintenance and Light Repair` | 1 | 1 | ✓ |
| `Automotive Technology Internship — University High School` | → | `Automotive Technology Internship` | 1 | 1 | ✓ |
| `Automotive Technology MLR I and II — Irvine High School` | → | `Automotive Technology Maintenance and Light Repair (MLR)` | 2 | 1 | ✓ |
| `Basic Drawing 1` | → | `Fundamentals of Drawing` | 1 | 1 | ✓ |
| `Basic Escrow Procedure` | → | `Basic Escrow Procedures` | 1 | 1 | ✓ |
| `Beginning After Effects` | → | `After Effects` | 2 | 2 | ✓ |
| `Beginning Computer Keyboarding` | → | `Computer Keyboarding Beginning` | 1 | 1 | ✓ |
| `Beginning Digital Fabrication for Studio Arts` | → | `Digital Fabrication for Studio Arts Beginning` | 1 | 1 | ✓ |
| `Beginning Document Processing` | → | `Document Processing Beginning` | 1 | 1 | ✓ |
| `Beginning Guitar` | → | `Guitar Beginning` | 1 | 1 | ✓ |
| `Beginning Keyboarding` | → | `Keyboarding Beginning` | 1 | 1 | ✓ |
| `Beginning Medical Surgical Nursing` | → | `Medical Surgical Nursing Beginning` | 1 | 1 | ✓ |
| `Beginning Medical Surgical Nursing Laboratory` | → | `Medical Surgical Nursing Laboratory Beginning` | 1 | 1 | ✓ |
| `Beginning Microsoft Access` | → | `Microsoft Access Beginning` | 1 | 1 | ✓ |
| `Beginning Microsoft Excel` | → | `Microsoft Excel Beginning` | 1 | 1 | ✓ |
| `Beginning Microsoft PowerPoint` | → | `Microsoft PowerPoint Beginning` | 1 | 1 | ✓ |
| `Beginning Microsoft Word` | → | `Microsoft Word Beginning` | 1 | 1 | ✓ |
| `Beginning Nursing Skills/Clinical Simulation Laboratory` | → | `Nursing Skills/Clinical Simulation Laboratory Beginning` | 1 | 1 | ✓ |
| `Beginning Photoshop` | → | `Photoshop Beginning` | 3 | 3 | ✓ |
| `Beginning Piano` | → | `Piano Beginning` | 1 | 1 | ✓ |
| `Beginning Sewing` | → | `Sewing Beginning` | 1 | 1 | ✓ |
| `Beginning Stagecraft` | → | `Stagecraft Beginning` | 1 | 1 | ✓ |
| `Beginning Two-Dimensional Design` | → | `Two-Dimensional Design Beginning` | 1 | 1 | ✓ |
| `Biological Anthropology with Laboratory` | → | `Introduction to Biological Anthropology` | 1 | 1 | ✓ |
| `Biological Principles` | → | `Cell and Molecular Biology` | 1 | 1 | ✓ |
| `Biology, Human Anatomy & Physiology — Mater Dei High School` | → | `Biology, Human Anatomy & Physiology` | 1 | 1 | ✓ |
| `Business Management and Entrepreneurship — Cajon High School` | → | `Business Management and Entrepreneurship` | 2 | 1 | ✓ |
| `Business Presentation Graphics` | → | `Digital Presentation Design` | 1 | 1 | ✓ |
| `Business and Finance (High School Articulation)` | → | `Business and Finance` | 1 | 1 | ✓ |
| `C++ Programming I` | → | `C++ Programming` | 1 | 1 | ✓ |
| `CD-005 — Lemoore High School Articulation` | → | `Child Development` | 1 | 1 | ✓ |
| `Calculus I` | → | `Single Variable Calculus I Early Transcendentals` | 4 | 4 | ✓ |
| `Calculus for Business and Social Sciences` | → | `Business Calculus` | 1 | 1 | ✓ |
| `Carpentry — Acoustical Ceilings` | → | `Acoustical Ceilings` | 1 | 1 | ✓ |
| `Carpentry — Ceiling and Soffit Finishing` | → | `Ceiling and Soffit Finishing` | 1 | 1 | ✓ |
| `Carpentry — Commercial Floor Framing` | → | `Commercial Floor Framing` | 1 | 1 | ✓ |
| `Carpentry — Commercial Roof Framing` | → | `Commercial Roof Framing` | 1 | 1 | ✓ |
| `Carpentry — Concealed/Glue-Up/Staple-Up Ceiling Systems` | → | `Concealed/Glue-Up/Staple-Up Ceiling Systems` | 1 | 1 | ✓ |
| `Catering Experience` | → | `Catering and Production Cooking` | 1 | 1 | ✓ |
| `Choreography I` | → | `Choreography` | 1 | 1 | ✓ |
| `Cinema 24` | → | `Basic Film Production` | 2 | 1 | ✓ |
| `College Reading Comprehension` | → | `College Reading - Comprehension` | 1 | 1 | ✓ |
| `Commercial and Industrial Wiring` | → | `Commercial & Industrial Wiring` | 2 | 2 | ✓ |
| `Composition and Reading` | → | `English Composition and Reading` | 2 | 2 | ✓ |
| `Computer Keyboarding — Speed and Accuracy` | → | `Computer Keyboarding` | 1 | 1 | ✓ |
| `Computer Science 111B — Credit by Exam (CCSF)` | → | `Programming Fundamentals: Java` | 1 | 1 | ✓ |
| `Construction Industry Certification (CNSTR 117)` | → | `Construction Industry Certification` | 1 | 0 | ✓ |
| `Critical Thinking and the Nursing Process I` | → | `Critical Thinking and the Nursing Process` | 1 | 1 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `C++ Programming II` | → | `C++ Programming` | 0 | intra_batch_same_target |
| `Child Growth and Development` | → | `Child Development` | 0 | intra_batch_same_target |
| `Choreography II` | → | `Choreography` | 0 | intra_batch_same_target |
| `Critical Thinking and the Nursing Process II` | → | `Critical Thinking and the Nursing Process` | 0 | intra_batch_same_target |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
