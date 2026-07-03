---
title: "CCR Convergence Strategy — from 7,716 decisions to a 2,500-course crosswalk"
created: 2026-07-03
tags: [ccr, strategy, merge, mint, doctrine, mind-meld, m-id, scale]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[kb/merge_doctrine]]"
  - "[[docs/ccr_rules_brief]]"
  - "[[docs/ccr_merge_workspace_lessons]]"
---

# CCR Convergence Strategy

*Sam's charge (2026-07-03): the Suggested-merges worklist holds 7,700+
decisions — too many to grind through by hand. Leverage AI to decide the
merges and mints now (faculty SMEs adjust and validate later), build a
mind-meld process that captures the faculty/dean/VPAA judgment behind those
decisions, and aim the whole thing at a concise crosswalk — "no more than
2,500 courses" — that MAP faculty workgroups can actually use. Think big:
this could scale to a national CCR.*

---

## 1. The reframe: stop grinding the queue, design the catalog

The worklist is **bottom-up**: evidence generates suggestions, a human
confirms one group at a time. At 7,716 groups (24,932 member courses across
six lanes, measured 2026-07-03) that process is structurally unfinishable —
at a heroic 100 decisions/sitting it's 77 sittings, and the daily regen keeps
refilling the pool.

The goal is **top-down**: a concise, reliable CPL-facing catalog. So invert
the work:

1. **Write the decision policy down** (the Merge/Mint Doctrine,
   `kb/merge_doctrine.md`) instead of applying it invisibly one click at a
   time. Sam's judgment becomes a versioned artifact that AI sessions apply,
   faculty read, and other states could adopt.
2. **Calibrate it cheaply** — Sam voice-reviews ~78 AI pre-decided groups,
   not 7,716 raw ones. Disagreements edit the doctrine, not just the row.
3. **Apply it in bulk** through the machinery this project already trusts:
   the Session-53 auto-merge pattern (dry-run plan → committed receipts →
   skim → cohort-stamped apply → reversible). Pass 1 already did 2,272
   groups mechanically; pass 2 does the *judgment* lanes with a calibrated
   doctrine.
4. **Manage concision as a number** — per-discipline convergence targets and
   a CPL-facing tier, reported on the dashboard, instead of an open-ended
   cleanup.

The human hours shift from *deciding rows* to *tuning policy* — which is the
only place a VPAA's time compounds.

## 2. What the decision surface actually looks like (measured)

Stratifying all 7,716 groups by doctrine trigger
(`kb/_doctrine_calibration_sample.py`, receipts in
`kb/doctrine_out/2026-07-03/`):

| Stratum (first match wins) | Groups | What it means |
|---|---|---|
| Level ladders | **1,533** | 20% of the worklist is the ESL problem — multi-level families begging to be packaged, not confirmed rung-by-rung |
| Same-college variant groups | **1,773** | 23% are intra-college ladders/twins — P-6 says these are *packaging* input, not duplicate merges |
| Cross-discipline groups | 1,214 | mostly inconsistent tagging, some homonyms |
| Credit/noncredit mixes | 776 | the D-3 band edge; needs the Q-CREDITNC answer |
| Plain anchored merges | 886 | bread-and-butter — high-confidence batch material |
| Plain similarity (title/desc/family) | 614 | batch material behind the guard suite |
| Units-spread groups | 297 | mostly externally-standardized curricula (P-5) |
| Plain singleton mints | 250 | cross-college standalones → new common courses |
| Evidence lane (official-id folds) | 130 | strongest evidence, near-automatic |
| Activity ladders (KIN/Dance/Music) | 125 | the Q-TARGETCOUNT policy family |
| Skill-strand families (ESL etc.) | 76 | the exact case Sam named |
| Generic titles | 18 | small but policy-heavy (P-7) |
| Honors/variant asymmetries | 24 | the Q-HONORS fork |

**The headline: ~43% of the entire worklist (ladders + same-college) is not
7,716 independent judgments — it's TWO policy decisions** (how to package
ladders; what same-college groups mean) **applied 3,300 times.** That is why
doctrine-then-batch beats queue-grinding: most of the mountain is a few
rules wearing different course titles.

## 3. The two-number goal (honesty about "2,500")

"Merge everything down to ≤2,500" needs a denominator. The identity space is
~15.5k M-ID parents + ~57.7k standalones; no defensible merge policy folds
73k rows into 2,500 — and it doesn't need to. What faculty workgroups need is
the **CPL-facing tier**:

- **Tier 1 — the CPL Crosswalk Catalog (target ≤2,500 rows).** Every CCN
  (58) + every C-ID in CCC use (~491) + the M-IDs that CPL demand touches:
  identities with existing MAP articulations (~2,355 today, pre-convergence),
  credential/exhibit alignment, adoption leverage, JST/military crosswalk
  hits, workforce-sector alignment. Post-convergence the articulated set
  alone lands well under 2,000 — the ≤2,500 budget is realistic *for the
  tier that MAP surfaces to faculty workgroups*.
- **Tier 2 — the reserve.** Everything else, still converging continuously
  under the same doctrine, still browsable in the CCR, but not pushed at
  faculty. A course enters Tier 1 when demand arrives (a new exhibit maps to
  it, a college articulates it) — the tier is a *filter*, not a fork of the
  data.

This gives Sam the king-of-the-world number without pretending the long tail
doesn't exist — and it gives every merge decision a purpose test (doctrine
P-1/P-2): *does this move make the faculty-facing catalog more concise and
more reliable?*

## 4. The mind meld — three capture channels

The doctrine only works if it actually encodes Sam's judgment. Three
channels, cheapest first:

1. **The 🧠 Mind-meld panel in the Suggested-merges worklist** (shipping with
   this strategy). While Sam works any group, the panel shows the doctrine
   question(s) that group *instantiates* (a level ladder surfaces Q-LADDER; a
   credit/noncredit mix surfaces Q-CREDITNC), plus a 🎤 **dictate** button —
   browser speech-to-text, no typing — and a stance picker. Each saved note
   lands in Supabase `merge_doctrine_notes` with the full group snapshot, the
   question id, and the transcript. Ten minutes of thinking aloud while
   deciding ten groups is worth more than an hour of abstract interviewing —
   the context IS the group on screen.
2. **Calibration reviews.** 78 stratified groups pre-decided by AI against
   Doctrine v0, each with the call, cited rules, confidence, and rationale
   (`kb/doctrine_out/2026-07-03/calibration_decisions.json` + the readable
   `calibration_review.md`). Sam reads the review doc (or works the same
   groups in the worklist) and reacts — voice or text. Agreement is measured;
   disagreement is doctrine fuel.
3. **Distillation at checkpoints.** Each session that touches this
   workstream reads new `merge_doctrine_notes` rows, edits
   `kb/merge_doctrine.md` (PROPOSED → ESTABLISHED, OPEN → settled), and
   stamps the version. The doctrine file is the durable mind-meld artifact —
   not the chat, not the notes table.

## 5. The batch engine — pass 2 and the packaging pass

Extending the proven pass-1 pattern (`kb/_auto_merge_worklist.py`, Session
53: dry-run planner → `plan.json`/`report.md`/`supabase_ops.sql` → Sam skims
→ apply with `ON CONFLICT DO NOTHING`, cohort `automerge-v1@bot`, bulk-
revertible):

- **Pass 2 — doctrine merges (`doctrine-v1@bot`).** All six lanes. Per
  group, an AI decision (the calibration format: call, survivor, exclusions,
  title, cited rules, confidence) made against the ratified doctrine, then
  mechanical gates (band purity, live-member re-check, dismissals honored,
  target unconsumed). Only calls at/above a confidence floor (start 0.8)
  apply; the rest stay in the worklist, now ORDERED by the AI's confidence so
  human time hits the genuinely hard cases. Receipts carry the rationale —
  faculty see *why* every merge happened.
- **Packaging pass — level-band mints (`package-v1@bot`).** The P-3/P-4
  operation, run per discipline family (ESL first — Sam's own example, 76
  strand groups + the ESL share of 1,533 ladders): mint band packages
  (Beginning/Intermediate/Advanced X), fold rungs/strands with the original
  level in `merge_note`, band-aware (credit and noncredit ladders package
  separately unless Q-CREDITNC says otherwise). This is a *new operation*
  (deliberate purposeful over-merge with receipts), so it ships as its own
  explicitly-scoped pass with its own dry-run and its own faculty framing —
  never smuggled into same-course merges.
- **Both passes are Rule-7 compliant**: staging phase, playbook followed,
  alias maps committed, one cron window, reversible by cohort.

Estimated effect (order of magnitude, refined at dry-run): pass 2 at an 80%
apply rate folds ~10–13k member rows; the packaging pass collapses the
ladder-heavy disciplines (ESL, KIN activity families, Dance, Music) by
thousands more. The main CCR payload plausibly lands near **8–10k total
rows**, with **Tier 1 comfortably ≤2,500**. The remaining human worklist
drops from 7,716 groups to the low hundreds of genuinely-hard cases.

## 6. Sequencing

| Phase | What happens | Who | Exit gate |
|---|---|---|---|
| **0 · Instrumentation** (this PR) | Doctrine v0 + question bank + 🧠 voice panel + calibration sample pre-decided | Fable | merged, panel live |
| **1 · Calibration** | Sam voice-reviews the 78 pre-decisions (worklist or review doc), answers the 11 open questions as they surface | Sam, 1–2 sittings ≈ 45 min each | every OPEN question answered; disagreement causes identified |
| **2 · Ratify + measure** | Distill notes → Doctrine v1; AI re-decides a FRESH held-out sample blind; measure agreement | Fable | ≥90% agreement on the fresh sample |
| **3 · Batch pass 2** | Dry-run over all lanes → committed plan/report → Sam skims → apply (`doctrine-v1@bot`) | Fable + Sam skim | receipts committed, CCR regen verified |
| **4 · Packaging pass** | ESL pilot → Sam blesses the pattern → remaining ladder disciplines (`package-v1@bot`) | Fable + Sam | ESL family reads right in the CCR |
| **5 · Tier & report** | CPL-facing tier flag + per-discipline convergence report + a Convergence card on the dashboard | Fable | Tier 1 ≤2,500 and demand-covered |
| **6 · Faculty validation** | Existing §11 machinery (trust scores, Verify, MC pipeline); `docs/ccr_rules_brief.md` gains a plain-language packaging section | Faculty SMEs via MAP | continuous |

Phases 3–5 are each one session with the established playbooks. The critical
path is Sam's Phase-1 sittings — everything else is machine time.

## 7. Selling the squawk (the ESL argument, generalized)

Faculty will resist packaging ("Level 4 Grammar is not Level 5 Reading!").
The doctrine's framing, for the rules brief and every faculty-facing surface:

- **This is a CPL-feasibility layer, not a curriculum judgment.** No
  college's catalog, COCI filing, or degree pathway changes. The CCR names
  the *credit target a prior-learning evaluation can actually hit*. A
  certification or JST transcript will never map to one rung of a
  seven-level noncredit ladder — pretending otherwise just means those
  students get nothing.
- **Title 5 §55050 already grants the latitude**; the package makes the
  latitude *administrable* statewide.
- **Everything is receipted and reversible.** Every fold carries its
  original level in `merge_note`; faculty validation can split any package
  back in one action. The ask is "react to a draft," never "approve a fait
  accompli."
- **The concise catalog is the equity instrument**: 2,500 findable credit
  targets serve veterans and working learners; 73,000 local rows serve
  nobody.

## 8. The national frame

Nothing in this architecture is California-specific except the authorities:

- **The identity ladder generalizes.** Any state slots its official systems
  (their CCN/C-ID equivalents) above a minted M-ID tier; the precedence
  rule, evidence ladder, guard suite, receipts/alias discipline, and the
  doctrine format all transfer verbatim.
- **The doctrine IS the export.** What makes a national CCR credible isn't
  the data (every state's is different) — it's a *written, versioned,
  faculty-reviewable decision policy* plus a calibration protocol that lets
  any state's academic leadership imprint their judgment the same way Sam
  is imprinting his. "Here is our merge doctrine, our receipts, and our
  faculty validation loop" is a fundable, replicable story for ECS/SHEEO/
  Lumina conversations in a way "we cleaned our data" never is.
- **Proof milestone:** when CA's Tier-1 catalog ships and MAP workgroups
  select credit recommendations by common-course name, that's the
  demonstration — one state, ~73k local courses, converged to a working
  crosswalk with auditable AI + faculty governance. The pitch writes
  itself from the receipts.

## 9. Risks & controls

| Risk | Control |
|---|---|
| AI over-merges at scale | confidence floor + the three hard carve-outs + cohort stamps + one-action revert + faculty validation tier |
| Doctrine drifts from Sam's actual judgment | calibration gate (≥90% on fresh sample) before any batch; mind-meld notes keep flowing after |
| Packaging alienates faculty | own pass, own framing, ESL pilot first, receipts + reversibility, rules-brief section in plain language |
| Concurrent-session collisions (kb_curation) | batch applies in one cron window per Rule 7; ON CONFLICT DO NOTHING keeps human rows sovereign |
| The 2,500 number gets read as a quota | the two-number structure (Tier 1 vs total space) is explicit in every report; targets bias, never force (P-2) |
