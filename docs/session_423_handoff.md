---
title: "Session 423 handoff: San Joaquin Delta's three scorer readings (154 to 195 of 202 passing), Taft's two GE patterns, Sierra Training's UI pass; Merced's unfound programs are next"
date: 2026-10-19
session: 422 (SkyWillow)
tags: [handoff, program-requirements-harvest, scorer, reconcile, reread, ui-pass]
status: current
---

# You are Session 423

Your moniker is **SkyLaurel**. Session 422 (**SkyWillow**, `session_01FA9NWAhrjmVfhswak2WqQq`, started by Sam's CPL Queue
routine at 07:20Z on 2026-10-19) checkpointed at about 09:00Z with the full Rule 9 list on the designated branch
`claude/practical-meitner-eylxja` (merge its PR once `test` passes if it is still open). If the routine started you,
follow `docs/reference/scheduled_sessions.md` first.

## Sam's words this run

None: the routine started this session, and Sam did not write. No card waits on him: Open Asks Sheet 97
(https://claude.ai/artifact/1eWaN6UmVnKaJhGYTqQtfN) stays current and answered, and the sheet's coverage test passes.
Rulings in force: Sheet 97 (Build with Grok), Sheets 94 to 96, the Commons mock-up approval, and his go of 2026-10-17
(harvest calls proceed on their procedures without a card; a write the Supabase guard holds goes through
`supabase-migrate.yml`).

## What shipped (S422)

- **San Joaquin Delta, three scorer readings (#2250):** the program total read as a floor (a reconcile step sets
  `total_units_minimum` on "Minimum Units Required: N" and "Minimum Major Units Required: N"; the scorer passes a sum
  whose low end meets it, nothing else), per-college `prefix_aliases` (ANTH, ENGL, ARTH, COMM printed where the state
  file keeps ANTHR, ENG, ART, COM ST; the extraction, reconcile and second reader all pass them), and a noncredit page
  printing only "Total Contact Hours: N" passes as `equal` with `total_only`. **Live: 195 of 202 Delta rows pass, up
  from 154.** The carry basis (`program_record_carry_basis`) leaves out the new flag, applied through
  `supabase-migrate.yml` (run 39216602991). `reread --extracted-run` (the workflow's `force` input on a reread) posts a
  named run: the two reconciles left two run stamps. Display build 5da99b0af549.
- **Taft's local-degree GE (#2249, merged):** three free page reads found two local patterns (27 units on the GE page,
  18 for the CTE degrees on the Other Associate Degrees page) and no page calling the 60 a minimum. Fable advised against
  passing either record without the catalog's word for a floor. No step; 16725 and 36928 stay failing, and the
  disagreement is the college's.
- **The UI pass, `cobi:sierra-training` (#2251, merged):** the cobi sweep had only measured the First Light greeting;
  a reviewer seed (`seedSierraTraining`, synthetic rows) and four targets now measure the tab. Its controls are underlined
  words; the sign-in copy says About (the header no longer prints "ℹ About"). Clean in both themes at 1440 and 390.
- Headline 11,635 to 11,678 complete of 20,282 active, 113 colleges. No model spend.

## In flight at sign-off (check each first)

1. **cpl-project-tracker#2250** (`claude/s422-delta`): merge once `test` passes on its head, then dispatch
   `program-requirements-college.yml` on `main` with `step=display`, `college=San Joaquin Delta College`, and read the
   applied record under `kb/receipts/`. If #2250 is already merged and no display run followed, dispatch it.
2. **This checkpoint's PR** (`claude/practical-meitner-eylxja`) and **CPLBrain's** (`claude/determined-mayer-eylxja`,
   the session note): merge each once green.
3. S422 dropped every PR subscription at sign-off; no check-in or artifact watch was set.

## Priority after that

1. **Merced's 18 unfound** (8 whose Coursedog page prints few of COCI's listed codes, 10 whose own page the search never
   returned). Start with a free capture-only read (`extract=0`) and read each program's `score` before naming a cause.
2. **The extraction rows each verdicts file names** (`kb/jev_harvest_verdicts/`): Delta's 8 (07304, 16764, 22244, 45621,
   11970, 19752, 05630, 44197), Taft's wrong-page reads (38661, 38662, 46186, 30284), Cañada's five careers-only failures.
   A `force=<control numbers>` read re-extracts them (under the $40 go).
3. **The second reader** once Sam sets `XAI_API_KEY` and `XAI_MODEL` on the extraction function and it is deployed
   (the status file's `calls` carries it). Then `second-reader.yml` with `college=Cañada College`.
4. **The Commons' step 2:** a run log per reference under `kb/status/`, the deep link behind a count.
5. **The UI pass:** `python3 scripts/ui_pass.py --next` names the view.

## Patterns that worked

- A verdicts file grouped by cause names the fix; three scorer readings built from Delta's cleared 41 of its 49.
- Ask whether a new pass shape needs a new status: it never does. `equal` plus a flag keeps the SQL machine-pass check,
  the tab and CPL Pathways reading it.
- A college's catalog read on three narrowing page reads (program page, GE page, degree-types page) before any step.
- Fable once, for a judgment with nothing to score against (a floor from regulation versus the catalog's own word).

## Lessons to honor

- Put every scorer change on the branch before the first reconcile: a reconcile checks out its dispatch commit, takes
  about 25 minutes at Delta, and two in a row leave two run stamps that reread posts one at a time.
- A runner's push (the Actions token) starts no CI: the PR needs a push of yours on its head before `test` reports.
- A new reconcile field must leave `program_record_carry_basis`; the college test fails when it does not.
- Check out the right branch before editing: twice this run a change landed on the wrong branch and moved by stash.

## Not refreshed this checkpoint

- The Pipeline tab (the M-ID pipeline did not move), `README.md`, `kb/README.md`.
- No KB note: the run's learnings are harvest-specific and sit in the lessons doc and `cpl_memory`.
