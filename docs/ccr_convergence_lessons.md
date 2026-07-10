---
title: "CCR Convergence lessons — doctrine, mind-meld, and the batch ladder"
created: 2026-07-03
tags: [ccr, doctrine, mind-meld, merge, mint, lessons]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/ccr_convergence_strategy]]"
  - "[[kb/merge_doctrine]]"
  - "[[docs/ccr_merge_workspace_lessons]]"
---

# CCR Convergence — lessons

## 2026-07-03 — Kickoff: the doctrine + mind-meld instrumentation (one PR)

**The charge (Sam).** 7,700+ suggested-merge decisions are unworkable by
hand. Have Fable decide the merges/mints (faculty validate later), build a
mind-meld that captures the faculty/dean/VPAA reasoning — voice, not typing —
and aim at a ≤2,500-course crosswalk for the MAP faculty workgroups. Think
national scale.

**What shipped.**

- **`docs/ccr_convergence_strategy.md`** — the plan of record. Key reframe:
  stop grinding the queue, write the decision policy down, calibrate it
  against Sam cheaply (78 pre-decided groups, voice reactions), then batch-
  apply through the proven Session-53 pattern. The "≤2,500" goal became the
  **two-number structure**: a CPL-facing Tier 1 (≤2,500, demand-gated) over
  a continuously-converging total space — no defensible policy folds 73k
  rows to 2,500, and none needs to.
- **`kb/merge_doctrine.md` (v0)** — the mind-meld artifact: ESTABLISHED
  rules (cite, don't relitigate: precedence, evidence ladder, band purity,
  guard suite, human sovereignty, receipts), PROPOSED judgment rules (CPL
  utility P-1, level-band packaging P-3/P-4 — the ESL move, units tolerance
  P-5, same-college-as-variants P-6, generic-title bar P-7, CTE merge bias
  P-8, staging default merge-and-flag P-9, naming P-10), and 11 OPEN
  questions with ids (Q-LADDER … Q-FLOOR).
- **`kb/doctrine_questions.json`** — the contextual question bank; triggers
  (level_ladder, credit_noncredit_mix, same_college, …) map group features →
  the question that group instantiates.
- **The 🧠 Mind-meld panel** (`unified_courses.js`) — renders under every
  worklist group: matched doctrine question(s), a 🎤 Dictate button (Web
  Speech API; degrades to typing), stance picker, save →
  **`merge_doctrine_notes`** (new Supabase table, applied live; schema of
  record `kb/supabase_merge_doctrine.sql`; reviewer-gated INSERT, no DELETE —
  audit trail). Auto-opens when a specific trigger matches. Fail-soft
  everywhere. Tests: `tests/uc_mind_meld.test.js` (31 checks; reads the REAL
  committed question bank so trigger names can't drift).
- **The calibration instrument** (`kb/_doctrine_calibration_sample.py` →
  `kb/doctrine_out/2026-07-03/`): 78 groups stratified across 13 doctrine
  triggers, pre-decided by 4 parallel decision agents against Doctrine v0 —
  `calibration_decisions.json` (calls + cited rules + confidence) +
  `calibration_review.md` (the doc Sam reacts to). Call mix: 26 keep-separate
  · 19 merge-partial · 14 merge-all · 10 mint-new · 8 package-band · 1
  defer-human; mean confidence 0.76; 22 decisions flagged an open question
  (Q-TARGETCOUNT leads with 9 — the KIN/Dance/Music activity-ladder policy is
  the single highest-leverage answer Sam can give).

**What we measured (changes the plan).** Stratifying all 7,716 groups:
level ladders = 1,533 (20%), same-college variants = 1,773 (23%),
cross-discipline = 1,214, credit/noncredit mixes = 776. **~43% of the
worklist is two policy decisions applied 3,300 times** — the packaging rule
and the same-college rule. That's the empirical case for doctrine-then-batch.

**Patterns that worked.**
- Stratified-sample + parallel decision agents produced genuinely
  high-quality calls (the CISA≠CISSP homonym catch; GEOL 110-vs-111 resolved
  by witness plurality + modal units; costume production/design/history
  split) — the doctrine text was enough context for consistent judgment.
- Features computed identically in Python (sampler) and JS (panel) — keep
  `doctrineFeatures()` and `features()` in sync by hand; the test reads the
  committed question bank as the shared contract.
- The decision-agent output format (call/survivor/exclusions/rationale/
  doctrine_cited/confidence/open_question) IS the pass-2 plan row format —
  calibration and batch use one schema.

**Open / next.**
1. **Sam's voice pass** (Phase 1): work the worklist with the 🧠 panel, or
   read `calibration_review.md` — every disagreement + every answered Q-*
   is doctrine fuel. Q-TARGETCOUNT first (9 decisions hinge on it), then
   Q-LADDER/Q-CREDITNC.
2. **Distill → Doctrine v1** (next CCR session): read `merge_doctrine_notes`
   (stamp `distilled_at`), edit the doctrine, re-decide a FRESH sample blind,
   measure agreement (gate: ≥90%).
3. **Batch pass 2** (`doctrine-v1@bot`) + the **packaging pass**
   (`package-v1@bot`, ESL pilot first) per the strategy §5–6 — both via the
   Session-53 dry-run→skim→apply pattern, Rule-7 compliant.
4. Tier-1 flag + per-discipline convergence report + dashboard Convergence
   card (strategy §5); refresh the Pipeline tab when the batch actually
   moves the pipeline.
5. Next-session prompt: `docs/ccr_convergence_handoff.md` (workstream
   handoff — named per-workstream instead of session_99 to avoid colliding
   with the concurrent Activities-tab session's numbering).

## 2026-07-10 — Session 111 (SkyMighty): first mind-meld distillation → Doctrine v0.2

Sam's Phase-1 voice sitting happened 2026-07-03 (8 notes, all `anchored` lane,
KINE + ESL) and sat undistilled for a week — the gate was OPEN and nobody
checked. Distilled today; all 8 rows stamped `distilled_at`.

**Doctrine diff (v0 → v0.2):**
- **P-3 RATIFIED** with the concrete ESL mapping (3–4 → Intermediate 1–2 —
  sub-bands allowed; 5–6/7 → Advanced; unnumbered/"Skills Development" →
  Beginning) + the ESL-credit ⋃ ESL-noncredit one-family packaging call.
- **NEW P-11** (settles Q-TARGETCOUNT for KINE): athletics-vs-general split;
  general fitness merges modality-agnostically into Conditioning B/I/A;
  sport-first vs fitness-first title test; venue marks fold; combo-level
  precedents (int–adv → adv, beg–int → beg); Sports Medicine Experience ≡
  Clinical.
- **P-10 addendum**: modality/venue-agnostic package names.
- Q-LADDER partially settled; Q-TARGETCOUNT settled for KINE, open for
  Dance/Music.

**Tooling findings from the sitting (work items, not doctrine):**
1. Discipline selector can't multi-select (Sam wants ESL + ESL-Noncredit
   together) — either multi-select or a discipline-family filter.
2. **Discipline-filter leak**: an HVAC course surfaced in KINE-filtered
   suggestions ("conditioning" title match ignored the discipline filter).
3. **Find-similar looseness anomaly**: at +25% looser, EXPECTED same-family
   matches (sports-medicine clinical/experience) dropped out while unrelated
   rows appeared — ranking behavior needs investigation.

Next per the handoff queue: agreement measurement (blind re-decide vs Sam's 8
calls under v0.2), then batch pass 2 gated on ≥90%.
