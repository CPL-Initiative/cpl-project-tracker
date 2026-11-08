---
title: "Read an id-keyed document's era from its keys before applying an alias chain"
created: 2026-11-08
updated: 2026-11-08
tags: [methodology, m-id, alias-chain, remint, rule-7]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/mid_lifecycle]]"
  - "[[docs/common_subject_code_tab_lessons]]"
artifacts:
  - kb/alias_chain.py
  - kb/_anchor_rekey_dryrun.py
  - tests/anchor_rekey_dryrun_test.py
---

# Read an id-keyed document's era from its keys before applying an alias chain

> **One-sentence summary**: a document with no `_rekeyed_through` stamp takes only the maps after its own era, and its
> era is read from its keys (the latest map that produced one), never assumed and never "the whole chain".

## Context

`kb/alias_chain.py` resolves a stored M-ID through every apply-confirmed re-mint in order. That is right for an id
minted before the first map. It is wrong for a document whose keys were written partway along: re-mints re-use ids, so
a later key can collide with an earlier era's id that an earlier map moved. On 2026-11-08 the curated anchor
(`kb/common_courses.json`, no era stamp) sent GRAF M10IB, minted by the 2026-09-03 Z-band retirement, to CRIM M11SD
through the 2026-06-12 fold, which had moved an earlier GRAF M10IB. The result was a live id on the wrong discipline,
and nothing errored.

## The method

1. For each key, its producer is the latest map that has the key as an output.
2. The baseline is the latest producer across the keys.
3. Refuse when a key is an input to any map after its own producer and up to the baseline: the document skipped a map,
   and no reading order repairs that in place.
4. Hand the baseline to `alias_chain.pending_maps(None, baseline_through=...)` and resolve through the pending maps
   only.

`kb/_anchor_rekey_dryrun.py` does this; `tests/anchor_rekey_dryrun_test.py` pins the re-used-id case and the refusal.

## When it applies

Any id-keyed file that does not carry `_rekeyed_through`: a curated anchor, a hand-kept list, a receipt from another
lane. Once a document is re-keyed, stamp it, so the next reader need not infer its era again.

## A later map can re-use the id for another record (S612, 2026-11-08)

Reading the era from the keys tells you which maps are pending. It does not tell you that a pending map moves the same
record. An id can be produced twice: the 2026-09-03 Z-band retirement gave the anchor's Diesel Engines the id AUTD M10FX,
and the next day's prefix fold gave the same id to an HVAC singleton, which the 2026-11-05 recode then moved to DIES
M10FX. Through the chain the anchor key "moves" to DIES M10FX, the HVAC course's id. The test that catches it: a re-key
whose target is a live record is a collision, never a re-key. `kb/_anchor_rekey_dryrun.py` applies it, and
`kb/_anchor_rekey_apply.py` gates on it again before writing.
