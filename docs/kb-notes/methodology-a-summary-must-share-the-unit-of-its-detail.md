---
title: A summary surface must share the unit of the detail it summarises
created: 2026-08-01
updated: 2026-08-01
tags: [methodology, testing, ui, funding, measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_cpl_ftes.test.js
---

# A summary surface must share the unit of the detail it summarises

> **One-sentence summary** — when a value and its target are computed at
> different sites, a test that asserts each side independently will pass while
> the two disagree by a conversion factor; assert the *relationship*.

## Context

The Implementation Funding tab converts raw units into CPL FTES (÷30 semester,
÷45 quarter). The per-college cells did the conversion. Three *summary*
surfaces above them did not — and every one of them read as fact on the live
page:

| surface | rendered | should have read |
|---|---|---|
| priority card, actual | "Actual **1,354,527 students** — **193,700%** of target" | 45,150.9 CPL FTES — 6,456% |
| priority card, target | "$73.90 per student → **699 students** (0.028% of headcount)" | Target 699.3 **CPL FTES** |
| college table, SYSTEM row | header *Credit FTES*, row beneath it **2,517,685** (a headcount) | 1,069,182 credit FTES |

This was the fourth, fifth and sixth instance of the same defect in one
workstream (PRs #960, #961, #962 fixed the first three).

## The claim

**Unit disagreement between a detail view and its summary is a structurally
recurring defect, and the usual test shape cannot see it.** The tests in place
asserted that the actual was rendered, and that the target was rendered. Both
were true. Nothing asserted that they were *in the same unit*, so a 30×
divergence sat in production behind a green suite.

Three practices follow:

**1. Assert the relationship, from the surface's own numbers.** Don't compare a
rendered value to a literal you computed in the test — recompute the stated
percentage from the two numbers the surface itself prints:

```js
const m = prio.join(" ").match(/Target ([\d,.]+) CPL FTES[\s\S]*?Actual ([\d,.]+) CPL FTES[^%]*?— ([\d.]+)% of target/);
check("% of target = actual ÷ target on the card's OWN two numbers",
  !!m && Math.abs(num(m[3]) - (num(m[2]) / num(m[1])) * 100) < 1);
```

If the surface is internally consistent it passes regardless of the data; if it
mixes units it fails no matter how plausible each number looks alone.

**2. A total must be in the units of the column it tops.** The SYSTEM row's
figure sat directly under a "Credit FTES" header while holding a headcount. A
wrong total is worse than no total: it invites the reader to add up the column,
and it will never reconcile. Assert the *wrong* unit is absent, not merely that
some total is present.

**3. Count the sites before you fix one.** When a conversion is open-coded, the
question is never "is this site right" but "how many sites are there". Here,
`prioTarget()` was introduced in #960 precisely to collapse five open-coded
target computations into one seam — and three *display* sites still computed
their own actual. A seam that covers the model but not the surfaces that
describe it is a half-seam.

## How we got here

Sam flagged the priority-card numbers as "way too high" (2026-07-31). They were,
by exactly the units-per-FTES divisor. The per-college cells had been correct all
along because they route through `earnFraction`/`toActual`; the summary cards
read `pf.statewide[meas.src]` raw. Fixed in PR #964 with the relationship
assertions above.

The SYSTEM-row instance was caught only by rendering the page in real Chromium
and reading the table header next to its own total — not by the suite, and not
by reading the diff.

## When this applies (and when it doesn't)

Applies to any UI where a detail grain and a rollup grain are computed by
different code paths: dashboards, scorecards, report headers, CSV footers,
"N of M" chips. The risk scales with how *plausible* the wrong number looks —
a 30× error in a five-figure quantity reads as "a big number", which is why it
survived review three times.

Does not apply where the summary is literally `sum(details)` in the same
function; there the shared unit is structural and the assertion is redundant.
The hazard is specifically **a second computation of the same quantity**.

## See also

- `[[docs/cpl_funding_lessons]]` — the 2026-08-01 section
- PRs `#960` / `#961` / `#962` — instances one through three; `#964` — four through six
- `[[docs/kb-notes/methodology-commit-the-test-harness]]` — guard the failure mode, not the feature

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
