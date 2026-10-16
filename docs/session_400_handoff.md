---
title: "Session 400 handoff: wave 5's display apply, the three rereads and Merritt, the next build"
date: 2026-10-16
session: 399 (SkyRowan)
tags: [handoff, program-requirements, catalog-sweep, display-build, sierra]
status: current
---

# You are Session 400

Your moniker is **SkyBirch**. Session 399 (**SkyRowan**, `session_01TeW1k2AhhzBeUfpd8rxRy9`) was opened by Sam by hand on
2026-10-16 with handoff 399. If the CPL Queue routine started you, follow `docs/reference/scheduled_sessions.md` first. The
routine now fires hourly from 10:12 PM to 6:12 AM Pacific (Sam set it at 17:56Z).

## What shipped (S399)

- **Sierra lists every statewide exhibit by program area, on production.** #2164 merged; the A/B on `main` (run 38936738312)
  was clean (production failed 5 assertions, all smoke mode 7w; the candidate passed every mode). Sam's go on Open Asks Sheet
  85 card 7; `cpl-chat-deploy` run 38943025631, then `cpl-chat-smoke` 38943211844 green with 7w.
- **Open Asks Sheet 85** (https://claude.ai/artifact/5q9urLR8X9y6vokcppgDFk) answered whole; the lanes record each ruling
  (#2166) and the vault's builder holds no card (CPLBrain#361). No sheet is open. Sheet 86
  (https://claude.ai/artifact/LHCRpx3TNoh79Z4Hqm6Dgu) was published with card 1 alone and closed unanswered when Sam saved the
  schedule himself; never republish onto either.
- **Wave 5 of the catalog sweep, ten curriQunet colleges** ($37.87): College of Alameda 59, Feather River 44, Imperial Valley
  83, Laney 150, Las Positas 20 and Madera 98 loaded unchecked, with dated reads and build `9c74da80bad7` (8,524 programs,
  #2168). Merritt read whole (81 of 81, 68 passing, $6.13).
- **#2167, the curriQunet reader's catalog choice:** a start page's `_getNavigation?id=0` is skipped; "Catalog" in a host's
  `_getCatalogs` title is set aside like the year (Berkeley City 10327, Butte 14, Gavilan 19344; page read 38942920358).
- **#2165:** the Sierra lessons doc compacted to 54 KB (ten sections to `docs/cpl_assistant_lessons_archive_2.md`).

## Decisions Sam made this run

- **Open Asks Sheet 85, 17:50-17:51Z, all his own call** (`cpl_memory` `sam-sheet-85-rulings-2026-10-16`, verified): 2 keep
  the carry; 3 Cerritos's 60 a minimum; 5 Orange Coast's GE at most 21; 6 Monterey Peninsula's GE 24 to 34; 7 deploy Sierra.
  Card 4, his words: *"Leave both as read and showing and flag rather than send to college for follow up"* (Victor Valley
  37006, 38352: unchecked, shown, flagged incomplete; no college draft).
- **The routine's schedule (card 1):** he set `CRON_TZ=America/Los_Angeles 12 22,23,0,1,2,3,4,5,6 * * *` himself at 17:56Z with
  the Routines form's Custom entry; a session cannot edit a routine made in the form.

## In flight at sign-off (check each first)

1. **The display apply of `9c74da80bad7`**, dispatched on `main` at 18:34Z (`program-requirements-college.yml`,
   `step=display`). It takes 30-40 minutes. Look for its "Applied record" commit on `main`
   (`git log origin/main --grep 'Applied record' -1`); never read the job log for status.
2. **Rereads of Berkeley City, Butte and Gavilan** on `claude/s399-<college>` (main merged in, so #2167's reader), dispatched
   18:32Z with `extract=1`. Poll with `git ls-remote origin 'refs/heads/claude/s399-*'`; read each
   `kb/program_requirements_college/<slug>/summary.json`; dispatch `step=load` on the branch for each that found programs.
3. **Merritt's load** on `claude/s399-merritt`, dispatched 18:32Z; its receipt commit lands on the branch.

## Priority, in order

1. Confirm the three in-flight items above.
2. **The next display build:** a branch from `main` merging Merritt and the rereads that loaded; dated reads for them through
   the Supabase MCP (`registry_read.json`; `map_cr_by_course.json` from `map_cr_by_course.sql`; MAP holds 165 coded rows at
   Merritt, 16 at Berkeley City, 8 at Gavilan, none at Butte); `python3 kb/_build_roep_display.py`; merge on green `test`;
   dispatch `step=display` on `main`. Compute the md5s in two CTEs (counts, titles): a lateral join to titles repeats codes.
3. **Procedure records** for wave 5 and for Santa Ana, Rio Hondo and Saddleback (`kb/_program_source_procedure_v1.py`).
4. **Las Positas reread** (20 of 201: two ECONNRESETs mid-walk).
5. **The next wave:** the census's eLumen colleges (Antelope Valley, Columbia, Lake Tahoe, Marin, Redwoods, Siskiyous,
   Lemoore; Contra Costa and Los Medanos share Diablo Valley's district and may share its gap).
6. **Sierra follow-ups:** render the Fact Sheet's baked statewide title lists from `fact-sheet/statewide_catalog.json`;
   retire the April vault note `map-exhibit-analysis.md`; curate the 22 "Other Statewide" exhibits.

## Patterns and safety

- `git add`, then `bash scripts/check_generated.sh`, before every push; #2167's `lints` failed once without it.
- A free page read with `network: true` shows a curriQunet host's calls and catalog list; hand its log to a subagent.
- Never `git fetch --prune` every branch; fetch the one you need.
- The repo's Supabase guard blocks UPDATE through `execute_sql`; a denial is a hold.

## Not refreshed this checkpoint

The Pipeline tab (step 7): no phase moved. The UI pass (step 9): no room for a fix PR at the context left; the ledger keeps
its view due. No decision sheet: nothing waits on Sam.

## Subscriptions and check-ins

S399 drops every PR subscription and its 19:09Z check-in (`trig_016xrCMCU8UVrAUb85qfUTvt`) at sign-off, and holds no artifact
watch it keeps (Sheets 85 and 86 armed watches at publish; both are closed).
