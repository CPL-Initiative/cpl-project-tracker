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

## 2026-07-12 — Session 112 (SkyEmpyrean): the vocational wire-up, wave 3, and surviving the spend cap

Sam opened asking whether we needed a *new* vocational identifier (he'd
half-remembered COCI's TOP-code asterisk and wondered about a `V`-prefix on
SUBJ4). A 6-agent audit answered: **we already have the signal three ways** —
per-row `cte` (TOP-Manual CTE designation, stamped by `kb/_join_cte_from_top.py`),
discipline-level `mq_list` (MQ 19th-ed faculty-qual list), and
`noncredit_category=="Short-term Vocational"` — plus the CSR already renders
🎓/🔧 chips. The V-prefix was a hard no (VOCE/VETT/VIET already occupy
V-initial SUBJ4 space; it bakes a *mutable* attribute into an *immutable* key).
So: no new identifier; extend the existing cue + feed it to the pipeline.

**What shipped (3 PRs):**
1. **#746 — MQ 19th-ed re-validation.** Sam corrected Humanities + Physical
   Education to master's-list; rather than patch two rows we re-parsed the
   whole Disciplines Index **positionally** (pdfminer x/y; page-number tokens
   as row anchors; X-marks classified by column x0). Found the S111 text parse
   had mis-binned HUM/PE/PEDS *and dropped 8 disciplines entirely* (Accounting,
   African American Studies, Aeronautics, Addiction Paraprofessional Training,
   Agricultural Business, Adapted Computer Tech: DSPS, Citizenship: Noncredit,
   Specialized Instruction: Vocational). Those 8 were also missing from
   `mq_disciplines.json` — the **CCR fire-gate vocabulary** — so a legit
   "Accounting" proposal would have bounced forever. 240→248 titles.
2. **#747 — CCR scanner wire-up.** `enrich()` now emits `cte` + `mq_list` +
   `mq_special_ccr` per identity; new `--stratum multi` (corroborated
   ≥2-member, prior waves excluded) + `--wave K`; manifest gains mq/cte mix.
3. **#749 — CCR wave 3.** 2,000 multi-college identities adjudicated. **The
   wire-up validated itself day one: the top discipline correction is
   "Accounting" (23 ids)** — a name that didn't exist in the vocabulary until
   #746 restored it the day before. Loop closed.

**Lessons:**
- **Parse column-grid PDFs positionally, never from linearized text** — a lone
  X loses its column and the row silently mis-bins. Full method in the new KB
  note `methodology-positional-pdf-column-grids.md`. Validate the full row
  census against an authoritative count; a plausible-looking count (240) hid 8
  drops behind artifact keys.
- **The MQ vocabulary check is necessary but not sufficient.** The wave-2
  re-verify caught 4 "Aeronautics" proposals — a *real* MQ discipline, but one
  with no rows and no canonical SUBJ4; firing it would fan-in-break a field
  already registered as "Aviation." The skeptic's canonical-registry
  cross-check is what caught it. Both checks needed: MQ-name-exact AND
  canonical-SUBJ4-exists.
- **Long workflows survive task death and spend caps via `resumeFromRunId`.**
  This wave's task died silently twice (0-byte output, gone from the registry,
  no notification — SkyMighty's warned-of failure mode) and Fable hit its
  monthly spend cap mid-skeptic-phase (~240/486, 426 calls bounced). Each time,
  resume replayed every completed agent from cache and re-ran only the
  failures — the second resume on **Opus 4.8** (after Sam switched the session
  model) closed all 100 gaps, 0 errors final. The wave is honestly mixed-model
  (adjudicators+early skeptics Fable 5 / late skeptics Opus 4.8); skeptics
  verify against committed files so it doesn't bias the verdict set. Playbook:
  `playbook-resume-long-workflow-across-failures.md`.

**Wave-3 lanes (nothing fired):** bless 980 · split 483 (34 killed) · package
182 · discipline 143 (3 killed) · unit 104 · title 39 · curator 32; 486
skeptics (449 upheld / 37 killed); 177 capped-by-design. Fire-ready:
title_fix (39) + discipline_correct (143) as `trailcrew-ccr3-s112@bot` on Sam's
word.

**Next:** Sam decides which wave-3 lanes fire; wave 4 = multi-college ranks
2,001–4,000. Sam's calibration sitting (52 groups) still gates batch pass 2.
