---
title: "TOP is a last-in-line signal, never a gatekeeper"
created: 2026-07-16
updated: 2026-07-16
tags: [methodology, top-code, discipline, subj4, identity, data-quality, cip]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-coded-key-over-freehand-text-join]]"
  - "[[methodology-subject-cohort-discipline-outlier]]"
  - "[[cip_crosswalk_lessons]]"
artifacts:
  - kb/_row_audit.py
  - kb/_seed_canonical_subj4.py
  - kb/_infer_disciplines_from_top.py
  - kb/_infer_disciplines_from_top_division.py
  - kb/_build_cpl_pathway_ccr.py
---

# TOP is a last-in-line signal, never a gatekeeper

> **One-sentence summary** — TOP codes are faculty-entered in COCI during local
> curriculum approval with **no data-entry gatekeeper**, so they are notoriously
> unreliable: never use TOP for gatekeeping or a primary determination (identity,
> discipline, SUBJ4, membership, merge/split). TOP is legitimately a **last-in-line
> corroborator** (only when a second signal agrees) and a **fuzzy search/filter**
> aid — nothing more.

## Why TOP can't be trusted authoritatively

A course's TOP code is chosen by the faculty/curriculum author when the course is
built or revised in COCI. There is **no reviewer at the point of data entry** who
verifies the code is right for the course. The consequences we can measure:

- **~52% of consolidated M-IDs are TOP-mixed** — the *same* course carries
  different TOP codes across colleges. TOP is a "representative," not ground truth.
- Whole disciplines get mis-coded (Sam's HVAC / `M10FR` catch; the AUTO 116 →
  Construction over-merge the pathway flag surfaced live).
- TOP→CIP is **one-to-many** (only ~9% of TOP codes are 1:1), confirming TOP was
  never a clean 1:1 field key.

**CIP context (fall 2026):** the CO is transitioning course/program coding
**TOP → CIP** systemwide this fall (ESS 26-06). CIP *may* be applied more
consistently — but that is unproven, so treat CIP with the same "corroborate,
don't gate" posture until the data earns more trust.

## The rule (three roles)

| Role | Allowed? | What it looks like |
|---|---|---|
| **Gatekeeper / primary determination** | ❌ **Never** | TOP alone decides a course's discipline / SUBJ4 / identity, includes-or-excludes a row, or drives a merge/split/re-key. |
| **Last-in-line nudge** | ✅ Only corroborated | TOP breaks a tie or nudges an edge case **after** a stronger signal leads, or is one of **≥2 signals that must independently agree** (the "two-signals-agree" gate). |
| **Fuzzy search / filter** | ✅ Yes | TOP in a search haystack, a quick user filter, a broad grouping, a display chip, an export column — never presented as authoritative. |

**The signal ladder for `discipline`** (what leads vs. what only fills blanks):

```
curated / reviewed (curator)     authoritative — never overridden
subject_map (local subject code) leads
title_keyword                    mid
description        (conf 0.5)     fills blanks only
top_code           (conf 0.5)  ← TOP: fills blanks only, last-in-line
top_division       (conf 0.4)  ← TOP: coarsest, fills blanks only
```

TOP-derived fills are written **blanks-only**, **never over a curated/reviewed
row**, stamped `discipline_source="top_code"|"top_division"` + a low
`discipline_confidence`, and surfaced with the dashboard's ⚙ "generated-by"
badge. That provenance must be **respected downstream** — the failure mode is
laundering a low-confidence TOP guess into an authoritative-looking output by
consuming `discipline` without checking its source.

## The identity boundary (the decision — Sam, 2026-07-16)

An audit found **~24% of disciplined rows (17,059 of 71,076)** reach their
`discipline` via TOP inference. The canonical-SUBJ4 fold groups rows by
`discipline` and assigns each row its discipline's canonical SUBJ4 as its **M-ID
identity** — so a 0.4–0.5 TOP guess was silently becoming an identity key.

**Ruling: gate identity, keep display.** TOP-inferred disciplines still *show* on
the dashboard (with the ⚙ badge), but they are **held out of the canonical-SUBJ4
fold and its modal vote until a stronger signal (subject_map / curator)
corroborates.** The §7 invariant is refined to:

> *All rows sharing a **corroborated** discipline share a SUBJ4; a row disciplined
> **only** by TOP waits for corroboration before it is folded into (or votes on)
> that SUBJ4.*

This preserves the useful (honestly-flagged) display discipline while ensuring
TOP never determines the identity key.

## Where this is enforced in code

- `kb/_row_audit.py` — a `top_code`/`top_division`-sourced discipline scores
  **`inferred-low` (0.60)**, below the curator-anchored `subject_map`
  (`inferred-high`, 0.80). TOP is weighted **0.10** in the faculty-trust field
  weighting. The `top_discipline_disagreement`, `subject_discipline_outlier`, and
  `member_top_divergence` flags **only surface or corroborate** — they never
  re-assign, and require a 2nd agreeing signal.
- `kb/_seed_canonical_subj4.py` — TOP-sourced rows are excluded from the
  canonical-SUBJ4 modal vote (identity boundary, above).
- `kb/_infer_disciplines_from_top*.py` — blanks-only, low-confidence, review-
  flagged fills; catch-all TOP codes (`4930.*`, `*99.*`) deliberately unmapped.
- `kb/_build_cpl_pathway_ccr.py` — the `(college, TOP4)` program-membership join
  is a **proxy** (COCI has no course→program join), labeled as such in the UI;
  the over-merge `merge_flag` requires a 2nd signal, not TOP inequality alone.
- `kb/_join_cte_from_top.py` — **legitimate exception:** the CTE flag *is* a
  property of the TOP taxonomy (the CTE asterisk in the TOP Manual), so TOP is
  the authoritative source there *by definition* — and it sets a flag, not
  identity.

## When TOP *is* the authoritative source (the narrow exceptions)

- **CTE status** — defined by the TOP taxonomy itself.
- **The CIP↔TOP crosswalk** — TOP is the *subject* of the reference, not a gate.
- **CCC division labels** — the *label* for a 2-digit division is well-defined;
  what's unreliable is the *code a course was assigned*, not the label's meaning.

## See also

- `[[methodology-subject-cohort-discipline-outlier]]` — the model two-signals-
  agree pattern (subject cohort leads; TOP may only corroborate the same fix).
- `[[methodology-coded-key-over-freehand-text-join]]` — lead with a *stable*
  code; note that at **program** grain TOP is steadier than at course grain, but
  still corroborate.
- `docs/reference/pipeline_reference.md` — the "TOP codes vary for the same
  course" caveat.
- `CLAUDE.md §7` — the M-ID invariants + the standing TOP caveat.

---

*Authoring check: durable (every future discipline/identity decision), reusable,
distilled (the three-role rule + the identity-boundary ruling), self-contained.*
