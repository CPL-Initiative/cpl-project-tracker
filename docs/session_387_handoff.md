---
title: "Session 387 handoff — Sheet 78 waits; Southwestern and Fresno City captured"
date: 2026-10-14
session: 386 (SkyElm)
tags: [handoff, program-requirements, my-college, ui-pass, decision-sheet]
status: current
---

# You are Session 387

Your moniker is **SkyMagnolia**. Session 386 (**SkyElm**, `session_01RbhKWw7heZsGFd7Q2aHhBG`) ran on Sam's greeting
and heard nothing more from him. `list_sessions` first and agree one writer.

## What shipped (S386)

- **#2096:** Palo Verde's noncredit programs read on a runner (college page read 38491285062). The reader is right; the
  catalog names the courses differently from the state file (High School Equivalency NBE031-034 vs GED031-034; Developing
  Capable Youth a 2021-22 credit page, CHD120/227, vs NBE 120/227; Child Care and Arts - ECE have no page). Modesto Junior
  (v1) and Palo Verde (v3) procedure records written through `program_source_procedure_set`, receipts
  `kb/receipts/program_source_procedure_*_s386.sql`.
- **#2097:** My College reads `program_record_college_items` a page at a time (Cerritos 577 rows against about 4 MB).
- **#2098 + CPLBrain #338:** Palo Verde's no-total pages print the degree total with general education, as Cabrillo's do
  (79 records fail arithmetic); Southwestern (220 of 233) and Fresno City (237 of 251) captured with no model calls
  (previews on `claude/s386-southwestern`, `claude/s386-fresno-city`); two NEEDS SAM markers; **Open Asks Sheet 78**.
- **#2099:** the UI pass on the Common Subjects Reference: five color pairs to First Light tokens, 159 controls to
  24px (merged after the checkpoint commit).

## Decisions Sam made this run

None. Sheet 78 is unanswered: [Open Asks Sheet 78](https://claude.ai/artifact/C7yerEAqAaTosz6XvzLv9Z) (current).

## Priority, in order

1. **Read Sheet 78's replies first** (`ArtifactData` list `replies`). Both cards spend model calls, which no receipt
   reverses, and every extraction so far had Sam's own go: **hold both until he answers, a scheduled session included.**
   - Card 1 *both*: dispatch `program-requirements-college.yml` (`step read`, `extract 1`) on `claude/s386-southwestern`
     and `claude/s386-fresno-city`; then load, add each to the builder's dated reads, build and dispatch the display
     (standing go), and write each college's procedure record v1.
   - Card 2 *both figures*: the extraction records the degree total and the general education block, the scorer checks
     blocks + GE against the degree total, then re-read the 79 (Cabrillo 58, Palo Verde 21). *Wording only*: change
     "The catalog prints no program total" in `kb/_build_roep_display.py`, `cpl_pathways.js` and Sierra's prompt
     (`chatbox/supabase/functions/cpl-chat/index.ts`, a deploy) to say the record carries no major total.
   - Answering a card drops its NEEDS SAM in the harvest lane in the same PR.
2. **The Records view's first college pick** (`college=in.(...)`) has still never run live: read `edge_logs` when one does.
3. **Card 1's key on Annual Goals:** confirm on the next save that the message says *within about 10 minutes*.

## Docs to read

`docs/reference/lanes/program-requirements-harvest.md` · `docs/program_requirements_harvest_lessons.md` (S386) ·
`docs/college_action_page_lessons.md` (S386) · `CPLBrain/decision-sheets/decision_sheets.md`.

## Patterns that worked

- **A college page read is how a session sees a page.** The run artifact's download host is refused by the proxy; push a
  plan under `kb/college_reads/` and read the job log.
- **Two captures run at once on two branches** cut from main (per-ref concurrency, different hosts), about 37 minutes.
- **Compose a procedure record on the stored one in SQL** (`cur.p || jsonb_build_object(...)`) to keep the prior version
  byte for byte under the md5 guard.
- **A stand-in read must be proven:** an a11y seed waits for the element its stand-in feeds.
- **A tab's `<style>` in the body beats a head-injected sheet** at equal specificity: fix colors in the rule (both HTMLs).

## Not refreshed this checkpoint

The pipeline viz (7): the M-ID pipeline did not move. `kb/README.md` and `README.md`: no structure or surface change.

## Subscriptions and check-ins

S386 holds no PR subscription (#2096-#2100 merged) and no check-in. Sheet 78's artifact watch was reported arming and was
never confirmed.
