---
title: An opportunity figure must be what peers ACHIEVED, not what the record allows
created: 2026-08-17
updated: 2026-08-17
tags: [methodology, kb-note, eacr, adoption, metrics, exports, credibility]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - excel_to_dashboard.py
  - tests/eacr_matrix_payload_test.py
related:
  - "[[methodology-a-filter-and-what-justifies-it-must-share-one-source]]"
  - "[[eacr_scope_lessons]]"
---

# An opportunity figure must be what peers ACHIEVED, not what the record allows

## The rule

When a view tells an institution *"here is what you could still get"*, that number
must be **what comparable institutions actually obtained**, never the maximum the
underlying record permits. The permitted maximum is almost always reachable by
nobody, and publishing it converts a helpful prompt into a promise you cannot keep.

## Where it came from

The EACR matrix sub-tab (2026-08-17) renders a cell per (credential × college):
green for units a college has articulated, brown for units still available. Sam's
framing was natural and, on its face, obviously right — brown is *the credit this
credential carries that you have not claimed*.

The credential's own recommendation lines are right there in the payload, so the
brown number looks like a subtraction: `rec_units_total − adopter_units`.

Measured before building, over the live peer data:

| | |
|---|---:|
| adoptions that are **partial** | **83%** |
| recommendation lines a college typically claims | **3.07 of 9.26** |
| colleges that have ever claimed the full line total | **0** |

Per credential, the best adopter in California reaches only **20–80%** of the line
total, and the median adopter far less:

| Credential | Line total | Median adopter | Best in state |
|---|---:|---:|---:|
| AP Biology | 36.0 | 4.0 | 12.0 |
| CompTIA A+ | 54.0 | 3.0 | 11.0 |
| POST Basic Academy | 135.0 | 63.0 | 108.0 |
| ASE A1 — Engine Repair | 23.0 | 3.0 | 7.0 |

A brown `36.0` against AP Biology would have told a college it could obtain roughly
**three times** what the strongest college in the state has ever obtained.

## Why the maximum is unreachable (and stays unreachable)

This is structural, not a tuning problem:

- **Recommendation lines are frequently alternatives, not addends.** A credential
  may publish several routes to the same credit; a college picks one.
- **The freehand recommendation vocabulary is not deduplicated.** The Common CR
  Reference workstream exists precisely because ~2,344 distinct strings describe a
  much smaller set of real recommendations, so a naive sum double-counts.
- **A college articulates against courses it actually teaches.** Nobody teaches the
  whole surface of a large credential.

So "sum every line" is not a slightly-optimistic estimate that better data would
fix. It is a different quantity, and it has no institution behind it.

## The consequence that makes this a rule rather than a preference

The number does not stay on the screen. In this repo the adoption view feeds an
Excel export, a JSON export and a Word report — **the layer that reaches a college
by email**, with no memory of which toggle produced it. A screen figure that
overstates is embarrassing; a spreadsheet figure that overstates is a commitment
someone forwards to a dean.

This is the same failure family as
[`methodology-a-filter-and-what-justifies-it-must-share-one-source`](methodology-a-filter-and-what-justifies-it-must-share-one-source.md):
the export outlives the screen that produced it.

## What to publish instead

**The peer benchmark** — the median of what adopting institutions actually obtained,
with the max available alongside. It is:

- **a fact**, not a projection — every input is an articulation that exists;
- **actionable** — *"peers here average 4 units; you have 0"* is a defensible ask;
- **honest about spread** — publishing median *and* max shows the ceiling without
  claiming it.

Use the **median**, not the mean: a single institution that articulated an unusually
deep set would drag a mean upward, and the figure is shown to *other* institutions as
"what people like you get".

## The bonus finding

Framing brown as a peer gap exposes something the "who hasn't adopted" framing hides
completely: **among colleges that HAVE adopted, roughly two-thirds of the available
recommendation lines are still unclaimed.** The partial adopters are a larger and
more tractable opportunity than the non-adopters, and no view had ever shown it.

## Test for this

The guard is a one-line invariant, and it belongs in the harness:

```python
check("peer median is BELOW the line total",
      e["peer_units_median"] < e["rec_units_total"],
      "the whole reason the brown number is not rec_units_total")
```

## Generalisation

Whenever a view computes *"headroom"*, *"potential"*, *"opportunity"* or *"gap"*, ask
which of two quantities it is:

1. **what the record permits** — cheap to compute, usually unreachable, unsafe to publish;
2. **what comparable actors achieved** — needs a peer cohort, and is the only one that
   survives being forwarded.

If they differ by more than a little, (1) is not an approximation of (2). Measure the
distribution before choosing, and ship the denominator or the max alongside so the
reader can see the ceiling without being promised it.
