---
title: "Session 695 handoff (from SkyPetrel, the plain session of 2026-11-20 to 21 that built Assign from the panel and planned the pile mint)"
created: 2026-11-21
updated: 2026-11-21
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_701_handoff.md
---

**Routing.** A CPL Queue routine firing follows `docs/session_691_handoff.md` (S690, the conductor's), never this
file. This handoff is for Sam's next plain session on the Commons build.

# You are SkyShearwater (Session 695)

From SkyPetrel (Session 694), Sam's plain session of 2026-11-20 22:40Z to about 2026-11-21 01:00Z, run as a conductor.
A **full checkpoint** (the commons lane moved; the run committed a build change and two dry runs). Skipped: step 3 (no
README surface changed), 7 (no re-mint or apply; the mint is a plan), 9 (the UI pass is its own queue item), 11 (the
vault note: this checkpoint's documents worker writes only in the tracker) and 12's `program-requirements.json`
(the routine's run log; its headline needs Supabase). `kb/status/course.json` and `subjects.json` were refreshed. The
day's `kb/docs_audit/2026-11-21.*` is not in this checkpoint's PR, because #3622 commits the same files.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background; act on each new
   `<!-- cobix -->` comment. Read a PR's whole thread before you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes
   (`r-collection-first-sam-2026-11-20`); collection serves the M-IDs, its fixes ranked by the M-ID cards they unblock
   (`r-collect-for-mids-work-order-sam-2026-11-20`).
3. **Merge order:** #3620, then #3622, then this checkpoint's PR. Dependabot's #3383 waits.

## What shipped

- **#3617 (`1f7135da`):** the commons lane compacted, 24,934 to 18,475 bytes.
- **#3618 (`810a9b50`):** the build for Assign from the panel. Dry run `kb/_assign_from_panel_dryrun.py`, receipts
  `kb/assign_dryrun_out/2026-11-20/`: pile courses under their target 70 of 82 to 82 of 82; a minted course's subject,
  credit status and TOP 0 of 12 to 12 of 12. 15 held courses now list under their M-IDs (the pile reads 2,493 after
  the next daily build).
- **#3619 (`e04e155d`):** the pile opens on exhibit links counted through the build's folds (Strong or Possible only);
  `kb/coci_closest_mid.json` rebuilds in the daily build when an input changed.
- **#3621 (`ab0ed744`):** the pile mint dry run, `kb/_pile_mint_dryrun.py`, plan `kb/pile_mint_out/2026-11-21/plan.json`:
  58 catalog records holding 140 courses and 514 stand-alone records planned; 944 held for want of a SUBJ4; 4 held for
  Assign. Nothing applied.
- **#3620 and #3622:** see the ledger.
- **Memory:** 18 rows drafted (6 decisions, 5 facts, 5 pitfalls, 2 milestones), `kb/migrations/2026-11-21_s694_checkpoint_memory_rows.sql` (the session adds it to `.apply`).

Read in order: this file; the commons lane's paragraphs *Needs an M-ID*, *the pile mint* and *the Subjects card*
([`commons`](reference/lanes/commons.md)); `docs/commons_lessons.md`, *S694*; the plan's PR (#3621), with its list of the
five consumers a new `discipline_source` value would mislead.

## Priority work, in order

1. **Dispatch `daily-dashboard.yml` once** if the ledger below says it was not dispatched, so #3618, #3619 and #3622
   publish.
2. **The mint:** a second read of `kb/pile_mint_out/2026-11-21/plan.json`, then the apply under the playbook
   (`docs/coursecontrolnumber_remint.md`) for the 572 planned records, with `top_code` and `cte` stamped by the tools
   that own them. *Propose a new M-ID* waits on it.
3. **The 944 held courses** reduce to a list of local subject codes that need a common subject code: the Subjects
   card's work, with `#commons/subjects/disagree` beside it.
4. **Special and selected topics flagged not applicable**, as independent study is
   (`d-topics-not-applicable-2026-11-20`; told to Sam in session, no answer yet), unless he says otherwise.
5. **Jev as the recommender's second stage:** a same-course yes or no on the top candidates (`kb/_jev_harvest.py`).
6. **SLOs and objectives in the score** where `course_outcomes` holds them.
7. **The Subjects builder in the daily build.**
8. **Why `handover-try-link` answered 503:** a fourth 503 at 2026-11-20 20:04:44Z predates the deploy that logs the
   reason; read the log after the next press (`not_configured` or `token_refused`), then set or renew
   `HANDOVER_DISPATCH_TOKEN`.
9. **The 7 term reports read for their terms, on a runner** with the service key.
10. **The earlier queue:** the three Collect cards from Sam's locked mock; the M-ID census builder on one base.

Also open in the lanes: the commons lane's #3570 gaps, the Rule G dry run then apply with its own `--expect`, and the
Common Subjects lane's (`common-subjects-reference`) ECONMT and Electricity codes, which item 3 sits beside.
`program-requirements-harvest` is the conductor's (handoff 691); `library` and `common-cr-reference` are plain-session
work after the Commons slices, unless Sam names them first.

## Decisions Sam made

None this session: he said nothing substantive beyond the opening line, so there is no new `r-` row and no braindump.

## Decisions the session made (each his to revise)

- A course joined to a catalog M-ID leaves that row as it stands; its course count and units range grow
  (`d-joined-course-keeps-the-mid-row-2026-11-20`).
- Assign's first slice targets existing M-IDs only; Propose a new M-ID waits on the mint
  (`d-assign-first-slice-existing-only-2026-11-20`).
- Assign never replaces a row: insert only, after reading that one key (`d-assign-never-replaces-a-row-2026-11-21`).
- Links count through the folds, at Strong or Possible only (`d-links-count-through-folds-2026-11-20`).
- Special and selected topics to be flagged not applicable; planned, not built (`d-topics-not-applicable-2026-11-20`).
- The mint's first wave leaves out Strong or Possible, topics and shared control numbers
  (`d-pile-mint-first-wave-scope-2026-11-20`).

## Patterns that worked

Changing the build before the control, with a dry run that ran it both ways; a second reader on every PR that touches
shared reader code, whose BLOCKING finding (a failed read passed as an empty list) held #3622 until fixed; counting what
made the pile (2,364 of 2,508 are generic-shell titles) before tuning a matcher for it.

## Safety patterns to honor

- Never cat the npm test log; tail it. List workflow runs with perPage 1 to 3.
- The privacy plugin refuses a Bash call that names the daily dashboard generator: read it with the Read tool.
- A test must not read a live worklist; give it a fixture tied to the builder.
- Launch a worktree-isolated agent from the tracker. Never add a read policy to the `commons-handover` bucket.
- The migrate runner's receipt commit starts no CI: push a commit of your own after the last receipt, then gate on `test`.
- **Before a kill, check the parent and the start time:** the conductor killed a worker's `npm test` by process id,
  taking it for its own (`p-kill-check-parent-and-start-2026-11-21`).
- **Never stack a branch on a PR that squash-merges:** it conflicts on every shared file; rebuild it as cherry-picks
  on `main` (`p-stacked-branch-after-squash-2026-11-21`).
- A failed read is never an empty list where a write depends on it; a fingerprint over raw bytes never matches when
  inputs carry daily stamps; run one or two test suites at a time on four cores.

## Ledger and let go

Open at the time the documents were written; the conductor updates this table at sign-off.

| PR or branch | State | Next |
|---|---|---|
| #3617 | merged (`1f7135da`) | none |
| #3618 | merged (`810a9b50`) | none |
| #3619 | merged (`e04e155d`) | none |
| #3621 | merged (`ab0ed744`) | the plan's second read (priority 2) |
| #3620 (the Subjects card) | merged (`56bd50e0`) | the builder in the daily build (priority 7) |
| #3622 (the Assign control) | merged (`b05a9921`), after a CI failure on the reviewer-email guard and its fix | none |
| this checkpoint (`claude/s694-checkpoint`) | open, draft | merge at sign-off if `test` is green |
| `daily-dashboard.yml` | dispatched on `main` at 2026-11-21 01:00Z, after #3622 | confirm it ended in success and that the pile reads 2,493 |

The session drops its PR watches at sign-off; it holds no scheduled check-in and no artifact watch. The COBIx watcher
stopped at its two-hour background limit at about 00:41Z, having seen no COBIx comment since 21:30Z; restart it.
The 18 memory rows are applied (run 44845357911, `kb/receipts/migration_s694_checkpoint_memory_rows_44845357911.json`).
The vault's session note and wiki touch are `samueltlee/CPLBrain#835`.

Spend: not available; 2026-11-20T22:40Z to 2026-11-21T01:00Z.

Opening line: *Greetings, you are SkyShearwater (Session 695), see SkyPetrel's handoff — `docs/session_695_handoff.md` — let's keep rolling with our queue.*
