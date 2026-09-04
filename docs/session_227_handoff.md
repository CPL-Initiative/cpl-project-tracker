---
title: "Session 227 handoff — the duplicates are a lane; the promote step and the identities map are next"
created: 2026-09-04
updated: 2026-09-04
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 227

Your moniker is **SkyMint** (assigned by SkyLand at sign-off, per Sam's
2026-09-03 template): the queue's head is the promote step that must mint M
numbers for client placeholders. Predecessors: SkyTune S224 → SkyFold S225 →
**SkyLand S226**.

## What S226 did

One pull request (#1465) and this checkpoint, on the queue SkyFold left.

1. **The fold held on main and a check-in is armed.** Baseline read at 03:50
   UTC after run 445: 278 fold keys in `kb/coci_curation.json`, 0 old ids, 0
   pointers on an old id, `subject_collision_signal` 113, SkyView on the new
   codes, `unified_courses_members.js` carrying 247. The first SCHEDULED cron
   after the land is 06:17 UTC; a `send_later` fires at 06:45 UTC into S226
   with the same check (`scratchpad/cron_check.py` against `origin/main`). If
   you are reading this before that fired, run the check yourself: a reverted
   key means `supabase-rekey.yml` must be re-dispatched with the fold receipt.
2. **The twenty "missing" identities were never missing.** The 31 folded ids
   without a members entry are 20 Phase B folds into C-ID descriptor rows
   (each named in the descriptor's `consolidated_from`), 11 curated merge
   sources; `THES M1087` is a row whose three members all route to descriptors.
   Not an export gap; nothing to fix. SkyView's 31 undrawn ids are these.
3. **The 130 legacy-anchor duplicates are a worklist lane** (#1465).
   `legacy_anchor_duplicate_groups` in `excel_to_dashboard.py` recomputes them
   live every build: the catalog twin first, the anchor last, so the tab's
   survivor rule folds the anchor into the course that carries the college
   courses (31 stand-alone-only pairs go the other way — the anchor survives
   and gains the course). Strict title key, the displayed discipline, the alias
   file, the flattened merge map. The tab gives it kind `legacy`, leading the
   queue, exempt from the slider, words-only badge. 129 of 130 receipt pairs
   surface; `THTR M1377` hides behind a bot's `Stagecraft` re-discipline on
   `THES M1087` (trailcrew-ccr1-s111, 2026-07-10). Two suites: 27 python
   checks (in `js-tests.yml`), 21 jsdom. The lane appears in
   `unified_courses_suggestions.js` on the next daily run.
4. Docs: the lane file (compacted under budget), `ccr_atlas_lessons`
   §2026-09-04, the KB note
   `methodology-a-receipt-measures-a-worklist-once-a-lane-recomputes-it-live`,
   §11, the To-Do feed, the vault session note, four `cpl_memory` rows under
   `session-226-skyland`.

## Sam's decisions this run

None — Sam was not in the session. Nothing was ruled; nothing waits on a reply
except what the lane file's NEEDS SAM already lists.

## ⭐ THE THINGS WORTH CARRYING FORWARD

**A receipt measures a worklist once; a lane recomputes it every build**, and
where they disagree the live display wins and the disagreement is the finding
(the `Stagecraft` row). **A folded identity with members but no member table is
a Phase B fold, not an export gap** — check `consolidated_from` before calling
it missing. **The merge direction is the worklist's existing survivor rule**:
member order decides it, so no new rule was needed. **The "122" in two handoffs
was a pre-recode count**; the receipt and the lane both say 130.

## Where the checkpoint left things

#1465 open when this was written — merge it once `test` is green (Rule: the
`test` check must succeed on the head; then squash), then dispatch
`daily-dashboard.yml` so the lane publishes. Nothing else in flight. The 06:45
UTC check-in belongs to S226's session; its result is not recorded here.

## Read in order

1. `docs/reference/lanes/skyview-ccr-interface.md` — current truth (the lane
   is live; NEXT ⑨ is the promote step, the held rows, the identities map, the
   MQ-list measurement).
2. `docs/ccr_atlas_lessons.md` §2026-09-04 — the twenty, the lane, the direction.
3. `kb/zband_retire_out/2026-09-03/` — `Buckets` is in `_zband_retire_dryrun.py`.
4. `cpl_memory` — `author = 'session-226-skyland'` (Rule 8: query first).

## Priority work, in order

0. **Confirm the morning cron** if S226 did not: green run 446, no key reverted,
   audit 113, SkyView on the new codes; then confirm `legacy_count` is 130 in
   the published `unified_courses_suggestions.js`.
1. **The promote step for `UC-CUR-*` client placeholders.** A client mint still
   writes a `UC-CUR-<base36>` target (`doConsolidate`); the generator must
   promote it to an M number — lowest free in the (SUBJ4, band) bucket,
   continuation band when full — from `kb/_zband_retire_dryrun.py`'s `Buckets`,
   with a receipt and the alias registered in `ALIAS_MAPS`. 0 placeholders
   today: build it before the first one appears. Where the old Z promote lived:
   grep `UC-CUR` in `excel_to_dashboard.py` and `kb/_auto_merge_worklist.py`.
2. **The identities map re-key** (`kb/coci_articulations.json` `identities`,
   1,597 ghost keys; 1,422 resolve from the May map): a dry run with a receipt,
   then a sheet for Sam.
3. **Measure curated disciplines outside the MQ list** (the `Stagecraft` row);
   propose the fix on a sheet, never by script.
4. **The seven held rows** when a second signal arrives (new dry run,
   `--ruled-held`, new receipt).
5. **SkyView:** Sam's second drive (NEEDS SAM ①), decision packs (NEXT ①), the
   queue (②), the rim by description (⑦), the dropdown labels (⑧); the three
   HOSP anchors (⑤).
6. **Funding carry-overs** unchanged.

## Patterns that worked

- **Measure before fixing** — the "export gap" dissolved in one script.
- **Reuse the rule the surface already has** — member order set the merge
  direction; the star, the dismissal signature, the dock and the editor were
  all inherited.
- **Test against the committed files and print the exceptions by name.**

## Safety patterns to honor

- The lane writes nothing; every merge is a curator's Confirm.
- Never merge past a pending or failing `test`; squash; never force-push `main`.
- The fold receipt is APPLIED; a second fold needs its own dry run and receipt.
- `cpl_memory` rows INSERT-only under your own author; supersede a human-sourced
  row only by saying so.
