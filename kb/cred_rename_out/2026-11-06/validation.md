# Credential Rename Apply Receipt — 2026-11-06

Applied: `2026-11-06T21:45:49Z`

**0 renames + 2 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

_None._

## Confirmed merges applied (records folded into the existing key)

| Old unified_title | ⇒ folded into |
|---|---|
| `ServSafe Food Protection Manager` | ⇒ `ServSafe Food Protection Manager Certification` |
| `Wheel Alignment, Chassis Dynamics, and ADAS` | ⇒ `Wheel Alignment, Chassis Dynamics, ADAS` |

## Per-file results

### `credentials.json`

- **before_count**: 2698
- **after_count**: 2698
- **rekeyed**: 0
- **already_applied**: 0
- **not_found**: 0

### `credentials.json (merge fold)`

- **before_count**: 2698
- **after_count**: 2696
- **keys_folded**: 2
- **already_applied**: 0
- **records_moved**: 1
- **records_deduped**: 2

### `unified_titles.json`

- **before_count**: 5538
- **rewrites**: 2
- **untouched**: 5536

### `coci_articulations.json`

- **articulation_records**: 4592
- **rewrites**: 1
- **pre_counts_old**: `{"ServSafe Food Protection Manager": 1}`
- **post_counts_new**: `{"ServSafe Food Protection Manager Certification": 5}`

## Rollback

To revert RENAMES, swap `old` and `new` in the frozen alias_map.json at this path and re-run `kb/_cred_rename_apply.py`. The supersede-don't-mutate ADR preserves the round-trip. MERGES are not swap-reversible (records fold + dedupe): revert them from git history using this receipt's merge list as the map.

