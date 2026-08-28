---
title: "Methodology — recompute a document's figures from the live engine, don't copy them"
kb-status: published
created: 2026-08-05
updated: 2026-08-05
tags: [methodology, reconciliation, budget, funding, board-docs, verification]
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-summary-must-share-the-unit-of-its-detail]]"
---

## The claim

When a human-authored document (a Board packet, a memo, a workbook) cites a number
that **your system also derives**, that number is a **claim to verify**, not a source
to copy. Recompute it from the live engine, reconcile the delta, and hand back the
corrected figure. Hand-typed headers and cross-cut subtotals drift silently.

## Why (two live examples, same day)

Reconciling Sam's revised Sep-2026 BOG amendment workbook against the funding model,
two figures the workbook *stated* were both wrong — and both were reproducible only by
recomputing:

1. **The $74M grand total was a $3M double-count.** The cell was `=E2+E9+E10`: the $35M
   pot, **plus** the $18M "Project Available Funding" cross-cut, plus $21M ongoing. But
   the $18M *re-slices* money already in the $35M ($8,959,692) and the $15M ($9,040,308) —
   it is not a fourth pot. Summing it double-counts the $8.96M already inside the $35M and
   omits the $5.96M spent slice of the $15M. Net **+$3M**. True total = the three distinct
   pots, $35M + $15M + $21M = **$71M**. A cross-cut subtotal added to the totals it is
   drawn from is the classic double-count; the tell is a "memo" line that shares dollars
   with a line above it.

2. **The "Max Award $665,971" was ~$144K stale.** Recomputed from the live model
   (`awardStats()` over the 115 colleges), the real max is **$522,239 (Mt. San Antonio)**.
   The header value predated two model changes it never caught up with (the $1M NC feeder +
   $1M rural carve-outs, and the credit-FTES basis switch). The dashboard *already* showed
   $522,239 — it computes live; only the workbook text was frozen.

Both were invisible to a read-through. Only recomputation surfaced them.

## How

- **Find every figure the document shares with your system** — pool totals, per-recipient
  averages, min/max, counts. Those are the ones to recompute.
- **Recompute from the authoritative engine, not a re-derivation of the document's own
  arithmetic.** Boot the real model with the real data (here: jsdom + `CPL_FUNDING_NO_REMOTE`,
  then `awardStats()` / `_alloc()` over the roster). A number that only reconciles against
  the document's *own* internal formula proves nothing.
- **Check the denominator.** The award "average" divided the full institution total by
  **119** recipients (115 colleges + 4 NC) while the "max" was a **115**-college figure —
  two different recipient sets in one line. And the 4 NC campuses aren't floored, so
  **Calbright's $33,134 is below the $150K college floor**: a blended 119-recipient Min is
  dishonest. Report the groups on their own bases (split the line).
- **Reconcile the delta out loud.** Say *where* it diverges and *why* (a stale basis, a
  double-counted cross-cut, a mixed denominator) — not just the corrected number. The "why"
  is what stops it recurring.

## When it applies

Any time you're asked to "check" or "reconcile" a spreadsheet / report / packet against a
system you own. Especially before anything goes to a Board or a legislature, where a
citable-but-wrong figure ($665,971 a college could point to) is worse than a gap.

## Anti-pattern

Reading the document for internal consistency and stopping there. A workbook can be
perfectly self-consistent (`=E2+E9+E10` computes exactly what it says) and still wrong,
because the error is in *what it chose to sum*, not the arithmetic.
