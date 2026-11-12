# Credential Rename Dry-Run — 2026-11-12

Generated: `2026-11-12T05:22:11Z`

**Mode B preview** — projects `unified_title_override` curator entries from `kb/credential_review_overlay.json` onto the post-rename state of the three credential-identity files (`unified_titles.json`, `credentials.json`, `coci_articulations.json`). Reports collisions + downstream impact. **Does NOT apply.** Apply is Cred-Ref PR-5b/1, manual workflow_dispatch.

## Apply gates

| Gate | Description | Status |
|---|---|---|
| V1 | No two renames target the same new name | PASS ✓ |
| V2 | Every source unified_title exists somewhere | PASS ✓ |
| V3 | No CLEAN rename target collides with an existing credentials.json key | PASS ✓ |
| — | Queued collisions (non-blocking — wait for a curator decision) | 0 |
| **Apply safe** | V1–V3 pass + at least one clean rename or confirmed merge (queued collisions don't block) | **YES — PR-5b/1 can dispatch** |

## Confirmed merges (would FOLD on apply — PR-5b/2)

_None._ A queued collision becomes a confirmed merge when the curator clicks **✓ Confirm merge** in the CER triage lane (writes `unified_title_merge_confirm` naming the exact target).

## Held: folds into a family title

- `ASE Bundle — A6 or T6 + L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Certification (any A1–A8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician (A1–A8) or L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Medium/Heavy Truck Technician (T1–T8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags

## Held: saved folds on a title that holds no exhibit

- `ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)` (rename) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE A8 + L1 — Engine Performance and Advanced Engine Performance` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A1, A6, A8, L1` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A2, A3, A6` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A4, A5` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A4, A5, A6` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — A6, A8, L1` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — L2, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T2, T5, T7, T8 + MACS/609` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T2, T6, T8 + Snap-on 604` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T2, T8` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T3, T4, T5, T8` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T3, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T4, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T5, T8` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T5, T8, SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T6, T8 + Snap-on 604` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Bundle — T7, T8 + MACS/609` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE G1 + ALI Lift It Right Bundle` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `ASE Master Automobile Technician (A1–A8 + L1)` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Advanced Electrical and Electronic Systems` (merge) into `ASE Certificate Bundles`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Air Conditioner` (rename) into `Heating and Air Conditioning (ASE A7 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Braking Systems` (rename) into `Brakes (ASE A5 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)` (rename) into `Electrical/Electronic Systems 1 (ASE A6 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)` (rename) into `Electrical/Electronic Systems 2 (ASE A6 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Engine Performance 1 (ASE A8 Engine Performance)` (merge) into `Engine Performance (ASE A8 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Engine Performance 2 (ASE A8 Engine Performance)` (rename) into `Engine Performance 2 (ASE A8 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing
- `Heating and Air Conditioning` (merge) into `Heating and Air Conditioning (ASE A7 standards)`: held: the title holds no exhibit, so its saved rows stay in place and do nothing

## Issuer of each folded title (preview, kb/fold_issuer.py)

_No folds._

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `Automotive Technology (ASE A2 Automatic Transmission/Transaxle)` | → | `Automatic Transmission/Transaxle (ASE A2 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE A6 Electrical/Electronic Systems)` | → | `Electrical/Electronic Systems (ASE A6 standards)` | 3 | 0 | ✓ |
| `Automotive Technology (ASE A9 Light Vehicle Diesel Engines)` | → | `Light Vehicle Diesel Engines (ASE A9 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE L1 Advanced Engine Performance Specialist)` | → | `Advanced Engine Performance Specialist (ASE L1 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE L3 Light Duty Hybrid/Electric Vehicle Specialist)` | → | `Light Duty Hybrid/Electric Vehicle Specialist (ASE L3 standards)` | 1 | 0 | ✓ |
| `Manual Drive Train and Axles (ASE A3 Manual Drive Train and Axles)` | → | `Manual Drive Train and Axles (ASE A3 standards)` | 1 | 0 | ✓ |
| `Suspension and Steering (ASE A4 Suspension and Steering)` | → | `Suspension and Steering (ASE A4 standards)` | 3 | 2 | ✓ |

## Collisions (queued, non-blocking — curator decision required)

_None._

## Skipped

_None._

---

**See also:**

- `docs/exhibit_canonicalization_lessons.md` — Cred-Ref PR-5b scoping notes
- `docs/kb-notes/adr-supersede-dont-mutate-synthetic-layer.md` — why raw college-authored titles stay immutable when the synthetic layer renames
- `docs/coursecontrolnumber_remint.md` — the re-mint playbook this dry-run follows the discipline of
