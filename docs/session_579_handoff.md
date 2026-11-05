---
title: "Session 579 handoff: the night's routine items (Columbia's full read, the credential slice, the explainer's UI pass)"
date: 2026-11-05
session: 578 (SkyComet, scheduled routine firing, 2026-11-05 ~06:14Z to ~06:50Z)
tags: [handoff, scheduled-sessions, program-requirements-harvest, credential-registry, ui-pass]
status: current
---

# You are Session 579

Your moniker is **SkySpindle** (galaxy names; the Spindle Galaxy, NGC 5866). S578 was a scheduled firing (06:12Z).
The checkpoint was **light**: no lane changed state, and the run wrote no re-mint or Rule 10 data receipt. It skipped
`CLAUDE.md`, `kb/README.md`, `README.md`, the lessons doc, KB notes, the pipeline view, the status files and the decision
sheet rebuild. Handoff 578 said nothing waits on Sam, and the run added no ask. The only data write was one `cpl_memory`
row.

## Start state S578 found

- No open PR updated in the last half hour, and no `list_sessions` tool. #2795 (CR, Courses and Programs alignment) was
  merged at 05:23Z by a session Sam opened by hand, so handoff 578's item 3 is **done**.
- Step 0: the day already had a dashboard run (dispatched 03:07Z, landed at c774d110), so nothing was dispatched.
- Item 1: `cpl-chat-deploy.yml` run 92 (03:45Z, after #2794's `--yes` fix) succeeded, so `library-revise-draft` is
  deployed. S578 did **not** try *Draft it now*: it needs a signed-in person's credential in the tab.
- Steps 5 to 9 were all empty: no `queue_todo_done` rows since 11-04, no requested briefs, no CER rule requests, and no
  re-analysis requests. Two revise rows remain. `iaca-mvpmcjyl` waits on Crystal reloading her SharePoint deck
  (library lessons, S540). `ell-iet-cpl-starting-points` waits on Sam's *Replace the public copy*.

## What S578 did

- **Columbia's SLO full read** (step 11). The trial (run 41784829925) parsed 12 of 12, so S578 merged main into
  `claude/slo-columbia` and pushed `.run` with `catalog=columbia`, `parts=2` and `run=2026-11-05`. Run **41979319035**
  started 06:16Z on draft **#2754**. Both slices filed complete by 06:48Z, so S578 pushed `.load`
  (`host=gocolumbia`); load run **41984104664** was queued at 07:01Z. **Your first item:** pull the branch and check
  for `kb/receipts/course_outcomes_gocolumbia_41984104664.json`. Then mark #2754 ready, merge it on a passing `test`, and
  name the receipt's inserted rows in your handoff.
- **The credential slice** (step 10), on **#2797** (`claude/credential-watch-2026-11-05`). It read AWS, Cisco, Google,
  IBM, Microsoft, NVIDIA and Oracle and **added 4**: Cisco CCIE Automation (formerly DevNet Expert), Cisco Certificate
  in Ethical Hacking, and two Microsoft retirements, PL-200 and MOS Access 2016. It also updated 6 rows' notes,
  harvested 25 skills, and re-checked 3 unverified rows without promoting any. The exhibit-cert link kept 280 links:
  MAP's Access 2016 link now lands on the issuer row through `formerly`.
  - **Material event:** the MOS Access 2016 retirement. `cpl_memory` row `mos-access-2016-retired-2026-06-30` is filed
    and logged.
  - The next slice is the 7 issuers whose `_issuers_read` is now oldest: CompTIA, Databricks and five more, all read
    2026-11-03.
- **UI pass** on `prototype/common_subj_explainer.html` (`ui_pass.py --next`, never passed before), on **#2796**.
  a11y passes at four widths, and every figure holds against the reference. One fix: the page said Diesel Mechanics
  carries AUTD, which the 11-05 recode moved to DIES. The ledger is recorded.

## Open work, in order

1. #2796, #2797 and #2798 all merged.
2. **Columbia's receipt and merge** (above), then the step 11 next for the new UTC day.
3. Tonight's routine steps as `scheduled_sessions.md` lists them. The contacts harvest runs on Sunday, 2026-11-08.
4. Carried from 578: ELL IET Version 3 (Sam's Replace), Sam's own CPLBrain steps (Malone as a collaborator, the
   transfer, about 60 references), the Commons asks, ECONMT and Electricity's adult-education codes, the Subjects card's
   second count, and `CLAUDE.md` near 61 KB against its 60 KB budget.

## Lessons

- **A sync-made ledger id can be generic.** `ui_pass.py --sync` gave the explainer the id `prototype`, so
  `--record <path>` fails. Read the ledger for the id first.
- **`check_generated.sh` needs `openpyxl`** for the discipline-blanks and statewide-catalog checks. Run
  `python3 -m pip install openpyxl` in a fresh container, or both read STALE when they are not.

- **A rename the watch routes through `formerly` still needs the hand-written tables moved.** `VENDOR` in
  `kb/_build_exhibit_cert_links.py` and the MAP route in `kb/_build_it_ai_credential_catalog.py` named MOS Access 2016's
  registry title, so the link read it as not in the catalog. `credential_catalog_widening_test` caught it in CI's lints,
  and #2797's second commit points both at the issuer row's name.

## Let go

S578 holds no PR subscription, check-in or artifact watch. It leaves #2754, with Columbia's load running.
