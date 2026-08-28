---
title: "When two source tabs disagree, neither is authoritative — get the certified value"
created: 2026-07-15
kb-status: published
tags: [methodology, data-integrity, source-of-truth, cip, curation, reconciliation]
artifacts:
  - kb/reference/cip_cte_certified_260715.json
  - docs/cip_prototype/README.md
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[methodology-verify-consumer-before-migrating]]"
---

# When two source tabs disagree, neither is authoritative

## The pattern

A single source file (here, the CO's CIP Searchable workbook) carried the **same
attribute in two tabs** — the CTE designation appeared in both the *CIP Descriptions*
tab and the *TOP-CIP Data* (crosswalk) tab. They **disagreed on 244 of 2,144 codes
(~11%)**. The tempting move is to declare one tab "the good one" and use it. That is
wrong here, and the failure is instructive.

## Why "just pick the better tab" fails

The disagreement ran in **both directions**:

| CIP | CIP Descriptions tab | Crosswalk tab | Certified (correct) |
|---|---|---|---|
| 45.0702 | Not CTE | **Both** ✓ | Both |
| 45.0199 | **Both** ✓ | Not CTE | Both |

For one code the crosswalk tab was right; for the next, the *other* tab was right.
No single-tab rule reproduces the correct answers. The consultant's own framing
("trust the crosswalk, Descriptions is stale") was *almost* right but not a safe
rule — even the newest cut's crosswalk tab still had 45.0199 wrong.

## The rule

**When two authoritative-looking copies of a field disagree, treat BOTH as
unreliable for the conflicting rows and obtain the human-certified value.** Don't
average, don't pick a tab, don't guess a heuristic. Steps that worked:

1. **Surface the conflicts as a list** (the 244-row discrepancy CSV) and hand it to
   the data owner — that list *is* the reconciliation ask.
2. **Store the certified answer as its own artifact** keyed by the stable id
   (`kb/reference/cip_cte_certified_260715.json`: `{CIP → certified label}`), not
   as an edit buried in a regenerated file. It's the override the pipeline applies.
3. **Prove closure:** after applying certified overrides + the agreed value
   elsewhere, re-scan for *uncertified* conflicts. Target: **0**. (We hit 0.)
4. **Single source of truth going forward:** pull the field from **one** certified
   source, so there's no second copy to drift. A live tool reading one source makes
   the two-tabs-disagree failure structurally impossible — which is itself a strong
   argument for "one dashboard link, not a multi-tab spreadsheet."

## Corollary — normalize ids before matching

The certified list came back with Excel-mangled codes (`1`, `1.0299`, `45.0199`) vs.
the workbook's `01.0000` / `01.0299`. Canonicalize both sides
(`family.zfill(2) + "." + decimal.ljust(4,"0")`) before joining, and **verify the
match count** (244/244) — a silent 0-overlap join from a format mismatch looks like
"no conflicts" when it's really "no matches."
