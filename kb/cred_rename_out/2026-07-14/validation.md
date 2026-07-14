# Credential Rename Apply Receipt — 2026-07-14

Applied: `2026-07-14T19:32:36Z`

**2 renames + 6 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `Automative Fuel Systems` | → | `Automotive Fuel Systems` |
| `Automative Wheel Alignment` | → | `Automotive Wheel Alignment` |

## Confirmed merges applied (records folded into the existing key)

| Old unified_title | ⇒ folded into |
|---|---|
| `Automative Automatic Transmissions` | ⇒ `ASE A2 — Automatic Transmission/Transaxle` |
| `Automative Brake System` | ⇒ `ASE A5 — Brakes` |
| `Automative Electrical Systems` | ⇒ `ASE A6 — Electrical/Electronic Systems` |
| `Automative Engine Repair` | ⇒ `ASE A1 — Engine Repair` |
| `Automative Manual Transmission` | ⇒ `ASE A3 — Manual Drive Train and Axles` |
| `Automotive Light Diesel Engines` | ⇒ `ASE A9 — Light Vehicle Diesel Engines` |

## Per-file results

### `credentials.json`

- **before_count**: 1993
- **after_count**: 1993
- **rekeyed**: 2
- **already_applied**: 0
- **not_found**: 0

### `credentials.json (merge fold)`

- **before_count**: 1993
- **after_count**: 1987
- **keys_folded**: 6
- **already_applied**: 0
- **records_moved**: 0
- **records_deduped**: 6

### `unified_titles.json`

- **before_count**: 3813
- **rewrites**: 8
- **untouched**: 3805

### `coci_articulations.json`

- **articulation_records**: 4592
- **rewrites**: 8
- **pre_counts_old**: `{"Automative Brake System": 1, "Automative Electrical Systems": 1, "Automative Engine Repair": 1, "Automotive Light Diesel Engines": 1, "Automative Automatic Transmissions": 1, "Automative Fuel Systems": 1, "Automative Manual Transmission": 1, "Automative Wheel Alignment": 1}`
- **post_counts_new**: `{"ASE A6 — Electrical/Electronic Systems": 30, "ASE A2 — Automatic Transmission/Transaxle": 20, "ASE A1 — Engine Repair": 26, "ASE A3 — Manual Drive Train and Axles": 23, "ASE A5 — Brakes": 24, "ASE A9 — Light Vehicle Diesel Engines": 10, "Automotive Fuel Systems": 1, "Automotive Wheel Alignment": 1}`

## Rollback

To revert RENAMES, swap `old` and `new` in the frozen alias_map.json at this path and re-run `kb/_cred_rename_apply.py`. The supersede-don't-mutate ADR preserves the round-trip. MERGES are not swap-reversible (records fold + dedupe): revert them from git history using this receipt's merge list as the map.

