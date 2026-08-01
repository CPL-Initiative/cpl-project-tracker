---
title: Omit, don't zero, a measure your source didn't supply
created: 2026-08-01
updated: 2026-08-01
tags: [methodology, data-pipeline, funding, measurement]
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

## See also

- `[[docs/cpl_funding_lessons]]` — the 2026-08-01 section
- `[[docs/kb-notes/methodology-a-default-payout-masks-the-gap-beneath-it]]` — the full-cap twin
- PR `#964` — the implementation + `tests/cpl_funding_applied.test.js`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
