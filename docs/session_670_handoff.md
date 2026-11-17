---
title: "Session 670 handoff (from SkyPipit, S668)"
created: 2026-11-16
updated: 2026-11-16
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyBunting (Session 670)

From SkyPipit, S668, Sam's session on 2026-11-16 (20:09Z on, opened by hand: *"keep rolling with our queue"*). Number
669 belongs to a parallel hand-opened session that writes no handoff; its paragraph is below. A **full checkpoint**:
the harvest lane moved and the run wrote a data receipt (Gavilan's reread). Skipped: step 7 (the pipeline did not
move), `kb/README.md` and `README.md` (nothing they describe changed); no KB note.

Read this file, then the harvest lane (`docs/reference/lanes/program-requirements-harvest.md`, NEXT), then
`docs/program_requirements_harvest_lessons.md` S668, then the governance lane's NEXT (1).

## What shipped

- **#3408** (`929e1e6c`): the no-closed-list lookup's page yield (13 yields at 8 colleges, 0 passing moved). COBIx's
  nit carried: `ncl_filed_yields`'s return annotation still says a 3-tuple.
- **#3411** (`2bcb6dea`): Gavilan Mathematics 31444 and Physics 33047 from their 2025-2026 catalog; reread
  43962460208 replaced 2, held 0.
- **#3414** (draft, head `7f4e8613`): slice B part 1; second reader: merge; waits on `test`.
- Free page reads found each curriQunet host's past catalogs (`f-curriqunet-historical-catalogs-s668`).

## S669 (parallel session)

S669's paragraph follows; the conductor folds it in.

## First things, in order

1. **Step 11 (UTC Nov 17).** Coastline's objectives reread is the full read, then Golden West (`cccd`), plus one
   preparation run. College of the Redwoods (#3387) and Allan Hancock (#3284) wait their turn.
2. **Gate and merge #3418** (this checkpoint) on a green `test`, once the conductor has applied
   `kb/migrations/2026-11-16_s668_cpl_memory_rows.sql` through the runner.
3. **Harvest NEXT (2), the curriQunet prior reads** (`claude/prior-2025-<college>-s668`, one branch each): Butte 31950
   and 31953 and Rio Hondo 32258 (both with `force`), Santa Ana 32062 and 32989; each files and merges as Gavilan's did
   once its records pass. Berkeley City 41778: a free `step=reconcile` prior rescore; merge only on a pass, else close
   the branch.
4. **Harvest NEXT (3), slice B:** merge #3414 on a green `test`. `NCL_EXTRACT` stays off until the display build (S669,
   `claude/s669-adopt-chip`) and the Commons sidecars both hold `no_state_list` records back; carry the minor
   (`errors` still counts no-list records). Then Skyline's fresh read (`claude/skyline-yield-s668`, extract 1) files
   its yields; the 13 holders' live rows come out only after each college's filing drops the record; the other 7
   colleges capture again under the new code first.
5. **Governance NEXT (1)** (`governance-team-enablement`): `weekly-reflections-summary` was due about 23:37Z on 11-16.
   When it is green in `live-counts`, group 2 (14 jobs) moves in one PR.
6. **Harvest NEXT (4) to (7):** #3293 (keep); Lassen's pinned capture; Los Medanos and Los Angeles Valley.
7. **Lanes with a NEXT not taken:** `commons` (Sam's billing paste, `d-huma-m10oi-into-m1110-s652`), `cer-procedures`,
   `library`, `my-college-action-page`, `implementation-funding` (card 11 is Sam's), `csm-workspace`,
   `common-subjects-reference`, `college-district-identity`, `eacr-exhibit-cr-adoption`, `reviewer-session-lifetime`,
   `sierra-retrieval-corpus`, `sierra-page-redesign` (#3159 is Sam's), `workplan-annual-goals`,
   `map-users-student-contact`.

## Session settings

One Opus 5.5 session works the queue. The $40-per-college-per-run limits and the #3351 gates stand. Merge only to
`main`, confirmed with `git log origin/main`. **Database writes go through the runner**, never Execute SQL: a committed
SQL file named in `kb/migrations/.apply`, applied on push to a `claude/` branch, which leaves a receipt.

## Ledger (PR or branch, state, next)

| PR or branch | State | Next |
|---|---|---|
| #3408, #3411 | merged | none |
| #3414 | draft, head `7f4e8613` | First thing 4 |
| #3418 | draft, this checkpoint | First thing 2 |
| `claude/curriqunet-prior-pairs-s668` | no PR; keep | the prior reads' plans |
| `claude/prior-2025-<college>-s668` (four) | reads in flight | First thing 3 |
| `claude/skyline-yield-s668` | fresh read | First thing 4 |
| #3387, #3284 | drafts; keep | First thing 1 |
| #3293 | draft; keep | harvest NEXT (4) |

## Decisions and Sam's words

`cpl_memory` rows, drafted in `kb/migrations/2026-11-16_s668_cpl_memory_rows.sql` (rollback by slug beside it; not
yet named in `.apply`): `d-curriqunet-plain-pairs-scope-s668`, `d-prior-read-forces-past-no-gain-s668`,
`d-ncl-page-yield-s668`, `d-no-list-record-scored-without-state-list-s668`, `f-curriqunet-historical-catalogs-s668`,
`p-yield-holder-live-row-after-filing-s668`, `d-gavilan-originals-filed-s668`, and
`p-execute-sql-prompt-is-the-apps-s668`, verified by Sam. His words at 20:10Z, of the Execute SQL card: *"I okd this but
you have auth to do this without asking..."* The card is the app's per-call prompt
(`docs/reference/approval_prompt_hooks.md`), so keep live reads few and batched.

## Patterns that worked, and safety

- A decision a later run reads back stores the conditions it was made under: a persisted yield carries its
  `catalog_year` and lapses in another (COBIx on #3408).
- Read a 2.0's catalog year before paying for a prior read; a prior read walks the whole archive (15 to 92 minutes),
  so end the turn while it runs.
- A reread that changes a record's page regenerates that college's Commons sidecar in the same PR.
- Read one run with `list_workflow_jobs`; `list_workflow_runs` floods the context.

## Checkpoint notes

Lint: the harvest lane is under budget at 19,885 bytes (five paragraphs moved verbatim to the lessons doc, *Moved
from the lane (S668 checkpoint)*). Not taken: `CLAUDE.md` at 1.04x, `cpl_funding_lessons`, the dependency map, one KB
note's frontmatter dialect. Wiki candidates for `/wiki-ingest`: curriQunet's historical-catalog endpoints; a plain
program and its 2.0 each keep a record by catalog year; a persisted decision carries the year it was judged in.

## Let go

No PR subscription, check-in or artifact watch was named at this checkpoint; S668 drops any it holds at sign-off. The
standing sheet stays [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current).

Spend: not available; 2026-11-16T20:09Z to 2026-11-16T23:45Z.

Greetings, you are SkyBunting (Session 670), see SkyPipit's handoff — `docs/session_670_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_670_handoff.md) — let's keep rolling with our queue.
