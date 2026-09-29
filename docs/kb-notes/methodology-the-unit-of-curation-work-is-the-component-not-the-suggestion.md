---
title: The unit of curation work is the component, not the suggestion
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, curation, worklist, prioritization, ux, ccr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - kb/_build_ccr_atlas_extract.py
  - prototype/ccr_atlas_v1.html
---

# The unit of curation work is the component, not the suggestion

> **One-sentence summary** — when several evidence lanes each emit overlapping
> suggestions, the count they present is inflated and unfinishable-looking;
> collapse them into connected components and the same corpus becomes a small
> number of small, bounded decisions.

## Context

The CCR presented as **7,605 pending suggestions over 17,321 course
identities** across six evidence lanes. Sam's description of opening it:
*"I get overwhelmed at the enormity of the curation task and a bit lost in the
process — so I end up picking up another project until I get the guts to go
back in."*

Curation had been dormant for 41 days, which matched the description exactly.

## The reframe

Suggestions overlap: two lanes proposing A↔B and B↔C are not two decisions, they
are one decision about {A, B, C}. Build the graph, take connected components:

| | |
|---|---:|
| suggestions presented | 7,605 |
| **actual decisions** | **6,056** |
| involving ≤12 identities | **97.1%** |
| modal decision size | **2** — "same course, or not?" |
| disciplines carrying work | 144, **median 12 decisions** |
| disciplines with ≤40 decisions | **118 of 144** |

Automotive Technology is **57 decisions**. Welding is **35**. Not 17,321 rows.

## Why it matters beyond the count

Three things fall out that a flat queue cannot give you:

1. **A bounded unit.** A component is 2–12 items — small enough to hold, decide,
   and finish. A queue of 7,605 has no natural stopping point, so every session
   ends mid-air.
2. **A finish line per discipline.** "Automotive Technology: 57 decisions" is a
   sitting. "7,605 suggestions" is a career.
3. **A drawable object.** 97% of components fit a force layout comfortably,
   which is what made a graph view feasible at all — a graph of the whole corpus
   is a hairball, a graph of one component is a diagram.

## Split the piles that need different work

Components whose members carry **no discipline** are not merge decisions — they
need a discipline assigned before merge judgment is even possible. In the CCR
that is **3,001 of the 6,056** (8,065 identities): half the queue, a different
job, and a different tool.

Blending them into one number is what made the total look unfinishable. Keep
them separate and report both.

## Caveats

- Components are only as good as the edges. Include every lane that proposes a
  relationship; a missing lane splits one decision into two.
- Do **not** make the components transitive across weak evidence — that is how
  chains form (see [[methodology-title-similarity-merge-guards]]). Here the
  edges come from lanes that already applied their own screens.
- Component size is a *workload* proxy, not a *difficulty* proxy. A 2-node
  decision between two near-identical titles can be harder than a 10-node one.
