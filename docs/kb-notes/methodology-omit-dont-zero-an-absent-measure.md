---
title: Omit, don't zero, a measure your source didn't supply
created: 2026-08-01
updated: 2026-08-12
tags: [methodology, data-pipeline, funding, measurement, ui, my-college]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-default-payout-masks-the-gap-beneath-it]]"
artifacts:
  - funding/_build_funding_performance.py
  - tests/cpl_funding_applied.test.js
  - cpl_funding.js
---

# Omit, don't zero, a measure your source didn't supply

> **One-sentence summary** — when a producer can't compute a metric because the
> source didn't carry the column, emit *no key at all*; a key present with the
> value `0` is a measured claim of "none", and downstream consumers act on it.

## Context

The funding actuals producer emits per-college counts and unit sums from the MAP
`View_StudentAggregatedValues` pull. Adding an `Applied Credits` measure raised
a question with a non-obvious answer: what should the artifact contain on a day
the pull *doesn't* carry that column?

The tempting answer — initialise the accumulator to `0` and let it fall through —
is the dangerous one.

## The claim

**A zero and an absence are different claims, and consumers reasonably treat
them differently.** In this consumer:

```js
if (!rec || rec[meas.src] == null) {
  // Feed published, no value for this college: it has posted nothing → $0
  // earned (this is the incentive).
  return { f: 0, status: "none" };
}
```

A *present* `0` says "we looked, and this college did none." An *absent* key can
be distinguished and handled as "we didn't look." Emitting zeros for a column we
never requested would have made every college in the state read as having posted
nothing — and in a funding model, that is not a cosmetic difference: it is every
college earning $0 off a producer-side omission nobody would see.

So the producer builds its metric tuple conditionally and says so out loud:

```python
has_applied = i_acr is not None
metrics = ("pe", "pa", "p2", "p3", "pp") if has_applied else ("pe", "p2", "p3", "pp")
if not has_applied:
    print("funding-performance: NOTE — 'Applied Credits' not in this pull; "
          "pa/pa_u omitted (not zeroed).")
```

**Corollary — the guard belongs in the test suite, not the docstring.** The
failure is invisible in review (a `0` looks like data) and invisible at runtime
(the artifact is well-formed). The assertion that earns its keep is the negative
one: *the key is absent*, not *the key is zero*.

```js
check("pa key is ABSENT, not 0 — a present zero would pay every college $0",
  !("pa" in al));
```

## How we got here

Adding `pa`/`pa_u` to `funding/_build_funding_performance.py` (2026-08-01) after
Sam's call to score Priority 1 on *applied* rather than *eligible* CPL units. The
column already existed in the view we read, so the happy path was trivial; the
whole design cost was in the absent-column path.

This is the mirror image of
[`methodology-a-default-payout-masks-the-gap-beneath-it`](methodology-a-default-payout-masks-the-gap-beneath-it.md).
That note is about a missing measure silently paying **full cap**; this one is
about a missing measure silently paying **zero**. Same root cause — a default
standing in for "we don't know" — opposite direction, and both are invisible
until someone reconciles a number by hand. Whenever you add a metric, ask what
its absence pays, in *both* directions.

## Extension, 2026-08-03 — there are THREE kinds of zero, not two

The note above separates *absent* from *measured zero*. Production turned up a
third, and all three were rendering identically as `$0`:

| state | in the artifact | means | count (2026-08-03) |
|---|---|---|---:|
| **absent** | key missing / no row | we did not measure — the college has not implemented | 9 |
| **withheld** | `null` + `*_suppressed: true` | we DID measure; privacy floor (<5 students) hides it | 4 |
| **measured zero** | `0` | the college did the thing zero times | 16 |

The middle state is the dangerous one, because it is the only one where the
system **knows the college acted and pays it nothing anyway.** Four colleges had
applied CPL credit for 1–4 students and earned $0 on that priority — not because
they did nothing, but because the privacy rule that protects those students also
erases the evidence they exist.

That is not obviously wrong (blind-crediting a hidden cell is its own hazard —
it pays for an unverifiable claim), but it must be a **decision**, not a
side effect of the suppression rule. The failure mode is that nobody ever
notices, because a withheld cell and an unearned cell look the same on screen
and in the ledger.

**The rule this generalises to:** whenever a privacy/suppression layer sits
between a measurement and a consequence, enumerate what the suppressed state
*costs* the subject. If suppression can only ever hurt, it has quietly become a
penalty for being small.

**And when reporting:** never fold the three states into one bucket in prose.
"29 colleges earned nothing" is true and useless; "9 haven't started, 4 are
hidden by the privacy floor, 16 have credit they haven't acted on" is three
different conversations with three different owners.

## When this applies (and when it doesn't)

Applies wherever a producer writes an artifact that a consumer reads by key
lookup, and the consumer distinguishes "no value" from "zero value" — funding
models, scorecards, compliance marks, anything where an absence should read as
*pending* rather than *failed*.

Does **not** apply where zero genuinely is the identity element and the consumer
sums rather than branches (a running total, a histogram bucket). There, an
absent key just forces every reader to write `|| 0` and you have traded one
hazard for boilerplate.

It also does not license absent keys as a general style: prefer explicit
`null` + a `*_suppressed`-style flag when you *did* look and are withholding for
another reason (privacy, small cells). Absence should mean **we did not
measure**, and nothing else.

## The render-side inverse: absence read as an ACHIEVEMENT (2026-08-12)

The producer-side rule above stops an absence becoming a **zero**. On the
consumer side the same confusion has a second, worse form: an absence becoming
**praise**.

My College told Imperial Valley College:

> **Nothing is waiting.** Every credit recommendation with an articulated
> exhibit behind it has been acted on. That is a finished queue, not a missing
> measurement.

Imperial Valley has three CPL students and **no rows in the credit summary at
all**. Nothing had been acted on; nothing had been measured. The copy was
written for the genuinely-good case — 33 of 106 colleges really have cleared
theirs — and the branch that produced it could not tell "we looked and found
none" from "there was nothing to look at":

```js
if (!detail || !detail.waiting) return null;
if (!rows.length) return { empty: true, total: 0, groups: [] };   // ← both land here
```

The fix is a third state, not a reworded second one:

```js
if (!summary) return { unmeasured: true };   // no credit-summary row = nothing recorded
if (!rows.length) return { empty: true, … }; // a real, measured zero
```

Two things generalise:

1. **Congratulatory copy needs a stricter guard than neutral copy.** "0 units"
   is merely wrong when the truth is unknown; "you have finished" is wrong *and*
   tells someone to stop working. The more the sentence rewards the reader, the
   more certain the branch behind it has to be.
2. **Adding a state means auditing every `if` that tested for its absence.** The
   new `unmeasured` flag fell straight through `if (wb && !wb.suppressed &&
   !wb.empty)` into the branch that expects grouped rows, and threw. Caught by
   rendering the page; nothing else would have.

## See also

- `[[docs/cpl_funding_lessons]]` — the 2026-08-01 section
- `[[docs/kb-notes/methodology-a-default-payout-masks-the-gap-beneath-it]]` — the full-cap twin
- PR `#964` — the implementation + `tests/cpl_funding_applied.test.js`
- PR `#1128` — the render-side inverse (`waitingBreakdown()` `unmeasured` state)

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
