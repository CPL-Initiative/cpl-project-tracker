---
title: "Session 693 handoff (from SkyGannet, the plain session of 2026-11-20 that built the hand-over)"
created: 2026-11-20
updated: 2026-11-20
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_695_handoff.md
---

**Routing.** A CPL Queue routine firing follows `docs/session_691_handoff.md` (S690, the conductor's), never this
file. This handoff is for Sam's next plain session on the Commons build.

# You are SkyKittiwake (Session 693)

From SkyGannet (Session 692), Sam's plain session of 2026-11-20, about 17:25Z to 18:55Z. A **full checkpoint** (a lane
moved; the run applied a migration). Skipped: steps 2 and 3 (no KB structure change; the README lists no Commons
view), 7 (no M-ID pipeline move) and 9 (the UI pass is its own queue item). `kb/status/program-requirements.json` was
left alone, since it is the routine's run log; `kb/status/course.json` was refreshed. **You run on Fable 5.2 as a
single plain session, no conductor and no workers** (Sam, 2026-11-20: *"i'll stick with fable and up the limit"*),
unless he says otherwise.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply what it carries (a merge is refused
   unless its comments were read in the last 3 minutes, so read and merge in one step).
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes
   (`r-collection-first-sam-2026-11-20`); collection serves the M-IDs, its fixes ranked by the M-ID cards they unblock
   (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** this checkpoint's PR is this session's, merged at sign-off if `test` is green. S690's follow-up
   #3602 is the conductor's. Dependabot's #3383 waits as before.

## What shipped

- **#3608 (`5507826e`): hand it over in place, slice 1.** `commons_handover.js`: one box for every Commons dataset (a
  drop box, Try the link, pasted data, an API procedure box). Each still-taught course in Needs you opens a panel at
  `#commons/course/<control number>`; each college opens College Data Collection's panel on the `handover` pane;
  *Term Reports Needed* carries the box.
- **The schema, applied** (runs 44789876384 and 44790191281; `kb/migrations/2026-11-20_commons_handover.sql`): private
  bucket `commons-handover`, table `commons_handover`, `commons_handover_add` / `_mark` / `_summary`. Governance DR-35.
- **The reader's pickup:** `kb/_handover_pickup.py`, `commons-handover-pickup.yml` (05:41 UTC and on Try the link).
- **Deployed from main:** `handover-try-link` (run 44795806048); and the two deploys handoff 691 left for a plain
  session, `cpl-chat` (run 44796311198) and `library-revise-draft` (run 44796342309), S690's #3600, dispatched at 18:49Z and
  still running at this checkpoint. Confirm both ended green before you count them done.
- **Memory:** six rows applied (`kb/migrations/2026-11-20_s692_handover_memory_rows.sql`); four more with this
  checkpoint (`kb/migrations/2026-11-20_s692_checkpoint_memory_rows.sql`).

Read in order: this file; [`reference-commons-hand-over`](kb-notes/reference-commons-hand-over.md); the NEXT of
[`commons`](reference/lanes/commons.md); `docs/commons_lessons.md`, *S692*; the mock's README in the vault
(`CPLBrain/04-projects/cpl-initiative/commons-order-mock/`); `docs/reference/pipeline_reference.md` section 8 before
any table work.

## Priority work, in order

1. **Sam's first real drop.** Read what waits (the query is in the reference note; leave `handed_by` and `file_name`
   out). No test here could show Supabase Storage taking a reviewer's upload on an INSERT policy alone, so the first
   drop is the check: if the upload is refused, the bucket needs a second look before anything else. Then file the
   hand-over into its course by hand, and say on the row that it is filed (`commons_handover_mark`, on a runner).
2. **The three Collect cards** (catalog programs, course outlines, credentials) and the curation ladder with owners,
   from Sam's locked mock; step b is the Courses bot's (`d-step-b-owner-courses-bot-2026-11-20`).
3. **The hand-over's next steps, once a real row exists to build against:** pasted data into a read file the loader
   keeps (a person's entry wins); a dropped outline's parsed outcomes loaded with the title check; a link that reads
   saved as the registry's `cor_url` with a before-values receipt (agree the one writer with the collection run
   first). Each changes shared reader code or a shared table: a second read before any dispatch.
4. **A committed M-ID census builder on one base**, from the vault's `mid_census_one_base.py`; settle the one
   definition (15,720 counted against the Commons' 15,911). Fix the published local course lists first.
5. **The no-longer-offered flag** (`r-no-longer-offered-sam-2026-11-20`) once the three term files and the catalog
   check exist. *Term Reports Needed* now takes a dropped term file. Never call it inactive.

Also open in the lanes: the commons lane's #3570 gaps and open data questions, the Rule G dry run then apply with its
own `--expect`, and the Common Subjects lane's (`common-subjects-reference`) ECONMT and Electricity codes. By slug: `program-requirements-harvest` is the
conductor's (handoff 691); `library` (the failing check row first, then parts 4 and 3) and `common-cr-reference` (the
exact match from issue #3523) are plain-session work after the Commons slices, unless Sam names them first.

## Decisions Sam made

None new this session: he opened it with the greeting and did not write again. Everything built rests on his words of
2026-11-20 on the locked mock (*"yes, build it!"*; `r-hand-over-in-place-sam-2026-11-20`).

## Decisions the session made (each his to revise; `d-handover-*-2026-11-20`)

- A hand-over takes a reviewer's own sign-in, never the team phrase.
- Try the link starts the runner's reader; the function fetches no address itself.
- Slice 1 is the front door; filing into the datasets follows as guarded steps.
- A college's name goes to College Data Collection's panel; opening it over the front page is a later step.

## Patterns that worked

The database proved against a throwaway Postgres before any push; the pickup's judgments written as pure functions
with a fake reader; after a `lints` failure, the later steps run locally as real scripts so the next push is the last.

## Safety patterns to honor

- Never add a read policy to the `commons-handover` bucket or widen the table's read to the team phrase. A course
  outline can name faculty: the file, its name and its text stay out of the repository, the log and the row.
- A new script a page loads needs a `publish` line in `.github/pages_allowlist.txt`; a workflow installs its browser
  through `scripts/install_browser.sh`.
- The migrate runner's receipt commit moves the head and starts no CI: push a commit of your own after the last
  receipt, then gate on `test` at that head.
- A browser script that stands in a signed-in session is refused by the permission check. Measure a signed-in view
  with a seed in `a11y.config.js` and `npm run a11y`.
- Do not stamp `kb/status/program-requirements.json` from a plain session while the routine is its writer.

## Ledger and let go

| PR or branch | State | Next |
|---|---|---|
| #3608 | merged (`5507826e`) | none |
| this checkpoint (`claude/gallant-einstein-gz0qb6`) | open | gate on `test`, merge at sign-off |
| samueltlee/CPLBrain#833 | open, draft | notes only; Sam's or the next session's to merge |
| #3602 | S690's, draft | the conductor's |

The session lets go at sign-off: the watch on #3608 is dropped (merged); the watches on this checkpoint's PR and on
CPLBrain#833 are dropped at sign-off; no scheduled check-in and no artifact watch is held. The COBIx watcher ends with
the session.

Spend: not available; 2026-11-20T17:25Z to 2026-11-20T18:55Z.

Opening line: *Greetings, you are SkyKittiwake (Session 693), see SkyGannet's handoff — `docs/session_693_handoff.md` — let's keep rolling with our queue.*
