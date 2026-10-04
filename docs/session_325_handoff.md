---
title: Session 325 handoff — Sam passed 18 of the 20 pilot records and ruled two fixes; file the rerun, then Phase 1's last pieces
date: 2026-10-04
session: 324 (SkyGrader)
tags: [handoff, program-requirements-harvest, pilot, edge-function, extraction, decision-sheet]
status: current
---

# You are Session 325

Your moniker is **SkyReader**. SkyGrader (S324, `session_01VC8F4qLkzYMmBcE964Vfpd`) took the program
requirements pilot from 7 of 16 records to **20 of 20 captured and 20 of 20 passing the three automatic
bars**, on **PR #1845** (branch `claude/skygrader-session-324-m9qqbv`). Nothing in it writes to any table.

## First, in this order

1. **Sam answered the review sheet** (2026-10-04 10:22Z, all 20 cards his own call, through 20):
   **18 match the catalog; cards 5 and 6 are fixes**, as proposed. Receipt:
   `kb/program_requirements_pilot/review_2026-10-04.json`. S324 carried out both on branch
   `claude/skygrader-session-324-m9qqbv` (restarted from `main` after #1845 merged): the scorer's
   `repeated` check (a course twice in one block fails) and prompt v3 (sequences read whole;
   **Edge Function deployed version 3**). The rerun is extraction run 37195340082 (`only=086`:
   Mt. San Antonio 03086 and 08086). If its two records are not yet filed under
   `kb/program_requirements_pilot/records/` with `extracted_run` 37195340082, file them (the guard
   fails on the old Fire record until you do), open the PR, merge on a green `test`, and reply on
   Sam's Complete thread on the sheet, then resolve it.
2. **Open-asks sheet 27** ([Vhc8F8kDntLczhDeVdsdxu](https://claude.ai/artifact/Vhc8F8kDntLczhDeVdsdxu)):
   its two cards (the memory receipts; the six catalog addresses the Supabase guard refused) carried
   no reply. Never route a guarded write around the guard.
3. **Then Phase 1's last pieces:** the Miramar PPM sequence (the Program Mapper hosts answered 403 or
   did not resolve) and the Butte College Tech Center's ROE field definitions (Sam asks them); then
   the harvest widens past the pilot.

## What shipped (PR #1845)

- **Record shape version 2** in the Edge Function (**deployed, version 2**), `kb/_program_requirements_score.py`
  and the guard together: `program.measure` (hours), `block.option_group`, `block.stated`, `units_max`,
  alternatives as objects with their own `catalog_addition`; a prompt line that every code takes its
  subject. Arithmetic is `equal` / `unequal` / `incomplete` / `unstated`; `unstated` passes only when the
  record carries no figure, the closed list stores no units, and the catalog text names none.
- **Miramar through its exports**: a curriQunet program view whose text names too few courses has its
  own "Export Page as PDF"; the reader reads it (robots first), keeps it from its top, and stops
  clicking there. Ties among items naming every title word go to the item that begins with the title.
- **Filed:** 20 fixtures (`kb/program_requirements_pilot/sources/`), 20 records
  (`kb/program_requirements_pilot/records/`). The guard (160 checks) re-reads every fixture and
  re-scores every record.
- **The review sheet** (`kb/_build_pilot_records_review_sheet.py` → `docs/visuals/2026-10-04-pilot-records-review.html`).

## Measured

- Capture run 8 (37173160158): Miramar 4 of 4 at coverage 1.0 (run 6 found 4 of 4, run 7 read
  Entrepreneurship's neighbor "Early Education Entrepreneurship" at 0.44 before the tie-break).
- Extraction run 2 (37171952080): 16 of 16, $0.8535; run 3 (37173589029, only Miramar): 4 of 4,
  $0.2762. 19 records `equal`, Mt. San Antonio Vocational Nursing `unstated`.

## Docs to read

`docs/reference/lanes/program-requirements-harvest.md` (current truth), then
`docs/program_requirements_harvest_lessons.md` lessons 27-32, then the KB note
`docs/kb-notes/methodology-a-not-applicable-score-must-be-confirmed-by-the-source.md`.

## Decisions Sam made this run

- 2026-10-04 10:22Z, pilot records review sheet: 18 of 20 records match the catalog; the two
  proposed fixes stand (Fire 03086 lists FIRE 86 twice; LVN-to-RN 08086 reads two sequences course
  by course). Every card his own call, no notes.
- 10:24Z: "I can move to a new session if we don't have room" (S324 had 126K tokens left; it
  closed the fix loop and signed off).

## Patterns that worked

- Read a failing record's own notes before touching the prompt: run 1's nine failures each named a
  field the shape lacked.
- Rescore filed records under a changed scorer before pushing: only the intended result moved.
- A mutation that survives is a test that passes for the wrong reason (the credit-record check failed
  on coverage, never reaching the arithmetic).

## Safety patterns

- ⚠️ `check_generated.sh` after `git add`, gated on its own exit code; the dependency map moves on most
  code pushes.
- ⚠️ A push to the pilot or extract script reruns that workflow (college reads or model spend). Fixture
  and record files trigger neither; dispatch the extraction with `only` for a few programs.
- ⚠️ A job log too large to return inline is saved to a tool-result file: parse it with Python. One
  that returns inline must be transcribed; verify by re-scoring against the fixture and recomputing cost.
- ⚠️ Restore a mutated file from a copy, never with `git checkout --` (it reverts the change under test).
- ⚠️ The Supabase connector stalls on statements naming drop, delete, revoke or truncate.
