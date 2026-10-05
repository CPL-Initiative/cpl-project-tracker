---
title: Session 324 handoff — the pilot finds 16 of 20 pages and drafts its first records (7 of 16 pass); widen the record shape, then Miramar
date: 2026-10-04
session: 323 (SkyHarvest)
tags: [handoff, program-requirements-harvest, pilot, edge-function, extraction]
status: current
superseded: true
superseded_by: session_332_handoff.md
---

# You are Session 324

Your moniker is **SkyGrader**. SkyHarvest (S323, `session_01Skri3rJs2fs3chfXcHvrYt`) built Phase 1 of the
program requirements harvest on draft **PR #1844** (branch `claude/skyharvest-session-323-kvxhgk`, head
after this checkpoint): the 20-program sample, a capture pass that found 16 of the 20 programs' pages, an
extraction pass through a deployed Edge Function, and the scorer. Nothing in it writes to any table.

## First, in this order

1. **Read Sam's replies on open-asks sheet 27** ([Vhc8F8kDntLczhDeVdsdxu](https://claude.ai/artifact/Vhc8F8kDntLczhDeVdsdxu);
   the ArtifactData tool's `list` on collection `replies`). At S323's end it held none: its two cards (paste
   the two memory receipts; the six catalog addresses, which the repo's Supabase guard refused from a
   session) still wait on him. Never route a guarded write around the guard.
2. **PR #1844's state.** It is a draft you own: drive it green (CI on the head, `lints` included). It merges
   when `test` succeeds on the head (branch policy); the pilot is not done at merge, the branch is.
3. **Record shape, version 2** (the Edge Function, `kb/_program_requirements_score.py` and the tests, in one
   change). Extraction run 1 (37167619551) passed 7 of 16; the model's own notes name each failure:
   - noncredit programs state **hours**, not units (Cerritos Energy Corps, Mt. San Antonio Vocational
     Nursing, Riverside Food Service, West Los Angeles appraiser): add `program.measure` (`units` | `hours`);
     with hours, course `units` hold hours and the closed list's 0 units are never used;
   - a **choice between whole blocks** (Cerritos Ironworker: Reinforcing or Structural; Mt. San Antonio ECE
     and LVN-to-RN sequences): add `block.option_group`; blocks sharing one are alternatives, and the scorer
     spans the group from its smallest to its largest block;
   - **block totals the catalog prints** ("6-22 units", List B "6-7"): add `block.stated {min,max}`; use it
     when a block's course units are missing or the rule picks units;
   - a **printed unit range beside a course** (MICR 1 "4-5"): add `units_max`;
   - **alternatives** become objects `{code, units, catalog_addition}` (Riverside SOC-48 was an unflagged
     addition); keep the scorer reading the old string form too;
   - prompt line: write every code with its subject ("CHLD 67 & 67L" is CHLD 67 and CHLD 67L).
   Redeploy with the Supabase MCP (`deploy_edge_function`, verify_jwt **false**, as the function's header
   says), then touch `kb/_program_requirements_extract.py` and push: its workflow reruns all 16 (about
   $0.75). Read the log with a subagent that saves it byte for byte (`get_job_logs`, `tail_lines: 100000`;
   without it the tool keeps 500 lines).
4. **Miramar (0 of 4).** Its curriQunet program views open (URL `.../20004/20338`) but their page text names
   no listed course, and the click-through then wanders into the site's "Academic Requirements" menu. Each
   view carries "Export Page as PDF" for its own outline (`Catalog/Export?id=71&outlineId=20004`): read that
   export through `read_pdf()` (robots first) once the program's view is reached, and stop clicking there.
5. When all 20 pass the three automatic bars, give Sam the 20 records to check (his sheet-25 call, the
   fourth bar) as a decision sheet.

## What shipped (PR #1844, draft)

- `kb/program_requirements_pilot_sample.json`: 5 colleges x 4 shapes, each pick's reason.
- `kb/_program_requirements_pilot.py` + `program-requirements-pilot.yml` (capture; the census's reader:
  robots first, 4 s between loads; anon key; a newer run queues). Run 4: 16 of 20 found.
- `kb/program_requirements_pilot/sources/*.json`: the 16, filed byte for byte from run 4's log.
- `kb/_program_requirements_extract.py` + `program-requirements-extract.yml` (extraction; reads only the
  fixtures; service key only to call the function; never on a schedule).
- `chatbox/supabase/functions/program-requirements-extract/index.ts`: **deployed, version 1** (Opus 5.5,
  effort high, structured output, default refusal fallbacks; reads no table, writes nothing; the
  cpl-news-harvest caller check).
- `kb/_program_requirements_score.py`; `tests/program_requirements_pilot_test.py` (103 checks, in
  `js-tests.yml`; it re-reads every filed fixture with today's matcher).

## Measured

- Capture run 4: Cerritos 4/4, Mt. San Antonio 4/4, Riverside City 4/4 (curriQunet by click), West Los
  Angeles 4/4 (its 358-page PDF read through pypdf; the district's 403 did not recur), Miramar 0/4.
- Extraction run 1: 7 of 16 pass; $0.7297 in all, $0.046 a program; 6 to 20 s a call.

## Safety patterns

- ⚠️ `check_generated.sh` after `git add`, gated on its own exit code (never `| tail`): the dependency map
  reads tracked files only.
- ⚠️ A push to the pilot or extract workflow paths starts a run that reads college sites or spends model
  tokens. Cancel a run you know carries a bug.
- ⚠️ The Supabase connector stalls on statements naming drop, delete, revoke or truncate, quoted prose
  included.
- ⚠️ Context: S323 checkpointed at 128K tokens left.
