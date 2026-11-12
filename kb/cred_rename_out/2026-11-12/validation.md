# Credential Rename Apply Receipt — 2026-11-12

Applied: `2026-11-12T00:54:43Z`

Issuer resolutions decided at `2026-11-11T23:38:25.224259+00:00` (the latest reviewed_at among the rows read); the runner read them at `2026-11-12T00:54:40Z`. A row saved after decided_at wins over the fold.

**22 renames + 2 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical` | → | `ASE Certificate Bundles: A2 + A3 + A6` |
| `ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)` | → | `ASE Certificate Bundles: A2 + A3` |
| `ASE A8 + L1 — Engine Performance and Advanced Engine Performance` | → | `ASE Certificate Bundles: A8 + L1` |
| `ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced` | → | `ASE Certificate Bundles: A9 + L2` |
| `ASE Bundle — A1, A6, A8, L1` | → | `ASE Certificate Bundles: A1 + A6 + A8 + L1` |
| `ASE Bundle — A4, A5` | → | `ASE Certificate Bundles: A4 + A5` |
| `ASE Bundle — A4, A5, A6` | → | `ASE Certificate Bundles: A4 + A5 + A6` |
| `ASE Bundle — A6, A8, L1` | → | `ASE Certificate Bundles: A6 + A8 + L1` |
| `ASE Bundle — L2, T8, SP/2 HD` | → | `ASE Certificate Bundles: L2 + T8 with SP/2 HD` |
| `ASE Bundle — T2, T5, T7, T8 + MACS/609` | → | `ASE Certificate Bundles: T2 + T5 + T7 + T8 with MACS/609` |
| `ASE Bundle — T2, T6, T8 + Snap-on 604` | → | `ASE Certificate Bundles: T2 + T6 + T8 with Snap-on 604` |
| `ASE Bundle — T2, T8` | → | `ASE Certificate Bundles: T2 + T8` |
| `ASE Bundle — T3, T4, T5, T8` | → | `ASE Certificate Bundles: T3 + T4 + T5 + T8` |
| `ASE Bundle — T3, T8, SP/2 HD` | → | `ASE Certificate Bundles: T3 + T8 with SP/2 HD` |
| `ASE Bundle — T4, T8, SP/2 HD` | → | `ASE Certificate Bundles: T4 + T8 with SP/2 HD` |
| `ASE Bundle — T5, T8` | → | `ASE Certificate Bundles: T5 + T8` |
| `ASE Bundle — T5, T8, SP/2 HD` | → | `ASE Certificate Bundles: T5 + T8 with SP/2 HD` |
| `ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD` | → | `ASE Certificate Bundles: L2 + T6 with Cummins ISX + SP/2 HD` |
| `ASE Bundle — T6, T8 + Snap-on 604` | → | `ASE Certificate Bundles: T6 + T8 with Snap-on 604` |
| `ASE Bundle — T7, T8 + MACS/609` | → | `ASE Certificate Bundles: T7 + T8 with MACS/609` |
| `ASE G1 + ALI Lift It Right Bundle` | → | `ASE Certificate Bundles: G1 with ALI Lift It Right` |
| `ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis` | → | `ASE Certificate Bundles: L1 + L2` |

## Confirmed merges applied (records folded into the existing key)

| Old unified_title | ⇒ folded into |
|---|---|
| `ASE Bundle — A2, A3, A6` | ⇒ `ASE Certificate Bundles: A2 + A3 + A6` |
| `ASE Master Automobile Technician (A1–A8 + L1)` | ⇒ `ASE Master Automobile Technician` |

## Held: folds into a family title (never folded)

- `ASE Bundle — A6 or T6 + L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Certification (any A1–A8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician (A1–A8) or L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Medium/Heavy Truck Technician (T1–T8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags

## Issuer of each folded title (kb/fold_issuer.py)

- `ASE Certificate Bundles: A2 + A3 + A6` (rule 3, additive)
- `ASE Master Automobile Technician` (rule 3, additive)

## Per-file results

### `credentials.json`

- **before_count**: 2745
- **after_count**: 2745
- **rekeyed**: 22
- **already_applied**: 0
- **not_found**: 0

### `credentials.json (merge fold)`

- **before_count**: 2745
- **after_count**: 2743
- **keys_folded**: 2
- **already_applied**: 0
- **records_moved**: 0
- **records_deduped**: 2
- **issuer_log**: `{"ASE Certificate Bundles: A2 + A3 + A6": {"kept": 1, "moved": 0, "deduped": 1, "dropped": [], "reissued": [], "people": []}, "ASE Master Automobile Technician": {"kept": 1, "moved": 0, "deduped": 1, "dropped": [], "reissued": [], "people": []}}`

### `unified_titles.json`

- **before_count**: 5716
- **rewrites**: 25
- **untouched**: 5691

### `coci_articulations.json`

- **articulation_records**: 4591
- **rewrites**: 50
- **pre_counts_old**: `{"ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)": 2, "ASE G1 + ALI Lift It Right Bundle": 1, "ASE Master Automobile Technician (A1–A8 + L1)": 7, "ASE Bundle — A6, A8, L1": 2, "ASE Bundle — A2, A3, A6": 2, "ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical": 1, "ASE A8 + L1 — Engine Performance and Advanced Engine Performance": 1, "ASE Bundle — A1, A6, A8, L1": 2, "ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced": 1, "ASE Bundle — A4, A5, A6": 2, "ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis": 1, "ASE Bundle — T2, T6, T8 + Snap-on 604": 2, "ASE Bundle — L2, T8, SP/2 HD": 3, "ASE Bundle — T2, T8": 4, "ASE Bundle — T2, T5, T7, T8 + MACS/609": 2, "ASE Bundle — T3, T8, SP/2 HD": 2, "ASE Bundle — T4, T8, SP/2 HD": 2, "ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD": 2, "ASE Bundle — T6, T8 + Snap-on 604": 2, "ASE Bundle — T7, T8 + MACS/609": 2, "ASE Bundle — T5, T8": 3, "ASE Bundle — T5, T8, SP/2 HD": 2, "ASE Bundle — T3, T4, T5, T8": 2}`
- **post_counts_new**: `{"ASE Certificate Bundles: A2 + A3": 2, "ASE Master Automobile Technician": 8, "ASE Certificate Bundles: G1 with ALI Lift It Right": 1, "ASE Certificate Bundles: A6 + A8 + L1": 2, "ASE Certificate Bundles: A2 + A3 + A6": 3, "ASE Certificate Bundles: A8 + L1": 1, "ASE Certificate Bundles: A1 + A6 + A8 + L1": 2, "ASE Certificate Bundles: A9 + L2": 1, "ASE Certificate Bundles: A4 + A5 + A6": 2, "ASE Certificate Bundles: L1 + L2": 1, "ASE Certificate Bundles: T2 + T6 + T8 with Snap-on 604": 2, "ASE Certificate Bundles: L2 + T8 with SP/2 HD": 3, "ASE Certificate Bundles: T2 + T8": 4, "ASE Certificate Bundles: T2 + T5 + T7 + T8 with MACS/609": 2, "ASE Certificate Bundles: T3 + T8 with SP/2 HD": 2, "ASE Certificate Bundles: T4 + T8 with SP/2 HD": 2, "ASE Certificate Bundles: L2 + T6 with Cummins ISX + SP/2 HD": 2, "ASE Certificate Bundles: T6 + T8 with Snap-on 604": 2, "ASE Certificate Bundles: T7 + T8 with MACS/609": 2, "ASE Certificate Bundles: T5 + T8": 3, "ASE Certificate Bundles: T5 + T8 with SP/2 HD": 2, "ASE Certificate Bundles: T3 + T4 + T5 + T8": 2}`

## Rollback

`python3 kb/_cred_rename_undo.py <this folder>` puts back every value this apply changed, renames and merges alike, from `undo.json` beside this receipt; it refuses a value changed since, unless `--force`, which skips each drifted fold group whole. `--supabase-plan` writes the kb_curation reversal from every `supabase_log*.json` as guarded SQL for a person to run under Rule 10.

