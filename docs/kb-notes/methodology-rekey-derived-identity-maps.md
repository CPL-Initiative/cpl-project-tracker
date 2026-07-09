---
title: "Re-key every DERIVED identity map when a re-mint permutes slots — or make consumers prefer the canonical store"
date: 2026-07-09
kb-status: published
type: methodology
tags: [re-mint, alias-map, identity, coci_articulations, data-integrity]
artifacts:
  - kb/coci_articulations.json
  - excel_to_dashboard.py (export_credential_reference)
related:
  - "[[methodology-alias-map-resolution-semantics]]"
  - "[[coursecontrolnumber_remint]]"
---

# Re-key every DERIVED identity map when a re-mint permutes slots

## The failure (found Session 110, via Sam's "where does CARP 1203 come from?")

The CER drawer showed `CNST M1009 · Finish Carpentry` while all three of
M1009's member courses are titled **"Tool and Equipment Applications"**. The
credential row renamed from that stale title then collided with the real
"Finish Carpentry" credential — a phantom collision.

Root cause: `kb/coci_articulations.json` carries two layers —

1. **articulation records** (one per exhibit×identity) — these WERE re-keyed
   by the 2026-06-12 canonical-SUBJ4 fold and later re-mints (they carry
   `_remint_from` stamps), and
2. an **`identities` map** (per-M-ID aggregates: title, discipline,
   colleges_offering, over_merged) — this was **never re-keyed**. The fold's
   alias map is a simultaneous PERMUTATION **with slot reuse**, so after the
   fold an untouched derived map doesn't just miss new keys — **existing keys
   silently describe a different course** (the slot's pre-fold occupant).
   Measured: **681 of the 693 keys shared with the minted catalogs carried the
   wrong title.**

## The rule

A re-mint/fold apply must re-key **every derived artifact keyed by the minted
id space**, not only the primary stores. The Rule-7 playbook already lists
memberships, articulation records, curation pointers, promotions — add: *any
aggregate/lookup map derived from those* (`coci_articulations.json →
identities` was the one we missed). Slot reuse makes this failure silent:
nothing dangles, joins keep succeeding, the data is just about the wrong
course.

## The two fixes (belt + suspenders)

1. **Consumer-side (shipped S110):** consumers that can join the canonical
   store should prefer it. `export_credential_reference()` now lets the
   minted/singleton catalogs (re-keyed by every apply, curation-folded daily)
   REPLACE identities-sourced title/discipline/TOP on key overlap; the
   identities map remains the source only for keys absent from the catalogs
   (C-ID/CCN anchors). This makes the CER robust to a future missed re-key.
2. **Producer-side (open):** add an identities-map rebuild (or re-key via the
   alias map) to the re-mint post-apply chain (`kb/_post_apply_chain.py`).
   Until then, `identities[*].colleges_offering` / `subject_spread` /
   `over_merged` remain pre-fold values — `_build_statewide_prescriptive()`
   reads `over_merged` from it (withhold-leverage guardrail; stale flags err
   in both directions but low stakes).

## How to spot it

A display title that disagrees with the record's OWN members/locals is the
tell (`CNST M1009 · Finish Carpentry` over a local line reading `CARPT 111
Tool and Equipment Applications`). Cheap audit: join every derived map's keys
to the canonical store and diff a stable field (title) — 30 lines of Python,
run it after every apply.
