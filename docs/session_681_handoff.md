---
title: "Session 681 handoff (from SkyPhoebe, S680)"
created: 2026-11-18
updated: 2026-11-18
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyGrebe (Session 681)

From SkyPhoebe, S680, the CPL Queue routine's 06:12Z firing of 2026-11-18, a conductor run for collection only. A
**full checkpoint**: the run made Rule 10 data writes. Its documents were written by the conductor's checkpoint-docs
worker. Skipped: step 3 `README.md` (no surface listed there changed) and step 7, the Pipeline tab (no roadmap phase,
auditor count or re-mint moved). This firing had no `get_trigger`, so `next_run` in
`kb/status/program-requirements.json` was not refreshed; the headline and the whole-harvest row were.

Read this file, then the NEXT lines of `docs/reference/lanes/program-requirements-harvest.md`,
`docs/reference/lanes/repo-size.md` (new) and `docs/reference/lanes/commons.md` (*S680*), then
`docs/reference/conductor_mode.md` *What went wrong in S680* and `docs/engineering_practices_lessons.md` *S680*.

## What shipped

<<FINAL-MERGED>>

- **Slimming, #3476 Part 4** (Sam, relayed by COBIx: *"Let's move the bloated data out first thing and make sure we
  don't allow to go beyond a limit."*). **#3495** (`main` 25c79493): display receipts are built, stored and applied by
  the runner from the private bucket `cpl-receipts`, never committed. **#3498** (+ #3501): 141 display receipts and 165
  row audit reports left the tree, each verified by sha256 (runs 44259862567, 44258551009); the daily run keeps the
  newest 14 reports. **#3490**: the size guard in `lints` (5 MB a file outside a shrink-only list of 68, 25 MB
  compressed a PR, 2,000 MB total, a weekly growth job). The tree: 4,862 MB before, about 1,620 MB after.
- **Cheap piles.** **#3491** (`main` e50a87fb): 9 discontinued programs out of the gap census. **#3496**: units rules
  A1, A4, A5 applied to 56 records (runs 44259625861, 44261575737), rollbacks committed, NOT applied; A6 off.
  **#3497**: 75 named gaps (`no_units_read`); pre-read queued; the apply follows. **#3502**: the paid reread plan (no
  blind paid reads). **#3503**: the Spend line's tags and the sessions key rebuilt at each checkpoint.
- **Collection.** 2,452 outline rows loaded: Diablo Valley 946, Los Medanos 483, College of the Redwoods 443, Golden West
  580 objectives (the objectives reread plan is done); Antelope Valley `held`. All carried by the wave **#3504**.
  Lassen #3499 and Cosumnes River #3500 pinned.

## Open work, in order (from the lane NEXT lines)

1. **The display build through the new path** (program-requirements-harvest NEXT 1; no display build ran in S680): on
   a branch run `kb/_build_roep_display.py`, commit only `cpl_pathways_roep_data.js`, then `step=display`. `main`'s
   records build `ee6d9daa5226`; the page and the table carry `cdd185495ce4`.
2. **Cheap piles** (NEXT 2): #3497's apply after its pre-read; the 54 named-gap records of #3502 through #3497's
   mechanism (38 whose catalog figures do not add up, 16 that print no units for a required course); then the
   cheap-pile rules at the collection lane's twelve colleges (`COLLECTION_LANE_S680` in `kb/collection_lane.py`).
3. **Outcomes** (NEXT 3, step 11): load Allan Hancock (#3284), Chabot (#3492, run 44264136885) and Santiago Canyon
   (#3494, run 44258693099) once their slices file complete; on a funded night, one full read per host.
4. **Lassen #3499** (NEXT 4): read reread run 44263840460, then the `set` step with a per-record hold. **Cosumnes River
   #3500** (NEXT 5): the paid read waits on a named-programs-only input. **#3293** (NEXT 6): decide without COBIx, in
   a plain session.
5. **repo-size** NEXT: confirm the first bucket-path `step=display`; Part 5 waits on Sam's go; the spreadsheet export
   and the videos; capping timed workflows' commits; the session trim and the `CLAUDE.md` cut wait on COBIx.
6. **commons** NEXT: add CI's Commons data check to `scripts/check_generated.sh` (a plain session); the retired-course
   drops (Sam: *"Yes, drop all retired courses"*); Sam's billing paste after Nov 15.
7. **For a plain session** (conductor runs do no UI, tooling or governance work): **cer-procedures** #3482 and #3472
   (S679's drafts, each green on its head and in conflict with `main`), Exhibits rules 1 and 2; reader rules A to C;
   the CDC widget; Courses G and M; **common-cr-reference**'s CR exact match and its first `map_ace_catalog_cr` read;
   two Library briefs requested 2026-11-12 and three open revise requests; the credential harvest (step 10, skipped
   tonight); #3383 (dependabot).
8. **implementation-funding** waits on others: card 11's measure texts in the tab, the request to Pedro, the `ppa`
   cutover, and map@rccd.edu after Governance maps the sender.

## For Sam

Nothing waits on him tonight beyond [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y)'s one card
(current) and **Part 5's go**, the history rewrite (Rule 5: cron paused, his go, every session re-clones). The scan of
all 141 display receipts found no email address and no person key, so it is a size question only. He may want to
look at: the Commons count (49 active programs moved from failing to passing on the units rules), the repo-size lane,
and #3502's priced reader changes (aimed lists 260 records at 74 colleges, $26.20; the rest under $22 each).

## Decisions

Sam's, relayed by COBIx on #3358 (brief written 6:45 PM PT, 2026-11-17) and #3476, verbatim: *"Let's move the bloated
data out first thing and make sure we don't allow to go beyond a limit."* · *"As cto you can restructure us."* · *"my
priority is completion and will find the funding to make it happen"* · *"Yes, run both tonight with separate
colleges"* · *"Yes, drop all retired courses"*. In paraphrase (COBIx): never drop a record for failing; collect it with
gaps noted and confidence scores, and report records collected and confidence gained, never "newly passing". The
routine's stored prompt (2026-11-17): *"Conductor mode is back for collection only."* · *"Two lanes, never on the same
college"* · *"Spend caps: about $750 a day for everything. $10k and $30k are running totals for the whole job, not
daily limits."* · *"No new UI, tooling or governance work in conductor runs."* · *"Stop a review after two rounds and
send what is left to Sam or COBIx."* All in `docs/reference/sam_rulings.md`.

The conductor's: one full outcome read per host on a funded night; A6 off; MiraCosta 21976 left out (live on a newer
run than its filed record); no blind paid reads; the 54 records take a named gap with no page read; the session trim
not done (it breaks a three-repo session). Rows: `kb/migrations/2026-11-18_s680_cpl_memory_rows.sql` (14, rollback
beside it); the conductor points `.apply` at it.

## Patterns that worked

- The college split written before any worker started, one list the statewide rules skip.
- The PR chain, each branch holding the one before it, and the outcome PRs as one wave (KB note
  `methodology-chain-prs-when-every-merge-conflicts-a-generated-file`).
- Second readers before every live write, and the pre-read before every apply. `kb/_guarded_sql.py` as the one shape.
- A sparse checkout before spawning (2.5 GB worktrees instead of 4.85); `git -C`, never `cd`, into a worker's tree.

## Safety patterns to honor

A read is free in dollars, not in runner slots: cap concurrent reads when PRs must merge the same night.
`supabase-migrate` runs one at a time: push one `.apply` change, read its receipt, then the next. A PR that changes what
the Commons data reads rebuilds `commons_data.json` (CI's `lints` checks it; `check_generated.sh` does not). Hand a
worker's PRs to a fresh worker near 350,000 tokens. Read a run's status before re-tasking a worker. `cpl_memory`
summaries stay at or under 400 characters. Never commit a display receipt; the size guard fails a file over 5 MB.

## Session settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
the banner note): two lanes, never on one college; about $750 a day for everything, $10k and $30k running totals for
the whole job; Opus 5.5 workers, high effort on any worker that writes shared data; $40 per college per run. Tonight
was night one of the two-night conductor comparison; the routine's form set the conductor. A session Sam starts by
hand works the queue itself.

## Ledger and let go

| PR | State | Next |
|---|---|---|
| #3496 units rules | applies landed, rollbacks committed | merge first, on green `test` |
| #3498 (+ #3501) receipts and reports out | moves stored and verified | merge after #3496 |
| #3490 size guard | in the chain | merge after #3498 |
| #3503 Spend line | in the chain | merge after #3490 |
| #3502 paid reread plan | in the chain | merge after #3503 |
| #3504 outcomes wave | holds the five above | merge after #3502 |
| #3487 this checkpoint | holds the wave | the conductor applies the memory rows, then merges last |
| #3497 named gaps | pre-read queued | apply, then merge |
| #3284, #3492, #3494 | outcome reads in flight | load, then merge |
| #3499 Lassen, #3500 Cosumnes River | pinned | per NEXT 4 |
| #3293, #3482, #3472, #3383 | untouched | a plain session |

The conductor drops every PR subscription, check-in and artifact watch it holds at sign-off and names each in its
closing message. This firing had no `get_trigger`, so the routine's next run is not recorded here.

<<FINAL-SPEND>>

<<FINAL-LINE>>

Opening line: *Greetings, you are SkyGrebe (Session 681), see SkyPhoebe's handoff, `docs/session_681_handoff.md`,
let's keep rolling with our queue.*
