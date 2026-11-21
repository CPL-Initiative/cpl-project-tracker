---
title: "Repo size — what lives in the tree, what lives in the bucket, and the limits — lane state"
created: 2026-11-18
updated: 2026-11-21
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

- **The tree** keeps code, docs, the generated files the site serves, and one small index entry per stored file under
  `kb/receipts/index/` (one file an entry, so branches never conflict over the index). From S695 the display applied
  records leave too (below); one stays in the tree only when its store fails.
- **The private Supabase Storage bucket `cpl-receipts`** (created by `supabase-migrate.yml` run 44255184017,
  `kb/migrations/2026-11-18_s680_cpl_receipts_bucket.sql`) holds what left the tree: program display receipts under
  `display/`, display applied records under `display/applied/` (S695) and dated row Trust-Card reports under
  `row_audit/`. Live count, S680: 141 under `display/` (1,596.1 MB
  stored), 165 under `row_audit/` (982.5 MB stored). One store module, `kb/_receipt_store.py`; its `PUBLIC_SAFE` table
  names the kinds a run may hand out.
- **Display receipts are never committed (#3495).** Git ignores `kb/receipts/program_requirement_records_display_*`.
  `step=display` on `program-requirements-college.yml` rebuilds the receipt on the runner, stores it, files its sha256
  index entry and only then applies it. Procedure: the [harvest lane](program-requirements-harvest.md), *No display
  receipt is committed*.
- **Display applied records (S695, #3476 item 1):** the display job's step *Store this run's applied record in
  cpl-receipts* runs `kb/_receipt_store.py store-applied` on the run's record (kind `display_applied`, gzipped at
  `display/applied/<name>.gz`, `PUBLIC_SAFE`). The file leaves the runner's tree only after the bucket reads back bytes
  that unpack to its sha256 and its entry names its git blob; otherwise the record is committed as before.
- **Row audit reports (#3498, carrying #3501; KEEP 0 from S695):** `kb/_row_audit_prune.py`, run by
  `scripts/daily_build.sh`, stores every dated report, the day's own included, and removes each from the tree only once
  its index entry is written; a same-day rewrite of the newest report is stored beside the first (`supersedes`). It is
  time-boxed and can never fail the daily run. `kb/row_audit/latest.json` stays committed. The daily commit stages the
  removals and the entries in two `git add` commands, because a pathspec that matches nothing fails its whole command.

## How a stored file comes back

- Re-apply a stored display receipt (the rollback): `step=display force="<receipt name> [<applied record>]"`.
- A rollback limited by a stored applied record names it by its old path,
  `force="<receipt name> kb/receipts/<record name>"`: the apply finds the entry and fetches the record to a temporary
  folder, checked by sha256 (`local_or_stored`), and refuses before any table read when the bucket cannot be read.
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

## The first display build through the bucket (S681, 2026-11-18)

- **DONE** (`m-display-build-through-bucket-s681`): #3507 (carried by the wave #3509) built `545de21a6edc` from `main`'s
  records with `kb/_build_roep_display.py` and committed the page alone. `program-requirements-college.yml`
  `step=display` run 44286209178 (dispatched on the branch 10:31Z, succeeded 10:42Z) stored
  `cpl-receipts/display/program_requirement_records_display_2026-11-13_545de21a6edc.sql.gz` (18,109,323 bytes, sha256
  `fbfa00dd…0e0e`), filed its index entry under `kb/receipts/index/` and committed the applied record
  `kb/receipts/program_requirement_records_display_2026-11-13_545de21a6edc.applied_44286209178.json` (1.5 MB): 18,209
  planned, 18,209 written, state confirmed, 0 errors. Live: 18,209 rows on the build; 31 rows outside it keep older
  builds.
- The table's prior build was `f0f1ee88c04f` (18,204 keys; 5 null), not `cdd185495ce4`; both receipts are in the bucket
  index, so the rollback (`step=display force="<receipt name> [<applied record>]"`) is reachable.

**The base is the merge commit's first parent (#3559, `cf7f6ca0`, S686).** An older PR's event `base.sha` can sit a day
behind `main` (#3511 measured from `afc29292` under a merge onto `5a7a6f24`: 1,490 files and 36.6 MB, the daily bot's
6.8 MB row audit among them, read as the PR's own). Both guard steps now read the base from `HEAD`'s first parent, with
the event value as the fallback, and log both.

## The applied records and the row audit reports (S695, 2026-11-21)

- **Built** (branch `claude/s695-repo-slimming-receipts`): the `display_applied` kind, `store_applied`,
  `local_or_stored` and `store-applied` in `kb/_receipt_store.py`; the display job stores its own record; the rollback
  reads a stored record through its entry; KEEP 0 in the prune; the gate in `tests/receipt_move_gate_test.py` covers
  applied records; `.github/workflows/receipt-slim.yml` (dispatch only, the `daily-dashboard` group) moves the
  committed ones once. The move gate holds every removal to its entry: an applied record by its git blob and
  sha256, a row audit report by its size and sha256 (`gate` in `kb/_row_audit_prune.py`); `receipt-slim.yml` runs it
  on its own commit before the push. The undo is the bucket copy by its entry, or git history.
- **Measured before the move:** 139 applied records, 124.7 MB; 14 dated row audit reports, 99.7 MB (7.1 MB each, the
  newest three missing from the size guard's exceptions list, which the weekly listed-file check fails on).
- **To finish:** after the merge, dispatch `receipt-slim.yml` with `mode=dry-run`, then `mode=apply`. The apply commits
  the removals, their entries and the shrunk exceptions list to `main` in one commit, after the gate passes.

## NEXT, in order

0. **Dispatch `receipt-slim.yml`** (`mode=apply`) once this lane's S695 PR merges, outside the daily cron windows
   (06:17, 09:17 and 12:17 UTC; keep 30 minutes clear): it shares the `daily-dashboard` group, and a newer pending
   run in a group cancels an older pending one. Then the workflow has nothing left to move and a later PR may remove
   it.
1. **Part 5, the history rewrite: Sam's go.** Rule 5's one permitted main-history rewrite needs the cron paused, his
   explicit go and every open session told to re-clone. Waits on him; not on the standing sheet as a card.
2. The spreadsheet export and the videos out of the tree; the PR that moves them lowers `TOTAL_CAP_MB` (1,500 MB, then
   1,000 after Phase 3).
3. Cap the timed workflows' commits (once a day), in a plain session (`d-slimming-to-plain-session-s683`: Sam's routine
   prompt of 2026-11-17 keeps conductor runs to collection; S683 left this, 4 and 5 untouched).
4. The session trim (Part 3A), with COBIx in a plain session: as written it assumes a session rooted at the repo, while
   ours root at the parent with three repos (the repo's own settings do not load; the environment's setup script
   installs the guards at the root), and a trimmed tree breaks `check_generated.sh` and the tests until the data
   folders are added back.
5. `START_HERE.md` and the `CLAUDE.md` cut, after COBIx's rulings digest (the guard already warns past 600 and 2,000
   words), in a plain session: the cut moves doctrine every session loads.
6. Worker worktrees under `.claude/worktrees/` take about 2.3 GB each (six took the disk from 27 GB free to 13 GB):
   remove a finished worker's worktree once its head is pushed (S681).
7. **#3526 merged (`d-dependency-map-on-main-s683`):** one job on `main` (`dependency-map.yml`) rebuilds
   `kb/dependency_map.json`, `docs/reference/dependency_map.md` and `cobi_admin_surface.js` after each merge; a PR does
   not run `kb/_build_dependency_map.py` and leaves them as `main` has them. COBIx's two follow-ups: the suite shards
   still read the committed map, and `check_generated.sh` should print its own line when the builder crashes (rc 2).
