---
title: Session 173 handoff — two things were about to go wrong; one ruling is owed
created: 2026-08-19
updated: 2026-08-19
tags: [handoff, session-173, map-api, custom-report, cron, security, cleanup-worklist, grants]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[CLAUDE]]"
  - "[[docs/map_custom_report_load]]"
  - "[[docs/map_cleanup_worklist]]"
  - "[[docs/session_172_handoff]]"
---

# Session 173 handoff

You are **Session 173**. Session 172 was **SkySwap**. It took one queue item —
*"watch the first unattended 13:40 UTC run"* — and found that watching meant
looking at what had **already** run. Two things were about to go wrong in public
and neither was visible from the roadmap.

⚠️ **Sam frequently runs several sessions at once.** Check `git log origin/main`
before assuming your branch is the only work in flight.

---

## Read in this order

1. **`cpl_memory` FIRST** (Rule 8), tags `map-api` / `security` / `cleanup` /
   `worklist`. Two rows were written this run.
2. [`docs/map_custom_report_load.md`](map_custom_report_load.md) — the runbook,
   now with a section on the step **no gate protects**.
3. [`docs/map_cleanup_worklist.md`](map_cleanup_worklist.md) — the authority, and
   the thing that changed most this run.
4. `CLAUDE.md` § Rule 10 (b2) and §11 → **MAP Custom Reports** + **CPL clean-up
   worklist** rows.

---

## What shipped

**#1262 — the nightly load would have failed tonight, one step short of the
gates.** The last dispatch had already failed: emptying `stg_map_student_credit`
by PostgREST `DELETE` writes 591,820 dead tuples, Postgres logged `canceling
statement due to statement timeout`, the runner saw a bare `HTTP 500`. Now
`map_clear_custom_report_staging()` — **5.3 s** on the same 802,825 rows, and it
takes **no argument**, so the pipeline's one destructive call has no table name
to get wrong.

**#1262 also — six definer functions were reachable with the published anon
key.** `revoke ... on function f() from anon, authenticated` does **not** remove
the PUBLIC grant. `anon` could execute `map_promote_custom_reports`, which
truncates both live MAP tables. All six now revoked from PUBLIC;
`tests/supabase_function_grants_test.py` fails the build on the inert form.

**#1263 — the clean-up list was about to tell 101 colleges that ACE refused
credit it did not refuse.** P1's single action said *"ACE has already said no
credit is recommended"* across 17,594 rows; **5,311 of them say the opposite** —
*"Credit may be granted on the basis of an individualized assessment"*. Split
into P1 (12,283, safe to send) and **P5 `credit MAY be available if the college
evaluates`** (5,311, `needs a ruling`, prescribes nothing).

---

## ⚠️ The one thing Sam owes an answer on

**What should a college do with a P5 record when it has not done the
evaluation?** Not Applicable anyway · stays Needs Action · or MAP needs a state
it does not currently have. **Nothing about those 5,311 rows should reach a
college until he answers.** It is a cheap ruling: **3,970 of the 5,311 are one
ACE sentence** and another 1,075 are swimming, so one decision covers ~95%.

It is item one in `kb/cpl_todos.json` and the 📋 feed.

---

## The three lessons, and why each is more than its bug

- **A gate cannot protect the step that fills it.** G1–G9 all measure staging
  against live, so none can fire on a run that dies before staging is filled.
  ⚠️ **The successful runs were not evidence** — runs 1–3 met a small staging
  table, run 4 met a full one, and staging is full after every success. *A manual
  run tests a state the schedule never sees again.*
  ⚠️ **The fix already existed a few lines away**, written the same day, in
  `map_promote_custom_reports()`'s own comments. *A lesson recorded inside one
  function is not a lesson applied to the pipeline.*
- **Verify a grant by asking the database, not by reading the migration.** The
  `revoke` ran without error and changed nothing. `has_function_privilege` is
  evidence; a clean migration is not. ⚠️ **Check `service_role` holds an EXPLICIT
  grant before revoking PUBLIC** — the identical statement breaks the cron if its
  privilege came only from PUBLIC. All six had one; that was checked first.
  ⭐ The correct idiom was **already in this repo twice**, which is what makes it
  a lint rather than a style preference.
- **A class marked `one rule` must be checked against its own TEXT.** The class
  was built from a *predicate* (zero-unit recommendation) and named after the
  commonest *reason* for it. **Zero units is the mechanism of a deferral, not
  evidence of a denial.** ⚠️ And it is a false zero **nobody can report** — a
  college told the door was closed never files feedback about it.

---

## Carryover

- **Watch the 13:40 UTC run.** Still the proof. It has now been exercised by hand
  twice, including end-to-end on the runner, but never by the schedule firing on
  its own. A `G`-numbered failure is a gate working — **fix the pull, never the
  gate.**
- **Ashley's Delta crosswalk — untouched for four handoffs now.** Record which of
  the 42 Priority-1 rows Delta accepted / rejected / **corrected** into
  `kb/delta_offering_map.json`. The statewide engine's **second occupation list
  is still outstanding** — six sessions, the oldest unpaid debt in the project.
- **The Customer Success team needs the TEAM PHRASE**, not reviewer access.
  Addresses are in handoff 172 §B2. Nothing to set up per person.
- **`CLAUDE.md` is 122,962 / 60,000 (2.05×).** This run paid a little back — the
  clean-up cell is 1,100 chars shorter than it started, and the SkyFetch
  narrative was archived — but the file grew again on net. `docs/INDEX.md` at
  **5.81×** and `docs/roadmap_archive.md` at **2.83×** are the untouched ones.
- Auth `role` column, repo split, GR sensitivity flips, P2 to Pierce and Merced,
  the nine Initiator colleges — all still open, all still on Sam.

---

## Patterns that worked

- **"Watch the next run" means look at the last one.** The queue item was
  forward-looking and the evidence was already on disk. Four minutes of reading a
  failed job log was the whole finding.
- **Read a database log for the same second as an HTTP error.** PostgREST's 500
  said nothing; `postgres_logs` named the cause in one line.
- **Check a protection instead of trusting it.** Writing the seventh copy of a
  `revoke` line was the moment to ask whether the first six worked. They did not.
- **Read what the rows SAY before writing an instruction about them.** Two
  `group by` queries against the raw text turned a ready-to-send instruction into
  a defect and a ruling.
- **Conservation as a cheap check on a reclassification**: 12,283 + 5,311 =
  17,594.
- **Mutation-test the guards.** Four mutations across two test files, all caught,
  including one that showed a check comparing a module against **its own
  constant** — which follows the constant wherever it is pointed. Pin literals.

---

## Safety patterns to honour

- ⚠️ **`revoke ... from anon, authenticated` protects nothing. Name `public`.**
  Rule 10 (b2). And verify `service_role`'s explicit grant first.
- ⚠️ **A load must reproduce its source, not improve it.**
- ⚠️ **A guard test must not be able to fire the guarded action.**
- ⚠️ **Minimisation happens twice** — payload decides what we ASK, loader what we
  KEEP.
- ⚠️ **An RLS-filtered read returns 200 + `[]`.** Empty is not proof of empty.
- ⚠️ **The sandbox cannot reach the MAP API or `*.supabase.co`.** MAP work runs on
  the runner; Supabase goes through the MCP.
- ⚠️ **Rebuilding a gated table by DROP/CREATE re-declares its policy** — check
  the policy after, which is what `G9` does nightly.
- Rule 4 (both HTMLs identical), Rule 1 (change the generator), Rule 5 (never
  force-push `main`), Rule 7 (TOP corroborates, never gates), Rule 10.

---

## Moniker

Session 172 was **SkySwap**. Take **SkyRule** if you take Sam's P5 ruling
through, **SkyClaim** if you finally take Ashley's Delta outcome, or coin your
own.

Next after you: `docs/session_174_handoff.md`.
