---
title: UC-CUR → Z-scheme Re-mint — DRY-RUN
date: 2026-06-15
session: 56 (data lane)
status: DRY-RUN — no kb files mutated, no Supabase writes; awaiting Sam's sign-off
tags: [remint, dry-run, uc-cur, z-scheme, identity, rule-7]
artifacts:
  - kb/uc_cur_zscheme_out/2026-06-15/alias_map.json
  - kb/uc_cur_zscheme_out/2026-06-15/zseq_seed.json
  - kb/uc_cur_zscheme_out/2026-06-15/collisions.json
  - kb/uc_cur_zscheme_out/2026-06-15/supabase_ops.sql
related:
  - docs/uc_cur_zscheme_remint_scope.md
  - docs/coursecontrolnumber_remint.md
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md
---

# UC-CUR → Z-scheme Re-mint — DRY-RUN

## TL;DR

- **4053** synthetic `UC-CUR-*` targets → **4053** new `SUBJ Z<band><seq:03d>` ids (e.g. `BIOL Z9001`).
- Re-key surface (entirely inside `kb_curation` / `kb/coci_curation.json`): **4053** self-keyed `unified_title` rows (course_id rewrite) + **10682** `merge_into` pointers (value rewrite).
- Downstream (NOT touched): `coci_articulations.json` UC-CUR refs = **0**, `promotions.json` = **0** → confirmed 0, no articulation/promotion re-key.
- **226** distinct (SUBJ4, band) cohorts · bands: credit (1) **3584**, noncredit (9) **469** (0 mixed — band purity holds).
- Max cohort size **199** → `seq:03d` (cap 999) has comfortable headroom; **0** overflow.
- Validation: **7/7** gates pass.

## Apply gate

**✅ MECHANICALLY READY** — all validation gates pass, no collisions, no overflow. **Awaiting Sam's sign-off** before any apply (Rule 7).

## Validation

- ✅ **all_new_subj4_are_4letter**
- ✅ **new_ids_unique**
- ✅ **new_ids_disjoint_from_existing**
- ✅ **all_targets_aliased**
- ✅ **band_purity**
- ✅ **no_seq_overflow**
- ✅ **alias_invertible**

## SUBJ4 derivation

Each target's SUBJ4 follows the **new-mint convention** (`_seed_coci_minted_mids.py` → `discipline_canonical_subj4.json`): the canonical SUBJ4 of the members' **modal discipline** — except umbrella disciplines (Foreign Languages / Kinesiology), which keep the members' own split code (FLSP/FLFR/…/KINE/ATHL) rather than collapse to FLNG/KINE.

| source | targets | meaning |
|---|---:|---|
| `canonical_discipline` | 3649 | canonical SUBJ4 of members' modal discipline |
| `umbrella_member_s4` | 387 | umbrella discipline → modal 4-letter member subject (split preserved) |
| `member_s4` | 13 | blank/out-of-map discipline → modal 4-letter member subject |
| `padded_fallback` | 4 | no member carries a 4-letter subject → modal subject padded with X |

**Padded-fallback targets (4)** — the genuinely un-disciplined short-code tail; SUBJ4 is honest-but-ugly, best refined by curation later:

- `UC-CUR-AUTO0BD432AB` → `AFXX Z1001` · Evolution of the U.S. Air Force Air and Space Power (members: AF M10AA, AF M10AB)
- `UC-CUR-AUTO0C04D40B` → `ATXX Z1001` · Introduction Flight Attendant Training (members: AT M10DL, AT M10DZ)
- `UC-CUR-AUTO165DEA93` → `ATXX Z1002` · Introduction to Travel Careers (members: AT M10AO, ATC M10BR)
- `UC-CUR-AUTO57FFEB19` → `DBAX Z1001` · Beginning Radio Station Operations (members: DBA M10AC, DBA M10AE)

## (SUBJ4, band) cohort sizes

| bucket size | # cohorts |
|---|---:|
| 1 | 39 |
| 2-5 | 60 |
| 6-20 | 73 |
| 21-99 | 48 |
| 100+ | 6 |

Largest cohorts:

| (SUBJ4, band) | targets | example Z-id |
|---|---:|---|
| `KINE` band `1` | 199 | `KINE Z1001` |
| `ARTS` band `1` | 155 | `ARTS Z1001` |
| `CSIS` band `1` | 152 | `CSIS Z1001` |
| `DANC` band `1` | 119 | `DANC Z1001` |
| `CRIM` band `1` | 105 | `CRIM Z1001` |
| `AUTO` band `1` | 101 | `AUTO Z1001` |
| `MUSI` band `1` | 99 | `MUSI Z1001` |
| `NRSR` band `1` | 95 | `NRSR Z1001` |
| `ATHL` band `1` | 88 | `ATHL Z1001` |
| `FIRE` band `1` | 88 | `FIRE Z1001` |
| `BUSI` band `1` | 82 | `BUSI Z1001` |
| `THEA` band `1` | 80 | `THEA Z1001` |

## Persisted-counter decision — option B (recommended, adopted)

Today `UC-CUR-AUTO` ids are content-addressed (`md5(sig)`), stable without a counter. The Z-scheme's banded `<seq:03d>` needs a **persisted per-(SUBJ4, band) counter** or the next auto-merge / mint would renumber the cohort each run. **Adopted: option B** (matches MID number format):

- The apply drops `zseq_seed.json` in as **`kb/uc_cur_zseq.json`** (per-(SUBJ4, band) high-water seq). Server-side allocators (`kb/_auto_merge_worklist.py` apply; the generator promote-step) read+increment it → new mints get `seq+1`, **existing ids never move**.
- Client-side `doConsolidate` (browser, no counter access) keeps minting a **transient** `UC-CUR-EXT<ts>` placeholder; the next daily generator promotes any surviving `UC-CUR-*` placeholder to a clean `SUBJ Z<band><seq:03d>` via the counter and re-keys its pointers — so a curator's merge persists and the surrogate key tidies overnight.
- The **shared recognition helper** therefore matches BOTH `^[A-Z]{2,4} Z\d` (settled) and `^UC-CUR-` (transient/legacy).

## Code touch points (apply phase — one shared recognition helper)

This dry-run changes NO code. On apply, add ONE shared `is_synthetic_unified(id)` / regex used by every site below (avoids drift):

| file | sites |
|---|---|
| `unified_courses.js` | `/^UC-CUR-/` recognition (~908); UC-CUR mint (~992) + UC-CUR-EXT mint (~1125) → transient placeholder (kept) + Z recognition; the #436 override regex; `cluster_id_off_scheme` / `uc_cur_ripe_for_promotion` tags |
| `excel_to_dashboard.py` | `_target_identity()` (~6715) UC-CUR/Z recognition; the generator **promote-step** (placeholder → Z via `kb/uc_cur_zseq.json`) |
| `kb/_row_audit.py` | UC-CUR recognition (~265, 1095, 1173) — Z is **ON-scheme**, so `cluster_id_off_scheme` must NOT fire on Z; re-tune to flag only non-Z synthetic |
| `kb/_auto_merge_worklist.py` | mint (~199) → Z-format via the persisted counter |

## Sample re-keys (every 250th, title-sorted within cohort)

- `UC-CUR-AUTO8443D534` → **`AERO Z1001`** · AS200 Leadership Laboratory C · disc: — · 2 members (member_s4)
- `UC-CUR-AUTO53D25521` → **`ARTS Z1083`** · Ceramics-Potter's Wheel: Beginning · disc: Art · 2 members (canonical_discipline)
- `UC-CUR-AUTO15F0320B` → **`AUTO Z1029`** · Wheel Alignment and Suspension · disc: Automotive Technology · 2 members (canonical_discipline)
- `UC-CUR-AUTO0E721E6C` → **`BUSI Z1007`** · Theory of Machine Shorthand 2 · disc: Business · 2 members (canonical_discipline)
- `UC-CUR-AUTOD39C618A` → **`COSM Z1032`** · Fundamentals of Cosmetology Clinic A · disc: Cosmetology · 2 members (canonical_discipline)
- `UC-CUR-AUTO27DABC38` → **`CSIS Z1079`** · MCSA SQL: Microsoft Business Intelligence Development · disc: Computer Information Systems · 5 members (canonical_discipline)
- `UC-CUR-AUTO7841B6BF` → **`DANC Z1067`** · Follower's Technique for Argentine Tango · disc: Dance · 3 members (canonical_discipline)
- `UC-CUR-AUTOF667E22F` → **`EDUC Z9013`** · Annual Ocean Lifeguard Recertification/Inservice - Professional · disc: Education · 2 members (canonical_discipline)
- `UC-CUR-AUTO57ACAF28` → **`ESOL Z9007`** · ESL Vocabulary and Pronunciation 2 · disc: English as a Second Language · 2 members (canonical_discipline)
- `UC-CUR-AUTOE46C5960` → **`FIRE Z1049`** · Fire Technology in-Service Update - 54 Hour Class · disc: Fire Technology · 2 members (canonical_discipline)
- `UC-CUR-AUTO4FC8025B` → **`HIST Z1048`** · Military History of the United States · disc: History · 2 members (canonical_discipline)
- `UC-CUR-AUTO585DABBF` → **`IDST Z1033`** · Increasing Your Workforce Potential · disc: Interdisciplinary Studies · 2 members (canonical_discipline)
- `UC-CUR-AUTOB61DCA3D` → **`KINE Z1128`** · Shape Up-Circuit Training · disc: Kinesiology · 2 members (umbrella_member_s4)
- `UC-CUR-AUTO6643F190` → **`MULT Z1016`** · 3DS Max Advanced Modeling and Materials · disc: Multimedia · 2 members (canonical_discipline)
- `UC-CUR-AUTO5EF72D59` → **`NRSV Z1008`** · Meeting Complex Adult Health Needs · disc: Licensed Vocational Nursing · 2 members (canonical_discipline)
- `UC-CUR-AUTO9BB12974` → **`REAL Z1003`** · Advanced Residential Appraisal · disc: Real Estate · 2 members (canonical_discipline)
- `UC-CUR-AUTO9683E99C` → **`WELD Z1017`** · Basic Pipe Welding - Gas Metal Arc Welding and Flux Cored Arc Weldin · disc: Welding · 2 members (canonical_discipline)

## Apply procedure (NOT this session — after Sam's sign-off)

1. Build `kb/_uc_cur_zscheme_apply.py` importing `compute_plan` from this dry-run.
2. **Fresh-read** `kb_curation` from Supabase at write-time; re-run `compute_plan` against fresh state (aliases anything new; abort on a class we said we'd halt on).
3. Re-key in ONE cron window (before 10:17 UTC): the self-keyed `unified_title` rows' `course_id` + the `merge_into` pointers' `value`, in BOTH `kb/coci_curation.json` and live Supabase `kb_curation`; stamp each re-keyed row with `_zscheme_from` (per-row provenance, immune to future slot reuse).
4. Write `kb/uc_cur_zseq.json` from `zseq_seed.json`.
5. Ship the code recognition/mint changes in the SAME window (one shared helper).
6. **Restamp** this receipt's `_status` to APPLIED (methodology-alias-map rule 6).
7. V5-validate the live overlay against the alias map + per-row stamps; rollback = read `alias_map.json` right-to-left.
