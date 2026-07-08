# Credential Rename Dry-Run — 2026-07-08

Generated: `2026-07-08T21:01:14Z`

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

_None._ A queued collision becomes a confirmed merge when the curator clicks **✓ Confirm merge** in the CER triage lane (writes `unified_title_merge_confirm` naming the exact target).

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `ASHS 280 (Cuesta College Credit by Exam)` | → | `Counseling Skills, Law and Ethics` | 1 | 1 | ✓ |
| `Advanced Nursing Skills / Clinical Simulation Laboratory` | → | `Nursing Skills / Clinical Simulation Laboratory Advanced` | 1 | 1 | ✓ |
| `Arc and Gas Welding` | → | `Arc & Gas Welding` | 3 | 3 | ✓ |
| `Art of Graphic Design I (High School Articulation)` | → | `Art of Graphic Design I` | 2 | 2 | ✓ |
| `Astronomy (High School Articulation)` | → | `Astronomy` | 1 | 1 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `Administration of Justice 067` | → | `Community and the Justice System` | 1 | collision_with_existing_credential |
| `Administration of Justice 075` | → | `Introduction to Corrections` | 1 | collision_with_existing_credential |
| `Administration of Justice 102` | → | `Principles and Procedures of the Justice System` | 1 | collision_with_existing_credential |
| `Administration of Justice 103` | → | `Concepts of Criminal Law` | 1 | collision_with_existing_credential |
| `Administration of Justice — Community and the Justice System` | → | `Community and the Justice System` | 1 | collision_with_existing_credential |
| `American Politics` | → | `American Government and Politics` | 1 | collision_with_existing_credential |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
