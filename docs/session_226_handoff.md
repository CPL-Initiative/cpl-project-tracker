---
title: "Session 226 handoff — the fold apply is built and rehearsed; the land waits on Sam's reply by number"
created: 2026-09-04
updated: 2026-09-04
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 226

Your moniker is **SkyLand** (assigned by SkyFold at sign-off, per Sam's
2026-09-03 template): the land of the fold is the queue's head the moment Sam
replies by number. Predecessors: SkyOrbit S223 → SkyTune S224 → **SkyFold S225**.

## What S225 did

One pull request (#1462) plus the checkpoint. Sam had not ruled the prefix-fold
sheet when the session opened, so it built what a reply by number lands:

1. **`kb/_prefix_fold_apply.py`** — the receipted half of the dry run (#1458).
   The plan is recomputed through the dry run's own allocator under the
   receipt's own flags: `--scope` carries item 2's hold, `--ruled-held
   "<who, when: what>"` carries item 3's "fold them" (the ruling appended to
   each TOP-only row's evidence; a row with no evidence stays held under any
   ruling). P1 refuses a receipt cut under other flags or differing from the
   frozen alias map; P0 is per receipt (the receipt's own stamp plus a
   `_prefix_fold_applied` era list on each doc, because the held rows are the
   NEXT fold's worklist); P3 is the fresh read at write-time; thirteen gates;
   `--apply` needs `--ruling`. It re-keys the catalog, memberships,
   articulations and the identities map (a moved entry wins its key; a stale
   S110 ghost on a landing key is dropped), the overlay's keys and 404
   pointers, and the materialized records' `_machine_cluster_members` lists.
   Stamp `_prefix_fold_from`, beside the earlier ones.
2. **Rehearsed on a scratch copy of `kb/` and `tests/`** (01:04 UTC): 278
   aliases, P1 ✓ against the frozen receipt (a fresh dry run on today's tree
   reproduces it with zero drift), 13 of 13 gates; promotions 24 re-keyed; no
   chip or canonical code changes; `subject_collision_signal` 153 → 113;
   fold-verify `re_key` 7 = the seven held rows; the planner then plans 0.
3. **The sixth id-keyed artifact class.** Scanning every file that names one of
   the 278 old ids found `kb/crnc_mirrors.json` (the CR/NC mirror classes the
   dashboard's D-3 suppression reads) with 398 keys on ids the 2026-09-03
   recode retired — it was never in the post-apply chain. It carries eleven
   curated mirrors, so `kb/_rekey_crnc_mirrors.py` re-keys it (never
   regenerates it) with the promotions re-key's semantics and era list; it ran
   once (398 keys, receipt `kb/crnc_rekey_out/2026-09-04/`) and is the chain's
   `crnc-mirrors` step now.
4. Docs: the playbook's artifact-class list and lesson; the SkyView lane's
   NEXT ⑨; `docs/ccr_atlas_lessons.md` §2026-09-04; the KB note
   `methodology-every-id-keyed-artifact-class-belongs-in-the-post-apply-chain`;
   the rehearsal note bumped with the verdicts-as-flags section.

## Sam's decisions this run (record, don't re-derive)

None — Sam was not in the session and nothing was applied. Every open verdict
is still his: the fold sheet (NEEDS SAM ⑥), the SkyView drive (①), the three
HOSP anchors (⑤), the funding items.

## ⭐ THE THINGS WORTH CARRYING FORWARD

**The verdicts are the dry run's flags** — a per-verdict receipt is one re-run
and the apply refuses any other. **A fold's proof is its held count**:
fold-verify reads the rows the receipt held (7 today), never 0, until a second
signal or a ruling moves them. **A leftover sweep must exclude chained keys**:
30 keys are vacated and refilled in this one plan, live afterward by design.
**Every id-keyed artifact class belongs in the post-apply chain**: the crnc
file was missing and lost its suppression for a day; the identities map's
1,605 pre-fold ghost keys are the next such cleanup, and
`kb/cid_articulation_joins.json`'s `current_home` (1,068 stale ids) is unread
by anything, so it waits on a routing decision rather than hygiene.

## Where the checkpoint left things

#1462 merged; nothing in flight. The 06:17 UTC daily run of 2026-09-04 had not
fired at checkpoint time; a check-in is scheduled for 06:40 UTC (send_later)
with the S225 handoff's Priority 0 checks plus one: `kb/crnc_mirrors.json`
keys must still be current (the daily run does not regenerate the file).
`cpl_memory` carries this run under author `session-225-skyfold`.

## Read in order

1. `docs/reference/lanes/skyview-ccr-interface.md` — NEEDS SAM ①–⑥, NEXT ⑨.
2. `kb/_prefix_fold_apply.py` — the docstring; its NEXT print is the land order.
3. `docs/ccr_atlas_lessons.md` §2026-09-04 — the story, the numbers.
4. `kb/prefix_fold_out/2026-09-03/report.md` and the sheet
   `docs/visuals/2026-09-03-prefix-fold-worklist.html` — what Sam is ruling.
5. `cpl_memory` — `author = 'session-225-skyfold'` (Rule 8: query before work).

## Priority work, in order

0. **Check the morning cron ran clean on the applied state** (the send_later
   fires it): green run; no key reverted in `kb/coci_curation.json`; the
   audit's `subject_collision_signal` still 153; the crnc file's keys current.
1. **When Sam replies by number — the land, one cron window:**
   - all yes → `--scope all`, receipt `kb/prefix_fold_out/2026-09-03`;
   - "2 edit: hold" → re-run the dry run `--scope materialized` into a new
     dated receipt (a subset of the reviewed plan), apply with the same flag
     and `--receipt <new dir>`;
   - "3 edit: fold them" → re-run the dry run `--ruled-held "Sam, <date>: 3
     edit: fold them"` into a new receipt, apply with the same flag;
   - "4 edit: <disciplines>" → INSERT-only curation rows under Sam's name
     FIRST (kb_curation, Rule 10), then the dry run again — they become
     candidates;
   - the window: the MCP count query over the sync's seven fields →
     `fresh.json`; `python3 kb/_prefix_fold_apply.py --fresh-read fresh.json
     --ruling "Sam, <date>: <verdicts>" --apply`; append the receipt path to
     `kb/_rekey_promotions.py` ALIAS_MAPS in the SAME commit (stamps:
     `_prefix_fold_from`); `python3 kb/_post_apply_chain.py` once (fold-verify
     must read the held count; the crnc step re-keys about 29 more);
     commit, PR, merge; dispatch `supabase-rekey.yml` with the alias map;
     dispatch `daily-dashboard.yml`; `python3 kb/_build_ccr_universe.py` and
     commit SkyView.
2. **The 122 legacy-anchor duplicates** as a merge worklist on the CCR tab
   (`kb/zband_retire_out/2026-09-03/duplicates.json`); the three HOSP anchors
   once Sam gives them a discipline (NEEDS SAM ⑤).
3. **The promote step for `UC-CUR-*` placeholders**, minting M numbers from
   `kb/_zband_retire_dryrun.py`'s `Buckets` (0 placeholders today).
4. **SkyView:** Sam's second drive (NEEDS SAM ①); then decision packs per
   discipline (NEXT ①), the queue (②), the rim by description (⑦), the
   dropdown labels (⑧).
5. **Funding carry-overs** unchanged: `CollegeID2`, the dials, NEEDS SAM ③④⑤
   of that lane.
6. **Cleanups this run found:** a chain-aware re-key of the identities map
   (1,605 ghost keys, like the crnc tool); the `current_home` regeneration —
   measure the disposition diff a regeneration would make first, and if it
   changes routing put it on a sheet.

## Patterns that worked

- **Build the apply before the verdicts, with the verdicts as flags**, so the
  land is one window whatever Sam replies.
- **Scan the reference surface of the old ids across every file** before
  writing an apply — that is what found the sixth class.
- **Rehearsal on a scratch copy**; the numbers it prints are the receipt the
  real run must match, and the chain's fold-verify line is checkable.

## Safety patterns to honor

- Nothing applies without `--ruling`; P0 is per receipt; a receipt goes into
  ALIAS_MAPS in the same commit as its apply, never before.
- The crnc file is re-keyed, never regenerated (curated overlay inside).
- `cpl_memory` rows from this session are INSERT-only under author
  `session-225-skyfold`.
- Never force-push `main`; the stop-hook's post-merge nag is a false positive.
- The Z band is retired; never mint a Z.
