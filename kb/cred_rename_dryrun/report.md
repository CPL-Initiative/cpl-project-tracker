# Credential Rename Dry-Run — 2026-11-12

Generated: `2026-11-12T00:15:14Z`

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

| Old unified_title | ⇒ folds into | Records folding | Already on target | raw_titles | articulations |
|---|---|---:|---:|---:|---:|
| `ASE Master Automobile Technician (A1–A8 + L1)` | ⇒ `ASE Master Automobile Technician` | 1 | 1 | 1 | 7 |
| `ASE Bundle — A2, A3, A6` | ⇒ `ASE Certificate Bundles: A2 + A3 + A6` | 1 | 1 | 1 | 2 |
| `Automotive Technology (ASE A7 Heating and Air Conditioning)` | ⇒ `Heating and Air Conditioning (ASE A7 standards)` | 1 | 1 | 2 | 0 |
| `Heating and Air Conditioning` | ⇒ `Heating and Air Conditioning (ASE A7 standards)` | 2 | 1 | 1 | 0 |
| `Automotive Technology (ASE A5 Brakes)` | ⇒ `Brakes (ASE A5 standards)` | 1 | 1 | 7 | 2 |
| `Engine Performance (ASE A8 Engine Performance)` | ⇒ `Engine Performance (ASE A8 standards)` | 1 | 1 | 1 | 0 |
| `Engine Performance 1 (ASE A8 Engine Performance)` | ⇒ `Engine Performance (ASE A8 standards)` | 1 | 1 | 1 | 0 |

## Held: folds into a family title

- `ASE Bundle — A6 or T6 + L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE C1 or G1 — Service Consultant or Auto Maintenance and Light Repair` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Certification (any A1–A8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Automobile Technician (A1–A8) or L3` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `ASE Master Medium/Heavy Truck Technician (T1–T8)` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags
- `Advanced Electrical and Electronic Systems` (merge) into `ASE Certificate Bundles`: held: the target is a family title; these rows become family tags

## Ruled on a decision sheet (kb/cred_rename_plans/)

- `ASE Bundle — A1, A6, A8, L1` (rename) into `ASE Certificate Bundles: A1 + A6 + A8 + L1`, plan sheet181-2026-11-12
- `ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)` (rename) into `ASE Certificate Bundles: A2 + A3`, plan sheet181-2026-11-12
- `ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical` (rename) into `ASE Certificate Bundles: A2 + A3 + A6`, plan sheet181-2026-11-12
- `ASE Bundle — A2, A3, A6` (merge) into `ASE Certificate Bundles: A2 + A3 + A6`, plan sheet181-2026-11-12
- `ASE Bundle — A4, A5` (rename) into `ASE Certificate Bundles: A4 + A5`, plan sheet181-2026-11-12
- `ASE Bundle — A4, A5, A6` (rename) into `ASE Certificate Bundles: A4 + A5 + A6`, plan sheet181-2026-11-12
- `ASE Bundle — A6, A8, L1` (rename) into `ASE Certificate Bundles: A6 + A8 + L1`, plan sheet181-2026-11-12
- `ASE A8 + L1 — Engine Performance and Advanced Engine Performance` (rename) into `ASE Certificate Bundles: A8 + L1`, plan sheet181-2026-11-12
- `ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced` (rename) into `ASE Certificate Bundles: A9 + L2`, plan sheet181-2026-11-12
- `ASE G1 + ALI Lift It Right Bundle` (rename) into `ASE Certificate Bundles: G1 with ALI Lift It Right`, plan sheet181-2026-11-12
- `ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis` (rename) into `ASE Certificate Bundles: L1 + L2`, plan sheet181-2026-11-12
- `ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD` (rename) into `ASE Certificate Bundles: L2 + T6 with Cummins ISX + SP/2 HD`, plan sheet181-2026-11-12
- `ASE Bundle — L2, T8, SP/2 HD` (rename) into `ASE Certificate Bundles: L2 + T8 with SP/2 HD`, plan sheet181-2026-11-12
- `ASE Bundle — T2, T5, T7, T8 + MACS/609` (rename) into `ASE Certificate Bundles: T2 + T5 + T7 + T8 with MACS/609`, plan sheet181-2026-11-12
- `ASE Bundle — T2, T6, T8 + Snap-on 604` (rename) into `ASE Certificate Bundles: T2 + T6 + T8 with Snap-on 604`, plan sheet181-2026-11-12
- `ASE Bundle — T2, T8` (rename) into `ASE Certificate Bundles: T2 + T8`, plan sheet181-2026-11-12
- `ASE Bundle — T3, T4, T5, T8` (rename) into `ASE Certificate Bundles: T3 + T4 + T5 + T8`, plan sheet181-2026-11-12
- `ASE Bundle — T3, T8, SP/2 HD` (rename) into `ASE Certificate Bundles: T3 + T8 with SP/2 HD`, plan sheet181-2026-11-12
- `ASE Bundle — T4, T8, SP/2 HD` (rename) into `ASE Certificate Bundles: T4 + T8 with SP/2 HD`, plan sheet181-2026-11-12
- `ASE Bundle — T5, T8` (rename) into `ASE Certificate Bundles: T5 + T8`, plan sheet181-2026-11-12
- `ASE Bundle — T5, T8, SP/2 HD` (rename) into `ASE Certificate Bundles: T5 + T8 with SP/2 HD`, plan sheet181-2026-11-12
- `ASE Bundle — T6, T8 + Snap-on 604` (rename) into `ASE Certificate Bundles: T6 + T8 with Snap-on 604`, plan sheet181-2026-11-12
- `ASE Bundle — T7, T8 + MACS/609` (rename) into `ASE Certificate Bundles: T7 + T8 with MACS/609`, plan sheet181-2026-11-12
- `ASE Master Automobile Technician (A1–A8 + L1)` (merge) into `ASE Master Automobile Technician`, plan sheet181-2026-11-12

## Issuer of each folded title (preview, kb/fold_issuer.py)

Rule 1, reviewer: a person's explicit issuer in the group wins (newest on a disagreement). Rule 2, cert form: the target's issuer stays and a folded college record is dropped. Rule 3, additive.

- `ASE Certificate Bundles: A2 + A3 + A6` (rule 3, additive)
- `ASE Master Automobile Technician` (rule 3, additive)
- `Brakes (ASE A5 standards)` (rule 2b, taught to the standard)
  - EXCEPTION for a person (rule 2b, taught to the standard): 3 industry-certification exhibit(s) under `Automotive Braking Systems`, `Automotive Technology (ASE A5 Brakes)`; issuer California Community Colleges
- `Engine Performance (ASE A8 standards)` (rule 2b, taught to the standard)
  - EXCEPTION for a person (rule 2b, taught to the standard): 1 industry-certification exhibit(s) under `Engine Performance 1 (ASE A8 Engine Performance)`; issuer California Community Colleges
- `Heating and Air Conditioning (ASE A7 standards)` (rule 2b, taught to the standard)
  - an older person-set issuer read as an ordinary record: National Institute for Automotive Service Excellence (ASE) on `Automotive Air Conditioner` (slee@cccco.edu, time unknown)
  - an older person-set issuer read as an ordinary record: California Community College Chancellor's Office on `Heating and Air Conditioning` (slee@cccco.edu, time unknown)
  - EXCEPTION for a person (rule 2b, taught to the standard): 2 industry-certification exhibit(s) under `Automotive Air Conditioner`, `Heating and Air Conditioning`; issuer California Community Colleges

## Clean renames (would land on apply)

| Old unified_title | → | New unified_title | raw_titles | articulations | credentials.json |
|---|---|---|---:|---:|---|
| `ASE A2 + A3 + A6 — Transmission, Drive Train, and Electrical` | → | `ASE Certificate Bundles: A2 + A3 + A6` | 1 | 1 | ✓ |
| `ASE A2+A3 — Automatic Transmission and Manual Drive Train (combined)` | → | `ASE Certificate Bundles: A2 + A3` | 2 | 2 | ✓ |
| `ASE A8 + L1 — Engine Performance and Advanced Engine Performance` | → | `ASE Certificate Bundles: A8 + L1` | 1 | 1 | ✓ |
| `ASE A9 + L2 — Light Vehicle Diesel and Medium/Heavy Diesel Advanced` | → | `ASE Certificate Bundles: A9 + L2` | 1 | 1 | ✓ |
| `ASE Bundle — A1, A6, A8, L1` | → | `ASE Certificate Bundles: A1 + A6 + A8 + L1` | 1 | 2 | ✓ |
| `ASE Bundle — A4, A5` | → | `ASE Certificate Bundles: A4 + A5` | 1 | 0 | ✓ |
| `ASE Bundle — A4, A5, A6` | → | `ASE Certificate Bundles: A4 + A5 + A6` | 1 | 2 | ✓ |
| `ASE Bundle — A6, A8, L1` | → | `ASE Certificate Bundles: A6 + A8 + L1` | 1 | 2 | ✓ |
| `ASE Bundle — L2, T8, SP/2 HD` | → | `ASE Certificate Bundles: L2 + T8 with SP/2 HD` | 1 | 3 | ✓ |
| `ASE Bundle — T2, T5, T7, T8 + MACS/609` | → | `ASE Certificate Bundles: T2 + T5 + T7 + T8 with MACS/609` | 1 | 2 | ✓ |
| `ASE Bundle — T2, T6, T8 + Snap-on 604` | → | `ASE Certificate Bundles: T2 + T6 + T8 with Snap-on 604` | 1 | 2 | ✓ |
| `ASE Bundle — T2, T8` | → | `ASE Certificate Bundles: T2 + T8` | 1 | 4 | ✓ |
| `ASE Bundle — T3, T4, T5, T8` | → | `ASE Certificate Bundles: T3 + T4 + T5 + T8` | 1 | 2 | ✓ |
| `ASE Bundle — T3, T8, SP/2 HD` | → | `ASE Certificate Bundles: T3 + T8 with SP/2 HD` | 1 | 2 | ✓ |
| `ASE Bundle — T4, T8, SP/2 HD` | → | `ASE Certificate Bundles: T4 + T8 with SP/2 HD` | 1 | 2 | ✓ |
| `ASE Bundle — T5, T8` | → | `ASE Certificate Bundles: T5 + T8` | 1 | 3 | ✓ |
| `ASE Bundle — T5, T8, SP/2 HD` | → | `ASE Certificate Bundles: T5 + T8 with SP/2 HD` | 1 | 2 | ✓ |
| `ASE Bundle — T6, L2 + Cummins ISX + SP/2 HD` | → | `ASE Certificate Bundles: L2 + T6 with Cummins ISX + SP/2 HD` | 1 | 2 | ✓ |
| `ASE Bundle — T6, T8 + Snap-on 604` | → | `ASE Certificate Bundles: T6 + T8 with Snap-on 604` | 1 | 2 | ✓ |
| `ASE Bundle — T7, T8 + MACS/609` | → | `ASE Certificate Bundles: T7 + T8 with MACS/609` | 1 | 2 | ✓ |
| `ASE G1 + ALI Lift It Right Bundle` | → | `ASE Certificate Bundles: G1 with ALI Lift It Right` | 1 | 1 | ✓ |
| `ASE L1 + L2 — Advanced Engine Performance and Electronic Diesel Engine Diagnosis` | → | `ASE Certificate Bundles: L1 + L2` | 1 | 1 | ✓ |
| `Automotive Air Conditioner` | → | `Heating and Air Conditioning (ASE A7 standards)` | 1 | 1 | ✓ |
| `Automotive Braking Systems` | → | `Brakes (ASE A5 standards)` | 2 | 0 | ✓ |
| `Automotive Electrical/Electronics 1 (ASE A6 Electrical/Electronic Systems)` | → | `Electrical/Electronic Systems 1 (ASE A6 standards)` | 1 | 0 | ✓ |
| `Automotive Electrical/Electronics 2 (ASE A6 Electrical/Electronic Systems)` | → | `Electrical/Electronic Systems 2 (ASE A6 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE A2 Automatic Transmission/Transaxle)` | → | `Automatic Transmission/Transaxle (ASE A2 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE A6 Electrical/Electronic Systems)` | → | `Electrical/Electronic Systems (ASE A6 standards)` | 3 | 0 | ✓ |
| `Automotive Technology (ASE A8 Engine Performance)` | → | `Engine Performance (ASE A8 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE A9 Light Vehicle Diesel Engines)` | → | `Light Vehicle Diesel Engines (ASE A9 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE L1 Advanced Engine Performance Specialist)` | → | `Advanced Engine Performance Specialist (ASE L1 standards)` | 1 | 0 | ✓ |
| `Automotive Technology (ASE L3 Light Duty Hybrid/Electric Vehicle Specialist)` | → | `Light Duty Hybrid/Electric Vehicle Specialist (ASE L3 standards)` | 1 | 0 | ✓ |
| `Engine Performance 2 (ASE A8 Engine Performance)` | → | `Engine Performance 2 (ASE A8 standards)` | 1 | 0 | ✓ |
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
