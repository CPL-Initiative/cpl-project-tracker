---
title: "Session 565 handoff: a Confirmed by a person count beside ready on the Course page and card"
date: 2026-11-03
session: 564 (SkyHoag, the CPL Queue routine, 2026-11-03 13:12Z firing)
tags: [handoff, commons]
status: current
---

# You are Session 565

Your moniker is **SkyMayall** (galaxy names, Sam at S540; Mayall's Object, two colliding galaxies). S564 was the night's
last CPL Queue firing (05:12 Pacific). It ran a **light checkpoint**. The commons lane's NEXT moved, so its lane file,
lessons doc and run log (`kb/status/course.json`) were refreshed. It skipped the Roadmap row (state unchanged), the KB
note, `kb/README.md`, `README.md`, the pipeline viz, the `cpl_memory` rows (nothing durable beyond the lessons doc), the
program-requirements stamp (no harvest work) and the routine's `next_run_at` (no `get_trigger` in this session).

## What S564 did

- **Start:** the only open PR was #2717 (Las Positas's SLO branch, in flight since 07:20Z), so no session was live. There
  were no to-do marks, Library briefs, rule requests or open re-analysis requests. The regen rows are unchanged (the ELL
  IET draft waits on Sam; IACA's has no note), `csm_log` is empty, and no sheet is open.
- **Sheet 160's build (#2726):** the *Confirmed by a person in SkyView* count. `kb/_build_commons_status.py` writes
  `facts.confirmed` (812 of 27,581 cards; 542 identities; 126 also ready) and `facts.confirmed_ready` on the course row,
  plus a clause in its pair words. A confirmed card is one whose save in `kb/coci_curation.json` names a person, not an
  `@bot` cohort. COCI Lookup's Progress page shows it as a row after *Ready*, and the headline stays *ready*. The guard is
  `tests/coci_progress.test.js` (33 checks).

## Open work, in order

1. **Step 11, on the 2026-11-04 UTC day:** Las Positas's full read on #2717's branch
   (`python3 scripts/next_slo_colleges.py --college las_positas`) and Columbia's trial. That day's first firing (05:12Z)
   also owns the dashboard run, the credential slice and the UI pass.
2. **Commons:** no NEXT is ready to build. The natural next is the same confirmed count for the other four references;
   propose it on the sheet or ask at a session Sam opens. Check the `coci_college_programs` read first when a Progress
   card reads *Could not be read*.
3. **Library:** once Sam approves the ELL IET Version 3 draft (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3), run
   `scripts/library_page.py` and close the request. IACA's request (Crystal Nasio) still has no note.
4. **The CSM Workspace in use:** read `csm_log` for the team's first rows.
5. **Small and carryover:** the cert link's next families; San Jose City's VP emails; Madera's census homepage; the
   Library's stuck records; Accept's email (Sheet 146 card 3); Sierra's first-text latency; MiraCosta's short name;
   `CLAUDE.md` over its budget (doctrine: a session Sam opens trims it).

## Lessons to honor

- **The auditor's cards are not identities.** An M-ID that is also a merge target is scored twice (kinds `C` and `X`).
  Count in cards to keep the page's one denominator, and name the identity count beside it.
- **The curation overlay keeps one reviewer per card**, the latest, so a person-confirmed count read from it is a floor.

## Let go

S564 holds no PR subscription, check-in or artifact watch. #2717 stays open as Las Positas's in-flight branch. S564's own
PR (#2726) merges on a passing `test`; if it is still open, merge it.
