---
title: Methodology — Cosmetic relabel via a display-label map, not a stored-value rename
created: 2026-05-31
updated: 2026-05-31
tags: [methodology, ui, refactor, cosmetic-rename, data-safety, dashboard]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[dashboard_cleanup_lessons]]"
artifacts:
  - unified_courses.js
  - credential_reference.js
  - excel_to_dashboard.py
---

# Methodology — Cosmetic relabel via a display-label map, not a stored-value rename

## The pattern

When asked to **cosmetically rename a value that's shown to users** (e.g. flip
the dashboard's identity-system labels `M-ID → MID`, `C-ID → CID`,
`CCN-ID → CCNID`), prefer a **display-time label map applied at each render
site** over rewriting the stored value across the data + code.

```js
// one tiny helper, called ONLY where the value is rendered
function idSysLabel(v){ return v==="M-ID"?"MID":v==="C-ID"?"CID":v==="CCN-ID"?"CCNID":(v||""); }
```

The stored value stays as-is, so **every `== "M-ID"` comparison, filter
option-value, CSS class, and identifier key keeps working untouched**.

## Why it beats a stored-value rename

1. **Zero data risk.** No rewrite of large staging JSON (here: 16,850 rows), no
   chance of corrupting an identifier **key** that doubles as the classification
   value's neighbor (e.g. the 224 `"M-ID ACCT 100"` anchor keys — renaming those
   would be an identifier re-key that ripples into curation/articulation pointers).
2. **No lockstep code sweep.** A stored-value rename forces you to find + flip
   *every* `=== "M-ID"` comparison/filter or they silently break. The label map
   leaves comparisons alone.
3. **Inherently safe against prose you must NOT touch.** Because the helper is
   only *called* at specific render sites (no global find-replace), conceptual
   narrative, the pipeline tab, and especially the **glossary** stay correct —
   critical when the value is also a real external-authority name (ASCCC's
   "C-ID", AB-1111's "CCN" are the *true* names; only the dashboard's own
   classification badge is being restyled).

## How to apply it safely

1. **Enumerate the render sites** (grep the value literal + the field name across
   hand-maintained JS + the generator; exclude generated data files). Classify
   each hit as **display** (map it) vs **logic** (leave it: comparisons, filter
   `value=` attributes, CSS-class derivation, lookup whitelists).
2. **For a `<select>` filter, map the option TEXT, keep the option VALUE raw** —
   so the filter-match logic still compares the stored value.
3. **For generator-rendered HTML**, map in the generator's emission (it reads the
   stored value, emits the label) — still "display-only" (no data file changes);
   verify with a local regen + idempotency check.
4. **Leave conceptual prose / glossary / external-authority names alone.**

## When a stored-value rename IS warranted instead

Only when the value is a genuine internal identifier with no external-authority
meaning AND downstream systems should persist the new value (then it's a re-key,
governed by the re-mint playbook with an alias map — not "cosmetic").

## Instance

CPL Project Tracker #3 (PR #209, Session 23). 9 render sites mapped across the
CCR (`unified_courses.js`), CER (`credential_reference.js`), and the
Articulations-by-Course card (`excel_to_dashboard.py`). Stored `id_system`,
all comparisons, and the 224 anchor keys untouched; the full data-value rename
that was on the roadmap (1e-5d) was superseded by this lighter, zero-risk
approach.
