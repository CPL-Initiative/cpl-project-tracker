---
title: "Session 547 handoff: AP, CLEP and IB in the cert catalog, the fifth contacts read, the Fact Sheet's UI pass"
date: 2026-11-02
session: 546 (SkyPinwheel, scheduled, the 06:12Z firing of 2026-11-02)
tags: [handoff, credential-registry, cert-link, contacts-harvest, ui-pass, course-outcomes]
status: current
---

# You are Session 547

Your moniker is **SkyCartwheel** (galaxy names, Sam at S540). S546 was a scheduled session and ran a **full
checkpoint** (a Rule 10 data write: the contacts apply and its receipt). Skipped: the Pipeline tab (no phase, auditor or
re-mint moved), `kb/README.md` and `README.md` (no structure or surface change). No `list_sessions` this run: read the
open PRs and `main` since this handoff (step 1).

## What shipped

- **Step 0:** dispatched `daily-dashboard.yml` at 06:17Z (run 41398957336, success). Handoff 546's item 0 checks all
  hold: `unmatched` is empty in `cpl_funding_performance.js`, `vet_star` and `vet_jst` carry *San Francisco* and
  *Desert*, `cpl_funding_ess.js` reads 152 statewide credentials, `kb/exhibit_slo_neighbors.json` rebuilt, and the log
  says `college short names: 118 colleges, nothing changed.` with no warning.
- **#2686, AP, CLEP and IB in the credential catalog and the cert link** (handoff 546 item 1). The fold readers already
  carry the official lists Sam ruled on, so the catalog builder imports them (`official_exam_lists`). The nightly watch
  gains no issuer. 152 exam rows, 21 retired, 98 joined to MAP (every CLEP and IB title, 43 of 46 AP). The link now holds
  168 titles to 122 certs (AP 43, CLEP 35, IB 20, ASE 24). **Merge it on a passing `test` if this session did not.**
- **Main's lints were red twice over, fixed on #2686's branch.** `cer_procedures_test.py`: the committed unclassified
  queue emptied, so `run()` never asked the classifier; the check now builds its own one-card queue.
  `ccr_cpl_universe_test.py`, red since the 06:25Z daily run: it assumed all statewide exhibits are articulated (84),
  but #2667 made it 152 (90 articulated). It now checks the rings against `counts.statewide_articulated`, and bounds
  allow for rounding. **Curation gap it names:** *Child Development Associate (CDA) Credential* is statewide and
  articulated, but its courses carry no discipline, so it sits in SkyView's no-discipline pile.
- **The UI pass: the Fact Sheet** (on `claude/practical-meitner-7x9x8y`, the checkpoint PR). Every target passes.
  `fact-sheet-sierra` and its dark twin still pressed the page's own *Ask Sierra* word, removed 2026-10-30, so they now
  open her from her chip. Ledger recorded.
- **Step 8, the fifth contacts read** (run 41399086674, apply 41400268911). Records came from six colleges: Irvine
  Valley, Lake Tahoe, Laney, Las Positas, Long Beach and Los Medanos (25 people). **The seven LACCD colleges returned
  403** and Lemoore's certificate has expired. The 4CD Chancellor retires 2026-12-30.
- **Step 11, the SLO read:** Golden West's full read (#2684, `cccd`, two parts) and Santa Ana's course index (#2685)
  were started. Both drafts stay open for the next firing to read.
- **Steps 5 to 7, 9 and 10:** no to-do marked done, no CER rule request, no re-analysis request. The one Library request
  (IACA) is SharePoint-only, as S540 recorded. Step 10 already ran for 2026-11-02 (#2683).

## Sam's decisions this run

None. Scheduled run; no sheet is open and no lane carries NEEDS SAM.

## Open work, in order

1. **#2684 and #2685 (step 11).** Pull each branch, run `python3 scripts/next_slo_colleges.py --all`, and act on the
   state: Golden West to `load` once both slices are filed. Santa Ana's index ran (41399078640, committed to #2685):
   merge #2685 on a passing `test`, then its trial (`index=kb/course_outline_index/index_41399078640.json`,
   `slugs=santa_ana`, `trial=12`) is the next day's preparation run.
2. **Step 8, the sixth read:** the 15 read longest ago. LACCD's nine colleges will keep returning 403 to the plain read
   (`cpl_memory` `laccd-refuses-plain-http-contacts-read-2026-11-02`). A browser read or another source for the district
   is a lane item worth building before the first full pass ends.
3. **The cert link's next families:** the CLEP and IB families are in. Next are the reference's other certs that the
   catalog lists (CompTIA, Cisco, Microsoft) on the ASE and exam patterns, or the 148 exam rows with no CIP sector, if
   Sam wants them placed.
4. **Monterey Peninsula's 14** (program-requirements-harvest lane, lessons *S536*): one more session under 3% parks it.
5. **Carryover:** Accept's email (Sheet 146 card 3), Sierra's first-text latency, and MiraCosta's short name (Sam's
   call, one edit in the College Identity tab). Offered to Sam with no answer yet: a smoke mode for the JST question.

## Lessons to honor

- **`check_generated.sh` reads STALE when `openpyxl` is missing locally** (`python3 -m pip install openpyxl`; plain
  `pip` installed it into another interpreter here). Two "stale on main" files were that.

- **Check the repo for the list before harvesting it.** The AP, CLEP and IB names were already committed in the fold
  readers (`docs/cer_v2_redesign_lessons.md`, *SkyPinwheel*).
- **When a control leaves several pages, grep `a11y.config.js` for its selector in the same PR** (`docs/ui_pass_lessons.md`).
- **Prefer a college's leadership page over its directory** (`docs/map_users_lessons.md`, *S546*).

## Let go

S546 subscribed to no PR and set no check-in or artifact watch. Open at sign-off: #2684 and #2685 (SLO drafts, runs in
flight), #2686 (exam catalog), and the checkpoint PR from `claude/practical-meitner-7x9x8y`. The CPL queue fires next at
07:12Z.
