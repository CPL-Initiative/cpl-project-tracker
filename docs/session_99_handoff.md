---
title: Session 99 handoff — after the Implementation Funding rework (Session 98)
date: 2026-07-03
tags: [handoff, session-99, implementation-funding, ccr-convergence, team-phrase]
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/ccr_convergence_handoff]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 99

Session 98 (2026-07-03, same day as BigSky/97 and the MindMeld CCR kickoff)
rebuilt the **Implementation Funding tab** into a Chancellor-facing scenario
tool and merged it as **PR #663**. Everything below is live on `main`.

## What shipped (Session 98, one PR)

1. **2-year selectable window** — two year dropdowns (default 2026-27 +
   2027-28, options through 2029-30); the pool divides by the number of
   selected years. The hardcoded 3-year `/3` is gone.
2. **Year-specific priorities** — a Year 1 / Year 2 filter switches each
   priority's metric text + share + target (and the college P1/P2/P3
   columns). Sam's six metrics are seeded; ALL text fields editable.
3. **Noncredit-feeder carve-out** — $1M (editable) top-of-pool deduction
   funds a feeder pool split by headcount among NOCE / SD Cont. Ed /
   Mt. SAC NC / Calbright. **Key find:** those 4 were MIS rows in the
   college table drawing allocations against metrics they can't earn —
   they were MOVED OUT (roster 119 → 115).
4. **Three-layer config** — per field `SCENARIO ?? SHARED ?? BASE`:
   localStorage what-if (anonymous, incl. the Chancellor) ⊕ Supabase
   **`cpl_funding_config`** (anon read; write `is_allowed_reviewer() OR
   team_pass_ok()`; `team_phrase.js` unlock bar; unlocking PROMOTES an
   explored scenario into the shared model) ⊕ baked defaults.
   KB note: `docs/kb-notes/methodology-three-layer-scenario-config.md`.
5. **Excel workbook RETIRED** (Sam: "we don't need that excel book
   anymore") — `funding/CPL_Funding_Model_2026.xlsx` + builder + revision
   scripts deleted; `cpl_funding_data.js` is the committed hand-maintained
   snapshot (builder recoverable from git history).
6. **2025-26 headcount refresh** — Sam's Annual 2025-26 table applied: 74
   college rows updated (aliases: Chabot Hayward→Chabot, Coalinga→West
   Hills Coalinga, Lemoore→West Hills Lemoore); **41 rows still carry
   2022-23** with per-row `hc_vintage` + a data-driven mixed-vintage
   footnote. SYSTEM headcount 2,258,784. Feeders carry real counts
   (NOCE 15,560 / SD 21,561 / Mt. SAC NC 35,363 / Calbright 2,484).

Tests: `tests/cpl_funding.test.js` rewritten — 119 assertions; suite 134
files green. Docs: `docs/cpl_funding_lessons.md` (Session 2 + follow-ups).

## Read in order (cold start)

1. `CLAUDE.md` — Critical Rules + §11 (Session 98 narrative) + the §8
   `cpl_funding_config` entry.
2. `docs/cpl_funding_lessons.md` — Session 2 sections (bottom).
3. `docs/ccr_convergence_handoff.md` — the PRIORITY lane's queue.
4. `docs/session_98_handoff.md` — BigSky context (Activities tab, reports).

## Priority workstreams

- **CCR Convergence (MindMeld) — the standing priority.** Sam's 🎤 voice
  pass on the 78-group calibration sample → distill `merge_doctrine_notes`
  → Doctrine v1 → re-measure agreement (gate ≥90%) → batch pass 2 + the
  ESL packaging pilot. Queue: `docs/ccr_convergence_handoff.md`.
- **Funding tab follow-ups (small, reactive):**
  - Sam/Chancellor true up the **41 colleges still on 2022-23 headcounts**
    (edit `cpl_funding_data.js` `colleges` + recompute `headcount_pct` +
    SYSTEM + bump `model_version`; the mixed-vintage footnote auto-clears).
  - **Admin-cost label** still says "2 FTE × 3 YRS = $1.2M" while the
    default window is 2 years — Sam may want $800K; editable in-tab.
  - Watch for Sam's first team-phrase config saves (`cpl_funding_config`
    row's `updated_at`); scenario-promotion UX feedback.
- **Native attachments** (decided, carried since S96/S97): private
  Supabase Storage bucket + `project_attachments` + per-card ⬆ Attach —
  spec in `session_97_handoff.md`.
- **Sierra lanes** (standing): guidance-pane adoption, Malone guardrails
  (cost cap BEFORE publicizing), vendor integration docs in sync.

## Patterns that worked (Session 98)

- **Policy-vs-data split**: when a tab's numbers become knobs, move the
  editable layer to config (Supabase blob) and keep the data file as
  DEFAULTS; never bake derived values (dollars computed live per render).
- **Move-don't-double**: institutions that can't earn a metric don't
  belong in the metric's allocation table — the feeder carve-out is the
  honest support channel.
- **Reuse `team_phrase.js`** (`unlockRow`, `decorateHeaders`,
  `checkWrite`, `handleWriteFailure`) — zero new auth code.
- **Data-driven honesty notes** (the mixed-vintage footnote) beat static
  disclaimers — they disappear when the data catches up.

## Safety patterns to honor

- Rule 4 (both HTMLs identical) — funding tab shell is in both; the
  renderer injects its own CSS so no mirror needed for styling.
- `cpl_funding_data.js` is HAND-MAINTAINED now — edit it directly, keep
  `headcount_pct` + SYSTEM in sync, bump `model_version`.
- `cpl_funding_config` writes are RLS-gated; never widen to bare anon.
- The RLS silent-no-op (200-with-zero-rows) is handled via
  `checkWrite` — keep `Prefer: return=representation` on PATCHes.

## Moniker

Session 98 went unnamed in the moment — call it **SkyLedger** (the funding
book, kept honest). You're Session 99: claim your own.
