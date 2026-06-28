---
title: The authoritative statewide MAP exhibit is the raw row with Collaborative Type == "CCC"
created: 2026-06-28
updated: 2026-06-28
tags: [reference, cpl, map, statewide-collaborative, exhibits, credit-recommendations, data-provenance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb-notes/reference-statewide-credit-recommendations]]"
artifacts:
  - statewide/_probe_exhibit_authority.py
  - fact-sheet/_build_statewide_recs.py
  - excel_to_dashboard.py
---

# The authoritative statewide MAP exhibit = the raw row with `Collaborative Type == "CCC"`

> **Summary** — When you need *the* canonical credit-recommendation list for a statewide
> CPL credential, do **not** read it off our unified-credential grouping — that grouping
> folds the MAP-published exhibit together with every college's CCC-tagged *adaptation*,
> inflating the rec count (POST Basic Academy: 42 recs vs the canonical ~10). The single
> authoritative exhibit is the raw `View_ArticulatedMAPExhibits` row whose
> **`Collaborative Type` column is literally `"CCC"`** — a lead college hosts it.

## Why the unified grouping over-counts

Our EACR / `statewide_data.js` groups exhibits by unified credential
`(unified_title, issuing_agency, cpl_type)`. That's correct for "how many colleges
recognize this credential," but **wrong** for "what are the official recommended courses,"
because:

- MAP publishes one **statewide exhibit** that a lead college hosts (Lassen → POST
  Basic Academy; Saddleback → CA Real Estate Salesperson License).
- Other colleges **adopt or adapt** it into their own catalog — and they *also* tag
  their adapted exhibit `Collaborative Type == "CCC"`. (Sam's confirmed hypothesis:
  "perhaps they also tag their adapted exhibit with CCC Collab, which leads to the
  confusion.")
- The unified grouping therefore merges N ExhibitIDs (published + adaptations) into one
  card, and a naive rec dump lists everyone's variant phrasings.

## The discriminating signal

The published exhibit and the adaptations differ in the **raw row provenance**, not in
the credential identity. The clean filter:

```
recs from rows where row["Collaborative Type"] == "CCC"   # exact, raw column
```

This isolates the one MAP-published exhibit → its canonical recs. Validated: POST Basic
Academy → exactly the 10 AJ recs (AJ 110/120/122/124/140/160/200/220 + two GE rows).

**Generalizable lesson:** when many rows claim to be "the same thing" and you only want
the authoritative one, look for the **discriminating column** (a provenance/role flag),
not a similarity/dedup heuristic. This was a provenance problem, not a fuzzy-matching
problem — one exact equality solved it; normalization would not have.

## How it's wired (2026-06-28, PR #571)

- **Probe** `statewide/_probe_exhibit_authority.py` (+ `statewide-probe-authority.yml`)
  established the signal. It runs on a **GitHub Actions runner** because the agent
  sandbox can't reach the MAP API (egress 403); a runner can. Curriculum data only, no
  student PII; commits nothing. Kept as the maintenance tool — re-run to refresh the
  no-CCC list.
- **Producer** `excel_to_dashboard.py` (`_build_statewide_adoption`) emits an additive
  `authoritative_recs` per exhibit, collected from `collab == "CCC"` rows only, deduped
  by recommendation text, C-ID carried/backfilled. The existing `credit_recs` (all
  collab rows, EACR's source) is left untouched — no EACR regression.
- **Builder** `fact-sheet/_build_statewide_recs.py` turns `authoritative_recs` into
  `window.CPL_STATEWIDE_RECS` for the public Fact Sheet, and **logs the no-CCC list**:
  statewide credentials that have NO CCC-tagged exhibit (e.g. EMT) show no recs. That's
  a deliberate, Sam-approved caveat — the fix is upstream in MAP (add/tag the CCC
  exhibit), not a workaround in our pipeline.

## Caveats

- "1 authoritative CCC exhibit per statewide credential" is the *intent*, not a
  guarantee — re-run the probe to spot a credential with 0 (no-CCC list) or, in
  principle, >1 CCC rows.
- Don't relabel or re-key the raw `Collaborative Type` value; it's MAP's authority
  column. We read it; we never write it.
