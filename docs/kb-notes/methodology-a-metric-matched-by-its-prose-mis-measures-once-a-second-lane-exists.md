---
title: A metric matched by its prose mis-measures the moment a second lane exists
created: 2026-08-26
updated: 2026-08-26
tags: [methodology, cpl-funding, measurement, noncredit, false-measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[methodology-a-default-payout-masks-the-gap-beneath-it]]"
artifacts:
  - cpl_funding.js
---

# A metric matched by its prose mis-measures the moment a second lane exists

> **One-sentence summary** — resolving "which data measures this thing" by
> substring-matching the thing's human-readable label works exactly until two
> things need labels that read alike, and then it fails *silently and
> plausibly*.

## Context

The CPL Implementation Funding model decides which performance figure a priority
is measured against by reading the **words of the priority's own metric text**:

```js
1. wantsUnits && (has "portal" || has "landing page")  -> pp_u
2. wantsUnits && has "applied"                          -> pa_u
3. wantsUnits && has "eligible"                         -> pe_u
4. wantsUnits && has "transcribed"                      -> pt_u
```

That was safe while there was one set of priorities. Sam then ruled that the
**noncredit** lane should earn like credit, with three priorities measuring the
same milestones over noncredit-origin students — wording that is necessarily
near-identical to the credit lane's.

## The claim

Every proposed noncredit metric would have matched a **credit** source:

| proposed NC metric | matches | actually reads |
|---|---|---|
| "**Applied** units measured in **FTES** for students originating from … NC" | rule 2 | the college's **credit** applied units |
| "**Eligible** CPL Units … **FTES** … NC" | rule 3 | **credit** eligible units |
| "**Transcribed** CPL Units … **FTES** … NC" | rule 4 | **credit** transcribed units |

And in the case the design most wants — a noncredit metric naming the **NC
landing page**, which is the whole routing incentive — rule 1 matches **first**
and reads portal-origin *transcribed* CPL: wrong lane *and* wrong milestone.

The result is not a blank. It is real numbers, believable percentages, and
noncredit money paid on credit activity, with nothing on screen saying so.

## Why this is worse than the failure it resembles

The same file already records a near-miss in the same mechanism, pointing the
other way: when the curator retyped P1 as *"Applied CPL Units as FTES"*, it
matched nothing, fell through to `{}`, and silently paid every college its full
cap — see `methodology-a-default-payout-masks-the-gap-beneath-it`.

A **fall-through** pays everyone in full, which is at least uniform and was
eventually noticed. A **mis-match** pays a lane on another lane's results and
looks completely normal. **A false measurement beats a visible gap** — and not
in the good way.

## The load-bearing assumption it invalidated

The argument for building the noncredit earning structure immediately was that
it would be a **money no-op**: with no origination data, `measurability()` would
return `{}`, `earnFraction()` would return `{f: 1, status: "gap"}`, and every
institution would receive exactly what it does now, labeled as an advance.

That argument was wrong, and only reading the matcher showed it. `wantsUnits(m)`
is `!has(m,"headcount") && (has(m,"ftes") || has(m,"unit"))`, so all three
strings qualify — and the first substring hit then wins.

## What to do instead

**Let the thing name its own source.** A priority should be able to carry an
explicit `src` that overrides text matching, so a noncredit priority pins
`nc_pa_u` rather than having it inferred. Then an unwired source genuinely *is*
a gap — advance at full cap, labeled — which is the honest behavior while the
upstream data is still being built.

This also closes the latent hazard on the original lane: metric text stays
curator-editable without the measure moving underneath it.

## Generalization

Inferring a record's **identity** from its human-readable **label** is a
shortcut that holds only while labels happen to be distinctive. Adding a second
category whose labels read alike does not produce an error — it produces a
confident wrong answer. If two lanes will ever describe the same measure in
similar words, the mapping belongs in a field, not in the prose.

**Check the matcher before adding the second lane, not after.** Here that check
cost one file read and happened before any code was written, which is the only
reason this is a note rather than an incident report.
