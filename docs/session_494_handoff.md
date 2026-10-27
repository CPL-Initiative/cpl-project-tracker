---
title: "Session 494 handoff: the MAP link on every adoption surface, the funding page's Step 2 fixed for the Summit"
date: 2026-10-27
session: 493 (SkyThimbleberry)
tags: [handoff, my-college-action-page, eacr-exhibit-cr-adoption, implementation-funding, decision-sheets]
status: current
---

# You are Session 494

Your moniker is **SkyWhortleberry**. Session 493 (**SkyThimbleberry**) was Sam's own session, 2026-10-26 ~23:00Z to
2026-10-27 ~00:40Z. Its checkpoint was **full** (three lanes moved, cpl_memory rows written). Skipped: `kb/README.md`
(no KB structure change), `README.md` (no new surface), the Pipeline tab (the M-ID pipeline did not move), a new KB
note (the two layout lessons live in the lessons docs and cpl_memory). Read, in order: this file, the
my-college-action-page lane (*The CPL opportunity analysis*), the implementation-funding lane (*WCAG 2.2 AA FOR THE
CPL SUMMIT*), `docs/college_action_page_lessons.md` S493.

**The 7th Annual CPL Summit is Friday 2026-10-30.** Nothing on the public funding page may regress before then.

## What shipped

- **#2483** S492's checkpoint; **#2482** the funding film page and memo a11y (merged after a stale dependency map).
- **#2485** the MAP chips: beside each exhibit ID on the CPL Opportunity visual and in EACR, a chip names the college
  MAP records as the exhibit's builder (its owner field) and opens MAP searched for that ID (`?Exhibit=`). EACR's
  could-adopt claims carry one chip per builder, at most six. `kb/_verify_map_exhibit_links.py` now checks every exhibit
  ID in `statewide_data.js` (6,418 of 6,418 listed) and keeps each builder.
- **#2487** (Sam's screenshot): the public funding page's Step 2 was squeezed to 21px with My Institution chosen; an
  `auto` grid column let Step 1's description (#2478) take the row. Now `minmax(0,3fr) minmax(min(100%,22rem),2fr)`.
- **#2488** Sheet 134 card 2's first part: `map_links.js` and `by_title` in the verify file put the MAP chips in CPL
  Pathways' adoption panels, My College's register and By CPL type, and CER's Potential adopters.
- **samueltlee/CPLBrain#506** Open Asks Sheet 134 (built, answered, retired) and this run's session note.

Check each of #2487, #2488 and CPLBrain#506 merged; S493 merged them on `test` if the checks finished in its window.

## Decisions Sam made this run

- His screenshot of the squeezed Step 2 (~23:30Z), fixed in #2487.
- **[Open Asks Sheet 134](https://claude.ai/artifact/9GPuiZ5F4dvjCrinyJFr5q)** (answered 00:09Z 2026-10-27, both his own
  call): card 1 *builder* (the chip names MAP's builder; MAP's table lists articulating colleges, and in a sample of 40
  joined IDs it opens on another college for 9); card 2 *build* (CPL Pathways, My College and CER first, Sierra second,
  counts unlinked).
- Sheet 133 card 1, answered in chat ~21:35Z: re-read the narration's scene 8 alone (recorded in the funding lane).

## Open work, in order

1. **Sierra's MAP links** (Sheet 134 card 2, part two): her could-adopt context comes from the
   `college_adoption_opportunities` RPC by common title; read `by_title` from the verify file (Pages URL) in cpl-chat,
   give each credential one MAP link per builder, deploy through the usual workflow, then her smoke run. Her rules
   allow only URLs present in the context.
2. **The narrated funding film:** re-read scene 8 (Minimum conditions: a CPL coordinator and a Noncredit CPL Lead) in
   Sierra's voice (`prototype/funding_video/README.md`), keep the other ten reads (`voice_s2/`), rebuild n2 on v11,
   offer the narrated cut beside the music film.
3. **Before Friday:** `npm run a11y -- funding-model funding-model-sierra funding-model-mycpl funding-model-howto
   funding-public funding-memo funding-film fact-sheet public-library sierra` on the live main, and fold axe into
   `scripts/a11y.js`. ⚠️ Never leave out `funding-model-mycpl`: it is the one target that opens My Institution.
4. Malone's tab parameter: add it to `mapLink()` in `college_cpl_workbook.js`, `statewide_interactive.js` and
   `map_links.js` when MAP reads one (it reads `exhibit`, `Exhibit`, `search` as of 2026-10-26 23:10Z).
5. Carried: Sierra 7q (*"an inactive COCI record"*), Hartnell CalGETC 45096, the daytime Library run, Music 43887 and
   RN 03570, the Commons figures to-do, the harvest lane file's size.

## Lessons to honor

- **A visually hidden span needs a positioned ancestor.** Inside a scrolling table, an absolute span with no positioned
  ancestor anchors to the page and widens it (EACR at 390px: +666px). Give the chip `position:relative`.
- **An `auto` grid column grows to its content's whole line**; give a sibling a floor (`minmax(min(100%,22rem),2fr)`).
- **A sweep that leaves out the target that opens a view cannot see that view's bug** (S492's list skipped mycpl).
- **A PR whose tree differs from main's lane markers fails the vault coverage locally**; merge the tracker PRs first.
- **`pkill -f <pattern>` matches your own shell** when the pattern is in the command line; kill by PID.

## Another session

Sam's side session (016TeqmbzYcoLqrU2kAnqKfe) finished #2484 and holds nothing. The CPL queue routine fires next at
05:12Z and reads this file.

## Let go

S493 drops its subscriptions on #2487, #2488 and CPLBrain#506 at sign-off; Sheet 134's artifact watch lapses with the
session.
