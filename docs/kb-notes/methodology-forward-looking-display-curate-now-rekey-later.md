---
title: Forward-looking display for a curate-now / re-key-later split
created: 2026-06-24
updated: 2026-06-24
tags: [methodology, ui, curation, re-mint, subj4, ccr, derived-values]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_cluster_cleanup_lessons]]"
  - "[[docs/kb-notes/reference-common-vs-local-subj-and-discipline-cardinality]]"
artifacts:
  - unified_courses.js
  - kb/discipline_canonical_subj4.json
---

# Forward-looking display for a curate-now / re-key-later split

## The situation

A displayed value is a **deterministic function of a field the curator edits live**, but the
field it's physically derived from only changes in a **batched, deferred** step. Concretely in
the CCR: **Common SUBJ = f(Discipline)** (one discipline → one canonical SUBJ4, §11). A curator
re-disciplines `ARTS M1348` → Photography *instantly* (a `kb_curation` write), but the M-ID's
4 letters only become `PHOT M####` at the next **canonical-SUBJ4 fold** (a Rule-7 re-mint, run
in batches). If the column reads the stored letters, a freshly re-disciplined row keeps showing
the stale `ARTS` until the fold — which reads as "I changed the discipline and nothing happened."

## The pattern

Show **where the value WILL land**, not the stale stored value, the moment the curator's edit
makes it determinable — with a small **pending marker** that the physical re-key hasn't caught
up yet.

- Compute the forward value from the curated field: `commonSubjOf(r)` returns
  `DISC_COMMON_SUBJ[curatedDisc(r)]` when it differs from the stored prefix, else the stored
  prefix.
- Gate it on **curated** state only. A *generated/inferred* value stays literal so the column
  doesn't churn on low-confidence machine fills (the existing collision flag already tracks
  those). Forward-display is for **deliberate** edits.
- Mark the lag visibly (`⟲`, hover: "re-keys to PHOT at the next fold") so the divergence
  between the display and the ID is honest, not a glitch.
- Use the forward value consistently — column **and** filter **and** sort — or they diverge.

## Why not just re-key immediately?

Because the physical re-key has ripples (here: memberships, articulations, promotions, Supabase,
merge pointers) that a governance rule (Rule 7) deliberately batches into a dry-run-gated,
atomic pass. A per-edit live re-key would bypass that. So: **curation is live and cheap;
identity re-key is batched and governed.** The forward display bridges the perceptual gap
between the two speeds without collapsing them.

## Pitfall: don't let the deferred backlog skew the derived map

`DISC_COMMON_SUBJ` was bootstrapped as the **modal** SUBJ among current rows of each discipline.
A wave of re-disciplined-but-not-yet-folded rows tallies their *stale* prefix under the *new*
discipline, which can flip the modal. Fix: prefer the **authoritative** map (the
curator-confirmed `canonical_subj4` from `discipline_canonical_subj4.json`) over the row modal,
and re-render when it loads. The forward value must come from ground truth, not from the lagging
population it's trying to lead.

## Generalizes to

Any "edit is instant, materialization is batched" surface: a renamed slug that a CDN re-points
nightly, a re-categorized item whose search index rebuilds on cron, a status that a downstream
job reconciles. Show the destination + a pending affordance; reconcile in the batch.
