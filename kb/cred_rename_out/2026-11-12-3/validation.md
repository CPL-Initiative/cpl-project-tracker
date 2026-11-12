# Credential Rename Apply Receipt — 2026-11-12

Applied: `2026-11-12T05:48:00Z`

**7 renames + 0 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `Automotive Technology (ASE A2 Automatic Transmission/Transaxle)` | → | `Automatic Transmission/Transaxle (ASE A2 standards)` |
| `Automotive Technology (ASE A6 Electrical/Electronic Systems)` | → | `Electrical/Electronic Systems (ASE A6 standards)` |
| `Automotive Technology (ASE A9 Light Vehicle Diesel Engines)` | → | `Light Vehicle Diesel Engines (ASE A9 standards)` |
| `Automotive Technology (ASE L1 Advanced Engine Performance Specialist)` | → | `Advanced Engine Performance Specialist (ASE L1 standards)` |
| `Automotive Technology (ASE L3 Light Duty Hybrid/Electric Vehicle Specialist)` | → | `Light Duty Hybrid/Electric Vehicle Specialist (ASE L3 standards)` |
| `Manual Drive Train and Axles (ASE A3 Manual Drive Train and Axles)` | → | `Manual Drive Train and Axles (ASE A3 standards)` |
| `Suspension and Steering (ASE A4 Suspension and Steering)` | → | `Suspension and Steering (ASE A4 standards)` |

## Confirmed merges applied (records folded into the existing key)

_None._

## Held: folds into a family title (never folded)

- `ASE Bundle — A6 or T6 + L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Certification (any A1–A8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician (A1–A8) or L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Medium/Heavy Truck Technician (T1–T8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags

## Issuer of each folded title (kb/fold_issuer.py)

_No folds._

## Per-file results

### `credentials.json`

- **before_count**: 2742
- **after_count**: 2742
- **rekeyed**: 7
- **already_applied**: 0
- **not_found**: 0

### `unified_titles.json`

- **before_count**: 5716
- **rewrites**: 11
- **untouched**: 5705

### `coci_articulations.json`

- **articulation_records**: 4591
- **rewrites**: 2
- **pre_counts_old**: `{"Suspension and Steering (ASE A4 Suspension and Steering)": 2}`
- **post_counts_new**: `{"Suspension and Steering (ASE A4 standards)": 2}`

## Rollback

`python3 kb/_cred_rename_undo.py <this folder>` puts back every value this apply changed, renames and merges alike, from `undo.json` beside this receipt; it refuses a value changed since, unless `--force`, which skips each drifted fold group whole. `--supabase-plan` writes the kb_curation reversal from every `supabase_log*.json` as guarded SQL for a person to run under Rule 10.

