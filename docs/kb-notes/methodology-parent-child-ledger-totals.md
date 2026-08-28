---
title: In a parent/child ledger, totals sum PARENT rows only
created: 2026-07-30
kb-status: published
tags: [methodology, ledger, budget, data-modeling, double-counting, invariants]
artifacts:
  - budget_ledger.js (rowTotal / totalOf — the rendering rule)
  - excel_to_dashboard.py (build_budget_from_supabase — the read-path rule)
  - tests/budget_ledger.test.js · tests/budget_ledger_structure_test.py
  - kb/supabase_budget_structure.sql (the receipt, incl. the verification block)
related:
  - "[[docs/kb-notes/methodology-recompute-a-sources-own-summary-statistics]]"
  - "[[docs/cpl_funding_lessons]]"
---

# In a parent/child ledger, totals sum PARENT rows only

The moment a financial table gains hierarchy — a budget line that expands to the
projects it funds, an appropriation that expands to its allocations — it gains a
failure mode that is **silent, plausible, and produces a number people quote**:

> Σ(all rows) double-counts every parent, because the children already *are* the
> parent.

A child row is **detail**, never **addend**. The only correct total is over rows
with no parent.

```js
function totalOf(rows) {
  return rows.filter(r => r.parent_id == null)
             .reduce((s, r) => s + rowTotal(r), 0);
}
```

## This is not a hypothetical — it is the default outcome

In a single day of work on one CPL budget, this exact shape appeared **three
times**, in three independently-authored artifacts:

1. **A Sept-2026 BOG budget amendment** (a board document) totalled
   `$35M + $18M project subtotal + $21M ongoing = $74,000,000`. But that $18M was
   itself `$8,959,692` of the $35M plus `$9,040,308` of a separate $15M. It
   double-counted the former and omitted the $5,959,692 of the latter already
   spent: `+8,959,692 − 5,959,692 = +3,000,000` exactly. The true total was
   **$71,000,000**.
2. **A UI mockup** built to *explain* that error listed the project pool *and*
   the appropriation shares it comes from — reproducing it.
3. **The seeded database** built after both: summing all archived rows gave
   `23,307,440` where parents-only gave `17,307,440` — the $6M counted twice.

Knowing about the trap does not protect you from it. Only an enforced invariant
does.

## Why it is so easy to hit

The subtotal is *genuinely useful* — "our projects come to $18M" is a real fact
someone needs. It earns a row. Once it is a row in the same table as its own
sources, any naive `SUM()` over that table is wrong, and the wrongness looks
like a plausible number rather than an obvious error.

The tell is structural, not numerical: **a "total" line whose components live at
two different levels of the same tree.**

## Enforce it in three places

One place is not enough, because each surface can total independently.

| Layer | What it enforces |
|---|---|
| **Read path** | the server-side reshape filters to `parent_id is null` before any sum |
| **Renderer** | every footer sums parents only, from the same helper |
| **Tests** | assert both the correct total *and* that the naive sum is larger |

That third assertion is the one that matters most. Asserting only "the pool
totals $18M" passes even if the code accidentally sums parents only by luck.
Asserting *also* that `Σ(all rows) > Σ(parents)` proves the two paths are
genuinely different and that you took the right one:

```js
check("pool total sums parents only", totalOf(pool) === 18000000);
check("summing parents+children would double-count",
      pool.reduce((s, r) => s + rowTotal(r), 0) > 18000000);
```

## The companion rule: a computed total is a defect detector

Where a row has a year-by-year breakdown, compute `total = Σ years` and render it
**read-only**. Where the source document genuinely gives no per-year split, the
stored total is the only real figure and stays editable.

This is worth doing for correctness — a total can never drift from its own
years — but its *bigger* payoff is diagnostic. Switching one budget to computed
totals immediately surfaced a source row that had been quietly carrying its own
**spend schedule** in the out-years alongside the appropriation in year one; it
would have rendered `$24,040,307` for a `$15,000,000` appropriation. Nobody had
noticed, because the stored `total` said the right thing and masked it.

Two lessons fall out:

- **A source row carries the appropriation once** — never the appropriation
  *plus* its own spend plan. Sources and uses are different tables of the same
  money; putting both in one row guarantees a wrong sum somewhere.
- **After any bulk edit, re-run the drift check** — `Σ years == total` for every
  row that has years. It is one query and it catches an entire class of quiet
  corruption:

```sql
select id, name, sum_years, total
  from (...) t
 where sum_years <> 0 and sum_years <> total;   -- must return zero rows
```

## Where else this applies

Anywhere a hierarchy shares a table with its own rollup: workplan activities and
their projects, credential clusters and their members, program pools and their
grants. The question to ask of any total is not "is this number right?" but
**"which level of the tree did this sum, and does that level contain its own
children?"**
