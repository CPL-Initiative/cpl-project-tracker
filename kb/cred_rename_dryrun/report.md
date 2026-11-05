# Credential Rename Dry-Run — 2026-11-05

Generated: `2026-11-05T21:57:23Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | FAIL (2) ✗ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 1 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **NO** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

_None._ A queued collision becomes a confirmed merge when the curator clicks **✓ Confirm merge** in the CER triage lane (writes `unified_title_merge_confirm` naming the exact target).

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Spanish 1` | → | `Elementary Spanish I` | 0 | 0 | — |
| `Spanish 2` | → | `Elementary Spanish II` | 0 | 0 | — |

## Collisions (queued, non-blocking — curator decision required)

Each row's proposed new title already exists as a key in `credentials.json`. Policy: non-blocking decision queue — these wait (clean renames + confirmed merges apply without them) until the curator picks a non-colliding target or explicitly confirms the merge in the CER triage lane (PR-5b/2).

| Old | → | New (collides) | Existing records on target | Why queued |
|---|---|---|---:|---|
| `Wheel Alignment, Chassis Dynamics, and ADAS` | → | `Wheel Alignment, Chassis Dynamics, ADAS` | 2 | collision_with_existing_credential |

## Skipped

_None._

## Warning — renames of unified_titles with no `credentials.json` record

These renames would re-key `unified_titles.json` + `coci_articulations.json` but find no record to migrate in `credentials.json`. Likely a curator mistake (renaming a ghost unified_title), but not blocking — surface for review.

- `Spanish 1`
- `Spanish 2`

## V2 blocked — source unified_title not found

These overrides target a unified_title that exists in neither `credentials.json` nor `unified_titles.json`. Probably a stale Supabase row.

- `Spanish 1`
- `Spanish 2`

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
