---
title: "Before building a whole, check whether the halves are already assigned"
created: 2026-09-15
updated: 2026-09-15
tags: [methodology, measures, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
---

# Before building a whole, check whether the halves are already assigned

## The near-miss

MAP's dashboard shows College of Alameda **84 eligible units**. The funding
artifact carries `pa_u` 78 (applied, non-portal) and `ppa_u` 6 (applied,
portal-origin). 78 + 6 = 84, and statewide 219,353 + 667 = 220,020 against the
dashboard's 220k.

Reading that as "no single source matches the dashboard", the obvious next step
is to build a combined `pa_u + ppa_u` source so a priority can be pinned to the
figure colleges actually see.

**That would have been a defect.** The Awards priority is *already* pinned to
`ppa_u`. Pinning Outreach to a combined source would count every portal-origin
unit twice — once under Outreach, once under Awards — which is exactly
`a-figure-tagged-to-two-owners-is-claimed-twice`, found and fixed one session
earlier.

## The rule

When a figure you need looks like the sum of two fields, **check what already
consumes each field** before building the sum. Disjoint halves that are each
already assigned to an owner are not a missing whole; they are a deliberate
split, and re-uniting them double-counts.

Here the split was the design: `pa` and `ppa` are disjoint cohorts by
construction (the builder carries `and not is_potential`), and Awards exists
specifically to reward portal and landing-page traffic. Outreach on `pa_u` plus
Awards on `ppa_u` covers the dashboard figure exactly, with nothing counted
twice and no code written.

## The tell

The user said it first: *"This was not an issue in any of the previous dozens of
sessions."* A problem that appears suddenly in a mature system, with no
corresponding change, is usually a problem in the current reading rather than in
the system. Treat that sentence as evidence, not as reassurance to be argued
past — it was said twice here before it landed.

## Corollary

The same run also proposed reconstructing a number that is already scraped daily
into `live_metrics.json` and rendered on another tab. Reconstructing a figure
you are already handed is how two surfaces drift apart. **Look for the value
before deriving it.**
