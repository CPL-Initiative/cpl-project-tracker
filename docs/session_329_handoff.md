---
title: Session 329 handoff — Sierra's statement deploy, the ladder PR, the Cerritos runner read
date: 2026-10-04
session: 328 (SkyLadder)
tags: [handoff, program-requirements-harvest, cpl-pathways, sierra, college-identity, decision-sheet]
status: current
superseded: true
superseded_by: session_332_handoff.md
---

# You are Session 329

Your moniker is **SkyRunner**. SkyLadder (S328, `session_01Hzccw7F2Rp17TBUYMyFVCG`) checkpointed
at the context WARN line (about 110K left) with two things in flight.

## First, in this order

1. **Read A/B run 37230411476** (cpl-chat-preview-ab on `e6331c9`, `cleanup: true`). It is the one
   re-run S328 spent on run 37229352499, whose only regression was **7c** (the CNA/LVN quick-list table
   must start in the first 1,800 characters; it failed that way on 2026-10-03 with no related change).
   - **No regressions, preview all modes OK:** that is the standing authorization. The code is already on
     `main` (#1856 merged as `3523667`, same `index.ts` bytes). Dispatch `cpl-chat-deploy.yml` on main with
     `confirm: DEPLOY`, then `cpl-chat-smoke.yml`. **7u must pass** (116 and Cal State LA named).
   - **7c regresses again:** treat it as real. The candidate's only change is `collegeCountLines()` in
     `index.ts` (the statement plus the community-college count in the metrics context). Shorten the
     statement's framing line first; re-A/B before any deploy. The sandbox cannot download run
     artifacts (egress policy), so read prose through `get_job_logs` on the preview step if needed.
   - Either way the first run's cleanup already deleted the preview function from #1854.
2. **Merge #1857** (the Cerritos Ironworker ladder on CPL Pathways) once `test` is green on its head;
   this checkpoint commit rides it.
3. **The Cerritos runner read** for the ladder's four *To confirm* lines: the B.S. page, the
   Educational Partnerships articulation list, the Pre-Apprenticeship catalog page and
   `2026_Welding_Roadmap_ua.pdf`. Runners reach the sites this container cannot. Start Cerritos's
   **procedure record** from what it finds (sheet 34 card 2, below).

## Decisions Sam made this run (recorded in cpl_memory and the lanes)

- **Sheet 33** (18:52-18:57Z, all five his own call): one concise statement of who CPL serves; funding
  only to CCC colleges and campuses; CSU LA's harvest later; record shape v3 as proposed; exhaust the
  agent before any request, agents configured per college.
- **Sheet 34** (19:18Z, [PE2mmQZBvoArb5MTnC2gCG](https://claude.ai/artifact/PE2mmQZBvoArb5MTnC2gCG),
  answered, no newer sheet): the statement as drafted with two edits, now *"The CPL Initiative serves
  California's 116 community colleges, two noncredit campuses, and partner programs such as LAUNCH and
  Futuro Health. Cal State LA is the first CSU campus on MAP. Adult education, ROP and not-for-credit
  programs join later."*; **"datasets", never "scrape"**, for MAP's counts in reader-facing text; one
  procedure record per college, as proposed.
- **The ladder** (~19:50Z): *"port it to CPL Pathways. Add a simple graphical map summarizing the steps
  leading to career at the beginning. Allow a click through to the sections of the steps."* Done in #1857.
- **The film** (~19:55Z): a 100-second video like *CPL Funding in Motion*, "at the stage you recommend".
  S328 recommended after the runner read, so it narrates only confirmed lines (`prototype/funding_video`).
- **SkyView** (~20:02Z, "later"): every program with ROEP in a SkyView view, each opening its ROEP view
  on click, grouped by sector or discipline. Vault braindump 2026-10-04 20:02; skyview lane.

## What shipped (S328)

- #1854 merged and deployed (A/B clean; production smoke ALL MODES OK, 7t included).
- #1855: sheets 33-34 in their lanes; `NON_CCC_INSTITUTIONS` keeps Cal State LA out of the funding model.
- #1856: `kb/non_ccc_institutions.json` (statement, the system's 116, Cal State LA's names) read by the
  funding model, the Active Colleges card (*of 116 community colleges*, an *Also on MAP* row) and Sierra.
  **Merged, not yet deployed for Sierra** (item 1).
- #1857 (open): the ladder as CPL Pathways' first featured program, step map of buttons (never `#hash`
  links: the dashboard routes tabs on the hash), A.S. and certificate figures from the display build;
  the B.S. map's stale *27-29* note fixed. Guard `tests/cpl_pathways_ladder.test.js`.
- CPL-Initiative/cpl-knowledge-base#25 (draft, a person merges): the letter tool counts the system's 116
  and leaves Cal State LA out of the active count; `generate-letter` needs a redeploy after.
- Vault: samueltlee/CPLBrain#236 and #237 merged (S327 notes; the SkyView braindump).

## Safety patterns

- The sandbox cannot reach `*.supabase.co` or GitHub's artifact storage; read CI through the MCP tools.
- A remote branch auto-deletes on merge: before pushing a restarted branch, delete the stale
  `refs/remotes/origin/<branch>` ref (a full `git fetch --prune` of this repo stalls for minutes).
- `cpl_memory.kind` allows fact, pitfall, opportunity, risk, wishlist, question, decision, milestone,
  procedure; `summary` is at most 400 characters.
- CLAUDE.md is at 59,992 of 60,000 bytes. Add nothing without trimming.

## Next work (after the three above)

- Record shape v3 (outcomes as printed); the program view's By requirement / By term layouts; the harvest
  tab port with its Procedures view.
- Apply the statement on the public KB once #25 merges (redeploy `generate-letter`).
- Raise Miramar's AUTO 156G articulations (EMT, Driver Operator 1B) in the clean-up lane.
