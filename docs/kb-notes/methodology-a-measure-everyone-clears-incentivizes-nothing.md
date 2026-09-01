---
title: A measure everyone already clears incentivizes nothing — the same failure as one nobody can measure
created: 2026-09-01
updated: 2026-09-01
tags: [methodology, implementation-funding, outcomes-based-funding, metrics, incentives]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
  - "[[implementation-funding]]"
artifacts:
  - cpl_funding.js
  - funding/_build_funding_performance.py
---

# A measure everyone already clears incentivizes nothing

> **One-sentence summary** — An outcomes-based funding model can fail in two
> symmetrical ways, and only one of them is ever looked for: a metric nobody can
> measure pays every institution its full cap, and a metric everyone already
> exceeds does exactly the same thing — so before trusting a share, measure what
> fraction of it is actually *earned* rather than automatic.

## Context

The CPL Implementation Funding model allocates a share of funding against each
priority, earned as `min(1, actual ÷ target)` per institution. The tab already
carried a curator-facing diagnostic warning about the first failure: *"A priority
whose metric MAP cannot measure pays every college its full cap — so it earns
nothing and incentivises nothing."* Nobody had asked the mirror question.

## The claim

**`min(1, actual/target)` is symmetric, and so is the failure it hides.** An
earning fraction clamps at 1. That means:

- **actual ≈ 0** → every institution earns nothing. Visible, alarming, gets fixed.
- **actual ≫ target** → every institution earns everything. Invisible, reassuring,
  and it funds behavior that was already happening.

Both pay out without changing anyone's conduct. The second is more dangerous
precisely because the numbers look healthy: full earn reads as success.

**So the health check on an outcomes-based model is not "does the metric
resolve?" but "what is the SPREAD of earn fractions across institutions?"** A
measure doing real work has institutions above and below its bar. A measure with
everyone at 1.0, or everyone at 0.0, is a transfer, not an incentive — whatever
its share says.

**Corollary: check which rung of a funnel a measure sits on.** Upstream rungs
(eligibility, identification) tend to be large, inflated by upstream duplication,
and not an action the institution took. Downstream rungs (an award, a transcript,
a documented interaction) are smaller, harder, and institution-controlled. A
share parked on an upstream rung will read as generously funded and buy nothing.

## How we got here

Measured on 2026-09-01 by booting the live model against the live performance
feed and computing each institution's earn fraction per priority, then summing
`cap × fraction`:

| Measure | Rung | Cap | Earned | At full earn |
|---|---|---:|---:|---|
| Access: Outreach | eligible | $7,740,780 | **$6,660,016 — 86.0%** | **97 of 115** |
| Completion | transcribed | $7,740,780 | $1,245,625 — 16.1% | 13 full · 9 partial · 93 zero |
| Access: Statewide | applied, portal-origin | $7,975,349 | $63,773 — 0.8% | 0 |
| **credit slice** | | **$23,456,909** | **$7,969,414 — 34.0%** | |

The model paid **34% of its cap, and 84% of everything it paid came from the one
measure 97 of 115 institutions already maxed out.** Only the transcribed rung had
a real spread. The eligible rung is also the one the performance builder flags as
carrying *"the ACE/JST skill-level duplication"* and as *"not an action the
college took"* — 1,386,862 eligible units against 216,035 applied, a 6.42×
ratio.

Neither number was visible from the tab. Both required running the model's own
earning function across the whole roster — which is cheap, and had never been
done.

## When this applies (and when it doesn't)

**Applies** to any allocation that clamps an earned fraction: outcomes-based
funding, performance contracts, incentive grants, milestone payments. Anywhere a
share is set independently of the distribution of performance against its target.

**Does not** imply a maxed-out measure is wrong to *report*. Showing that most
institutions clear a bar is legitimate evidence of system-wide capacity; the
error is attaching *funding* to it and calling that an incentive. Nor does it
mean targets should be set so high that few clear them — a measure nobody can
reach is the other failure, and the portal-origin measure above (0 institutions
at full earn, 104 students statewide) is what that looks like.

**The judgment it does not settle:** where the share should move. That is a
question about what you are trying to buy, and the data cannot answer it.

## See also

- `[[cpl_funding_lessons]]` — the session that measured it (2026-09-01, S218)
- `[[implementation-funding]]` — the lane; re-run this diagnostic after the dials move
- PR `#1429` — the band consolidation the finding justified
- `[[methodology-when-two-implementations-agree-on-live-data-your-test-proves-nothing]]` —
  the sibling trap: a defect that renders as the expected value is not caught by
  looking at the screen

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
