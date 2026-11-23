---
title: "Session 703 handoff (from SkyRazorbill, S702, Sam's plain session of 2026-11-22: Subjects Edit, panel and counts from every surface, full width; the queue kept running beside it)"
created: 2026-11-22
updated: 2026-11-22
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_714_handoff.md
---

**Routing.** This handoff is for Sam's next plain session. A CPL Queue routine firing follows
`docs/session_699_handoff.md` and the routine's own newest handoff (S703 SkyDovekie writes 704), never this file.
**Numbering.** The routine's run took the name S703 and handoff 704 while this session ran, so the next plain
session is **Session 705** and reads this file; its own handoff is 706 unless the routine has taken that number.

# You are SkyTystie (Session 705)

From SkyRazorbill (S702), Sam's plain session of 2026-11-22, 11:03Z to about 11:45Z, on Fable 5.2. A **light
checkpoint**: one lane's text moved with its PR, and the run wrote no re-mint and no data receipt. Skipped: steps 2, 3,
4 (no retired text), 5, 7, 9, and in 12 every status file but `kb/status/subjects.json`.

## Open with the standing block (COBIx on #3358, 21:20Z 2026-11-18, corrected 21:36Z; Sam's rule for the next two or three sessions)

0. **COBIx's brief is on issue #3358**: read it, and comment 7064588752 (Sam's two rulings of 2026-11-21). Then
   read issue #3655, the Subjects brief. This session posted no comment on either.
0a. **Inside the routine's hours (06:12Z to 14:12Z), open a draft PR in your first minutes whose body declares a
   side-session scope**, in the shape `scheduled_sessions.md` step 1 gives (*Subjects side session (<moniker>):
   <files> and <tables>*), and say there that the routine proceeds. A plain session's PR with no declared scope makes
   every hourly firing stand down: that cost the night of 2026-11-21 to 22 (`p-plain-session-pr-needs-declared-scope-s702`).
1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and read its output
   yourself every few turns. It stops at the two-hour background limit; after that, poll with `COBIX_WATCH_ONCE=1`.
   Act on each new `<!-- cobix -->` comment.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1` when history is not needed),
   never a full clone, for every session and worker.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints
   match. COBIx reviews do not gate a merge (`r-cobix-review-never-gates-merge-sam-2026-11-21`).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes, and a fix goes ahead of the
   next wave only when it blocks it or would file wrong rows (`r-collection-first-sam-2026-11-20`). Collection serves
   the M-IDs, so its fixes are ranked by the M-ID cards they unblock (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3673 is merged; this checkpoint's PR merges at sign-off. The routine's #3674 is S703's.
   Dependabot's #3383 waits.

## What shipped

- **#3673 `6b009a12`** (`test` green on head `841849e0`), Sam's three asks of 2026-11-22 on `#commons/subjects`
  (`commons_subjects.js`): an Edit word on every code row; the course panel opens over the surface it was pressed on
  (front list, a college's list, the no-title list, a college's code on the held and noncredit lists) and Close
  returns there; new addresses `#commons/subjects/all/<college>/<code>` and `#commons/subjects/<list>/<college>/<code>`;
  signed out, the panel points to the sign-in control in COBI's header; every count opens the rows it counts, with
  *Show every code* as the way back; the panel lists the other colleges on file using the same code, each opening
  its own form; the surfaces take the window's width. Guard `tests/commons_subjects_every_surface.test.js` (30
  checks); a11y routes `subjects-front` and `subjects-front-panel`; `npm run a11y -- commons-subjects
  commons-subjects-dark` passed 15 routes.
- **Los Angeles Pierce, 88 titles beside 69 catalog codes, is correct:** a title can sit on a COCI-only code (28
  there), so the cell now reads *88 of 101 codes*.

## Decisions Sam made (in session)

1. **2026-11-22, about 11:03Z:** *"something went off the rails in my last session which ran about 8 hours, which is
   about 7 hours longer than expected and it derailed cpl queue from the nightly run, so lost a whole night. Just
   don't want that to happen again with this session. /coord with the queue session but don't stope it."*
   (`r-plain-session-short-and-queue-keeps-running-sam-2026-11-22`). Keep a plain session to about an hour, and never
   let it stand the queue down.

## Decisions the session made (each his to revise)

- The panel's address over the front list uses the word `all` (`d-subjects-panel-address-over-a-surface-s702`).
- A count's filter lasts while its surface is open and is never stored; moving to another surface drops it.
- One Save for a code at every college using it was left for the next slice; today the panel lists the colleges and
  each opens its own form (`d-subjects-several-colleges-one-press-each-s702`).

## What happened with the queue

No queue session was running at 11:03Z: the 10:12Z firing had stood down after two minutes because SkyMurre's #3671
named no side-session scope. This session opened draft #3673 at 11:06Z with the scope declared. Sam started the
queue's conductor by hand at about the same time (S703 SkyDovekie, declaration #3674, collection only); it left a
heads-up on #3673 with the file split: it keeps the harvest files, the plain session keeps `commons_subjects.js`,
`kb/*subject*` and `lanes/commons.md`. The 11:12Z firing found S703 conducting and stood down, which was right.

## Open work, from the lanes' NEXT lines

1. **`commons`, the Subjects page (#3655), in order:** (0) one Save that settles a code at every college using it,
   or the statewide default by the DR-25 route (`kb/reference/subject_discipline_map.json` is keyed by code alone,
   `f-subject-map-ignores-credit-band-s698`; a noncredit code's key differs by category at each college, so the
   action must build each college's key); (1) the per-course reader, a builder that gives each noncredit course its
   category's saved code through `for_noncredit_course` in `kb/subject_decisions.py`, which has no caller yet;
   (2) the 8 pages a web search found on a college's catalog read; (3) the code spellings the searches surfaced
   (LATTC LABR is LABR ST, REAL is REAL ES; El Camino E DEV is EDEV) as sibling codes; (4) the stale Common SUBJ in
   the state list's M-ID column (THEA, ECED, FLKO) taken from the identity file; (5) the common-code list with the
   noncredit MQ disciplines.
2. **`commons`, the rest:** the hand-over box's 503 on `handover-try-link`, then its seven later steps; a per-college
   credential count for the College Data Collection card; `commons_handover_summary()` carrying the term our reader
   names; the pile mint's 168 other tutoring titles, then *Propose a new M-ID*; Jev as the second stage; the three
   Collect cards from Sam's locked mock.
3. **`cer-procedures`:** the pair apply (rebuild, dry run, reviewed apply, then the 71 `left_map_keep` rows); #3524 and
   #3522; `_fold_unclassified.py` stops writing a high school as issuer. The lane is over 20,000 bytes: compact it first.
4. **`repo-size`:** dispatch `receipt-slim.yml` (`mode=apply`) outside the cron windows; the spreadsheet export and the
   videos out of the tree; the timed workflows' commits capped; `START_HERE.md` and the `CLAUDE.md` cut. Part 5 waits
   on Sam's go.
5. **`common-subjects-reference`:** ECONMT and Electricity's adult-education codes; the Commons card's second count
   synced to a committed file; the two ENVR merge candidates wait for a faculty reviewer.
6. **`library`:** deploy #3600, then part 4, then part 3.
7. **`program-requirements-harvest`** is the routine's (handoff 699, then S703's 704).

## Not answered by Sam

- **The 192 Cerritos courses whose M-ID sits under another Common SUBJ** than his decision. Aligning them is a
  re-mint under `docs/coursecontrolnumber_remint.md`; on no reply nothing is re-minted.
- The TBA figures on the College Data Collection card, and the Plan card's phases (handoff 698).
- He said he would look at the noncredit title list more closely on 2026-11-22 and may change it.

## Pitfalls from this run

- **`list_sessions` never lists a routine-fired run**, and a session Sam starts by hand as the queue's conductor may
  not show as one either: read `get_trigger` `trig_01L8K64ZKYb5eALdT4HW6NAV` and the open PRs' comments as well.
- **A `check_suite.completed` wake named the first commit's head** while `test` on the second was still running.
- **`npm install` first:** the test files fail on a fresh container with a missing-module error, which reads like a
  broken test.
- **The auto-mode check refused `delete_trigger`** on this session's own spent check-in; it fires once and is harmless.

## Memory and vault

Four `cpl_memory` rows by `SkyRazorbill (S702)`, applied 2026-11-22T11:38Z (`kb/migrations/2026-11-22_s702_cpl_memory_rows.sql`, rollback beside it): Sam's words verified, one pitfall and two decisions proposed. The vault's session note is `07-session-notes/2026-11-22-subjects-every-surface-queue-kept-running.md`, on a draft PR in samueltlee/CPLBrain that merges on its own checks. Wiki candidates, for `/wiki-ingest`: the declared-scope rule for a plain session inside the routine's hours; the Subjects panel's addresses.

## Let go

Dropped: the PR subscription on #3673 at its merge. One check-in (`S702: merge #3673 on green test`, 11:36Z) could
not be canceled and ends itself once it has fired. No artifact is watched. The COBIx watcher ran once and is stopped.

Spend: not available; 2026-11-22T11:03Z to 2026-11-22T11:45Z.

Opening line: *Greetings, you are SkyTystie (Session 705), see SkyRazorbill's handoff — `docs/session_703_handoff.md` — let's keep rolling with our queue.*
