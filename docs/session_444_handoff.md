---
title: "Session 444 handoff: funding moved off My College, a section per award in the harvest reader, Foothill loaded, tabs never remember a filter"
date: 2026-10-21
session: 443 (SkyToyon)
tags: [handoff, program-requirements-harvest, my-college-action-page, implementation-funding, cpl-pathways]
status: current
superseded: true
superseded_by: session_445_handoff.md
---

# You are Session 444

Your moniker is **SkyBlueOak**. Session 443 (**SkyToyon**) was opened by Sam from handoff 443. Read, in order:
this file, `docs/reference/lanes/program-requirements-harvest.md`, `docs/program_requirements_harvest_lessons.md`
S443, `docs/college_action_page_lessons.md` S443.

## Sam's words this run

- *"Once last of funding changes are done I want to get back to the PR harvest work."* (PR = program requirements.)
- *"It would be best if tabs didn't remember the previously filtered objects. I've noticed it on other tabs as well
  (e.g., My College)."* Now a CLAUDE.md rule (Engineering & UI practices); #2325 applied it.

## What shipped (all merged unless noted)

- **Funding off My College:** #2313 (one college choice), #2316 (My CPL Funding links to the funding page's
  My Institution view), #2320 (expenditure reports at the top of Implementation Funding's 2026-28 view).
  #2315 (S442 checkpoint) and CPLBrain#424 (Sheet 110 fixture) merged too.
- **Reedley** loaded and displayed (#2317).
- **The harvest reader** (#2322): a page that heads a section per award serves each sibling program
  (`section_award()` in `kb/_program_requirements_college.py`), with a guard: a section on a page whose label does
  not name the program needs 80% of its courses. Capture-only reads: Foothill 116 → 144 found (page_claimed
  73 → 45); Golden West 81 → 95 (43 → 29, branch `claude/harvest-goldenwest-s443`, not extracted); Palomar unchanged.
- **Foothill** extracted ($11.85), loaded (29 inserted, 97 kept, receipt with rollback) and display build
  33f68a1257d9: #2326 (open at this writing; merges when the display job's "Applied record" lands and `test` passes).
- **Tabs never remember** (#2325): Program Requirements' picks and filters and My College's choice last the visit;
  a hand-off between tabs is marked `handoff`, read once, cleared.

## Open work, in order

1. **#2326** if still open: confirm the "Applied record" commit, `test` green, squash-merge.
2. **Golden West extraction:** the guarded capture is on `claude/harvest-goldenwest-s443` (run 39667910648). Cut a
   fresh `claude/harvest-goldenwest-extract-s444` off main, dispatch `step=read extract=1`, then load, the display
   build (`python3 kb/_build_roep_display.py`, commit, `step=display`), PR. Expect about $8.
3. **The page-claimed sweep** (842 statewide before the fix): Imperial Valley 49, Sierra 47, MiraCosta 43, Ventura
   and Moorpark 39 each, Orange Coast 32, Oxnard and Citrus 31. A free capture first (`extract=0`, one branch a
   college, never two on one host: Ventura, Moorpark and Oxnard share a district host), compare `capture_preview.json`
   with main's `capture.json`, spot-check the new shared pages' coverage, then extract.
4. **Palomar** (103 page-claimed, unchanged): a page read of two of its claimed pages
   (`kb/college_reads/`), then a reader change for its shape.
5. **Open Asks Sheet 111** (https://claude.ai/artifact/8W3qnADfQzmxcR4LLztk16) was answered 21:58Z: the combined tab
   is **CPL Pathways**; the public funding page **forgets** the chosen institution (applied in #2327). No card is open.

## Lessons to honor

- Read the page before you trust a capture: the first section rule matched nothing on Foothill until a free page read
  showed the generic heading and the " · " joins.
- A hub page lists degrees it does not hold; coverage alone can make it a home.
- Run `bash scripts/check_generated.sh` bare; through `| tail` its failure exit is lost (S443 pushed a stale map once).
- Never dispatch a workflow in the same batch as the push it needs.

## Other sessions

The funding-page session (`session_01XQMmTq7rSj2Q4Q3fSJyV1m`) had only a migration-only branch queued; the
Bakersfield session (its branch `claude/keen-hopper-wy8zri`) edits the My College lane's opportunity paragraph,
so leave that paragraph to it.

## Let go

S443 drops its subscription on #2326 at sign-off (a later session re-subscribes if it is still open), its watch on
Sheet 111, and any check-in. The routine's next firing is 05:12Z on 2026-10-22.
