---
title: "Session 686 handoff (from SkyTowhee, S685)"
created: 2026-11-19
updated: 2026-11-19
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyBushtit (Session 686)

From SkyTowhee, S685, the CPL Queue routine's 12:12Z firing of 2026-11-19 (started 12:13Z): a conductor run for
collection only under Sam's routine prompt of 2026-11-17, following the COBIx brief on #3358 as updated
2026-11-19T02:34Z. A **full checkpoint** (lanes moved, Rule 10 writes ran), written by the checkpoint-docs worker at
about 14:47Z while reads and posts were still running. Skipped: steps 2 and 3 (no KB generator or user-facing surface
changed), 7 (no M-ID pipeline move) and 9 (the UI pass is its own queue item).

**The start.** The firing stood down at 12:17Z while SkyVerdin (S684) was working (its declaration #3545 had a 12:13Z
commit), was told to keep going at 12:18Z by a message in the session, wrote nothing until S684's sign-off push at
12:47Z, and declared with draft #3551 at 12:52Z. That is `q-wait-for-a-routine-firings-checkpoint-s681` met in
practice, recorded as the conductor's decision (`d-firing-waits-for-sign-off-then-takes-queue-s685`), not a ruling of
Sam's.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. It missed three tonight (`p-cobix-watch-missed-three-s685`): read a PR's whole thread
   before you merge it, and before you apply any file it carries (`p-apply-before-thread-read-s685`).
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), oldest finished first, one update from `main` right
   before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
3. **Merge order:** #3557 (award ending), #3558 (second-pass naming), then the S685 wave (its receipts and live-read
   files, the second ten's reread branches, the second pass), then #3551 (this checkpoint), then #3529.

## Your first steps, in order (the conductor confirms these at sign-off)

1. **Apply the memory rows:** point `kb/migrations/.apply` at `kb/migrations/2026-11-19_s685_cpl_memory_rows.sql`
   (17 rows, rollback beside it), unless the conductor applied them before sign-off. Read #3551's thread first.
2. **Land the night's wave** in the merge order above, each on a green `test` after its thread is read.
3. **Rule D** through `rule_d` at City College of San Francisco, Santa Rosa Junior and College of the Desert, then
   `kb/_program_discontinued.py --capture` (`d-rule-d-next-session-s685`; a rule D read is a second pass, and #3558
   names its runs).
4. **The reread plan's third ten**, once the second ten's loads have filed: Sierra, Barstow, Pasadena City, Rio Hondo,
   Los Angeles Harbor, College of San Mateo, College of the Sequoias, Fresno City, Contra Costa and Madera. The stop is
   $40 per college per run; the plan's ceilings price only the aim rows (`d-reads-stop-is-forty-dollars-s685`).
5. **The display build after the night's posts**, then `harvest-gap-census.yml` on `main` against 5,203.

Read this file, then the NEXT of `program-requirements-harvest`, then `docs/reference/conductor_mode.md`,
*What went wrong in S685*, then `docs/program_requirements_harvest_lessons.md`, *S685*.

## What shipped

- **S684's work, landed:** #3550 (S684's wave, 0529ca75) and #3545 (S684's checkpoint, dd4a2d8d). S684's 22 memory rows
  applied (run 44528020042) before #3545's thread was read; COBIx had asked twice for a staff contact detail to come out
  of one row first. It was live about three minutes; a guarded update removed it (run 44528997886) and the file was
  fixed on #3545 before it merged.
- **#3552** (7b65b464): the outline helper read only the newest census file, a regression from #3538 in the S683 wave
  that emptied the queue; each college now takes its row from the newest census that holds one.
- **#3553** (95f85b1e), keep-the-better: a generic heading passes only on the program's own page; a second pass keeps a
  posted record; two review rounds; 43 verified flips (`d-keep-better-ship-verified-43-s685`).
- **#3556** (648ee2cb): display build `3e8088e082eb` (18,323 statements, 830 changed). One college first (run
  44531512075), the live count gate (44534279276), the whole build (44535255196: every write sent, its confirming read
  answered HTTP 500), confirmed by the closing live count of migrate run 44536820147
  (`d-display-confirmed-by-live-count-s685`). COBIx's three points on #3556 are answered there: the record stays
  `unconfirmed` and cites the count; the confirming read is unpaged; the page file carries only the build stamps.
- **The census** (run 44531283594): 5,203 left against 5,395 on 2026-11-18.
- **Reads:** Southwestern (run 44529722751, $2.56, 6 new of 24); Woodland $1.42; MiraCosta $0.30; Copper Mountain's
  catalog address answers 404. The other seven of the second ten and the second pass of the 43 were in flight.
- **Outlines: no load.** Feather River, Palomar and San Diego College of Continuing Education each got a `queue.json`
  row; City College of San Francisco's index did not run (three code or census changes, written to COBIx on #3533).

## Open work by lane (from the NEXT lines)

1. **program-requirements-harvest:** the first steps above; then keep-the-better's follow-ups, the display's paged
   confirm, Copper Mountain, cheap piles, the outline readers, Lassen and (9) to (17) as the lane lists them.
2. **repo-size:** Part 5 waits on Sam's go; the spreadsheet export and the videos; the slimming items stay with a plain
   session (`d-slimming-to-plain-session-s683`).
3. **cer-procedures** (the pair apply) and **library** (Ashley's pieces through Start, the logged usage): a plain
   session's; conductor runs stay on collection.

## For a plain session

- The reader fixes for Feather River's and Palomar's headers (`f-outline-readers-need-header-fixes-s685`); the index
  search at `sdccd.curriqunet.com` and Rio Hondo (`search_all` presses Search when no NewSearch request arrives).
- City College of San Francisco's three changes: `route_of` to accept `curricunet.com`, a census row naming that host,
  and a route to the IDs past the bot-checked search (COBIx asked on #3533).
- Page the display's confirming read (`f-display-confirm-read-unpaged-s685`, COBIx on #3556).
- `needs_load` naming in keep-the-better, run ids compared by order, the live read's time printed (COBIx on #3558).
- The no-ending shared-page rule: a no-ending address counts as the program's own only when no other program at the
  college with the same bare title has another award kind; replay the 292 (COBIx on #3557).
- Teach `slug_awards` the endings #3557 lists (`-certificate` 567, `-ca` 204, `-cert` 84, `-for-transfer` 76).
- Copper Mountain's catalog address answers 404.
- The CPL Commons page is another session's (draft #3554); this run wrote none of its files. Its open data questions
  for the queue: a status file still lists 6 catalog-blocked colleges; the readable-course count (no SLO finish date
  without it); the COCI-only recount (713).

## For Sam

1. The routine's form was unchanged tonight, so the conductor model was again the one handoff 685 names under *For
   Sam* 1 (a fourth firing on it). The comparison night still needs the form changed, which is yours.
2. [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current) is unchanged: one card.

## Decisions

No new ruling from Sam in his own words reached this run, so `sam_rulings.md` has no new row. The conductor's, all
reversible: `d-firing-waits-for-sign-off-then-takes-queue-s685`, `d-slo-helper-census-fix-in-conductor-run-s685`,
`d-keep-better-ship-verified-43-s685`, `d-rule-d-next-session-s685`, `d-display-confirmed-by-live-count-s685`,
`d-reads-stop-is-forty-dollars-s685`, `d-live-reads-through-migrate-runner-s685`.

## Patterns that worked

- A display build in four steps: one college, a live count gate, the whole build, a closing live count.
- A dry run that stops itself: the second pass found the naming fault before posting anything.
- Live reads through the migrate runner when the SQL prompt has no one to answer it.

## Safety patterns to honor

All of 684's. New: `p-apply-before-thread-read-s685`, `p-second-pass-run-never-named-s685`,
`p-helper-reads-only-newest-file-s685`, `p-cobix-watch-missed-three-s685`. Never write a person's contact detail into
a memory row, a lane or a handoff.

## Conductor settings

A conductor run for collection only, under Sam's routine prompt of 2026-11-17 (`docs/reference/conductor_mode.md`,
*Settings*, Sam's change of 2026-11-11): two lanes, never on one college; about $750 a day for everything, $10k and
$30k running totals for the whole job; workers on the worker model Sam's cost rules name, high effort on any worker
that writes shared data; reviews at most 9 agents; $40 per college per run. The routine's form sets the conductor. A
session Sam starts by hand works the queue itself.

## The college split (written before any worker started)

Two lanes, never on one college, one writer per college; a college moves between lanes only when its lane has nothing
in flight there (`d-lane-names-only-colleges-in-flight-s681`).

**Lane 1, the cheap piles.** The work that belongs to no college: the display build, once, and the gap census. Rule D
at City College of San Francisco, Santa Rosa Junior and College of the Desert, and the discontinued capture, waited
for the second-pass fix and did not run. **Moved at 13:03Z:** City College of San Francisco's outline index went to
lane 2, which released it with nothing run.

**Lane 2, collection.** Keep-the-better's two open items, then the second pass of the restored re-reads; Southwestern's
paid read; the reread plan's second ten (Copper Mountain, Woodland, MiraCosta, American River, Yuba, Cerritos,
Grossmont, Imperial Valley, Modesto Junior, Skyline); the outline indexes at Feather River, Palomar and San Diego
College of Continuing Education.

**Not tonight:** Long Beach City; North Orange Continuing Education; the outline readers that need a code change; the
CPL Commons page build (another session's, #3554).

## Ledger and let go

| PR or branch | State | Next |
|---|---|---|
| #3557 award ending, #3558 second-pass naming | open, waiting on `test` | merge on green after the thread read |
| the S685 wave (receipts, live-read files, reread branches, `claude/second-pass-s685`) | assembling at this writing | read its thread; merge on green `test` |
| #3551 this checkpoint | draft | update from `main`, merge after the wave |
| #3550, #3545, #3552, #3553, #3556 | merged (0529ca75, dd4a2d8d, 7b65b464, 95f85b1e, 648ee2cb) | none |
| `claude/slo-feather_river` (98a47f9a), `claude/slo-palomar` (78edbf37), `claude/slo-san_diego_of_continuing_education` (4044d401) | index files and queue rows, no load | ride the wave; reader fixes are a plain session's |
| #3554 Commons page | another session's draft | none from this queue |
| #3529, #3537, #3500 | open | as handoff 685 says |
| #3511 | ready | Sam merges it |

Subscriptions: none named in the ledger. Check-ins: none. Artifact watches: none. The COBIx watcher (a 25-minute
monitor) ends with the session. The conductor confirms this at sign-off.

## Final figures

Spend: not available; 2026-11-19T12:13Z to <end>.

The conductor fills this block at sign-off: the end time and the estimate, the records collected, the outline rows,
the substantive PRs merged (#3552, #3553 and #3556 at this writing) and the running tally since Nov 17 (about $749
before S685). Reads and posts were in progress when this was written.

Opening line: *Greetings, you are SkyBushtit (Session 686), see SkyTowhee's handoff, `docs/session_686_handoff.md`,
let's keep rolling with our queue.*
