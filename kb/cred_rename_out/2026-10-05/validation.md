# Credential Rename Apply Receipt — 2026-10-05

Applied: `2026-10-05T15:18:28Z`

**1 renames + 0 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `Ext & Review` | → | `Ironworker Apprenticeship — OSHA 30/Extension Review` |

## Confirmed merges applied (records folded into the existing key)

_None._

## Per-file results

### `credentials.json`

- **before_count**: 1986
- **after_count**: 1986
- **rekeyed**: 1
- **already_applied**: 0
- **not_found**: 0

### `unified_titles.json`

- **before_count**: 3813
- **rewrites**: 1
- **untouched**: 3812

### `coci_articulations.json`

- **articulation_records**: 4592
- **rewrites**: 1
- **pre_counts_old**: `{"Ext & Review": 1}`
- **post_counts_new**: `{"Ironworker Apprenticeship — OSHA 30/Extension Review": 1}`

## Rollback

To revert RENAMES, swap `old` and `new` in the frozen alias_map.json at this path and re-run `kb/_cred_rename_apply.py`. The supersede-don't-mutate ADR preserves the round-trip. MERGES are not swap-reversible (records fold + dedupe): revert them from git history using this receipt's merge list as the map.

