# Credential Rename Dry-Run — 2026-07-08

Generated: `2026-07-08T22:41:15Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 11 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

_None._ A queued collision becomes a confirmed merge when the curator clicks **✓ Confirm merge** in the CER triage lane (writes `unified_title_merge_confirm` naming the exact target).

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
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

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `C++ Programming II` | → | `C++ Programming` | 1 | collision_with_existing_credential |
| `Child Growth and Development` | → | `Child Development` | 1 | collision_with_existing_credential |
| `Choreography II` | → | `Choreography` | 1 | collision_with_existing_credential |
| `Critical Thinking and the Nursing Process II` | → | `Critical Thinking and the Nursing Process` | 1 | collision_with_existing_credential |
| `Culinary Fundamentals I` | → | `Culinary Fundamentals` | 0 | intra_batch_same_target |
| `Culinary Internship II` | → | `Culinary Internship` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 1B` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 2A` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 2B` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 3A` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |
| `Cybersecurity Competition 3B` | → | `Cybersecurity Competition` | 0 | intra_batch_same_target |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
