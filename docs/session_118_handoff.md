---
title: Session 118 handoff — from a fully-settled doctrine into execution (ESL apply → batch-apply → the other packaging passes)
date: 2026-07-15
tags: [handoff, ccr, doctrine, esl, packaging, batch-apply, wave-4]
related: [kb/merge_doctrine.md, docs/ccr_convergence_lessons.md, kb/esl_package_out/2026-07-15/, docs/kb-notes/methodology-packaging-dryrun-classification.md]
---

# You are Session 118.

Sam (MAP@rccd.edu) runs the **CPL Initiative**. Session 117 was **StarMarcus** — it
closed the merge/mint doctrine's **last open forks** (now **v0.13**, every named
Part IV question RESOLVED) and shipped the **ESL packaging dry-run** — the flagship
payoff. **Your headline is EXECUTION: land the ESL apply (once Sam green-lights the
plan), then the general batch-apply, then run the same dry-run pattern on the other
packaging disciplines.**

Claim a moniker (the "Star…" family is the current run — **StarForge**, **StarHarbor**,
or coin your own). Confirm the number with Sam if his greeting names a different one —
the authoritative handoff is always the highest-numbered `docs/session_<N>_handoff.md`.

## Read these first, in order
1. **This file.**
2. **`kb/merge_doctrine.md` (v0.13)** — the rulebook, now fully settled. Skim Part I
   (P-1 student-repeat test), the batch-6 rulings (P-13 honors, P-5 whole-vs-part,
   D-8 Q-XDISC procedure), P-13 (the D-4 variant family), P-3/P-4 (the ESL collapse),
   Part IV (every fork RESOLVED), Part V (batch-apply authorized).
3. **`docs/ccr_convergence_lessons.md`** — batches 6–7 + **the ESL dry-run section**
   (2026-07-15) with the classifier lessons.
4. **`docs/kb-notes/methodology-packaging-dryrun-classification.md`** — the reusable
   template for building the NEXT packaging dry-runs (Music/Dance/KINE). Read before
   you write one.
5. **`kb/esl_package_out/2026-07-15/esl_package_report.md`** — the ESL plan Sam is
   skimming; `esl_package_plan.json` is the full 2,364-row mapping.
6. **`CLAUDE.md`** — Rule 9 (Supabase live-curation safety), Rule 7 (re-mint
   playbook), Rule 4, the merge-on-green rules, §11.

## What shipped in S117 (both merged)
- **#791** — doctrine **v0.12→v0.13**. Two grounded 3-fork scenario batches closed
  every remaining named open fork; Sam swept all six with the recommended calls:
  **Q-HONORS→P-13** (honors folds to base; standalone honors-program courses keep
  identity), **Q-UNITS→P-5** (big spread on a non-standardized course = whole-vs-part
  split signal, not a cap — the academy carve-out P-5a unchanged), **Q-XDISC→D-8**
  (same-subject-code → canonical SUBJ4; diff-code + title collision → P-12 homonym
  gate), **Q-VARIANT→P-13** (Lab folds; Refresher & Bridge stay separate — the D-4
  marks DON'T share one rule; each reduces to P-1's student-repeat test).
- **#792** — the **ESL packaging DRY-RUN** (`kb/_esl_package_dryrun.py`,
  measurement-only). The real **2,364** ESL identities (650 M-IDs + 1,714 singletons)
  → Beginning **1,305** / Intermediate **548** / Advanced **296** (2,149 fold) +
  carve-outs Citizenship **38** · VESL **155** · Transfer-review **22**. A visual
  artifact was published for Sam.

## Your priority workstream: EXECUTE
1. **Land the ESL apply — ON SAM'S GREEN-LIGHT** (it's in his `esl-review` to-do). He
   confirms the plan (especially the **22 transfer-level candidates** — no
   transferable flag in the data, so they were held for his call, not auto-folded).
   THEN write `kb/_esl_package_apply.py` from the committed plan: Rule 9 (fresh live
   read at write-time, INSERT-only `ON CONFLICT DO NOTHING`, cohort
   `package-esl-s117@bot`, committed receipt), re-key the **6 promotions** (Rule 7).
   **Wire the letter-rung fix first** (A/B/C/D ladders default to Beginning — map
   A/B/C/D→rungs before applying). Do NOT apply without his skim.
2. **The general whole-worklist batch-apply** (Doctrine Part V step 3): dry-run
   planner over all lanes → committed plan + report → Sam skims → apply, cohort-stamped.
3. **The OTHER packaging passes.** The doctrine now has ratified policy for Music,
   Dance, KINE (P-11) — reuse the ESL dry-run pattern (the KB note is the template)
   to build their dry-runs: Dance → one "Dance Technique" B/I/A; Music applied →
   per-instrument B/I/A; ensembles → per-type; KINE → Conditioning B/I/A + per-sport.
4. **Wave 4** is staged and independent (`kb/ccr_out/2026-07-14/wave4_manifest.json` —
   2,000 multi-college IDs). Run the adjudication fan-out under v0.13 (blind → skeptic
   pass → fire-ready lanes for Sam).

## Carryover (see `kb/cpl_todos.json` for the live list)
- **crnc-detector-wire** — suppress D-3 `credit_mixed` for the 1,337 CR/NC mirrors
  (add `kb/_detect_crnc_mirrors.py` to the post-apply chain).
- **blank-discipline reseed** wiring; **cte-parse-gaps** (~30 TOP codes → 6,495
  cte:null); **aviation-restage**; **homonym-recheck** (~100 TOP-driven splits).
- Sam's curation lanes: subject-code-outlier triage (302), Carpentry merge-confirms,
  CER Trail-Crew lanes, CSR queue (3).

## Patterns that worked (S117)
- **Small curated scenario batches (≤3 forks) beat the firehose** — 6 forks, 2
  batches, all closed. Profile the data BEFORE bringing the edges.
- **A fork answers itself when the "hard" pile is an already-handled class** (the
  scary 826-group unit-spread pile was mostly standardized academies already merging
  fine → the real residue was a sharp whole-vs-part question).
- **Ratified levers generalize** — the KINE combo rule (P-11) transferred straight to
  ESL combos; the whole-vs-part unit ruling transferred straight to the Refresher mark.
- **Dry-run classifier discipline:** reconcile the population count first; carve-outs
  are title-PRIMARY; no authoritative flag → a REVIEW bucket, never an auto-fold;
  default to the safe under-claim; emit signal + confidence per row.

## Safety patterns to honor
- **Rule 9** — Supabase live-curation: fresh read at write-time, cross-check pending
  `unified_title_merge_confirm` targets, INSERT-only `ON CONFLICT DO NOTHING` under
  `<lane>-s<N>@bot`, committed receipt. Reads Range-paginated. Supabase only via MCP
  tools (sandbox can't reach `*.supabase.co`).
- **Rule 7** — an apply that changes a survivor id re-keys articulations + promotions.
  The ESL apply re-keys 6 promotions; measure the surface before every apply.
- **Rule 4** — `CPL_Dashboard.html` / `index.html` byte-identical.
- **Merge-on-green** (`clean` OR `unstable`), squash; never force-push `main`; poll CI
  via the **MCP github tools**, not curl. Reset the branch from `origin/main` after
  each merge before the next commit.
- **Dry-run FIRST, always** — measurement-only, committed plan, Sam skims, THEN apply.
  Reversible + receipted (D-6): every batch cites rule ids.

The doctrine is done being questioned — now make it act. Go execute. — StarMarcus (S117)
