---
title: "CR/NC mirror re-adjudication — the 296 hard cases + the hardened detector"
date: 2026-07-12
tags: [ccr, crnc, mirror, credit-by-exam, doctrine, readjudication]
kb-status: internal
---

# CR/NC mirror re-adjudication (Doctrine v0.3, Q-CREDITNC)

After Sam's Credit-by-Exam ruling resolved Q-CREDITNC, the 707 wave-1–3
`split_candidate` flags were revisited. The **same-college** CR/NC pairs are
settled mechanically by `kb/_detect_crnc_mirrors.py`. The **296 harder
cross-college** cases were re-adjudicated per-item by agents reading real
memberships, with skeptics guarding the *new* risk (now that we bless mirrors,
we must not dissolve a real over-merge).

## The 296 cross-college cases

| Call | N | Meaning |
|---|---|---|
| **genuine_split** | **230** | real over-merge — different courses across bands; D-3 split stands |
| **mirror_keep** | **54** | distributed CR/NC mirror family — keep as one CPL pairing |
| needs_curator | 12 | faculty call |

**Skeptics: 230 genuine_split checked → 229 upheld, 1 refuted** (`CSIS M1459`,
flipped to mirror). So the "these are real over-merges" calls are solid — the
mirror carve-out did **not** cause us to under-split.

## The detector got hardened (this is why the count moved)

The verify pass caught that the first detector matched on **exact subject**,
which both over-counted (same subject, *different* course numbers = different
courses) and under-counted (missed the CA noncredit-mirror conventions:
`ASL 5` ⟷ `ASL 305` +prefix numbering; `VFPA 206B` ⟷ `DNCE 206B` umbrella
subject; `B1B` ⟷ `B1BNC` suffix). The matcher is now **course-number-aware**
(the credit core is a suffix/substring of the NC core) with NC-subject-variant
handling. Catalog-wide counts:

| Class | Naive (subject-exact) | Hardened (number-aware) |
|---|---|---|
| **mirror** (D-3 suppress) | 1,337 | **968** (957 + 11 agent-confirmed) |
| partial_mirror (curator) | 200 | 143 |
| band_mix (split stands) | 1,299 | 1,725 |

Reconciliation against the 296 agent judgments: the hardened detector agrees on
**97% of splits** (222/230 → band_mix) and **~85% of mirrors** (44/52 non-curator
→ mirror). The 11 cross-college mirrors the detector still couldn't reach
mechanically are folded into `kb/crnc_mirrors.json` from the agent
re-adjudication (`_source: agent_readjudication`).

## Artifacts
- `kb/crnc_out/2026-07-12/readjudication.json` — the 296 verdicts + skeptic
  results + detector-verify notes + reconciliation.
- `kb/crnc_mirrors.json` — the authoritative per-identity marker (968 mirrors),
  consumed by the generator (🔁 chip) and available to the auditor.

## Next
- Wire `crnc_mirrors.json` into `kb/_row_audit.py` so D-3 `credit_mixed` is
  suppressed for the 968 mirrors (stops wave 4+ re-flagging).
- The **consolidation** pass (Sam's follow-up): the same mirrored course across
  N colleges still merges to ONE canonical CR/NC pair — that's a separate
  curated merge, not covered here (this run only re-classified split-vs-keep).
