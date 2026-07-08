# Credential Rename Dry-Run — 2026-07-08

Generated: `2026-07-08T14:46:16Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No target collides with existing credentials.json key | PASS ✓ |
| **Apply safe** | All gates pass + at least one clean rename | **YES — PR-5b/1 can dispatch** |

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `AB Miller High School Pathway — Business and Finance` | → | `Business and Finance Pathway` | 1 | 1 | ✓ |
| `AB Miller High School Pathway — Global Business Design` | → | `Global Business Design Pathway` | 1 | 1 | ✓ |

## Collisions (rejected — curator decision required)

_None._

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
