---
title: Methodology — Three-layer scenario config (SCENARIO ?? SHARED ?? BASE) for audience-facing model tools
created: 2026-07-03
updated: 2026-07-03
tags: [methodology, config, supabase, team-phrase, funding, scenario-tool, session-98]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-server-enforced-shared-password-gate]]"
  - "[[docs/kb-notes/methodology-committed-workbook-models]]"
artifacts:
  - cpl_funding.js
  - cpl_funding_data.js
  - funding/supabase_cpl_funding_config.sql
  - team_phrase.js
---

# Methodology — Three-layer scenario config (SCENARIO ?? SHARED ?? BASE)

> **One-sentence summary** — when a dashboard "data tab" becomes a knob an
> external audience *plays* with, split it into three config layers — baked
> data defaults, a shared team-editable base model, and an anonymous
> per-browser scenario — resolved per field as `SCENARIO ?? SHARED ?? BASE`.

## Context

The Implementation Funding tab started as a workbook extract with a
per-browser what-if sandbox. Sam then wanted the CCC Chancellor to "try some
scenarios" against a team-configured model — year-specific priority metrics,
selectable funding years, an editable feeder carve-out. One localStorage layer
can't serve both needs: the team needs edits **everyone sees**; the Chancellor
needs to explore **without credentials and without affecting anyone**. Full
story: `docs/cpl_funding_lessons.md` (Session 2).

## The claim

Model the tab as three ordered config layers and resolve **per field**, not
per blob:

1. **BASE** — the committed static data file. Stable data-derived facts
   (rosters, headcounts, census context) plus seeded policy defaults. Never
   edited at runtime.
2. **SHARED** — one JSONB row in Supabase (anon SELECT; write gated
   `is_allowed_reviewer() OR team_pass_ok()`). Holds only the fields the team
   has overridden. This is the model every visitor opens to.
3. **SCENARIO** — a localStorage blob of only the fields this browser has
   overridden. No credentials needed; invisible to everyone else.

Effective value = `SCENARIO[field] ?? SHARED[field] ?? BASE[field]`. An edit
writes to SHARED when the team phrase is unlocked, else to SCENARIO. Sparse
overrides (store only what changed) mean a later BASE refresh flows through
everywhere the team/viewer didn't explicitly override.

Corollaries that made it work:

- **Compute derived values live, never bake them.** The per-college dollar
  columns were REMOVED from the data file — any baked derivative of an
  editable input is stale the moment a knob moves. The builder/committed file
  keeps inputs; the renderer computes the chain per render.
- **Promote on unlock.** If a user explores anonymously and *then* unlocks,
  deep-merge their scenario into SHARED and save ("what you were exploring
  becomes the team's model"); keep the scenario if the save fails so nothing
  is lost.
- **Reset is layer-scoped.** Locked reset clears the scenario; unlocked reset
  clears the shared config. One button, two meanings, labeled accordingly.
- **Rollback on RLS no-op.** Keep a `SHARED_SAVED` server-confirmed copy;
  a PATCH that fails (or "succeeds" with zero rows — the PostgREST RLS
  silent-no-op) restores it and surfaces the failure
  (see `methodology-server-enforced-shared-password-gate`).

## How we got here

The prior sandbox (`cpl_funding_whatif_v2`) proved per-browser exploration
works; the team-phrase gate (Session 83, hardened #598) proved shared writes
without per-user accounts work. This note is the composition: the same
`x-team-pass` RLS gate, applied to a **config blob** instead of domain rows,
with the localStorage sandbox re-scoped as the anonymous layer above it.
Validated by `tests/cpl_funding.test.js` (the C6/C7/C7b layer-resolution,
shared-edit, and promotion assertions).

## When to reuse

Any surface where (a) a non-team audience should explore freely, (b) the team
curates a shared base, and (c) the underlying data refreshes on its own
cadence. Candidates: the Budget what-if, TMC what-if views, future
Chancellor-facing planning tools.

## Pitfalls

- Don't store whole-blob snapshots in SHARED/SCENARIO — field-sparse
  overrides or a BASE refresh never reaches users.
- Don't bake any number a knob can change (the "compute live" corollary).
- The per-field accessor must treat `undefined`/`null` as "not overridden";
  a stored `0` or `""` IS an override (use a firstDefined helper, not `||`).
