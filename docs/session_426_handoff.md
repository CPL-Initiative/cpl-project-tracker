---
title: "Session 426 handoff: the Common Subjects Reference's Progress view, the procedures store, the daily scan; Sam's eight steps checked against the record"
date: 2026-10-19
session: 425 (SkyMadrone)
tags: [handoff, commons, csr, common-subjects-reference, progress-view, decision-sheet]
status: current
---

# You are Session 426

Your moniker is **SkyTorreya**. Session 425 (**SkyMadrone**, `session_01YHcWFyg3gRxzTw1rjr6zgA`, opened by Sam at
15:15Z on 2026-10-19 with SkyBuckthorn's handoff) checkpointed at about 16:40Z on `claude/blissful-pasteur-o8hp1q`,
at the context meter's WARN (86%). If the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## Sam's words this run (vault braindump `braindump-2026-10-19-1515-finish-the-csr-first-and-the-commons-as-moonshot`)

- 15:15Z: *"I should finish the CSR before moving to CCR, both of which will enable the PR data to be crosswalked and
  adoptable. Can you develop a dash for CSR similar to the one you created for PR?"*; *"Add 'MQ' to the title for
  Discipline"*; *"a CSR dash card for each key step that needs monitoring and stores the procedures needed by agents"*,
  then his eight steps; the prize: *"a nearly fully automated, self-curating and monitoring procedure to maintain the CSR"*.
- Later: *"check my logic and note any gaps or misunderstandings I may have compared to a survey of our KB, Lessons,
  Memory, and CPLBrain ... The Commons is my attempts at bringing all of them together in a prioritized way and
  automating wherever possible to make this moonshot feasible"*. The check is in the lane file's section "Sam's eight
  steps against the record" and in the reply he read.

## What shipped (S425)

- **cpl-project-tracker#2260 (draft, `test` pending at checkpoint):** the Common Subjects Reference tab opens on a
  Progress view drawn by `commons_progress.js` (the Commons' first per-reference view; Sam moved Subjects ahead of
  Exhibit, Course and CR): the headline pair 147 MQ disciplines / 121 settled (confirmed by a person, on the
  authority rule, in no collision), five milestones (You are here: the confirmations, 25 picks left), a card per
  step, `kb/csr_procedures.json` under the cards, the findings. `#canonical-subj4/<filter>` opens the table filtered
  (the Commons' step 3). `kb/_csr_trail.py --latest` runs daily and writes `kb/csr_out/latest.json` with every minted
  identity's code (282 codes, 110 strays on 396 identities). Fixed on the way: the SUBJ check's six false collisions,
  the pick's reviewer read from a later note (eleven entries), the C-ID index skipping 172 descriptors ending in " X".
  "MQ Discipline" on the tab and the Commons row. Tests: `tests/csr_progress.test.js` (69), `tests/csr_procedures_test.py`.
- **New lane:** `docs/reference/lanes/common-subjects-reference.md` (the measured state, the procedures, the logic
  check, six NEEDS SAM items); §11 gained its row; the Commons lane's table points at it.
- **Vault:** the braindump above. The session note and Open Asks Sheet 99 are in flight (below).

## In flight at sign-off (check each first)

1. **#2260:** merge on a green `test` (squash). Then **dispatch `daily-dashboard.yml`** so `kb/csr_out/latest.json`,
   `kb/status/commons.json` and the seed's reviewer fields (the sync fix) rebuild on `main`; the Commons row then
   reads 122 by a person, no cohort.
2. **Open Asks Sheet 99:** six cards from the new lane's NEEDS SAM block (the definition of complete; the cohort
   confirm; the AUTB fix; the agriculture residual; the validate stage; the Title 5-numbered names). If the sheet is
   not published, the vault builder refuses until the cards exist (`CPLBrain/decision-sheets/_build_open_asks_decision_sheet.py`);
   build it, publish with `capabilities: {db: {}, comments: {}}`, put the link in §11's standing-sheet pointer and in
   `kb/status/subjects.json`'s `calls`.
3. **CPLBrain:** the session note `07-session-notes/2026-10-19-s425-skymadrone-csr-progress-view.md` if S425 ran out
   of room; the braindump is committed.
4. S425 held one PR subscription (#2260) at checkpoint and drops it at sign-off.

## Priority after that

1. Sam's rulings on Sheet 99, each recorded in the lane in the same change (the AUTB re-key and the cohort confirm
   are the two with code behind them).
2. The two quarterly routines on a runner, probe mode first: the handbook check (cccco.edu answers; the tab's handbook
   link is dead) and the C-ID and CCN refresh (c-id.net is unreachable from the sandbox).
3. The 110 stray identity codes: the discipline-blank worklist first, then one re-key window under the playbook.
4. The Commons' remaining Progress views (Exhibit, Course, CR), each with its definition of complete on a card; the
   Program Requirements queue (Taft's 38661 removal, Merced's last nine) as handoff 425 left them.

## Patterns that worked

- Measure before the card: every count on the new view came from a file the browser reads, and the one it could not
  (every minted identity's code) moved into the daily scan's file.
- Render the served page, not only jsdom: the hidden toolbar and the seven collisions showed only there.
- A second host for a shared module is sixty lines when the module owns the shape.

## Lessons to honor

- A check must know every sharing by design (umbrella codes, a mutual fan-in, an alias family) or it over-reports.
- A field's provenance stays with the field: the pick's reviewer is the code row's, never a later note's.
- `pkill -f` with a pattern that appears in your own command kills your own shell (exit 144), twice.

## Not refreshed this checkpoint

- The UI pass (no room for a fix PR; the ledger keeps `cobi:library` due), the Pipeline tab (the M-ID pipeline did
  not move), no KB note (the learnings are in `docs/commons_lessons.md` S425).
- `kb/status/exhibit.json`, `course.json`, `cr.json`: untouched; `subjects.json` stamped S425.
