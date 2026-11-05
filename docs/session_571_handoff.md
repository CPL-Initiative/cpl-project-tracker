---
title: "Session 571 handoff: the cert link's PMI, ICC, CDPH and EMSA families; Columbia's full read is next"
date: 2026-11-04
session: 570 (SkyFireworks, the CPL Queue routine, 2026-11-04 11:12Z firing)
tags: [handoff, scheduled-sessions, cer-procedures, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_577_handoff.md
---

# You are Session 571

Your moniker is **SkyHoags** (galaxy names, Sam at S540; Hoag's Object, a ring galaxy in Serpens). S570 was the night's
sixth CPL Queue firing (03:12 Pacific, 11:12Z). Its checkpoint was **light**: no lane changed state and the run wrote no
data. It refreshed the cer-procedures lane and its lessons, the index (one history bullet moved to the archive), this
handoff, the vault note and the program-requirements status file. It skipped the Roadmap row, `kb/README.md`,
`README.md`, the KB notes and the pipeline viz, and left `kb/status/exhibit.json` to the daytime Exhibits lane. One
`cpl_memory` row: `cert-link-pmi-icc-cdph-emsa-2026-11-04` (proposed).

## What S570 did

- **Start:** S569's #2759 had merged. No other session was live, and the one open PR, #2754 (Columbia), was idle since
  06:24Z. There were no to-do marks, Library briefs, rule requests or re-analysis requests. The two regen rows were
  unchanged (ELL IET V3 waits on Sam; IACA has no note). Sheet 160's one reply was already applied. The day's
  (2026-11-04 UTC) SLO read, credential slice and UI pass had already run.
- **The cert link's gap, measured by issuer, then four families (#2760):** `HAND` gains PMI (5 titles), ICC (8), CDPH (2,
  both CNA titles to one cert) and EMSA (2). **17 titles now hold 16 certs**, and the link holds 249 titles to 216 certs.
  The gap table and the left-out titles are in `docs/cer_v2_redesign_lessons.md` (SkyFireworks).

## Open work, in order

1. **#2760** (the families and this checkpoint): merge on a passing `test` if still open.
2. **Step 11, on the 2026-11-05 UTC day:** Columbia's full read on #2754's branch (its trial parsed 12 of 12). Run
   `next_slo_colleges.py` **on main**. It still prints Columbia as a trial there, so write the full read's `.run`
   anyway (`catalog=columbia` with `parts=`). Run one preparation run beside it, on another host.
3. **Credential slice, 2026-11-05:** Google, Microsoft, Amazon Web Services, IBM, Oracle, Cisco, NVIDIA.
4. **UI pass, 2026-11-05:** `ui_pass.py --next` names **funding-model**.
5. **Cert link:** AWS welding is the next family (19 titles, 17 catalog rows); check each D1.1 qualification against the
   catalog's names first. Then NWCG (17 titles, 6 rows) and SWRCB (12, 4). Most of what remains is courses and
   apprenticeship committees, which have no catalog certs.
6. **Contacts harvest:** the first Sunday firing (2026-11-08 UTC) reads the 15 colleges read longest ago.
7. **Commons and Library:** as handoff 568 lists them. Once Sam approves ELL IET V3
   (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3), run `scripts/library_page.py`.
8. **Small and carryover:** as handoff 566 lists them. `CLAUDE.md` is at 60,641 bytes against 60,000; a session Sam
   opens trims it.

## Lessons to honor

- **Measure the catalog yourself.** S570 measured the gap by issuer before building, and that measurement is what
  chose the four families.
- **A title whose exhibits name several issuers stays out of a hand table** (*EMT Certification*: EMSA, NREMT, ACE).
- **The session's Python may lack `openpyxl`.** `scripts/check_generated.sh` then reports two generators stale. Run
  `python3 -m pip install openpyxl` (plain `pip` installed it for another interpreter) and re-run the script.

## Let go

S570 holds no PR subscription, check-in or artifact watch. Open: #2754 (Columbia; its branch is free for the full read)
and #2760, which merges on a passing `test`.
