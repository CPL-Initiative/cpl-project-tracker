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

## 2026-07-13 — Wave 3 FIRED, the WELD-in-Carpentry revert, and the calibration sitting → Doctrine v0.6

**Wave 3 fired (Sam: "Yes to all 3").** After the Rule-9 pre-flight (fresh read
confirmed the 3 WELD overrides unchanged; the 14 pending `unified_title_merge_confirm`
targets were all `_CREDENTIAL_REVIEW::` keys with **zero** overlap with the 39 M-ID
title fixes; 0 D-10 suspects; verified the CCR consumer reads `field==='discipline'`
/ `'unified_title'`, NOT `'discipline_override'`), fired the `trailcrew-ccr3-s112@bot`
cohort INSERT-only `ON CONFLICT (course_id,field) DO NOTHING`: **137 discipline landed
(all), 25 title landed (39 − 14 pre-existing, incl. Sam's own `ATHL M1178`, left
intact).** 6 D-9 tighteners held for faculty. Receipt: `kb/ccr_out/2026-07-12/fire_receipt_wave3.json`.

**WELD-in-Carpentry revert = D-10 in production.** Sam's catch: 3 Welding courses
(`WELD M1066/M1092/M1121`) were fired to *Carpentry* by wave 1 because they carry a
Carpentry-program TOP + articulate to the Carpenters Apprenticeship. **D-10 (new
v0.5): discipline is the FIELD, not the program.** They're Welding; the apprenticeship
link lives in the articulation layer. Deleted the 3 overrides → baseline Welding.

**The calibration sitting → Doctrine v0.6 — the session's capstone.** Sam walked
the 52-group v0.2 calibration. **30 non-CR/NC calls agreed 100%.** The CR/NC calls
looked inverted only because the v0.2 seed pre-dates his Q-CREDITNC resolution and I
had mislabeled mirrors as "keep separate + tag" (a mirror MERGES — the noncredit twin
IS the Credit-by-Exam on-ramp). Asked to name the theme, Sam gave the **lens** that
now organizes the whole policy:

> *"If a student showed up with evidence they'd already done it, would you make them
> repeat your local course under its local name?"  No → merge. Yes → keep separate.*

Ratified as **P-1** (v0.6, #758), anchored to **CA Title 5 §55050**'s *"similar to"*
(not identical) standard — the legal window to err on the student's side — plus
**learning-equivalence beats subject-code matching** (same content, different
department = one identity; homonym guard survives on "different skills → would
repeat") and four folded refinements: **P-1a** (homonym group with a mergeable core →
split the outlier, merge the core — #30 Healthy Aging), **P-7a** (reclassify a real
course wearing a generic coat — #36 → Sculpture Skills 1/2), **P-9a** (region/theme-word
groups → umbrella on a co-articulation second signal — #23 → *A&P Culture
(Music/Dance/Art)*), **P-10a** (strip rung-codes like "3A" from unified titles).
Sitting record: `kb/doctrine_out/2026-07-10/calibration_sitting_results.md`.

**CER Unclassified-triage fixes (#757):** multi-issuer `＋ add issuing agency` on the
triage row (new `issuing_agency_assignment2` field, split back in the sync — read-back,
not the "written but never read" trap) + C-ID/CCN title pre-seed (top authoritative
suggestion prefills the title; fuzzy/unverified stay click-only).

**Method lesson — the seed goes stale.** A calibration seed is only valid against the
doctrine version it was drawn under. Four doctrine questions resolved between the v0.2
draw and the sitting, so the CR/NC pre-decisions were stale *by design* — measure the
≥90% graduate gate against a **fresh re-seed under current doctrine**, not the old draw.

**Next:** the **v0.6 calibration re-seed** — `kb/_doctrine_calibration_sample.py` +
`unified_courses_suggestions.js` are both present; draw a fresh 52-group sample, run
the magic-half adjudication through the student-repeat lens, measure the ≥90% gate.
Then wave 4 (multi-college ranks 2,001–4,000).

## 2026-07-14 — Session 115 (StarMagna): the v0.6 calibration re-seed → the graduation gate

Sam chose the **doctrine gate before wave 4**. Ran the re-seed as **two blind
instruments** (agents read only `kb/merge_doctrine.md` + the group members, never
prior calls — blindness is what makes the number mean anything):

1. **Regression** — re-decided the SAME 52-group sample Sam walked (seed 20260710)
   and scored against his 2026-07-13 sitting calls (38 ratified groups).
2. **Fresh held-out** — a NEW 52-group sample (seed 20260714, 2-group overlap),
   decided blind, packaged as `calibration_review_v06.md` for Sam's confirm marks.
   Added `--seed/--date` to `_doctrine_calibration_sample.py` so re-seeds don't
   disturb the committed 2026-07-10 draw.

**Gate result:** **92.1% fundamental** (converge / keep-separate / hold) ✅ ·
**86.8% fine** (one-identity / package / separate / hold) ⚠️ <90%. The CR/NC mirror
carve-out works blind — all 3 groups Sam flipped to merge (#28/#29/#38) return merge.

**The key finding — the 87% understates v0.6.** All 5 fine-misses are stale-seed or
single-fork cases (Sam's calls predate P-1/P-3):
- #7 ESL Bridge (merge→package) & #21 arithmetic modules (package→merge): v0.6
  applies *newly-ratified* packaging doctrine more precisely — likely more correct.
- #32 Custodial Report Writing 1/2 & #40 Printing Skills Lab (keep_separate→merge):
  the **P-1↔D-4 boundary** — the student-repeat lens (post-seed) vs D-4's level-mark
  guard for **same-college level/module pairs**. v0.6 merges; the pre-P-1 seed kept
  separate. This is the single resolvable fork (Q-SAMECOLL / Q-LADDER).
- #14 People Skills (merge→keep_separate): the one genuine live judgment fork
  (audience-split homonym).

The fresh sample corroborates: Q-LADDER + Q-GENERIC are the top open-question triggers
(4 each). Full receipt + the divergence table: `kb/doctrine_out/2026-07-14/v06_gate_measurement.md`.

**Verdict:** the doctrine is **one ruling from graduation** — settle the P-1↔D-4
boundary for same-college level/module pairs. Do NOT batch-apply the whole worklist
until Sam rules. Wave 4 (multi-college ranks 2,001–4,000) is staged and independent —
its per-wave lanes don't need the gate; the gate governs whole-worklist batch-apply.

**Method lesson — score at the right altitude.** The raw first pass read 76% because
`mint_new` (mint a new unified id from single-college matches) and `merge` (fold
existing M-IDs) were scored as different classes — but they're the SAME convergence
decision. Fold `mint_new` into the one-identity class; measure a `fundamental`
(converge/separate) tier alongside the `fine` tier. And remember the seed goes stale:
a divergence where v0.6 applies post-seed doctrine is the doctrine *improving*, not failing.

### 2026-07-14 (same day) — Sam's two gate rulings → Doctrine v0.7 GRADUATES

Presented the 3 hard divergences with examples (Sam invited edge-decision
prompts). His rulings resolved all three — each flips to agreement:

1. **P-1↔D-4 boundary (#32 Custodial 1/2, #40 Printing Lab) → converge; the FORM
   depends on title-type + units** (refined live over 3 follow-ups). **#40
   Printing** = clean merge (both introductory = title drift). **#32 Custodial**
   = merge with a **parenthetical rung span** *"(1 and 2)"*, tipped by the **0.5u**
   per-rung load (low units ⇒ competency pieces, not distinct targets — a P-5
   signal). Degree-applicable sequences (Calc I/II) keep rungs (P-3). **Ratifies
   P-6, settles Q-SAMECOLL.** Lesson: the same-college merge FORM isn't binary —
   title-type (drift vs numbered) and per-rung units pick clean-merge vs
   parenthetical-package vs keep-separate.
2. **Homonym #14 People Skills → KEEP SEPARATE.** Sam's principle: breadth +
   program-context distinguishes homonyms — a broad degree-program course vs. a
   narrow enrichment/noncredit offering are different targets (the enrichment
   side may sit below the CPL floor). **New P-1b; touches Q-FLOOR.**

With the rulings, fine agreement = **36/38 = 94.7%** (the 2 soft misses are v0.6
applying ratified P-3 packaging more precisely → effectively 38/38). **≥90%
cleared — the doctrine GRADUATED to v0.7 and whole-worklist batch-apply is
authorized** (its own dry-run→review→apply gates still govern the run). The fresh
held-out sample stays staged for Sam's optional confirm walk.

**Lesson — a graduation gate doubles as a doctrine interview.** The blind
regression didn't just score the doctrine; its divergences were precisely the
unsettled forks (Q-SAMECOLL, the homonym-breadth question). Surfacing the 3 hard
misses as example-driven prompts turned a measurement into two new ratified rules
in one exchange. When the gate says "87%," read WHERE it disagrees before
concluding the doctrine failed — the misses are the interview questions.

### 2026-07-14 (batch 2) — three more fresh-sample scenarios → Doctrine v0.8

Sam confirmed the scenario-prompt loop is "very helpful to refine rules" and
flagged the real UX problem: **he'd dropped off the 🧠 Suggested-Merges panel
because the thousands of suggestions overwhelmed him.** That is the product
insight — the calibration *sample* (52 stratified groups) and these even-smaller
curated batches (3 at a time, one open-fork each) are the antidote: same signal,
no firehose. A "decisions that need you" curated queue (top open-question hits,
~10 at a time) beats the full worklist.

Three open questions settled from one 3-scenario batch:
- **Q-GENERIC → P-7 ratified.** Generic shells (Topics/Discussion/Work
  Experience/Independent Study/Directed Study) → **one umbrella per
  (generic-type × subject)** ("Topics in Business", "Work Experience in
  Business"). The discipline+generic-type pairing IS the second signal.
- **Q-FLOOR bounded.** Enrichment/noncredit framing ALONE doesn't drop a course
  below the CPL floor — if it teaches the SAME learning as a credit course it
  MERGES (learning-equivalence). Bounds P-1b: split only when skills/breadth
  differ, not merely the audience. (Nonfiction Writing: Humanities credit ≡
  Older-Adults-Noncredit → merge.)
- **Q-LADDER → the 3-RUNG CAP.** No ladder exceeds 3 rungs; >3 consolidate by
  pairing (1,2)(3,4)(5,6+), incl. degree-applicable creative ladders (studio
  art). Academic sequences already ≤3 (Calc I/II) keep their rungs.

Doctrine → **v0.8**. Lesson: **the smaller and more stratified the batch, the
more rules per minute of Sam's time.** Three scenarios settled three open
doctrine questions; the thousands-strong panel settled none (he bounced). Curate
hard, present few, each a distinct fork.

### 2026-07-14 (batch 3) — the ESL 3-comprehensive collapse → Doctrine v0.9

Sam's biggest packaging ruling yet, on the "ESL morass." Profiled the real data
first (**2,364 ESL identities**; levels Beginning 697 / Intermediate 480 /
Advanced 485 / no-level 702; strands reading 372 · writing 218 · listening 186 ·
grammar 172 · academic-prep 100 · conversation 90 · pronunciation 81 · …) then
brought the three genuine edges as a scenario batch.

**Ruling — ESL collapses to exactly 3 comprehensive courses** (Beginning /
Intermediate / Advanced ESL), with **every skill strand AND content-for-ESL
course bundled in by level** — no strand survives (settles Q-STRANDS). No-level
courses default to Beginning (CPL-safe under-claim). **Three carve-outs escape:**
1. **Transfer-level ESL** (rare, e.g. "ESL 101 Reading and Writing" — degree-
   applicable transfer credit → the rung IS the credit target, P-3 boundary).
2. **ESL Citizenship** (naturalization purpose → distinct).
3. **Vocational ESL / VESL** (workforce/CTE purpose → distinct).
   (Content-for-ESL courses — culture/film/computer-for-multilingual — Sam ruled
   IN the 3, not out: they're part of the ESL offering.)

Impact: 2,364 → 3 + 3 small carve-out families. This is the flagship packaging
pass (`package-esl@bot`). Doctrine → **v0.9**.

**Lesson — profile the discipline BEFORE bringing the edges.** The 2,364-count +
level/strand histogram is what made the 3 edge scenarios sharp (citizenship 33,
VESL 67, content-not-language in the 702 no-level tail). Don't ask abstract policy
questions; show the curator the real distribution and ask about the specific
piles at the margins. Sam: "The scenarios make me squirm, but we need to squeeze
the juice out" — so keep batches small, grounded, and clearly finite.

### 2026-07-14 (batch 4) — Foreign Language numeric rungs → Doctrine v0.10

Sam: text rung descriptors (Beginning/Intermediate/Advanced) everywhere **except
Foreign Languages**, which use **numeric** rungs ("Spanish 1/2/3") per field
convention — and **drop the redundant level word** colleges prefix ("Beginning
Spanish 2" → "Spanish 2"). Captured as a P-10 addendum.

Reconciled with the 3-rung cap: the real line isn't "degree-applicable" (studio
art is degree-applicable yet caps at 3) — it's **per-rung OFFICIAL identity**. FL
(Spanish 1/2/3/4 → C-ID SPAN 100/110/200/210) and Calc I/II have a distinct
C-ID per rung, so the rungs are separate authoritative credit targets that
**never collapse (D-1)** — exempt from the cap, numeric labels, keep every rung.
Studio art has no per-rung C-ID → caps at 3. Doctrine → **v0.10**.

### 2026-07-14 (batch 5) — Music & Dance activity doctrine → Q-TARGETCOUNT fully settled, v0.11

Profiled Music (2,586) + Dance (1,639), brought 3 forks framed against KINE's
P-11. Sam's calls — with an instructive asymmetry:
- **Dance styles → ONE 'Dance Technique' B/I/A.** All styles (Hip Hop/Ballet/Jazz/
  Tap/Modern/Ballroom/Contemporary) fold into a single 3-band technique ladder.
  **Sam's reason (key):** *"the only reason I'm merging the dance is because they
  have so many permutations vs. the others which are more standard."* Not
  skill-equivalence (Ballet ≠ Hip Hop) — **permutation VOLUME**. This is a new,
  distinct lever: when style×level×format explodes unmanageably, consolidate even
  distinct sub-skills; when bounded/standard (piano/guitar/voice), keep
  granularity. (Diverges from KINE per-sport for a volume reason, not a taxonomy
  one.)
- **Music applied → PER-INSTRUMENT B/I/A** (Piano/Guitar/Voice each own ladder) —
  the instrument is a distinct skill, like a distinct sport. (Follows KINE.)
- **Ensembles (Music + Dance) → per-type** (Concert Choir, Orchestra, Jazz
  Ensemble, Concert Dance Ensemble …) — the analog of KINE intercollegiate
  athletics. Do NOT consolidate to generic Vocal/Instrumental/Dance Ensemble.
- Music Theory/History → transfer academic (C-ID per rung) → keep rungs.

Through-line for all activity disciplines (P-11): **a genuinely distinct
performed skill stays its own target (per-sport, per-instrument, per-ensemble);
general skill-building consolidates to a 3-band ladder** (Conditioning / Dance
Technique) with modality/style/venue folded. Q-TARGETCOUNT is now FULLY settled.
Doctrine → **v0.11**.

Session tally: ~6,600 identities across ESL/Music/Dance/KINE now have a packaging
policy, plus the same-college/generic/homonym/floor rules — the doctrine went
v0.6 → v0.11 in one sitting via small grounded scenario batches.

### 2026-07-15 (batch 6, Session 117 StarMarcus) — the last carryover forks: Honors, units, cross-discipline → Doctrine v0.12

StarMagna's handoff pointed at execution (the ESL dry-run); Sam instead wanted
"back in the interrogation room" — more scenario refinement. Profiled the four
carryover open forks against the live worklist (`unified_courses_suggestions.js`,
7,605 multi-member groups) BEFORE bringing the edges, then brought a 3-fork batch.
Sam ruled all three with the recommended calls — fast, clean agreement (the
doctrine was already tracking his judgment here):

- **Q-HONORS → P-13.** An **Honors variant of a base course FOLDS into the base**
  (same competencies; honors is a GPA/enrollment mark, `merge_note`). **Standalone
  honors-program courses with no base** (*Honors Colloquium / Forum / Seminar*)
  **keep their identity** — there's nothing to fold into. Data: 128 unified courses
  carry "Honors" in the title; only 8 currently sit in a suggested group mixing
  honors with a non-honors sibling (the rest are already-separate). Honors is the
  first D-4 variant-type mark to get a fold rule.
- **Q-UNITS → P-5 refinement.** A big unit spread on a **non-standardized** course
  is a **WHOLE-vs-PART signal**, not a merge threshold. The wide-spread groups are
  almost all a comprehensive course lumped with its own pieces: *Introduction to
  Medical Assisting* (15u) with *Intro to Medical Assisting 1/2* (3u each);
  *Vocational Nursing 1* (9u) with *Supplementary Nursing Skills Practice* (0.5u).
  Split the whole from its parts (each part merges with its true peers). The
  standardized-academy carve-out (P-5a — POST/Fire/EMT merge despite huge spreads)
  is unchanged. Data: 826 non-standardized groups carry ≥3u spread, 370 ≥4u — but
  the raw wide-spread list is dominated by the *standardized* academies (already
  handled), which is exactly why the non-standardized residue reads as whole/part.
- **Q-XDISC → D-8 procedure.** The dominant cross-discipline pattern (2,050 groups
  span ≥2 disciplines) is **one subject code tagged inconsistently** — *Income Tax
  Accounting* as Accounting vs Business (both `ACCT`), *Ceramics Handbuilding* as
  Art vs Ceramic Technology (both `ART`). Merge → survivor takes the **canonical
  SUBJ4 discipline** (pick in `merge_note`). The smaller **different-subject-code +
  colliding-title** pile (*Fire Fighter* as Fire Tech/`FIRE` vs EMT/`CALJA`) runs
  the **P-12 homonym check** first — never auto-merge those.

**New open fork surfaced: Q-VARIANT** — honors settled the first D-4 variant mark,
but Lab / Refresher / Recertification / Bridge / Cross-listed are unsettled and
must NOT be assumed to fold like honors (a lab may be a distinct credit component;
a bridge is a distinct transition course; a refresher may fold or sit below the
floor). This is the natural next interrogation batch. Q-MINTNAME is effectively
closed by P-10 (clean band names).

**Method reinforced:** the same profile-before-edges + one-example-per-option
recipe that took v0.6→v0.11 also closes the residue cleanly — and a fork *answers
itself* when profiling shows the "hard" pile is mostly an already-handled class
(the unit-spread giants were standardized academies), leaving a sharp, small
residue to rule on. Doctrine → **v0.12**.

### 2026-07-15 (batch 7, Session 117) — Q-VARIANT: the rest of the D-4 family → Doctrine v0.13

Honors (batch 6) settled only ONE of the D-4 variant-type marks. Profiled the
others against the worklist and brought a 3-fork batch — deliberately NOT assuming
they fold like honors. Sam again ruled all three with the recommended calls, and
the shape is the instructive part: **the D-4 marks do not share one rule.**

- **LAB → fold.** Lecture / Lab / Lecture-Lab of the SAME course = ONE identity
  (the combined course is the face; lecture-only/lab-only in `merge_note`).
  Exception: a lab with its own official C-ID stays separate (D-1). (21 groups mix
  a lab with a lecture sibling; the science lecture/lab split is the archetype.)
- **REFRESHER → keep separate.** A 2u "EMT Refresher" is not the 6–9u "EMT" course
  — folding would over-grant. **This is Sam's own Q-UNITS whole-vs-part ruling
  carrying straight over from a unit spread to a variant mark:** the refresher is a
  *part*, so it stays its own identity; refresher-variants merge with each other.
- **BRIDGE → keep separate (distinct course).** A bridge teaches the *gap*
  (LVN→RN, Transition to Professional Practice) — its own real course, never folded
  into a base or destination program; singular/plural drift of the same bridge
  merges (P-1).

**The through-line (the reusable insight):** every D-4 mark reduces to the P-1
student-repeat test. Honors (GPA artifact) and Lab (delivery split of one course)
→ the student wouldn't repeat → **fold**. Refresher (a shorter part) and Bridge (a
distinct gap course) → different scope/learning → **keep**. The variant *word* is
not the signal; what the word does to the *learning* is. Cross-listed had 0
title-borne groups (handled by the identity layer).

**Where this leaves the doctrine:** every named open fork in Part IV is now
RESOLVED (Q-LADDER, Q-STRANDS, Q-SAMECOLL, Q-GENERIC, Q-CREDITNC, Q-TARGETCOUNT,
Q-FLOOR, Q-HONORS, Q-UNITS, Q-XDISC, Q-VARIANT; Q-MINTNAME closed by P-10). The
interrogation instrument has done its job — the next move is **showing the payoff**
(the ESL dry-run + the general batch-apply), not more forks. Doctrine → **v0.13**.
Two clean 3-fork batches in one sitting, ~all-Recommended: the doctrine has
converged to Sam's judgment on the structural questions.
