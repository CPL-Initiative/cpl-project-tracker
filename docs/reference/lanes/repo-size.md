---
title: "Repo size — what lives in the tree, what lives in the bucket, and the limits — lane state"
created: 2026-11-18
updated: 2026-11-18
tags: [reference, roadmap-lane, repo-size, receipts, infrastructure]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference/lanes
related:
  - "[[CLAUDE]]"
  - "[[program-requirements-harvest]]"
  - "[[docs/engineering_practices_lessons]]"
---

# Repo size

**What this lane is:** keeping the tracker small enough to clone, check out and test, by moving bulky generated data
out of the git tree into private storage and holding the tree under a limit on every pull request. Issue #3476 is the
plan; Part 4 is the slimming, Part 5 the history rewrite.

**Sam's words (2026-11-17, relayed by COBIx on #3358 and #3476):** *"Let's move the bloated data out first thing and
make sure we don't allow to go beyond a limit."* and *"As cto you can restructure us."* `cpl_memory`
`sam-repo-size-limit-2026-11-17`; [`sam_rulings`](../sam_rulings.md).

## What lives where

- **The tree** keeps code, docs, the generated files the site serves, the applied records, and one small index entry per
  stored file under `kb/receipts/index/` (one file an entry, so branches never conflict over the index).
- **The private Supabase Storage bucket `cpl-receipts`** (created by `supabase-migrate.yml` run 44255184017,
  `kb/migrations/2026-11-18_s680_cpl_receipts_bucket.sql`) holds what left the tree: program display receipts under
  `display/` and dated row Trust-Card reports under `row_audit/`. Live count, S680: 141 under `display/` (1,596.1 MB
  stored), 165 under `row_audit/` (982.5 MB stored). One store module, `kb/_receipt_store.py`; its `PUBLIC_SAFE` table
  names the kinds a run may hand out.
- **Display receipts are never committed (#3495).** Git ignores `kb/receipts/program_requirement_records_display_*`.
  `step=display` on `program-requirements-college.yml` rebuilds the receipt on the runner, stores it, files its sha256
  index entry and only then applies it. Procedure: the [harvest lane](program-requirements-harvest.md), *No display
  receipt is committed*.
- **Row audit reports (#3498, carrying #3501):** `kb/_row_audit_prune.py`, run by `scripts/daily_build.sh`, stores the
  dated reports older than the newest 14 and removes them from the tree only once their index entry is written; it is
  time-boxed and can never fail the daily run. `kb/row_audit/latest.json` stays committed.

## How a stored file comes back

- Re-apply a stored display receipt (the rollback): `step=display force="<receipt name> [<applied record>]"`.
- Fetch one for a session: `step=fetch force=<receipt name>` hands it over as a one-day run artifact, for the
  `PUBLIC_SAFE` kinds only. COBIx found that a fetch artifact on this public repo would publish a private-bucket
  receipt; the table was the fix, confirmed by COBIx at 07:38Z 2026-11-18.
- A file removed by the one-time moves also stays in the parent of the commit that removed it.

## The limits (#3490, `scripts/repo_size_guard.py`)

A step of the `lints` job, so a red guard is a red `test`, and `repo-size-guard.yml` beside it: no added or changed file
over 5 MB outside the shrink-only list `.github/repo_size_exceptions.txt` (68 entries, 810.7 MB; a listed file may not
grow past 1.5 times its listed size); 25 MB compressed a pull request; the tree's total under 2,000 MB; a weekly job
that fails when `main` grew more than 50 MB compressed in 7 days. Tests: `tests/repo_size_guard_test.py`.

## What landed (S680, 2026-11-18)

- #3495 merged (`main` 25c79493): the display path through the bucket; second reader's three findings fixed.
- #3498 (+ #3501): 141 display receipts (2,266.4 MB in the tree) and 165 row audit reports left the tree after the
  one-time moves (runs 44259862567 and 44258551009), each verified by sha256; `tests/receipt_move_gate_test.py` holds
  every removed path to an index entry.
- #3490: the size guard. COBIx on #3490 (08:49Z, not blocking): a red weekly run reached nobody, and the cron's pushes
  skip the file rules; fixed in the wave: the weekly job stays on the failure watch list, and weekly mode lists the
  over-limit files on `main`.
- #3498, #3501 and #3490 landed inside the wave PR #3504 (one merge of `main`, one CI run, one squash).
- Measured on the wave's tree: the tree 1,619.8 MB (was 4,862 MB); a depth-1 download 438.6 MB (was about 2.0 GB).
- **FACT** `f-display-receipts-hold-no-person-data-s680`: the conductor scanned all 141 committed display receipts and
  found no email address and no person key, so the history rewrite is a size question only (COBIx agreed).

## NEXT, in order

1. Confirm the first `step=display` through the bucket path on `main` (the harvest lane's NEXT (1)).
2. **Part 5, the history rewrite: Sam's go.** Rule 5's one permitted main-history rewrite needs the cron paused, his
   explicit go and every open session told to re-clone. Waits on him; not on the standing sheet as a card.
3. The spreadsheet export and the videos out of the tree; the PR that moves them lowers `TOTAL_CAP_MB` (1,500 MB, then
   1,000 after Phase 3).
4. Cap the timed workflows' commits.
5. The session trim (Part 3A), with COBIx in a plain session: as written it assumes a session rooted at the repo, while
   ours root at the parent with three repos (the repo's own settings do not load; the environment's setup script
   installs the guards at the root), and a trimmed tree breaks `check_generated.sh` and the tests until the data
   folders are added back.
6. `START_HERE.md` and the `CLAUDE.md` cut, after COBIx's rulings digest (the guard already warns past 600 and 2,000
   words).
