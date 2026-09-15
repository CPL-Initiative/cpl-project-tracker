---
title: Session 263 handoff — a hide rule that reached into the drill-in, and two builds Sam stopped
date: 2026-09-15
session: 263 (SkyOrder)
tags: [handoff, implementation-funding, css, measures]
status: current
---

# You are Session 264

Your moniker is **SkyGauge**. S263 fixed a defect every reader of the funding tab had been
seeing, and had two of its own builds reverted by Sam. **The reverts are the more useful
half of this handoff.**

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md) (SkyProof,
dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md) (SkyStar, SkyView)
are still live for their lanes; this file supersedes only
[`docs/session_262_handoff.md`](session_262_handoff.md).

Read in order:
[`lanes/implementation-funding.md`](reference/lanes/implementation-funding.md) ·
[`methodology-a-guard-on-the-wrong-generation-of-descendant-is-not-a-guard`](kb-notes/methodology-a-guard-on-the-wrong-generation-of-descendant-is-not-a-guard.md) ·
[`methodology-before-building-a-whole-check-whether-the-halves-are-already-assigned`](kb-notes/methodology-before-building-a-whole-check-whether-the-halves-are-already-assigned.md) ·
[`cpl_funding_lessons.md`](cpl_funding_lessons.md) (2026-09-15) · PRs #1577 #1578 #1580.

## What shipped

- ⭐ **#1578 — THE COLUMN-HIDE RULE REACHED INTO THE DRILL-IN, ON THE SHIPPED DEFAULT.**
  `colHideStyleHtml()` used DESCENDANT combinators, so hiding District (main col 3) also hid
  NC funding (detail col 3) in the nested table. `COL_PREFS` defaults to
  `{district:true, working_adults:true}` — **nobody chose this setting**. Every reader of
  COBI and the public explainer lost the noncredit cell, saw later cells slide one column
  left under the wrong headers, and Total Possible render empty. Every combinator is a child
  combinator now. Guard: `cpl_funding_col_hide_scope.test.js` (14), asserting on
  `Element.matches()` — **the markup was always correct, so no DOM-reading test could see it.**
- **#1577 — the statewide row expands**, from the SAME renderer as the college expand
  (`prioDetailTableHtml(scope)`). The Actual percent is the TRUE ratio, not `Math.min(1, …)`.
  And the printed table got its **118 institution names back** — `buildPrintHtml` swept
  `button`, and every name is the text of a `.cplfund-caret` button.
- **#1580 — reverted the target rate, corrected a stale `MEASURES` comment.**

## ⚠️ Sam's decisions and corrections this run

1. **"Keep P1 on eligible units for now, but make target_rate per-priority"** — then, seeing
   it built: **"why do I need the Target factor when I can adjust the FTES factor and get the
   same effect"**. He is right and the maths is exact (`rate = k/factor`). REVERTED.
   **Do not rebuild it.**
2. **"Student headcount is not a metric"** / *"we do not use student headcount for any metrics
   in this tab. There is a stubborn memory from the earliest drafts that keeps reasserting them
   as a factor."* The ruling now sits at `prioTarget`'s students branch, the only place
   `target_rate` is read and therefore the seam that attracts the mistake.
3. **"Changing the Eligible calc to using Applied will fix all the confusion"** — a DIAL, his,
   through the tab. ⚠️ **Do not build a combined source for it** (see NEEDS SAM ①).
4. **"This was not an issue in any of the previous dozens of funding sessions. Are you sure a
   big change is needed?"** — said twice, and right both times. Treat that sentence as evidence.
5. Calbright's NC FTES is still the **1,000 stand-in**; he pulls **ALL reported FTES** from the
   CO next week before the model is finalized. That re-bases all 118 institutions.

## NEEDS SAM

1. ⭐ **PIN P1 TO APPLIED — one dial, ZERO code.** Set P1's `metric_src` to `pa_u` in the tab.
   ⚠️ **DO NOT BUILD A COMBINED `pa_u + ppa_u` SOURCE.** `pa`/`ppa` are DISJOINT and **Awards
   already carries `ppa_u`**, so P1 on `pa_u` + Awards on `ppa_u` covers the dashboard's figure
   exactly (Alameda 78 + 6 = 84). A combined source double-counts portal-origin units and
   re-creates the S262 double claim. Measured: statewide 17.42x → 2.71x, 97/115 → 52/115.
2. **Remove the `Headcount` option from the allocation-basis control?** `cpl_funding.js:4253`
   still offers it and one click re-sizes every award via `sizeOf()`; `:7057` and `:5746` render
   text asserting the metrics are headcount-denominated. Sam's ruling says this is dead policy —
   removing those three sites makes the code enforce it. Proposed, not built.
3. Carried: the funding dials ⓪; the annual-view earning percent; `CollegeID2`; the calm pass's
   lettered calls; whether COBI keeps showing "<10"; position + drag on the (C)/(D) cards.

## Queue

- **COBI-wide CONTRAST** — 17 of 38 routes. In no lane. The funding route itself is clear
  (13 findings, identical to `main`).
- ⚠️ **Docs over budget:** `cpl_funding_lessons_archive.md` 1.78×; **`lanes/implementation-funding.md`
  1.17×** — compacted twice this run while absorbing three findings; further cuts trade a
  load-bearing invariant for a threshold. `roadmap_archive.md` 4.3× (worst, untouched).
- Carried: `Counselor_Verified` into the daily fetch; 51 guessed column offsets in
  `excel_to_dashboard.py`; SkyView ⑩/⑪ (S254); the explainer video shot sheet.

## Patterns that worked

- **Reproduce the screenshot cell-for-cell before theorizing.** It killed three wrong
  hypotheses — stale browser cache, truncated git history, a missing data field — and landed
  on the CSS. ⚠️ Two of those I had already told Sam; both needed correcting.
- **Mutate every new guard.** Both new suites were proven to fail on the real defect by name.
- **Check what already consumes a field before building its sum.**
- ⚠️ **The sandbox clone is SHALLOW** (`git rev-parse --is-shallow-repository` → true). The
  oldest visible commit looks like it added every file. GitHub has the full history; do not
  report it as lost, as I briefly did.

## Safety patterns to honor

Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through MCP) · the `test`
check green on the CURRENT head before every merge, and a `check_suite` wake's `head_sha`
routinely names a SUPERSEDED commit — always re-read `get_check_runs` · **rebuild
`kb/dependency_map.json` as the genuinely LAST step** · never re-baseline `check_floor.json`
from a contended run · dials are Sam's, through the tab · MAP read-only · the public KB untouched.

## KB notes added this run

- `methodology-a-guard-on-the-wrong-generation-of-descendant-is-not-a-guard`
- `methodology-before-building-a-whole-check-whether-the-halves-are-already-assigned`

---

*Greetings, you are Sky**Gauge** (Session 264), see Sky**Order**'s handoff —
`docs/session_263_handoff.md` — let's keep rolling with our queue.*
