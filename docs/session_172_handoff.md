---
title: Session 172 handoff — staging is loaded; reconcile, then swap
created: 2026-08-19
updated: 2026-08-19
tags: [handoff, session-172, map-api, custom-report, student-detail, reconciliation, supabase, swap]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_report_load]]"
  - "[[docs/map_custom_reports_lessons]]"
  - "[[docs/session_171_handoff]]"
---

# Session 172 handoff

You are **Session 172**. Session 171 was **SkyLoad**, single-lane: loading the two
new MAP Custom Report views and reconciling them. **Staging is loaded and the
reconciliation passed** — the open job is the swap, and it moves a public number,
which is why it was left gated (§A). The Delta/SJCOE lane is **still untouched** —
it has now carried across three handoffs (§C).

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8), tags `map-api` / `custom-report` /
   `student-detail` / `reconciliation`. Three rows were written this run and
   they are the findings, not the summary.
2. [`docs/map_custom_report_load.md`](map_custom_report_load.md) — **the runbook.
   It is the job.** SQL 1 is the gate; SQL 2–4 are the swap.
3. [`docs/map_custom_reports_lessons.md`](map_custom_reports_lessons.md) §
   2026-08-19 (later still) — the whole story.
4. `CLAUDE.md` §11 → **MAP Custom Reports** row.

---

## What shipped (#1251 and #1252, both merged)

A loader (`kb/_sync_map_custom_reports.py`), staging tables, a committed test,
a dispatch-only workflow and the runbook. **Both views now load, and staging is
populated** — dispatch `MAP Custom Report load (staging)` again any time to
refresh it.

**Nothing live has changed.** The swap is deliberately a separate gated SQL step.

**#1252 was the gate working.** Reconciling staging against live caught a defect
in the loader itself: `_clean()` mapped `""` to `None`, while the live table
*stores* `""` (414 `catalog_year`, 348 `exhibit_id`, 196,044 `college_course`,
619 `source_code`). A swap would have changed the representation of blankness on
~200k rows during a refresh, and `count(distinct catalog_year)` silently went
9 → 8 — which first read as a missing catalog year. **A load must reproduce its
source, not improve it.** When a loader replaces an existing table, diff the
*representation*, not only the counts.

Sam's field definitions, which are what made this loadable rather than guessable:

| field | what it is | stored as |
|---|---|---|
| `Status` | the **articulation approval stage**, e.g. `Initiator` — a MAP approval-cascade role | `status` |
| `CPLStatusPlan` | the **action taken** on the CR — the disposition. Already held | `cpl_status_plan` |
| `CPLPlanStatus` | **not a status**: the **lifecycle checks**, several at once, pipe-delimited | `cpl_plan_status`, verbatim |

---

## §A · The reconciliation is DONE and it PASSED. The job is the swap.

Staging is loaded from the fixed loader and **both views parse exactly to their
`dataCount`** — 211,005 and 591,820. The per-college gate has been run and both
anomalies are explained. Do not re-litigate it; read it and decide.

**Dataset B (student grain) is unambiguously clean.** *No* college decreased.
591,820 rows · **47,804 distinct students** (live 42,346) · surrogate dense
1..47,804 with **zero nulls**, so the privacy tripwire passes · Needs Action
units **1,125,873** (live 1,053,333) · 112 colleges vs 111.

**Dataset A had two colleges going down and the cause is a catalog-year
roll-forward, not deletions.** Only 2 of 112 fell — both RCCD, college 2 (−493)
and Moreno Valley (−192). Statewide, *every older year shrinks and every newer
year grows*: 2022-23 −116 · 2023-24 −610 · 2024-25 +620 · 2025-26 +2,437 ·
2026-27 **+3,978**. Rows are re-keyed forward; those two net negative only
because forward growth didn't offset older-year losses.

⚠️ **That has a consequence beyond this swap: the catalog-year axis is
MUTABLE.** Last year's figure changes when you re-pull, so a year-over-year
comparison built from two different pulls compares two different partitions of
the same rows. Say so wherever catalog year is used as a time dimension.

### Before you swap — the two things that are not counts

⚠️ **The swap moves a PUBLIC HEADLINE.** Needs Action units go **1,053,333 →
1,125,873 (+6.9%)** and students **42,346 → 47,804 (+12.9%)**. That million-unit
figure is what the $50k work, the College Action page and Sam's own framing
quote. `CLAUDE.md`'s number policy says published and unsuppressed move
**together, never one half alone** — so the published aggregates
(`kb/supabase_map_college_goal2.sql`,
`kb/supabase_map_college_credit_summary.sql`) must be rebuilt in the same pass.
**This is worth telling Sam before, not after.** It is why the swap was left
gated rather than done.

⚠️ **The two tables DO NOT share a policy.** `map_college_cr_unit` accepts the
team phrase; `map_student_credit` is **reviewer-only**. Restoring the
articulation table's policy onto the student table hands 537,908 student-grain
rows to every phrase holder, and the tab looks completely normal afterwards.
Runbook SQL 4 restores them separately for that reason.

Then: [`docs/map_custom_report_load.md`](map_custom_report_load.md) SQL 2 → 3 →
4 → rebuild aggregates → open the 🎓 Course Credit tab and the College Action
page.

---

## §B · Needs Sam — one question, and it is cheap for him

⚠️ **Which "transcribed" should the tabs mean?** It is both a lifecycle check and
a numeric column, and they disagree by 3.2×:

```
rows carrying the CHECK   82,235
rows with UNITS > 0       25,621
rows with both            25,621     <- units are a STRICT SUBSET of the check
```

56,614 rows are marked transcribed with zero units. Same shape as
`applied-measure-fork-55-percent`, where his ruling was **publish both and name
the gap**. The readings: the check says *a college marked the step done*; the
units say *a quantity was recorded on this row*. Neither is wrong. Ask before
the Course Credit tab or the $50k disposition work quotes either.

Two things worth telling him unprompted, because they change what can be built:

- **`Status` is 91.2% null** (539,894 of 591,820) and its top value is
  **`Implementation` (45,302)**, not `Initiator` (2,918). Four non-null values
  exist. It cannot be a facet — a chart on approval stage would describe 8.8% of
  rows while looking like it described all of them.
- **`CPLPlanStatus` holds six checks, not two** — CPL Docs 477,287 · Transcribed
  82,235 · Ed Plan 45,529 · Analysis 36,489 · Counselor 23,106 · **Student**
  20,457, over 41 combinations. Its delimiting is inconsistent (29,902 rows are
  a bare `Transcribed` with no pipe), so split-and-strip; never assume a
  trailing delimiter.

---

## §C · Carryover

- **Ashley's Delta crosswalk — untouched for three handoffs.** Record which of
  the 42 Priority-1 rows Delta accepted / rejected / **corrected**; corrections
  go into `kb/delta_offering_map.json`. The statewide engine's **second
  occupation list is still outstanding** — five sessions now, the oldest unpaid
  debt in the project.
- **Does this load get a schedule?** Deliberately unscheduled: a daily automatic
  reload of a student-grain table is Sam's decision. Ask once the reconciliation
  has been looked at.
- **`CLAUDE.md` is still 2.0× budget** (119,852 / 60,000, `always_loaded`). This
  run held it flat — archived the Sky169 narrative to pay for the new one — but
  did not reduce it. The `Troubleshooting` section is the obvious candidate for
  `docs/reference/`.
- Auth `role` column, repo split, GR sensitivity flips — all still on Sam.

---

## Patterns that worked

- **"It is wired" and "it has run" are different claims.** The views had never
  been fetched; the payload merged 13:15 PDT and the day's last cron ran 13:12
  UTC. Two commands settled it (`list_workflow_runs`, then
  `git show <sha>:fetch_custom_report.py`). Handoff 171 said to check — checking
  is what made the loader able to fetch rather than assume.
- **Check the consumers before designing around a blocker.** The live
  `student_key` (Access surrogate) cannot join the API's hash in either
  direction, which looked like a design problem. One grep showed `student_key`
  appears in three SQL files, always inside `count(distinct …)` — invariant
  under relabelling. The blocker dissolved.
- **Mutation-test your own suite.** Five mutations; four failed cleanly, and the
  fifth exposed a defect in the test itself.
- **Reconcile representation, not just counts.** The row counts were exactly
  right and the data was still wrong — nulls where the live table holds empty
  strings. Counts matching is not rows matching.

---

## Safety patterns to honour

- ⚠️ **A guard test must not be able to fire the guarded action.** With the
  truncate guard removed, the test reached `urlopen` — a live `DELETE` at a
  student-grain table. It passed locally **only because the sandbox blocks
  egress**, and the workflow runs it on a runner that does not. An
  environment-named error (`403 Forbidden`, `Connection refused`) in a test that
  should never touch the network is a finding.
  [`methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action`](kb-notes/methodology-a-guard-test-must-not-be-able-to-fire-the-guarded-action.md)
- ⚠️ **Minimisation happens twice** — the payload decides what we ASK, the loader
  what we KEEP. Twelve fetched columns have no consumer and are dropped, and
  **listed** in `HELD_COLUMNS` so the decision is visible rather than an
  apparent oversight. `StudentMAPID` derives the surrogate and is discarded.
  [`methodology-minimisation-happens-twice`](kb-notes/methodology-minimisation-happens-twice.md)
- ⚠️ **A load must reproduce its source, not improve it.** NULL may be the better
  representation of absent; that is a separate change argued on its own merits,
  never a side effect of a refresh.
- ⚠️ **A negative result needs a positive control in the same run** (SkyFetch's
  broken probe), and **an odd one out is a lead, not a tally entry**.
- ⚠️ **The payload IS the PII boundary.** `tests/custom_report_payload_test.py`
  pins it and was verified to FAIL. Keep it that way.
- ⚠️ Raw pull stays gitignored (`CustomReport_*.json`) — public repo, student rows.
  The load workflow also `rm`s it in an `always` step.
- ⚠️ **An RLS-filtered read returns 200 + `[]`.** Empty is not proof of empty.
- ⚠️ **The sandbox cannot reach the MAP API or `*.supabase.co`.** MAP work runs on
  the runner; Supabase goes through the MCP.
- Rule 4 (both HTMLs identical), Rule 1 (change the generator), Rule 5 (never
  force-push `main`), Rule 7 (TOP corroborates, never gates), Rule 10.

---

## Moniker

Session 171 was **SkyLoad**. Take **SkySwap** if you do the reconciliation and
the swap, **SkyClaim** if you take Ashley's Delta outcome, or coin your own.

Next after you: `docs/session_173_handoff.md`.
