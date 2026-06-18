---
title: A similarity threshold can't bridge a zero-overlap synonym — use a curated synonym map
date: 2026-06-16
updated: 2026-06-18 (Session 62 — the candidate-validator script)
kb-status: published
type: methodology
tags: [kb, ccr, suggested-merges, consolidation, signature, synonyms, similarity]
artifacts:
  - kb/synonym_map.json (the curated abbreviation↔expansion map)
  - excel_to_dashboard.py (_sug_sig — applies the map before tokenizing)
  - kb/_sug_segment_dryrun.py (synonym-aware measurement)
  - kb/_synonym_candidate_dryrun.py (the candidate ambiguity validator, Session 62)
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 58 cont.)
  - docs/kb-notes/adr-level-collapsing-consolidation.md (the over-merge decision)
---

# A similarity threshold can't bridge a zero-overlap synonym

## The failure class

Two titles can be the **same course** yet share **zero tokens**: `ESL` vs
`English as a Second Language`, `AJ` vs `Administration of Justice`, `PE` vs
`Physical Education`. Any similarity score — cosine, Jaccard, TF-IDF — is a
function of the **shared** tokens, so for a zero-overlap pair the score is
**exactly 0**. No threshold, no slider, no "loosen the cutoff" reaches it. The
instinct to reach for a confidence slider when the worklist "isn't grouping
enough" is therefore a category error for this failure: the slider can only move
pairs that *already share words*.

## The fix: normalize BEFORE you score

A curated **synonym/alias map** rewrites the expansion phrase to its canonical
short token *before* tokenizing, so both forms collapse to the same signature:

```
"english as a second language"  →  "esl"
"administration of justice"     →  "aj"
```

Now `ESL Level 1` and `English as a Second Language Level 1` share the token
`esl` and group on the existing signature — no threshold change needed. (In this
repo: `kb/synonym_map.json` → `_sug_sig` in `excel_to_dashboard.py`.)

## The guardrails that keep it precise

- **Map the EXPANSION phrase, not the bare abbreviation.** Keys are multi-word
  phrases (`administration of justice`), matched word-boundary-anchored,
  longest-first. The canonical value is the abbreviation the data already uses,
  so abbreviation-style titles need no entry — only expansions are rewritten.
- **Measure the bare canonical token for collisions FIRST.** Before adding
  `… → "aj"`, grep the title corpus for the standalone token `aj`: every hit must
  genuinely be that subject. For AJ, all 5 standalone-`aj` titles were
  Administration of Justice (AJ Work Experience, `AJ-52A PC832`) — clean. Skip
  genuinely ambiguous short forms (`CS`, `IT`) that collide across subjects.
- **It unifies the core, not the qualifiers.** Folding the `esl`/`aj` token still
  leaves distinguishing words intact, so sub-families stay apart: `esl grammar`,
  `esl reading writing`, `aj ethics` remain their own groups. The map widens the
  *keyword* match without flattening real distinctions.
- **Suggestions-only.** This only changes which groups *surface* in the
  curator worklist; every merge is still a human Confirm. That's what makes an
  aggressive normalization safe.

## The candidate validator (added Session 62)

`kb/_synonym_candidate_dryrun.py` turns the "measure the bare token first" rule
into a script. For each proposed `expansion → canonical` pair it scans the title
corpus for the **standalone** canonical token and reports the hits, so you can
confirm they're all genuinely that subject before committing the entry. Session 62
used it to clear **ECE / EMT / CNA / HVAC / LVN** (PR #461) and to **reject**
`cis`, `cd`, and `ma` — short forms whose standalone token collides across subjects
(MA = Medical Assisting *and* Master of Arts). Reject-on-evidence is as
load-bearing as accept: the map stays precise because every entry passed the check,
one measured pair at a time.

## When a slider IS the right tool

Reserve the looseness slider for the lane that actually carries a **continuous
score** — here, the title-similarity lane (IDF-weighted cosine). There, lowering
the precompute floor and exposing a client slider genuinely reveals weaker
*real-overlap* matches. The two tools are complementary, not interchangeable: the
**map** reaches zero-overlap synonyms, the **slider** tunes partial-overlap
matches. Diagnose which gap you have before picking one.

## Transfer

Any dedup/entity-resolution pipeline that groups on normalized text: build a
small, measured, curated synonym layer for domain abbreviations *before* the
similarity stage, rather than trying to lower a threshold into reaching them.
Keep it curator-gated and grow it one measured pair at a time.
