---
title: "CCR Convergence handoff — you are the next session on this lane"
created: 2026-07-03
tags: [handoff, ccr, doctrine, mind-meld, convergence]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/ccr_convergence_strategy]]"
  - "[[kb/merge_doctrine]]"
  - "[[docs/ccr_convergence_lessons]]"
---

# You are the next CCR Convergence session

You inherit the **CCR Convergence kickoff** (2026-07-03, one PR on branch
`claude/ccr-merge-mint-decisions-ps2q0x`). This lane's goal: converge the
CCR's 7,716-group suggested-merge mountain into a ≤2,500-course CPL-facing
crosswalk catalog, by calibrating a written merge doctrine against Sam's
judgment and then batch-applying it. Read in order if cold:

1. `docs/ccr_convergence_strategy.md` — the plan of record (the reframe, the
   two-number goal, the batch ladder, the national frame)
2. `kb/merge_doctrine.md` — Doctrine v0: ESTABLISHED / PROPOSED / OPEN rules
3. `docs/ccr_convergence_lessons.md` — what shipped + the strata measurements
4. `kb/doctrine_out/2026-07-03/calibration_review.md` — the 78 pre-decided
   groups Sam is reacting to
5. CLAUDE.md §11 + `docs/ccr_merge_workspace_lessons.md` — the machinery you
   stand on (worklist lanes, guards, the Session-53 auto-merge pattern)

## What already exists (don't rebuild)

- **Doctrine v0** (`kb/merge_doctrine.md`) + question bank
  (`kb/doctrine_questions.json`, ids Q-LADDER…Q-FLOOR).
- **🧠 Mind-meld panel** live in the CCR worklist (`unified_courses.js` —
  `buildMindMeldPanel`, `doctrineFeatures`, test hook `CPL_UC_MINDMELD`;
  31-check test `tests/uc_mind_meld.test.js`). Saves to Supabase
  **`merge_doctrine_notes`** (schema `kb/supabase_merge_doctrine.sql`;
  reviewer-gated INSERT/UPDATE, reviewer/team-phrase SELECT, NO delete).
- **Calibration instrument**: `kb/_doctrine_calibration_sample.py` (seeded,
  re-runnable; change SEED/DATE for a fresh sample) + the 2026-07-03 receipts
  (sample / decisions / review) under `kb/doctrine_out/2026-07-03/`.
- **Strata measurements** (2026-07-03 payload): ladders 1,533 · same-college
  1,773 · cross-disc 1,214 · credit/NC 776 · plain-anchored 886 · similarity
  614 · units-spread 297 · singletons 250 · evidence 130 · activity 125 ·
  strands 76 · generic 18 · honors 24.

## Your priority queue

1. **Distill the mind-meld.** Read new `merge_doctrine_notes` rows
   (service key via the Supabase MCP; stamp `distilled_at` on what you fold
   in). Sam's reactions to the 78 calls — agreements, disagreements, answered
   Q-* — become doctrine edits: PROPOSED→ESTABLISHED, OPEN→settled, new rules
   where he says something the doctrine lacks. Bump the doctrine version and
   log the diff in the lessons doc. **If the notes table is still empty, ask
   Sam for the Phase-1 voice sitting before anything else — the batch is
   gated on calibration.**
2. **Measure agreement.** Re-run the sampler with a NEW seed/date → fresh
   held-out sample → re-decide blind (the 4-agent pattern in the kickoff
   session; prompts in the lessons doc) → compare to Sam's spot-reactions.
   Gate: ≥90% before pass 2.
3. **Batch pass 2** (`doctrine-v1@bot`): extend `kb/_auto_merge_worklist.py`'s
   dry-run→plan→SQL→report shape to all six lanes with AI decisions in the
   calibration schema + the mechanical gates (band purity, live-member
   re-check, dismissals, unconsumed target, confidence floor 0.8). Sam skims
   `report.md`, then apply in one cron window (Rule 7). ON CONFLICT DO
   NOTHING — human rows always win.
4. **Packaging pass** (`package-v1@bot`): ESL pilot first (P-3/P-4; band-
   aware; original level in every `merge_note`), Sam blesses the CCR result,
   then the other ladder disciplines (KIN/Dance/Music pending Q-TARGETCOUNT).
5. **Tier-1 + reporting**: CPL-facing tier flag (demand-gated per strategy
   §3), per-discipline convergence report, a Convergence card on the
   dashboard, and refresh the Pipeline tab (`#tab-pipeline`, BOTH HTMLs) —
   the kickoff deliberately deferred it until the pipeline actually moves.

## Safety patterns to honor

- Rule 7 playbook for anything that re-keys identities; receipts under
  `kb/*_out/<date>/`; cohort stamps; alias maps.
- Never write to the public `cpl-knowledge-base` from this lane (curation
  pipeline only). Faculty-facing framing goes in `docs/ccr_rules_brief.md`
  (add the packaging section WITH the packaging pass, not before).
- `doctrineFeatures()` (JS) and `features()` (sampler) are hand-mirrored —
  change both or the panel and the sample drift.
- Don't cat the big `coci_*.json` / `unified_courses_*.js` files; measure
  with scripts.
- Concurrent sessions: keep CLAUDE.md/§11 edits ≤10 lines, rebase on
  conflict, never force-push main.

## Moniker

Kickoff session went unnamed (call it **MindMeld** in retrospect). Claim your
own — suggestion: **Doctrine** or **SkyForge**. Door's open.
