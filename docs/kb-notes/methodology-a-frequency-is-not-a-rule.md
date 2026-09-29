---
title: Methodology — a frequency is not a rule
created: 2026-08-27
updated: 2026-08-27
tags: [methodology, inference, curation, domain-knowledge, peer-precedent, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[college_cr_evidence_lessons]]"
  - "[[methodology-agreement-is-not-corroboration-when-the-behaviour-is-systematic]]"
artifacts:
  - kb/_match_courses_to_ace_recs.py
---

# Methodology — a frequency is not a rule

> **One-sentence summary** — measuring how *often* practitioners do something tells you
> nothing about whether it is *permitted*, and a session that builds the first into the
> second will ship a constraint nobody asked for.

## The case

Building the LATTC military-CPL worklist, a session measured peer behavior in
`map_college_cr_unit`: of **900** (college, credit-recommendation) pairs, only **54 (6%)**
span more than one course — and reading those 54 showed they were cross-listings
(`BUS-3` / `CAT-3` / `CIS-3 Computer Applications for Business`), catalog-year duplicates
(`ELC-11 DC Electronics` at 4.0 and 8.0 units) and stated alternatives. Not one
recommendation genuinely awarded twice.

The measurement was sound. What was done with it was not. It became:

- a **duplicate warning** on any course reusing a recommendation, and
- a bulk-fill that **skipped** any recommendation already claimed.

Jessica, the curator: *"We can utilize a credit recommendation for multiple courses or
multiple credit recommendations for 1 course or any combination like that."* MAP permits
many-to-many. Colleges are simply not in the habit.

## Why the error is easy to make

The evidence looks like a rule. A near-universal pattern in a large sample *feels*
constraint-shaped, and the inference is invisible in the artifact: nothing in the warning
text said "inferred", so a reader could not tell a measured prohibition from a modeled one.

It is also asymmetric in cost. If reuse really were forbidden, a permissive tool produces a
bad articulation someone catches in review. Because reuse is allowed, the restrictive tool
**silently withheld correct options** — and a withheld option leaves no trace to argue with.

## The rule

**Before turning a measurement into a constraint, name which one you have:**

| | |
|---|---|
| *"X almost never happens"* | an observation about **behavior**. Report it. Rank by it. Never gate on it. |
| *"X is not allowed"* | a claim about the **system or the policy**. It needs a source: the platform, the regulation, or a human who knows. |

If you cannot name the source for the second, you have the first.

**And ask the curator.** The distinction is usually one sentence for someone who works in the
system daily, and unrecoverable from the data at any sample size. `CLAUDE.md` already says a
team member's domain knowledge outranks a derived finding; this is what that looks like when
it is skipped.

## Signals you have made this mistake

- A warning, filter or skip whose justification is a percentage.
- A constraint you can state as *"nobody does X"* but not as *"X fails because…"*.
- A tool that gets *more* restrictive the more data you feed it.

## Related

The inverse failure — treating agreement as corroboration when the behavior is systematic —
is [`methodology-agreement-is-not-corroboration-when-the-behaviour-is-systematic`](methodology-agreement-is-not-corroboration-when-the-behaviour-is-systematic.md).
Both come from reading a count without reading what generated it.
