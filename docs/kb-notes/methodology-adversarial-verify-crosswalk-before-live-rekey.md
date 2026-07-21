---
title: Adversarially verify an id crosswalk before a live PK renumber
created: 2026-07-21
updated: 2026-07-21
tags: [methodology, remint, supabase, verification, data-integrity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/activity_reorg_lessons]]"
  - "[[docs/kb-notes/methodology-alias-map-resolution-semantics]]"
artifacts:
  - kb/activity_reorg_alias_map.json
  - docs/activity_reorg_scope.md
---

# Adversarially verify an id crosswalk before a live PK renumber

> **One-sentence summary** — before re-keying primary keys on a live table (and
> the history rows that hang off them), run an independent ground-truth +
> adversarial-validation pass over the old→new crosswalk; it catches coverage
> gaps and false "empty" claims that a paper review misses.

## Context

The M-ID re-mint playbook (Rule 7) already says "dry-run first, alias map
committed." This note adds the **verification shape** that hardened the COBI
Activities re-key: a live PK renumber where `item_raci` / `item_updates` history
is keyed by the very ids being renumbered, so a crosswalk gap silently drops a
curator's assignments.

## The claim

Before applying a crosswalk that renumbers live PKs, run three independent lenses
(cheap to fan out as a small workflow) and reconcile:

1. **Ground truth** — read the live table + the row-counts of every dependent
   history table (`item_raci`, `item_updates`, lifecycle) keyed by that id. Not the
   in-context snapshot — a *fresh* read. This is the set the crosswalk is checked
   against.
2. **Blind classification** — a second agent, *without* seeing your proposed
   crosswalk, independently classifies each row (keep / re-home / dissolve-merge).
   Disagreements with your map are the interesting cases.
3. **Adversarial validation** — a third agent tries to *break* your specific
   crosswalk against the ground truth: every current id covered exactly once? any
   new-id collisions? every dissolve target survives? every id that HAS history rows
   has a destination? slot-reuse handled atomically?

Fold every confirmed defect into the alias map before any write. A defect the paper
plan will miss: an id that is **both a survivor and a dissolve target** but got
omitted from the "unchanged" bucket — its history drops AND the dissolve points at
nothing. Another: a container labeled "empty" that actually carries history rows.

## How we got here

The COBI Activities reorg (`docs/activity_reorg_lessons.md`, PR #872) ran exactly
this. The adversarial pass caught (a) `3.1.2`/`3.3` omitted from the crosswalk
while *also* being dissolve targets — their RACI/update rows would have been
dropped; (b) the `4.1` "Sprints and Projects" container labeled "empty" while
holding 1 RACI + 2 update rows. Both were folded into `kb/activity_reorg_alias_map.json`
before any Supabase write. The blind-classify lane failed its schema that run
(no second opinion), but the ground-truth + adversarial lenses were sufficient.

## When this applies (and when it doesn't)

- **Applies** to any live re-key where dependent rows are keyed by the mutating id
  (RACI/updates/lifecycle/associations), *especially* on a table a human curates
  against in parallel (Rule 9).
- **Caveat that bit us**: a verification pass validates the crosswalk *as it was at
  that moment*. If you edit the crosswalk afterward (we added sprint-symmetry +
  deeper nesting), **re-run the dry-run** — a stale "verified" stamp is worse than
  none.
- **Overkill** for a rename with no id change, or a re-key on a table with no
  history dependents and no live curator.

## See also

- `[[docs/activity_reorg_lessons]]` — the workstream that produced this
- `[[docs/kb-notes/methodology-alias-map-resolution-semantics]]` — permutation +
  slot-reuse semantics for simultaneous alias maps
- PR `#872` — the implementation (spec + safe increments; generator + re-key pending)

---

*Authoring check: durable (re-key verification generalizes), reusable (any live
PK renumber with history dependents), distilled (one concept: verify-before-apply
with independent lenses), self-contained (frontmatter + opener tell the claim).*
