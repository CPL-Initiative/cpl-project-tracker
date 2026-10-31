---
title: "Session 533 handoff: Los Angeles Valley 186 to 196 passing on a T & M prefix alias; both display applies read back; the UI pass on Exhibits"
date: 2026-10-31
session: 532 (SkyHackberry, the CPL Queue routine)
tags: [handoff, program-requirements, los-angeles-valley, display-build, ui-pass]
status: current
---

# You are Session 533

Your moniker is **SkyNannyberry**. Session 532 (SkyHackberry) was the CPL Queue routine's 05:12Z firing on 2026-10-31, from handoff 532. This is a **full checkpoint** (the run wrote a reread receipt). It skipped `README.md` and `kb/README.md` (no surface or KB structure they describe changed) and the pipeline view (the M-ID pipeline did not move). No KB note crossed the bar, and no decision sheet was built because nothing waits on Sam that a lane marks.

## What shipped

- **Start checks.** Today's dashboard run had already succeeded (run 41165974476, 03:49Z), so the session did not dispatch one. There were no open PRs, no `queue_todo_done` rows since 2026-10-30, and no new Library requests. The three old regen rows (`noncredit-summit-in-motion`, `noncredit-summit-cpl-slides`, `iaca-mvpmcjyl`) are unchanged.
- **Both display applies read back.** All 17,546 rows carry build f8c94ef23142, Los Angeles Valley's 215 included (applied record run 41145320599, no errors).
- **Los Angeles Valley, 186 to 196 of 215 passing** (#2605). The ten Engineering and Manufacturing coverage failures were one prefix: the catalog prints "T & M 027" where the state's file keeps TM027. The fix is `prefix_aliases {"T & M": "TM"}` in `kb/program_requirements_reconcile.json`, guarded in `program_requirements_pilot_test`.
  - Reconcile 41172599271 (free) rescored exactly those ten, and all ten pass.
  - Reread 41172998050 replaced 10 rows; the receipt is committed. Live: no coverage failures left.
  - Display build 97f8cb5d3f44 is committed on the branch. **Its `step=display` must be dispatched on `main` after #2605 merges.**
- **UI pass, cobi:exhibits.** Both themes pass `npm run a11y`, and `exhibits.js` has no raw hex. On screen, the Credentials view shows 2,456 and Review 468, matching the CER's Reference (2456) and Needs you (468). No fix was needed; the ledger is recorded.
- The dependency map was stale on main after the Exhibits merges; it is regenerated in #2605.

## Open work, in order

0. **#2605:** if it is still open, wait for `test` to pass on its head, then squash-merge. Then dispatch `program-requirements-college.yml` with `step=display` on `main` (push, confirm with `ls-remote`, then dispatch). Read back that every row carries 97f8cb5d3f44.
1. **Los Angeles Valley's 12 program sums** (each fails its program total while the degree adds up). Two shapes so far:
   - Communication Studies 30699 read the 2.0 degree's page (43774's).
   - Anthropology 32410's lists B and C repeat list A's courses (a multi-column read).

   Page-read them before any reader change. Then the 5 incomplete records and Respiratory Therapy 21899 (prints 74).
2. **Accept's email (Sheet 146 card 3, *m365*):** waits on RCCD IT granting the mailbox.
3. **The cpl-chat deploy is held for Sam's go** (handoff 530 item 4). Run the preview A/B first.
4. **The CER redesign side lane** keeps `docs/cer_redesign_handoff.md` (next: SkyTwinberry) and owns `exhibits.js` and the CER files. Its lane file `cer-procedures.md` is over budget (20,962 of 20,000), which is that lane's to compact.
5. **Carryover:**
   - Sierra's first-text latency
   - `credential_alignment_for_college`
   - the college short-name editor and the public page's Contents
   - the lints' checkout time

   Glendale stays parked (`glendale-parked-2026-10-30`). Waiting on Sam with no card: whether to repoint the Chancellor's address Library record to its Pages address.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S532*), `docs/reference/lanes/program-requirements-harvest.md` (*Los Angeles Valley*).

## Lessons to honor

- **Before reading a coverage failure's page, diff the record's codes against the state's list** (`coci_program_courses`). When every missing course has a printed twin under another prefix, it is an alias, and the live tables prove it.
- **Rescore locally with `S.score(record, closed, None, award, aliases)` before a dispatch.** Without text, outcomes and careers read as failing; compare coverage and invented only.
- **This sandbox's `python3` needs `python3 -m pip install openpyxl`** before `scripts/check_generated.sh` reads true.

## Let go

S532 held no PR subscription, check-in or artifact watch. #2605 is open and is the next session's to merge if this one did not. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires hourly overnight; next at 06:12Z.
