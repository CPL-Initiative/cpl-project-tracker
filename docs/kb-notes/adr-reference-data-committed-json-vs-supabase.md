---
title: Reference-data home — committed JSON by default, Supabase only for live curation
created: 2026-06-18
updated: 2026-06-18
tags: [adr, architecture, reference-data, supabase, taxonomy]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/tmc_builder_lessons]]"
artifacts:
  - kb/college_short_names.json
  - kb/reference/
  - tmc/_build_college_adts.py
---

# Reference-data home — committed JSON by default, Supabase only for live curation

> **One-sentence summary** — A reference authority (college names, MQ
> disciplines, C-ID descriptors, TOP maps, a name crosswalk) lives as a
> **committed JSON file**; it graduates to a Supabase table **only when curators
> need to edit it live through the dashboard**, and even then the JSON stays the
> source-of-record and Supabase is the edit overlay.

## Context

Session 61 (the COCI program/ADT overlay) hit the recurring CCC pain that the
same college is spelled differently in every dataset ("L.A. CITY" / "Los Angeles
City College" / "LA CITY"). Sam floated building a **Supabase taxonomy** of
college names "consulted along the way," and explicitly asked for pushback. This
ADR is the answer, generalized past college names to any reference authority.

## The claim

**Default a reference authority to a committed JSON file. Move it to Supabase
only when live curator editing is a real workflow — and keep the JSON as
source-of-record even then.**

Decision rule — choose Supabase **only if ALL** hold; otherwise committed JSON:
1. **Curators edit it through the dashboard** (not engineers via PR).
2. Edits must show **live**, before the next daily build.
3. The edit cadence is high enough that PR-per-change is friction.

If you do move it, follow the established **overlay pattern** (`kb_curation` ↔
`kb/coci_curation.json`): the committed JSON remains the canonical baseline; the
Supabase table is a *diff* the daily cron folds back into the JSON. Never let
Supabase become the *only* copy of a reference authority.

## How we got here

Every reference authority in this repo is committed JSON for the same reasons:
- **The consumers are CI + static builders** (the daily cron, the `kb/_*.py`
  generators, the static `tmc/_build_*.py`). A committed file is **zero-network,
  zero-auth, offline, and deterministic** — a Supabase read would add a failure
  mode to a build that must not break (Rule 1 cron).
- **Diffable + reviewable.** A name-crosswalk change shows up in `git diff` and
  the PR; a Supabase row edit is invisible to code review.
- **Obsidian-synced.** Committed `.md`/`.json` flow to the vault automatically;
  a DB table does not.
- **Identity changes rarely.** Colleges, MQ disciplines, C-ID descriptors are
  near-static — the high-churn justification for a DB doesn't exist.

`kb/college_short_names.json` already *is* the college-name taxonomy (118
colleges; `canonical` + `short` + `short_caps` + `aliases[]` + a `normalize()`
resolver). The right move for a new loose dataset is to **add its spellings as
`aliases`**, not to stand up a parallel Supabase table.

The counter-example that *did* earn Supabase: `kb_curation` (discipline edits)
and `tmc_curator_notes` — curators edit those live in the dashboard, so they meet
all three tests. Both still keep a committed JSON/snapshot baseline.

## When this applies (and when it doesn't)

- **Applies to:** lookup/crosswalk/vocabulary authorities consumed at build time
  (college names, disciplines, descriptors, TOP/CIP maps, subject maps).
- **Does NOT apply to:** data curators actively edit through the UI with a
  live-visibility requirement (→ the Supabase overlay pattern), or genuinely
  high-volume transactional data (submissions, chat logs, reflections).
- **Grey zone:** a crosswalk that's *mostly* engineer-maintained but
  *occasionally* curator-corrected — start as committed JSON; add the Supabase
  overlay later if/when the curator-correction demand actually appears. Don't
  pre-build it.

## See also

- `[[docs/tmc_builder_lessons]]` — Session 61, the workstream that raised it
- `[[docs/kb-notes/methodology-two-mode-sync]]` — the JSON↔Supabase overlay sync
- `kb/college_short_names.json`, `kb/coci_curation.json` ↔ `kb_curation`

---

*Authoring check: durable (the trade-off is stable), reusable (every future
reference-authority decision), distilled (one decision rule), self-contained.*
