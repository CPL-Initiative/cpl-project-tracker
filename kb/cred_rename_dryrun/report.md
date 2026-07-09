# Credential Rename Dry-Run — 2026-07-09

Generated: `2026-07-09T23:26:09Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 13 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |
|---|---|---:|---:|---:|---:|
| `Carpenters Apprenticeship — CARP 019` | ⇒ `Rigging` | 1 | 2 | 1 | 1 |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 312` | ⇒ `Rigging` | 1 | 2 | 1 | 1 |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 608` | ⇒ `Rigging` | 1 | 2 | 1 | 1 |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Carpenters Apprenticeship — CARP 002` | → | `Introduction to Apprenticeship II` | 1 | 0 | ✓ |
| `Carpenters Apprenticeship — CARP 101` | → | `Introduction to Apprenticeship I` | 1 | 0 | ✓ |
| `Carpenters Apprenticeship — CARP 109` | → | `Welding II` | 1 | 0 | ✓ |
| `Carpenters Training Committee for Northern California (CTCNC) — OSHA Training` | → | `OSHA 10-hour Construction Training Course` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1203` | → | `Tool and Equipment Applications` | 1 | 1 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 284` | → | `Welding II SMAW` | 1 | 0 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 701` | → | `Introduction to Acoustical Apprenticeship II` | 1 | 0 | ✓ |
| `Carpenters Training Committee for Northern California Apprenticeship — FA/C` | → | `CPR for Carpenters Apprentices` | 1 | 1 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `Carpenters Apprenticeship — CARP 005` | → | `Blueprint Reading-Residential` | 1 | collision_with_existing_credential |
| `Carpenters Apprenticeship — CARP 017` | → | `Introduction to Welding and Cutting` | 1 | collision_with_existing_credential |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 310` | → | `Layout/Leveling Construction Site Practice` | 1 | collision_with_existing_credential |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 315` | → | `Blueprint Reading-Commercial` | 1 | collision_with_existing_credential |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 605` | → | `Blueprint Reading-Residential` | 1 | collision_with_existing_credential |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 702` | → | `Blueprint Reading-Residential` | 1 | collision_with_existing_credential |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 704` | → | `Interior Systems` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — El Modena High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — Orange High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — Santiago High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Medical Core (High School Articulation) — Villa Park High School` | → | `Medical Core` | 1 | collision_with_existing_credential |
| `Spanish for Spanish Speakers 1` | → | `Spanish for Heritage Speakers 1` | 1 | collision_with_existing_credential |
| `Spanish for Spanish Speakers 2` | → | `Spanish for Heritage Speakers 2` | 1 | collision_with_existing_credential |

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
