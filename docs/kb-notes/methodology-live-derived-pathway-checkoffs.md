---
title: Methodology — derive pathway check-offs from live articulation data, never bake them
created: 2026-07-10
updated: 2026-07-10
tags: [methodology, cpl-pathways, articulations, live-data, dashboard, presentation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[cpl_pathways_lessons]]"
  - "[[reference-ui-design-system]]"
artifacts:
  - cpl_pathways.js
  - cpl_pathways_data.js
  - tests/cpl_pathways.test.js
---

# Methodology — derive pathway check-offs from live articulation data, never bake them

> **One-sentence summary** — when a presentation surface claims "these courses
> are CPL-covered," store only the degree's *requirements* as curated data and
> compute the ✓ marks at render time from the live articulation dataset, so
> the claims can never drift from the platform of record.

## Context

The 🎓 CPL Pathways tab (SkyIron side-lane, 2026-07-10) shows Cerritos College's
Field Ironworker Supervisor BS course map with CPL check-offs for the
California Apprenticeship Council. The headline claim — "a journeyworker
arrives with 31.5 units" — is outreach material; a stale number here is a
credibility wound. Meanwhile Cerritos keeps adding articulations in the MAP
platform (the Structural track is in progress), so any baked list is wrong
within weeks.

## The claim

Split the data into two lifetimes:

1. **Requirements are curated, slow-moving** — a static definition file
   (`cpl_pathways_data.js`: sections → courses with code/title/units). This is
   the only thing a human maintains.
2. **Coverage is derived, live** — at render time, cross-check each course code
   against the articulation dataset the dashboard already regenerates daily
   (`credential_reference_data.js`): a course is ✓ iff the college has a MAP
   articulation line landing on it. Exam-based options (CLEP ◆) come from the
   systemwide exam-credit chart baked into the same dataset.

Consequences that made this pay off on day one:

- **Future articulations light up with zero edits** — the "articulations in
  progress" card flips ✓ as the college works, which is itself a demo of the
  platform's value.
- **The billboard number is live-verified**, not copywriter memory; the page
  footnotes the dataset's extraction date.
- **Normalization is the load-bearing detail** — MAP entry drift ("40.5") vs
  catalog spelling ("40.50") must resolve to one key or a ✓ silently drops and
  the headline understates. Normalize course numbers numerically
  (`parseFloat(num).toFixed(2)`), test BOTH directions.
- **`no_count` sections** — alternate-track course lists render and
  live-resolve but stay out of the unit buckets: a student completes ONE
  track, so a future ✓ flip must not inflate the advertised total.
- **Fail soft** — baked fallback stamps + an honest "showing the curated
  snapshot" note when the live payload fails to load.

Two supporting patterns shipped with it:

- **Published default vs view override** — the pathway's publication stage
  (Discussion Draft / Active / Tabled) ships as a field in the data file (the
  published truth, defaulting to Discussion Draft so a mock-up can never
  present as Active), while the on-page selector writes only localStorage (a
  per-browser presentation flip). Curated truth and presenter convenience
  never share a store.
- **Print-window token block** — a ⬇ PDF extract that clones the DOM into a
  fresh window has no `:root`, so `var(--token)` can't resolve; inject a
  literal-hex First Light token block there (the same sanctioned exception as
  canvas `fillStyle` / SVG presentation attributes).

## When this applies (and when it doesn't)

- **Applies** to any surface that asserts coverage/eligibility against a
  dataset the pipeline already refreshes: pathway maps for other programs
  (carpentry next), college CPL fact pages, partner-facing one-pagers.
- **Doesn't apply** when the authoritative source isn't already in the daily
  data (e.g. a college's unpublished curriculum) — those stay curated rows
  with their provenance footnoted, upgraded to live derivation when the data
  lands.

## See also

- `docs/cpl_pathways_lessons.md` — the workstream story + open items
- `docs/kb-notes/methodology-rekey-derived-identity-maps.md` — the sibling
  lesson (derived maps go stale unless rebuilt from the source of record)

---

*Authoring check: durable (the pattern outlives the ironworker deck), reusable
(every future pathway/program page), distilled (one concept: derive coverage,
curate requirements), self-contained.*
