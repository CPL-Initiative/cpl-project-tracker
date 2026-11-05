---
title: "Session 569 handoff: the cert link's FAA family; Columbia's full read is next"
date: 2026-11-04
session: 568 (SkyMalin, the CPL Queue routine, 2026-11-04 09:12Z firing)
tags: [handoff, scheduled-sessions, cer-procedures, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_577_handoff.md
---

# You are Session 569

Your moniker is **SkyAntennae** (galaxy names, Sam at S540; the Antennae, two galaxies colliding). S568 was the night's
fourth CPL Queue firing (01:12 Pacific, 09:12Z). Its checkpoint was **light**: no lane changed state and the run wrote
no data. It refreshed the cer-procedures lane and its lessons, the index, this handoff, the vault note and the
program-requirements status file. It skipped the Roadmap row, `kb/README.md`, `README.md`, the KB notes and the
pipeline viz. It also left `kb/status/exhibit.json` alone, because the daytime Exhibits lane writes that file. One
`cpl_memory` row: `cert-link-faa-family-2026-11-04` (proposed).

## What S568 did

- **Start:** no other session was live. The only open PR was #2754 (Columbia's trial, last updated 06:24Z). There were
  no to-do marks, Library briefs, rule requests or re-analysis requests. The two regen rows were unchanged: ELL IET V3
  waits on Sam, and IACA has no note. S565 had already used the day's (2026-11-04 UTC) SLO read, credential slice and
  UI pass.
- **The cert link's next family (handoff 566's carryover):** the session measured unlinked reference titles by issuer,
  and the FAA was the largest group (37). #2758 adds an `FAA` hand table: **11 titles to 15 certs**, and the link now
  holds 219 titles to 180 certs. Flight labs and ground schools stay out. CFI, the Part 137 certificate and the Part 107
  + POST bundle stay out until the catalog lists them. The guard is `FaaCerts`.
- **Main's generated artifacts:** the statewide catalog and the discipline-blanks worklist read STALE in
  `check_generated.sh` on main too. That is cron output, so the session left them alone.

## Open work, in order

1. **#2758** (the FAA family and this checkpoint): merge on a passing `test` if still open.
2. **Step 11, on the 2026-11-05 UTC day:** Columbia's full read on #2754's branch (its trial parsed 12 of 12). Run
   `next_slo_colleges.py` **on main** (it still prints Columbia as a trial there, because the trial's verdict is not
   filed; write the full read's `.run` anyway, `catalog=columbia` with `parts=`). Run one preparation run beside it, on
   another host.
3. **Credential slice, 2026-11-05:** Google, Microsoft, Amazon Web Services, IBM, Oracle, Cisco, NVIDIA.
4. **UI pass, 2026-11-05:** `ui_pass.py --next` names **funding-model** (last pass 2026-10-29).
5. **Cert link, next families by gap:** ASME pipe-welder qualifications (8 titles, 1 catalog row), Autodesk (7, 9),
   NFPA (7, 1), NCCER (7, 13). Lessons: `cer_v2_redesign_lessons.md`, SkyMalin.
6. **Contacts harvest:** the first Sunday firing (2026-11-08 UTC) reads the 15 colleges read longest ago.
7. **Commons and Library:** as handoff 568 lists them. Sam's daytime sessions own the List work. Once Sam approves
   ELL IET V3 (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3), run `scripts/library_page.py`.
8. **Small and carryover:** as handoff 566 lists them. `CLAUDE.md` is at 60,641 bytes against 60,000, and a session
   Sam opens trims it.

## Lessons to honor

- **Read every issuer spelling before you build a hand table.** The catalog lists the FAA twice.
- **Leave a title out instead of giving it a false reason.** An empty cert list prints *names no one certification*.

## Let go

S568 holds no PR subscription, check-in or artifact watch. Open: #2754 (Columbia; its branch is free for the full
read) and #2758 (the FAA family and this checkpoint), which merges on a passing `test`.
