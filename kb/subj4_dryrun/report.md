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

- Canonical map: **44 / 144** disciplines reviewed; **100** still need a 4-letter canonical SUBJ4.
- M-IDs total: **72481** (corroborated catalog: 16308, singletons: 56173)
  - **3243** would re-key to new SUBJ4 (minted 747, singletons 2496)
  - **12908** already on canonical SUBJ4 (no change) (minted 3165, singletons 9743)
  - **49160** blocked on missing canonical (minted 11130, singletons 38030)
  - 7170 skipped (no discipline)
- Sequence-reallocation buckets: **126** new (SUBJ4, band, kind) buckets contain ≥2 old M-IDs.

## Apply gate (5c readiness)

**🟡 NOT READY for apply** — open items:
  - 100 disciplines need a curator-confirmed canonical SUBJ4 (fill via the Canonical SUBJ4 tab and re-run this dry-run)

## Curation impact

`coci_curation.json` has **7** entries. Per-entry fate:

| old_id | fate | new_id | discipline | old → new SUBJ4 |
|---|---|---|---|---|
| `AB M1001` | blocked_on_curator | `—` | Auto Body Technology | AB → — |
| `ABDY M1001` | blocked_on_curator | `—` | Auto Body Technology | ABDY → — |
| `ABDY M10AA` | blocked_on_curator | `—` | Auto Body Technology | ABDY → — |
| `BSIC M9001` | no_change | `BSIC M9001` | Interdisciplinary-Basic Skills: Noncredit 53412 | BSIC → BSIC |
| `EGDT M1001` | blocked_on_curator | `—` | Drafting/CADD | EGDT → — |
| `ELET M1001` | blocked_on_curator | `—` | Electricity | ELET → — |
| `UC-CUR-MPG029OM` | cluster_skipped | `—` | — | — → — |


## Top 25 disciplines by re-key impact

| discipline | canonical | n M-IDs | re-key | no-change | blocked | reviewed? |
|---|---|---:|---:|---:|---:|:---:|
| Automotive Technology | `AUTO` | 1493 | 592 | 901 | 0 | ✓ |
| Dance | `DANC` | 1667 | 405 | 1262 | 0 | ✓ |
| English | `ENGL` | 1579 | 320 | 1259 | 0 | ✓ |
| Welding | `WELD` | 810 | 317 | 493 | 0 | ✓ |
| Mathematics | `MATH` | 1542 | 287 | 1255 | 0 | ✓ |
| Cosmetology | `COSM` | 407 | 153 | 254 | 0 | ✓ |
| Vocational | `VOCE` | 543 | 130 | 413 | 0 | ✓ |
| Fashion and Related Technologies | `FASH` | 681 | 120 | 561 | 0 | ✓ |
| Photography | `PHOT` | 621 | 109 | 512 | 0 | ✓ |
| Psychology | `PSYC` | 415 | 93 | 322 | 0 | ✓ |
| Geography | `GEOG` | 299 | 91 | 208 | 0 | ✓ |
| Journalism | `JOUR` | 340 | 75 | 265 | 0 | ✓ |
| Communication Studies | `COMM` | 334 | 74 | 260 | 0 | ✓ |
| Earth Science | `GEOL` | 315 | 66 | 249 | 0 | ✓ |
| History | `HIST` | 809 | 62 | 747 | 0 | ✓ |
| Architecture | `ARCH` | 559 | 51 | 508 | 0 | ✓ |
| Electronic Technology | `ELCT` | 140 | 46 | 94 | 0 | ✓ |
| Court Reporting | `CTRP` | 101 | 33 | 68 | 0 | ✓ |
| Art History | `ARTH` | 124 | 31 | 93 | 0 | ✓ |
| Education | `EDUC` | 181 | 24 | 157 | 0 | ✓ |
| Industrial Relations | `LABR` | 62 | 23 | 39 | 0 | ✓ |
| Physics/Astronomy | `PHYS` | 243 | 22 | 221 | 0 | ✓ |
| Anthropology | `ANTH` | 380 | 19 | 361 | 0 | ✓ |
| Philosophy | `PHIL` | 335 | 19 | 316 | 0 | ✓ |
| Engineering | `ENGR` | 292 | 18 | 274 | 0 | ✓ |

## Validation

- ✅ **all_new_subj4_are_4letter**: pass
- ✅ **one_subj4_per_discipline**: pass
- ✅ **new_course_ids_unique**: pass
- ✅ **no_seq_overflow**: pass

## Blocked on curator — top disciplines

These disciplines have ≥1 M-ID waiting on a canonical SUBJ4. Fill in the Canonical SUBJ4 tab.

| discipline | n blocked M-IDs | data-modal | sample old SUBJ4s |
|---|---:|---|---|
| Physical Education | 3335 | `PE` | `ACS`, `ADAP`, `ADPE`, `AE`, `APE`, `AQUA` |
| Music | 2634 | `MUS` | `AHSD`, `AMUS`, `AUD`, `CMUS`, `CRMO`, `DANC` |
| English as a Second Language | 2316 | `ESL` | `ABE`, `ABEN`, `ACCS`, `ACE`, `AENG`, `AESL` |
| Art | 2252 | `ART` | `AHS`, `ART`, `ARTA`, `ARTB`, `ARTC`, `ARTF` |
| Computer Information Systems | 2232 | `CIS` | `ADED`, `ARTD`, `ARTN`, `BANK`, `BCIS`, `BUSE` |
| Kinesiology | 2201 | `KIN` | `EXSC`, `KIN`, `KINA`, `KINE`, `KINF`, `KINM` |
| Business | 1694 | `BUS` | `ACC`, `ACCT`, `ACTG`, `ACTV`, `ADED`, `AGBS` |
| Administration of Justice | 1568 | `AJ` | `ACAD`, `ADJ`, `ADJU`, `ADMI`, `ADMJ`, `AJ` |
| Fire Technology | 1546 | `FIRE` | `CSFM`, `CWEE`, `ENVR`, `FAC`, `FFS`, `FFT` |
| Foreign Languages | 1453 | `SPAN` | `ABE`, `AFRS`, `AHSD`, `ARA`, `ARAB`, `ARB` |
| Theater Arts | 1453 | `THEA` | `BCST`, `DRMA`, `ETHE`, `ETT`, `F`, `FTMA` |
| Nursing | 1440 | `NURS` | `ADN`, `AGHE`, `AHLT`, `ANUR`, `CHE`, `CNA` |
| Child Development/Early Childhood Education | 1370 | `ECE` | `ADED`, `CD`, `CDE`, `CDEC`, `CDES`, `CDEV` |
| Office Technologies | 1034 | `BOT` | `ADAP`, `ALTW`, `BC`, `BCA`, `BCIS`, `BCM` |
| Biological Sciences | 999 | `BIOL` | `ABE`, `AGHE`, `AGNG`, `AGVE`, `AHSD`, `ALCO` |
| Culinary Arts/Food Technology | 973 | `CUL` | `AEFN`, `BAK`, `BAKE`, `CA`, `CACM`, `CAHM` |
| Multimedia | 903 | `DM` | `AAD`, `ANIM`, `APTE`, `ART`, `ARTA`, `ARTD` |
| Counseling | 823 | `COUN` | `AD`, `ADC`, `ADCT`, `ADDI`, `ADHS`, `ADS` |
| Ethnic Studies | 794 | `ES` | `AAPI`, `AFAM`, `AFRA`, `AFRO`, `AFRS`, `AMIN` |
| Construction Technology | 788 | `CONS` | `ACA`, `ACPL`, `ACT`, `ADED`, `APAC`, `APC` |
| Computer Science | 715 | `CS` | `AVI`, `CA`, `CBIS`, `CIS`, `CISC`, `CISG` |
| Air Conditioning, Refrigeration, Heating | 672 | `HVAC` | `AAT`, `AC`, `ACAR`, `ACR`, `ACRT`, `ACRV` |
| Environmental Technologies | 578 | `ENVS` | `AEL`, `AET`, `AIRE`, `AMW`, `APEL`, `APIW` |
| Dental Technology | 578 | `DH` | `AHS`, `BCOT`, `BIOS`, `CHE`, `DA`, `DAST` |
| Emergency Medical Technologies | 553 | `EMS` | `AHLT`, `ALDH`, `CALJ`, `COMP`, `CPR`, `EMC` |

_…and 75 more disciplines — see `blocked.json`._

## Sequence-collision summary

126 new buckets contain ≥2 old M-IDs. Top 10 by collision count:

| new bucket | colliding M-IDs |
|---|---:|
| `DANC M1* (standalone)` | 1226 |
| `AUTO M1* (standalone)` | 1068 |
| `ENGL M1* (standalone)` | 989 |
| `MATH M1* (standalone)` | 893 |
| `WELD M1* (standalone)` | 643 |
| `HIST M1* (standalone)` | 598 |
| `FASH M1* (standalone)` | 494 |
| `VOCE M9* (standalone)` | 461 |
| `PHOT M1* (standalone)` | 450 |
| `DANC M1* (corroborated)` | 422 |

## Downstream apply scope

Beyond `coci_minted_courses.json` + `coci_minted_singletons.json`, the apply step (5c) re-keys references in three downstream files. The numbers below count records that touch at least one old M-ID in this dry-run's alias map.

| file | records re-keyed |
|---|---:|
| `kb/coci_minted_memberships.json` | 3912 |
| `kb/coci_articulations.json` (articulations[]) | 943 |
| `kb/coci_unified_courses.json` (clusters[].members) | 513 clusters, 1109 member refs |
| `kb/coci_curation.json` (key rename) | 0 |

## How to proceed

1. Curators fill any blank `canonical_subj4` entries via the **Canonical SUBJ4** tab.
2. Re-run `python3 kb/_subj4_dryrun.py` to refresh this report.
3. When the apply-gate above goes ✅, Session 5c builds `kb/_subj4_apply.py` for the atomic re-key (producer + consumer + curation overlay + Supabase live kb_curation, all in one 10:17 UTC window).
4. Rollback inverse alias lives in `kb/subj4_dryrun/alias_map.json` (right-to-left).
