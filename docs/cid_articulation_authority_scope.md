---
title: C-ID articulation authority — per-college official articulations as a CCR evidence tier (the math cleanup)
date: 2026-06-11
status: PHASES 0/0b/1/3 BUILT — seed + statewide extract + set-aware joins + the generator member router (Session 42, MATH-scoped) + Phase 3 statewide widening (Session 45 — 8,377 members across 454 descriptors). NEXT = Phase 2 (ccn_equiv bridge), curation surfaces for conflicts/sequences/unmatched/dual-approvals, termly refresh procedure
session: 42
tags: [scope, ccr, c-id, m-id, math, articulation-authority, rules-based-merging, knowledge-base]
related:
  - docs/official_id_fold_scope.md (the receipt-evidence tier this complements)
  - docs/kb-notes/methodology-witness-kinship-gate.md (gates receipts; does NOT apply here — see §3)
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md (why per-course grain wins)
artifacts:
  - kb/reference/cid_articulations.json (SEED — 10 MATH 210 rows)
  - kb/_join_cid_articulations.py (the joiner; dry-run default)
---

# C-ID articulation authority — scope

> **The ask (Sam, 2026-06-11, Session 42).** *"Let's take a crack at revising
> the rules and procedures to clean up the MIDs in math. Notice the snippet
> from C-ID for calculus courses, which should also be available in the C-ID
> table…"* — with 10 rows of the c-id.net approved-courses table for
> MATH 210 (per college: the local course + title + approval term).

**TL;DR.** The ASCCC C-ID site publishes, per descriptor, the official list of
each college's approved articulated course. That is **present-tense official
authority at the (college, course) grain** — it bypasses titles entirely
("West Valley MATH 003A *is* MATH 210" even though its title says "Calculus
and Analytical Geometry"), and it resolves the class of row no family-level
rule can: the genuinely-mixed titles (`MATH M1175` "Calculus I" = MATH 210 at
some colleges, MATH 211 at others). Measured on Sam's 10-row seed: **COCI
self-report misses 6 of 10 approved articulations** — the table is not a
duplicate of the CIDNumber column, it roughly doubles it.

## 1. The math landscape (measured 2026-06-11, post-slot-fix)

- **362 MATH minted M-IDs + 1,193 MATH stand-alones; 405 calculus-titled
  identities**; 115 calculus-titled rows still separate in the CCR.
- 98 MATH promotions records carry official-id evidence; **26 are
  multi-target**, including the unfoldable flagship:
  - `MATH M1175` "Calculus I" — **MATH 210 ×14 vs MATH 211 ×6 →
    `cid_conflict`, never folds.** Correctly so at family grain: "Calculus I"
    genuinely spans Early (210) and Late (211) Transcendentals by college.
    Only per-college authority can split it. Same shape: `MATH M1104`
    (210 ×4 / 211 ×3), `MATH M10MT`, `MATH M10MU`.
- The C-ID reference (`kb/reference/cid_descriptors.json`) holds **20 MATH
  descriptors** — the export universe for Phase 1.

## 2. The seed measurement (Sam's 10 MATH 210 rows)

`kb/_join_cid_articulations.py` dry-run: **10/10 matched a current COCI
course, 0 conflicts, 0 unmatched.**

| disposition | n | meaning |
|---|---|---|
| `already_claimed` | 4 | COCI CIDNumber == MATH 210 (departed to the official row at the 2026-05-22 re-mint) |
| `new_authority` | 6 | COCI carries NO usable CIDNumber — the table is the only authority |

Current homes of the 6 new-authority members: 3 in `MATH M1175` "Calculus I",
1 in `MATH M1174` "Honors Calculus I", 1 in `MATH M1104` "Analytic Geometry
and Calculus I", and 1 (Contra Costa `MATH C2210`) **already departed via its
CommonCourseNumber claim** — i.e. it sits in the CCN `MATH C2210` family
while the articulation table approves it as C-ID MATH 210. That one row is
the **C-ID↔CCN bridge** in miniature (§5).

## 3. Join rules (the joiner's contract — enforced in code)

1. Join key is **(college, subject, number)** against the raw COCI list.
   College matches on an ASCII-alnum slug (mojibake-safe); number matches
   exact first, then a leading-zero-normalized retry ("003A" == "3A")
   **flagged `zero_normalized`** for audit.
2. **Titles are NEVER consulted.** The value of this tier is precisely that
   it connects courses lexical rules cannot.
3. **No kinship gate.** The kinship gate validates *receipts* (statements
   about families that existed at write time). The articulation table is a
   present-tense official statement about a live (college, course) — the
   same trust tier as COCI's own CIDNumber column. The gate's checklist
   question ("can the entity behind this key change without the key
   changing?") answers NO here: the key IS the college's live course.
4. `coci_conflict` (COCI claims a *different* C-ID than the table) is
   surfaced loudly and **never auto-trusted** — curation decides. 0 in the
   seed; expect a handful statewide.
5. `unmatched` (no current COCI course — the college renumbered since the
   approval term) goes to a curation report. **Never fuzzy-matched.**
6. Approval terms ride along for audit only.

## 4. Generator consumption (Phase 1 — the build, gated on the full export)

`kb/cid_articulation_joins.json` (the joiner's `--write` output) becomes a
third member-level authority source in `export_unified_courses()`, beside the
raw list's CIDNumber and CommonCourseNumber:

- **Display-level member routing** (the Phase-B/R4 governance, extended one
  grain down): a member whose control number carries articulation authority
  renders under its official row (counted in members/units/TOP stats, listed
  in the member table) and **leaves its M-ID's display** — the remnant M-ID
  keeps only its unrouted members. Recomputed each regen, no KB mutation,
  fully reversible, rows stay Generated until a curator Verifies.
- This **splits below the family grain**: `MATH M1175`'s Folsom/Pierce/CCSF
  members route to MATH 210; its 211-approved members route to MATH 211; any
  residue stays a (smaller, honest) M-ID. The `cid_conflict` flag dissolves
  where the table covers the members — without ever guessing from titles.
- Authority-routed members also act as **present-tense witnesses** in Phase
  A/B evidence (kinship-exempt per §3), so remnant rows whose remaining
  members all route the same way fold whole.
- An M-ID emptied of every member by routing disappears as a row (its id
  recorded in the official row's fold provenance, alias-style).
- **Dry-run gates before shipping:** regen to `UC_OUT_DIR`, diff member
  rosters for all 20 MATH descriptors against the export; SPAN/AUTO/ANTH
  regression set must be byte-identical (no articulation data touches them
  yet); suite green; counts in this doc updated.

## 5. Phase 2 — the C-ID↔CCN bridge

Articulation rows whose local number is CCN-shaped (`MATH C2210` approved as
MATH 210) officially tie the CCN family to the C-ID. Surfacing that as a
`ccn_equiv` cross-reference on both official rows resolves the contested
C-ID-vs-CCN witness splits found in the Session-42 victim sweep (`COMM M1051`:
COMM 130 ×38 vs COMM C1004 ×47 — same course, two official systems) without
inventing an equivalence table: **c-id.net IS the equivalence authority.**
Display-only cross-reference first; any fold-level unification is its own
scope (CCN > C-ID precedence per §10).

## 6. The authority ladder (the RULES revision, replacing "evidence sources" prose)

```
1. COCI CommonCourseNumber claim        (official, per-course, re-mint splits)
2. COCI CIDNumber claim                 (official, per-course, re-mint splits)
2′. c-id.net articulation table         (official, per-course, display routing — NEW;
                                         same trust as 2, fills its ~50% gap;
                                         coci_conflict rows excluded pending curation)
3. promotions receipts                  (historical, family-grain — KINSHIP-GATED,
                                         era-stamped re-key semantics)
4. title rules                          (worklist only — never auto)
```

Procedure additions:
- **Refresh loop:** c-id.net approvals change termly; re-export + re-run the
  joiner (idempotent) each term or on demand. The reference file's `_status`
  header tracks export date + coverage (per the receipt-status rule).
- **Export procedure (curator):** c-id.net → each descriptor's "Approved
  Courses" view → export/paste columns (cid, cid_title, college, local
  subject+number, local title, approval term) into
  `kb/reference/cid_articulations.json` `articulations[]`. The joiner
  validates everything else.

## 7. The full extract (landed 2026-06-11, same session)

Sam supplied the **statewide** export (`kb/reference/cid_articulations_raw.csv`,
27,379 rows; descriptions deliberately absent — the descriptor catalog
`cid_descriptors.json` remains the description source).
`kb/_ingest_cid_articulations.py` normalizes it (CSU rows dropped; the
`" + "` zip convention decoded — distinct colleges = district-shared
approvals, a repeated college = a COURSE SEQUENCE, flagged + excluded from
routing; college-name aliases measured, the lone residual was Barstow):
**28,070 CCC articulations, 475 descriptors, 115 colleges; 1,537 MATH rows
across all 20 MATH descriptors.**

`kb/_join_cid_articulations.py` (set-aware: a course can hold approvals under
several descriptors — 1,820 statewide, dominated by series∧component pairs;
COCI's CIDNumber is itself parsed as a set; sequence rows count toward a
course's approval set but never route):

| disposition | n |
|---|---|
| `already_claimed` | 10,741 |
| `compatible_multi` | 615 |
| **`new_authority`** | **9,676** |
| `coci_conflict` (true disagreements) | 76 |
| `unmatched` (likely renumbered since approval) | 3,976 |

The naive conflict count was 1,252; set-awareness + sequence-set absorption
reduced it to **76 genuine curation items**. **3,917 identities hold 9,072
routable members.** Flagship confirmations: `MATH M1175` "Calculus I" routes
**7 → MATH 210, 3 → MATH 211** (the unfoldable `cid_conflict` row splits on
per-college authority); `MATH M1185` "Calculus II" routes 7 → MATH 220,
4 → MATH 221.

## 8. Phases

| Phase | What | Status |
|---|---|---|
| 0 | Seed reference (10 MATH 210 rows) + joiner + this scope | **BUILT** (#362) |
| 0b | Full statewide extract + ingest + set-aware joiner + committed join artifact | **BUILT (Session 42)** |
| 1 | Generator member routing (§4; MATH descriptors first) + dry-run gates + CCR regression set | **BUILT (Session 42)** — 329 members routed; 11 fully-routed M-IDs + 43 stand-alones folded (`rfold`/`routed_from`); MATH 210: 83→101 members incl. Folsom Lake MATH 400; M1175 13→6-member residue; Pierce 261 (210∧211) correctly held; SPAN/AUTO/ANTH regression byte-stable; `tests/uc_cid_routing.test.js` |
| 2 | C-ID↔CCN `ccn_equiv` cross-reference (the COMM 130/C1004 class) | after 3 |
| 3 | Routing statewide (all descriptors) + the dual-approval honesty fix | **BUILT (Session 45)** — see §9 |
| 3b | Termly refresh procedure (§6) + curation surfaces for the held classes (76 `coci_conflict`, 285 multi-descriptor, 3,976 `unmatched`) | next |

## 9. Phase 3 — statewide widening (landed 2026-06-11, Session 45)

The `_ROUTE_PREFIXES = ("MATH ",)` gate was removed after math proved out.
Measured on the full regen (baseline reproduced HEAD byte-exactly first):

- **8,377 members** now display under their descriptor rows (was 329 MATH-only);
  **454 descriptors** routed-to, every one present in `cid_descriptors.json`
  (so the claims-only mechanism guarantees a target row — 0 invisible-member
  edges). 285 multi-descriptor courses held; 76 `coci_conflict` excluded.
- **174 fully-routed M-IDs + 1,682 stand-alones folded** (`rfold`; was 11+43).
  Main payload 15,652 → 15,517 rows; stand-alone payload 55,478 → 53,839;
  +28 claims-only descriptor rows materialized by routed claimants.
- **Conservation verified: 0 member tuples vanished.** 125 previously-INVISIBLE
  members materialized — claimants whose descriptor row didn't exist at
  baseline (the pre-#345 invisibility class, e.g. ECE 210 +40, THTR 192 +27).
- **The scoped-gate lesson (the 4 un-routed stats courses).** Phase 1 filtered
  joins to MATH *before* the per-course uniqueness test, so a course approved
  under **MATH 110 ∧ SOCI 125** (the stats-pathway duals: `SOCS M10CE`,
  `PSYC M10DC`, `SOCI M10FF`, `PSYC M10DA`) looked uniquely-MATH-approved and
  auto-routed. Statewide collection sees the full approval set and correctly
  HOLDS them (stand-alone rows, curation decides). **Rule: any future routing
  scope-gate must filter AFTER assembling each course's full approval set,
  never before** — a scoped view biases dual-approved courses toward the
  in-scope descriptor.
- Spot checks: AJ descriptors 773 → 858 members (AJ 200 "Introduction to
  Corrections" 48 → 80); SPAN 200 98 → 114 keeping all 4 kin folds; AUTO 120 X
  21 → 27 keeping both transmissions folds; 4 CRIM M-IDs routed into AJ
  descriptors. Suite 27/27 green (`uc_cid_routing` re-pinned for Phase 3;
  `uc_kinship_gate`'s AUTO 120 X stats updated 21 → 27).
