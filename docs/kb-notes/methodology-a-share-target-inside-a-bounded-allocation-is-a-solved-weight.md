---
title: A share target inside a bounded allocation is reached by solving one weight
created: 2026-10-14
updated: 2026-10-14
tags: [methodology, implementation-funding, noncredit, allocation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/reference/lanes/implementation-funding]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_nc_portion.test.js
---

# A share target inside a bounded allocation is reached by solving one weight

> When a policy names the percentage one group should receive from a proportional allocation that has a floor and a cap per recipient, solve for one weight on that group's size measure and apply it to both the size of each award and its split; the floor and cap make the reachable range finite, so a target outside it is reported, never silently missed.

## Context

The Implementation Funding model allocates one total ($25,240,308) to 118 institutions in proportion to combined credit and noncredit FTES, with a base award ($150,000) and a cap ($400,000) on each combined award, and splits every award into a credit and a noncredit share by the institution's own FTES mix (one-pool model, 2026-08-31). Noncredit's statewide portion came to 7.18%. On 2026-10-14 Sam asked to give noncredit a bigger percentage of the total. Story: [`cpl_funding_lessons`](../cpl_funding_lessons.md), 2026-10-14 section.

## The claim

**One weight, applied in both places.** The weight multiplies the group's size measure (noncredit FTES) in the size that decides each award and in the split that decides how much of the award is restricted to the group. Applied to the split alone, it restricts more of each award to noncredit outcomes and moves no funding toward the institutions that teach noncredit. Applied to the size alone, it enlarges the awards of noncredit-heavy institutions and lands the increase in their credit share. Applied to both, an institution's noncredit share is its weighted noncredit FTES times the one rate every unbounded institution receives.

**The total stays one solve.** The weighted sizes feed the same bounded proportional solve, so the awards still sum to the total and every award stays between the floor and the cap.

**The group's total rises with the weight, so bisection finds it.** A heavier weight enlarges the awards that carry the group and moves more of each into the group's share, so the group's total is monotonic in the weight. A geometric bisection between 1/10,000 and 10,000 converges in 64 steps; over 118 rows that is about 130 ms in the browser.

**The bounds set the reachable band.** As the weight approaches zero, the floor still pays the noncredit-only campuses entirely in noncredit. As it grows, the floor still holds a credit share for every institution that teaches no noncredit, and the cap stops the largest noncredit programs. A target outside the band gets the nearest reachable portion, and the curator is told the band.

**A blank setting is the identity.** The default weight is exactly 1, so shipping the setting moves no award until someone types a value. Test that bit for bit.

**A weighted size is an allocation basis.** Print plain FTES wherever a reader is told about teaching, and say "noncredit FTES counted at w" wherever a share of the weighted basis appears.

## How we got here

Measured over the e21658f9 config (pool dials matching live, 2026-10-14):

| Noncredit portion | Weight on noncredit FTES | Noncredit total |
|---|---|---|
| 7.18% (blank) | 1.00 | $1,812,403 |
| 10% | 1.56 | $2,524,031 |
| 15% | 2.72 | $3,786,046 |
| 20% | 4.23 | $5,048,062 |
| 30% | 8.52 | $7,572,092 |
| 50% | 26.40 | $12,620,154 |

At 15%, SD Cont. Ed reaches the cap; Santiago Canyon, San Francisco, Glendale and Santa Rosa gain the most; 47 institutions give up some funding, the largest credit colleges $30,000 to $37,000 each; the seven institutions with no noncredit FTES never gain. Built in PR #2132 (`solveNcWeight()`, `sizeOfW`, `laneShareOfW`); guarded by `tests/cpl_funding_nc_portion.test.js`, which checks the identity, the target, conservation, the bounds, both unreachable directions and the no-noncredit institutions.

## When this applies (and when it doesn't)

It applies to any proportional allocation with per-recipient bounds where a named group needs a share: a CTE share, a rural share, a share for a program type. It assumes the group's size measure is reliable; a group defined by a field known to be unreliable (TOP codes, for instance) needs that measure fixed first.

It does not fit a policy that wants a fixed amount distributed by a different rule, with its own floor and cap. That is a separate allocation, and a carve-out states it honestly; the one-pool model retired its carve-out on 2026-08-31 for that reason.

## See also

- `[[docs/cpl_funding_lessons]]`: the 2026-10-14 section
- `[[docs/reference/lanes/implementation-funding]]`: the dial's current state
- `cpl_memory`: `funding-nc-portion-weight-measured-2026-10-14`, `sam-funding-noncredit-portion-and-boxes-2026-10-14`
- PR #2132

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
