---
title: Session 277 handoff — SkyView is shareable and answers every drop; next, the curator's Save
date: 2026-09-18
session: 276 parallel (SkyLevel)
tags: [handoff, skyview, ccr, generated-artifacts, read-only]
status: current
---

# You are Session 277

Your moniker is **SkyLedger** — SkyView now says what it is and answers what you
do to it, and the work in front of you is the write that makes a merge stick.

⚠️ **TWO SESSIONS RAN 2026-09-18 IN PARALLEL.** This handoff is the **SkyView**
lane, written by SkyLevel, which had no handoff of its own (Sam: *"this session I
don't have a typical handoff to give you"*). The **Sierra** lane ran beside it as
SkyGauge and shipped v72 in [PR #1617](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1617);
its state is in [`lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
and `docs/cpl_assistant_lessons.md`, and its own carryover is in the To-Do feed.
If SkyGauge also wrote this file, **merge the two halves rather than picking one**.

Read in order: this file · [`lanes/skyview-ccr-interface.md`](reference/lanes/skyview-ccr-interface.md)
· [`reference/skyview_invariants.md`](reference/skyview_invariants.md) (before any code)
· `docs/ccr_atlas_lessons.md` (2026-09-18) ·
[`methodology-a-generated-file-accepts-your-edit`](kb-notes/methodology-a-generated-file-accepts-your-edit.md)
· [PR #1618](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1618) (merged)
· [PR #1619](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1619) (merged).

## ✅ WHERE THINGS STAND

- **SkyView states that it is read only**, in a band under the control row, inside
  `#u-full` so it survives full screen and clear of the legend so folding cannot
  take it: *Read only. Moves stage in this browser alone. Signed-in curators save
  in COBI's Common Course Reference tab.* 29px at 1440×900, 47px at 390×844, no
  horizontal scroll. The three older statements of the same fact all sat in chrome
  `body.u-solo` hides — the footer, `#prov`'s title attribute, and a comment.
- **The page still writes NOTHING.** One POST in the whole file (the Ask calling
  `cpl-chat`, a drafting surface that skips its `chat_interactions` insert), no
  `rest/v1` call at all. `tests/ccr_skyview_read_only.test.js` (21 checks) pins
  both the placement and the no-write claim, so a later change cannot quietly
  falsify a statement the page was shared on.
- **A drop that stages nothing now answers.** `pointerup` had one exit returning
  in silence — a carried course released on `drag.fromNode`, which for a course
  picked up from a member square is the whole clustered identity. That silence was
  Sam's *"stops responding on the second or third merge"*. `CLICK_SLOP` is 8px
  against the 5px a carry needs to start; the panel's Drag… button has no press
  point, so its travel reads infinite and is never a click.
- **A merged course queues against its parent** on its own arc, drawn as a circle
  rather than a ring star, labeled *staged, awaiting a curator* — Sam's *"as if
  it's in line for the next remint procedure"*.
- ⚠️ **`prototype/skyview.html` IS GENERATED, and #1618 shipped into it.** The band
  was written into the artifact, passed a browser check, a jsdom suite, review,
  merge and deploy — and #1617's rebuild from the sources stripped it out of main
  within the hour. Everything now lives in `prototype/ccr_universe.js` and
  `prototype/ccr_atlas_v1.html`; `tests/skyview_built_from_source_test.py` names
  the source file and line of the first divergence, in `js-tests.yml` **and** in
  `scripts/check_generated.sh`, which had listed every other generated file and
  not this one.

## YOUR SEQUENCE

1. **Merge execution from SkyView** (`s277-fable-skyview-merge-execution`), once
   Sam says go — it is his call and it is on the sheet. The write already exists
   and is governed: `unified_courses.js` POSTs `kb_curation` with `field:
   "merge_into"` under a magic-link reviewer session with RLS per row, and
   `table:kb_curation` maps to governance row DR-04. So the build is the
   `cpl_session.js` keeper (31 modules already read a reviewer session), a Save
   control on the staged list, the same POST, the undo that already exists as a
   row delete, and **one entry in `kb/governance_surface_map.json` with its
   reason** — a read-only surface gaining writes is a decision-rights change under
   Rule 10 (a3). The band's wording changes with it, and its test is the file to
   update deliberately.
2. **Re-mint: compose and approve in SkyView, land in the harness**
   (`s277-sam-skyview-remint-surface`). Sam asked for SkyView to be a complete
   curation surface *"I know that reminting is a big deal… we can be careful."*
   ⚠️ **A browser cannot do the landing, and the reason is mechanical, not
   caution:** `docs/coursecontrolnumber_remint.md` requires producer and consumer
   in ONE git commit (new export against old kb collapses Phase B to 0 and member
   rows to 76, measured), then the gated Supabase re-key inside a window that must
   close before the 10:17 UTC cron, because the workflow runs `_apply_curation.py`
   before export. Build the request, the dry-run's blast radius and the approval
   in SkyView; dispatch the playbook to land it.
3. **The loner eclipse** (`s277-fable-skyview-loner-eclipse`) — measured and
   deliberately unfixed. 23 of 24 loners already resolve correctly with their
   parent open; 37 of 37 focused member stars resolve to that member. Reopen only
   if Sam hits it again.
4. **`.claude/settings.json` read-tool allowlist.** #1617 landed a `permissions.allow`
   block with five Supabase tools. Adding the read-only GitHub MCP tools
   (`pull_request_read`, `actions_list`, `get_check_run`) is a small, safe follow-up
   now that the file exists on main. ⚠️ **Worth raising with Sam first:**
   `mcp__Supabase__execute_sql` in that list runs arbitrary SQL against the project
   holding `map_student_credit` (537,908 student-grain rows); the other four are
   genuinely read-only.

## ⚠️ Sam's open calls — his, not yours

- **Does SkyView save a merge itself** (`s277-sam-skyview-share-and-curate-scope`).
- **Statewide exhibits on the sky** (lane item ①) — his 2026-09-10 ask cut off.
- **The opening width on a phone** (lane item ③) — a ruling, not a sweep.
- The Sierra lane's own open calls are in the To-Do feed and its lane file.

## What this session learned

- **A generated file accepts your edit, and that is what makes it dangerous.**
  Every signal fires green and the failure arrives later from somewhere else. KB
  note: `methodology-a-generated-file-accepts-your-edit`. The rule already existed
  — `skyview_invariants.md` says *"never hand-patch `skyview.html`"* — and reading
  the lane's pointer to that file is not the same as opening it. Knowing is not
  the defense; the check is.
- **Silence is a bug report.** "Stops responding" was not a dead handler; it was a
  handler that did the right thing and said nothing, leaving a stale hint claiming
  the reader still carried a course. Every exit from a gesture needs an account.
- **Measure before re-ordering a rule that already works.** The hit-test fix was
  tempting and would have traded 37 of 37 for 23 of 24.

## Safety patterns to honor

- `prototype/skyview.html` is generated — edit the sources, run
  `python3 prototype/build_ccr_atlas.py`, and run `bash scripts/check_generated.sh`
  LAST before a push.
- `npm run sweep` and `npm run a11y skyview` in the same PR as any SkyView change.
- The band's claim is load-bearing: Sam shared the page on it.
