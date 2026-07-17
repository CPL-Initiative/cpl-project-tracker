---
title: "Grounded lexical confidence: ranking a text against a taxonomy (finder-not-decider)"
date: 2026-07-17
kb-status: published
type: methodology
tags: [methodology, cip, matching, idf, confidence, finder-not-decider, phase-0]
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[methodology-conflicting-source-tabs-use-certified-value]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
---

# Grounded lexical confidence: ranking a text against a taxonomy

**Problem.** Score how well a free-text item (a course catalog description) fits each
entry in a controlled vocabulary (the 2,325 CIP-2020 codes), with an honest confidence
read — no backend, no LLM, and **it can never invent an entry** (every result is a real
record). Built as the CIP "Check a course" Phase-0 engine (`cip_crosswalk.js`).

## The four moves (each earned by a real failure)

1. **Tokenize + conservative stem.** Lowercase, split on non-alphanumerics, drop a STOP
   list of academic filler (course, program, prepare, skills, introduction…), stem, and
   **dedupe**. Guard: never stem to a <4-char stub — `"speed"→"spe"` was false-matching
   `"specific"`. Keep the original when the stem is too short.

2. **IDF-weight every match.** Compute inverse document frequency over the taxonomy's
   own text (title+definition+examples of all entries). Distinctive terms (`collision`,
   `gis`, `police`) dominate; ubiquitous ones (`cost`, `design`, `technology`) carry ~0.
   *This is the single biggest quality lever* — raw keyword overlap confidently mis-ranked
   generic descriptions (Financial Accounting → *Financial Forensics*; Automotive Painting
   → *Prepress* at 99%). IDF fixed both. Field-weight the hit: title > examples > definition.

3. **Confidence = the MARGIN, not the raw score.** The discrimination signal is the gap
   between the top candidate and the pack: `margin = 1 − score₂/score₁`. Big gap → "clear
   front-runner"; tight cluster → "several fit — you decide." This turns the ranker's
   weakness (it can't split near-ties) into an honest feature.

4. **Coverage factor — the item's *fundamental purpose* wins.** A pure sum lets an entry
   match on incidental wording (a street-maintenance course says "cost accounting systems"
   → hits the Accounting code). Fix: take the query's most **distinctive** terms (top-K by
   IDF = its identity), and **dampen** any entry that matches *none* of them to a floor
   (×0.25). The entry that explains the item's core subject rises; the incidental match
   sinks into a lower tier — without being suppressed entirely.

## The rulings that kept it honest (a curator calibrated it)

- **Shape the score, don't gate the label.** The coverage factor demotes a false "Strong"
  into the "Plausible" band via `rel%`; do **not** add a hard "coverage → force Weak" gate.
  A course with genuine *secondary* callouts to a field earns an honest "Plausible."
- **Don't over-control.** A floor, not a cutoff; top-K, not a whitelist. Entries matching
  *some* identity terms keep their score, so legitimate alternatives survive. When in
  doubt, **give the human the control** (a search box) rather than hard-coding a rule —
  e.g. an Improv course isn't a top "Acting" match but is one search away, reading
  "Plausible." *Method (the ranking is right) + magic (the human can override it).*
- **Finder-not-decider, always.** Tier + a labeled "vocabulary match" meter, framed as a
  *review aid*; the definition is the final word; the human enters the final value. Never
  auto-assign.

## When to reach for this
Any "rank a free-text blurb against a fixed catalog and say how confident" task where a
backend/LLM is overkill or not yet sanctioned, and hallucination is unacceptable (the
output is always a real catalog entry). Phase-1 upgrade path: swap the lexical score for
semantic embeddings (precomputed catalog vectors + cosine) or a grounded RAG judge — same
tiers, better recall. Calibrate any version on **real inputs** before shipping.
