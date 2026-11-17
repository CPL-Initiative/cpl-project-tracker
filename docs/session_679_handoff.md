---
title: "Session 679 handoff (from SkyWaxwing, S678)"
created: 2026-11-17
updated: 2026-11-17
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyKinglet (Session 679)

From SkyWaxwing, S678, Sam's session of 2026-11-17 (21:41Z on), worked from COBIx's ranked list of Nov 17 PM (asks on
#3464). An **EMERGENCY checkpoint for the conductor** (its context ran out), written by its checkpoint-docs worker. Not refreshed: step 12's Supabase reads (the headline came from the census runner's live read at 23:05Z, and the CPL Queue routine's `next_run_at` was not read, so `next_run` is unchanged); the vault note waits in the conductor's scratchpad (the vault branch was not reachable from the worker). Lane states moved and the run drafted `cpl_memory` rows. Also skipped: step 2 `kb/README.md`
(no KB structure or generator changed), step 3 `README.md` (no user-facing surface listed there changed), step 7 (the
pipeline did not move: no roadmap status, auditor count or re-mint).

Read this file first, then the NEXT lines of `docs/reference/lanes/commons.md` (*NEXT (S678)*) and
`docs/reference/lanes/cer-procedures.md` (*Titles that have left MAP*), then `docs/commons_lessons.md` S678.

## What shipped

- **#3465 (merged, 7dc362df), item 1 (a) to (c) and cost per CRE.** Measured runner and session spend in
  `kb/reference/model_spend_daily.json` (118 runs, $1,133.52 from Nov 17); the Commons `spent_usd` beside `cost_usd`;
  the census runs daily at 17:47 UTC under the failure watch (it was dispatch-only; counts went unread Nov 13 to 17;
  objective courses 2,983 to 10,711); ETA dates name their days; cost per CRE from `kb/reference/cre_weights.json`
  (Sam's definition; Nov 11 to 17 about 19,537 CRE).
- **#3466 (merged, a9f7eec2), item 2.** Titles that have left MAP take Keep, Move or Remove from their row, with CPL type
  labels and the graded and cert-based guard; `kb/_apply_left_map.py` is not yet on a nightly job.
- **#3469 (merged, b0930336), item 9.** A course the scorer met by its Program Course File id is no catalog addition
  (617 mentions at 15 colleges).
- **#3470 (merged, a7218505), item 4.** Commons Clarity units findings 1 to 6, 7 in part; Chaffey's CPL Pathways index
  reads keyset pages (not yet seen live).
- **Governance NEXT (1) closed:** `docket-process` and `credential-catalog-sync` ran their first scheduled runs in
  `live-counts`, both green.

## What tonight's queue run skips and takes

Skip: item 1 (a), (b) and (c), and items 2, 4 and 9: all merged. Take: the leftover drops, the retired-course drops,
and Sam's three rulings in `docs/reference/sam_rulings.md` (recorded by #3470, not applied).

## First things, in order

1. **Merge the open PRs on green `test`** (ledger below): #3467 (the second reader now says merge), #3473, #3474,
   #3472 (its real apply waits for the MAP snapshot run).
2. **#3468 (ACE `CreditRecommendation`)**: once the worker's fixes land (view `btrim`, sum check, panel wording), push
   `kb/migrations/.apply` on its branch, then merge on green `test`.
3. Check that #3467's Keep writes its discipline row on the deployed tab.
4. **Exhibits** (cer-procedures NEXT): wire `kb/_apply_left_map.py` nightly; Rename and Combine on the leftover row;
   #3472's MAP snapshot run, then its reviewed apply.
5. **Harvest** (program-requirements-harvest NEXT): (1) Golden West's objectives full read on Nov 18; the `NCL_EXTRACT`
   switch; (4) #3293 and Cosumnes River; (5) Lassen; (6) Los Medanos and Los Angeles Valley, with a person.
6. **Governance** (governance-team-enablement NEXT (2)): `daily-dashboard.yml` into `live-counts` in its own PR.
7. Sam's billing paste after Nov 15 (commons). Lanes this handoff does not work (library, my-college-action-page) keep
   their NEXT lines; they wait behind the queue above by COBIx's work order.

## Ledger

| PR | State | Next |
|---|---|---|
| #3465 CDC cost and counts | merged (7dc362df) | none |
| #3466 leftover titles | merged (a9f7eec2) | NEXT in cer-procedures |
| #3469 CCN renumber display | merged (b0930336) | none |
| #3470 Commons Clarity units | merged (a7218505) | rulings tonight |
| #3467 Courses rules | open, head 0b91f6985; the second reader now says merge (the last fix makes Keep always write its discipline row) | merge on green `test` |
| #3468 ACE CR kept | open; the worker is fixing the view `btrim`, the sum check and the panel wording | push `kb/migrations/.apply` on its branch, then merge on green `test` |
| #3472 re-point list | open; CI rerunning | merge on green `test`; the real apply waits for the MAP snapshot run |
| #3473 blocked-catalog to-do | open, head 3c61fc98d (catalog address as words) | merge on green `test` |
| #3474 side by side (item 7) | open | merge on green `test` |
| #3471 public funding (other session) | open; not this queue's | leave |
| `claude/s678-checkpoint` | pushed; the conductor opens and merges it | green `test` |

## Session-tool trial (item 9's second half)

Both tools skipped this session. Tool A: npm refused the fetch, so the published package could not be checked against
its source, and it is three and a half weeks old with one author. Tool B: the ask cuts off its repository name.

## Session settings

One Opus 5.5 session works the queue; keep to 3 workers at a time, in sparse worktrees (1.4 GB against 4.8 GB full).
The $40 limits and the #3351 gates stand. Merge only to `main`, confirm with `git log origin/main`. Database writes go
through the runner. Read-only counts go through the runner too: Sam does not want approval prompts for them.

## Patterns that worked

- A second reader on every matcher PR caught two blockers; the self-recall test is the gate for a rule that moves cards.
- Counts routed to the runner's export (`by_day`) instead of an Execute SQL call.
- A worker's open question settled by reading what `main` already holds (the read-only SQL rule existed).

## Safety patterns to honor

Rule 10: read the live rows before a delete; a guarded write carries its before-image. A census pin change is a finding
to judge. `cpl_memory` summaries stay at or under 400 characters. A test never pins a live-read date.

## Decisions

`cpl_memory` rows in `kb/migrations/2026-11-17_s678_cpl_memory_rows.sql` (rollback beside it), applied from this
checkpoint's branch: `d-census-daily-schedule-s678`, `d-cost-per-cre-weights-s678`, `d-left-map-link-only-decisions-s678`,
`f-cre-days-are-load-days-s678`, `f-execute-sql-prompt-unreachable-s678`, `f-sparse-worktrees-for-workers-s678`,
`p-matcher-rules-need-self-recall-s678`. Sam set the cost-per-CRE definition and asked for read-only counts without
prompts; KB note `methodology-a-dispatch-only-feed-goes-stale-without-a-sound`.

## Let go

The conductor drops each PR subscription, check-in and artifact watch at sign-off and names them in its closing message.
The standing sheet stays [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current).

Spend: $115.38 (Opus 5.5 $115.38, subagents included); 2026-11-17T21:41Z to 2026-11-17T23:59Z.

PRs merged (substantive, not counting this checkpoint): 4 (#3465, #3466, #3469, #3470).

Opening line: *Greetings, you are SkyKinglet (Session 679), see SkyWaxwing's handoff, `docs/session_679_handoff.md`,
let's keep rolling with our queue.*
