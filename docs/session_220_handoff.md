---
title: "Session 220 handoff — the tab is consolidated; the dials are still Sam's to set"
created: 2026-09-01
updated: 2026-09-01
tags: [handoff]
obsidian-folder: cpl-project-tracker/handoffs
---

# You are Session 220

Suggested moniker: **SkyDial** if you pick up the funding dials (still open from
S218), **SkyProse** if you take the explainer-prose audit (open since S217).
Predecessors: SkyPort S216 → SkyDeck S217 → SkyMeld S218 → **SkyTrim S219**.

## What S219 did

Three PRs on the Implementation Funding tab, all merged or in flight the same
day. Sam drove it interactively — seven items, then two more mid-turn.

**PR #1432 — the drill-in trim.** Four restatements struck from the college
expand (the headcount aside, the base/cap explanatory tails, the
`(proposed — the gate to participate)` parenthetical, the reserve sentence's
second half), the red gate mark off the row, and **Confirm Participation** as
words on both controls.

⭐ **The finding: the per-priority targets were never missing.** They render and
always did. `.cplfund-dtl-tscroll` is a CHILD of `.cplfund-detail-grid`, whose
`repeat(auto-fit, minmax(240px, 1fr))` gave it one column — so a 620px-min table
scrolled sideways inside ~240px with three of its columns past a clip edge. A
`grid-column: 1 / -1` span is the entire fix. **When a curator says a surface
does not show something the code demonstrably renders, check LAYOUT before
logic.** New **To go** column names the distance to target and the funding it
would earn — only for a MEASURED row, because a privacy-suppressed actual plus a
gap IS the value by subtraction.

**PR #1433 — both consolidations.** Sam ruled the decision sheet the day it was
written.

- **The goal spine folded into the bands.** Half the fold restated the band
  above it and is gone; the half with no other home moved UP into the band, as a
  per-goal evidence line with the (A) and (C) design limits behind a fold. The
  four cards became a **four-row §78093.2(d)(2) table** one click down — still
  the only place all four goals read together, since the Report sub-view does
  not carry it.
- **The flat ledger** from the 2026-08-31 mock, with base and cap on their own
  line and the two CONTEXT figures moved into *How an allocation is computed*.
- A **collapsible introduction**, open by default.

## Sam's decisions this run (record, don't re-derive)

1. **Consolidate the goal spine as proposed** — yes.
2. **"Incorporate flat ledger while preserving a way to click into details."**
3. ⭐ **Mid-flight condition, verbatim: "I don't want to lose editability of
   variables we have in the model through the simplifying and consolidation
   process."**
4. **The three money columns in the drill-in stay** — *"dismiss, the lane split
   is worth the width."*
5. **The introduction is collapsible.**

## ⭐ THE THING WORTH CARRYING FORWARD

**A control surface can look like a display.** The seven pool boxes read as a
readout and were Sam's only way to edit the model — amount editor, label editor,
remove-from-the-math, hide-from-public, per box. "Flatten into a ledger" reads
like a presentation task, and the natural build prints the values: every figure
still correct, the page better looking, the dials gone, and **nothing on screen
saying so**.

Two defenses, both used and both reusable:

- **Keep the class vocabulary.** `.cplfund-card` names a ROLE — a labeled figure
  — not a shape. The flat treatment is CSS scoped to a `.cplfund-ledger`
  wrapper; the markup is untouched, so every editor, control, fold and absence
  guard kept working and ~25 assertions across nine suites did not need
  re-aiming.
- **Guard the dials, not the look.** `tests/cpl_funding_ledger_editable.test.js`
  (26 checks). ⚠️ **A guard that dies cannot report** — the first draft threw at
  an unguarded `commit(null)`, so the run ended before `finish()` printed and
  the assertion that caught the bug never reached the log.

## Read in order

1. `docs/reference/lanes/implementation-funding.md` — lane truth (the earn
   diagnostic, NEEDS SAM ⓪–②, NEXT ⓪–④).
2. `docs/cpl_funding_lessons.md` §2026-09-01 — two entries today, the trim and
   the consolidations.
3. `kb/docs_audit/latest.json` — run `python3 kb/_docs_audit.py` fresh.

## Priority work, in order

1. **If Sam has set the dials** (Accepted 25% / factor 1.0, starting set
   Eligible 40% · Accepted 25% · Transcribed 35% — HIS to set through the tab,
   never session SQL) — **re-run the earn diagnostic** and report the new
   spread. Still the whole point of the S218 restructure, and still open.
2. **One request to Pedro carrying all three feed additions** — the lifecycle
   booleans (sent 2026-09-01), Origin/LocID2, and completions (a NEW MAP view).
3. **AUDIT THE WHOLE EXPLAINER, don't fix it defect by defect.** Two stale
   static prose passages remain, open since S217: step one sizes on credit FTES
   over "all 115 … 1,069,182" (one-pool sizes on COMBINED over 118) and step
   three says factors are 1.0 (live Year-1 is 0.5). The painter only overwrites
   elements with ids.
4. **Sam's open display call** — the Annual-view earning percent can read >100%.
5. **Cleanup commit** — dead CSS for retired row shapes.

## Patterns that worked

- **Check layout before logic** when a rendered thing is reported missing.
- **Mutation-test every new guard**, and make sure it fails *by name* rather
  than by crashing — guard the calls that would throw when the thing is gone.
- **Run EVERY step of `js-tests.yml` locally before pushing.** #1432 went red on
  `kb/_build_dependency_map.py --check`, and ⚠️ **editing `cpl_funding.js` at all
  moves recorded line numbers in that artifact** — it is stale after every change
  to this tab. Sixteen steps, all but `npm test` are seconds.
- **Extract the shared function before writing the second surface.** Two places
  describing the same goal drift, and neither looks wrong alone.
- **Re-aim a guard to its requirement, never around it.** R11 said "the Summary
  sits above the first section"; its requirement is "never inside a fold". The
  intro belongs above the Summary, so the check now asserts both halves directly
  — strictly stronger than the proxy it replaced.

## Safety patterns to honor

- **Shares/factors/titles/pins are curator edits through the tab**, never SQL.
- **Never re-derive an allocation or a dial** — call `_alloc()`/`_prios()`/
  `_effective()`. Baked defaults in `cpl_funding_data.js` are stale by design.
- **The sunshine rule still holds** — outward materials carry general principles
  only until CO leadership confirms.
- Expect **two of three measures at ~$0** until the feeds land. Intended.
- **`--update-floor` and `--apply` are the only mutating switches** in the docs
  tooling; review their diff before committing.
- `cpl_memory` rows from this session are INSERT-only under author
  `session-219-skytrim` — rollback is
  `delete from cpl_memory where author = 'session-219-skytrim'`.
