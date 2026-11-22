---
title: "Session 696 handoff (from SkyShearwater, the plain session of 2026-11-21 that set the mint's floor and minted the first pile record)"
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

# You are SkyFulmar (Session 696)

From SkyShearwater (Session 695), Sam's plain session of 2026-11-21 01:22Z to about 04:15Z, run as a conductor. A
**full checkpoint** (a mint applied; the commons and repo-size lanes moved). Skipped: step 3 (no README surface
changed), 7 (the Pipeline tab: one record minted, the counts otherwise unmoved, so it was left), 9 (the UI pass is its
own queue item), 11 (the vault note: the conductor arranges it) and 12's `program-requirements.json` (the routine's run
log). `kb/status/course.json` and `subjects.json` were refreshed. The commons lane is #3630's and the repo-size lane
#3629's; this checkpoint edits neither.

## Open with the standing block (COBIx on #3358; Sam's rule for the next two or three sessions)

1. **Restart the COBIx watcher:** `bash scripts/cobix_watch.sh [state dir]` in the background, and **read its output
   yourself every few turns**: its output wakes no one (S695 read a 02:32Z flag at 03:23Z), and it stops at the
   two-hour background limit, so restart it. Act on each new `<!-- cobix -->` comment; read a PR's whole thread before
   you merge it or apply what it carries.
1a. **Clone light (Sam, 2026-11-19):** `git clone --filter=blob:none` (or `--depth=1`), never a full clone.
2. **Merge rules:** at most 3 open PRs (plus #3511 and dependabot's), the oldest finished first, one update from
   `main` right before its merge, no dependency-map rebuild inside a PR, no full rerun when the input fingerprints match.
   Stop a review after two rounds (COBIx's brief).
2a. **Sam's work order (2026-11-20):** collection comes first, data waves before fixes
   (`r-collection-first-sam-2026-11-20`); collection serves the M-IDs, its fixes ranked by the M-ID cards they unblock
   (`r-collect-for-mids-work-order-sam-2026-11-20`). COBIx's plain-session order on #3358: slimming items 1 to 3, then
   the M-ID work, then Library part 4.
3. **Merge order:** #3629 (the older), then #3630, then this checkpoint's PR. Dependabot's #3383 waits.

## What shipped

- **#3624 (`99e9c3ee`):** special and selected topics flagged not applicable (584 on the pile); the pile 2,493 to 1,909.
- **#3625 (`6ff93f80`):** `#commons/subjects/held`, builder `kb/_held_subject_codes.py`; a figure on the Subjects card.
- **#3627 (`385e04c8`):** both Subjects builders in `scripts/daily_build.sh`, rebuilt when their content changes.
- **#3626 (`2db49276`):** the pile mint v3: a 98% floor per route, `discipline_source: pile_mint`, the apply
  `kb/_pile_mint_apply.py` (dry by default, `--apply --expect N`, rollback with reserved ids).
- **#3630 (open):** the first record, `LSKL M9004` Supervised Tutoring, 90 noncredit courses at 80 colleges.
- **#3629 (open):** repo slimming items 1 and 2 (`receipt-slim.yml`, not dispatched).
- **Memory:** 14 rows drafted, `kb/migrations/2026-11-21_s695_checkpoint_memory_rows.sql` (not yet in `.apply`).

Read in order: this file; the commons lane's *the pile mint* and *the Subjects card* paragraphs
([`commons`](reference/lanes/commons.md), as #3630 leaves them); `docs/commons_lessons.md`, *S695*; the repo-size
lane's NEXT ([`repo-size`](reference/lanes/repo-size.md), as #3629 leaves it).

## Priority work, in order

1. **Done at sign-off, nothing to confirm:** the daily build after #3630 succeeded (run 44864091313), the pile reads 1,819 and
   `LSKL M9004` is in the published member list.
2. **Repo slimming, the rest:** items 1 and 2 ran (#3629, `receipt-slim.yml` run 44867993793, commit `05383647`): 139 applied
   records and every dated row audit report are in `cpl-receipts`, each with a pointer; `kb/receipts` and `kb/row_audit` hold
   54 MB, down from about 271. Next: item 3 (batch `dependency-map.yml` to at most hourly), `START_HERE.md`, the `CLAUDE.md`
   cut, and removing `receipt-slim.yml` once nothing is left for it (the repo-size lane).
3. **The 168 other tutoring titles:** 76 that name a subject go to Assign under `LSKL M9004` (a dry run and a second
   read first); 70 that prepare tutors become a later LSKL mint; 22 for a person.
4. **Held codes:** saving a person's code decision from `#commons/subjects/held` (1,341 courses, 416 codes, 678 pairs;
   top OTA 27, CHIL 21, RT 21, KIN 20, CD 19) into `kb/reference/subject_discipline_map.json`, and a session pass over
   the top codes that read the same at every college using them.
5. ***Propose a new M-ID*** in the panel, on the new apply.
6. **Jev as the recommender's second stage** (`kb/_jev_harvest.py`).
7. **SLOs and objectives in the score** where `course_outcomes` holds them.
8. **Rebuild the state course list** (`coci_lookup_data.js`, built 2026-07-09 from a 2026-05-21 export) from a current
   COCI export, and give it a workflow.
9. **Why `handover-try-link` answered 503:** read the logged reason after the next press (`not_configured` or
   `token_refused`), then set or renew `HANDOVER_DISPATCH_TOKEN`.
10. **The 7 term reports read for their terms, on a runner** with the service key.
11. **Library part 4** (Publish all, Add existing, redraft and republish; COBIx's order), the three Collect cards from
    Sam's locked mock, the M-ID census builder on one base.

Also open in the lanes: the commons lane's #3570 gaps, the Rule G dry run then apply with its own `--expect`, and the
Common Subjects lane's (`common-subjects-reference`) ECONMT and Electricity codes, which item 4 sits beside. 481 catalog rows' committed `cte` differs
from a fresh stamp (older than S695). `program-requirements-harvest` is the conductor's (handoff 691);
`common-cr-reference` is plain-session work after the Commons slices, unless Sam names it first.

## Decisions Sam made

None this session: he wrote only the opening line, so there is no new `r-` row and no braindump.

## Decisions the session made (each his to revise)

- The pile mint mints only where a route meets the 98% floor; the 572-record plan is not applied
  (`d-pile-mint-floor-98-2026-11-21`).
- Bare Supervised Tutoring mints under LSKL, the MQ handbook's Learning Assistance or Learning Skills discipline
  (`d-tutoring-under-lskl-2026-11-21`).
- Pile-minted records carry `discipline_source: pile_mint` (`d-pile-mint-source-value-2026-11-21`).
- A generic kind mints as one common course per normalized title and band statewide; a numeral is a level and never
  folds (`d-shell-kind-one-course-statewide-2026-11-21`).
- A person's Common SUBJ for a local code is saved in the subject map by a committed PR; a college-keyed overlay would
  be a new write surface and goes through Governance first (`d-held-codes-saved-in-subject-map-2026-11-21`).
- `d-topics-not-applicable-2026-11-20` is built (#3624).

## Patterns that worked

A second read that asked whether the answer was right, not only whether it was well formed; measuring each route on
held answers with the holder's own college left out; stopping review at two rounds; a failed daily step that warns,
restores yesterday's file and lets the publish go on.

## Safety patterns to honor

- A mint route is a matcher: pass it through a self-recall floor on held answers before it writes
  ([`methodology-a-new-matcher-is-gated-by-a-self-recall-test`](kb-notes/methodology-a-new-matcher-is-gated-by-a-self-recall-test.md)).
- A new `discipline_source` value: check `_infer_disciplines`, `_row_audit` and `_ccr_confidence_score` read it.
- A rollback must not depend on a file's formatting; a build step rewrites it.
- After an upstream rule changes, read each downstream figure (the held list fell 943 to 3 before its fix).
- A shared loader is imported, never copied (the overmerge tool's copy missed `kb/pile_mint_reserved.json`).
- From S694: check the parent and start time before a kill; never stack a branch on a PR that squash-merges; a failed
  read is never an empty list where a write depends on it; run one or two test suites at a time on four cores.
- Never cat the npm test log; tail it. The privacy plugin refuses a Bash call naming the daily dashboard generator.
- The migrate runner's receipt commit starts no CI: push a commit of your own after it, then gate on `test`.

## Ledger and let go

Final at sign-off, 2026-11-21 05:00Z.

| PR or branch | State | Next |
|---|---|---|
| #3624, #3625, #3627, #3626 | merged (`99e9c3ee`, `6ff93f80`, `385e04c8`, `2db49276`) | none |
| #3630 (`LSKL M9004`) | merged (`00b191e0`); daily build 44864091313 succeeded | priority 3 |
| #3629 (repo slimming 1, 2) | merged (`958b433a`) after one fix round and two lints fixes; dry run 44867595760, apply 44867993793 | priority 2 |
| this checkpoint (#3631) | merged at sign-off | none |
| `samueltlee/CPLBrain#836` (session note, wiki touch) | open, draft | Sam's to merge, as #835 |
| #3602 | the conductor routine's | leave |
| #3383 | dependabot's | waits |

The session dropped its PR watches at sign-off; it holds no scheduled check-in and no artifact watch. The COBIx watcher
stopped at its two-hour limit and was not restarted: restart it, and read its output at every wake. The 14 memory rows are
applied (run 44863705419, `kb/receipts/migration_s695_checkpoint_memory_rows_44863705419.json`).

Spend: not available; 2026-11-21T01:22Z to 2026-11-21T05:00Z.

The work was curation (the mint and its floor) and infrastructure (the daily build steps, repo slimming).

Opening line: *Greetings, you are SkyFulmar (Session 696), see SkyShearwater's handoff — `docs/session_696_handoff.md` — let's keep rolling with our queue.*
