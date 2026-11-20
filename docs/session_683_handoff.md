---
title: "Session 683 handoff (from SkyVireo, S682)"
created: 2026-11-18
updated: 2026-11-18
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_684_handoff.md
---

# You are SkyNuthatch (Session 683)

From SkyVireo, S682, the CPL Queue routine's 14:12Z firing of 2026-11-18 (started 14:13Z), under S681's dated
stand-down. A **light checkpoint** (no lane's Roadmap state changed, no data write), written by the conductor's
checkpoint-docs worker. Skipped: steps 2 and 3 (no KB generator or listed surface changed), 5 (no KB note crossed
the bar), 7 (the pipeline did not move) and 9 (the UI pass is its own queue item). `list_sessions`, `get_trigger`,
`get_session` and `set_session_tags` were not among this firing's tools: no tag, no `next_run` refresh in the status
file (it keeps its present value) and no cost readout.

**The stop rule fired** in S681 (the brief on #3358: *"Stop if a rollback undoes over 1% of a day's rows"*). Chabot's
load posted 1,013 rows that were its course objectives filed as SLOs; the rollback undid 17.7% of the UTC day's 5,735
outline rows. From 11:06Z on 2026-11-18 the conductor started no new read, load or apply. **Rolled back:** Chabot's
1,013 rows (`kb/migrations/2026-11-18_s681_course_outcomes_chabot_rollback.sql`, migrate run 44292682081 applied
11:32:53Z, `deleted 1013`; receipt `kb/receipts/migration_s681_course_outcomes_chabot_rollback_44292682081.json` on
`claude/slo-chabot`; live: 0 Chabot rows, `course_outcomes` 30,321). **Reviewed and unapplied:** #3497's 99-row
named-gaps plan and #3508's 13-row A4 corrective write. **The default Sam was given at about 11:20Z on 2026-11-18:**
on no reply, the next night's run applies the two reviewed plans and reads Chabot again with the fixed reader.

**The rest of the night of 2026-11-18 stands down.** The routine fires hourly. A firing that starts before 06:12Z on
2026-11-19 ends in one line: while the stop holds, nothing in this queue is work a conductor run may start. The first
firing of 2026-11-19 follows that evening's COBIx brief; on no word from Sam or the brief, it applies the two reviewed
plans (#3497, #3508) and reads Chabot again (#3492). This is a dated stand-down, not the `Scheduled run: paused` line,
which only Sam lifts.

This firing held the stand-down for the queue and took one ask from outside it, First Light's Apply on #3153, which
COBIx posted at 13:55Z, after handoff 682 was written. Read this file, then the NEXT lines of the
`program-requirements-harvest`, `repo-size` and `commons` lanes, then `sierra-page-redesign`'s *Phase B, the marks*.

## What shipped

- **#3511** (`claude/awesome-fermat-xx99dj`, head `3270ae9d`; ready for Sam's merge, `test` green on that head): the
  77 paintings Sam dropped in the First Light tab leave the rotation (271 to 194, marks consumed through id 90), as the
  2026-11-17 Apply run built them; four First Light tests repaired to pass on an applied list;
  `kb/dependency_map.json` regenerated; `tools/first_light_verify.json` (194 checked, 0 broken). The first `test` run
  (dispatched, since the art workflow's `[skip ci]` commit was the head) failed on one guard: `first_light_picks_applied`
  ran 5 checks against a floor of 7. The drop is intended, so its floor in `tests/check_floor.json` went to 5 by hand,
  with the reason in the file's note; the second run passed.
- Held back: the 13 My CPL Story photo adds. The public pages' hero rule refuses them (lane, *Phase B*).
- The conductor's reply to COBIx on #3153 (comment 6981931214), with the 13 photos' alt words in a collapsed table;
  Sam notified by push at about 14:45Z.
- No harvest change: 0 records, 0 outline rows; `course_outcomes` 30,321.

## Open work, in order (from the lane NEXT lines)

1. **program-requirements-harvest** NEXT (2), on the first firing of 2026-11-19 after the brief: #3497 (head
   `d7a205f4`): pre-read, apply, rebuild its rollback from the returned rows, merge. #3508 (head `3d6dca1d`): findings
   1 (`paired_group` and "or" notes) and 2 (Long Beach City 44747, BIO 60L), the display readers of `together` landing
   with the write, then pre-read and apply the 13 rows. Then the 33 held-out records read free, the named gaps at the
   seven released colleges, A5's 31 wrong answers by cause.
2. NEXT (3), Chabot (#3492): a new `run=` date in `.run`; **run `tests/course_outcomes_objectives_standing_test.py` on
   the branch before pushing `.load`**; load both kinds; merge. Then Crafton Hills (index), College of the Siskiyous
   (trial).
3. NEXT (1), the next display build after the two writes land (Lassen's five reach the page).
4. NEXT (4) Lassen's structured-fields step 1; (5) Cosumnes River #3500 waits on a named-programs-only input; (6) to
   (12) unchanged.
5. **repo-size**: Part 5 waits on Sam's go; the spreadsheet export and the videos; capping timed workflows' commits;
   the session trim and the `CLAUDE.md` cut wait on COBIx; remove a finished worker's worktree.
6. **commons**: the Commons data check in `check_generated.sh`, the retired-course drops, Sam's billing paste, the
   standing test in `course-outcomes-load.yml`, all for a plain session.
7. **For a plain session** (conductor runs do no UI, tooling or governance work): **sierra-page-redesign**: #3511
   waits on Sam's merge; the photo design call (the Apply crops and resizes each story photo to a 4:3 JPEG, small
   portraits get their own hero treatment, or the tab declines a photo the pages cannot show); COBIx's Ask B (a token
   stored as a secret opens the PR; an owner creates it; the workflow also regenerates the dependency map and checks
   the photo half against the pages' rule); Ask C (a failed Apply writes its reason to
   `first_light_apply_requests.detail` and the tab shows it). Also **cer-procedures** #3482 and #3472;
   **common-cr-reference**'s CR exact match; **library**'s briefs and revise requests; governance, my-college and
   implementation-funding on their NEXT lines; #3293; #3383; the credential harvest.

## For Sam

[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current) holds one card, and Part 5's go
waits. This firing's one notice was the First Light PR #3511, his to merge.

## Decisions

No new ruling from Sam in his own words, so `docs/reference/sam_rulings.md` gets no row. COBIx relayed two things on
#3153 (comment 6980642612, 13:55Z 2026-11-18), quoting none of Sam's words: *"Sam asked for this one (Nov 18, 5:54 AM
PT)"* and *"Sam chose not to turn on the repo setting"*. Both are recorded as COBIx's relay. The second sits beside
Sam's Sheet 186 card 5 answer of 13:15Z 2026-11-13 (the chip *on*: the repository lets Actions create PRs); both
Apply runs read the setting off, the second four days after that answer. The lane keeps both. The conductor's: `d-stand-down-firing-took-first-light-ask-s682`,
`d-first-light-paintings-half-only-s682`, `d-receipt-checks-retire-after-tab-apply-s682`. Rows (8, applied by the
runner, run 44331719811, receipt `kb/receipts/migration_s682_cpl_memory_rows_44331719811.json`):
`kb/migrations/2026-11-18_s682_cpl_memory_rows.sql`, its rollback beside it.

## Patterns that worked

- Two `gh api -X GET search/issues` calls (`is:pull-request`, `is:issue`, each `updated:>=<the stop's time>`) list
  everything touched since the handoff. They found #3153 outside the brief. A stand-down firing still runs them.
- Carry the half of a built set that passes; leave the other half's marks live.

## Safety patterns to honor

All of 682's: a self-check compares the fields a rule writes against an independent source; name a college in the lane
only while a run is in flight there; batch a worker's pushes and cancel CI on carried branches; `git -C`, never `cd`;
remove a finished worker's worktree; `supabase-migrate` one at a time, every apply guarded and idempotent;
`cpl_memory` summaries at most 400 characters. New: a PR that changes `first_light.js` gets a `[skip ci]` head from
`first-light-art.yml`, so dispatch `js-tests.yml` on the branch. **Never merge #3511**: Sam merges it, auto-merge
authorization or not.

## Session settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*, Sam's change of 2026-11-11): two lanes, never on one college; about $750 a day for everything, $10k and
$30k running totals for the whole job; workers on the worker model Sam's cost rules name, high effort on any worker
that writes shared data; reviews at most 9 agents; $40 per college per run. The routine's form sets the conductor. A
session Sam starts by hand works the queue itself.

## Ledger and let go

| PR | State | Next |
|---|---|---|
| #3511 First Light paintings | ready; `test` green on `3270ae9d` | Sam merges it. No session merges it. |
| #3497 named gaps | draft; 99-row plan reviewed, not applied | pre-read, apply, rebuild rollback, merge |
| #3508 released colleges, A4 | draft; 13-row write not applied | findings 1 and 2, display readers, then apply |
| #3492 Chabot | draft; rolled back; reader fix and receipt on the branch; its `.apply` still names the rollback (a rerun aborts on the count guard) | re-read, standing test, load, merge |
| #3512 this checkpoint | open | the conductor merges it last |
| samueltlee/CPLBrain#821 the vault note | merged 15:06Z, `3d631f0` | none |
| #3500; #3293, #3482, #3472, #3383 | untouched | a named-programs-only input; a plain session |

Subscriptions: none held. Check-ins: none. No artifact watch.

Spend: $26 (estimate from token counts at list prices); curation $17; 2026-11-18T14:13Z to 2026-11-18T15:35Z.

This firing had no cost readout (`get_session` was not among its tools). Token counts from the session's transcripts
at 15:18Z, a few calls before the end: the conductor (served by the routine's configured conductor model throughout)
130 API calls, 0.19 million output, 0.43 million cache-write and 39.6 million cache-read tokens; one checkpoint-docs
agent 50 calls, 0.03 million output, 0.16 million cache-write and 6.4 million cache-read tokens. Priced the way handoff
682 priced S681's counts, that is about $23 for the conductor and $3 for the agent, about $26 in all: an estimate, and
the billing page is the record. By purpose: the First Light work (curation) about $17, the checkpoint about $9. None of
it was collection or infrastructure.

S682: cost not available (no get_session; token counts above, about $26 at list prices, an estimate); records collected 0; outline rows added 0; substantive PRs merged 0 (one opened for Sam's merge, #3511).

Opening line: *Greetings, you are SkyNuthatch (Session 683), see SkyVireo's handoff, `docs/session_683_handoff.md`,
let's keep rolling with our queue.*

## Daytime session, SkyDipper (S683 daytime), 2026-11-18

A code session Sam opened by day (started 14:45Z), after this file was written for tonight. It took this number with a
*daytime* label and adds this section instead of a new handoff; tonight's run is still **SkyNuthatch (Session 683)**
and the opening line above stands (`d-daytime-session-appends-handoff-s683`; [`scheduled_sessions`](reference/scheduled_sessions.md)).
A full checkpoint (lanes moved), written by the checkpoint-docs worker on draft PR "Rule 9 checkpoint: S683 SkyDipper
(daytime), handoff 683 daytime section".

### Open with the standing block (COBIx on #3358, 21:20Z, corrected 21:36Z; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background. Every 5 minutes it runs
   two `gh api -X GET search/issues` searches for changed threads `cobi-cto` commented on, resuming from its saved
   last-seen file; act on each new `<!-- cobix -->` comment.
1a. **Clone light** (Sam, 2026-11-19, added by a daytime side session on #3543): every session and worker clones
   `cpl-project-tracker` with `git clone --filter=blob:none` (or `--depth=1` when history is not needed), never a full
   clone. Rule's home: `docs/reference/scheduled_sessions.md`, *At the start*.
2. **Merge rules** (Sam, about 1:10 PM PT, relayed by COBIx): at most 3 open PRs (plus #3511 and dependabot's), oldest
   finished first, one update from `main` right before its merge, no dependency-map rebuild inside a PR
   (`kb/_build_dependency_map.py` is not run in a PR; CI may flag the map until #3526 lands: leave it), no full rerun
   when the input fingerprints match.
3. **Current order:** #3526, then #3528, then #3529. Nightly #3497, #3508, #3492 and #3500 stay open through tonight's
   run as a stated exception to the cap (`d-nightly-prs-exception-to-cap-s683`), then the conductor parks what is left.

### What shipped (merged to `main`)

- **#3520**: `cer-procedures.yml` rebuilds the Side by side views (`main` had gone red after CER run 44350607385); a
  failed rebuild holds the review queue back and ends red; tests pick fixtures by rule.
- **#3519**: course flags merged, inactive (3,357; 1,119 in counted scope, 1,116 leave the counts, 3 a person reviewed
  stay; Source 13's 1,067 came from double alias resolution), not applicable and retired; `kb/_flags.py`
  `hidden_card_ids` and `load_flags` with `_ids_current_through` stamps; Sam's flag-and-hide rule in `sam_rulings`.
- **#3513**: rules G and M last in `kb/_ccr_confidence_score.py`; `kb/_ccr_confidence_apply.py` with receipts and
  `--undo --rule G|M`. G 166 accepts with `--fill-members` (105 without), two mapped colleges required; M 47 moves and 5
  keeps, FPR 38 moves, all moves refused until a MUSI to MUSC re-mint; W and D stay held.
- **#3515** at Sam's go: exhibits blocker rules 1 and 2 with #3472's pair list; rule 1 re-points 95 of 121 pairs to 76
  twins, rule 2 keeps 75 of 95; Sam's pile 397 to 216 once applied; nothing applied. #3472 closed as carried.
- **#3517**: Commons and College Data Collection date estimates in plain words, links land on their tab, count units
  named, ruled cards leave in-doubt, the nightly Playwright click-through at 04:37 UTC.
- **#3514**: the reader's page checks, rules A to C on, rule D behind the `rule_d` input; self-recall 10,046 of 13,243
  own pages, 22 sister accepts; plan `kb/program_requirements_reread_plan_s683.json` (444 records, 73 colleges, about
  $21.38, largest college $3.15).
- **Open:** #3526 (dependency map on `main`, awaiting COBIx), #3528 (*Same subject* in Related titles), #3529 (flagged
  cards leave the scorer; waiting pile 6,426 to 6,419). **Parked as issues** (PR closed, branch kept): #3516 as #3522,
  #3518 as #3523 (CR exact match: inventory 29,995 = MAP only 3,334 + exact 202 + typographic or real difference
  26,459; `map_ace_catalog_cr` 104,688 rows over 25,742 exhibits), #3482 as #3524, #3293 as #3525.

### NEXT for tonight (from the lane NEXT lines)

1. **Reader rules** ([program-requirements-harvest](reference/lanes/program-requirements-harvest.md) (0a)): preview
   (`extract=0`) Mendocino and City College of San Francisco first; pay for nothing unless Mendocino's `capture.json`
   `pdf.page_checks.own_page` is 9 or more and CCSF 40432 no longer reads page 564; then the plan's colleges in order
   under $40 a college; rule D only via `rule_d` for CCSF, Santa Rosa and College of the Desert, then
   `kb/_program_discontinued.py --capture`.
2. **Rule G apply** ([commons](reference/lanes/commons.md)): `python3 kb/_ccr_confidence_apply.py --rule G --fill-members`,
   then `--apply --expect <the dry run's count> --run <tonight's label>`; commit `kb/coci_minted_courses.json` with
   `kb/ccr_confidence_out/<date>/receipt.json`. M (47) and FPR (38) wait on a re-mint (`--worklist`).
3. **Exhibits pair apply** ([cer-procedures](reference/lanes/cer-procedures.md)): rebuild the list if inputs moved,
   dry run `python3 kb/_cred_rename_apply.py --pairs kb/exhibit_blocker_rules_list.json` on the runner's MAP snapshot,
   the reviewed apply, then 71 `left_map_keep` rows INSERT-only under `exhibits-rules-s683@bot` after a fresh live read.
   Rule 2's 4 other keeps wait on `exhibit_repoint.Index.key_of` mapping every key to itself.
4. **Hand-fetched catalogs** (#3510 comment 6992238657): West Los Angeles, Trade-Technical, Pierce, Mission, East Los
   Angeles, El Camino with its Fall and Summer 2026 addenda; catalog text first; NOCE 2025-26 only as a fallback.
5. **The unblocker step** (Sam, 10:43 AM PT; `scheduled_sessions` step 12): other public routes before Sam's
   hand-fetch list, Southwestern and NOCE first; never around a WAF, never past robots.txt; the HTML read path (0c).
6. **Commons** NEXT (a) to (e): `kb/status/cr_decisions_live.json` from a read-only job; the `ccr_procedure_request`
   sync; the click-through figures after 04:37 UTC; the retired note on 11 courses; fetch plans import `hidden_card_ids()`.

**Skip tonight:** the parked PRs; #3527 (another session's Library PR).

### Decisions and safety

Sam's four rows of 2026-11-18 are in `sam_rulings` (merge rules, the watcher, *Same subject*, *"go on all fronts"*).
Memory rows drafted, not applied: `kb/migrations/2026-11-18_s683_cpl_memory_rows.sql`, its rollback beside it.
**PITFALL** `p-workflow-workers-share-main-checkout-s683`: inside a Workflow `isolation: worktree` was not honored; name
the worktree in every brief. Watches held by the conductor at this writing: the COBIx watcher's background poll; the
conductor names any PR subscription, check-in or artifact watch at sign-off and drops it then.

Spend: $161.56 (Opus 5.5 $161.56, this session's cost readout at 2026-11-19T00:55Z, workers included); curation $124.00, infrastructure $37.56; 2026-11-18T14:45Z to 2026-11-19T00:55Z.

**Carry-over for the next session (merge rules: one update from main, then merge):** #3528 (Same subject list; lints red only on the stale map, now fixed on main) and #3529 (flags into the scorer) each need one update from main, COBIx's read, then merge. #3526 merged: confirm the first Dependency map run on main is green and committed the map. COBIx's two #3526 follow-ups (NEXT): the suite shards still read the committed map (skip map readers in shards or rebuild first, with a drift check in `tests/dependency_map_on_main_test.py`), and `check_generated.sh` should print a separate line when the builder crashes (rc 2). #3531 fixed main's `commons_clarity_units` test after the 23:45Z census passed Chaffey 20677.

S683 daytime: substantive PRs merged 8 (#3520, #3519, #3513, #3515, #3517, #3514, #3531, #3526); collection none (code-only).

## Library side job, 2026-11-18 to 19 (session "Cobi library duplicate check warning")

A side session Sam opened by day (21:50Z) with Ashley Mooney, after this file was written. It follows
`d-daytime-session-appends-handoff-s683`: this section, no new handoff number; tonight's run is still **SkyNuthatch
(Session 683)** and the opening line above stands. A **light checkpoint** (only the `library` lane moved; no Roadmap
row, no re-mint, no Rule 10 data write). Skipped: 2 and 3 (no KB generator or listed surface changed), 5 (no KB note
crossed the bar; the probe lesson went to the lessons doc), 7 (the pipeline did not move), 9 (its own queue item), and
12 (the status files belong to tonight's routine; one writer per file).

**Shipped and deployed:**
- **#3527**: Library duplicate check warns with three choices (title and occasion both); Start drafts at once on the
  piece's card; Change what you asked after a no-change draft; File it hidden on a card that drafts itself; the drafter
  reads any COBI table or published file (`cobi_data.mjs`), names each college's MAP landing page
  (`reference_data.mjs`), and shows a student count under 10 as `<10`. COBIx reviewed four rounds; every probe string is
  a test (`tests/library_revise_draft.test.js` G1 to G7).
- **#3532**: a singular label's `and`/`or` no longer hides a count that follows (COBIx's last finding).
- `cpl-chat-deploy.yml` deployed `library-revise-draft` twice, runs 107 and 108, both success.

**Decisions:** Sam's "we should allow full access" is a row in `sam_rulings`; his rulings relayed by COBIx on #3527
(no staff-data block, the under-10 rule, the landing page as the button, no articulation check) are in the lane and in
`cpl_memory` `d-library-duplicate-is-a-warning` and `d-library-start-drafts-and-reads-cobi-data`.

**NEXT ([library](reference/lanes/library.md)):** Ashley's next pieces through Start; read the logged usage of a
tool-reading draft (`library-revise-draft usage`) to see what one costs. **Waiting on MAP:** Sam asked Malone and Pedro
for `?Exhibit=<MAP ID>` on the landing-page template; when it ships, `landingButton` in `reference_data.mjs` is the one
line that changes.

Let go: no PR subscription (#3527 and #3532 merged), no check-in, no artifact watch.

Spend: $23.02 (Opus 5.5 $23.02, this session's cost readout at 2026-11-19T02:43Z); infrastructure $23.02; 2026-11-18T21:50Z to 2026-11-19T02:55Z.
