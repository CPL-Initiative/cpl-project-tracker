---
title: Move one rung down the funnel to route around an upstream defect you can't fix
created: 2026-08-01
updated: 2026-08-03
tags: [methodology, data-quality, map-platform, funding, measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
artifacts:
  - funding/_build_funding_performance.py
  - cpl_funding.js
---

# Move one rung down the funnel to route around an upstream defect you can't fix

> **One-sentence summary** — when a source metric is inflated by a defect the
> upstream owner cannot practically repair, look for a later stage of the same
> pipeline whose grain is immune to it, and measure there instead.

## Context

MAP's CPL credit funnel has three stages: **eligible → applied → transcribed**.
The Implementation Funding model scored its first priority on *eligible units*,
and the number was badly inflated — 98 of 102 colleges cleared their target, at
a median of 42×.

Two independent problems sat under that, and only one of them was ours.

## The claim

**Eligible units are inflated at the source and we cannot fix it.** ACE Joint
Services Transcript exhibits repeat a credit recommendation under *every* skill
level, so a Marine Corps veteran's eligibility multiplies — four skill levels
listing the same 3-unit course reads as 12 eligible units. MAP's parser can't
simply keep the highest level, because skill levels are not canonically ordered
on the JST (registered as `map_data_quality` `10ad9e0a`, high severity, open).

Critically, **our arithmetic was not the problem.** The producer cross-checks its
own per-student sums against MAP's published per-college totals and read
**1.0054** — a half-percent gap, entirely explained by the Test/Potential rows we
exclude. We matched the source faithfully. The source was inflated.

**Applied units are immune to that defect**, because applying credit is an action
a college takes once per student — the duplication lives in the *recommendation
listing*, not in the award. Statewide the funnel reads:

| stage | units | % of eligible |
|---|---:|---:|
| Eligible | 1,354,527 | 100% |
| **Applied** | **242,559** | **18%** |
| Transcribed | 103,139 | 8% |

So the fix was not to correct the number, nor to wait for MAP, but to **measure
one rung later**. That also happened to fix a second, independent problem:
eligible measures *opportunity* (what a student could be awarded), while applied
measures an *action the college took* — which is what a performance-funded
priority should be scoring in the first place.

**The general shape:** when an upstream metric is untrustworthy, enumerate the
pipeline stages downstream of the defect and ask which is the earliest one whose
*grain* the defect cannot reach. Prefer that to (a) a correction factor, which
encodes today's defect as tomorrow's magic number, and (b) waiting on the
upstream owner, which stalls indefinitely when the fix is genuinely hard.

## How we got here

Sam pushed back on a proposal to change Priority 1's metric outright: *"In order
for a college to have eligible CPL units, they need to have approved
articulations in MAP and students with matching units… Maybe we're calculating
that wrongly. There will be another category of units called Applied, which is
fewer units because it doesn't double count."* He was right on the substance and
right about the remedy; the measurement then showed our own calculation was
sound and localised the inflation upstream.

The column was already in the view we read, so the change was ~5 lines in the
producer plus a `MEASURES` entry — the analysis was the whole cost.

## Correction, 2026-08-03 — the gap is mostly CORRECT FILTERING, not defect

The note above, as first written, implied the eligible→applied gap (82%) is
dominated by the JST duplication. **That is wrong, and it matters.** Sam's
correction: applying credit is a low-burden checkmark on the student's CPL plan
meaning *"this looks applicable to their program"* — so the gap is mostly
**eligibility that could never be applied to any program at all**. A JST lists
1 unit of marksmanship; no CCC offers it; it is correctly never applied.

The data shows the mechanism from the other side. Where a credential has
actually been articulated by someone (the CER population), colleges apply
**79%** of the eligible credit — 75,027 of 94,772 units. Across *all* identified
eligibility in the student view it is **18%**. The difference is dominated by
eligibility sitting on credit recommendations nobody has articulated, which
never enter the CER at all. (Directional, not a clean decomposition — the two
sources have different grains and populations.)

So the duplication is real and worth fixing upstream, but it is the **minor**
component. The dominant one is the system working as intended.

**This strengthens rather than weakens the claim.** The reason to move down the
funnel is not only "the earlier stage is inflated" but "the later stage carries
a *semantic filter* the earlier one lacks" — here, human judgment about
program applicability. When choosing a rung, ask what each stage *means*, not
just which is cleaner.

**And the generalizable lesson about the analysis itself:** "the number is
smaller downstream" invites the assumption that the difference is loss or error.
Establish *why* it shrinks before describing the gap — the explanation changes
what you should do about it, and a wrong causal story propagates into every
artifact that cites it (this one propagated into three).

## When this applies (and when it doesn't)

Applies when the pipeline has a genuinely later stage that (a) is already
captured, and (b) has a grain the defect cannot reach. Verify (b) explicitly —
"later" does not imply "immune"; transcribed units would also have dodged the
JST duplication, but they measure something much narrower.

Does **not** apply when the later stage is so much sparser that you have traded
inflation for absence. Here, applied is 2.4× transcribed precisely because
transcription is the administratively hardest step — moving all the way to
transcribed would have left ~80% of colleges at zero. Pick the earliest immune
rung, not the last one.

Also: routing around a defect is not the same as resolving it. Keep the upstream
defect on the register, and say plainly in the model's own documentation which
rung you are measuring and why.

## See also

- `[[docs/cpl_funding_lessons]]` — the 2026-08-01 section
- `map_data_quality` `10ad9e0a` — the USMC JST skill-level CR duplication
- PR `#964` — the `pa`/`pa_u` producer change
- `[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]` — same posture toward an untrustworthy field

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
