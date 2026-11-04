---
title: "Session 572 handoff: the cert link's AWS welding and Amazon families; Columbia's full read is next"
date: 2026-11-04
session: 571 (SkyHoags, the CPL Queue routine, 2026-11-04 12:12Z firing)
tags: [handoff, scheduled-sessions, cer-procedures, program-requirements-harvest]
status: current
---

# You are Session 572

Your moniker is **SkyBlackEye** (galaxy names, Sam at S540; the Black Eye Galaxy, M64). S571 was the night's last CPL
Queue firing (04:12 Pacific, 12:12Z). Its checkpoint was **light**: no lane changed state and the run wrote no data. It
refreshed the cer-procedures lane and its lessons, the index, this handoff, the vault note and the program-requirements
status file. It skipped the Roadmap row, `kb/README.md`, `README.md`, the KB notes and the pipeline viz, and left
`kb/status/exhibit.json` to the daytime Exhibits lane. One `cpl_memory` row: `cert-link-aws-welding-amazon-2026-11-04`
(proposed).

## What S571 did

- **Start:** S570's #2760 had a passing `test` and had been idle 50 minutes, so S571 merged it. No other session was live.
  There were no to-do marks, Library briefs, rule requests or re-analysis requests. The two regen rows were unchanged
  (ELL IET V3 waits on Sam; IACA has no note). The day's (2026-11-04 UTC) SLO read, credential slice and UI pass had
  already run.
- **Two cert-link families (#2761):** both issuers are written "AWS" in titles. AWS-Welding: five D1.1 qualifications
  hold *AWS D1.1 Structural Steel*, and the D9.1 one holds *AWS D9.1 Sheet Metal Welding*. Amazon: Cloud Practitioner,
  Developer, Solutions Architect and CloudOps. **10 titles now hold 6 certs**, and the link holds 259 titles to 222
  certs. What was left out is listed in `docs/cer_v2_redesign_lessons.md` (SkyHoags).

## Open work, in order

1. **#2761** (the families and this checkpoint): merge on a passing `test` if still open.
2. **Step 0 and step 11, on the 2026-11-05 UTC day:** the dashboard dispatch on the night's first firing, then
   Columbia's full read on #2754's branch (its trial parsed 12 of 12). Run `next_slo_colleges.py` **on main**. It still
   prints Columbia as a trial there, so write the full read's `.run` anyway (`catalog=columbia` with `parts=`). Run one
   preparation run beside it, on another host.
3. **Credential slice, 2026-11-05:** Google, Microsoft, Amazon Web Services, IBM, Oracle, Cisco, NVIDIA.
4. **UI pass, 2026-11-05:** `ui_pass.py --next` names **funding-model**.
5. **Cert link:** NWCG (17 titles, 6 catalog rows), then SWRCB (12, 4). Check each title against the catalog's names
   first. Most of what remains is courses and apprenticeship committees, which have no catalog certs.
6. **Contacts harvest:** the first Sunday firing (2026-11-08 UTC) reads the 15 colleges read longest ago.
7. **Commons and Library:** as handoff 568 lists them. Once Sam approves ELL IET V3
   (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3), run `scripts/library_page.py`.
8. **Small and carryover:** as handoff 566 lists them. `CLAUDE.md` is at 60,641 bytes against 60,000; a session Sam
   opens trims it. `lanes/cer-procedures.md` sits 31 bytes over its 20,000 budget; the next edit there moves dated
   text to the lessons doc.

## Lessons to honor

- **"AWS" is two issuers.** Read a title's issuer before matching on its acronym.
- **A title whose exhibits name several issuers stays out of a hand table.**
- **The session lacks `jsdom` and may lack `openpyxl`.** Install `openpyxl` with `python3 -m pip`; the JS suites run in CI.

## Let go

S571 holds no PR subscription, check-in or artifact watch. Open: #2754 (Columbia; its branch is free for the full read)
and #2761, which merges on a passing `test`.
