---
title: C-ID articulation authority — per-college official articulations as a CCR evidence tier (the math cleanup)
date: 2026-06-11
status: PHASE 0 BUILT + FULL DATA LANDED (Session 42) — Sam supplied the statewide extract (27,379 rows) same-day; ingest + set-aware joiner built; join artifact committed. NEXT = the Phase-1 generator member routing (design §4, gates unchanged)
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
| 1 | Generator member routing (§4; MATH descriptors first) + dry-run gates + CCR regression set | NEXT |
| 2 | C-ID↔CCN `ccn_equiv` cross-reference (the COMM 130/C1004 class) | after 1 |
| 3 | Routing beyond MATH (the other 455 descriptors) + termly refresh procedure | after 1 proves at math scale |
