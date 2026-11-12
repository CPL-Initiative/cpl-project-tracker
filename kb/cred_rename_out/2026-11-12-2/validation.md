# Credential Rename Apply Receipt — 2026-11-12

Applied: `2026-11-12T05:14:50Z`

Issuer resolutions decided at `2026-11-12T01:28:50.988025+00:00` (the latest reviewed_at among the rows read); the runner read them at `2026-11-12T05:14:48Z`. A row saved after decided_at wins over the fold.

**3 renames + 1 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `Automotive Technology (ASE A5 Brakes)` | → | `Brakes (ASE A5 standards)` |
| `Automotive Technology (ASE A7 Heating and Air Conditioning)` | → | `Heating and Air Conditioning (ASE A7 standards)` |
| `Automotive Technology (ASE A8 Engine Performance)` | → | `Engine Performance (ASE A8 standards)` |

## Confirmed merges applied (records folded into the existing key)

| Old unified_title | ⇒ folded into |
|---|---|
| `Engine Performance (ASE A8 Engine Performance)` | ⇒ `Engine Performance (ASE A8 standards)` |

## Held: folds into a family title (never folded)

- `ASE Bundle — A6 or T6 + L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Certification (any A1–A8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician (A1–A8) or L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Medium/Heavy Truck Technician (T1–T8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags

## Issuer of each folded title (kb/fold_issuer.py)

- `Engine Performance (ASE A8 standards)` (rule 2b, taught to the standard)

## Per-file results

### `credentials.json`

- **before_count**: 2743
- **after_count**: 2743
- **rekeyed**: 3
- **already_applied**: 0
- **not_found**: 0

### `credentials.json (merge fold)`

- **before_count**: 2743
- **after_count**: 2742
- **keys_folded**: 1
- **already_applied**: 0
- **records_moved**: 0
- **records_deduped**: 1
- **issuer_log**: `{"Engine Performance (ASE A8 standards)": {"kept": 1, "moved": 0, "deduped": 1, "dropped": [], "reissued": [], "people": []}}`

### `unified_titles.json`

- **before_count**: 5716
- **rewrites**: 10
- **untouched**: 5706

### `coci_articulations.json`

- **articulation_records**: 4591
- **rewrites**: 2
- **pre_counts_old**: `{"Automotive Technology (ASE A5 Brakes)": 2}`
- **post_counts_new**: `{"Brakes (ASE A5 standards)": 2}`

## Rollback

`python3 kb/_cred_rename_undo.py <this folder>` puts back every value this apply changed, renames and merges alike, from `undo.json` beside this receipt; it refuses a value changed since, unless `--force`, which skips each drifted fold group whole. `--supabase-plan` writes the kb_curation reversal from every `supabase_log*.json` as guarded SQL for a person to run under Rule 10.

