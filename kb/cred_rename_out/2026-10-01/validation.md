# Credential Rename Apply Receipt — 2026-10-01

Applied: `2026-10-01T22:46:20Z`

**2 renames + 0 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `AWS Certified SysOps Administrator — Associate` | → | `AWS CloudOps Engineer - Associate` |
| `Cisco Certified CyberOps Associate` | → | `CCNA Cybersecurity` |

## Confirmed merges applied (records folded into the existing key)

_None._

## Per-file results

### `credentials.json`

- **before_count**: 1987
- **after_count**: 1987
- **rekeyed**: 2
- **already_applied**: 0
- **not_found**: 0

### `unified_titles.json`

- **before_count**: 3813
- **rewrites**: 4
- **untouched**: 3809

### `coci_articulations.json`

- **articulation_records**: 4592
- **rewrites**: 7
- **pre_counts_old**: `{"AWS Certified SysOps Administrator — Associate": 3, "Cisco Certified CyberOps Associate": 4}`
- **post_counts_new**: `{"AWS CloudOps Engineer - Associate": 3, "CCNA Cybersecurity": 4}`

## Rollback

To revert RENAMES, swap `old` and `new` in the frozen alias_map.json at this path and re-run `kb/_cred_rename_apply.py`. The supersede-don't-mutate ADR preserves the round-trip. MERGES are not swap-reversible (records fold + dedupe): revert them from git history using this receipt's merge list as the map.

