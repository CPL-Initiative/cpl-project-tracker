---
title: "Fan-in discipline folds must re-point every inference lexicon (or re-derivation resurrects the alias)"
date: 2026-06-12
kb-status: published
type: methodology
tags: [kb-note, methodology, remint, fan-in, discipline-alias, inference, lexicon, kinesiology, m-id]
artifacts:
  - kb/_alias_canon.py
  - kb/_kin_pe_pass2.py
  - kb/kin_pe_pass2_out/2026-06-12/
related:
  - docs/kin_pe_convergence_scope.md
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md
---

# Fan-in folds must re-point every inference lexicon

## The failure

A fan-in convergence folds an ALTERNATE discipline name into its canonical
(Kinesiology ⟵ "Physical Education", Drama/Theater Arts ⟵ "Theater Arts" —
2026-06-10). The apply flipped every row's `discipline` value — but left the
rows' machine `discipline_source` stamps AND the inference lexicons
untouched. Both names remain valid MQ strings, so the passes' vocabulary
validation can't object. The Session-45 re-derivation (which re-infers its
own subject_map/title_keyword fills so lexicon refinements propagate) then
faithfully re-applied the stale lexicon: **605 rows re-acquired "Physical
Education" and 147 "Theater Arts"** — silently, weeks after the fold said
the discipline was at zero. The Session-50 SUBJ4 fold then needed a
canonical for the resurrected discipline, and the operator had to pin a
synthetic parking-lot code (`PEDU`) to unblock it.

## The rule

A fan-in convergence is not done until, in the SAME change:

1. **Every inference lexicon/map target naming the alternate is re-pointed
   to the canonical** — `kb/discipline_inference.json` (subject_map +
   title_keywords), `kb/top_discipline_map.json`,
   `kb/top_division_discipline_map.json`, and the in-source phrase sets
   (`kb/_infer_disciplines_from_desc.py`).
2. **Rows whose discipline the apply sets get the MANUAL state** — value
   present, `discipline_source`/`_confidence`/`_inferred_at` POPPED. That is
   the only state every pass treats as untouchable (pass 1 re-derives its
   own stamps; the blank-fillers fill blanks; "value without source" is
   permanently theirs-not-to-touch).
3. **The alias guard runs at every pass load** — `kb/_alias_canon.py`
   resolves any target that names a folded alternate (per
   `kb/discipline_aliases.json`) to its canonical with a loud warning, so a
   future lexicon edit can't reintroduce one.

## Why each leg matters

- Leg 1 without leg 2: rows flipped by the apply keep machine stamps; any
  per-subject lexicon disagreement (e.g. an adapted-PE row whose subject
  code maps to plain Kinesiology) clobbers the apply's finer carve-out.
- Leg 2 without leg 1: the contaminated rows are cured but every FUTURE
  blank fill from the stale entries mints fresh contamination.
- Leg 3 is the structural backstop for both — alias names are valid MQ
  strings forever (fan-in never deletes from the vocabulary), so only an
  alias-aware check can catch them.

## The repair shape (when it has already happened)

Pass-2 of the convergence (`kb/_kin_pe_pass2.py` is the template): re-route
every alias-disciplined row through the (refined) carve-out rules as a
Rule-7 re-key — alias receipt, V-gates, downstream chain, Supabase mirror —
and DELETE the parking-lot canonical pins so a recurrence surfaces as
`blocked_on_curator` (a review queue) instead of silently re-minting the
parking lot.
