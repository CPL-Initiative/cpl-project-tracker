# Credential Rename Apply Receipt — 2026-07-09

Applied: `2026-07-09T19:22:00Z`

**25 renames + 2 confirmed merges applied** across credentials.json + unified_titles.json + coci_articulations.json.

## Renames applied

| Old unified_title | → | New unified_title |
|---|---|---|
| `Basic Photography` | → | `Photography Beginning` |
| `Leadership (High School Articulation)` | → | `Leadership` |
| `Leadership in Agriculture` | → | `Leadership in Agriculture B` |
| `Long Beach City College Auto 603` | → | `Automotive Brake Inspection` |
| `Long Beach City College Auto 611` | → | `Automative Engine Repair` |
| `Long Beach City College Auto 612` | → | `Automative Automatic Transmissions` |
| `Long Beach City College Auto 613` | → | `Automative Manual Transmission` |
| `Long Beach City College Auto 614` | → | `Automative Wheel Alignment` |
| `Long Beach City College Auto 615` | → | `Automative Brake System` |
| `Long Beach City College Auto 616` | → | `Automative Electrical Systems` |
| `Long Beach City College Auto 617` | → | `Automotive Air Conditioner` |
| `Long Beach City College Auto 618` | → | `Automative Fuel Systems` |
| `Long Beach City College Auto 619` | → | `Automotive Light Diesel Engines` |
| `Maternal and Newborn Health Care (Nursing)` | → | `Maternal and Newborn Health Care` |
| `Mathematics (MATH 095)` | → | `Intermediate Algebra` |
| `Medical Assisting Clinical` | → | `Medical Assisting Clinical Procedures` |
| `Medical Assisting Lab Procedures` | → | `Medical Assisting Laboratory Procedures` |
| `Medical Core (High School Articulation) — Canyon High School` | → | `Medical Core` |
| `Mexican Folklorico I` | → | `Mexican Folklorico 1` |
| `Mexican Folklorico II` | → | `Mexican Folklorico 2` |
| `Mexican Folklorico III` | → | `Mexican Folklorico 3` |
| `Mexican Folklorico IV` | → | `Mexican Folklorico 4` |
| `Microsoft Excel I` | → | `Microsoft Excel 1` |
| `Pharmacology (Nursing)` | → | `Pharmacology` |
| `Spanish 2` | → | `Elementary Spanish 2` |

## Confirmed merges applied (records folded into the existing key)

| Old unified_title | ⇒ folded into |
|---|---|
| `Juvenile Justice Procedures` | ⇒ `Juvenile Law and Procedures` |
| `Keyboarding` | ⇒ `Music Keyboards 1` |

## Per-file results

### `credentials.json`

- **before_count**: 2042
- **after_count**: 2042
- **rekeyed**: 25
- **already_applied**: 0
- **not_found**: 0

### `credentials.json (merge fold)`

- **before_count**: 2042
- **after_count**: 2040
- **keys_folded**: 2
- **already_applied**: 0
- **records_moved**: 0
- **records_deduped**: 3

### `unified_titles.json`

- **before_count**: 3813
- **rewrites**: 36
- **untouched**: 3777

### `coci_articulations.json`

- **articulation_records**: 4592
- **rewrites**: 30
- **pre_counts_old**: `{"Leadership in Agriculture": 2, "Juvenile Justice Procedures": 1, "Long Beach City College Auto 617": 1, "Long Beach City College Auto 603": 1, "Long Beach City College Auto 615": 1, "Long Beach City College Auto 616": 1, "Long Beach City College Auto 611": 1, "Long Beach City College Auto 619": 1, "Long Beach City College Auto 612": 1, "Long Beach City College Auto 618": 1, "Long Beach City College Auto 613": 1, "Long Beach City College Auto 614": 1, "Keyboarding": 1, "Leadership (High School Articulation)": 1, "Microsoft Excel I": 1, "Mexican Folklorico II": 1, "Mexican Folklorico III": 1, "Mexican Folklorico IV": 1, "Mexican Folklorico I": 1, "Pharmacology (Nursing)": 1, "Mathematics (MATH 095)": 1, "Medical Assisting Clinical": 1, "Medical Assisting Lab Procedures": 1, "Medical Core (High School Articulation) — Canyon High School": 1, "Maternal and Newborn Health Care (Nursing)": 1, "Basic Photography": 1, "Spanish 2": 3}`
- **post_counts_new**: `{"Leadership in Agriculture B": 2, "Juvenile Law and Procedures": 3, "Automotive Air Conditioner": 1, "Automotive Brake Inspection": 1, "Automative Brake System": 1, "Automative Electrical Systems": 1, "Automative Engine Repair": 1, "Automotive Light Diesel Engines": 1, "Automative Automatic Transmissions": 1, "Automative Fuel Systems": 1, "Automative Manual Transmission": 1, "Automative Wheel Alignment": 1, "Music Keyboards 1": 2, "Leadership": 1, "Microsoft Excel 1": 1, "Mexican Folklorico 2": 1, "Mexican Folklorico 3": 1, "Mexican Folklorico 4": 1, "Mexican Folklorico 1": 1, "Pharmacology": 1, "Intermediate Algebra": 1, "Medical Assisting Clinical Procedures": 1, "Medical Assisting Laboratory Procedures": 1, "Medical Core": 1, "Maternal and Newborn Health Care": 1, "Photography Beginning": 1, "Elementary Spanish 2": 3}`

## Rollback

To revert RENAMES, swap `old` and `new` in the frozen alias_map.json at this path and re-run `kb/_cred_rename_apply.py`. The supersede-don't-mutate ADR preserves the round-trip. MERGES are not swap-reversible (records fold + dedupe): revert them from git history using this receipt's merge list as the map.

