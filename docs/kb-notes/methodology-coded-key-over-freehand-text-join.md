---
title: Join loose institutional datasets on the coded key, not freehand text
created: 2026-06-18
updated: 2026-06-18
tags: [methodology, data-matching, coci, top-code, entity-resolution]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/tmc_builder_lessons]]"
artifacts:
  - tmc/_build_college_adts.py
---

# Join loose institutional datasets on the coded key, not freehand text

> **One-sentence summary** — When mapping one CCC dataset onto another, match on
> a **stable coded key** and use freehand titles only as corroboration; reconcile
> entity *names* with an explicit **fail-loud** crosswalk, never a silent fuzzy
> guess. **Not all codes are equal:** C-ID / CCN / CIP / control number are
> external authorities; **TOP is faculty-entered with no gatekeeper — a
> corroborator, not an authority** (steadier at *program* grain than course
> grain, but still corroborate — see
> [[methodology-top-is-a-last-in-line-signal]]).

## Context

Session 61 mapped 3,819 ADT rows from the COCI **program** export onto our 45
ASCCC TMC templates, and joined them to the tab's college list. Both sides are
college-entered and *loose*: ADT program titles are freehand ("UCTP Chemistry",
"AS-T in Biology", "Philosphy"), and college names differ per dataset
("L.A. CITY" vs "Los Angeles City College"). Naive title matching alone reached
only 93/197 distinct titles.

## The claim

### 1. Match on the coded key; corroborate (don't drive) with text

Freehand titles drift, abbreviate, and typo. Stable coded companion fields drift
less. **At *program* grain** a TOP code lines up with a single discipline
*most* of the time — enough to *validate* fuzzy title matches, not enough to
*drive* them. Here, deriving the canonical TOP per target from the
high-confidence title matches, then using TOP to **corroborate** the fuzzy ones,
took coverage from 93/197 titles to **3,814/3,819 rows (99.9%)**. Note this
worked because a second signal (the high-confidence title matches) *led* and TOP
only confirmed — the doctrine's two-signals-agree pattern. Do **not** generalize
this to course grain, where TOP is far noisier (~52% TOP-mixed) and must never
decide a field. The title is the *label*; a stable external code is the *key*;
**TOP is a corroborator**.

### 2. Reconcile entity names with an explicit, fail-loud crosswalk

For the join key that's a *name* (college), resolve via: `normalize()` against
the **join target's own** list → a consult of the canonical taxonomy
(`college_short_names.json` aliases) → a small explicit alias map for the
residual (the "L.A." vs "Los Angeles" forms). Then **assert 100% resolve and
exit non-zero on any miss** — a future extract that introduces a new spelling
must *break the build*, not silently drop a college's data.

### 3. Drop the genuinely-unmappable loudly, don't force them

5 rows didn't map (e.g. "Basic Bleeding Control Provider" — not an ADT at all).
Record them in `_meta.unmatched_*` and move on; forcing a junk row into a real
bucket corrupts the authoritative set worse than omitting it.

## How we got here

- Profiled the coded fields first (`AWARD`, `SUB AWARD`, `STATUS`, `TOP CODE`)
  before writing any matcher — the distributions revealed the ADT predicate
  (`AWARD ∈ {A.A-T, A.S-T}` ∪ `SUB AWARD ∈ {ADT Degree, A.S. UCTP Degree}`) and
  that TOP was the clean key.
- The college crosswalk surfaced the same insight in miniature: the curated
  taxonomy's `short_caps` ("LA CITY") was itself a *third* variant, distinct from
  the program export ("L.A. CITY") — proof that no single normalize() bridges all
  forms, so an explicit alias layer + fail-loud is required.

## When this applies (and when it doesn't)

- **Applies to:** any join across two CCC datasets that both carry a stable code
  (COCI course↔program, MAP↔COCI, funding↔census) — lead with the code.
- **Doesn't apply when there is no shared code** (pure title-vs-title, e.g. the
  EACR exhibit-title unification) — there, similarity scoring is unavoidable, but
  still prefer any structured corroborator (units, subject, issuer) over raw
  title cosine alone.
- **Caveat:** TOP codes are college-assigned and *vary for the same course*
  (~52% of consolidated M-IDs are TOP-mixed). For a *program* they're far more
  stable than for a course, but TOP is still an intent signal — corroborate, and
  prefer the coarser 2-digit division when grouping broadly.

## See also

- `[[docs/tmc_builder_lessons]]` — Session 61, the build
- `[[docs/kb-notes/reference-ui-design-system]]` and §9/§10 in `CLAUDE.md` — the
  TOP-code-varies caveat
- PR `#458` — the implementation

---

*Authoring check: durable, reusable (every cross-dataset CCC join), distilled
(code-over-text + fail-loud reconciliation), self-contained.*
