---
title: "Session 225 handoff — the re-mint series is applied: the codes, the materialized machine clusters, and the worklist the land surfaced"
created: 2026-09-03
updated: 2026-09-04
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 225

Your moniker is **SkyFold** (assigned by SkyTune at sign-off, per Sam's
2026-09-03 template): the queue's head is the fold worklist the land surfaced.
Predecessors: SkyCheck S222 → SkyOrbit S223 → **SkyTune S224**.

## What S224 did

Two halves in one day. The morning half was the measure-first work (the C-ID
chip, #1447; the recode dry run, #1448; the Z-band retirement dry run, #1449;
a checkpoint, #1450, corrected by #1451) and a fourteen-readings sheet for Sam.
Then Sam replied *"Yes to all"* and the afternoon half applied the whole series:

1. **#1452 — the rulings as data.** `kb/remint_series_readings_rulings_2026-09-03.json`,
   the sheet stamped Ruled, Armenian in `kb/foreign_language_subj4.json` as
   `ARME` (card 9), `(PH, Health)` out of the dismissals so Health carries the
   C-ID PH chip (card 10), both dry runs re-run on the ruled state.
2. **#1453 — the two applies** (`kb/_authority_recode_apply.py`,
   `kb/_zband_retire_apply.py`): the plan recomputed through the dry runs'
   `compute_plan()` and gated against the frozen receipt (P1), a fresh read of
   `kb_curation` at write-time (P3), ten conservation gates each; the
   continuation band digit in both allocators (card 11); Agriculture and
   Agricultural Production as umbrellas everywhere; the auditor and the client
   reading a Z id as retired; the Supabase re-key verifying against the alias
   map's own old keys.
3. **#1454 — the land.** Recode: 10,296 ids re-keyed (10,041 keep their number),
   the seed's seven ruled codes, umbrella flags and the FTVE fan-in pair
   (recorded as `fan_in_with` on the seed, not in `discipline_aliases.json`,
   which would fold a discipline away), twelve language codes. Retirement:
   4,053 Z identities materialized as M-ID records (`origin: machine cluster`,
   the members' aggregate, no membership entry of their own), 10,704 pointers,
   218 legacy anchors with their origin, 254 crosswalk references, the Z
   counters retired. Both receipts in `ALIAS_MAPS`; the post-apply chain once.
4. **The Supabase half, same window:** `supabase-rekey.yml` with each alias map
   in order, the `_CANON_SUBJ4::` picks updated (before-values in
   `kb/authority_recode_out/2026-09-03/picks_before.json`), then
   `daily-dashboard.yml` for the artifacts and a hand rebuild of SkyView.
5. **#1458 — the fold worklist, planned.** `kb/_prefix_fold_dryrun.py` plans a
   keep-number prefix re-key for every row fold-verify names (278: 132
   materialized, 146 legacy strays; 7 held on TOP alone; V8 parity), receipt
   `kb/prefix_fold_out/2026-09-03/`, and the seven-item sheet for Sam:
   https://claude.ai/code/artifact/dba12303-8b14-44e2-a21b-bba933a1803b
6. **#1460 — SkyView after Sam's drive.** Eight notes, all shipped: zoom about
   the subject, controls and the details panel off the canvas, leader-line
   labels, Pan and Move, the provenance hover, links in full screen,
   title-first labels, and an identity that opens to show its college
   courses (the faculty view). He drives it again next (NEEDS SAM ①).
7. **#1455 — the re-key verify.** An alias map can chain (`ARME M10AJ →
   FLNG M10AJ` beside `ARMN M10AJ → ARME M10AJ`); the re-key now applies
   vacate-first and keeps chained keys off its verify surface, and the two
   apply guards from #1453 run in CI.

## Sam's decisions this run (record, don't re-derive)

**"Yes to all"** on the fourteen readings (2026-09-03), recorded per card in
`kb/remint_series_readings_rulings_2026-09-03.json` and as six `cpl_memory`
rows with Sam in `verified_by`. The one place the session deviated from a
card's wording is stated in #1453: the FTVE pair lives on the seed because the
aliases file folds a discipline away and item 13 keeps both names.

## ⭐ THE THINGS WORTH CARRYING FORWARD

**Rehearse an apply on a scratch copy of `kb/` first; the numbers it prints
are the receipt the real run must match.** **A freshness count must use the
sync's own seven fields** or six `merge_dismissed`-only entries read as drift.
**The materialized records surfaced a latent inconsistency:** 137 sit on the
June prefix their members' discipline no longer owns, so fold-verify's re-key
count is 285 (was 148) and `subject_collision_signal` is 153 (was 0). That is
the fold planner's next worklist, not a defect
([KB note](kb-notes/methodology-land-a-re-mint-by-rehearsal-and-a-fresh-read.md)).
**The Z band is gone:** every machine cluster is a catalog record; a new client
mint still creates a `UC-CUR-*` placeholder and the promote step must mint M
numbers now (0 placeholders today).

## Where the checkpoint left things (2026-09-04 00:30 UTC)

Every pull request of the day is merged: #1447, #1448, #1449, #1450, #1451,
#1452, #1453, #1454, #1455, #1456, #1457, #1458, #1459, #1460 and the
checkpoint after it. Nothing is in flight. Two things wait on Sam: the
prefix-fold sheet (seven items, NEEDS SAM ⑥ of the SkyView lane) and another
drive of SkyView (NEEDS SAM ①). `cpl_memory` carries this run under author
`session-224-skytune` (query it first, Rule 8). The Pages deploy follows
`main`; `prototype/skyview.html` is rebuilt by hand and was rebuilt in #1460.

## Read in order

1. `docs/reference/lanes/skyview-ccr-interface.md` — current truth, NEEDS SAM
   ①–⑤, NEXT ①–⑩.
2. `kb/authority_recode_out/2026-09-03/validation.md` and
   `kb/zband_retire_out/2026-09-03/validation.md` — what moved, gate by gate;
   `materialized.json` beside the second.
3. `docs/ccr_atlas_lessons.md` §2026-09-03 SkyTune, the land — the story.
4. `docs/coursecontrolnumber_remint.md` — the playbook, with today's lessons.
5. `cpl_memory` — `author = 'session-224-skytune'` (Rule 8: query before work).

## Priority work, in order

0. **Check the morning cron ran clean on the applied state** (the 06:17 UTC
   run of 2026-09-04; the 21:52 UTC dispatch of 2026-09-03 already reproduced it): the overlay sync must reproduce the committed `kb/coci_curation.json`
   (Supabase carries the new keys), the audit's `latest.json` should show
   `subject_collision_signal` 153, and SkyView's islands should read the new
   codes. If the sync reverted a key, the re-key did not complete: re-dispatch
   `supabase-rekey.yml` with that receipt (it is idempotent). Both re-keys
   completed on 2026-09-03 (0 Z keys, 0 true leftovers); the recode run's
   red verify was a chained-key false positive, fixed in #1455.
1. **The fold worklist is on Sam's sheet** (#1458; the artifact link above).
   When he rules by number: build the apply from the receipt (reuse
   `kb/_authority_recode_apply.py`'s `apply_plan`, P1 against the frozen
   alias map, `--scope` per verdict, stamp `_prefix_fold_from`), rehearse on
   a scratch copy of `kb/`, land in one cron window with `supabase-rekey.yml`
   (vacate-first handles the 30 chained keys), then fold-verify must read 0.
2. **The 122 legacy-anchor duplicates** as a merge worklist on the CCR tab
   (`kb/zband_retire_out/2026-09-03/duplicates.json`), and **the three HOSP
   anchors** once Sam gives them a discipline (NEEDS SAM ⑤).
3. **The promote step for `UC-CUR-*` placeholders**, minting M numbers from
   `kb/_zband_retire_dryrun.py`'s `Buckets` (continuation band when full).
4. **SkyView:** Sam drives it again after #1460 (NEEDS SAM ①: the halo, the
   ring spread, the 48-square cap, the open-all zoom are one line each); then
   decision packs per discipline (NEXT ①), the queue (②), the rim by
   description (⑦), the dropdown labels (⑧).
5. **Funding carry-overs** unchanged: `CollegeID2`, the dials, NEEDS SAM ③④⑤ of
   that lane.

## Patterns that worked

- **Rulings as data, both sheets.** The apply scripts read the same rulings
  files the dry runs cross-check, so a yes changes nothing but the stamp.
- **Rehearsal on a scratch copy**, then the real run compared line for line.
- **One land pull request per window**, receipts on `main` before any Supabase
  dispatch (the workflow checks out `main`).
- **Fixture tests for the applies**, one check per failure the rehearsal could
  have produced (a stamp missing, a ghost not healed, a pointer left on Z).

## Safety patterns to honor

- The receipts are stamped APPLIED; a second recode or retirement needs its own
  dry run and receipt (P0 refuses to run twice).
- `cpl_memory` rows from this session are INSERT-only under author
  `session-224-skytune`; the six ruling rows carry Sam as `verified_by`.
- The picks' before-values are the rollback for the guarded UPDATEs; the alias
  maps read right-to-left are the rollback for the keys, inside one window.
- Never force-push `main`; the stop-hook's post-merge nag is a false positive.
- `kb/uc_cur_zseq.json` is retired and the Z scripts refuse it; never mint a Z.
