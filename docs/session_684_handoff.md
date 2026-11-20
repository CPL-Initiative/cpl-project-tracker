---
title: "Session 684 handoff (from SkyNuthatch, S683)"
created: 2026-11-19
updated: 2026-11-19
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyVerdin (Session 684)

From SkyNuthatch, S683, the CPL Queue routine's 06:12Z firing of 2026-11-19 (started 06:13Z): a conductor run for
collection only under Sam's routine prompt of 2026-11-17, following the COBIx brief on #3358 as updated
2026-11-19T02:34Z. A **full checkpoint** (lanes moved, Rule 10 writes ran), written by the checkpoint-docs worker.
Skipped: 2 and 3 (no KB generator or listed surface changed), 7 (no M-ID pipeline move), 9 (its own queue item).
`list_sessions`, `get_trigger`, `get_session` and `set_session_tags` were not among the tools: no tag, no cost readout,
no `next_run` refresh. **The headline pair and the harvest row were not read tonight** (one `execute_sql` call stalled
55 minutes), so the status file carries the session fields, next step and changes only.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Tonight's ran 06:20Z to 08:20Z and stopped at the two-hour background limit.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), oldest finished first, one update from `main` right
   before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
3. **Merge order:** the wave (`claude/wave-s683`, #3544), then #3535 (this checkpoint), then
   #3528, then #3529.

## Your first steps, in order

1. **Apply the memory rows:** point `kb/migrations/.apply` at `kb/migrations/2026-11-19_s683n_cpl_memory_rows.sql`
   (19 rows, rollback beside it) and let `supabase-migrate.yml` run it.
2. **The wave (#3544, head `752b2780`) and the one test still red.** Read its thread first. Tonight a CI run took about
   90 minutes, so its `test` result arrives after sign-off. It carries the repairs of `tests/side_by_side_test.py`
   (#3542) and `tests/exhibits_side_by_side.test.js`. **`tests/issuer_tags.test.js` is still red on `main` and on the
   wave:** the daily run gave `kb/credentials.json` five issuers that `kb/reference/issuer_tags.json` does not hold
   (Dublin, Emerald and Amador Valley High Schools; AATA; Goodwill Industries). The permission check denied the wave
   worker's edit of that file, and the conductor did not make the edit in its place. So the wave fails shard 4 until
   the five are settled, and nothing merges to `main` before that. It is a curation call: Sam's rule of 2026-11-18 on
   high school articulation (*"Don't add the high school as a second issuer"*, the brief's section 5, not yet in
   `sam_rulings`) says the three high schools should leave the issuer list, which is a different fix from adding
   their tags. Take it as your own first task with COBIx, or put it to Sam; then merge the wave on a green `test`.
3. Update #3535 from `main` and merge it.
4. **The display build:** `kb/_build_roep_display.py` on a branch, commit only `cpl_pathways_roep_data.js`, dispatch
   `step=display`; then the harvest gap census, reporting the shrink against 5,395.
5. **#3528** (ready; COBIx asked for a read). Its green `test` on `3f27606` predates the daily commit, and its own test
   reads a Las Positas card from the same Review queue, so it takes one more update from `main` after the wave merges
   and merges on that head's `test` (the conductor's note on its thread says so). Then **#3529** with its one update.
6. Southwestern and NOCE previews on fresh branches off `main` (#3536 lands in the wave).
7. A named-gaps pass over tonight's re-read records: the rereads replaced rows the apply had labeled (live
   `catalog_figures_differ` reads 19 of 21).
8. The reread plan's next batch: about 45 colleges, 10 to a batch, never 17 dispatches at once.

Read this file, then the NEXT lines of `program-requirements-harvest` and `repo-size`, then
`docs/reference/conductor_mode.md`, *What went wrong in S683*.

## What shipped (on branches; the wave carries them)

- **The Chabot stop, cleared** under Sam's go of 2026-11-18 (7:08 AM PT, relayed by COBIx). #3497's 99-row named-gaps
  plan applied (pre-read 44472420629, apply 44474531589: 99, none skipped). #3508 after two review rounds, 14 rows with
  Long Beach City 44747 (pre-read 44473918412, apply 44483137614: 14), with the CPL Pathways reader for a `together`
  group and `NOTE_PAIR_ON = False`. Chabot (#3492) re-read (44472580748), standing test 26 of 26, load 44484699264:
  1,013 `slo` and 1,013 `objective` rows; `course_outcomes` 30,321 to 32,347.
- **The reread wave** (`kb/_program_reread_keep_better.py`, two review rounds, 6 findings fixed): cheap piles
  (`claude/reread-wave-s683`, head `90b9d25c`) 114 replaced and 53 inserted at nine colleges; collection
  (`claude/harvest-wave-s683`, head `0d4699a7`) 19 and 19 at six. 133 replaced, 72 inserted,
  `program_requirement_records` 18,240 to 18,312, every receipt `error` null; the filed run costs sum to $25.20 (the
  conductor's estimate was about $18). College of the Desert skipped (72 programs, 63 passing, 0 aim rows).
- **#3536**: the reader stops at a WAF challenge and a challenged robots.txt; none of the eight hand-fetched colleges is
  refused by the program reader. Follow-up to file: JSON calls file as `refused`, should read `challenged`.
- **The cheap-piles lists** (`claude/cheap-piles-s683`): A5's 31 misses are 20 self-check errors and 11 A5's own; of 33
  held-out records, 9 fit `no_units_printed`, 24 no named gap.
- **Outlines:** census recheck #3538 (none of six joins the queue; NOCE's outline host is refused by robots.txt);
  Peralta re-indexed (2,201 codes on report 416); Crafton Hills indexed (566 of 579); Rio Hondo's index failed; College
  of the Siskiyous' trial 9 of 12 (moves to read); Mt. San Antonio's trial shows a parser bug (#3537, open, not in the wave).
- **`main` went red** on `tests/side_by_side_test.py` after the daily run (Sam settled 28 of 31 held cards); fix #3542.

## Open work by lane (from the NEXT lines)

1. **program-requirements-harvest**: the first steps above; then the outline readers (Peralta's reader fix and trial,
   Crafton Hills' trial, Rio Hondo `discover=`, Siskiyous' full read, Mt. San Antonio's parser, CCSF's outline index);
   rule D; Lassen's structured-fields step 1; (5) to (12) unchanged. For a person: West Los Angeles 38677
   (`held_for_person`); Los Angeles Mission 44849 has no live row. Long Beach City's preview 44474831635 looked stuck.
2. **repo-size**: Part 5 waits on Sam's go; the spreadsheet export and the videos; **the three slimming items**.
3. **For a plain session** (conductor runs do no UI, tooling or governance work): **cer-procedures** NEXT (1), the pair
   apply; **commons**, Rule G apply and the deployed `course_outcomes` college-name check; **library**, Ashley's pieces
   through Start; **sierra-page-redesign**, Phase B's photo call and #3511 (Sam merges it); COBIx's unanswered findings
   (#3526's two follow-ups, the generic one-course exhibit rule); the brief's section 5; two reader items (Peralta's
   one code holding four colleges' records; Saddleback and Irvine Valley's index status words); the wording slip at
   `kb/_build_side_by_side.py` line 334 ("this exhibit is an 2 credit recommendations"); three Library requests (one due
   2026-11-18: Cable Splicer CPL Opportunities), CER and reanalysis requests.

**To COBIx, plainly:** the brief's three repo-slimming items (`START_HERE.md` and the `CLAUDE.md` cut, the session trim,
timed workflows committing once a day) were not done. The conductor's decision (`d-slimming-to-plain-session-s683`):
Sam's routine prompt keeps conductor runs to collection, and the cut moves doctrine every session loads, so they go to
a plain session.

## For Sam

[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current) holds one card; Part 5's go waits.
**The conductor ran on Fable 5.2** (`claude-fable-5-2` on every call). The brief expected the routine's form to set
Opus 5.5 tonight, so this was a second Fable 5.2 night and the comparison still needs the form changed: yours to do.
**`main` cannot take a merge until five issuers are settled** (`tests/issuer_tags.test.js`; first step 2 above): three
high schools, AATA and Goodwill Industries came into `kb/credentials.json` with the daily run and have no entry in
`kb/reference/issuer_tags.json`.

## Decisions

No new ruling from Sam in his own words, so `sam_rulings.md` gets no row. The conductor's: `d-reread-keep-the-better-s683`,
`d-reread-then-load-s683`, `d-a4-apply-with-pathways-reader-s683`, `d-note-pair-off-s683`, `d-desert-skipped-s683`,
`d-trigger-branches-no-pr-s683`, `d-lane-workers-dispatch-reread-load-s683`, `d-slimming-to-plain-session-s683`,
`d-conductor-model-as-configured-s683`. KB note: `methodology-a-reread-keeps-the-better-record`.

## Patterns that worked

- The script-run wave step: once the keep-the-better script passed review, lane workers dispatched reread and load.
- Lane workers polling quietly, one line per batch.
- One wave PR for everything, carried PRs closed with branches kept.

## Safety patterns to honor

All of 683's (`git -C`, never `cd`; one `supabase-migrate` at a time; summaries at most 400 characters; remove a
finished worker's worktree; never merge #3511). New: `p-runner-pool-starves-migrate-s683` (17 dispatches and a dozen
pushes in 40 minutes: database runs waited 30 to 40 minutes, CI 90); `p-ci-cancel-agent-denied-s683` (refused by the
permission check; not routed around); `p-execute-sql-stalled-s683` (08:15Z to 09:10Z; the declaration's half-hour
refresh lapsed once: keep the heartbeat off the SQL path); `p-fixture-by-rule-vanishes-s683` (a test that picks its
fixture from today's rows fails when a person settles them).

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*, Sam's change of 2026-11-11): two lanes, never on one college; about $750 a day for everything, $10k and
$30k running totals for the whole job; workers on the worker model Sam's cost rules name, high effort on any worker
that writes shared data; reviews at most 9 agents; $40 per college per run. The routine's form sets the conductor. A
session Sam starts by hand works the queue itself.

## The college split (written before any worker started)

Two lanes, one writer per college: the conductor applied #3497 and #3508 first; the cheap-piles lane took Mendocino and
CCSF's previews, then the reread plan's colleges; the collection lane took the six hand-fetched catalogs, the
unblocker colleges, the outline indexes, Chabot and Lassen. No run is in flight at sign-off.

## Ledger and let go

| PR or branch | State | Next |
|---|---|---|
| the wave `claude/wave-s683` (#3544) | open, in CI at sign-off | read its thread; merge on green `test` |
| #3535 this checkpoint | draft | update from `main`, merge after the wave |
| #3528, #3529 | open | #3528 by 09:30Z with no finding; #3529 after one update |
| #3497, #3508, #3492, #3539, #3540 | closed as carried, branches kept | none |
| #3537 Mt. San Antonio reader | open, not in the wave | the parser fix, a plain session |
| `claude/slo-peralta`, `claude/slo-socccd`, `claude/slo-crafton_hills`, `claude/slo-rio_hondo`, `claude/slo-college_of_the_siskiyous`, `claude/slo-mt_san_antonio-trial` | pushed, no PR | the outline steps above |
| `claude/reread-college-of-the-desert-s683`, `claude/reread-long-beach-city-s683` | preview only, no PR | Desert skipped; Long Beach's run looked stuck |
| #3511 | ready | Sam merges it |

Subscriptions: none held. Check-ins: none. No artifact watch.

Spend: $94 (estimate from token counts at list prices: Fable 5.2 $33, Opus 5.5 $61); collection $84, infrastructure $10; 2026-11-19T06:13Z to 2026-11-19T09:47Z.

No cost readout (`get_session` was not among the tools). Token counts from the session's transcripts at 09:28Z: Fable
5.2 (the conductor) 179 calls, 0.25 million output, 0.58 million one-hour cache-write, 69.7 million cache-read; Opus 5.5
(workers, readers, this checkpoint) 1,049 calls, 0.60 million output, 3.92 million five-minute cache-write, 146.7
million cache-read; Haiku 5.5 13 calls. At list prices (the claude-api skill's table, cached 2026-11-03, and the Opus
5.5 row `kb/_spend_meter.py` records: Fable 5.2 $40 output, $16 one-hour write, $0.20 read; Opus 5.5 $20 output, $5
five-minute write, $0.20 read) that is about $33 for the conductor and $61 for the agents, **about $94 in all, an
estimate**; the billing page is the record. By purpose, a judgment rather than a measure: collection about $84,
infrastructure (the `main` fix and the wave's assembly) about $10. The extraction runs' own filed cost, $25.20, is
separate. `kb/_build_spend_daily.py --sessions-only` reads a `not available` line as no dollars, so the estimates for
S680 (about $167), S681 (about $77), S682 (about $26) and S683 stay in the handoffs' prose and are not in the file.

| Running tally since Nov 17 | Value |
|---|---|
| Spend | about $654: collection about $328 (S680, S681, S683); curation about $141; infrastructure about $48; untagged $120.82 plus runner $7.87; extraction runs tonight $25.20 apart |
| Program records | about 234 (141 plus tonight's 93); 133 rows replaced by a better re-read |
| Outline rows | about 7,270 net (5,244 plus Chabot's 2,026) |
| CRE / cost per CRE | about 10,780 CRE (tonight 3,421: 93 records at 15, 2,026 rows); collection about $0.032 per CRE, blended about $0.06 |
| Tonight by lane | cheap piles: 53 inserted, 114 replaced, the 99 and 14 plans, $19.71 of run costs; collection: 19 inserted, 19 replaced, 2,026 outline rows, $5.49 |
| Days left | not re-measured (no census read tonight) |

S683: cost not available (no get_session; about $94 at list prices, an estimate); records collected 93 new (72 program rows inserted, 21 collected with a named gap) and 133 rows replaced by a better re-read, with 73 gap labels and 14 unit rows corrected; outline rows added 2,026 (Chabot); substantive PRs merged 0 (the wave, which carries six pull requests' work, was open and in CI at sign-off).

Opening line: *Greetings, you are SkyVerdin (Session 684), see SkyNuthatch's handoff, `docs/session_684_handoff.md`,
let's keep rolling with our queue.*
