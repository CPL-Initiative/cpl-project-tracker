---
title: A label that decides behaviour is a policy switch, not a label
created: 2026-08-06
updated: 2026-08-06
tags: [methodology, config, funding, data-modelling]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js (prioUnit / prioIsFtes)
  - cpl_funding_data.js (year_priorities[].unit)
---

# A label that decides behaviour is a policy switch, not a label

> **One-sentence summary** — if code infers behaviour by pattern-matching a
> human-editable string, then editing that string silently changes the maths,
> and the person editing it has no way to know.

## Context

The Implementation Funding model scores each priority either in CPL FTES (via
the SCFF rate and a price factor) or in students (via a headcount-era
`target_rate`). For months that choice was made by **string-sniffing the metric
label**:

```js
function wantsUnits(m) { return !has(m, "headcount") && (has(m, "ftes") || has(m, "unit")); }
```

Sam's instinct — *"headcount keeps persisting despite efforts to transition away
and there must be something in the config trumping our current understanding"* —
was exactly right, and this was it.

## The claim

**A field that a curator edits as prose must not also be the switch that selects
an algorithm.** Two failures follow, and both are silent:

1. **Editing the label changes the maths.** Retitling a metric in the live
   Supabase config moved that priority off the rate/factor path onto
   `sizeOf(c) × target_rate`. Worse, `target_rate` values were *headcount-era
   percentages* — so a "5% of headcount" rate got applied to credit FTES. A
   category error, produced by a typo-level edit.
2. **Nothing displays the choice.** No surface said "this priority is scored in
   students." The only evidence was the label the curator had just changed.

The fix is an **explicit field** (`unit: "ftes" | "headcount"`), with the sniff
retained only as the seed for rows that predate it.

### The part that is easy to get wrong

Making the field explicit is not enough — **the unit is a property of the
metric, so it must resolve from the same layer as the metric.** A naive
`SCENARIO ?? SHARED ?? BASE` lookup inverts the bug: a config layer that
retitles a metric *without* declaring a unit inherits the baked one. The live
Scenario 2 does exactly that (three headcount metrics, no `unit`) and would have
been scored as FTES.

So the resolution walks layers top-down: the first layer carrying an explicit
unit wins, but a layer that sets the metric **without** a unit stops the walk and
sniffs its own text.

## How we got here

Found by reading the config after Sam insisted something was overriding our
model. The baked defaults were still entirely headcount-denominated while the
live Scenario 1 had moved to FTES — so the *fail-soft fallback* served a
different model than the tab's own explainers described. Shipped in PR #1012
with a test asserting `field == sniff` on every baked row, which makes the
migration behaviour-neutral by construction.

## When this applies (and when it doesn't)

Applies wherever a curator-editable string feeds a branch: metric labels, status
text, category names, anything read with `.includes()` or a regex to decide
control flow. **A leftover value under the new regime is part of the same
hazard** — Scenario 1's P3 still carried a `target_rate: 0.03` beneath an FTES
metric, inert only until the string changed.

Does *not* apply to strings that are purely presentational, nor to genuinely
derived values (a computed share). The test is simple: **if changing the words
changes a number, it is a switch.**

## See also

- `[[docs/cpl_funding_lessons]]` — 2026-08-06 section
- PR `#1012` — the explicit `unit` seam
- `[[methodology-omit-dont-zero-an-absent-measure]]` — the sibling rule about absent data

---

*Authoring check: durable · reusable · distilled · self-contained.*
