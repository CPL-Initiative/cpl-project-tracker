# Credential Rename Apply Receipt — 2026-07-09

Applied: `2026-07-09T23:26:09Z`

**8 renames + 3 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `Carpenters Apprenticeship — CARP 002` | → | `Introduction to Apprenticeship II` |
| `Carpenters Apprenticeship — CARP 101` | → | `Introduction to Apprenticeship I` |
| `Carpenters Apprenticeship — CARP 109` | → | `Welding II` |
| `Carpenters Training Committee for Northern California (CTCNC) — OSHA Training` | → | `OSHA 10-hour Construction Training Course` |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 1203` | → | `Tool and Equipment Applications` |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 284` | → | `Welding II SMAW` |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 701` | → | `Introduction to Acoustical Apprenticeship II` |
| `Carpenters Training Committee for Northern California Apprenticeship — FA/C` | → | `CPR for Carpenters Apprentices` |

## Confirmed merges applied (records folded into the existing key)

| Old unified_title | ⇒ folded into |
|---|---|
| `Carpenters Apprenticeship — CARP 019` | ⇒ `Rigging` |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 312` | ⇒ `Rigging` |
| `Carpenters Training Committee for Northern California Apprenticeship — CARP 608` | ⇒ `Rigging` |

## Per-file results

### `credentials.json`

- **before_count**: 2019
- **after_count**: 2019
- **rekeyed**: 8
- **already_applied**: 0
- **not_found**: 0

### `credentials.json (merge fold)`

- **before_count**: 2019
- **after_count**: 2016
- **keys_folded**: 3
- **already_applied**: 0
- **records_moved**: 1
- **records_deduped**: 2

### `unified_titles.json`

- **before_count**: 3813
- **rewrites**: 11
- **untouched**: 3802

### `coci_articulations.json`

- **articulation_records**: 4592
- **rewrites**: 6
- **pre_counts_old**: `{"Carpenters Training Committee for Northern California Apprenticeship — CARP 1203": 1, "Carpenters Apprenticeship — CARP 019": 1, "Carpenters Training Committee for Northern California Apprenticeship — CARP 312": 1, "Carpenters Training Committee for Northern California Apprenticeship — CARP 608": 1, "Carpenters Training Committee for Northern California Apprenticeship — FA/C": 1, "Carpenters Training Committee for Northern California (CTCNC) — OSHA Training": 1}`
- **post_counts_new**: `{"Tool and Equipment Applications": 1, "Rigging": 4, "CPR for Carpenters Apprentices": 1, "OSHA 10-hour Construction Training Course": 1}`

## Rollback

To revert RENAMES, swap `old` and `new` in the frozen alias_map.json at this path and re-run `kb/_cred_rename_apply.py`. The supersede-don't-mutate ADR preserves the round-trip. MERGES are not swap-reversible (records fold + dedupe): revert them from git history using this receipt's merge list as the map.

