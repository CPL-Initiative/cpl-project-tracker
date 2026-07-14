# Credential Rename Dry-Run — 2026-07-14

Generated: `2026-07-14T19:32:36Z`

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
| `Automative Automatic Transmissions` | ⇒ `ASE A2 — Automatic Transmission/Transaxle` | 1 | 1 | 1 | 1 |
| `Automative Brake System` | ⇒ `ASE A5 — Brakes` | 1 | 1 | 1 | 1 |
| `Automative Electrical Systems` | ⇒ `ASE A6 — Electrical/Electronic Systems` | 1 | 1 | 1 | 1 |
| `Automative Engine Repair` | ⇒ `ASE A1 — Engine Repair` | 1 | 1 | 1 | 1 |
| `Automative Manual Transmission` | ⇒ `ASE A3 — Manual Drive Train and Axles` | 1 | 1 | 1 | 1 |
| `Automotive Light Diesel Engines` | ⇒ `ASE A9 — Light Vehicle Diesel Engines` | 1 | 1 | 1 | 1 |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Automative Fuel Systems` | → | `Automotive Fuel Systems` | 1 | 1 | ✓ |
| `Automative Wheel Alignment` | → | `Automotive Wheel Alignment` | 1 | 1 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

_None._

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
