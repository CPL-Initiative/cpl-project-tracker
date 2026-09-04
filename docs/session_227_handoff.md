---
title: "Session 227 handoff — the duplicates are a lane; the promote step and the identities map are next"
created: 2026-09-04
updated: 2026-09-04
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 227

Your moniker is **SkyMint** (assigned by SkyLand at sign-off, per Sam's
2026-09-03 template): the promote step that mints M numbers for client
placeholders was built under you-to-be's name; the identities map is the
queue's head. Predecessors: SkyTune S224 → SkyFold S225 →
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
4. **The promote step is built before the first placeholder** (second PR).
   `kb/_uc_cur_promote.py`: a client mint's or the auto-merge bot's transient
   `UC-CUR-*` target becomes a real M-ID record the way the retirement
   materialized a machine cluster — the discipline's canonical SUBJ4 (an
   umbrella keeps the members' split code), band 9 noncredit / 1 credit, the
   lowest free number with every id ever minted reserved (courses, singletons,
   curation keys, identities, common, every ALIAS_MAPS id, the CCN/C-ID
   reservations), continuation band when full; origin `curator mint` or
   `machine cluster`, `_promoted_from`, no membership entry. HELD, never
   guessed: one pointer, no discipline, no code, no band. Dry run by default
   with a receipt; `--apply --receipt … --fresh-read …` under P0 · P1 · P3 ·
   G1-G8. 32 fixture checks in `js-tests.yml`. 0 placeholders today.
5. **The identities map dry run is built** (`kb/_identities_rekey_dryrun.py`,
   23 fixture checks in `js-tests.yml`) and its receipt committed; see
   priority 1 below for what it found.
6. Docs: the lane file (compacted under budget), `ccr_atlas_lessons`
   §2026-09-04, the KB note
   `methodology-a-receipt-measures-a-worklist-once-a-lane-recomputes-it-live`,
   the playbook's artifacts table, §11, the To-Do feed, the vault session
   note, four `cpl_memory` rows under `session-226-skyland`.

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

#1465 (the lane) and #1466 (the two tools) were merged by S226 once `test`
was green on each head; `daily-dashboard.yml` run 446 (the dispatch after
#1465, 04:33 UTC) published the lane. **Measured at 06:46 UTC on run 446's
main:** 278 fold ids in the overlay, 0 old ids, 0 pointers on an old id,
`subject_collision_signal` 113, all 2,836 mirror keys live, SkyView on the new
codes, members 247, `legacy_count` 130. The 06:17 UTC rung of the cron ladder
had NOT fired by 06:46 (GitHub schedules slip; the 09:17 and 12:17 rungs exist
for this; today's `kpi_history.json` entry was written by run 446, so Rule 3
holds). A second check-in was armed for 10:15 UTC (this repo's rungs land one to four hours late). If no scheduled run appears
by the 12:17 rung, that is a workflow question for the Troubleshooting page,
not a fold question — the invariants above are the fold's proof. Nothing else
in flight. The 06:45
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
1. **The identities map re-key — the sheet, then the apply.** The dry run is
   built and its receipt cut (`kb/_identities_rekey_dryrun.py`,
   `kb/identities_rekey_out/2026-09-04/`): re-key 1,369 ghosts onto the live id
   the alias chain names, drop 44 whose live id already has an entry, 9 that
   lose a convergence (title agreement, then colleges), 175 that nothing names
   again; 152 re-keyed titles are normalization variants the catalog already
   overrides. Build Sam's five-item decision sheet from the report's "sheet"
   section (a First Light artifact in `docs/visuals/`, handed over as an
   artifact link), record his verdicts as data, then
   `--apply --receipt … --ruling "…"` (P0 · P1 · G1-G5) in one cron window. NOT
   an ALIAS_MAPS receipt.
2. **Measure curated disciplines outside the MQ list** (the `Stagecraft` row);
   propose the fix on a sheet, never by script.
3. **The promote step, when a placeholder appears:** `python3
   kb/_uc_cur_promote.py` (dry run, receipt), review, then `--apply` with the
   receipt and a fresh read; register the receipt in `ALIAS_MAPS`; dispatch
   `supabase-rekey.yml`; the chain; the daily run. Nothing to run today.
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
