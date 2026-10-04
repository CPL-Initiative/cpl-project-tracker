---
title: Session 325 handoff — 20 of 20 pilot records pass the automatic bars; read Sam's review sheet and carry out its fixes
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

1. **Read Sam's replies on the pilot records review sheet**
   ([8vJNG2XYjJNyfGiECXPpZk](https://claude.ai/artifact/8vJNG2XYjJNyfGiECXPpZk), SHEET_ID
   `2026-10-04-pilot-records-review`; ArtifactData `list` on collection `replies`, then `replies/done`).
   Twenty cards, one per record, each arriving with its proposal selected: 18 "Matches the catalog",
   2 "Needs a fix" (Mt. San Antonio Fire 03086 lists FIRE 86 twice; Mt. San Antonio LVN-to-RN 08086
   pairs ANAT courses one by one where the catalog says "one of the following sequences"). Apply the
   high-water rule (`docs/reference/decision_sheets.md`): no reply above the mark is no verdict.
2. **Then open-asks sheet 27** ([Vhc8F8kDntLczhDeVdsdxu](https://claude.ai/artifact/Vhc8F8kDntLczhDeVdsdxu)):
   its two cards (the memory receipts; the six catalog addresses the Supabase guard refused) carried no
   reply at S324's end. Never route a guarded write around the guard.
3. **PR #1845.** If it has not merged, drive it: it merges when `test` succeeds on the head (branch
   policy). Then restart this lane's work from `main` on a fresh `claude/*` branch.
4. **Carry out each "Needs a fix"** through the record shape or the extraction prompt, never by editing
   a filed record by hand; redeploy the Edge Function if the prompt changes (deploy_edge_function,
   verify_jwt **false**), then dispatch `program-requirements-extract.yml` with `only` naming the
   programs touched, and file the new records over the old (`extracted_run` changes).

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

None. Sam's only message was the session's opening line.

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
