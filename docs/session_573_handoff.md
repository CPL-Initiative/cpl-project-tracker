---
title: "Session 573 handoff: the cert link's NWCG and SWRCB families; Columbia's full read is next"
date: 2026-11-04
session: 572 (SkyBlackEye, the CPL Queue routine, 2026-11-04 13:12Z firing)
tags: [handoff, scheduled-sessions, cer-procedures, program-requirements-harvest]
status: current
---

# You are Session 573

Your moniker is **SkyNeedle** (galaxy names, Sam at S540; the Needle Galaxy, NGC 4565, edge-on in Coma Berenices). S572
was the night's eighth CPL Queue firing (05:12 Pacific, 13:12Z). Its checkpoint was **light**: no lane changed state and
the run wrote no data. It refreshed the cer-procedures lane (now 19,995 bytes, under its 20,000 budget) and its lessons,
the index (one history bullet moved to the archive), this handoff, the vault note and the program-requirements status
file. It skipped the Roadmap row, `kb/README.md`, `README.md`, the KB notes and the pipeline viz, and left
`kb/status/exhibit.json` to the daytime Exhibits lane. One `cpl_memory` row: `cert-link-nwcg-swrcb-2026-11-04` (proposed).

## What S572 did

- **Start:** S571's #2761 had a passing `test` and had been idle 50 minutes, so S572 merged it. No other session was live.
  There were no to-do marks, Library briefs, rule requests or re-analysis requests. The two regen rows were unchanged
  (ELL IET V3 waits on Sam; IACA has no note). Sheet 160's one reply was already applied. The day's SLO read, credential
  slice and UI pass had already run.
- **Two cert-link families (#2762):** the State Water Resources Control Board's titles read like courses, but each one's
  exhibits name a grade certification, which holds the Board's ungraded operator row (11 titles). NWCG adds *Wildland Fire
  Chainsaws (S-212)*. **12 titles now hold 4 certs**, and the link holds 271 titles to 226 certs. What was left out is in
  `docs/cer_v2_redesign_lessons.md` (SkyBlackEye).

## Open work, in order

1. **#2762** (the families and this checkpoint): merge on a passing `test` if still open.
2. **Step 0 and step 11, on the 2026-11-05 UTC day:** the dashboard dispatch on the night's first firing, then
   Columbia's full read on #2754's branch (its trial parsed 12 of 12). Run `next_slo_colleges.py` **on main**. It still
   prints Columbia as a trial there, so write the full read's `.run` anyway (`catalog=columbia` with `parts=`). Run one
   preparation run beside it, on another host.
3. **Credential slice, 2026-11-05:** Google, Microsoft, Amazon Web Services, IBM, Oracle, Cisco, NVIDIA.
4. **UI pass, 2026-11-05:** `ui_pass.py --next` names **funding-model**.
5. **Cert link:** the named families are done. Measure the remaining gap by issuer before choosing another; most of what
   remains is courses and apprenticeship committees, which have no catalog certs. If nothing pays, say so in the lane and
   stop the family work.
6. **Contacts harvest:** the first Sunday firing (2026-11-08 UTC) reads the 15 colleges read longest ago.
7. **Commons and Library:** as handoff 568 lists them. Once Sam approves ELL IET V3
   (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3), run `scripts/library_page.py`.
8. **Small and carryover:** as handoff 566 lists them. `CLAUDE.md` is at 60,641 bytes against 60,000; a session Sam
   opens trims it.

## Lessons to honor

- **Read `raw_variants` before calling a title a course.** The Board's *Water Treatment 1* is a T2-to-T5 certification.
- **A course is not a position.** NWCG's S-130/S-190 is the training for *Firefighter Type 2*; the position needs a task
  book too, so the course title stays unlinked.
- **The session may lack `openpyxl` and `pytest`.** `python3 -m pip install openpyxl`; run Python guards with
  `python3 -m unittest`.

## Let go

S572 holds no PR subscription, check-in or artifact watch. Open: #2754 (Columbia; its branch is free for the full read)
and #2762, which merges on a passing `test`.
