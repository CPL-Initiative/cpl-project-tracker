---
title: Authority recode — DRY-RUN (items 7, 9, 10, 11, 12, 13, 14, 16 of 2026-09-03)
date: 2026-09-03
session: 224 (SkyTune)
status: APPLIED 2026-09-03T20:19:16Z — see validation.md; Sam ruled the fourteen readings yes to all on 2026-09-03
tags: [remint, dry-run, csr, subj4, authority-codes, rule-7]
artifacts:
  - kb/authority_recode_out/2026-09-03/alias_map.json
  - kb/authority_recode_out/2026-09-03/collisions.json
  - kb/authority_recode_out/2026-09-03/fl_classification.json
  - kb/authority_recode_out/2026-09-03/ag_classification.json
  - kb/authority_recode_out/2026-09-03/seed_edits.json
  - kb/authority_recode_out/2026-09-03/supabase_ops.sql
related:
  - kb/csr_authority_codes_rulings_2026-09-03.json
  - docs/coursecontrolnumber_remint.md
  - kb/_pols_remint.py (the keep-number precedent)
---

# Authority recode — DRY-RUN

## TL;DR

- **10,296** ids move (8,126 plain prefix re-keys, 202 Media Production rows into FTVE, 1,428 Foreign Languages rows, 540 agriculture rows); **539** of them are Z-band identities moving with their namespace.
- **10,041** keep their number; **255** gap-fill because the key was taken (see collisions.json).
- Validation: **7/7** gates pass. Articulation identities-map ghosts healed by the move: 54; old keys the apply must also re-key in that map: 13.
- Why not `kb/_subj4_dryrun.py`: measured the same day with the committed seed, the June allocator would move 62,638 of 70,946 ids to change nothing (titles were normalized after the June fold), so a code change is a prefix re-key that keeps the number — the POLS pattern.

## Gates

| gate | pass | detail |
|---|---|---|
| V1_conservation | ✅ | {"moves": 10296, "aliased": 10296} |
| V2_new_ids_unique | ✅ | {"duplicates": []} |
| V3_new_ids_disjoint_from_untouched | ✅ | {"collisions": []} |
| V4_discipline_unchanged | ✅ | {"note": "a recode never changes a row's discipline; the apply gate re-checks it"} |
| V5_alias_invertible | ✅ | {"duplicates": []} |
| V6_all_new_subj4_four_letters | ✅ | {"bad": []} |
| V7_no_overflow | ✅ | {"overflow": []} |

## By discipline

| discipline | rows moving | kept number | gap-filled |
|---|---|---|---|
| Computer Information Systems | 2,620 | 2,620 | 0 |
| Drama/Theater Arts | 1,770 | 1,770 | 0 |
| Child Development/Early Childhood Education | 1,431 | 1,431 | 0 |
| Foreign Languages | 1,428 | 1,381 | 47 |
| Office Technologies | 1,058 | 1,058 | 0 |
| Computer Science | 722 | 722 | 0 |
| Film and Media Studies | 525 | 520 | 5 |
| Agriculture | 455 | 454 | 1 |
| Media Production | 202 | 0 | 202 |
| Agricultural Production | 85 | 85 | 0 |

## Item 10 — the language codes

Rule as ruled: SPAN on C-ID's authority; a language the ruling names takes the code it names; any other language takes its dominant local code when that code is four letters, else keeps the CSR code, flagged. `measured` is the colleges' own subject code on the language's rows.

| language | today | proposed | basis | dominant local (rows) | dominant four-letter (rows) | rows moving |
|---|---|---|---|---|---|---|
| Spanish | FLSP | **SPAN** | ruled (C-ID SPAN) | SPAN (695) | SPAN (695) | 549 |
| French | FLFR | **FREN** | ruled | FREN (218) | FREN (218) | 169 |
| Japanese | FLJA | **JAPN** | ruled | JAPN (130) | JAPN (130) | 153 |
| Chinese | FLCH | **CHIN** | ruled | CHIN (198) | CHIN (198) | 179 |
| Italian | FLIT | **ITAL** | ruled | ITAL (189) | ITAL (189) | 105 |
| German | FLGE | **GERM** | ruled | GERM (82) | GERM (82) | 92 |
| Arabic | FLAR | **ARAB** | ruled | ARBC (30) | ARBC (30) | 56 |
| Russian | FLRU | **RUSS** | ruled | RUSS (56) | RUSS (56) | 52 |
| Vietnamese | FLVI | **VIET** | ruled | VIET (40) | VIET (40) | 40 |
| Korean | FLKO | **FLKO** ⚠️ | ruled: keeps the CSR code, flagged | KOREAN (22) | KORE (9) | 1 |
| Tagalog | FLTA | **FLTA** ⚠️ | flagged: no dominant four-letter local code, keeps the CSR code | PIL (10) | TAGA (9) | 12 |
| Portuguese | FLPO | **PORT** | ruled | PORT (21) | PORT (21) | 14 |
| Armenian | ARME | **ARME** ⚠️ | flagged: no dominant four-letter local code, keeps the CSR code | ARMEN (17) | ARMN (2) | 2 |
| Latin | FLLA | **LATN** | dominant local code is four letters | LATN (12) | LATN (12) | 0 |
| Hebrew | FLHE | **FLHE** ⚠️ | flagged: no dominant four-letter local code, keeps the CSR code | HEBREW (8) | HEBR (4) | 0 |
| Persian | FLPE | **FLPE** ⚠️ | flagged: the local codes tie (PRSN and PERSIN), keeps the CSR code | PRSN (3) | PRSN (3) | 0 |
| Punjabi | FLPU | **FLPU** ⚠️ | flagged: no dominant four-letter local code, keeps the CSR code | PUNJABI (4) | None (0) | 0 |
| Hmong | FLHM | **FLHM** ⚠️ | flagged: no dominant four-letter local code, keeps the CSR code | HMONG (4) | HMNG (2) | 0 |
| Nahuatl | FLNA | **FLNA** ⚠️ | flagged: dominant local code SPAN belongs to another language, keeps the CSR code | SPAN (5) | SPAN (5) | 0 |
| Hindi | FLHI | **HNDI** | dominant local code is four letters (thin: 3 rows) | HNDI (3) | HNDI (3) | 0 |
| Greek | FLGR | **FLGR** ⚠️ | flagged: no dominant four-letter local code, keeps the CSR code | GREEK (2) | None (0) | 2 |

Strays keyed under a code the file does not know — kept as they are, a reading for Sam (add the language to `kb/foreign_language_subj4.json` with this code, or say which):

- `ARAM` · 3 rows
- `HUPA` · 2 rows
- `KHME` · 1 row
- `FL` · 1 row
- `HIER` · 1 row
- `LING` · 1 row
- `NAL` · 1 row
- `TURK` · 1 row
- `YUR` · 1 row

FLNG residual after the recode: 4 rows (language-agnostic courses).

Strays the classifier places in a language (TOP, title or local subject — the signal is on each row in fl_classification.json):

| from | to | rows |
|---|---|---|
| CHI | CHIN | 8 |
| FIL | FLTA | 6 |
| CHNE | CHIN | 4 |
| FILI | FLTA | 4 |
| JAPA | JAPN | 3 |
| PIL | FLTA | 2 |
| ARMN | ARME | 2 |
| GREE | FLGR | 2 |
| ASIA | CHIN | 1 |
| ARB | ARAB | 1 |
| ASIA | JAPN | 1 |
| FR | FREN | 1 |
| FRE | FREN | 1 |
| JPNS | JAPN | 1 |
| KORE | FLKO | 1 |
| TIS | SPAN | 1 |
| FIRE | FREN | 1 |
| FIRE | SPAN | 1 |

## Item 14 — the agriculture families

Two independent signals must agree (local subject-code family · title words · TOP family; TOP never decides alone, Rule 7). Residual rows keep the discipline's own code: AGRI for Agriculture, AGPR for Agricultural Production — **a reading for Sam** (the sheet said AGRI is the residual; keeping AGPR for Agricultural Production's residual avoids two MQ disciplines sharing one code).

| family | C-ID | code | rows |
|---|---|---|---|
| AB | AG-AB | AGAB | 41 |
| AS | AG-AS | AGAS | 242 |
| PS | AG-PS | AGPS | 92 |
| EH | AG-EH | AGEH | 37 |
| MA | AG-MA | AGMA | 86 |
| residual | — | AGRI / AGPR | 517 |

Why the residual rows stay:

- one signal only: 235
- no family signal: 161
- viticulture / enology: 121

One-signal rows (235) with their proposal, for a curator's eye:

- one signal only: proposed AB by title: 53
- one signal only: proposed PS by top: 25
- one signal only: proposed PS by title: 22
- one signal only: proposed EH by subject: 17
- one signal only: proposed AS by top: 17
- one signal only: proposed MA by title: 15
- one signal only: proposed EH by top: 12
- one signal only: proposed MA by top: 7
- one signal only: proposed EH by title: 6
- one signal only: proposed AS by title: 6
- one signal only: proposed VE by top: 5
- one signal only: proposed AB by subject: 5

Viticulture / enology rows with two agreeing signals but no C-ID family: 121 — **reading for Sam**: keep them residual (as here), or file them under AGPS (plant science)?

## Readings to confirm (reply by number)

1. Item 13: Media Production shares FTVE with Film and Media Studies as a fan-in pair; Film keeps its numbers and Media Production's 202 rows gap-fill after them.
2. Item 14: the families take AGAB, AGAS, AGPS, AGEH, AGMA; Agriculture's residual is AGRI and Agricultural Production's residual is AGPR (or AGRI for both — say which).
3. Item 14: viticulture / enology (TOP 0104) stays residual, or takes AGPS.
4. Item 14: C-ID AG-EH's corpus home is Ornamental Horticulture (7 of 12 rows), a discipline the sheet did not list; it keeps HORT with a C-ID AG-EH chip unless you fold it into the umbrella.
5. Item 10: Arabic takes ARAB as the ruling names it; the measured dominant local code is ARBC by two rows (30 vs 28).
6. Item 10: the languages flagged above keep their CSR code; the strays listed keep theirs until the file names them.

## Apply procedure (not run here)

1. Sam confirms the readings; the FL / AG classifications stand as receipts.
2. `kb/_authority_recode_apply.py` (to be built from compute_plan, apply == spec): re-keys the catalog, memberships, articulations + identities, curation keys + merge_into pointers, the zseq counters, the seed (canonical codes, umbrella flags) and the FL file; asserts the plan matches this receipt.
3. Same cron window: Supabase kb_curation re-key from the receipt (supabase-rekey.yml, a generic --verify), the _CANON_SUBJ4:: picks, then kb/_post_apply_chain.py (promotions, csr-seed, authority, audit, receipts, fold-verify).
4. Then the Z-band retirement (kb/_zband_retire_dryrun.py --after-recode this alias map).

Code touch points the apply carries:

- kb/_row_audit.py UMBRELLA_DISCIPLINES (+ Agriculture, Agricultural Production)
- kb/_seed_coci_minted_mids.py UMBRELLA_DISCIPLINES (same)
- kb/_csr_trail.py UMBRELLA_DISCIPLINES (same)
- kb/_subj4_dryrun.py load_umbrella_allowances (+ the agriculture family codes)
- kb/_uc_cur_zscheme_dryrun.py UMBRELLA_DISCIPLINES (same)
- canonical_subj4.js UMBRELLA_EXTRA_SUBJ4 (+ the agriculture family codes)
- kb/foreign_language_subj4.json per-language subj4 (the FL codes above)
- kb/uc_cur_zseq.json counters: old prefix -> new prefix (the POLS pattern)
- Supabase _CANON_SUBJ4::<discipline> picks for the recoded disciplines (MCP, same window)
- kb/_rekey_promotions.py ALIAS_MAPS: register the apply receipt
- kb/_seed_authority_codes.py: re-run (canonical_source flips to c-id where the code now matches)
