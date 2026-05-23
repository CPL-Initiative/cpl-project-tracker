---
title: SUBJ4 Canonicalization Dry-Run — Phase 1e
date: 2026-05-23
session: 5b (Bruh Quad)
status: DRY-RUN — no kb files mutated, no Supabase writes
tags: [remint, dry-run, phase-1e, subj4-canonicalization, m-id]
artifacts:
  - kb/subj4_dryrun/alias_map.json
  - kb/subj4_dryrun/collisions.json
  - kb/subj4_dryrun/blocked.json
---

# SUBJ4 Canonicalization Dry-Run — Phase 1e

## TL;DR

- Canonical map: **144 / 144** disciplines reviewed; **0** still need a 4-letter canonical SUBJ4.
- M-IDs total: **72481** (corroborated catalog: 16308, singletons: 56173)
  - **46123** would re-key to new SUBJ4 (minted 10432, singletons 35691)
  - **19188** already on canonical SUBJ4 (no change) (minted 4610, singletons 14578)
  - **0** blocked on missing canonical (minted 0, singletons 0)
  - 7170 skipped (no discipline)
- Sequence-reallocation buckets: **435** new (SUBJ4, band, kind) buckets contain ≥2 old M-IDs.

## Apply gate (5c readiness)

**🟡 NOT READY for apply** — open items:
  - validation failure: `no_seq_overflow`
  - 1 bucket(s) contain ≥2 curated M-IDs — operator decision required

## Curation impact

`coci_curation.json` has **7** entries. Per-entry fate:

| old_id | fate | new_id | discipline | old → new SUBJ4 |
|---|---|---|---|---|
| `AB M1001` | re_key | `AUTB M1002` | Auto Body Technology | AB → AUTB |
| `ABDY M1001` | re_key | `AUTB M1003` | Auto Body Technology | ABDY → AUTB |
| `ABDY M10AA` | re_key | `AUTB M10BN` | Auto Body Technology | ABDY → AUTB |
| `BSIC M9001` | no_change | `BSIC M9001` | Interdisciplinary-Basic Skills: Noncredit 53412 | BSIC → BSIC |
| `EGDT M1001` | re_key | `DRAF M1002` | Drafting/CADD | EGDT → DRAF |
| `ELET M1001` | re_key | `ELEC M1028` | Electricity | ELET → ELEC |
| `UC-CUR-MPG029OM` | cluster_skipped | `—` | — | — → — |

### Curated-M-ID collisions (operator decision points)

These buckets contain ≥2 curated M-IDs whose old keys all rename into the same canonical bucket. The dry-run assigns sequence numbers by (normalized_title, old_id); the operator approves at apply.

**Bucket `AUTB M1* (corroborated)`:**
- `AB M1001` → `AUTB M1002` · Advanced Auto Body Collision and Damage Repair
- `ABDY M1001` → `AUTB M1003` · Advanced Auto Collision Repair


## Top 25 disciplines by re-key impact

| discipline | canonical | n M-IDs | re-key | no-change | blocked | reviewed? |
|---|---|---:|---:|---:|---:|:---:|
| Physical Education | `KINE` | 3335 | 3323 | 12 | 0 | ✓ |
| English as a Second Language | `ESOL` | 2316 | 2246 | 70 | 0 | ✓ |
| Computer Information Systems | `CISC` | 2232 | 2183 | 49 | 0 | ✓ |
| Art | `ARTS` | 2252 | 2161 | 91 | 0 | ✓ |
| Music | `MUSI` | 2634 | 1942 | 692 | 0 | ✓ |
| Kinesiology | `KINE` | 2201 | 1895 | 306 | 0 | ✓ |
| Business | `BUSI` | 1694 | 1677 | 17 | 0 | ✓ |
| Administration of Justice | `CRIM` | 1568 | 1541 | 27 | 0 | ✓ |
| Foreign Languages | `FLNG` | 1453 | 1452 | 1 | 0 | ✓ |
| Nursing | `NRSR` | 1440 | 1431 | 9 | 0 | ✓ |
| Child Development/Early Childhood Education | `ECED` | 1370 | 1353 | 17 | 0 | ✓ |
| Office Technologies | `OTEC` | 1034 | 1011 | 23 | 0 | ✓ |
| Culinary Arts/Food Technology | `CULN` | 973 | 919 | 54 | 0 | ✓ |
| Fire Technology | `FIRE` | 1546 | 903 | 643 | 0 | ✓ |
| Multimedia | `MULT` | 903 | 859 | 44 | 0 | ✓ |
| Theater Arts | `THEA` | 1453 | 845 | 608 | 0 | ✓ |
| Computer Science | `CISC` | 715 | 714 | 1 | 0 | ✓ |
| Construction Technology | `CNST` | 788 | 698 | 90 | 0 | ✓ |
| Ethnic Studies | `ETHS` | 794 | 685 | 109 | 0 | ✓ |
| Automotive Technology | `AUTO` | 1493 | 592 | 901 | 0 | ✓ |
| Environmental Technologies | `ESCI` | 578 | 578 | 0 | 0 | ✓ |
| Air Conditioning, Refrigeration, Heating | `HVAC` | 672 | 555 | 117 | 0 | ✓ |
| Emergency Medical Technologies | `EMST` | 553 | 553 | 0 | 0 | ✓ |
| Agriculture | `AGRI` | 548 | 522 | 26 | 0 | ✓ |
| Counseling | `COUN` | 823 | 504 | 319 | 0 | ✓ |

## Validation

- ✅ **all_new_subj4_are_4letter**: pass
- ✅ **one_subj4_per_discipline**: pass
- ✅ **new_course_ids_unique**: pass
- ❌ **no_seq_overflow**: FAIL
  - corroborated overflow: [('KINE M1* (corroborated)', 1000), ('KINE M1* (corroborated)', 1001), ('KINE M1* (corroborated)', 1002), ('KINE M1* (corroborated)', 1003), ('KINE M1* (corroborated)', 1004)]

## Sequence-collision summary

435 new buckets contain ≥2 old M-IDs. Top 10 by collision count:

| new bucket | colliding M-IDs |
|---|---:|
| `KINE M1* (standalone)` | 3999 |
| `CISC M1* (standalone)` | 2040 |
| `MUSI M1* (standalone)` | 1831 |
| `ARTS M1* (standalone)` | 1526 |
| `DANC M1* (standalone)` | 1226 |
| `CRIM M1* (standalone)` | 1197 |
| `NRSR M1* (standalone)` | 1156 |
| `THEA M1* (standalone)` | 1133 |
| `FIRE M1* (standalone)` | 1082 |
| `AUTO M1* (standalone)` | 1068 |

## Downstream apply scope

Beyond `coci_minted_courses.json` + `coci_minted_singletons.json`, the apply step (5c) re-keys references in three downstream files. The numbers below count records that touch at least one old M-ID in this dry-run's alias map.

| file | records re-keyed |
|---|---:|
| `kb/coci_minted_memberships.json` | 14632 |
| `kb/coci_articulations.json` (articulations[]) | 3750 |
| `kb/coci_unified_courses.json` (clusters[].members) | 1351 clusters, 2824 member refs |
| `kb/coci_curation.json` (key rename) | 5 |

## How to proceed

1. Curators fill any blank `canonical_subj4` entries via the **Canonical SUBJ4** tab.
2. Re-run `python3 kb/_subj4_dryrun.py` to refresh this report.
3. When the apply-gate above goes ✅, Session 5c builds `kb/_subj4_apply.py` for the atomic re-key (producer + consumer + curation overlay + Supabase live kb_curation, all in one 10:17 UTC window).
4. Rollback inverse alias lives in `kb/subj4_dryrun/alias_map.json` (right-to-left).
