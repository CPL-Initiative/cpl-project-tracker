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
  - **0** would re-key to new SUBJ4 (minted 0, singletons 0)
  - **65311** already on canonical SUBJ4 (no change) (minted 15042, singletons 50269)
  - **0** blocked on missing canonical (minted 0, singletons 0)
  - 7170 skipped (no discipline)
- Sequence-reallocation buckets: **437** new (SUBJ4, band, kind) buckets contain ≥2 old M-IDs.

## Apply gate (5c readiness)

**🟡 NOT READY for apply** — open items:
  - 1 bucket(s) contain ≥2 curated M-IDs — operator decision required

## Curation impact

`coci_curation.json` has **7** entries. Per-entry fate:

| old_id | fate | new_id | discipline | old → new SUBJ4 |
|---|---|---|---|---|
| `AUTB M1002` | no_change | `AUTB M1002` | Auto Body Technology | AUTB → AUTB |
| `AUTB M1003` | no_change | `AUTB M1003` | Auto Body Technology | AUTB → AUTB |
| `AUTB M10BN` | no_change | `AUTB M10BN` | Auto Body Technology | AUTB → AUTB |
| `BSIC M9001` | no_change | `BSIC M9001` | Interdisciplinary-Basic Skills: Noncredit 53412 | BSIC → BSIC |
| `DRAF M1002` | no_change | `DRAF M1002` | Drafting/CADD | DRAF → DRAF |
| `ELEC M1028` | no_change | `ELEC M1028` | Electricity | ELEC → ELEC |
| `UC-CUR-MPG029OM` | cluster_skipped | `—` | — | — → — |

### Curated-M-ID collisions (operator decision points)

These buckets contain ≥2 curated M-IDs whose old keys all rename into the same canonical bucket. The dry-run assigns sequence numbers by (normalized_title, old_id); the operator approves at apply.

**Bucket `AUTB M1* (corroborated)`:**
- `AUTB M1002` → `AUTB M1002` · Advanced Auto Body Collision and Damage Repair
- `AUTB M1003` → `AUTB M1003` · Advanced Auto Collision Repair


## Top 25 disciplines by re-key impact

| discipline | canonical | n M-IDs | re-key | no-change | blocked | reviewed? |
|---|---|---:|---:|---:|---:|:---:|
| Mathematics | `MATH` | 1542 | 0 | 1542 | 0 | ✓ |
| Political Science | `POSC` | 284 | 0 | 284 | 0 | ✓ |
| Multimedia | `MULT` | 903 | 0 | 903 | 0 | ✓ |
| Air Conditioning, Refrigeration, Heating | `HVAC` | 672 | 0 | 672 | 0 | ✓ |
| Automotive Technology | `AUTO` | 1493 | 0 | 1493 | 0 | ✓ |
| Auto Body Technology | `AUTB` | 196 | 0 | 196 | 0 | ✓ |
| English as a Second Language | `ESOL` | 2316 | 0 | 2316 | 0 | ✓ |
| English | `ENGL` | 1579 | 0 | 1579 | 0 | ✓ |
| Biological Sciences | `BIOL` | 999 | 0 | 999 | 0 | ✓ |
| Psychology | `PSYC` | 415 | 0 | 415 | 0 | ✓ |
| Geography | `GEOG` | 299 | 0 | 299 | 0 | ✓ |
| Agriculture | `AGRI` | 548 | 0 | 548 | 0 | ✓ |
| Construction Technology | `CNST` | 788 | 0 | 788 | 0 | ✓ |
| Administration of Justice | `CRIM` | 1568 | 0 | 1568 | 0 | ✓ |
| Reading | `READ` | 133 | 0 | 133 | 0 | ✓ |
| Business | `BUSI` | 1694 | 0 | 1694 | 0 | ✓ |
| Sign Language, American | `SLNA` | 364 | 0 | 364 | 0 | ✓ |
| Learning Assistance or Learning Skills | `LSKL` | 105 | 0 | 105 | 0 | ✓ |
| Carpentry | `CARP` | 148 | 0 | 148 | 0 | ✓ |
| Welding | `WELD` | 810 | 0 | 810 | 0 | ✓ |
| Instructional Design/Technology | `INDT` | 143 | 0 | 143 | 0 | ✓ |
| Counseling | `COUN` | 823 | 0 | 823 | 0 | ✓ |
| Fashion and Related Technologies | `FASH` | 681 | 0 | 681 | 0 | ✓ |
| Drafting/CADD | `DRAF` | 377 | 0 | 377 | 0 | ✓ |
| Physical Education | `PHYS` | 3335 | 0 | 3335 | 0 | ✓ |

## Validation

- ✅ **all_new_subj4_are_4letter**: pass
- ✅ **one_subj4_per_discipline**: pass
- ✅ **new_course_ids_unique**: pass
- ✅ **new_id_disjoint_from_untouched**: pass
- ✅ **no_seq_overflow**: pass

## Sequence-collision summary

437 new buckets contain ≥2 old M-IDs. Top 10 by collision count:

| new bucket | colliding M-IDs |
|---|---:|
| `PHYS M1* (standalone)` | 2746 |
| `CISC M1* (standalone)` | 2040 |
| `MUSI M1* (standalone)` | 1831 |
| `ARTS M1* (standalone)` | 1526 |
| `KINE M1* (standalone)` | 1481 |
| `DANC M1* (standalone)` | 1226 |
| `CRIM M1* (standalone)` | 1197 |
| `NRSR M1* (standalone)` | 1156 |
| `THEA M1* (standalone)` | 1133 |
| `FIRE M1* (standalone)` | 1082 |

## CCN / C-ID sequence reservations

The M-ID corroborated format `SUBJ M<band><seq:03d>` shares structure with CCN's `SUBJ C<band><seq:03d>` (only the prefix letter differs), and with the embedded sequence of C-ID `SUBJ <band><seq2>`. To prevent visual/sequence collisions, the allocator skips any seq already taken by a CCN/C-ID in the same `(SUBJ4, band)` bucket. Source: `kb/reference/ccn_courses.json` + `kb/reference/cid_descriptors.json`.

- Total reserved seqs across all (SUBJ4, band): **258**
- (SUBJ4, band) buckets with at least one M-ID landing in them: **20**
- Actual seq skips during this dry-run allocation: **497** (allocator walked past these to the next free seq)

Buckets with most reservations (these eat into the 999-seq capacity):

| (SUBJ4, band) | reserved seqs |
|---|---|
| `ITIS` band `1` | 010, 020, 030, 035, 036, 040, 045, 050 (+ 14 more) |
| `ENGL` band `1` | 000, 001, 002, 003, 005, 010, 020, 030 (+ 9 more) |
| `THTR` band `1` | 011, 012, 013, 014, 051, 052, 071, 072 (+ 5 more) |
| `MATH` band `2` | 010, 011, 020, 021, 030, 040, 050, 060 (+ 4 more) |
| `ARTS` band `2` | 000, 005, 010, 020, 030, 040, 050, 060 (+ 4 more) |

Buckets where the allocator actually skipped seqs this run:

| new bucket | seqs skipped |
|---|---:|
| `ENGL M1* (corroborated)` | 21 |
| `DENT M1* (standalone)` | 19 |
| `DANC M1* (standalone)` | 17 |
| `ENVR M1* (standalone)` | 16 |
| `HUMA M1* (standalone)` | 16 |

## Downstream apply scope

Beyond `coci_minted_courses.json` + `coci_minted_singletons.json`, the apply step (5c) re-keys references in three downstream files. The numbers below count records that touch at least one old M-ID in this dry-run's alias map.

| file | records re-keyed |
|---|---:|
| `kb/coci_minted_memberships.json` | 15042 |
| `kb/coci_articulations.json` (articulations[]) | 3759 |
| `kb/coci_unified_courses.json` (clusters[].members) | 1366 clusters, 2874 member refs |
| `kb/coci_curation.json` (key rename) | 0 |

## How to proceed

1. Curators fill any blank `canonical_subj4` entries via the **Canonical SUBJ4** tab.
2. Re-run `python3 kb/_subj4_dryrun.py` to refresh this report.
3. When the apply-gate above goes ✅, Session 5c builds `kb/_subj4_apply.py` for the atomic re-key (producer + consumer + curation overlay + Supabase live kb_curation, all in one 10:17 UTC window).
4. Rollback inverse alias lives in `kb/subj4_dryrun/alias_map.json` (right-to-left).
