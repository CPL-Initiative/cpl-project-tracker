---
title: Agreement is not corroboration when the behavior is systematic
created: 2026-08-20
updated: 2026-08-20
tags: [methodology, peer-precedent, corroboration, matching, prioritization, data-quality, ace]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/map_cleanup_worklist]]"
  - "[[docs/kb-notes/methodology-a-one-rule-class-must-be-checked-against-its-own-text]]"
artifacts:
  - kb/supabase_map_cx_exhibit_guidance.sql
---

# Agreement is not corroboration when the behavior is systematic

> **One-sentence summary** — counting how many independent parties agree is only
> evidence when their agreement is independent; a policy that several parties
> apply to *everything* produces the same count and means nothing.

## Context

Building a list that suggests, for each ACE military exhibit, where colleges have
already articulated it. The obvious safety rule was a floor: only show a course
**two or more colleges** named, since one college's idiosyncratic choice is not a
pattern. That floor shipped a top tier where **11 of 14 exhibits pointed at the
same course** — `MAG-51 Elements of Supervision`, offered for Infantryman, Combat
Medic, Cook, Truck Driver and HR Specialist alike.

## The claim

**A count of agreeing parties cannot distinguish independent convergence from a
shared blanket policy.** Three colleges that map *any* military service to a
supervision course produce `colleges = 3` on every exhibit — numerically
identical to three colleges that each looked at Military Police and each
concluded *Administration of Justice*.

The missing dimension is **specificity: how many different subjects does this
answer get given for?**

```
MAG-51 Elements of Supervision           spans 33 exhibits   → blanket
MAG-200 Management Work Experience       spans 10            → blanket
AUTOCOR-114 BASIC WELDING THEORY         spans  8            → blanket
ADJ-1 Intro to Administration of Justice spans  1            → informative
```

A signal that fires everywhere carries no information about anywhere. This is the
same shape as inverse document frequency, as the CCRR lane's finding that the
widest-spreading string was a placeholder (`3 hours in Elective Course Credits`:
61 credentials, one college), and as Rule 7's treatment of TOP — a field that is
*present* on everything is not thereby *evidence* about anything.

⚠️ **The floor felt sufficient precisely because it was the obvious guard.** It
addressed the failure mode that was easy to imagine (one college being weird) and
was blind to the one that actually dominated (several colleges being
systematically lazy in the same direction).

## What to do with it

- When ranking by "how many sources agree", **also measure how many distinct
  questions each source gives that answer to.** Two axes, and the second is
  usually the one nobody computes.
- **Label, don't hide.** A blanket answer is still evidence *about the college's
  policy* — dropping it silently leaves a curator unable to see why an item has
  no strong answer. Ship both counts on every row.
- Watch for the tell: **one answer appearing at the top of many unrelated
  items.** If a "best match" column repeats itself down the page, the ranking is
  measuring the corpus, not the item.
- The blanket mapping is itself a finding worth routing elsewhere — three
  colleges mapping one course against 33 military exhibits is a data-quality
  question in its own right, not merely noise to filter.
