---
title: "CER redesign handoff: Sheet 147 answered, the high school and ROP rule, the CPL-AI dialog; the Exhibits tab next"
date: 2026-10-31
session: CER redesign build, side session beside S531 (SkyGooseberry)
tags: [handoff, cer, eacr, catalog-commons, cpl-ai, program-requirements]
status: current
---

# You are SkyRowanberry, the Exhibits tab build

SkyGooseberry ran the CER redesign queue on 2026-10-30 from about 23:59Z to 00:45Z (2026-10-31), beside S531
(SkyOlallieberry, the night's queue session, which owns `docs/session_532_handoff.md`, `kb/status/program-requirements.json`
and #2600 on `cpl_funding.js`). This is a **full checkpoint** for the CER lane; this file carries it.

## What shipped

- **#2595 (merged):** the mock-up record and the previous run's checkpoint; the merge conflict with S531's checkpoint
  resolved by merging main (docs index and audit files).
- **#2598 (merged):** college short names (College of the Desert, Cañada, City College San Francisco).
- **Open Asks Sheet 147**, https://claude.ai/artifact/XVNFzgxMW4mAiCC9YUsABB: the lane's six asks on five cards,
  **answered whole at 00:06Z**, all Sam's own call (below). Builder and record: samueltlee/CPLBrain#567 (merged).
- **#2601 (open, watched):** the high school and ROP rule, the CPL-AI matching in the Program Requirements dialog, and
  mock-up version 26 (a could-adopt chip opens the college's aligned courses and the Request Quick Adopt link,
  https://claude.ai/artifact/6fTBpjkrGseEb7h3gaPnSM). Merge it on a green `test` if it is still open.
- **cpl_memory:** `sam-sheet-147-rulings-2026-10-31`, `cer-high-school-rop-rule-built-2026-10-31`,
  `cpl-ai-snapshot-in-dialog-2026-10-31`, two pitfalls; each logged.
- **KB note:** `methodology-a-record-level-join-needs-a-word-guard`.

## Sam's decisions this run (Sheet 147, verbatim chips)

1 *merge*: one Exhibits tab in the Catalog Commons replaces the CER and EACR, Review built first. 2 *rule*: the high
school and ROP titles settle under one rule, AP keeping its names. 3 *stamped*: the public adoption page lists settled
credentials only. 4 *cpl-ai*: that page takes Malone's CPL/AI look (First Light was proposed; CLAUDE.md's look rule now
names it). 5 *dialog*: the CPL-AI matching shows in the Program Requirements dialog first; Sierra and public pages wait.

## Read first

`docs/reference/lanes/cer-procedures.md` (*The redesign* and NEXT), `docs/cer_v2_redesign_lessons.md` (2026-10-31),
the mock-up at version 26, `docs/visuals/2026-10-30-cer-exhibits-redesign-mockup.html`.

## Open work, in order

1. **#2601**: if open, read `get_check_runs` on its head and merge on a green `test`.
2. **Build the Exhibits tab's Review queue** on the drawn card. Data: the held titles in
   `kb/cer_procedures_out/latest.json` (`needs_you`), their exhibits through `statewide_data.js` `raw_titles`, the
   proposal from `kb/unclassified_suggestions.json` `aligned` (the daily run writes it from 2026-10-31), college chips
   from `unified_courses_members.js`. Students per exhibit come from `map_student_credit`, reviewer-only, k=10 under
   the student-detail ADR; no RPC exists, so map the read in `kb/governance_surface_map.json` before adding one. Keep
   Current Title and Change to Proposed Title save through the CER's existing `kb_curation` path. A new tab touches the
   side menu (Admin, `cobi_nav`) and both HTMLs (Rule 4).
3. **Watch the first nightly save of `high-school-rop`** (expected about 55, cohort
   `cer-procedure-high-school-rop@bot`); read its receipt in `kb/cer_procedures_out/saved/`.
4. **The college short-name editor** (college-district-identity lane NEXT): a Short name column, a Supabase table seeded
   from the 118 rows, the nightly rewrite; map the write surface first.
5. **The CPL-AI snapshot's refresh**: `python3 kb/_build_cpl_ai.py --fetch` by hand until Sam picks a schedule.

## Lessons to honor

- A join through a record's parallel lists needs a word guard before a rule saves on it (the KB note).
- A rule that replaces another's answer counts under itself alone.
- Republishing another session's artifact without a full read returns its whole diff; budget for it.
- `git add`, then `bash scripts/check_generated.sh`, before every push: a lane's `updated:` date moves the docs index.

## Let go

At sign-off this session drops its watch on #2601 and the artifact watches on Sheet 147 and the mock-up. No check-ins
are scheduled.
