---
title: "Session 443 handoff: My College folding into CPL Pathways (step 1 open, funding moved out), Reedley loaded, Sheet 109 applied"
date: 2026-10-21
session: 442 (SkyManzanita)
tags: [handoff, my-college-action-page, cpl-pathways, implementation-funding, program-requirements-harvest]
status: current
---

# You are Session 443

Your moniker is **SkyToyon**. Session 442 (**SkyManzanita**) was opened by Sam; the greeting named it S441 and was
stale (S441 SkyIronbark had already run). Read, in order: this file, `docs/reference/lanes/my-college-action-page.md`
(the fold), `docs/college_action_page_lessons.md` S442, `docs/program_requirements_harvest_lessons.md` S442.

## Sam's decisions this run

- Open Asks Sheet 109: all five as recommended (light checkpoint tier, the UI pass as a nightly queue item, the
  auto-mark rule with one hold list in CLAUDE.md, saying when sessions are not visible, CLAUDE.md under budget). #2310.
- The program-requirements reference is **CPL Pathways** on screen, "for now"; never ROEP, Catalog Harvest or PR.
- Consolidate My College into CPL Pathways: "go on step 1, move funding to Implementation Funding". The combined tab's
  name is **[Open Asks Sheet 110](https://claude.ai/artifact/5fdto32csyAMPvwWmKdjTX) card 1** (current; CPL Pathways recommended).

## EMERGENCY checkpoint note (S442, ~17:28Z)

The context meter hit its emergency line right after the full checkpoint, so this handoff is current but nothing ran after it.
Both funding branches are now pushed (no PR yet): `claude/my-cpl-funding-moves` at 31a82b96 and
`claude/college-reports-to-funding` at e62457d0. PR A's four-shard local run did not finish, so treat A as untested
beyond the funding and My College suites. CPLBrain#424's `coverage` failure is the usual ordering: it passes once
tracker #2315 merges (re-run it then). Nothing from the Rule 9 list was skipped at the checkpoint itself beyond what
*Not refreshed* names.

## Open work, in order

1. **#2313 (step 1, one college choice):** main merged in at cd6bfdde; merge on `test` success.
2. **PR A, branch `claude/my-cpl-funding-moves` (31a82b96, pushed, no PR yet):** My
   CPL Funding becomes a link to `funding-model/?college=<roster key>&view=one`. Main moved `cpl_funding.js`
   (4141c249) after it was cut: merge main in, run the suites in four shards (`node tests/run.js --shard i/4`, about
   40 minutes), push, open the PR, merge on `test`.
3. **PR B, branch `claude/college-reports-to-funding` (e62457d0 on top of A, pushed, no PR yet):** the expenditure reports as
   `reportsPanel` at the top of Implementation Funding's 2026-28 Funding view. Push after A merges; its related
   suites passed (36 checks in `cpl_funding_reports_college_half.test.js`).
4. **Reedley:** display build bf781cf0cd22 on `claude/harvest-reedley-s442`, display job dispatched ~17:20Z; when the
   "Applied record" commit lands, open the PR (as #2308 did for Santa Monica) and merge on `test`.
5. **Step 2 of the fold** after Sam's go: My College's sections render inside CPL Pathways' college view
   (`college_briefing.js` renders into a root; keep one Sierra per page, a remembered choice a shortcut, sections
   loaded when opened).
6. The harvest's next colleges: the five CourseLeaf colleges need reader work (lessons S442); the four with no record
   stay parked.

## Lessons to honor

- Loading another tab's module credits its tables to your tab in every derived map; hand it a request instead
  (`docs/kb-notes/methodology-hand-another-tab-a-request.md`).
- `CPL_TABS.onActivate` fires once; listen to `cpl-tab-activated` for returns.
- A free capture (`extract=0`) writes `capture_preview.json`; compare it with main's `capture.json` before spending.
- `pkill -f` with a pattern that appears in your own command kills your own shell; kill by PID from `ps`.

## Not refreshed

Pipeline tab (the M-ID pipeline did not move), `kb/README.md` (no KB structure change), `README.md` (the tab
descriptions still hold at the level it describes), the Commons' four other run logs (untouched).

## Let go

S442 holds PR subscriptions on #2313, and on PR A, PR B and the Reedley PR once opened; no check-in is pending. The
routine's next firing is in `kb/status/program-requirements.json`.
