---
title: A soft-delete overlay on dual-rendered rows must be scoped to ONE render layer
created: 2026-07-02
updated: 2026-07-02
tags: [methodology, soft-delete, overlay, data-model, activities-projects, project-lifecycle]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/project_lifecycle_lessons]]"
  - "[[docs/kb-notes/playbook-soft-delete-generated-entity-via-overlay]]"
artifacts:
  - excel_to_dashboard.py (activity_layer_ids scrub + grid dedup)
  - project_lifecycle.js (activityLayerIds)
  - raci.js (load() immune filter)
---

# A soft-delete overlay on dual-rendered rows must be scoped to ONE render layer

> **One-sentence summary** — when one table's rows render on two surfaces with
> different meanings (here: Activity-metrics cards AND Projects-Grid cards from
> the same `public.projects` rows), a soft-delete overlay keyed by row id alone
> deletes BOTH meanings at once; declare which layer the overlay governs, make
> the other layer immune at every consumer, and de-duplicate the rendering so
> users never face the ambiguity.

## Context

`public.projects` rows dual-render: the official 1.x–4.x sub-activities appear
as Activity-metrics KPI cards *and* (pre-Session-95) as Projects-Grid cards.
The `project_lifecycle` soft-delete overlay (Session 84) keyed on `project_id`
and deliberately removed *both* renders. On 2026-07-02 Sam tabled 22
"redundant project cards" — and his Activity cards, their RACI rows, and their
Workplan Goals ladders vanished with them. Full story:
`docs/project_lifecycle_lessons.md` (2026-07-02 section); fix PR #652.

## The claim

Three parts, in order of importance:

1. **Scope the overlay to one layer, in data terms.** Define the boundary as a
   computable id set (here `activity_layer_ids` = `derive_core_activity_ids`
   minus the `5.x` family) and make the other layer *immune*: every consumer
   (generator, each client overlay, every downstream filter) ignores overlay
   rows whose id falls in the immune set. Enforce at the consumer, not just
   the UI — stale or API-written rows must also be inert.

2. **De-duplicate the rendering.** The mixup was possible only because the
   same row showed twice with two different affordance sets. Once each row has
   exactly one primary surface (sub-activities → Activity card; work items →
   grid card), the "which one do I delete?" trap disappears. Check the
   surviving surface carries the affordances the removed one had (here the
   Activity card already had Report/Attach/RACI/Update/Nudge — zero loss).

3. **The classifier needs a semantic boundary, not just a structural one.**
   The first draft defined the immune set purely structurally ("has a KPI
   ladder") — which silently captured `5.1`, a *real project* that happens to
   carry a ladder, and resurrected a deliberate tabling. The boundary that
   held was structural + semantic: ladder-bearing AND in the official 1.x–4.x
   workplan id space. Always A/B the classifier against live data before
   trusting it (the regen A/B caught this in minutes).

## How we got here

Sam's 23-row mistaken sweep + "can you help me separate these so that I can
create, table, delete a project without it affecting the Activity" +
"my goal is to have no redundant activity or project cards." Implemented as a
generator scrub (`excel_to_dashboard.py` main()), client mirrors
(`project_lifecycle.js` `activityLayerIds()`, `raci.js` load()), and the grid
dedup. Guarded by `tests/project_lifecycle.test.js` (immunity checks incl. the
5.x carve-out).

## When this applies (and when it doesn't)

Applies whenever a soft-delete/visibility overlay keys on a row id that feeds
multiple render layers with distinct meanings (cards vs ladder tables vs
matrices). Doesn't apply when the duplication is intentional mirroring of ONE
meaning (e.g. the same card on two tabs) — there, hiding both is correct; the
distinction is whether the two renders represent different *roles* of the row.

## See also

- `docs/project_lifecycle_lessons.md` — 2026-07-02 section (the incident + fix receipts)
- `docs/kb-notes/playbook-soft-delete-generated-entity-via-overlay.md` — the base overlay pattern this scopes
- PR #652 — implementation + tests
