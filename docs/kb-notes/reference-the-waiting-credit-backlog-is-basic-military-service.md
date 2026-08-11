---
title: The articulated-and-waiting backlog is almost entirely basic military service credit
created: 2026-08-11
updated: 2026-08-11
tags: [reference, cpl-lifecycle, my-college, veterans, disposition]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-an-incentive-teaches-where-the-finish-line-is]]"
artifacts:
  - kb/supabase_map_college_credit_summary.sql
  - college_briefing.js
---

# The articulated-and-waiting backlog is almost entirely basic military service credit

> **One-sentence summary** — of the 64,074 units of credit that are already
> articulated and sitting at Needs Action, **98.8% is Credit for Basic Military
> Service**, so the backlog is not hundreds of judgment calls per college — it is
> close to one decision applied repeatedly.

## Context

`map_college_credit_summary.articulated_waiting` is the headline the My College
tab leads with: credit a student has earned, against an exhibit the college has
already articulated, mapped to a course, with only the award missing. It is
described — accurately — as *the cheapest credit you will ever give a student*.

What nobody had asked is what that credit **consists of**. The answer changes
how the number should be presented.

## The claim

Measured 2026-08-11 over `map_college_cr_unit`, filtered exactly as the summary
builder filters (`cpl_status_plan = 'Needs Action'`, `sum_articulated_credits > 0`):

| `course_type` | Units | Share | Colleges |
|---|---:|---:|---:|
| Credit for Basic Military Service — **Area** | 56,205 | 87.7% | 70 |
| Credit for Basic Military Service — **Elective** | 6,698 | 10.5% | 14 |
| Credit for Basic Military Service — **Course** | 357 | 0.6% | 1 |
| Elective credit (everything else) | 814 | 1.3% | 8 |
| **Total** | **64,074** | | **73** |

**98.8% is basic military service.** Per college the concentration is even
starker: of the 73 colleges with any waiting credit, **65 are at 100%**, 6 are
mixed and 2 have none; the average college is **96.2%** military.

Two further shape facts:

- The whole backlog is **592 rows**. It is small, not sprawling.
- **63.8% of the units carry no course** — `college_course` is a literal `-` —
  because the credit lands on a **GE or graduation area** (CSU GE Area E, health,
  PE, lifelong learning) rather than a numbered course.

And the complement, which matters just as much for how a page renders zero:
**33 of 106 colleges have no waiting credit at all** — including Moreno Valley
(2,404 CPL students), City College of San Francisco, De Anza, Coastline and
Riverside City. At those colleges a zero is a **finished queue**, not a missing
measurement, and must never be rendered as an absence of data.

## How we got here

Session 141 (SkyLink), PR #1121, while building the section that breaks the
headline figure down. The concentration was visible in the first query and was
not what anyone expected — the phrase "already articulated, waiting" invites you
to picture a varied pile of CTE certifications.

It also joins up with something already recorded: a JST or DD-214 upload creates
the Student CPL Plan and basic-training credit **auto-applies** against an
already-articulated exhibit
(`[[docs/kb-notes/methodology-an-incentive-teaches-where-the-finish-line-is]]`).
So this backlog is largely credit the platform computed on its own and then left
for a human to act on. That is why it is uniform, and why it is cheap to clear.

⚠️ The credit-recommendation strings are freehand and heavily variant — 298
distinct values, with *"Lifelong Learning and Self Development"*, *"Lifelong
Learning & Self-Development"* and *"Lifelong Learning and Self-Development"* all
present, plus a blank one carrying 2,111 units across 7 colleges. Do not group on
`credit_rec` when you want families; group on `course_type` and use `credit_rec`
to show a college what its own units count toward.

## When this applies (and when it doesn't)

Use this when framing the backlog for a college audience: lead with the
uniformity, because it converts an intimidating number into one decision rule
("award basic training credit to our Area E / PE per the exhibit we already
articulated"). It is the most encouraging true thing on the page.

Do **not** generalise it to the wider *dormant* figure. `dormant_credits` — the
~1.05M units at Needs Action — is a different and far more heterogeneous
population; `articulated_waiting` is the already-built subset of it. And these
proportions are a snapshot: as colleges clear the military backlog the residue
becomes proportionally more varied, so re-measure before quoting.

## See also

- `[[docs/college_action_page_lessons]]` — the workstream
- `[[docs/kb-notes/methodology-an-incentive-teaches-where-the-finish-line-is]]` — why basic-training credit auto-applies
- `kb/supabase_map_college_credit_summary.sql` — the filter this reconciles to
- PR `#1121` — the section that renders it

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
