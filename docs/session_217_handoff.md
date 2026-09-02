---
title: "Session 217 handoff — the one-pool model is shipped; feed cutover + polish next"
created: 2026-09-01
updated: 2026-09-01
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
superseded: true
superseded_by: session_221_handoff.md
---

# You are Session 217

Suggested moniker: **SkyFlow** (the origination feed is your headline if the
spellings have landed). Predecessors: SkyLedger S214 (adoption) → SkyPool S215
(the full-tab mock + R-sheet) → **SkyPort S216 (the port shipped)**.

## What S216 shipped (2026-08-31 → 09-01)

- **The one-pool model is LIVE in `cpl_funding.js`** — PR
  [#1427](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1427):
  one solve, 118 institutions, $150K base / $400K cap combined, FTES-share
  CR/NC decomposition, F1 ($0-until-feeds, never an advance), origination
  earning for NOCE/SDCCE/Calbright (N2 b), targets on the pre-bounds CR
  slice. At S216's end the PR was READY with the `test` check running —
  **check its state FIRST**: if unmerged and `test` succeeded on the head,
  squash-merge (branch policy: `test` green is the only wait); if red, the
  failure is yours.
- **All 33 funding suites re-aimed** (~2,000 checks, 5-agent fan-out), plus
  briefing 243/243 and explainer 15/15. Retired mechanisms are absence guards
  naming their R-ruling. The anchor is `tests/cpl_funding_one_pool.test.js`
  (49 checks — the locked mock's figures of record).
- **Sam's three reaction rounds**, all live in mock + tab: collapsible
  sections + expand/collapse-all; one rem column template (em grids misalign
  across font sizes — KB note); verbatim §78093.2(d)(1) folds; his Summary
  bullet verbatim + the balance-sentence capability; "Version as of
  2026-08-31"; Draft memo / Save as PDF; Internal·Public preview
  (`state.previewPublic`); metric on each card's surface below the share
  line; "max award — maximum funding to be awarded based on measurable
  outcomes and allocated as credit and noncredit subtotals"; LA Southwest +
  Riverside City via `display` aliases (the `college` KEY is load-bearing).
- **Three product bugs found by the ports, fixed**: `prioTarget`'s
  per-student path missed the lane slice (cap ÷ target scattered 1.5076×);
  three consumers keyed rows by retired `"c:"+order` (deep link, scroll,
  "✎ Confirm" chip — all dead clicks); the bold institution name vs the
  low-key-rows ruling. Plus boundLabel's doubled figure and the stale
  P1/P2/P3 footer.

## Decisions Sam made this run (recorded per checkpoint step 0b)

1. **R-sheet lock**: R8 retire · **R10 the eligibility column STAYS ON (his
   one veto)** · R11 consolidate — all eleven ruled.
2. **Vocabulary (doctrine, in CLAUDE.md Naming)**: "pool" → **funding**
   (vary the wording; the model NAME "one-pool" + identifiers stay);
   **"on its face" banned** — end the statement; the max-award definition
   verbatim above.
3. **Summary**: his verbatim first bullet; the origination-wait and
   100%-allocated bullets deleted; keep the ability to show an unallocated
   balance as a sentence in bullet 1.
4. **Layout rulings**: sections collapsible + expand/collapse-all; CR FTES /
   NC FTES / CR award centered (NC award right); metric on the card surface,
   strategies stay in the fold; "Version as of <date>".
5. **Names**: LA Swest → LA Southwest; Riverside → Riverside City (session
   title-cased "city" to match the roster's City-college family — flag if he
   objects).

## Read in order

1. `docs/reference/lanes/implementation-funding.md` — current lane truth
   (NEEDS SAM + NEXT live there).
2. `docs/cpl_funding_lessons.md` — the S216 chapter (the three bugs, the
   anchor-first order, the em-grid lesson).
3. `kb/docs_audit/latest.json` — run `python3 kb/_docs_audit.py` fresh.

## Priority work, in order

1. **PR #1427 to merged** (see above). After merge: GitHub auto-deletes the
   branch; stop-hook nags about it are the documented false positive.
2. **Origination feed cutover**: when Malone/Pedro confirm the Origin +
   LocID2 spellings (CPLBrain#67), make the `ppa` cutover in
   `funding/_build_funding_performance.py` — the tab needs NO consumer edit
   (anchor Part C proves it). Until then the trio correctly read $0.
3. **Sam's open display call**: Annual-view earning % can read >100%
   (cumulative window earning over the per-year figure). He has the question;
   implement whichever way he rules.
4. **Cleanup commit** (small): dead CSS for retired row shapes
   (`.cplfund-ncrow`/`.cplfund-ncsysrow`/`.cf-lanechip`/`.cplfund-awardrow`/
   `.cf-prio` family), `pinFrozenRows`'s `:not(.cplfund-ncsysrow)`; keep
   `.cf-gap` (still emitted).
5. **Briefing display-name sweep** — `college_briefing.js` renders raw
   college keys; the alias layer stops at the funding tab + explainer
   (college-district-identity lane).

## Patterns that worked / safety

- Anchor-test-first, then family fan-out with "re-aim, never weaken" — the
  bugs were found BY the ports. Fan out where a hit is cheap to verify.
- Product edits during a live fan-out cost one test collision per
  overlapping phrase — acceptable; re-run the family after both streams.
- No Supabase data writes were needed (live config already carried
  floor 150000); retired config fields stay stored, unread, guarded inert.
- Poll CI via MCP github tools, never curl; merge only on `test` success.
