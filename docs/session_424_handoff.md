---
title: "Session 424 handoff: Merced's renumbered courses (154 to 163 of 172 found, 125 to 134 passing), the Knowledge Base portal's UI pass, the Commons' four run logs"
date: 2026-10-19
session: 423 (SkyLaurel)
tags: [handoff, program-requirements-harvest, merced, renumbered-courses, ui-pass, commons]
status: current
superseded: true
superseded_by: session_430_handoff.md
---

# You are Session 424

Your moniker is **SkyBuckthorn**. Session 423 (**SkyLaurel**, `session_01RLr2Yc1jQTBrnqvHR8FgYs`, started by Sam's CPL
Queue routine at 09:12Z on 2026-10-19) checkpointed at about 11:30Z with the full Rule 9 list on the designated branch
`claude/practical-meitner-jg0p00`. If the routine started you, follow `docs/reference/scheduled_sessions.md` first.

## Sam's words this run

None: the routine started this session, and Sam did not write. No card waits on him: Open Asks Sheet 97
(https://claude.ai/artifact/1eWaN6UmVnKaJhGYTqQtfN) stays current and answered, and nothing this run needs his call
(the renumber map is a harvest procedure under his go of 2026-10-17). Rulings in force: Sheet 97 (Build with Grok),
Sheets 94 to 96, the Commons mock-up approval, the 2026-10-17 go, the $40-a-college extraction go.

## What shipped (S423)

- **Merced's renumbered courses (#2253, merged):** two free page reads showed the catalog printing new
  codes for the state file's courses (MECH for AGMA, ANSC and AGBS for AGAS and AGAB, LAND for AGEH, CPSC-17 and -18 for
  DRON 10 and 11), each the same title and units. Merced's `course_renumbers` in `kb/program_requirements_reconcile.json`
  maps 30 pairs, each cited; the capture finds a listed course by its printed code (spaced: `CPSC 17`), the scorer reads
  it as the listed course, and a pair retires once the file lists the printed code. Fable advised a cited map over a
  general title rule and holding out Agriculture Systems 44160 (units differ). The Coursedog reader now keeps the
  catalog's own program list in the account. **Merced 154 to 163 of 172 found, 125 to 134 passing, $0.55; loads
  39239250159 and 39243215660 inserted 9; display build 93edc84cde30.**
- **The UI pass, `cobi:knowledge-base` and `kb-portal` (#2254, merged):** the tab is a frame around `kb-portal/`, which
  no sweep had measured. Three seeded targets now do; the header said "MAP Initiative" (now CPL Initiative); emoji
  controls became words; First Light's light tokens replace the portal's own palette; controls are underlined words.
- **The Commons' step 2:** run logs for Exhibit, Course, CR and Subjects (`kb/status/<id>.json`), each with its lane's
  NEXT; checkpoint step 12 names them.

## In flight at sign-off (check each first)

1. **Merced's display** (`step=display` on `main`, dispatched about 11:35Z after #2253 merged, build 93edc84cde30):
   read its applied record under `kb/receipts/`; a failure is a re-dispatch, never a by-hand apply.
2. **This checkpoint's PR** (#2255, `claude/practical-meitner-jg0p00`): merge once `test` passes on its head.
   CPLBrain's session note (#391) is merged; #2253 (Merced) and #2254 (the portal) are merged.
3. S422's Delta display run (39226995350) succeeded at 10:12Z.
4. S423 held no PR subscription, check-in or artifact watch at sign-off.

## Priority after that

1. **The extraction rows each verdicts file names** (`kb/jev_harvest_verdicts/`): Delta's 8 (07304, 16764, 22244,
   45621, 11970, 19752, 05630, 44197), Taft's wrong-page reads (38661, 38662, 46186, 30284), Cañada's five careers-only
   failures. Read each verdict first: several are page shapes a re-extraction will read the same way.
2. **The second reader** once Sam sets `XAI_API_KEY` and `XAI_MODEL` on the extraction function and it is deployed.
3. **The Commons' step 3:** the deep link behind a count, then each reference's Progress view from the shared module.
4. **The UI pass:** `python3 scripts/ui_pass.py --next` names the view.

## Patterns that worked

- Two free page reads before any code: a near miss read as a reader fault was the college renumbering its courses.
- Fable once, for a rule with nothing to score against (a title match as evidence), recorded in the lessons doc.
- A worktree for a sibling branch (`git worktree add`) kept the UI pass and the Merced reads from crossing.

## Lessons to honor

- `code_pattern()` needs a printed code's subject spaced from its number (`CPSC 17`, never `CPSC17`).
- A tab built around an iframe passes the cobi sweep on its shell; measure the framed page as its own target.
- A local `npm test` runs past 15 minutes here; CI's four shards are the gate.
- An edit anchored on a short CSS selector (`.btn {`) can match an earlier rule (`a.btn {`); anchor on a line start.

## Not refreshed this checkpoint

- The Pipeline tab (the M-ID pipeline did not move), `README.md`, `kb/README.md`.
- No KB note: the run's learnings are harvest-specific and sit in the lessons doc and `cpl_memory`.
