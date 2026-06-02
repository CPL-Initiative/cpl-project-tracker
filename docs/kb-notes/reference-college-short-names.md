---
title: Reference — College short-name dataset + resolver
created: 2026-06-02
updated: 2026-06-02
tags: [reference, colleges, chips, lookup, ui]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-derive-from-dom]]"
artifacts:
  - kb/college_short_names.json
  - kb/_seed_college_short_names.py
  - college_short_names.js
---

# Reference — College short-name dataset + resolver

> **One-sentence summary** — a curator-provided full-name → short-name map for
> compact college chips across the CCR / EACR / CER views, resolved through a
> normalize()-fallback so one short name covers every spelling a college appears
> under in the data.

## Context

College chips on the dashboard rendered full names ("College of the Desert",
"Los Angeles Southwest College"), which crowd the dense adopter/potential lists.
The CPL team supplied a 118-row `CollegeName → CollegeShortName` table to shorten
them. The wrinkle: the *same* campus appears under several spellings across the
data sources, so a flat exact-key map would miss most of them.

## The claim

**Store the dataset committed (not in Supabase), keyed by canonical name, and
resolve at render time through a normalize() fallback.**

- **Source of truth:** `kb/college_short_names.json` — `_meta` + a `colleges[]`
  of `{canonical, short, short_caps, aliases[]}`. Both casings stored: `short`
  (Title Case, the chip default) and `short_caps` (ALL CAPS, as provided).
- **On-page artifact:** `college_short_names.js` — `window.CPL_COLLEGE_SHORT`
  (the records) + `window.cplCollegeShort(name[, style])`. Generated from the
  JSON by the seed script; `<script>`-loaded after `college_lookup.js` in both
  `CPL_Dashboard.html` and `index.html`.
- **Resolution:** exact match on canonical/aliases → `normalize()` fallback →
  **else return the original name** (a chip never renders blank). `style` is
  `"short"` (default) | `"caps"` | `"full"`.
- **`normalize()` folds** (identical in the Python seed and the JS resolver):
  funding suffixes (`Credit` / `Non-Credit` / `Noncredit`), `Community` /
  `Junior`, `College` / `University`, `of`/`of the`, punctuation, and **n-tilde
  + the `CaÃ±ada` mojibake** already sitting in `unified_courses_data.js`.
- **Consumers call it lazily** (`var f = window.cplCollegeShort; …`) at render
  time, **never capturing it at IIFE-parse time** — `credential_reference.js`
  loads *before* `college_short_names.js`, so a parse-time capture would freeze
  the fallback. Full name always goes in the chip's `title`; the short is the
  visible text.

### Why not Supabase

Static reference data (set once, ~118 rows) — the profile of the existing
committed `college_lookup.js` / `kb/reference/*.json`. Supabase here is reserved
for *live curator-edited overlays* (disciplines, credentials, workplan) with
RLS/auth/daily-sync. Short names need none of that. (If in-dashboard editing is
ever wanted, add a `kb_curation`-style overlay then.)

## How we got here

Reconciled the curator table against the live name universe: 122/123 chip-name
strings from `unified_courses_data.js` `colleges[]` + the
`adopter_names`/`potential_names`/`potential_colleges` arrays in
`statewide_data.js` / `credential_reference_data.js` resolve (the 1 miss is the
`CA MAP INITIATIVE COLLEGE` sentinel, not a real college). Only the **West Hills
rename** needed explicit aliases — `West Hills College Coalinga/Lemoore` (old)
and `Coalinga College`/`Lemoore College` (new) both appear, so both spellings
alias to one short. Verified with 22 resolver unit cases + 8 jsdom integration
assertions against the shipped `collegeChip` (EACR) and `collegeBadgeGroup`
(CER) source.

Data-quality cleanups applied vs the raw input: `EVERYGREEN VALLEY` → `EVERGREEN
VALLEY` (typo), `REEDLEY COLLEGE` → `REEDLEY` (dropped stray "COLLEGE"), trailing
space trimmed on `NAPA`. Two latent data bugs surfaced (not fixed here, resolver
is robust to both): the `CaÃ±ada College` mojibake in `unified_courses_data.js`,
and a `Consumnes River College` typo in `college_lookup.js`.

## When this applies (and when it doesn't)

- **Wired surfaces:** CCR (`unified_courses.js` adopted/adoptable + the inverse
  view), EACR (`statewide_interactive.js` adopter/potential chips + prescriptive
  rows), CER (`credential_reference.js` green/orange badges + per-identity cell).
- **Deliberately full-name (not shortened):** CSV/Word **exports** (a document
  needs unambiguous names) and **filter match data** (filters key off full
  names; the chip `title` carries the full name for hover/search).
- **To extend / re-key:** edit the table or the `EXTRA_ALIASES` / `SPECIAL_TITLE`
  maps in `kb/_seed_college_short_names.py`, re-run it (idempotent), and commit
  the regenerated `kb/college_short_names.json` + `college_short_names.js`. The
  script asserts no two colleges collapse to the same normalized key and reports
  any chip-name string that fails to resolve. **Not** part of the daily cron —
  it's static, regenerated only when the dataset changes.

## See also

- `college_lookup.js` — the sibling static metadata layer (`district`,
  `swRegion`) this complements.
- [[docs/kb-notes/methodology-derive-from-dom]] — same "resolve against the real
  rendered universe, don't hardcode" instinct that drove the coverage check.
