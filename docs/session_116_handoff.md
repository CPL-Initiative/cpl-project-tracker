---
title: Session 116 handoff — from the doctrine graduation into execution
date: 2026-07-14
tags: [handoff, ccr, doctrine, esl, batch-apply, wave-4]
related: [docs/ccr_convergence_lessons.md, kb/merge_doctrine.md, docs/kb-notes/methodology-curated-scenario-batches-doctrine-elicitation.md]
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 116.

Sam (MAP@rccd.edu) runs the **CPL Initiative**. Session 115 was **StarMagna** —
it took the CCR merge/mint doctrine from graduation through a big scenario-
refinement cascade. **Your headline is EXECUTION: turn the now-rich doctrine into
a reviewable dry-run, starting with ESL.**

Claim a moniker (the "Star…" family is the current run — **StarForge** or
**StarHarvest** fit "turn doctrine into applied plans," but coin your own).
Confirm the session number with Sam if his greeting names a different one — the
authoritative handoff is always the highest-numbered `docs/session_<N>_handoff.md`.
(Note: S115 kept the "115" label it adopted early even though the prior numbered
handoff was `session_114`; the side-lanes had jumped the count. Don't relitigate —
just take the next number.)

## Read these first, in order
1. **This file.**
2. **`kb/merge_doctrine.md` (v0.11)** — the rulebook. Read Part I (P-1 the
   student-repeat test), the 2026-07-14 rulings (P-6/P-1b/P-7, 3-rung cap), P-3/P-4
   (the ESL 3-comprehensive collapse), P-10 (FL numeric rungs), P-11 (activity
   doctrine + the permutation-pressure lever), and Part V (gate PASSED, batch-apply
   authorized).
3. **`docs/ccr_convergence_lessons.md`** — batches 1–5 (2026-07-14) hold the full
   story of the graduation + every ruling with Sam's quotes.
4. **`docs/kb-notes/methodology-curated-scenario-batches-doctrine-elicitation.md`**
   — HOW to keep eliciting doctrine from Sam efficiently (small grounded batches;
   profile-before-edges; gate-as-interview). This is the method that worked.
5. **`CLAUDE.md`** — Rule 9 (Supabase live-curation safety), Rule 4, Rule 7
   (re-mint playbook), the merge-on-green rules, §11.

## What shipped in S115 (all merged, v0.6 → v0.11)
- **#784/#785** — the **v0.6 calibration re-seed → graduation gate**. Blind
  regression reproduced Sam's ratified calls **92% fundamental / 94.7% fine**
  after his two gate rulings (P-6 same-college merge form; new P-1b homonym
  breadth). Doctrine GRADUATED; whole-worklist batch-apply authorized. Receipt:
  `kb/doctrine_out/2026-07-14/v06_gate_measurement.md`; the fresh held-out sample
  for an optional Sam confirm walk: `calibration_review_v06.md`.
- **#786** v0.8 — P-7 generic-shell umbrellas (one per generic-type × subject);
  Q-FLOOR bounded (enrichment merges when the learning matches); the 3-rung cap.
- **#787** v0.9 — the **ESL 3-comprehensive collapse**: 2,364 ESL → Beginning/
  Intermediate/Advanced, all strands + content-for-ESL folded; carve-outs =
  transfer-level ESL, ESL Citizenship, VESL. Q-STRANDS settled.
- **#788** v0.10 — Foreign Language **numeric** rungs ("Spanish 2", drop
  "Beginning"); the 3-rung-cap exemption = per-rung official (C-ID) identity.
- **#789** v0.11 — **Music/Dance activity doctrine** (Q-TARGETCOUNT FULLY settled):
  Dance styles → ONE "Dance Technique" B/I/A (for **permutation volume**, a new
  lever); Music applied → per-instrument; ensembles → per-type; Theory/History keep
  transfer rungs.

## Your priority workstream: SHOW THE PAYOFF, then apply
1. **Build the ESL dry-run preview (the flagship, `package-esl@bot`).** Run the
   v0.11 ESL rules over the real 2,364 ESL identities → a committed plan mapping
   each to Beginning/Intermediate/Advanced ESL (+ the transfer-level/Citizenship/
   VESL carve-outs pulled out), with the level-assignment logic (title mark;
   no-level → Beginning) and `merge_note` receipts. **Dry-run only** — Sam skims
   the plan, THEN it applies in one cron window (Rule 9: fresh live read,
   INSERT-only `ON CONFLICT DO NOTHING`, cohort `package-esl-s116@bot`, receipt).
   This de-risks the whole batch-apply by proving the pattern on the discipline
   Sam most wants solved.
2. **Then the general batch-apply** (Doctrine Part V step 3): dry-run planner over
   all lanes → committed plan + report → Sam skims → apply, cohort-stamped.
3. **Wave 4** is staged and independent (`kb/ccr_out/2026-07-14/wave4_manifest.json`
   — 2,000 multi-college IDs, 50 batches). Run the adjudication fan-out under v0.11
   when ready (blind; then a skeptic pass → fire-ready lanes for Sam's approval).

## Carryover (see `kb/cpl_todos.json` for the live list)
- **4 open doctrine forks** (smaller/cleanup): **Q-UNITS** (unit-spread merge
  threshold), **Q-HONORS** (honors fold?), **Q-XDISC** (cross-discipline same-course
  merge-and-pick vs hold), **Q-MINTNAME** (mostly answered by P-10). Close them with
  one more small scenario batch if Sam's up for it.
- **v0.6 confirm walk** (optional) — the fresh held-out sample awaits Sam's A/D
  marks; the gate is already cleared, so it's confirmation not a blocker.
- **crnc-detector-wire** — suppress D-3 `credit_mixed` for the 1,337 CR/NC mirrors.
- **blank-discipline reseed** wiring; **cte-parse-gaps**; **aviation-restage**.
- Sam's curation lanes: Carpentry merge-confirms, CER Trail-Crew lanes, CSR queue (3).

## Patterns that worked (S115)
- **Small curated scenario batches (≤3 forks) beat the firehose.** The 🧠 panel's
  thousands overwhelmed Sam; 3 grounded forks at a time settled 7 open questions.
- **Profile the discipline BEFORE bringing the edges** (count first, then ask about
  the piles at the margins — that's what made the ESL edges sharp).
- **Frame against the nearest settled precedent** (Music/Dance vs KINE's P-11).
- **Capture the REASONING as named levers** (the P-5 unit signal; the permutation-
  pressure lever) — reusable far beyond the row that surfaced it.
- **Gate-as-interview**: a blind calibration gate's divergences ARE the unsettled
  forks — surface them as prompts.

## Safety patterns to honor
- **Rule 9** — Supabase live-curation: fresh read at write-time, cross-check pending
  `unified_title_merge_confirm` targets, INSERT-only `ON CONFLICT DO NOTHING` under
  `<lane>-s<N>@bot`, committed receipt. Reads Range-paginated. Supabase only via MCP
  tools (sandbox can't reach `*.supabase.co`).
- **Rule 7** — any re-key follows the re-mint playbook (dry-run, alias map, re-key
  articulations + promotions). The ESL/packaging passes are curation writes, not
  re-mints, but a packaging merge that changes a survivor id is a re-key — check.
- **Rule 4** — `CPL_Dashboard.html` / `index.html` byte-identical.
- **Merge-on-green** (`clean` OR `unstable`), squash; never force-push `main`; poll
  CI via the **MCP github tools**, not curl. Reset the branch from `origin/main`
  after each merge before the next commit.
- **Doctrine is reversible + receipted (D-6)** — every batch cites rule ids; a
  reversal identifies exactly the cohort to revisit.

Go turn the doctrine into something Sam can see. — StarMagna (S115)
