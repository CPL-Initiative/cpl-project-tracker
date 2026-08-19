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
new MAP Custom Report views. The Delta/SJCOE lane is **still untouched** — it has
now carried across three handoffs (§C).

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

## What shipped (#1251, merged)

A loader (`kb/_sync_map_custom_reports.py`), staging tables, a committed test,
a dispatch-only workflow and the runbook. **Both views now load, and staging is
populated** — dispatch `MAP Custom Report load (staging)` again any time to
refresh it.

**Nothing live has changed.** The swap is deliberately a separate gated SQL step.

Sam's field definitions, which are what made this loadable rather than guessable:

| field | what it is | stored as |
|---|---|---|
| `Status` | the **articulation approval stage**, e.g. `Initiator` — a MAP approval-cascade role | `status` |
| `CPLStatusPlan` | the **action taken** on the CR — the disposition. Already held | `cpl_status_plan` |
| `CPLPlanStatus` | **not a status**: the **lifecycle checks**, several at once, pipe-delimited | `cpl_plan_status`, verbatim |

---

## §A · Priority: reconcile, then swap

**Run runbook SQL 1 through the Supabase MCP.** Staging is loaded; the live
tables are untouched. The gate is the per-college pass, and it already has one
known failure to explain:

⚠️ **Moreno Valley went DOWN — 7,963 live → 7,771 incoming (−192)** while the
total went UP (204,714 → 211,005, +3.07%). MVC was picked as the test *because*
it spans eight catalog years where most colleges have five. The pull also carries
**112 colleges against 111 live**, so at least one is new.

**A one-directional total does not license a swap.** Find every college moving
the wrong way, and explain them, before SQL 2. Candidates: rows genuinely removed
when the MAP team corrected Exhibit references and reloaded (`cpl_memory:
two-student-counts-disagree-indicator-suspected`), a catalog year rolling out of
the view, or a key change moving rows between colleges. **Do not assume; the
staging table and the live table are both in the same database, so this is one
join.**

⚠️ **When you do swap: the two tables DO NOT share a policy.**
`map_college_cr_unit` accepts the team phrase; `map_student_credit` is
**reviewer-only**. Restoring the articulation table's policy onto the student
table hands 537,908 student-grain rows to every phrase holder, and the tab looks
completely normal afterwards. SQL 4 restores them separately for that reason.

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
units say *a quantity was recorded on this row*. Neither is wrong. Ask before the
Course Credit tab or the $50k disposition work quotes either.

Also worth telling him, unprompted, because it changes what can be built:
**`Status` is 91.2% null** (539,894 of 591,820) and its top value is
**`Implementation` (45,302)**, not `Initiator` (2,918). Four non-null values
exist. It cannot be a facet — a chart on approval stage would describe 8.8% of
rows while looking like it described all of them.

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
