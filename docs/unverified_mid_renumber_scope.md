---
title: Unverified-M-ID renumber re-mint — close the gaps + re-sort
date: 2026-06-23
kb-status: published
type: scope
tags: [m-id, re-mint, renumber, rule-7, alias-map, curation, staging-cleanup, subj4]
artifacts:
  # mirror this pair (cleanest recent re-mint):
  - kb/_uc_cur_zscheme_dryrun.py          # shared compute_plan() — measurement
  - kb/_uc_cur_zscheme_apply.py           # imports compute_plan(), re-derives, writes
  # the re-key surface an alias map must touch:
  - kb/coci_minted_courses.json           # M-ID identity keys
  - kb/coci_minted_memberships.json        # M-ID → member join keys
  - kb/coci_minted_singletons.json         # single-college M-ID keys
  - kb/coci_articulations.json             # course_id (re-key via _remint_apply_articulations.py)
  - kb/coci_curation.json                  # self-keyed rows + merge_into pointers
  - kb/promotions.json                     # re-key via _rekey_promotions.py (permutation semantics)
  - kb/_rekey_kb_curation_supabase.py      # shared Supabase kb_curation + supabase-rekey.yml
  - kb/_post_apply_chain.py                # post-apply regen chain
  - kb/discipline_canonical_subj4.json     # SUBJ4 invariant (read-only here)
related:
  - docs/coursecontrolnumber_remint.md
  - docs/uc_cur_zscheme_remint_scope.md
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md
  - docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md
---

# Unverified-M-ID renumber re-mint

Scope-only — **no build yet, by design** (see *Timing*). This captures Sam's
locked decisions (2026-06-23) + the grounded machinery so the next session can
execute it cleanly once the merge wave settles.

## Decisions locked (Sam, 2026-06-23)

1. **Full Rule-7 re-mint** — not a cosmetic relabel. It carries the whole playbook
   (dry-run → committed alias map → fresh-read Supabase → re-key everything
   downstream → atomic land in one cron window).
2. **Unverified-only, for now** — verified M-IDs keep their numbers fixed. (A later
   **override** can opt verified ones in; out of scope for the first pass.)
3. **"Intuitive" = close the gaps + re-sort** — within each `(canonical SUBJ4, band)`
   bucket, re-sequence the unverified M-IDs to a contiguous `001, 002, …` ordered by
   normalized title.
4. **One pass** — run it **once** after the merge cleanup settles, not per-merge.
   ("Mustn't get carried away with oneself.")

## Why it's needed

The minter (`kb/_seed_coci_minted_mids.py`) is **one-shot** (provenance only — never
re-run over reviewer edits) and there is **no compaction engine**. When a curator
folds an M-ID into another via `merge_into`, the absorbed number is **never
reclaimed** → a subject's M-IDs read non-contiguously (swiss-cheese) after a merge
wave. The renumber is the *consolidation* step that makes the surviving unverified
space read cleanly again.

## Scope — defining "unverified"

Per `statusOf(r)` (`unified_courses.js`) a row is **Verified** iff
`r.locked || r._curated || r.reviewed_by || r.flags.reviewed`. So:

> **An M-ID is UNVERIFIED iff** `id_system == "M-ID"`, **not** `locked` (not a
> C-ID/CCN/anchor), and it has **no confirming entry** in `kb/coci_curation.json`
> (no `reviewed_by`). This is the seed-draft cohort — overwhelmingly the
> `seed_untouched_discipline` rows (~10.6k at last audit).

**Conservative by design:** any curation touch (discipline set, **a merge**, a
description, an explicit Verify) writes `reviewed_by` → that M-ID is treated as
verified and its number is **frozen**. We never renumber anything the curator has
interacted with. (Note the `reviewed_by` vs `validated_by` distinction in
`kb/_apply_curation.py`: a *merge* sets `reviewed_by` but **not** `validated_by` —
either way it freezes the number for this pass.)

## "Intuitive" — the deterministic recipe

1. Load `coci_minted_courses.json` (+ singletons) and `coci_curation.json`; resolve
   each row's **canonical SUBJ4** from `discipline_canonical_subj4.json`.
2. Partition M-IDs into **verified (frozen)** vs **unverified (renumber)**.
3. Group the unverified set by `(canonical SUBJ4, band)` — band = `1` credit / `9`
   noncredit. Sort each bucket by **normalized title** (the minter's own tie-break).
4. Assign a contiguous sequence `001, 002, …` per bucket — **skipping any number a
   frozen verified M-ID already holds in that bucket** (no collisions with fixed
   numbers). Corroborated → `SUBJ M<band><seq:03d>`; stand-alone → `SUBJ M<band><d><LL>`
   (same widths as today).
5. Emit the old→new `alias_map.json`.

**Membership key is `(college, control_number)`** post the 2026-05-22 CCN re-mint, so
the renumber only rewrites `course_id` **keys** — member college rows are untouched.

## Invariants to preserve (do not break)

- **SUBJ4 is independent of the number** — this pass **must not change any SUBJ4 or
  discipline.** A SUBJ4 change is a *separate, heavier* re-mint. Honor the
  one-discipline→one-SUBJ4 invariant + the umbrella exceptions (Foreign Languages
  `FL**` per-language; Kinesiology `KINE`/`ATHL`/`PEDS`).
- **Verified numbers are anchors** — never reassign one; the unverified sequence
  routes around them.
- **Atomic land in one cron window** (06:17 UTC primary) — git apply + Supabase
  re-key + post-chain all inside it so the daily rebuild consumes a consistent state.

## The re-key chain (full Rule-7 — the checklist)

Mirror the **UC-CUR → Z-scheme** pair (cleanest recent exemplar): a shared
`compute_plan()` in `_…_dryrun.py`, re-derived + asserted in `_…_apply.py`; receipts
in `kb/<name>_out/<date>/` (`alias_map.json`, `collisions.json` **must be empty**,
`report.md`, `apply_log.json` with `_status: "APPLIED"`); apply gates **V1–V5**
(V5 = per-row `_remint_from` provenance stamps).

Apply the alias map to **every** surface (skipping one = severed evidence):

| Surface | Re-key |
|---|---|
| `coci_minted_courses.json` | identity dict keys |
| `coci_minted_memberships.json` | join dict keys |
| `coci_minted_singletons.json` | dict keys |
| `coci_articulations.json` | `course_id` (+ recompute adoption_leverage) — `kb/_remint_apply_articulations.py` |
| `coci_curation.json` | self-keyed rows **+ `merge_into` pointer values** |
| **`kb/promotions.json`** | `kb/_rekey_promotions.py --apply` — **permutation semantics** (apply-once, chronological, era-stamp `_rekeyed_through`, V5). *This is the one four prior re-mints skipped — it severs 53% of the Phase A/B fold evidence if missed.* |
| **Supabase `kb_curation`** (shared, live) | `kb/_rekey_kb_curation_supabase.py` via `.github/workflows/supabase-rekey.yml` (`SUPABASE_SERVICE_KEY`); fresh-read git surface == live before running |

**Post-apply chain** (`kb/_post_apply_chain.py`, fail-fast, after git + Supabase):
promotions re-key → `_seed_canonical_subj4.py` (CSR re-seed) → `_row_audit.py`
(watch `subject_collision_signal` — should NOT rise; SUBJ4 unchanged) →
`_subj4_dryrun.py` into `/tmp` (**must be a no-op** = 0 moves) → desc/title
consolidation dry-runs (so dead ids leave the worklists). Alias-map resolution
rules: [`methodology-alias-map-resolution-semantics.md`](kb-notes/methodology-alias-map-resolution-semantics.md).

**Artifact policy:** code-only PR (scripts + receipts), squash-merge on green, then
`workflow_dispatch` `daily-dashboard.yml` to publish the regenerated
`unified_courses_*.js`.

## Timing / unblock

**Build only after the merge cleanup wave settles** — renumbering re-keys everything
downstream, so it's the once-at-the-end consolidation, not an ongoing routine. It
fits Rule 7's logic exactly: principled re-mints during the staging-cleanup phase,
then **re-lock to stable identifiers at faculty-publication** (after which this pass
is no longer permitted). The later **verified-opt-in override** is a follow-on once
the unverified pass is proven.

## Build plan (when unblocked)

1. `kb/_unverified_mid_renumber_dryrun.py` — `compute_plan()` (the recipe above) +
   receipts; **gate 0: `collisions.json` empty**; Sam reviews the report.
2. `kb/_unverified_mid_renumber_apply.py` — imports `compute_plan()`, re-derives,
   asserts spec==reality, writes the git re-key surface + emits the Supabase SQL.
3. Run the Supabase re-key + the post-apply chain; verify the `_subj4_dryrun` no-op.
4. Code-only PR → merge → dispatch the dashboard workflow.
