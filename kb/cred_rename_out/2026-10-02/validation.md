# Credential Rename Apply Receipt — 2026-10-02

Applied: `2026-10-02T12:40:36Z`

**1 renames + 1 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `Microsoft Certified: Azure AI Fundamentals (AI-900)` | → | `Microsoft Certified: Azure AI Fundamentals` |

## Confirmed merges applied (records folded into the existing key)

| Old unified_title | ⇒ folded into |
|---|---|
| `AWS Certified SysOps Administrator` | ⇒ `AWS CloudOps Engineer - Associate` |

## Per-file results

### `credentials.json`

- **before_count**: 1987
- **after_count**: 1987
- **rekeyed**: 1
- **already_applied**: 0
- **not_found**: 0

### `credentials.json (merge fold)`

- **before_count**: 1987
- **after_count**: 1986
- **keys_folded**: 1
- **already_applied**: 0
- **records_moved**: 0
- **records_deduped**: 1

### `unified_titles.json`

- **before_count**: 3813
- **rewrites**: 2
- **untouched**: 3811

### `coci_articulations.json`

- **articulation_records**: 4592
- **rewrites**: 3
- **pre_counts_old**: `{"Microsoft Certified: Azure AI Fundamentals (AI-900)": 1, "AWS Certified SysOps Administrator": 2}`
- **post_counts_new**: `{"Microsoft Certified: Azure AI Fundamentals": 1, "AWS CloudOps Engineer - Associate": 5}`

## Rollback

To revert RENAMES, swap `old` and `new` in the frozen alias_map.json at this path and re-run `kb/_cred_rename_apply.py`. The supersede-don't-mutate ADR preserves the round-trip. MERGES are not swap-reversible (records fold + dedupe): revert them from git history using this receipt's merge list as the map.

