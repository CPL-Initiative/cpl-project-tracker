---
title: "Session 574 handoff: the cert link's IAI, Intuit and DRE families; the family work stops; Columbia's full read is next"
date: 2026-11-04
session: 573 (SkyNeedle, the CPL Queue routine, 2026-11-04 14:12Z firing)
tags: [handoff, scheduled-sessions, cer-procedures, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_578_handoff.md
---

# You are Session 574

Your moniker is **SkyBodes** (galaxy names, Sam at S540; Bode's Galaxy, M81, in Ursa Major). S573 was the night's last
CPL Queue firing (06:12 Pacific, 14:12Z), so you are the next night's first firing (22:12 Pacific, 06:12Z on
2026-11-05). Its checkpoint was **light**: no lane changed state and the run wrote no data. It refreshed the
cer-procedures lane's count and its lessons, the index (one history bullet moved to the archive), this handoff, the vault
note and the program-requirements status file. It skipped the Roadmap row, `kb/README.md`, `README.md`, the KB notes and
the pipeline viz, and left `kb/status/exhibit.json` to the daytime Exhibits lane. One `cpl_memory` row:
`cert-link-family-work-stops-2026-11-04` (proposed).

## What S573 did

- **Start:** S572's #2762 had a passing `test` and had been idle 47 minutes, so S573 merged it. No other session was live.
  There were no to-do marks, Library briefs, rule requests or re-analysis requests. The two regen rows were unchanged
  (ELL IET V3 waits on Sam; IACA has no note). The day's SLO read, credential slice and UI pass had already run.
- **Three cert-link families (#2763):** the International Association for Identification's five certifications, Intuit's
  Bookkeeping Professional and QuickBooks Certified User, and the Department of Real Estate's broker and salesperson
  licenses. **9 titles now hold 9 certs**; the link holds 280 titles to 235 certs.
- **The gap, measured by issuer across the catalog's spellings:** 2,370 titles stay unlinked, and none of their issuers
  has a catalog row a title names. Local courses are 1,334 of them; the rest are apprenticeship committees, State Fire
  Training (99), DANTES, ACE, high schools, OSHA, POST, CSLB and FEMA. **The hand-family work stops.** The details are in
  `docs/cer_v2_redesign_lessons.md` (SkyNeedle).

## Open work, in order

1. **#2763** (the families and this checkpoint): merge on a passing `test` if still open.
2. **Step 0, the night's first firing (yours):** dispatch `daily-dashboard.yml` on `main` unless a successful run was
   created on 2026-11-05 UTC.
3. **Step 11:** Columbia's full read on #2754's branch (its trial parsed 12 of 12). Run `next_slo_colleges.py` **on main**.
   It still prints Columbia as a trial there, so write the full read's `.run` anyway (`catalog=columbia` with `parts=`).
   Run one preparation run beside it, on another host.
4. **Credential slice, 2026-11-05:** Google, Microsoft, Amazon Web Services, IBM, Oracle, Cisco, NVIDIA. The cert link's
   next gain is in the catalog: State Fire Training, POST, CSLB and FEMA issue certifications the watch does not read.
   Whether to add them to `_issuers_watched` is the credential watch lane's call; weigh it there, going with the
   recommendation if it is clear.
5. **UI pass, 2026-11-05:** `ui_pass.py --next` names **funding-model**.
6. **Contacts harvest:** the first Sunday firing (2026-11-08 UTC) reads the 15 colleges read longest ago.
7. **Commons and Library:** as handoff 568 lists them. Once Sam approves ELL IET V3
   (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3), run `scripts/library_page.py`.
8. **Small and carryover:** as handoff 566 lists them. `CLAUDE.md` is at 60,641 bytes against 60,000; a session Sam
   opens trims it. `lanes/cer-procedures.md` is at 19,995 of its 20,000 bytes: the next edit there moves dated text to the
   lessons doc first.

## Lessons to honor

- **Match issuers by keyword, never exactly.** The catalog spells one issuer two or three ways; an exact match reads zero.
- **A title naming a level the catalog lacks stays out** (ESCO's written Master Specialist; NCCER's Levels 1 to 3).
- **The session may lack `openpyxl` and `pytest`.** `python3 -m pip install openpyxl`; run Python guards with
  `python3 -m unittest`.

## Let go

S573 holds no PR subscription, check-in or artifact watch. Open: #2754 (Columbia; its branch is free for the full read)
and #2763, which merges on a passing `test`.
