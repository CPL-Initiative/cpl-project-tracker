---
title: "Session 674 handoff (from SkyPhoebe, S673)"
created: 2026-11-17
updated: 2026-11-17
tags: [handoff, session]
kb-status: internal
obsidian-folder: cpl-project-tracker/handoffs
---

# You are SkyRedpoll (Session 674)

From SkyPhoebe, S673, the CPL Queue routine's 10:12Z firing on 2026-11-17. This was a **full checkpoint**: the harvest lane moved,
and the run wrote a reread receipt and memory rows. It rides in #3443 with the work, not in its own PR, because a bot commit
headed the branch and the `test` check needed a push from the session anyway. Skipped: step 2 `kb/README.md`, step 3 `README.md`,
step 5 (no KB note: the learning is a harvest pattern, in lessons) and step 7 (the pipeline did not move).

Read this file first. Then the harvest lane's NEXT (0) in `docs/reference/lanes/program-requirements-harvest.md`, and
`docs/program_requirements_harvest_lessons.md` S673.

## What shipped

- **#3443, Norco's option counts.** Handoff 673 read Norco's three ensemble options (30606, 30607) as ungrouped. The filed
  records already shared `option_group` "Ensemble option". What was missing was each option's count: each course was listed once
  at 2 units, and the count sat in the option's own heading. A `repeat` step's new `name_pattern` reads `n` (and `code`, where it
  names one) on a rule-all block's heading and sets `times` on that block's courses only. It runs only where the heading's words are
  on the page, every course it touches has units and no count, and the counted sum equals the block's stated figure
  (`d-norco-option-heading-counts-s673`).
  - Reconcile 44063769303: Norco went from 130 to 132 passing, with none lost (pass sets compared before and after). Reread
    44066786945 replaced 2 unchecked rows, both passing (receipt
    `kb/receipts/program_requirement_records_college_reread_norco_44066786945.json`, with its before-values).
  - Tests: `tests/program_requirements_reconcile_test.py` 363/363 (the old check that MUS-41 stays unset became six checks for the
    new step); `program_requirements_college_test.py` 730 checks.
- **Decided** `d-mvc-38758-total-is-20-s673`: Moreno Valley Guitar 38758's total is the printed 20. The 16 low end is the MUS-3
  test-out, and credit by exam still awards the units.
- **Filed** `f-ccn-renumber-shows-as-catalog-addition-s673` (COBIx's #3438 point 2): `kb/_build_roep_display.py` counts
  additions and gaps from `catalog_addition` and the COCI listing alone, so a CCN-renumbered code that coverage matches by
  `course_id` (Riverside City HIST-C1001) still reads as off the list. Reader-wide, and it waits behind harvest.
- Headline: 14,623 of 20,282 active programs complete at 118 colleges (14,621 at S672's checkpoint).

## First things, in order

1. **Step 11 (UTC Nov 18):** Golden West's objectives full read, unchanged from handoff 673 item 1. Create
   `claude/slo-objectives-golden-west` off `main` and run `.run` from `objectives_reread_plan.json` step 1. Write `.load` by hand
   (`host=cccd`, `kind=objective`, `slugs=golden_west`), rebuild the Commons data and drop the step from the plan. Diablo Valley
   (#3421) takes a later day. #3387 and #3284 wait.
2. **Moreno Valley 38758's total.** No reconcile step today overwrites a filled total, so the decision needs a narrow one: where a
   block's heading prints a range whose low end is a test-out ("* (Test out option available)") and the page prints
   "Total: 20.00", the record takes the printed total. Then a free reconcile and reread for Moreno Valley.
3. **COBIx's #3438 point 3:** the Social Justice family's uneven `degree_total` (41749 and 43896 carry 60; 41757 and 44363 none).
4. **RCCD pilot, next steps:** the Los Rios profile only (the start brief's step 5), with no Los Rios harvest; #3430's
   course-to-area file can use `kb/college_reads/rccd_gen_ed_page.json`.
5. **Free rescores carried from handoff 671:** Butte Physics 31950 to the Mathematics reading, Berkeley City 41778 after a cited
   Cal-GETC step, and Santa Ana 32989's inferred `ge_pattern`.
6. **Slice B** (harvest NEXT 3), then `governance-team-enablement` NEXT (1), then harvest NEXT (4) to (7).
7. **The CCN display fix** (`f-ccn-renumber-shows-as-catalog-addition-s673`): a code coverage matches by `course_id` leaves the
   additions and gaps. Check other colleges' renumbered codes first; it changes every college's display.
8. **Lanes with a NEXT not taken, waiting behind harvest by COBIx's work order:** `cer-procedures`, `library` and
   `my-college-action-page` (worked in the last seven days), and the rest unchanged from handoff 672 item 7. The Library's standing
   requested and revise rows (the two funding how-to drafts, IACA, the MAP coordinator page) are unchanged since Nov 13; they are
   the Library lane's, not this queue's harvest.

## Session settings

One Opus 5.5 session works the queue. The $40-per-college-per-run limits and the #3351 gates stand. Merge only to `main`, and
confirm each merge with `git log origin/main`. Database writes go through the runner. This firing had no `get_session` and no
`list_sessions`; read-only `execute_sql` ran without a prompt.

A bot commit on a PR branch (a filed read, a receipt) leaves the PR's checks at `action_required`: the `test` check needs a push
from the session on top of it. The sandbox cannot reach college hosts. `scripts/check_generated.sh` reports the same two STALE
builds as before (the statewide catalog and the discipline blanks worklist): the sandbox has no `openpyxl`.

## Ledger (PR or branch, state, next)

| PR or branch | State | Next |
|---|---|---|
| #3443 Norco option counts + this checkpoint | merge on green `test` | Moreno Valley's total |
| #3421, #3387, #3284, #3293 | drafts; keep | First thing 1; harvest NEXT (4) |
| #3383 (dependabot) | open; not this queue's | leave |
| CPLBrain `claude/tender-bohr-nzkf7v` | the S673 session note | vault sync |

## Decisions

The `cpl_memory` rows are in `kb/migrations/2026-11-17_s673_cpl_memory_rows.sql`, applied by run 44066956238 (receipt
`kb/receipts/migration_s673_cpl_memory_rows_44066956238.json`, status 201), with a rollback beside it:
`d-norco-option-heading-counts-s673`, `d-mvc-38758-total-is-20-s673` and `f-ccn-renumber-shows-as-catalog-addition-s673`. The same
file supersedes SkyWren's own `f-norco-mis-performance-options-ungrouped-s672` with a guarded update, since the options were grouped.
Sam gave no new ruling this run.

## Let go

S673 drops its subscription to #3443 at merge. It holds no check-in or artifact watch. The standing sheet stays
[Open Asks Sheet 200](https://claude.ai/artifact/5ShC7pGgNuz9bJUhkdsc8Y) (current).

Spend: 2026-11-17T10:12Z to about 11:05Z. No model calls: the reconcile and reread were free.

Session cost: `get_session` not available. Substantive PRs merged: 1 (#3443).

Greetings, you are SkyRedpoll (Session 674), see SkyPhoebe's handoff — `docs/session_674_handoff.md` (https://github.com/CPL-Initiative/cpl-project-tracker/blob/main/docs/session_674_handoff.md) — let's keep rolling with our queue.
