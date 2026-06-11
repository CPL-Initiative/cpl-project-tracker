---
title: Re-key every id-keyed artifact — a re-mint isn't done until the side manifests move
created: 2026-06-11
updated: 2026-06-11
tags: [methodology, remint, rule-7, alias, promotions, phase-a, phase-b, data-integrity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-fan-in-discipline-convergence]]"
  - "[[docs/official_id_fold_scope]]"
artifacts:
  - kb/_rekey_promotions.py (the repair tool — dry-run/--apply, V1-V4 gates, idempotent)
  - kb/promotions_rekey_out/ (receipts)
---

# Re-key every id-keyed artifact

> **One-sentence summary** — when identities are re-keyed, EVERY artifact
> keyed by those ids must move in the same window, including the quiet side
> manifests no UI reads directly; an exact-id lookup over a stale manifest
> fails **silently** (no error, no audit flag — features just stop firing).

## The failure (Session 40, 2026-06-10/11)

`kb/promotions.json` — the control-number-exact receipts of which member
courses carried an official C-ID/CCN — is the ONLY evidence source for the
automatic Phase A/B official-ID fold in `export_unified_courses()`. The
lookup is exact-id. Four re-mints (canonical-SUBJ4 fold, over-merge splits,
the FL SUBJ4 split, the convergences + twin-merge) re-keyed the identities
without re-keying the manifest:

- **53% of the evidence (1,111 of 2,083 records) pointed at dead ids.**
- Phase B consolidation decayed from its original ~896 folds to 455 —
  nobody noticed, because nothing *errored*. Rows that should have folded
  under their C-ID anchors (the whole Spanish family: 30 witnesses for
  "Intermediate Spanish I" → SPAN 200) simply sat in the CCR as separate
  rows until a human asked why.
- The decay was invisible to the auditor (no rule reads promotions) and to
  every test (none asserted fold counts).

## The repair pattern

1. **Resolve through the applied alias chain** (every `alias_map.json`
   receipt, chronological, iterate until stable; over-merge splits follow
   the plurality branch). The Rule-7 discipline of committing an alias map
   per re-mint is what made a 4-hop repair possible at all.
2. **Fold colliding keys** (twin losers → winners: sum witness counts,
   union college lists) — merges make evidence *stronger*.
3. **Conservation gates**: total witness count unchanged (V1), target-id
   set unchanged (V2), all non-flagged keys live (V3), idempotent (V4).
   Keep unresolvable keys IN PLACE flagged `_unresolved` — never delete
   evidence. (V1 immediately caught a shallow-copy aliasing bug in the
   repair script itself — the fold mutated the source totals. Write the
   gates first.)
4. **Institutionalize**: the re-key joins the playbook checklist (fan-in
   guard 7; the re-mint artifact table; CLAUDE.md Rule 7), so the *next*
   re-mint can't skip it.

## The registry (this repo, 2026-06-11)

Id-keyed artifact classes that MUST move together at every re-key:

| Artifact | Mover |
|---|---|
| `kb/coci_minted_memberships.json` | the re-mint apply itself |
| `kb/coci_articulations.json` | `kb/_remint_apply_articulations.py` (or the apply's ripple step) |
| `kb/coci_curation.json` + **Supabase `kb_curation`** | live UPDATEs + overlay mirror (fan-in guard 6) |
| **`kb/promotions.json`** | `kb/_rekey_promotions.py` (this note's lesson) |
| baked `unified_courses_*.js` / CER data | regenerate (next cron or live-on-merge) |

When adding a NEW id-keyed artifact, add it to this table and to the
playbook checklist in the same PR that introduces it.

## The general claim

Any system that (a) re-keys identifiers behind alias maps and (b) keeps
side manifests keyed by those identifiers will reproduce this bug unless
re-keying is a *checklist property of the artifact class*, not a memory of
the person doing the re-mint. Silent-miss lookups deserve a drift detector:
a cheap standing check that counts how many manifest keys still resolve to
live ids (here: `kb/_analyze_official_fold_evidence.py`, whose first run
found 53% drift).

---

*Authoring check: durable (every future re-mint), reusable (the registry +
gates + drift-detector pattern transfer to any keyed manifest), distilled
(one failure, one repair pattern, one registry), self-contained.*
