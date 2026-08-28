---
title: Session 201 handoff — from SkyLane (Session 200)
created: 2026-08-27
updated: 2026-08-27
tags: [handoff, session-201, cpl-funding, noncredit, measurement]
kb-status: internal
obsidian-folder: cpl-project-tracker
---

# You are Session 201

SkyLane here. **Noncredit build step 2 is done**: the NC lane now EARNS, and the
Option A row renders under every college with a noncredit program. Sam cleared the
last dial in one line, and the build itself was mostly about making sure a lane
that earns nothing yet cannot quietly earn something wrong.

⚠️ **Numbering note.** Sam's greeting pointed at `docs/session_200_handoff.md`; the
highest file on disk was **199** (SkyPin wrote it as Session 198, for 199). I took
Sam's framing — I am 200 — so this file is 201. If the numbers look off by one, that
is why. `ls docs/session_*_handoff.md`, read the highest, confirm with Sam.

## ⭐ Sam's ruling this run

| ruling | what it settles |
|---|---|
| **NC shares = credit's, 34/33/33** | The last unruled dial. Built as INHERITANCE from the credit priorities so they stay in step, with an `ncPriorities` override layer so diverging them later is one field. |

He also said, mid-build: ***"The config is likely old news. Check the tab for current
numbers and metrics."*** He was right, and see below — it changed what I verified.

## What shipped

- **`ncPriorities(slot)`** — credit's three priorities re-pointed at
  `nc_pe_u`/`nc_pa_u`/`nc_pt_u`, mapped **by milestone out of `METRIC_SOURCES`
  itself** rather than written down twice. Titles, descriptions, strategies,
  shares and factor are inherited; `ncPriorities` overrides layer scenario →
  shared → baked.
- **`prioEntitlement()` routes on `p.lane`** — the one new idea. *Route, don't
  split*: a priority belongs to one lane and is measured against that lane's pot;
  `share` splits the MONEY inside the lane. Everything downstream (the clamp, the
  earning ladder, front-load carryover, the floor/ceiling asymmetry) is reused.
- **`ncShareSum` / `ncSlotEntitlement` / `ncPrioCap` / `ncPrioEntitlement` /
  `ncCapScale`** — the NC mirrors, because the credit ones normalize by the
  CREDIT share sum.
- **The Option A row** (`ncCollegeRowHtml`) — a second row per college, CR/NC
  chips, Tgt/Now aligned, bold only on Total. Built as a `collegeAlloc()`-shaped
  object so `yearCellsHtml()`/`totalCellHtml()` render it unchanged.
- **`tests/cpl_funding_nc_lane.test.js`** — 48 assertions, six blocks.
- **`scripts/check_funding_nc_row_layout.js`** — 9 Chromium checks.
- **KB note** `methodology-a-compact-formatter-is-calibrated-to-a-magnitude`.

## ⚠️ Safety patterns this run earned

- **A second lane that inherits the first lane's WORDING must pin its measure.**
  An unpinned NC priority does not fail to resolve — it resolves *confidently*
  onto a CREDIT source and scores noncredit money on credit performance. There is
  no unpinned path in this lane by construction; an unmappable milestone takes a
  deliberately-unknown key so it lands in the loud `bad_src` branch.
  ⭐ **And the coupling runs both ways** — the NC rung comes from how the CREDIT
  priority resolved, so **Sam's `ppa_u` pin is now load-bearing for BOTH lanes**
  (F9/F10 pin this).
- **A lane that can never be measured must never take the ADVANCE.** The
  artifact-not-loaded branch pays the FULL CAP and fires *before* `srcDelivered()`
  is consulted — so without a lane test a slow load disburses the whole **$1.8M**.
- **A share set MULTIPLIES the pot, it does not normalize it.** Shares summing to
  1.30 place 1.30 × W — **in the credit lane too**. My first assertion encoded an
  invariant credit does not have. Measure before asserting.
- **A compact formatter is calibrated to a magnitude.** `fmtCountK` rounds to
  whole numbers — right for credit targets in the hundreds, a misstatement at
  NC's 1–25 FTES (1.4 → "1", <0.5 → "0", an *absent-looking* zero on the one lane
  built to distinguish absent from measured). **Nine jsdom assertions on that cell
  passed.** It took a screenshot.
- **Verify against the LIVE config, not the bake.** Every test block runs on the
  baked defaults, which differ from live on all four properties that matter here —
  and the bake has two priorities on the transcribed rung, so it *cannot* exercise
  the three-distinct-sources mapping. Dumped live via MCP and verified
  **byte-identical** against `md5(config::text)` in Postgres rather than trusting
  my own copy. Then a live-**shaped** fixture went into the suite, never the live
  config (a test carrying today's shares goes red the next time Sam edits one).
- ⚠️ **Do not mutate a source file while a full-suite background run is in
  flight.** I invalidated a 15-minute run that way, then compounded it with a
  `git checkout --` in the restore step that wiped `cpl_funding.js`. A copy taken
  before the first mutation is what saved it.

## Measured on the live config

| | live |
|---|---|
| NC carve-out | **$1,800,000** |
| threshold | 500 FTES → **33 institutions** |
| NC floor / cap | **$50,000 / $100,000** |
| at floor / at cap | **30 / 2** |
| earned across all 33 | **$0** (every priority `undelivered`) |

⭐ **Exactly ONE institution of 33 earns proportionally.** `breakEven` already said
so (3,909 FTES); 30/33 makes it concrete. **As an incentive the lane is currently
almost entirely a grant** — a dial question for Sam, not a defect.

## Priority workstream — what's next

1. **Sam looks at the row in a browser.** Density and the tint are his calls.
   Screenshot sent in-session; `scripts/check_funding_nc_row_layout.js` reproduces it.
2. **The credit-lane variant of the rounding** — a small college's FTES-denominated
   credit target can also fall under 100. Left alone deliberately rather than
   widened into a live tab mid-build.
3. **NC's own strategy text.** Year-1 P-Success still lists *"noncredit mirror
   courses"* among CREDIT strategies (carryover from Session 199). NC priorities
   inherit credit's strategies today. Moving that line edits curator-authored text
   in the live config — **Sam's call, not a session's.**
4. **The 30-of-33-at-floor question** above.

## Carryover

- Sam's **phone check** on the Fact Sheet + Sierra/veteran-map pages.
- `docs/reference/troubleshooting.md` still says only "confirm and dismiss" for the
  stop-hook nag; `git remote prune origin` is the real fix (SkyPin, unactioned).
- **`american_spelling` is at 170 findings** repo-wide and `oversized_doc` at 5 —
  neither is this run's, both are real lint debt.
- The NC lane's **standalone institutions have no perf record** (no credit row).
  Unreachable today because `undelivered` fires first; when MAP delivers the
  `nc_*` keys, decide whether they get rows or read as a distinct absent state.

## Docs to read, in order

1. `CLAUDE.md` §11 — the funding cell (rewritten this run; it states current truth
   and now fits the 4,000-char lint cap, which it did not before)
2. `docs/cpl_funding_lessons.md` — the 2026-08-27 (Session 200) section
3. `docs/kb-notes/methodology-a-compact-formatter-is-calibrated-to-a-magnitude.md`
4. `cpl_memory` — query `tags && array['cpl-funding','noncredit']` **before**
   touching this. Four rows written this run.

## Moniker

I took **SkyLane** — the run was about money earning in exactly one lane, and
never being measured against the other one's data. Yours is open.

**Next is Session 202 — `docs/session_202_handoff.md`.**
