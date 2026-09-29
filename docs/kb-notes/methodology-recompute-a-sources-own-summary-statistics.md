---
title: Recompute a source's own summary statistics from its line items
created: 2026-07-30
kb-status: published
tags: [methodology, reconciliation, data-quality, funding, audit]
artifacts:
  - cpl_funding_data.js (pool block + provenance header)
  - tests/cpl_funding.test.js (Part R — each pool line pinned to a workbook line)
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-conflicting-source-tabs-use-certified-value]]"
  - "[[docs/kb-notes/methodology-achievement-based-funding-cap-and-earn]]"
---

# Recompute a source's own summary statistics from its line items

When an authoritative document (a budget amendment, a board packet, a grant
workbook) states **both** line items **and** summary statistics — a total, an
average, a min/max, a per-unit rate — recompute every summary from the line
items before adopting any of it.

Two things fall out, and both are worth the ten minutes:

1. **Where they agree**, you have verified the document rather than trusted it.
2. **Where they disagree**, the *pattern* of disagreement localizes the error —
   usually to a specific denominator, a double-counted subtotal, or a figure
   copied from a different model run.

## Why summaries fail more often than line items

Line items get reviewed; summaries get typed once and carried forward. A
summary is also where two *different* mental models silently merge — one
person's average over N recipients sitting beside another's maximum computed
over M. Nothing in the spreadsheet complains, because each figure is
individually defensible.

## The two failure shapes to look for

**Double-counted subtotal.** A grand total that sums a top-level figure *and*
a subtotal derived from slices of it.

> A CPL amendment's "Total All CPL Initiative Funding **$74,000,000**" summed
> `$35M one-time + $18M project-available + $21M ongoing`. But that $18M was
> itself `$8,959,692` (a slice of the $35M) + `$9,040,308` (a slice of a
> separate $15M): it double-counted the former and omitted the $5,959,692 of
> the latter already spent. `+8,959,692 − 5,959,692 = +3,000,000`, exactly —
> and that exactness is the confirmation. True total: **$71,000,000**.

The diagnostic: when the discrepancy resolves to a round number and you can
name *both* the double-count and the omission that produce it, you have the
error, not a rounding artifact.

**Mismatched denominators across statistics.** Two summaries computed over
different populations.

> The same amendment printed `Avg Award $212,103 · Min $150,000 · Max $665,971`
> over a pool of $25,240,308. The average is that pool ÷ **119** institutions.
> The maximum is only reproducible if **115** share it ($665,791 — the printed
> figure is a digit transposition). So the header paired a 119-recipient
> average with a 115-recipient maximum, and *which* was intended decided
> roughly $2M of policy.

The diagnostic: solve for the input each statistic implies. If the min is a
policy floor, it also *pins* a parameter — here, ruling out "they just used a
different floor" (the floor yielding $665,971 over 119 is $128,631,
contradicting the printed $150,000 minimum).

## Build the recomputation as an instrument, not a one-off

Port the allocation/derivation logic and **validate it against figures the
source already publishes** before using it to judge anything. In the CPL case a
Python port of `allocModel()` reproduced three published values exactly
(avg $228,177 / min $150,000 / max $694,273). Only *then* was it trustworthy
enough to say a board document was wrong — and that validation is the whole
difference between an audit finding and an accusation.

## The trap: a reconciliation that assumes its own conclusion

Before reading the source, a bridge appeared to prove two documents agreed to
**$1**:

```
tab   admin 1,200,000 + P&I 6,559,693 + feeder 1,000,000 + rural 1,000,000 = 9,759,693
amdt  admin   800,000 + P&I 8,959,692                                      = 9,759,692
```

The arithmetic was correct and the conclusion was wrong. It compared the tab's
**main pool** (net of two $1M carve-outs) against the amendment's
**institution total** — different quantities. The identity only holds *if you
already accept* that the carve-outs are project money, which was precisely the
open question. On what actually reached institutions the documents differed by
**$1,999,999** — the two carve-outs.

**Rules of thumb:**

- Before declaring two sources reconciled, say out loud *which quantity* each
  number measures. A tie-out between differently-scoped quantities is not a
  tie-out.
- A near-exact agreement between independently-authored documents is more
  likely a definitional artifact than a coincidence — treat it as a clue about
  shared derivation, never as proof of agreement.
- A large round gap sitting beside a suspiciously small one is the thing to
  **explain**, not to net out.

## Then pin it

Once the authority is settled, encode the tie-out as tests where each asserted
constant traces to a named line in the source document, so a later edit that
stops reconciling fails loudly instead of drifting. Assert *relationships*
derived from the model (conservation, floors binding, a minority floored)
rather than literals — pool-dependent literals rot the moment the pool moves.
