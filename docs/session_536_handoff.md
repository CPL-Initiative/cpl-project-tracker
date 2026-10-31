---
title: "Session 536 handoff: Monterey Peninsula 110 to 176 of 197; its last 21"
date: 2026-10-31
session: 535 (SkyGooseberry, the CPL Queue routine's 10:12Z firing)
tags: [handoff, program-requirements, monterey-peninsula, display-build]
status: current
---

# You are Session 536

Your moniker is **SkySugarberry**. Session 535 (SkyGooseberry) was the CPL Queue routine's 10:12Z firing on 2026-10-31. This is a **full checkpoint** (the run wrote a reread receipt). It skipped `README.md`, `kb/README.md` and the pipeline view (nothing they describe moved). No KB note crossed the bar. No decision sheet was built: the one new call (Monterey Peninsula's 60 read as a floor, proceeded on the recommendation with Fable's advice) is on the Progress card with its records, and nothing a lane marks NEEDS-SAM is uncovered.

## What shipped (PR #2609, `claude/practical-meitner-ymz3gx`)

- **Start checks (10:13Z).** S534's #2608 had merged; its display apply (run 41190481502, d8b6c033cfc6) was still running on `main`; 41185213748 (8603831048ac) finished. No open PRs, no `queue_todo_done` rows since 2026-10-30, no new Library requests; the three old regen rows unchanged. The UI pass was already done today (S532).
- **Page read 41192128530** (plan `kb/college_reads/mpc_work_ge_words.json`, five pages, no model call).
- **Monterey Peninsula, 110 to 176 of 197 passing live** (read back 11:02Z), on three steps in `kb/program_requirements_reconcile.json`:
  - new reconcile kind **`or_units`**: a CourseLeaf "or WORK 99" row with no units takes its parent's units (25 records; the state file holds 0.5 for the variable-unit WORK 99);
  - a second Cal-GETC 34 step on the 2026-27 words "Complete Cal-GETC pattern and electives, if needed, for a total of 60 transferable units" (24 transfer degrees; the S396 step's words were last year's);
  - `degree_total_minimum` on "electives, if needed, for a total of 60 degree-applicable units" (13 local degrees; Fable advised the floor).
  - The college's steps read every award now; each degree step names its own `awards`.
  - Reconcile 41192567009 (119 changed), reread 41194846700 (125 posted, receipt committed). Display build 598ff64220dd committed on the branch.

## Open work, in order

0. **PR #2609:** if it is still open, wait for `test` to pass on its head, then squash-merge. Then dispatch `program-requirements-college.yml` with `step=display` on `main` and read back that Monterey Peninsula's rows carry 598ff64220dd. Confirm 41190481502 (d8b6c033cfc6) finished.
1. **Monterey Peninsula's 21** (lessons S535, *Left*). Start with the medical family (03635, 09978, 09979, 22059, 22083), each summing one unit past its printed total: page-read them before any change. The stopping rule counts from this session (S535 moved 66, 33%).
2. **Accept's email (Sheet 146 card 3, *m365*):** waits on RCCD IT granting the mailbox.
3. **The cpl-chat deploy is held for Sam's go** (handoff 530 item 4). Run the preview A/B first.
4. **The CER redesign side lane** keeps `docs/cer_redesign_handoff.md` and owns `exhibits.js` and the CER files. `cer-procedures.md` (20,962) and `sierra-retrieval-corpus.md` (20,821) are over the 20,000 lane budget; `program-requirements-harvest.md` sits at 19,960, so compact before adding.
5. **Carryover:** Sierra's first-text latency; `credential_alignment_for_college`; the college short-name editor and the public page's Contents; the lints' checkout time. Waiting on Sam with no card: whether to repoint the Chancellor's address Library record to its Pages address.

## Read first

`docs/program_requirements_harvest_lessons.md` (*S535*), `docs/reference/lanes/program-requirements-harvest.md` (*Monterey Peninsula*, *The catalog sweep*).

## Lessons to honor

- **A step keyed on last year's words goes quiet** when the catalog is rewritten. When a college's step stops firing, page-read one record before writing a new reader.
- **Group the failures by shape before reading pages:** three shapes covered 62 of Monterey Peninsula's 87.
- **Count passing as the lane does:** `unstated` passes, and coverage and invented must not be false.
- **Don't push to a branch while a workflow on it will commit;** commit locally and push after it lands.
- **This sandbox's `python3` needs `python3 -m pip install openpyxl`** before `kb/_build_roep_display.py` or `scripts/check_generated.sh`.

## Let go

The 10:12Z firing held no artifact watch, check-in or PR subscription. #2609 is the only PR it opened. The CPL Queue routine (`trig_01L8K64ZKYb5eALdT4HW6NAV`) fires hourly overnight; next at 11:12Z, the last of the night at 13:12Z.
