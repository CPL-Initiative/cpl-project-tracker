---
title: "Session 472 handoff: the noncredit builder counts exhibits and the portfolio course; How to meet it for the noncredit conditions"
date: 2026-10-25
session: 471 (SkyPenstemon)
tags: [handoff, implementation-funding, noncredit, scenario-4, builder]
status: current
---

# You are Session 472

Your moniker is **SkyBrodiaea**. Session 471 (**SkyPenstemon**) was started by the CPL Queue routine at 06:12Z on
2026-10-25 and ran a **full checkpoint** (a lane moved and a database function was applied). It skipped `kb/README.md`
(no KB structure changed), `README.md` (no new tab) and the Pipeline tab (the pipeline did not move). Read, in order:
this file, then `docs/reference/lanes/implementation-funding.md` (the noncredit paragraph), then the S471 section of
`docs/cpl_funding_lessons.md`, then the item you act on.

## Who else is working

No `list_sessions` this run. The open PRs and `main` showed S470's last PRs merged at 06:12Z and nothing newer. The
routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires hourly until 13:12Z; if it starts first, it is SkyBrodiaea, and a
session Sam opens later agrees one writer with it per `docs/reference/scheduled_sessions.md`.

## What shipped

- **#2437, the noncredit builder** (the lane's NEXT): `kb/supabase_cpl_funding_nc_counts.sql` adds
  `cpl_funding_nc_counts()`, service role alone, **applied** by supabase-migrate run 40169350048 and read back (anon and
  authenticated hold no EXECUTE; 116 institutions). `funding/_build_funding_performance.py` emits `nc_cdcp` (absent where
  COCI states no funding category: Fresno City, Calbright, so TBA), `nc_exh` (NC-1 channels 1, 2 and 4, each exhibit
  once; a standalone at its district's colleges, into `origination.in_scope`) and `nc_course` (an attested control number
  COCI confirms in an active noncredit program). The daily step now passes `SUPABASE_SERVICE_KEY`. Measured in SQL
  first: Cabrillo 34, Santa Ana 17, Las Positas 9, Norco 3. Every noncredit share stays held until its institution
  attests. Guard `tests/funding_nc_counts_test.py` (18). Also **How to meet it** for the two noncredit conditions
  (`mc_how_nc_coord`, `mc_how_nc_team`, S471's drafts), offered on the college panel's noncredit list too (E1 to E4 in
  `tests/cpl_funding_nc_attestation.test.js`).
- **This checkpoint's PR:** the funding lessons (S471), three `cpl_memory` rows
  (`kb/receipts/cpl_memory_2026-10-25_s471.sql`), this handoff, CPLBrain's session note.

## Decisions Sam made this run

None. S471 worked the handoff's queue. The calls inside the build follow his Sheets 113, 114 and 125: a missing
denominator reads TBA, never a target of 2; channel 3 waits on a credential crosswalk; NC-2 counts only a course COCI
confirms. Each is reversible by `git revert` and none is on the hold list, so no card was needed. Open Asks Sheet 126
(https://claude.ai/artifact/DhHtadX92wE5LxmAWrB2z5) stays current, both cards answered.

## Open work, in order

0. **Read the first daily run with the builder.** After the next `daily-dashboard.yml` run, grep its log for
   `noncredit outcomes for` and check `cpl_funding_performance.js`: `statewide.nc_exh`, `colleges.Cabrillo.nc_exh` 34,
   `origination.in_scope.NOCE`. Then the funding page: each noncredit outcome reads a count against its target, and the
   share stays held where no attestation is on file. A `cpl_funding_nc_counts failed` line means the keys stayed
   absent: fix the call, never zero them.
1. **Sam sees it live:** the noncredit attestation and the two new How to meet it passages, his to curate in the text
   editor.
2. **The memo's noncredit paragraph** (the lane's NEXT), then **channel 3** (a curated credential-to-course crosswalk;
   S468 found 2 or 3 at Cabrillo).
3. **The UI pass:** the next view is the Fact Sheet (`python3 scripts/ui_pass.py --next`); S470's pass covers
   2026-10-25 UTC, so the first scheduled session of 2026-10-26 takes it.
4. **`oversized_doc`, 3 left:** `roadmap_archive.md` 4.98x, `cpl_funding_lessons_archive.md` 2.8x, the harvest lane
   1.34x. Funding's archive 2 already holds 2026-09-22 onward, so splitting archive 1 needs a part between them: name it
   before moving anything. `cpl_funding_lessons.md` stands at 118 KB against 120 KB: the next funding checkpoint moves
   its oldest sections out first.
5. **Waiting:** the NC CPL Lead on the landing pages; Sheet 121 card 2 (Sam's four Coordinator Guide files); Baking and
   Nursing until their JPEGs reach the Drive folder *Photos*. Sierra's logo still links to map.rccd.edu (his Sheet 53
   call): ask before switching it. `house_voice` flags one *utilize* in `docs/t5_55050_amendment_package_draft.md`.

## Lessons to honor

- **supabase-migrate applies `.sql` only under `chatbox/`, `kb/` or `supabase/`.** Any other path exits 2 with no
  receipt.
- **A server-only function nothing calls can apply on the PR branch before merge.** Restore `kb/migrations/.apply` to
  main's content in the next commit, which also gives the head a `test` run.
- **Write a COCI lookup as a join.** A subquery per exhibit runs past the MCP's 60 seconds.
- **Absent, never zero**, for any count the page reads as delivered (`srcDelivered()` asks whether the key exists).
- `cpl_memory.summary` is capped at 400 characters. CLAUDE.md sits near its 60,000-byte budget: measure before adding.

## Let go

S471 drops its watch on #2437 at its merge and on the checkpoint PR at its merge. No check-in is scheduled and no
artifact watch is held.
