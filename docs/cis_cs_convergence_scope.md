---
title: CIS ↔ CS Convergence — Scope (decision pending)
date: 2026-06-10
status: SCOPED — awaiting Sam's sign-off on §5. NOT applied. Data leans "real distinction, fold the twins not the names."
session: 39
tags: [scope, remint, rule-7, discipline, cis, computer-science, fan-in, twin-merge, csr, m-id, knowledge-base]
related:
  - docs/kin_pe_convergence_scope.md (the fan-in template this was measured against)
  - docs/kb-notes/methodology-fan-in-discipline-convergence.md (the pattern + its "does NOT apply" clause)
  - kb/_apply_kine_flsp_twin_merge.py (the strict twin-merge machinery Option B would extend)
artifacts:
  - none yet — this is a scope, not a build
---

# CIS ↔ CS Convergence — Scope

> **The ask (Sam, 2026-06-10, Session 39).** The Session-38 handoff listed the
> CIS↔CS↔Office-Tech cluster as the top next fan-in candidate ("partly real
> distinctions, scope-first"). Session 39 measured all three candidate pairs;
> the data leans *real distinction* rather than *one converging field*, but Sam
> chose **"Scope CIS↔CS anyway"** — so this doc lays out the decision properly
> for a future sign-off. Office Technologies is a neighbor, not in scope here
> (its overlap with either is near-zero: 4/1 shared parent families).

## 1. What the data says (measured 2026-06-10, post twin-merge-pass)

| | Computer Information Systems | Computer Science |
|---|---|---|
| Minted parents | **553** | **182** |
| Singletons | 1,932 | 533 |
| Parent SUBJ4s | **CISC 517** + a 36-id tail (CIST 4, COMP 3, COSC 3, DIG 3, IT 3, …) | **CISC 182** (all) |
| Articulation records | 141 | 9 |

- **Shared title-families: 10 (parents) / 44 (both layers).** For comparison,
  KIN/PE — the true fan-in — had **93** parent families across *two* SUBJ4
  spaces. CIS/CS twins all sit inside **one** space.
- **Both disciplines already mint under `CISC`** (Sam's 2026-05-23 canonical
  pins gave them the same code), so the M-numbers are already one disjoint
  sequence. A name fold would need **zero re-keys** — mechanically trivial,
  which is exactly why the decision is *semantic*, not technical.
- The 10 strict cross-discipline twins (same band + strict family key + credit
  + units) are real same-course pairs: `Data Structures` ↔ `Data Structures in
  C++`, `Python Programming` ↔ `Programming in Python`, `Web Development I/1`,
  `Programming Concepts and Methodology I/II` … **plus one FALSE positive** —
  see §3, it gates Option B.

## 2. The fan-in test — CIS/CS mostly fails it

The methodology note's test: *two MQ names for ONE converging field* (faculty
hold either credential, the field itself is mid-rename). KIN/PE passed; CIS/CS
is the note's canonical **counter-example** ("a real distinction wearing
similar names — transfer/theory vs applied/business"). Both are distinct
entries in the authoritative MQ vocabulary with different qualification bases.

What the data adds: the *identity layer* often doesn't honor the distinction —
colleges teach "Python Programming" under either banner, and the discipline
labels on those twins came from machine inference, not faculty intent. So the
real cleanup target is the **twin courses**, not the **discipline names**.

## 3. ⚠ The single-letter trap (gates any CISC twin-merge)

Measuring the strict twins surfaced a false positive the KINE/FLSP pass never
hit: **`R Programming` ↔ `C# Programming`** collide, because the family key
drops single-letter tokens as "section letters" (`R` → gone, `C#` → `c` →
gone; both reduce to bare `programming`). In computing subjects, single
letters ARE the course content (R, C, C++→`c`, C#→`c`).

Verified: the applied KINE/FLSP merge is clean of this trap (its only
single-letter drops were possessive-`'s` artifacts — `MEN'S` ↔ `…, Men`).
Any extension of `kb/_apply_kine_flsp_twin_merge.py` to `CISC` MUST add a
guard: **do not merge a pair whose raw titles differ in single-letter /
language tokens** (R ≠ C ≠ C++ ≠ bare). The CER's display-only
within-credential fold (`_consolidate_arts`, #308) shares the key and should
get the same audit eventually — flagged as follow-up, lower stakes (display
only, gated on co-articulation).

## 4. Options

**A. No fold (status quo+).** Keep both disciplines. The 44 cross-discipline
twins already group in the Suggested-merges worklist (they share `CISC`), so
curator confirms clean them one at a time. Zero risk; slowest.

**B. Strict twin-merge pass over `CISC` (recommended, with the §3 guard).**
Extend the Session-39 machinery to `CISC` scope: merge only same-band +
same-credit + same-units + strict-family twins **with the single-letter guard
added**, cross-discipline allowed. Decision embedded: the winner's
*discipline* survives (proposed rule: the more-corroborated identity keeps its
label; the loser's discipline is recorded via `cross_listed_disciplines` so
faculty eligibility under either MQ is preserved). ~9 true pairs today.
Fixes the actual data problem; leaves the MQ vocabulary honest.

**C. Full fan-in (name fold).** Canonical name + alternate-name alias, the
KIN/PE machinery verbatim. Mechanically free (no re-keys) — but it erases a
faculty-meaningful boundary the field has NOT converged away (unlike KIN/PE),
and "which name wins" is itself contested. The methodology note says don't.
**Not recommended.**

Related-but-separate: CIS's 36-id SUBJ4 **tail** (CIST/COMP/COSC/DIG/…) is a
`subject_collision_signal` class already sanctioned for a canonical-SUBJ4 fold
to `CISC` by the CSR pin — that's ordinary Rule-7 cleanup, independent of this
decision, and worth doing regardless.

## 5. Sign-off (Sam) — GATED, nothing applied

1. **Option A / B / C?** (Session-39 recommendation: **B** — twins are the
   problem, names are not.)
2. If B: confirm the **winner-keeps-discipline + `cross_listed_disciplines`**
   rule for cross-discipline merges (vs forcing all merged twins to one
   discipline).
3. If B: confirm the **single-letter guard** (§3) as a blocking gate.
4. Independent of 1–3: green-light the **CIS SUBJ4-tail fold** to `CISC`
   (36 ids, ordinary canonical-SUBJ4 cleanup)?
