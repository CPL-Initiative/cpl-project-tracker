---
title: Session 368 handoff — load Long Beach City's re-read, Open Asks Sheet 67, CPL Pathways reads the table
date: 2026-10-12
session: 367 (SkyAspen)
tags: [handoff, program-requirements, long-beach-city, cpl-pathways, vision-2030, decision-sheet]
status: current
superseded: true
superseded_by: session_380_handoff.md
---

# You are Session 368

Your moniker is **SkyWillow**. Session 367 (**SkyAspen**, `session_01HC1pCkDgpB2KFniRQNZUFp`) ran with Sam present at the
start only; it checkpointed at the context warning (108k left) and let go of everything.

## First, in this order

0. **One writer.** S367 holds no PR subscription, no check-in and no artifact watch (its 03:35Z check-in was canceled).
   Sam's routine fires at 05:05Z daily (`trig_01L8K64ZKYb5eALdT4HW6NAV`): if you are it, or it is live, agree one writer.
   **Merge S367's two checkpoint PRs on `test`, tracker before vault** (branch `claude/s367-checkpoint` in both repos;
   the vault PR adds Sheet 67's card and the session note, and its coverage check reads tracker main).
1. **Rule 8:** `cpl_memory` tags `program-requirements-harvest`, `cpl-pathways`, `long-beach-city`, `vision-2030`.
2. **Read Open Asks Sheet 67's replies** (https://claude.ai/artifact/RfzQ8djEptLeC1aWARD1eN, current, one card).

## Sam's decisions this run

- **Sheet 66 card 1 (23:44Z, his own call, the same on Sheet 65 card 1): One set, as proposed.** Built in #2017:
  `vision_2030_goals()` feeds the tab and the annual report; Goals 2 and 3 read TBA until he sets the four
  `V2030_G2/G3_PROGRESS` and `_CURRENT` keys in `kb/dashboard_config.json`. `cpl_memory`
  `sam-sheet-66-card-1-v2030-one-set-2026-10-11`.
- **Sheet 65 card 2 answered twice.** Chat ~23:16Z to S366: *Read from the table* (built, #2015). Sheet 23:46Z, after
  eight versions: *Every record, marked*, "I want every record to show marked not yet confirmed". Both are his words; S367
  built nothing on the second and put the question on **Sheet 67** (lane NEXT ④ carries the NEEDS SAM). If he answers
  *Every record, from the table*: open `program_requirement_records`' public read to every row (Rule 10(a3): a disclosure
  change to a shared table, public catalog data, no student detail; record it in `kb/governance_surface_map.json`), and
  make College Briefing and Program Requirements' public view mark an unchecked record as CPL Pathways does. Sierra filters
  `checked` itself. `cpl_memory` `sam-sheet-65-card-2-every-record-marked-2026-10-11`.

## Next in the queue

1. **Long Beach City's re-read** (run 38185403454, `step=read`, dispatched 23:44Z on `claude/s367-lbcc-reread`; the
   capture took 3 h 33 m last time). When it files on that branch: read the account; list the programs left with no page,
   with COCI's status, for the college (addendum first); dispatch `step=load` on the branch (insert-only, unchecked,
   receipt), then `step=display` (Sam's standing go); open a PR for the branch's filed records and receipts.
2. **Sheet 67's answer**, built in the same PR that drops the lane's marker (tracker first, vault second).
3. **UI pass:** `python3 scripts/ui_pass.py --next` (CPL Pathways done this run; its stage selector and program pills
   still fill to mark state, named in the ledger).

## What shipped (S367)

#2012 Long Beach City's two page-reading fixes (S366's, merged) · #2013 S366's checkpoint · #2014 the sheet pointer ·
#2015 CPL Pathways reads its catalog records from the table · #2016 CPL Pathways UI pass · #2017 Vision 2030 one set ·
vault #309 (S366's note), #310 (Sheet 66), #311 (Sheet 66 answered).

## Patterns that worked

- **Render first, swap the table in after.** The tab never waits on a read; the reader's pick survives the swap by identity.
- **Seed the states a sweep cannot reach.** The sweep aborts every Supabase read; `cpl-pathways-table` seeds them.
- **Read both replies stores and the chat before building.** The sheet answer came 30 minutes after the chat answer.

## Safety patterns

- **`get_check_runs` can be 15 minutes stale.** Confirm with `get_check_run` by id or `list_workflow_jobs` (`latest`).
- **`pkill -f` with a pattern that appears in your own command line kills your shell** (exit 144). Kill by PID.
- **A vault decision-sheet PR's coverage check reads tracker main:** merge the tracker PR, then re-run the vault check.

## Not refreshed this checkpoint

**EMERGENCY at the end (49.9k left):** the vault session note (`CPLBrain/07-session-notes/`) was not written; write it from this handoff.

Pipeline tab (did not move); `kb/README.md`, `README.md` (no structure or surface change); no new KB note; step 9's UI pass
(one ran this session, #2016).

## Sign-off line for Sam

Greetings, you are SkyWillow (Session 368), see SkyAspen's handoff — `docs/session_368_handoff.md` — let's keep rolling with our queue.
