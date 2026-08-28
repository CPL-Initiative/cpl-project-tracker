---
title: Session 201 handoff — from SkyLane (Session 200)
created: 2026-08-27
updated: 2026-08-28
tags: [handoff, session-201, cpl-funding, noncredit, measurement]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 201

SkyLane here. **Noncredit build step 2 is done and MERGED (#1367)** — the NC lane
earns, and the Option A row went through ~12 visual passes with Sam live in the
loop. The lane earns **$0 today, deliberately**, and that is the feature.

⚠️ **Numbering.** `docs/session_200_handoff.md` exists and is NOT mine — it is the
parallel LATTC/military-CPL run (SkyMatch, #1365) that landed on `main` mid-session.
Two sessions ran 2026-08-27; neither supersedes the other. This file is 201.

## ⭐ Sam's rulings this run

| ruling | what it settles |
|---|---|
| **NC shares = credit's, 34/33/33** | The last unruled dial. Built as inheritance with an `ncPriorities` override layer, so diverging later is one field. |
| **"Confirm participation", not "opt in"** | Opt-in presumes a default of OUT and makes declining look normal. Nothing here turns on a choice, only on results. `partLabel` is now "Participation confirmed by" in the live config. |
| **"Earning", not "earned"** | *"reinforce that it's not a done deal until they qualify."* |
| **Zebra per COLLEGE, not per row** | A college's CR and NC rows share one stripe; the next college alternates. |
| **Show ALL noncredit rows, even below threshold** | Because the threshold is a dial he moves. |
| **Header → "2025 Ttl FTES/Funding"**, size cell shows each row's own lane, ONE `TGT:`/`NOW:` label column, NC chip right of the name | The row is his; he drove every one of these. |

## ⛔ The finding he has not answered yet

**The NC threshold cannot go below 400 at the $50k floor.** Swept through the
model:

| threshold | in lane | floor demanded | vs $1.8M |
|---|---|---|---|
| **400** | **35** | **$1.75M** | **last feasible step** |
| 350 | 38 | $1.90M | ✗ `floorInfeasible` |
| 200 | 58 | $2.90M | ✗ |

**The threshold and the floor are ONE decision.** The lever for a wider lane is
the floor or the carve-out, not the threshold. Also: at 450 and below the $100k
ceiling stops binding entirely (capped 2 → 0). **He has not ruled.**

Also open and unanswered: **the ⬆/⬇ glyph** — he asked what it meant, which IS
the finding. One mark, two jobs (the $150k *credit* floor on a credit row, the
$50k *noncredit* floor on an NC row), told apart only by hover, against his own
standing preference for plain words. Recommend the words `min` / `max`.

## ⚠️ Safety patterns this run earned

- **A second lane that inherits the first lane's WORDING must pin its measure.**
  An unpinned NC priority does not fail to resolve — it resolves *confidently*
  onto a CREDIT source and scores noncredit money on credit performance.
  ⭐ The coupling runs both ways: the NC rung comes from how the CREDIT priority
  resolved, so **Sam's `ppa_u` pin is load-bearing for BOTH lanes**.
- **A lane that can never be measured must never take the ADVANCE.** The
  artifact-not-loaded branch pays the FULL CAP and fires *before* the
  delivered-check — unguarded, a slow load disburses the whole **$1.8M**.
- **A share set MULTIPLIES the pot, it does not normalize it** — 1.30 places
  1.30 × W, in the credit lane too. My first assertion encoded an invariant
  credit does not have.
- **A compact formatter is calibrated to a MAGNITUDE.** `fmtCountK` rounds to
  whole numbers — noise on a credit target in the hundreds, a misstatement at
  NC's 1–25 FTES (1.4 → "1", <0.5 → "0"). Nine jsdom assertions on that cell
  passed; a screenshot found it. KB note:
  `methodology-a-compact-formatter-is-calibrated-to-a-magnitude`.
- ⚠️ **I broke two suites I never ran, the same way, twice** —
  `cpl_funding_metric_pin` (9 of 43) and `cpl_funding_basis` (1). Both were
  coupled to something they were not testing: cell INDEX and a literal LABEL.
  **A layout change reaches every suite that locates an element; a wording
  change reaches every suite that matches a string.** Both now assert the
  contract (`td.cf-prio` in order IS P1/P2/P3; the size column NAMES the basis).
- ⚠️ **Do not mutate a source file while a full-suite run is in flight** — I
  invalidated a 15-minute run, then compounded it with a `git checkout --` that
  wiped `cpl_funding.js`. A copy taken before the first mutation saved it.
- **Verify against the LIVE config, not the bake.** The bake differs on all four
  properties that matter and has two priorities on one rung, so it cannot
  exercise the three-distinct-sources mapping. Dump live via MCP and verify
  **byte-identical** against `md5(config::text)`; put a live-**shaped** fixture
  in the suite, never the live config.

## Where the work stands

- `#1367` merged: NC lane earns, Option A row, below-threshold rows, the wording,
  `partReqText()`, the check-floor record (**277 files, 0 failures**).
- Live NC lane: **$1.8M · 33 institutions · $50k floor / $100k cap · 30 floored /
  2 capped · $0 earned across all 33**, exactly ONE earning proportionally — as
  an incentive the lane is almost entirely a grant today.
- `scripts/check_funding_nc_row_layout.js` — **13 Chromium checks** for what
  jsdom cannot see (alignment, no horizontal scroll, stripe grouping, chip fill).
  Run with `PW_CHROMIUM=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.

## Carryover

- Sam's **phone check** on the Fact Sheet + Sierra/veteran-map pages.
- `docs/reference/troubleshooting.md` still says only "confirm and dismiss" for
  the stop-hook nag; `git remote prune origin` is the real fix.
- **`american_spelling` 171 · `oversized_doc` 5** — pre-existing lint debt, not
  this run's.
- NC **standalone institutions have no perf record** (no credit row).
  Unreachable today because `undelivered` fires first; when MAP delivers the
  `nc_*` keys, decide whether they get rows or a distinct absent state.

## Docs to read, in order

1. `CLAUDE.md` §11 — the funding cell (rewritten twice this run; it states
   current truth and fits the 4,000-char lint cap)
2. `docs/cpl_funding_lessons.md` — the two 2026-08-27 sections
3. `docs/kb-notes/methodology-a-compact-formatter-is-calibrated-to-a-magnitude.md`
4. `cpl_memory` — `tags && array['cpl-funding','noncredit']` **before** touching
   this. Rows written this run cover the shares ruling, the pin coupling, the
   advance hazard and the formatter.

## Moniker

I took **SkyLane** — money earns in exactly one lane, and is never measured
against the other one's data. Yours is open.

**Next is Session 202 — `docs/session_202_handoff.md`.**
