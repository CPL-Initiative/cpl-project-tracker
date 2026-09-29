---
title: When you can't verify an assumption, ship the oracle beside it
created: 2026-07-31
updated: 2026-07-31
tags: [methodology, data-integrity, pipeline, verification, funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-default-payout-masks-the-gap-beneath-it]]"
artifacts:
  - funding/_build_funding_performance.py
---

# When you can't verify an assumption, ship the oracle beside it

> **One-sentence summary** — If a computation rests on an assumption you cannot
> check from anything in the repo, don't pick the likelier reading and move on:
> emit a measurement of that assumption alongside the output, so the next real
> run answers it permanently and for free.

## Context

The CPL funding builder needed to start summing **units** from a per-student
feed it had only ever counted students from. Whether a plain sum was correct
depended on the source view's row grain, and the two available readings gave
**opposite** answers:

- The fetch requests dimensional columns (`Catalog Year`, `CPL Mode of Learning`,
  `CPL Type Description`) alongside the student id — the shape of a view with
  **several rows per student**, where each row is a distinct award and summing is
  right.
- The existing test fixture's only duplicate is an exact repeat of the same
  student with the same credit value — i.e. the original authors assumed
  **redundant repeats**, where summing double-counts and you must take one row.

Nothing in the repo settled it. The input is transient runner data, never
committed. A 2× error in either direction would have moved real money.

## The move

Take the **conservative** reading, then measure the assumption on every run:

1. **Pick the reducer that can only fail in one direction.** First-row-per-key
   matches the existing count semantics exactly and can only *under*-count.
   A naive sum can *over*-count, and over-paying is the worse failure.
2. **Find an independent oracle already in reach.** MAP publishes its own
   per-college credit totals in a *different* view of the same daily pull —
   parsed elsewhere in the codebase and thrown away.
3. **Emit the comparison as data, not a log line.** The artifact carries an
   `unit_crosscheck` block: our figure, theirs, and the ratio.
4. **State what each outcome would mean, in the artifact.** A ratio near 1.0
   confirms the reducer. A ratio near 2.0 says the rows are partitions and the
   reducer is dropping units. Writing the interpretation down *before* the data
   arrives is what makes the result actionable by whoever reads it next —
   including a future session with none of this context.
5. **Never let the oracle overwrite.** The two populations differ (that view
   carries no Test/Potential flags), so a small positive gap is the *expected*
   shape. Silently "correcting" to the oracle would mix populations and destroy
   the very signal you built it for.

## What it cost, and what it returned

~40 lines. On the first real run:

```
              ours          MAP's own       ratio
eligible   1,354,050       1,361,430       1.0054
transcribed  103,139         103,164       1.0002
```

Ratio **1.00, not 2.00** — the reducer is right, and the 0.5% residual is exactly
the Test/Potential rows we deliberately exclude. A question that could not be
answered from the repo at all was settled definitively by the next scheduled run,
and it stays answered: the check runs daily, so if the source view's grain ever
changes, the ratio moves and says so.

## When to reach for this

- The assumption is about **someone else's data**, so no amount of reading your
  own code will resolve it.
- The failure is **silent** — both readings produce plausible numbers.
- An independent measurement of the same quantity exists *somewhere*, even if
  it's imperfect or a slightly different population. Imperfect is fine; you are
  distinguishing 1.0 from 2.0, not auditing to the penny.

## When not to

If you *can* answer it by reading — do that instead. This is for the case where
the honest options are "guess" or "measure later," and it converts the second
into "measure automatically."

## Related

The companion failure mode is
[[docs/kb-notes/methodology-a-default-payout-masks-the-gap-beneath-it]]: a
permissive default that hides upstream breakage. Both are about the same
discipline — make the thing you're assuming *say so out loud*, rather than
trusting that it holds.

## Worked example

`funding/_build_funding_performance.py`, 2026-07-31 (PR #961): unit sums keyed to
the existing first-seen-per-(college, student) guard, with
`_load_credit_distribution()` reading `View_CreditDistributionByCollege` from the
same pull purely to report the ratio.
