---
title: "Crowd consensus beats a single-item signal (the two-signals-agree gate, via the crowd)"
created: 2026-07-17
kb-status: published
tags: [methodology, cip, top, consensus, two-signals-agree, corroboration, cip-crosswalk]
artifacts:
  - kb/_build_course_top_consensus.py
  - course_top_consensus.json
  - cip_crosswalk.js
related:
  - "[[methodology-top-is-a-last-in-line-signal]]"
  - "[[methodology-grounded-lexical-cip-confidence]]"
  - "[[cip_crosswalk_lessons]]"
---

# Crowd consensus beats a single-item signal

## The pattern

When a **per-item signal is too noisy to gate on**, don't try to tune it into
reliability. Instead, **aggregate the same decision across a large peer set** and use the
**modal value + an honest agreement metric**. This is the repo's two-signals-agree gate
(§7 TOP caveat) applied through the crowd: no single source is trusted, but their
agreement is.

## Where it came from (the CIP tab)

Goal: flag when a course's **TOP is mis-coded** (which makes the TOP→CIP crosswalk
recommendation misleading), and suggest the right CIP.

- **What failed — the single-item lexical signal.** A "the description matches a code
  outside this TOP's crosswalk much better" indicator (`topSuspect`) fired on **~19 of 21
  Biology courses**, including *correctly*-coded ones (General Biology → Biology-General is
  right, yet flagged). A single course's description lexically matches many CIPs strongly;
  there is no lexical threshold that separates "Zoology on Human Biology" (truly wrong)
  from "Biology on General Biology" (right). **Shipping it would have screamed a false
  alarm on nearly every row.** We dropped it.

- **What worked — the crowd.** Across ~114 colleges, how do peers teaching the *same
  course title* code it? For "Human Biology": **43 of 48 colleges** use a Biology-General
  TOP; the one college using Zoology is the lone outlier. The consensus is confident,
  corroborated, and gives a positive answer (the field → its crosswalk CIP) — where the
  single-item signal only ever said "something's off."

## How to build it

1. **Aggregate over the widest available peer set**, keyed by a stable, comparable
   attribute (here: normalized course *title*). The consumer and generator MUST normalize
   identically.
2. **Store distinct-peer counts per value** (not raw occurrence counts) — "used by N
   *colleges*", not "N courses" — and intern peer names so you can show *who*.
3. **Show an honest strength metric that reveals sample size**: "(M use, K differ)" beats
   "used by M colleges" because M+K exposes small-n on the surface ("2 use, 1 differ"
   reads thin; "used by 2" looks authoritative). Let the metric — not a hard threshold —
   convey confidence; let the human judge.
4. **Combine with the item's own signal** (two signals agree): the crowd picks the *field*
   (modal TOP), the item's description-fit picks the *specific* CIP within that field's
   crosswalk. Neither alone; both together.
5. **Offer, don't gate.** Surface the consensus value as a one-click *candidate*, and let
   the curious drill in (hover the "differ" count → which values, which peers). Never
   auto-assign.

## When to reach for it

- A per-row heuristic is right often enough to be tempting but wrong often enough to erode
  trust (the classic "flags everything" failure).
- You have many independent instances of the *same* decision to pool.
- The authoritative source is itself unreliable or being deprecated (here, TOP → CIP): the
  crowd's agreement is a better basis than any single record — and you're not "correcting"
  the dying field, just harvesting its agreement for the new one.
