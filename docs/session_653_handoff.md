---
title: "Session 653 handoff (from SkyAvocet, S652)"
created: 2026-11-14
updated: 2026-11-14
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyGodwit (Session 653)

From SkyAvocet, S652, the CPL Queue routine's 12:12Z firing of 2026-11-14, in conductor mode. Sam joined at about
12:57Z ("good morning") and stayed in the session. This is S652's **full checkpoint** (shared data was written: the
identities map's apply and drop; lanes changed state), written about 14:30Z 2026-11-14 (`date -u`) on
`claude/practical-meitner-7rzj3f` (#3295) over `main` at `c6e0b893`. A fact marked *as reported* was not re-read by the
worker that wrote this file.

**How S652 ran.** The firing had no `list_sessions`, `get_trigger`, `send_later` or `set_session_tags`; the open PRs
(none updated since 10:55Z) and `main` at `5278e928` were the one-writer check, and draft #3295 declared the queue at
12:18Z. Start reads at 12:17Z: no `queue_todo_done` since 2026-11-14, no CER procedure request, no exhibit
re-analysis, the Library's same four rows. Sam pressed Complete on Sheet 196 at 11:52Z (card 1 "fine"; card 4 "Go" in
both pickers; cards 2 and 3 blank). The dashboard run, the UI pass, the credential harvest and step 11's two runs for
the UTC day were S650's; the contacts harvest is Sundays.

## Closing addendum (the conductor, `date -u` read 16:32Z 2026-11-14): read this before First things

The checkpoint below was written at about 15:35Z and merged as #3295 (`0e50e935`). Sam stayed in session and four more
things landed or moved. Where this addendum and a line below disagree, the addendum is current.

- **Slice A is merged: #3300, `7e248b76`.** COBIx confirmed both his fixes on the thread. The lookup runs in every
  capture from `main` now (`ncl_lookup` default 1). Its branch is gone, so the Skyline capture dispatched on `5e1657c3`
  at about 15:21Z had nowhere to commit: **dispatch a fresh free Skyline capture from a new branch off `main`**
  (`college=Skyline College`, `step=read`, `extract=0`, `limit=0`, `ncl_lookup=1`), read `capture_preview.json` by
  script, and check each `found` by heading and award. The last filed preview (run 43607267460, the round-two code):
  49 `found` on 49 distinct pages, 37 `not_matched` (30 no page names it, 4 two pages, 2 the page went to a closed-list
  program, 1 another program's page), 05809 on `programs/accounting-as.php`. The merged code is stricter, so expect
  the same or fewer. First things 3 below is done except for that capture.
- **The Honors migrations are merged: #3304, `d1b79a7c`** (both were already applied). COBIx's review on that thread
  leaves three items, in this order: (1) **a pairwise hold, Honors id to base, before HUMA M10OI merges into M1110**:
  today's dismissal rows key on a group signature (`HUMA M10ME|HUMA M10OI|HUMA M1110`), and once M10OI merges the
  signature changes and the Honors pair is offered again; check whether the worklist takes a pairwise hold, else carry
  it in the `honors_of` field; (2) the two retitled rows still read `automerge-v1@bot`, 2026-06-12, and only the
  receipt shows S652 changed them: the `honors_of` migration restamps both under `honors-s652@bot` with a rollback keyed
  on the new stamp; (3) two member counts are in use: the members file (HUMA M1110 63 to 62, LIBR M1040 3 to 2) and the
  index (11 to 10, 4 to 3): name the measure beside each figure, and compare tonight's fold with
  `kb/honors_delete_s652_out/2026-11-14/post_apply_simulated.json` like with like. First things 6 below is done except
  for these and the Honors build.
- **Riverside City's PR #3305 stays open on purpose** (head `3d70e952`, synced with `main` at `0e50e935`): its merge
  publishes the display, so it waits on COBIx's spot-check of 32938, 42719, 43897, 44155, 44469 (asked on #3299). Sync
  it with `main` again, then merge and run `step=display`.
- **Conductor tooling, #3307** (`claude/conductor-hooks-and-agents-s652`; Sam, in session, about 15:40Z: "excellent! go
  for it as well as with your additions:)"; issue #3306): two hooks, four agent definitions in `.claude/agents/`
  (`worker`, `second-reader`, `checkpoint-docs`, `pr-gate`) and the `conductor-brief` skill. The merge-read guard
  refuses `merge_pull_request` unless this session read that PR's comments in the last 3 minutes, and always refuses
  auto-merge and a command-line merge; the clock guard refuses a written time that is ahead of the clock. Both fail
  open with a warning. A reader and COBIx each reviewed it and every finding is in. **Merged as `67e9e8af`** (the
  conductor's read of the clock: 16:47Z). One follow-up from COBIx's last note on its thread: also refuse a `gh api graphql`
  call whose words contain `mergePullRequest` or `AutoMerge`, and look inside a `bash -c` wrapper. **Sam changes the
  dated comment line on the environment's setup script at claude.ai/code** so the snapshot rebuilds and cloud sessions
  load the hooks; `python3 scripts/check_hooks_live.py` reports them. Use the agent definitions for briefs from then
  on. Later trials, one each: Serena on the reader file; a session cost report at a checkpoint.
- **Sam's last words on scouting** (in session, about 15:50Z): "Hoping Cobix can sniff out other repos that might be
  helpful as we build out the stack". The conductor's four tests for a candidate are on #3306.
- **Worktrees:** all removed at sign-off. A new session has none; brief a fresh worker per open branch (#3305, #3293,
  #3284, the five colleges' rescore branches) with the `worker` agent definition.

## First things, in order

1. **No sheet ask is open.** [Open Asks Sheet 197](https://claude.ai/artifact/2gYvXAKzrrZyqV24scFavd) is answered in full (Complete pressed 14:38Z 2026-11-14; card 1
   *"fine"*, card 2 *"delete"*, card 3 the Honors design, card 4 *"go"*); Sheet 196 is superseded. Build Sheet 198 as a
   record of decisions, each card with one real example before and after and where on the Commons to see it.
2. **Read COBIx first:** #3299, #3300, #3305 and #3111, from the last comment. Sam looped him into this session's
   conversation (about 15:15Z) and he will comment.
3. **Slice A, #3300** (`claude/ncl-catalog-lookup-s652`, head `5e1657c3`): merge `main` (with this checkpoint) in; read
   the fresh free Skyline capture on `5e1657c3` (dispatched about 15:21Z; until it files, the committed
   `skyline/capture_preview.json` is from `13fe2023`): count `catalog_lookup` by value, check 05809 is `found`, check
   each `found` by heading and award; merge on a green `test`. Then Skyline's extraction estimate.
4. **The five colleges and Riverside City's display.** Merced, Moreno Valley, Norco, San Bernardino Valley and Diablo
   Valley each have a free filed-pages reconcile (dispatched about 15:23Z, branch `claude/<college>-prefix-rescore-filed-s652`):
   the compare (`compare(load_records(main), load_records(branch))` in `kb/_program_requirements_wave.py`), then
   `step=reread` with `force=<its reconcile run id>`, the two status builders, a PR, COBIx's spot-check, the display.
   Riverside City (draft #3305): `step=display` with `display_college=Riverside City College` after COBIx's spot-check
   of 32938, 42719, 43897, 44155 and 44469 (#3299, comment 6879661422).
5. **The `cq_distinct` fix** in `kb/_program_requirements_college.py` (it drops curriQunet index entries whose title key
   repeats; Riverside City lost 191 of 435): dedupe by page id or award code, with a count of the curriQunet colleges it
   affects and a second reader before any dispatch.
6. **#3304** (`claude/honors-two-row-delete-s652`): merge `main` in (its `commons.md` sentence is already in this
   checkpoint's lane: take this branch's text in the conflict), a green `test`, merge. Then the Honors build: the
   `honors_of` field in `kb/_apply_curation.py` (a design, one reader on the rewiring), rows for the 508 pairs, mints
   numbered base plus H on the CCN pattern; HUMA M10OI into M1110 (`d-huma-m10oi-into-m1110-s652`).
7. **The `CrsId` prefix route:** 11 of slice C's 17 pairs retire.
8. **Slice B** of #3299 (Sam's go given, Sheet 197 card 4): after slice A merges and its second look has run per
   college, both bases side by side on the headline, under the four guards (#3299, comment 6877610924).
9. **Draft #3293** after slice A; Cosumnes River's seven held passes follow.
10. **Allan Hancock's trial on #3284** (`index=kb/course_outline_index/index_43566318943.json`, `slugs=allan_hancock`,
    `trial=12`) and the objectives host sac, both due 2026-11-15.
11. **Lassen's five records** (31132, 33263, 33729, 33730, 42300: a capture pinned to main's pages, then the `set` step
    with a per-record hold) and the display design's migration step 1, Lassen first.

Then Rule 8's `cpl_memory` query, the three-repo check, the highest-numbered handoff, `list_sessions` if you have it
(otherwise the open PRs and `main` since this handoff), `df -h /`, `git worktree list`.

## If you are the scheduled session (the CPL Queue routine)

**Safe unattended, in this order,** each under Rule 10 and its playbook: *First things* 1 to 11, the data writes
(rereads, displays, the Honors build) each with its compare, reader and spot-check first, and code-only items from the
lanes' NEXT lines. The display go of 2026-10-10 stands for every college; a merge that publishes waits on COBIx's
spot-check. **Decide near-equal choices and move** (Sam's pick-a-lane ruling, below); an M-ID change is the
conductor's under a receipt that undoes it. **Hold only the hold list:** the Sierra `is_test` deploy and anything on
the `CLAUDE.md` hold list. #2894 is his.

## You are the conductor

Sam's assignment (2026-11-11, verbatim): "you're the conductor. you do the thinking with your partner cobix: the plan,
the architecture, the strategy. split the job into tasks. give each one to its own Opus 5.5 worker. nudge every worker
until its task is done and nudge cobix through pr comments or otherwise until you have what you need from him. while
they work, sit idle. don't do their work for them. when a worker reports back, check it, then give out the next task.
handle anything that doesn't need me. only stop when you need a decision from me."

Read `docs/reference/conductor_mode.md` first, *What went wrong in S652, and what worked* included.

## Conductor settings

Copied from `docs/reference/conductor_mode.md`, *Settings (Sam, 2026-11-11)*; Sam's latest change was 2026-11-11:

- Conductor model: Fable 5.2 (`claude-fable-5-2`), working with COBIx (Sam, 2026-11-11, relayed by COBIx on #3110;
  `cpl_memory` `sam-conductor-model-fable-5-2-2026-11-11`). The routine's form sets the model and ultracode; medium
  effort lives in its prompt.
- Ultracode on.
- The conductor at medium effort.
- Workers on Opus 5.5 (named in each Agent call, `model: opus`).
- A worker building anything that writes shared data or changes an apply runs at **high** effort: the conductor passes
  `effort: "high"` on that worker (Sam asked for it, which is what the Agent tool requires). Other workers run at the
  default.
- A review workflow uses **at most 9 agents in all**, readers and second readers together. Drop the second reader on
  minor findings first.
- **Cost limits** (relayed by COBIx on #3111, comment 6808460886; confirmed by the S639 relay ruling): $40 per
  college per run, on the estimate, for program-requirements extraction, and a separate $40 per college for SLOs, PLOs
  and course objectives. The limit is per run and never a remaining pot. Paid runs go through the conductor.

Every brief that adds a test file says: its floor goes in `tests/check_floor.json`, run the tests touching your files
plus `check_ledger`, `pages_size_guard` and the tab and nav inventory tests, and let CI run the rest. A brief that adds
a migration says: it applies on the push of the `.apply` change, before any merge.

## Ledger (PR, branch, state) at writing

| PR or branch | State | Next |
|---|---|---|
| #3295 `claude/practical-meitner-7rzj3f` | open: the declaration and this checkpoint | merge on green |
| #3300 `claude/ncl-catalog-lookup-s652` | draft, head `5e1657c3`; fresh Skyline capture dispatched about 15:21Z | First things 3 |
| #3305 `claude/riverside-city-prefix-rescore-filed-s652` | draft, head `f8ddc754`; reread run 43608708424 landed | First things 4 |
| `claude/merced-prefix-rescore-filed-s652`, `claude/moreno-valley-prefix-rescore-filed-s652`, `claude/norco-prefix-rescore-filed-s652`, `claude/san-bernardino-valley-prefix-rescore-filed-s652`, `claude/diablo-valley-prefix-rescore-filed-s652` | no PR; filed-pages reconciles dispatched about 15:23Z off `main` `936c75d8` | First things 4 |
| `claude/riverside-city-prefix-rescore-s652` | `e9a6304f`, the short fresh capture; leave it for GitHub to delete; never reread from it | none |
| #3304 `claude/honors-two-row-delete-s652` | open; the delete and its follow-up migration applied | First things 6 |
| #3301, #3303, #3302, #3298, #3296, #3297 | merged (slice C `c6e0b893`; design review `3b2d9b38`; the drop `bd549c5f`; the apply `feeeeef2`; the design `19ed0958`; the census `e713ee10`) | none |
| #3293 `claude/passing-dry-run-s651` | draft, head `cb60a1b0` | First things 9 |
| #3284 (Allan Hancock) | draft | First things 10 (due 2026-11-15) |
| #2894 `claude/cobix-inbox` | Sam's | untouched |
| samueltlee/CPLBrain#788, #789 | merged (`ccfde40d`, `59251222`) | none |

Worktrees still on disk: `.claude/worktrees/agent-a308250014c9995ad` (#3300), `.claude/worktrees/agent-aef967aa254e37687`
(Riverside City) and `.claude/worktrees/agent-a871597cc45dacfc5` (#3304). Workers do not survive the session: brief a
fresh worker per branch from its diff and this ledger, and remove a worktree whose branch is pushed and whose worker is gone.

## What shipped (S652)

- **The identities map** (#3298, #3302): 651 fills and 578 refreshes (2,290 to 2,941 entries), then the 625 held
  entries dropped (2,941 to 2,316). The daily run 43600934967 (`b806c7ff`) rebuilt the lists; the conductor's read of
  `fact_sheet_metrics.json` at 14:21Z: `statewide_exhibits.could_adopt_total` 115 (was 114).
- **Slice C of #3299** (#3301): 17 per-college prefix aliases at 13 colleges, from committed evidence; no table written.
- **The display's structured-fields design** (#3296, COBIx's review folded in by #3303).
- **COBIx's electives-fill census** (#3297; on #3111, comment 6877317551): 31 outside candidates at most, about 2 real.
- **Draft #3300**, slice A: the no-closed-list lookup, self-tested at 85.3% recall with no false match.
- **Riverside City rescored from its filed pages** (#3305): 222 to 230 of 244 passing (the conductor's reads at 15:10Z
  and 15:15Z).
- **The Honors rows apart** (#3304): the two bot rows deleted and the pairs held apart by dismissal rows.
- Headline (the conductor's reads at 14:22Z): 14,597 of 20,282 active programs pass, at 118 colleges; Riverside City's
  8 newly passing landed after that read.

## Live data written, each with its undo

- `kb/coci_articulations.json` (committed, shared by the daily run and the public adoption page): the apply, receipt
  `kb/identities_rebuild_out/2026-11-14b/apply_receipt.json`; the drop, receipt
  `kb/identities_rebuild_out/2026-11-14-drop/apply_receipt.json` (each dropped entry whole). Undo in order, each by
  `python3 kb/_identities_rebuild.py --undo <receipt>`: the drop's receipt first, then the 14b receipt; then a daily
  run.
- `kb_curation` (#3304): run 43607926526 (15:01Z to 15:07Z) deleted the `automerge-v1@bot` rows folding HUMA M10ME into
  HUMA M1110 and LIBR M10CJ into LIBR M1040 (live count 0 at 15:07Z; 40,711 to 40,709 rows); receipt
  `kb/receipts/migration_s652_honors_two_row_delete_43607926526.json` (both rows whole); undo
  `kb/migrations/2026-11-14_s652_honors_two_row_delete_rollback.sql`. The follow-up migration (pushed 15:15Z; read
  15:21Z) holds the titles and writes two dismissal rows under `honors-s652@bot`; its rollback file sits beside it.
- `program_requirement_records`, Riverside City: reread run 43608708424 (244 posted, 240 replaced, 4 held: 22804, 31456,
  39033, 40061); receipt `kb/receipts/program_requirement_records_college_reread_riverside_city_43608708424.json`
  (before-values, guarded rollback). The display has not run.
- `cpl_memory`: 18 rows run by the conductor (STATEMENTS 1 to 3 and 5 to 7 of `kb/receipts/cpl_memory_s652_rows_2026-11-14.sql`;
  STATEMENT 4 withdrawn), plus STATEMENT 8's two rows, not yet run; undo by slug.
- No model spend; no paid run.

## Decisions to honor

**Sam, in session, about 14:49Z 2026-11-14, on the conductor's first use of pick-a-lane (it had sent the MATH M1044
question to San Diego City College), verbatim:** *"why are we asking anyone anything about a MID course, which is our
own construct (synthetic). what makes this MID so important that we would bother someone at SDCCD about it--they have no
idea that MIDs even exist"*. The decision was reversed at once (`d-math-m1044-stays-no-one-asked-s652`). The rule it
leaves: an M-ID question never goes to a college; what a college can answer is its own articulation in MAP, and that is
a clean-up worklist item worked in the ordinary way.

**Sam, in session, about 14:51Z 2026-11-14, verbatim:** *"we will be adjusting and deleting and refolding and reminting
MIDs for quite a while as we figure out the best way to do it almost through trial and error"*
and, a minute later: *"think of MIDs as low stakes attempts to get our course clusters as close to right as we can with the expectation that we will do lots of adjusting along the way"*
(`sam-mids-are-ours-trial-and-error-2026-11-14`). And at about 14:53Z: *"the thing that probably makes them not low stakes to you is all the ways mids are wired to dependencies that have to be rewired when changes are made. that probs takes a lot of compute (which is not low stakes on the compute side) but still low stakes on the end user side provided that all the rewiring along the way is done correctly"*
(`sam-mid-care-goes-into-the-rewiring-2026-11-14`). The conductor's reading, for Sam to correct: the choice is low stakes and the care goes into the rewiring, so a reader on an M-ID change checks its dependents (the alias chain, the identities map, the dependency map's consumers), not the choice; a change to the M-ID
staging layer (a merge, a split, a re-mint under the playbook, removing a row a bot saved) is the conductor's to decide
and carry out under a receipt that undoes it, with no card first; a row a person saved still wins (Rule 10); the
result shows on the Commons, and that is where he reacts.

**Sam, in session, about 14:57Z 2026-11-14,** after asking *"are the honors CCNs distinct records ENGL C1000 and ENGL
C1000N?"* and *"ENGL C1000H"*: *"CCN structures should be our gold standard"* (`sam-ccn-structures-gold-standard-2026-11-14`).
A reader measured: ENGL C1000 (115 members, 114 colleges) and ENGL C1000H (35 members, 35 colleges) are separate
records; of 57 CCN rows, 24 are H records beside their base, and no CCN base holds an Honors course; 3 E records (MATH
C2210E, MATH C2211E, STAT C1000E). Under C-ID, 144 of 484 bases hold Honors local courses and C-ID has no H ids; those
stay as the official body numbers them (Sheet 195). At about 15:15Z: *"i looped cobix in our conversation this session
and he'll have some comments for you based on it. this was a really helpful session!"*

**Sam's, in session S652 (about 14:45Z 2026-11-14; `sam-conductor-picks-a-lane-2026-11-14`), on Sheet 197's asks:**
*"on 197 asks, my honest read is that I don't really understand the asks the way they are written--language is obtuse.
would be more effective to show examples of each ask. I just tried to go with your recommendation since any choice seems
fairly inconsequential and it would be better for you to make a choice and record it and move on. action is better than
stopping and asking about choices that seem like 6 of 1 or half a dozen of another--in other words, stop being so
cautious and pick a lane and go with it. I will see the results on the commons and if there is a problem, I can address
it based on the reality I'm seeing rather than vague choices. I learn by doing and then seeing the results. it's much
easier for me to react to a decision you've made than to engage my mind in the weeds of the logic choices you are
contemplating and trying to express to me as succinctly as you can--not your fault! these are fuzzy procedures we're
dealing with and I want you to lean into making the least fuzzy choice among fuzzy choices. Conductor can conduct!"*
The rule: a choice among near-equal options is the conductor's to make, carry out and record, never an ask; the
`CLAUDE.md` hold list stands; an ask that remains shows a worked example on real rows (today, and under each choice);
a decision card shows one real before and after and where on the Commons to see it (`conductor_mode.md`, *Recording
and Sam*). Applied at once: `d-math-m1044-stays-no-one-asked-s652`: it stays apart from M1036 and no one is asked, on Sam's word that an M-ID is our own construct.

**Sam's, on Open Asks Sheet 197 (his own calls, 14:35Z to 14:38Z 2026-11-14; `sam-sheet-197-answers-2026-11-14`):**
card 1 *"fine"*; card 2 *"delete"*; card 3 *"Base number plus H (MATH M1036H)"*, *"Two-way: either satisfies the other"*,
*"Build the field first, then the rows"*, *"Rows for all 508 pairs"*, *"I name who in the note"* (note empty); card 4
*"go"* (*Go, with the four guards*).

**Sam's, in session (2026-11-14):** *"1. apply 2 drop"* (about 13:07Z) and *"drop"* (about 13:19Z), on Sheet 196
card 4 (`sam-identities-apply-and-drop-2026-11-14`). His other words: *"see cobix notes on adjusting our college data
collection (cdc) catalog, program, courses procedure and advise...good morning!"* (about 12:57Z) and *"196 said pick
but there was not indication I could find of what I was supposed to pick--no options to choose from"* (about 13:03Z).

**Sam's, relayed by COBIx on #3299** (his go "Nov 14, 2026, about 4:55 AM PT";
`sam-catalog-first-collection-2026-11-14`): work the catalog-first collection; *"nothing stops the collection bus from
rolling."* Start from the published catalog; compare back to COCI; one second look in the catalog by title and award;
if still not found, flag "on COCI, not listed in the catalog" and move on, never in Still to pass.

**The conductor's,** each a `cpl_memory` row (proposed) and a DECIDED line in its lane, for Sam to revise on the
sheet's card 1: `d-catalog-first-slice-order-s652`, `d-ncl-lookup-not-listed-needs-catalog-list-s652`,
`d-prefix-alias-evidence-rule-s652`, `d-lassen-stale-note-known-defect-s652` (program-requirements-harvest);
`d-sheet-pickers-are-buttons-s652` (the vault's sheet builder); `d-huma-m10oi-into-m1110-s652` (commons; not done). Facts `electives-fill-outside-section-census-s652`,
`identities-map-applied-and-dropped-s652`.

## Pitfalls learned

- `p-merged-before-reading-pr-comment-s652`: #3296 merged twelve minutes after COBIx's review without reading it.
  Read a PR's own comments in the same batch as its check runs.
- `p-worker-delete-refused-surface-to-sam-s652`: a permission refusal goes to Sam, never around the check.
- `p-new-matcher-needs-self-recall-test-s652`: the first title rule found 63% of pages already held
  ([note](kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)).
- `p-mis-codes-carry-record-id-suffix-s652`: ENGL304-2507 reads as ENGL 304.
- A lane compaction dropped `objectives_reread_plan`, a link a test reads, and the lints job failed: after compacting
  a lane, run the Python tests that read lanes. A config change proved on a fresh capture measured the reader
  (`cq_distinct`): prove it on the filed pages.
- Times from memory were wrong five times, by 2 to 10 minutes; take every time from `date -u` in the same command. Run scripts in the shared scratchpad with `python3 -I` from a
  subfolder (a stray `inspect.py` shadowed the standard library).

## COBIx threads

Sam looped COBIx into this session's conversation; read his comments first. On #3300 he reviewed slice A (6879508862,
answered by the worker). On #3299: the Riverside City spot-check ask (6879661422). On #3111: plan v2, the August drop, the dry run (6875299481) and the census (6877317551) await him. On #3299: the
conductor's guards (6877610924) and 6878460974. #3110 (6877162522) is moot: Sam answered in session. His v2 on #3237
is still awaited. On #3291 the conductor answered his question (6877180917). Read him from the last comment (`perPage`
1 from the last page); never `get` #3111 or #3110.

## The Library (step 6 of the routine)

The same four rows, each waiting on a person, nothing built: `...-mwdvs6l1` Draft 2 `b18c5759` waits on Ally Barker's
*Publish it*; `...-mwdv9pl5` is its superseded duplicate; `adding-cpl-coordinator-noncredit-lead-to-map-mwauxci5` has
ready draft `7a26c199` (pictures 4, 5 and 14 show names or emails to cover); `iaca-mvpmcjyl` waits on Crystal Nasio's
file.

## Open work, in order (from the lanes' NEXT lines)

1. **`program-requirements-harvest`:** First things 3 to 5 and 7 to 11; then Los Medanos, Monterey Peninsula and Los Angeles Valley
   (a person); the standing list (Cerro Coso 40922 and Grossmont 46141 held; Chaffey's objectives-only read; the RCCD
   district profile; COBIx's three Glendale follow-ups; Desert 10195's stored hold; the reading-procedure check; the PDF
   headings; the free GE page reads; the district phase 0 builder; the wave sample, De Anza, Redwoods); objectives
   laspositas, Coastline, Golden West after sac.
2. **`commons`:** the Honors build as Sam ruled it (First things 6: the `honors_of` field, the 508 pairs' rows, base-plus-H mints; HUMA M10OI into M1110; LIBR M10CJ's stale entry in `kb/coci_minted_courses.json`; MATH M1044 stays apart and no one is asked; exhibit MAPCBES-CBES-1-001's likely mis-filed articulation goes on the clean-up worklist); FIRE 130 X's row-audit card; price the model pass; a
   potential-CPL column; the Leadership outlines; the #3298 and #3302 follow-ups (`title_differs_in_substance` and the 16
   `_superseded_rekeyed_from` entries; the header's 2,319; a merge member with no articulation record gets no entry;
   the drop report's rows section; `standards_2_ruled_renames_test.py` and `ccc_metric_test.py` failing on `main` with
   no workflow running them); the data dashboard's MIS course matches and COE regional demand (each waits on a
   definition); Copper Mountain's registry `catalog_url`; the strategic plan file.
3. **`sierra-retrieval-corpus`:** an `is_test` column set by the edge function (a deploy).
4. **`map-custom-reports`:** the MAP team or Pierce says what the August 6 and 7 drop was.
5. **`cer-procedures`:** the Exhibits rename batch with the ASE Certificate Bundles title; `series_aliases` into
   `kb/credential_aliases.py` (both write shared data: a reviewed plan first).
6. **`library`:** the Veteran map's minor follow-ups; the Fact Sheet's header; the four rows above.
7. **`governance-team-enablement`** and **`workplan-annual-goals`**: the first daily log carrying `Daily push
   conflicted`; the pushing workflows' groups; key-reading workflows into environments; workplan NEXT 0a and 0c.
8. **Vault:** about ten older session-note PRs sit open as drafts on samueltlee/CPLBrain (#743 to #765); a session with
   a person decides whether to merge or close them.

## A full checkpoint: what it touched and what it skipped

Touched: the docs audit (and `--apply`); this handoff; the lanes `program-requirements-harvest` and `commons` (each
under 20,000 bytes; retired text moved verbatim to the lessons docs, *Moved from the lane (S652 checkpoint)*); the
harvest lessons' S652 section and a compaction into archive 5; the Commons lessons' S652 section and a compaction into
its archive; a KB note, `methodology-a-new-matcher-is-gated-by-a-self-recall-test`; `conductor_mode.md`'s S652 lessons;
`CLAUDE.md`'s standing-sheet line (no §11 row: no lane changed state); the index rebuild; the run logs
`kb/status/program-requirements.json` and `kb/status/course.json`; the memory receipt. The vault note and Sheet 197
are the vault worker's. **Skipped, with reason:** the pipeline view (the identities map feeds the adoption lists, not
the M-ID stage list; no auditor count or re-mint moved); `kb/README.md` and `README.md` (no KB structure, generator or
user-facing surface changed beyond lane detail). The final refresh added the Honors delete, Riverside City's
reread, slice A's narrowed rules and the lints fix. Wiki candidates (`/wiki-ingest`): the identities map applied and its
625 held entries dropped (2,316 entries); catalog-first collection is Sam's rule; CCN structures are the gold standard
for M-ID Honors records; the conductor picks a lane among near-equal choices.

## Let go

The conductor holds no PR subscription and no sheet watch it started; its background timers end with the session.
The next session watches #3300, #3304, #3305 and the five rescore branches.

Greetings, you are SkyGodwit (Session 653), see SkyAvocet's handoff — `docs/session_653_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_653_handoff.md) — let's keep rolling with our queue.
