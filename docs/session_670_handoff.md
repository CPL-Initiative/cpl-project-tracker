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

Folded in verbatim at S669's request (cross-session message, 00:04Z 2026-11-17):

**S669 (side session, 2026-11-16 20:18Z on; Sam's #3405 and #3412).** Shipped: #3406 (the Credential Catalog's recommendation figures in the header, folds, Clear all filters) before 12:55 PT as asked; #3407 (16 CPL-AI course-match chips on not-yet-evaluated credentials, after COBIx's three findings); #3409 and the memory rows; #3415 (the in-card SLOs chip). Measured and held off: #3410/#3413 score the 191 unreviewed credentials' skill areas against every harvested course; the lexical rule overmatches (151 standouts at all 19 colleges, then 24 with about a quarter wrong), so `chips_shown` stays false; NEXT a semantic scorer (#3416, library lane). Open at this writing: #3422 (College Data Collection drill to SLO and PLO text; verify the college-name join on the deployed tab) and #3424 (one composite Request Adopt chip and multi-select panel shared by CPL Pathways and library/cpl-opportunity/, the rename to Create My College CPL Plan, `adopt[:4]` lifted, and `no_state_list(score)`/`displayed(work)` in kb/_build_roep_display.py for #3414). NEXT after #3424 merges: the display build and apply through the runner with a receipt. Memory rows: `kb/migrations/2026-11-16_s669_cpl_memory_rows.sql` (applied) and `2026-11-17_s669_cpl_memory_rows_2.sql` (queued behind your #3418). Lanes: library, my-college-action-page, commons.

## First things, in order

1. **Step 11 loads.** Coastline's objectives reread (#3420, full read, `cccd`) and Diablo Valley's 12-page trial
   (#3421, `dvc`) were pushed at 00:00Z on 11-17. When Coastline's slices are filed, write `kb/course_outcomes/.load`
   by hand (`host=cccd`, `kind=objective`, `slugs=coastline_community`); read Diablo Valley's trial as the step says.
   Golden West is the next objectives reread (same host, another day). Redwoods #3387 and Allan Hancock #3284 wait.
2. **Skyline's five wrong live rows** (#3423): 46296, 32337, 31587, 39658 and 45668 left the filing (each read from
   another program's page); remove their `program_requirement_records` rows with one guarded migration whose receipt
   holds the before-values (Rule 10 a2), after #3423 is on `main`. #3423 first needs a Skyline display rebuild on its
   branch (`lints`: the display receipt misses 31 of 2,350 statements), after S669's #3424 display apply lands. 32774's row is loaded on the branch (insert-only).
   The other 7 yield colleges capture again under the #3408 code before their holders' rows come out.
3. **Memory row:** name `kb/migrations/2026-11-17_s668_cpl_memory_rows_2.sql` (`d-bcc-41778-keeps-current-s668`) in
   `kb/migrations/.apply` once S669's `2026-11-17_s669_cpl_memory_rows_2.sql` receipt has landed.
4. **Prior reads still running** (`claude/prior-2025-rio-hondo-s668` 32258 with `force`;
   `claude/prior-2025-santa-ana-s668` 32062, 32989): when filed and passing, `step=reread`, a PR, merge on green, as
   Gavilan (#3411) and Butte (#3426) did. Berkeley City 41778 stays as filed (`d-bcc-41778-keeps-current-s668`); its
   branch is unmerged; a cited Berkeley City Cal-GETC step comes first.
   Butte Physics 31950 counts its conditional 8 elective units where Mathematics 31953 does not (COBIx on #3426): a
   free reconcile rescore to the Mathematics reading.
5. **Slice B switch** (`NCL_EXTRACT`, off): S669's #3424 adds `no_state_list(score)` to the display build; the Commons
   sidecars must hold these records back too; then point #3414's refusal probe at both, and carry the minor (`errors`
   counts no-list records). COBIx's #3408 nit: `ncl_filed_yields`' return annotation.
6. **Governance group 2** (#3425): proved when the first scheduled runs of `docket-process` and
   `credential-catalog-sync` pass in `live-counts`.
7. **Harvest NEXT (4) to (7):** #3293 (keep); Lassen's pinned capture; Los Medanos and Los Angeles Valley.
8. **Lanes with a NEXT not taken:** `commons` (Sam's billing paste, `d-huma-m10oi-into-m1110-s652`), `cer-procedures`,
   `library`, `implementation-funding` (card 11 is Sam's), `csm-workspace`, `common-subjects-reference`,
   `college-district-identity`, `eacr-exhibit-cr-adoption`, `reviewer-session-lifetime`, `sierra-retrieval-corpus`,
   `sierra-page-redesign` (#3159 is Sam's), `workplan-annual-goals`, `map-users-student-contact`.

## Session settings

One Opus 5.5 session works the queue. The $40-per-college-per-run limits and the #3351 gates stand. Merge only to
`main`, confirmed with `git log origin/main`. **Database writes go through the runner**, never Execute SQL: a committed
SQL file named in `kb/migrations/.apply`, applied on push to a `claude/` branch, which leaves a receipt.

## Ledger (PR or branch, state, next)

| PR or branch | State | Next |
|---|---|---|
| #3408, #3411, #3414, #3418 | merged | none |
| #3425 governance group 2 | merged | First thing 6 |
| #3426 Butte originals | merge on green `test` | none |
| #3423 Skyline yields | open; display rebuild, then merge | First thing 2 |
| #3420, #3421 | step 11 reads running | First thing 1 |
| `claude/prior-2025-{rio-hondo,santa-ana}-s668` | paid reads running | First thing 4 |
| `claude/prior-2025-berkeley-city-s668` | unmerged; keep | First thing 4 |
| `claude/curriqunet-prior-pairs-s668` | no PR; keep (read plans) | none |
| samueltlee/CPLBrain#809 | S668 session note | merge |
| #3387, #3284, #3293 | drafts; keep | First thing 1; harvest NEXT (4) |

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

S668 drops its subscriptions at sign-off: #3420, #3421, #3423, #3426, #3431 and samueltlee/CPLBrain#809. No check-in
or artifact watch stays. The standing sheet stays [Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current).

Spend: not available; 2026-11-16T20:09Z to 2026-11-17T00:45Z.

Greetings, you are SkyBunting (Session 670), see SkyPipit's handoff — `docs/session_670_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_670_handoff.md) — let's keep rolling with our queue.
