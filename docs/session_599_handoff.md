---
title: "Session 599 handoff: Palomar re-capturing after host errors; Coalinga extracting; Los Medanos captured"
date: 2026-11-07
session: 598 (SkyAndromeda, the CPL Queue routine's 11:12Z firing, 2026-11-07)
tags: [handoff, program-requirements-harvest, cpl-scheduled]
status: current
superseded: true
superseded_by: session_604_handoff.md
---

# You are Session 599

Your moniker is **SkyTriangulum** (galaxy names).

This checkpoint was **light**: one lane file moved (`program-requirements-harvest`), no §11 row changed state, no
re-mint, no data receipt. Skipped: `kb/README.md`, `README.md`, KB notes, the pipeline view, the other status files, the
decision sheet rebuild (no card changed; Open Asks Sheet 166 has no replies), `cpl_memory` (nothing durable).

## What shipped

1. **Palomar: not extracted.** Capture 42359155179 found 274 of 331 against the filed 282. The 8 lost programs (7 passing)
   are the 8 pages in `curriqunet.errors` (timeouts and a 503), and an extraction files the new set in place of the old.
   Re-capture 42367400072 dispatched at 11:15Z (free).
2. **Coalinga:** capture 42363219841 found 55 of 62, none lost; extraction 42367397839 filed the two Administration of
   Justice awards 07958 and 30887, both passing ($0.14), so 45 of 62 pass (was 42). Load dispatched on the branch at 11:27Z.
3. **Los Medanos:** free capture 42367472028 on `claude/sweep-los-medanos` (lmc.elumenapp.com, its own host; 29 of 97
   passing on the old eLumen reader).
4. Steps 5 to 7 and 9: no to-do marked done, no new Library brief, no CER rule or re-analysis request; the three Library
   revise requests stay with the Library side lane (`docs/library_handoff.md`). Today's SLO slot, credential slice and
   UI pass were already taken by earlier firings.

## Open work, in order

1. **Merge this checkpoint's PR** on a green `test` if it has not merged.
2. **Coalinga:** confirm the load on `claude/sweep-coalinga` inserted the 2 new programs, then build the display on the
   branch (`kb/_build_roep_display.py`) and `step=display`; merge the branch on a green `test`.
3. **Palomar:** when 42367400072 files, check `curriqunet.errors` is empty and the 8 (40047, 05196, 33826, 40622, 40048,
   30605, 36862, 35243) are found again. Then extract only what `would_extract` lists, load, and `step=reread` if it sent
   loaded programs. If the host errors again, wait a night before the next capture.
4. **Los Medanos:** read 42367472028's preview against main's (found, lost control numbers, host errors), then as Palomar.
5. **SLOs on 2026-11-08 UTC:** Contra Costa's full read on #2873 (`catalog=contra_costa`, `parts=2`, `run=` the date),
   then `python3 scripts/next_slo_colleges.py --next --skip contra-costa` for one preparation run.
6. **The contacts harvest** runs Sunday 2026-11-08 (step 8): 15 colleges read longest ago.
7. **The credential watch's next slice** (step 10, 2026-11-08): the 7 issuers whose `_issuers_read` is oldest.
8. **The UI pass on 2026-11-08:** `ui_pass.py --next` (names `veteran-sprint-map`).
9. **Security** (`org-phrase-scope-auth`): read `team_pass_attempts` after the first real failed unlock; steps 3 to 6
   and the role column wait on Sam.
10. **Lanes worked this week that wait**, by slug: `commons`, `common-subjects-reference`, `map-users-student-contact`
   (Sunday's harvest, item 6). Daytime UI and funding lanes carry NEXTs that are Sam's to steer or wait on him:
   `college-district-identity`, `common-cr-reference` (Sam works the head), `csm-workspace`, `eacr-exhibit-cr-adoption`,
   `governance-team-enablement`, `implementation-funding` (the memo's opening waits on his paste, Sheet 129 card 1). The
   Library side lane's own: `my-college-action-page`, `cer-procedures`, `local-course-cr-alignment`,
   `reviewer-session-lifetime`, `sierra-retrieval-corpus` (`docs/library_handoff.md`).

## Decisions Sam made this run

None.

## Lessons

- Compare a capture's lost control numbers with its host errors before extracting: a flaky host looks like a reader
  regression, and a read replaces the filed set.
- After the eLumen reader upgrade, the low-pass eLumen colleges (Los Medanos, Columbia, Redwoods) are the cheapest
  next re-captures.

## Let go

This firing holds no PR subscription, check-in or artifact watch. Open PRs at sign-off: #2873 (Contra Costa, full read due
2026-11-08) and this checkpoint's PR. Runs in flight: 42367397839 (Coalinga), 42367400072 (Palomar), 42367472028 (Los
Medanos). Open Asks Sheet 166 (https://claude.ai/artifact/3FsBDnx8buBKwoZUxzQAa4) is current.

> *Greetings, you are SkyTriangulum (Session 599), see SkyAndromeda's handoff — `docs/session_599_handoff.md` — let's keep rolling with our queue.*
