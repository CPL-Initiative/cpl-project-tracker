---
title: Session 263 handoff — regional CPL opportunity, and a matcher that needs a rule
date: 2026-09-16
tags: [handoff, session-263, crosswalk, regional, coe, swp, my-college]
---

# You are SkyRegion (Session 263)

Sam, Ashley and Sigrid ran Session 262 live. It scaled the Delta prototype into a
regional instrument and stopped one step short of shippable. Read the matcher
section before you touch anything.

## Read in this order

1. `docs/regional_cpl_opportunity_lessons.md` — the full story, eight findings.
2. `docs/reference/lanes/partner-crosswalks.md` — current lane state.
3. `docs/kb-notes/methodology-a-title-match-must-cover-the-title-not-touch-it.md`
4. `kb/_build_regional_cpl_opportunity.py` — the tool, docstring first.

## What shipped

- **`kb/_build_regional_cpl_opportunity.py`** — a region's occupation list crossed
  against one or many colleges. `--college` and `--district` repeat and compose.
  Three outputs per run: workbook, screen page, printable handout.
- **The handout** — Ashley's ask, format from the Cal-JAC Credit Opportunities
  guide. Self-contained: print CSS, CPL Initiative + CCCCO logos embedded, and
  the workbook carried inside as a data URI so an emailed copy holds its own
  spreadsheet.
- **`kb/reference/coe_occupation_demand_2024_2029.json`** — 4,869 rows, 541
  occupations × 9 regions, SOC-coded. The SOC spine this lane has wanted.
- Earlier in the session: the SJCOE Electrical/Fire/Wildland crosswalk
  (PR #1576) and the articulation-group phantom-row finding.

## The priority workstream — fix the matcher

It is roughly **half right** and must not ship as is. *Commercial Pilots* matches
*Commercial Music*. *Gas Plant Operators* matches *Agriculture Plant Science*
(factory vs botany). *Residential Advisors* matches *Pest Control Adviser*.

Two bugs are already fixed and measured — read them before re-deriving:
- SOC titles use *"Except Police, Fire"* as a **negation**; `clean_title()` strips
  those clauses.
- A shared token alone is not a match. Coverage ≥ 0.5 took Santa Rosa from **233**
  "adopt now" to **24**. Rarity is not a substitute: on a 150-program corpus
  *medical* and *manufacturing* both read as rare.

⚠️ **Do not fix the rest with a list of forbidden words.** That rebuilds the
hand-curated offering map this tool exists to avoid, one word at a time.

⭐ **The route Sam's decision points at:** Delta's `kb/delta_offering_map.json`
holds **139 human rulings for one college**. That is a labeled test set. Score
the matcher against it, publish the error rate, then tune.

## Carryover

| Item | Status |
|---|---|
| Matcher tuning | **next** — score against Delta's 139 |
| Port into the My College tab | after the matcher; extend the existing scope picker |
| `cpl_occupation_match` verdict queue | designed, not built. New shared human-write table → **Rule 10(a3) Governance first** |
| College-to-region roster | **NEEDS SAM** — the nine COE codes ARE the SWP consortia, but nothing here maps colleges to them |
| PR #1576 (SJCOE crosswalk) | open, draft, green |
| Bay occupation→credential rulings | not started; only 17 of 139 existing rulings apply |

## Decisions Sam made this run

- **The COBI tab park is reversed.** Mechanical facts now, curated judgment as a
  queue. He had previously authorized only the regional-capacity view.
- **"Single pick is fine."** My College tab, single pick as the default.
- **No "it's this, not that."** *"Just make positive, active voice declarations."*
  Recorded in `CLAUDE.md` house voice, which had instructed the opposite.
- **Keep it plain.** Sigrid was in the room; the jargon was excluding her.

## Patterns that worked

- Reading `college_briefing.js` before designing. Two thirds of the ask was built.
- Treating an implausible count as a bug report. 233 vs 42 was the whole tell.
- Showing the half-broken page rather than describing it.

## Safety patterns to honor

- Workbooks and pages are gitignored; **receipts are committed**.
- The nine COE regions are **not** `college_geo.region`. Substituting the
  proximity scheme mis-groups a college's peers on a page people act on.
- Every rendered row says its matches are suggestions. Faculty decide.

Moniker for the next run: **SkyRegion**.
