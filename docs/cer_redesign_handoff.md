---
title: "CER redesign handoff: the CLEP fold confirmed, the Catalog sync test fixed (SkySnowberry)"
date: 2026-11-01
session: CER redesign build, side session after S536 (SkySnowberry)
tags: [handoff, cer, exhibits, exhibit-canonicalization, clep, credential-catalog]
status: current
---

# You are SkyCheckerberry, the Exhibits tab's next build

SkySnowberry ran on 2026-11-01 from 02:51Z to 07:25Z, started from Sam's phone. No other session was live on these
files; S536's CPL queue line merged #2636 (the contacts harvest) beside it, on other files. This is a **light
checkpoint**: no lane's state changed and the run wrote no re-mint or data receipt. This file is the handoff, and the
CPL queue's `docs/session_<N>_handoff.md` stays the routine's. Skipped, each with its reason:
- The lane files: none moved. The CER lane's NEXT stands as SkyTeaberry left it.
- `README.md`, `kb/README.md`, the pipeline view, a KB note: no change to the KB, the surfaces or the pipeline.
- `kb/status/program-requirements.json`: that line was not worked.

`kb/status/exhibit.json` was refreshed by hand: `scripts/queue_status.py --stamp` accepts only a
`docs/session_<N>_handoff.md`, and on this file it rewrites the JSON at indent 2 before it refuses. Write it at
indent 1.

## What shipped

- **#2634, the Catalog sync test (SkyTeaberry's open work 5).** `tests/credential_catalog_sync_test.py` required
  every statewide credential to carry `ccc_rec`, the gate the sierra-retrieval-corpus lane retired (`ccc_rec` comes from
  adoptions). It now gates on `ccc_rec`, the published statewide set from the Fact Sheet builder, or that builder's MAP
  fix list. Of the 78 it flagged, 68 answer through the published set. The other 10 are on the fix list: nine
  statewide exhibits MAP publishes with no recommendation (four ICC inspector and examiner titles, CSLB C-4, NATE,
  NCCER Core, a BAS certification and DLPT Russian), plus
  *Introduction to Hospitality Management*, which has local recommendations only. It passes on main.
- **The CLEP fold took (open work 3).** The 05:14Z dispatch of the daily run (the 06:17Z rung did not fire after it)
  synced the live rows. A dry run of `kb/_fold_unclassified.py` on main reads all 33 assignments moved under
  `cer-clep-fold-skyteaberry@bot` as *already classified to the same target*. 61 CLEP preseed rows read STALE, all
  `preseed-v1@bot` and all Roman-numeral forms, the same 61 as the 2026-10-31 report (the old handoff said 38).
  They were left alone.
- **Nothing from Sam to act on.** No `kb_curation` row was saved after 02:30Z and no rule was sent to the routine
  (`cer_procedure_request`), as of 07:20Z. Another look reads 119 cards after the IB and CLEP folds (122 before).

## Read first

Read `docs/reference/lanes/cer-procedures.md` (the CLEP block and NEXT), then the SkyTeaberry and SkySnowberry
sections of `docs/cer_v2_redesign_lessons.md`.

## Open work, in order

1. **After each of Sam's runs through Another look,** read the next fold's `credential_moves` and `credential_retires`
   and move the panel rows they list, as SkyHuckleberry did.
2. **The first rule sent to the routine** (carried): when one shows up in the Rules view, confirm the overnight
   firing worked it by step 7.
3. **Carried:** the Catalog's *Courses that may align*, once a source names courses. Training sites for a held title
   new to the reference, only if Sam asks.
4. **Noticed, not this lane's:** the 10 credentials on the Fact Sheet builder's MAP fix list need a CCC-tagged
   recommendation in MAP. That is MAP's write, so the record of them is the builder's own log.

## Lessons to honor

- **A quiet night writes no fold receipt.** `kb/_fold_unclassified.py --apply-if-safe` with nothing to fold prints
  *Nothing to fold — receipts left untouched* and writes no `kb/unclassified_fold/<date>/`. To check a moved row, run
  the dry run locally (it writes the day's `report.json`), read it, and delete the folder.
- A test's assertion can outlive the doctrine it encoded. Before you fix such a test, read the lane that owns the
  field; here it had already ruled the gate.
- The run log lives outside the sandbox (`productionresultssa*.blob.core.windows.net` returns 403). Read it through
  `mcp__github__get_job_logs` with `return_content`, in a subagent, so the dump stays out of the session.

## Let go

At sign-off this session holds no PR watch (#2634 merged, unsubscribed), no check-in (the CLEP check fired and the
#2634 safety check was deleted) and no artifact watch.
