---
title: "Session 397 handoff: wave 4's last four reads, one display build, Monterey Peninsula's reread, Sheet 84"
date: 2026-10-16
session: 396 (SkyJacaranda)
tags: [handoff, program-requirements, catalog-sweep, reconcile, curriqunet]
status: superseded
---

# You are Session 397

Your moniker is **SkyCatalpa**. Session 396 (**SkyJacaranda**, `session_01WJmauBwfQzgFm4F42LNn6f`, opened by Sam by hand)
wrote this as a full checkpoint at about 10 PM Pacific, so the CPL Queue routine could start after it (Sam: "hoping it can
start after you finish up"). Run `list_sessions` first. If the routine started you, follow
`docs/reference/scheduled_sessions.md`.

## What shipped (S396)

- **#2151** (wave 3's procedure records) and **#2148** (Santa Ana's curriQunet reader) merged.
- **Wave 4 read** (about $175 under the $40 go), one branch and one host each, all loaded unchecked so far: Ventura 101,
  Oxnard 64, Reedley 36, Palomar 220, Chabot (233 read, 201 passing; receipt `3e5539b` on `claude/s396-chabot`).
- **Dated reads for all nine wave-4 colleges** filed on `claude/s396-sweep-wave4`, each matched in SQL by md5.
- **Reconcile steps** for Orange Coast (applied: 11 records replaced, reread 38847265701) and Monterey Peninsula (written
  and tested; its reconcile run 38844053281 was still capturing at sign-off).
- This checkpoint (the handoff, the lane, lessons S396), cut short so the 10:12 PM routine firing could start you.
- **Open Asks Sheet 84's cards** are written on the vault branch `claude/s396-sheet-84` (`--check` passes, six cards),
  not yet built or published: build it, inject the reply chips, publish with `{db: {}, comments: {}}`, open the vault PR.

## Decisions Sam made this run

None. Sheet 83 held no reply; Sheet 84 carries its three cards and three new ones.

## Priority, in order

1. **The four reads still running** on their own branches: `claude/s396-santa-ana`, `-rio-hondo`, `-saddleback`,
   `-allan-hancock`. Poll with `git ls-remote --heads origin 'claude/s396-*'`; a "File the program requirements read"
   commit is the signal. Read `summary.json`, then dispatch `step=load` on that branch.
2. **Monterey Peninsula:** when its reconcile files on `claude/s396-reconcile-steps`, read which records changed, then
   dispatch `step=reread` there.
3. **The wave branch** `claude/s396-sweep-wave4` (draft PR open) holds the dated reads, Ventura, Reedley, Oxnard, Palomar
   and the reconcile branch. Merge in Chabot, the four reads' branches and the reconcile branch again, then
   `kb/_build_roep_display.py` over the filed records, tests, `git add` and `bash scripts/check_generated.sh` (read the
   exit code), merge on green `test`, then `step=display` on `main`, then procedure records with
   `kb/_program_source_procedure_v1.py`.
4. **Readers parked:** Reedley (36 of 200; 40 index entries, 34 programs lost their page to a sibling: a page read
   first), San Jose City, MiraCosta, Orange Coast's 27 empty records and the thirty whose text lacks the Requirements tab,
   Diablo Valley, Sierra, Foothill.

## Patterns and safety

- **Never read a job log for status.** The college page reads print whole pages; S396 spent a third of its context on
  log tails. A branch's commits are the status. Ask a page read a narrow plan and read its excerpts.
- One branch per college, never two on one host. The filing step rebases, so pushing to a branch mid-run is safe; a
  second run on the same branch queues behind the first.
- A hand-filed dated read is proved by md5s computed the same way on both sides; write rows in the read's own form.

## Not refreshed this checkpoint (cut short at 05:05Z so the routine could fire)

Refresh these first: **Open Asks Sheet 84** (above), **`kb/queue_status.json`** (step 12), **`cpl_memory`** (step 10:
wave 4's loads, the two colleges' reconcile steps, Reedley parked, "poll with ls-remote, never read job logs"), the
**vault session note** (step 11) and `docs/INDEX.md`'s update history (step 6; the index itself is rebuilt). The UI pass (step 9) and
the Pipeline tab (step 7) are skipped; the ledger keeps the view due.

## Subscriptions and check-ins

S396 holds none: its check-ins are deleted, and it watched no PR. The CPL Queue routine still fires once a day (`0 5 * * *`, 05:12 UTC): the hourly schedule is Sheet 83 and 84 card 1, Sam's to set.
