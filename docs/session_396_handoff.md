---
title: "Session 396 handoff: Santa Ana's extraction, Ventura and Oxnard, curriQunet, and the first reconcile steps of the sweep"
date: 2026-10-15
session: 395 (SkyHawthorn)
tags: [handoff, program-requirements, catalog-sweep, reconcile, reader]
status: current
---

# You are Session 396

Your moniker is **SkyJacaranda**. Session 395 (**SkyHawthorn**, `session_01AZn8rCdhuyqH8yvWH6mm6u`, opened by Sam by hand)
wrote this at the context meter's WARN line, a full checkpoint. Run `list_sessions` first. If the CPL Queue routine started
you, follow `docs/reference/scheduled_sessions.md`.

## What shipped (S395)

- **#2145** (S394's checkpoint) merged.
- **#2146:** procedure records v1 for Fullerton, Citrus, Victor Valley and Monterey Peninsula, and the generator
  `kb/_program_source_procedure_v1.py`. It rebuilds S394's Orange Coast and Sierra records exactly.
- **#2147:** the public dashboard no longer carries progress-note authors' emails (`pii_guard` was red on `main`).
- **#2149, the sweep's wave 3:** ten colleges, 1,132 records (Cypress 251, San Bernardino Valley 200, Cuyamaca 179, Sequoias
  118, Mt. San Jacinto 94, Napa Valley 94, Evergreen Valley 74, Moorpark 54, Golden West 50, MiraCosta 18), $92.92. Display
  build `515c9d71e086` (6,320 rows), applied from `main` in run 38761398479.
- Lessons: S395 section. `cpl_memory`: six rows, one superseded.

## Decisions Sam made this run

None. Open Asks Sheet 83 (https://claude.ai/artifact/X2yLySn9SR5jauQuTWQybN, current) held no reply; its cards stand.

## Priority, in order

1. **Wave 3's procedure records.** Branch `claude/s395-wave3-procedures` holds ten receipts, not yet applied when this was
   written. Seven are v1 (expect `none`). Cypress, Moorpark and Napa Valley are v2, merged in SQL onto S346's map records
   (expect 527fc4b1..., a5679f2d..., 604e70cc...). If `kb/receipts/` on `main` has the applied record for `515c9d71e086`,
   apply each receipt with `execute_sql`, stamp the md5 in its header, and open a PR. If the PR already exists, merge it.
2. **#2148, Santa Ana's reader.** `test` is green. A capture-only read is running on its branch; merge after it files.
   If `capture_preview.json` there finds most of 359, extract on a fresh branch (`step=read extract=1`, about $24) and load.
3. **Ventura** is reading on `claude/s395-ventura`: load it, then **Oxnard** (same host, after Ventura). Then curriQunet,
   once #2148 merges: Rio Hondo, Palomar, Saddleback, Allan Hancock, Reedley, Chabot, each on its own branch.
4. **Reconcile steps**, from what the pages say (lessons S395; reads on `claude/s395-reconcile-reads`). Orange Coast:
   fill `total_units` from "Total Major Units", `degree_total` from "Total Minimum Degree Units - OCC AS GE 60", and GE from
   "OCC AS General Education Up to 21". "Up to" is a maximum, so state that in the step's why, or put it to Sam as a card.
   Monterey Peninsula: Cal-GETC is 34 on its GE page; the MPC GE pattern has no stated total, so total its areas from read
   38759288106 or ask Sam. Victor Valley: AUTO 82.0 prints no units. Correcting it needs a new step kind, so it is a card.
5. **Readers parked:** San Jose City (8 of 90), MiraCosta (29 of 161), Orange Coast's 27 records with no blocks, Diablo
   Valley, Sierra, Foothill.

## The steps for one college

Branch `claude/s39x-<college>` from `main` → dispatch `step=read extract=1` → read its `summary.json` on the branch →
`step=load` → a wave branch merges the colleges and adds the two dated reads (registry columns, and MAP's course codes
matched by an md5 of counts and of titles in SQL) → `kb/_build_roep_display.py` → tests, `check_generated.sh` (read the
exit code) → PR → merge on green `test` → `step=display` on `main` → procedure records with the generator.

## Not refreshed this checkpoint

The UI pass (step 9): no room for a fix PR this run; the ledger keeps the view due. `kb/queue_status.json`'s `unchecked`
list (about 7,400 rows now), as at S394.

## Subscriptions and check-ins

S395 drops its PR watches (#2148) and its check-ins at sign-off. The CPL Queue routine fires once a day.
