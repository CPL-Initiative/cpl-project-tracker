---
title: "Session 226 handoff — the prefix fold is landed; the duplicates worklist, the promote step and the identities map are next"
created: 2026-09-04
updated: 2026-09-04
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 226

Your moniker is **SkyLand** (assigned by SkyFold at sign-off, per Sam's
2026-09-03 template): the fold landed under you-to-be's name before the night
was out, so the queue's head is what the land left. Predecessors: SkyOrbit
S223 → SkyTune S224 → **SkyFold S225**.

## What S225 did

Two pull requests (#1462, #1463) plus the follow-up that rebuilt SkyView, and
the checkpoints. In order:

1. **Built the apply before the verdicts** (#1462). `kb/_prefix_fold_apply.py`
   is the receipted half of the dry run (#1458): the plan recomputed through
   the dry run's own allocator under the receipt's own flags — `--scope`
   carries item 2's hold, `--ruled-held "<who, when: what>"` carries item 3's
   "fold them" with the ruling appended to each TOP-only row's evidence — and
   P1 refuses a receipt cut under other flags or differing from the frozen
   alias map; P0 is per receipt (the held rows are the next fold's worklist);
   P3 is the fresh read at write-time; thirteen gates; `--apply` needs
   `--ruling`. Rehearsed end to end on a scratch copy of `kb/`.
2. **Found and fixed the sixth id-keyed artifact class.** Scanning every file
   that names one of the 278 old ids turned up `kb/crnc_mirrors.json` (the
   CR/NC mirror classes the dashboard's D-3 suppression reads) with 398 keys
   on ids the 2026-09-03 recode retired — never in the post-apply chain.
   `kb/_rekey_crnc_mirrors.py` re-keys it (never regenerates: eleven curated
   mirrors inside) and is the chain's `crnc-mirrors` step.
3. **Sam replied "Yes to all recommendations"** and the same night the frozen
   receipt landed in one cron window (#1463): the MCP count query (30,694 /
   2026-08-24 18:27:59, equal to the committed overlay), the apply with
   `--ruling` (P1 ✓, 13/13 gates: minted 245, singletons 33, memberships 113,
   articulations 54, curation keys 278, pointers 404, one materialized member
   list, 8 stale identities entries dropped), the receipt into `ALIAS_MAPS`,
   the chain once (promotions 24, crnc mirrors 29, no chip or canonical code
   changes, `subject_collision_signal` 153 → 113, fold-verify `re_key` 7 = the
   seven held rows), `supabase-rekey.yml` (278 self-key + 278 pointer filters,
   30 chained keys vacate-first and named, 0 old keys left over 248, 65 s),
   `daily-dashboard.yml` (run 445), SkyView rebuilt on the regenerated
   artifacts, and `kb/cid_articulation_joins.json` regenerated (dispositions
   identical; `current_home` refreshed).
4. Docs: the playbook's artifact-class list and lesson; the SkyView lane;
   `docs/ccr_atlas_lessons.md` §2026-09-04 (the build, the rehearsal, the land);
   the KB note `methodology-every-id-keyed-artifact-class-belongs-in-the-post-apply-chain`;
   the rehearsal note bumped; `docs/reference/mid_lifecycle.md`'s re-mint
   record; `kb/prefix_fold_rulings_2026-09-04.json` and the sheet stamped Ruled.

## Sam's decisions this run (record, don't re-derive)

**"Yes to all recommendations" (2026-09-04)** on the seven-item prefix fold
sheet: items 1, 2, 5 and 7 fold as proposed; item 3 holds the seven TOP-only
records; item 4 leaves the seventeen without a discipline as minted; item 6
keeps Kinesiology's ATHL span. Recorded in
`kb/prefix_fold_rulings_2026-09-04.json`, the `cpl_memory` row
`sam-yes-to-all-the-prefix-fold-sheet-2026-09-04` (Sam as verifier) and the
vault braindump of 02:00. Nothing else was his call this run.

## ⭐ THE THINGS WORTH CARRYING FORWARD

**The verdicts are the dry run's flags** — build the apply before the reply,
and the reply is the land. **A fold's proof is its held count**: fold-verify
reads 7 now, and 7 is correct until a second signal moves those rows. **A
leftover sweep must exclude chained keys** (30 in this plan; the Supabase
verify and the apply's G13 both know it now). **Every id-keyed artifact class
belongs in the post-apply chain**, and the way to find one you missed is to
scan every file for the old ids before the apply. **Run a chain step twice in
a day and its receipt path had better not collide** (the crnc tool suffixes
now). Measured for the next sheet: the identities map's 1,597 ghost keys are
May-era ids — 1,422 resolve to live rows from the first map in the chain, 175
are dead, 7 converge, 44 land on keys with an entry — a rebuild-from-baseline
re-key with its own receipt.

## Where the checkpoint left things

#1462 and #1463 merged; the follow-up with SkyView and the joins merged after
them; nothing in flight. The 06:17 UTC daily run of 2026-09-04 is the first
cron after the land: a check-in is scheduled for 06:40 UTC (send_later) to
confirm it reproduced the overlay (no fold key reverted), that the audit
reads 113, that the crnc file's keys are current, and that SkyView reads the
new codes. `cpl_memory` carries this run under author `session-225-skyfold`
(query it first, Rule 8).

## Read in order

1. `docs/reference/lanes/skyview-ccr-interface.md` — current truth: the fold
   applied, NEEDS SAM ①–⑤, NEXT ①–⑩.
2. `docs/ccr_atlas_lessons.md` §2026-09-04 — the build, the rehearsal, the land.
3. `kb/prefix_fold_out/2026-09-03/validation.md` — what moved, gate by gate.
4. `kb/zband_retire_out/2026-09-03/duplicates.json` — the next worklist.
5. `cpl_memory` — `author = 'session-225-skyfold'` (Rule 8: query before work).

## Priority work, in order

0. **The morning cron** (the send_later fires it): green; no key reverted in
   `kb/coci_curation.json`; `subject_collision_signal` 113; the crnc keys
   current; SkyView on the new codes. A reverted key means the Supabase re-key
   did not hold: re-dispatch `supabase-rekey.yml` with the fold's receipt.
1. **The 122 legacy-anchor duplicates as a merge worklist on the CCR tab**
   (`kb/zband_retire_out/2026-09-03/duplicates.json`: each legacy anchor whose
   title and discipline already name a catalog identity, one twin each): a
   curator's queue, never merged by a script.
2. **The promote step for `UC-CUR-*` client placeholders**, minting M numbers
   from `kb/_zband_retire_dryrun.py`'s `Buckets` (continuation band when full;
   0 placeholders today — build it before the first one appears).
3. **The identities map's rebuild-from-baseline re-key** — a dry run with a
   receipt first (the measurement above is the starting point); the catalog
   already overrides its metadata, so display is safe meanwhile.
4. **The seven held rows** move when a curator's discipline row or a ruling
   gives them a second signal: a new dry run (`--ruled-held` or the row) and a
   new receipt; never the old one (P0).
5. **SkyView:** Sam's second drive (NEEDS SAM ①); then decision packs per
   discipline (NEXT ①), the queue (②), the rim by description (⑦), the
   dropdown labels (⑧). The three HOSP anchors wait on him (⑤).
6. **Funding carry-overs** unchanged: `CollegeID2`, the dials, NEEDS SAM ③④⑤
   of that lane.

## Patterns that worked

- **Build the apply before the verdicts, with the verdicts as flags** — his
  one line became the land within the hour.
- **Scan the reference surface of the old ids across every file** before an
  apply; that is what found the sixth class.
- **Rehearse on a scratch copy; the numbers are the receipt** — the real run
  matched them to the row.
- **A live spot-check of a few pairs during the Supabase run** (old gone, new
  present, the chained pair holding both rows) confirms vacate-first while the
  workflow's own verify is still running.

## Safety patterns to honor

- The fold receipt is stamped APPLIED; a second fold needs its own dry run and
  receipt (P0 per receipt). Never register a receipt in ALIAS_MAPS before its
  apply commit.
- The crnc file is re-keyed, never regenerated (curated overlay inside).
- `cpl_memory` rows from this session are INSERT-only under author
  `session-225-skyfold`; the ruling row carries Sam as `verified_by`.
- Never force-push `main`; the stop-hook's post-merge nag is a false positive.
- The Z band is retired; never mint a Z.
