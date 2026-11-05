---
title: "Session 570 handoff: the cert link's Autodesk, NCCER and ASME families; Columbia's full read is next"
date: 2026-11-04
session: 569 (SkyAntennae, the CPL Queue routine, 2026-11-04 10:12Z firing)
tags: [handoff, scheduled-sessions, cer-procedures, program-requirements-harvest]
status: current
superseded: true
superseded_by: session_577_handoff.md
---

# You are Session 570

Your moniker is **SkyFireworks** (galaxy names, Sam at S540; the Fireworks Galaxy, NGC 6946). S569 was the night's
fifth CPL Queue firing (02:12 Pacific, 10:12Z). Its checkpoint was **light**: no lane changed state and the run wrote
no data. It refreshed the cer-procedures lane and its lessons, the index (one history bullet moved to the archive), this
handoff, the vault note and the program-requirements status file. It skipped the Roadmap row, `kb/README.md`,
`README.md`, the KB notes and the pipeline viz, and left `kb/status/exhibit.json` to the daytime Exhibits lane. One
`cpl_memory` row: `cert-link-hand-families-2026-11-04` (proposed).

## What S569 did

- **Start:** S568's checkpoint PR #2758 was open with a passing `test` and had been idle 34 minutes since, so S569 merged
  it. No other session was live. There were no to-do marks, Library briefs, rule requests or re-analysis requests. The
  two regen rows were unchanged (ELL IET V3 waits on Sam; IACA has no note). Sheet 160's one reply was already applied.
  The day's (2026-11-04 UTC) SLO read, credential slice and UI pass were already used.
- **The cert link's next families (#2759):** `HAND` in `kb/_build_exhibit_cert_links.py` holds Autodesk (3 titles), NCCER
  (9) and ASME (1). Each issuer has two spellings in the catalog, and the build treats them as one. **13 titles now hold 20
  certs**, and the link holds 232 titles to 200 certs. Left out: NCCER levels short of journey, the generic *Autodesk
  Certified Professional*, the courses, *Fire Inspector 1* (mixed issuers), NFPA's standard-named fire titles and the
  ASME welder qualifications. The guard is `HandFamilies`.

## Open work, in order

1. **#2759** (the families and this checkpoint): merge on a passing `test` if still open.
2. **Step 11, on the 2026-11-05 UTC day:** Columbia's full read on #2754's branch (its trial parsed 12 of 12). Run
   `next_slo_colleges.py` **on main**. It still prints Columbia as a trial there, so write the full read's `.run`
   anyway (`catalog=columbia` with `parts=`). Run one preparation run beside it, on another host.
3. **Credential slice, 2026-11-05:** Google, Microsoft, Amazon Web Services, IBM, Oracle, Cisco, NVIDIA.
4. **UI pass, 2026-11-05:** `ui_pass.py --next` names **funding-model**.
5. **Cert link:** the remaining gap is mostly courses and certs the catalog does not list. Measure the gap by issuer again
   before you build another family; the handoff's catalog counts were wrong once (lessons, SkyAntennae).
6. **Contacts harvest:** the first Sunday firing (2026-11-08 UTC) reads the 15 colleges read longest ago.
7. **Commons and Library:** as handoff 568 lists them. Once Sam approves ELL IET V3
   (https://claude.ai/artifact/5JMF3L4sEFZHrAPZrHSmH3), run `scripts/library_page.py`.
8. **Small and carryover:** as handoff 566 lists them. `CLAUDE.md` is at 60,641 bytes against 60,000; a session Sam
   opens trims it.

## Lessons to honor

- **Measure the catalog yourself.** Handoff 569 put NFPA and ASME at one catalog row each; they hold 16 and 9.
- **A title whose exhibits name several issuers stays out of a hand table.**

## Let go

S569 holds no PR subscription, check-in or artifact watch. Open: #2754 (Columbia; its branch is free for the full read)
and #2759, which merges on a passing `test`.
