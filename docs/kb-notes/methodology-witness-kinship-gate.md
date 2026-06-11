---
title: "Witness-kinship gate: historical receipts need a present-tense validity check"
date: 2026-06-11
kb-status: published
type: methodology
tags: [methodology, evidence, receipts, re-key, merge-rules, ccr, promotions, data-integrity]
artifacts:
  - excel_to_dashboard.py (_kin_toks/_kin_jac/_kin_slug + the gated _row_official)
  - kb/_analyze_witness_kinship.py (the measure-first analyzer)
  - tests/uc_kinship_gate.test.js
related:
  - docs/kb-notes/methodology-rekey-every-id-keyed-artifact.md (the sibling failure: keys go stale)
  - docs/official_id_fold_scope.md (the rule this gate hardens)
  - docs/ccr_cluster_cleanup_lessons.md (Session 41 — the AUTO 120X/150X case)
---

# Witness-kinship gate: historical receipts need a present-tense validity check

## The failure class

A pipeline records **receipts** at event time — "these members departed
family F for official id X" — and a later rule consumes them as **evidence
about F today**. Two distinct decay modes:

1. **The key moves** (re-mints/renames) → the receipt dangles. Fix: re-key the
   artifact through alias maps (`methodology-rekey-every-id-keyed-artifact.md`).
2. **The key survives but the family behind it changes** (splits, fold-ins) →
   the receipt still *resolves* but describes a family that no longer exists.
   **No re-key can fix this** — the key is "current"; the *meaning* is stale.

Mode 2 is nastier because it is invisible to key-liveness checks: the
2026-05-29 over-merge splits carved 13–20-member lossy chimera families down
to coherent 2-member remnants, the surviving ids kept their receipts, and the
official-ID fold then merged engine-performance remnants under a transmissions
C-ID on the strength of a witness that had been a *different course* sharing a
local course number. Witness **counts** are no defense: one chimera receipt
carried 40 unanimous witnesses ("APPLIED ANTHROPOLOGY" → ANTH 120 Cultural
Anthropology — all 40 witnesses were cultural-anthro courses from the dead
family).

## The gate

Before consuming a receipt, validate the **kinship** between the receipt's
subject (the remnant row) and its witnesses, using data both sides still
carry — here, titles:

```
kin-valid(witness) :=
    J(remnant_title, witness_course_title)  >= 0.5      # the witness branch
 or J(remnant_title, official_catalog_title) >= 0.5     # the official branch
```

(J = token-set Jaccard over the level-safe normalization: parentheticals
stripped, articles dropped, roman numerals → digits.)

- The **witness branch** preserves legitimate evidence-over-lexical wins:
  "Spanish 3" → SPAN 200 folds because its witnesses' own courses are titled
  "Spanish 3" — kinship is checked against the *witness*, not the target.
- The **official branch** passes remnants that simply ARE the official course
  by name, even if witness resolution fails (mojibake, renamed colleges).
- Witnesses are resolved per college from the raw claims index; college names
  match on an ASCII alnum slug (receipt mojibake — "CaÃ±ada" vs "Cañada").

Auto-decisions run on **kin-valid counts only**; the raw distribution stays on
the row (plus a `kin` map when they differ), and blocked receipts surface in
the curation worklist flagged `tm` (title-mismatch), pre-unchecked, with
all-stale groups ranked last under an explanatory banner. **Nothing is
silently dropped** — the gate only moves items from "auto" to "human".

## Why this beats the alternatives

- **Witness-count thresholds**: stale unanimity is still stale (the ×40 case).
- **Target-title similarity alone** (remnant vs descriptor): would have
  blocked the celebrated "Spanish 3" → SPAN 200 fold. The kinship joint is
  remnant↔witness, with remnant↔official as a fallback — not remnant↔target
  as a requirement.
- **Distrusting all single-witness receipts**: would unfold 174 legitimate
  grandfathered folds; the gate instead checks each receipt's content.

## Measure-first numbers (2026-06-11)

`kb/_analyze_witness_kinship.py`: 1,635 evidence edges → 848 kept, 781
blocked (450 at J=0.0), 6 mixed; 565 of 1,155 live folds unfolded — every
sampled block a true chimera; all 7 SPAN folds kept; 1 *new* fold unlocked
(SOCI M1023: one chimera witness had been diluting 3 real witnesses into a
75% "conflict"). Borderline band (J 0.3–0.5, 61 edges) eyeballed: correct
blocks except a handful of semantic synonyms ("Multivariate"≈"Multivariable")
— which is curator-confirm material, not auto material.

## The reusable checklist

When a rule consumes event-time receipts:

1. Ask: *can the entity behind the key change without the key changing?*
   (splits, partial folds, member churn). If yes, mode-2 decay applies.
2. Find a field both the receipt's subject and its witnesses still carry
   (title, description, units…) and gate on agreement.
3. **Measure the gate against current behavior before shipping** — count
   kept/blocked/changed, eyeball the blocked list AND the borderline band,
   and confirm the celebrated past wins survive.
4. Blocked ≠ deleted: route to the human lane with the reason visible.
5. Commit the analyzer — the next receipt-consuming rule will need it.
