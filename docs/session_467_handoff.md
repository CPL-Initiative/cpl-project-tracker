---
title: "Session 467 handoff: the funding film follows Scenario 4 (v9); the Veteran map's UI pass and the noncredit builder next"
date: 2026-10-24
session: 466 (SkyYerbaSanta)
tags: [handoff, implementation-funding, funding-video]
status: current
---

# You are Session 467

Your moniker is **SkyHollyleaf**. Session 466 (**SkyYerbaSanta**) was a scheduled run that Sam's routine started at
12:12Z on 2026-10-24. Sam wrote nothing during it. This was a **light checkpoint**: no Roadmap row moved, and the run
wrote no re-mint or data receipt. It skipped `kb/README.md`, `README.md`, a KB note, the Pipeline tab and `cpl_memory`
(nothing durable beyond the lessons section). Read, in order: this file, the S466 section of
`docs/cpl_funding_lessons.md`, and `docs/reference/lanes/implementation-funding.md`.

## Who else is working

This run had no `list_sessions`. At 12:14Z the open PRs and `main` showed no other live session. The three older open
PRs (#2379, #2323, #2257) were last updated on 10-23 or earlier.

## What shipped

- **#2417: the funding film from the published Scenario 4.** `figures.json` was read from the live config (md5 `8452c29a`).
  The s2 page is rebuilt and `20260926_CPL_Funding_in_Motion_Scenario_2_v9.mp4` is rendered; v8 is removed. Access and
  Completion are $10,727,131 each, the target is 3,598.2 FTES, and the deadline reads December 31, 2026. The words
  did not change. `render.mjs` now polls Chromium's DevTools port instead of waiting a fixed 2.5 s. The tests'
  pinned s2 figures are updated (129/129).
- **Found:** Scenario 4's `participationDeadline` is **2026-12-31**. Scenarios 2 and 3 carry 2026-12-30, and the S449
  seed set no date, so the Dec 31 came from the tab, where Sam published. The lane now says Dec 31 for Scenario 4.
  If he meant Dec 30, the fix is one field on the tab and a film rebuild.

## Decisions Sam made this run

None. Open Asks Sheet 122 (https://claude.ai/artifact/PKRBW9ucqKtikxhRtevHrj, current) still waits, and its replies
store was empty at 12:15Z.

## Open work, in order

1. **The UI pass:** if `date -u` reads 10-25 and the ledger has no pass dated today, take the view
   `python3 scripts/ui_pass.py --next` names (the Veteran map) with `/a11y-pass` and its wiring and First Light checks.
2. **Sheet 122 card 1:** read the replies first (`ArtifactData`, collection `replies`). On *list-send*, list the ELL
   IET page publicly and draft one message per project in the Letters tab. On *list*, do the listing alone. Then drop
   the library lane's NEEDS SAM marker in the same PR.
3. **The noncredit builder** (the lane's NEXT): `nc_exh` through the four channels, `nc_cdcp` for every roster
   institution, and `nc_course`. Call its effort first. Building and dry-running it can be undone. Writing its
   output where the public funding page reads it publishes funding figures to colleges, which is on the hold list,
   so put that step on the sheet with the dry-run's totals.
4. **Sheet 121 card 2:** when Sam attaches the four Coordinator Guide files, run
   `CPLBrain/04-projects/cpl-initiative/coordinator-guide/audit_workflow.js` under "ultracode".
5. **`oversized_doc`, 8 left:** `library` 1.33x, `program-requirements-harvest` 1.34x, `common-cr-reference` 1.07x,
   `ccr_atlas_lessons.md` 1.01x, and four archives that split by date, verbatim.
6. **The harvest queue** (Hartnell's noncredit hours, the arithmetic failures, the two S448 offers) waits on Sam's word.

## Lessons to honor

- To render a film here: `CHROME=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome` and
  `FFMPEG=$(python3.13 -c "import imageio_ffmpeg as f; print(f.get_ffmpeg_exe())")`. `npm install` first for jsdom.
- `build.py --check` always lists differences from the *typed* values. To see what a new config moved, run
  `funding_video_figures.js --check` instead.
- A large `execute_sql` result is saved to a file wrapped in `{"result": "...<untrusted-data>...[{...}]"}`. Parse
  the outer JSON before slicing out the rows.
- `check_generated.sh` reports *statewide catalog* and *discipline blanks worklist* STALE here because openpyxl is
  missing; `main` shows the same.

## Let go

At sign-off this session drops its watch on #2417 (merged once `test` is green) and holds no check-in or artifact
watch.
