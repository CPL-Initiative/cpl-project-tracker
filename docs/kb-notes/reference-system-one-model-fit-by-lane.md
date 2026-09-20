---
title: A System One model earns its place where a hit is cheap to verify — Jev, use case by use case, against this repo's lanes
created: 2026-09-20
updated: 2026-09-20
tags: [reference, jev, typesafe, effort-level, curation, sierra, tooling]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/common-cr-reference]]"
  - "[[docs/kb-notes/methodology-a-typed-answer-is-not-a-boolean]]"
  - "[[docs/kb-notes/methodology-top-is-a-last-in-line-signal]]"
  - "[[docs/kb-notes/reference-cccco-house-voice]]"
artifacts:
  - kb/_typesafe_smoke.py
  - kb/_typesafe_cr_trial.py
---

# A System One model earns its place where a hit is cheap to verify

> **One-sentence summary** — Jev answers a closed question with a calibrated
> probability and nothing else, so it fits exactly the decisions this repo
> already routes to fan-out: many of them, each cheap for a human to verify,
> gated by that human; it stays out of every decision where being wrong is the
> risk, out of every number, and out of every sentence a student reads.

## Context

Sam, 2026-09-20, shared two posts from X: a thread relaying @shannholmberg's
twenty-one use cases for TypeSafe's Jev, and a three-page infographic titled
*Jev + Claude Code, the agent stack built for speed*. S279 had wired Jev into
this repo the same morning (PRs #1635 and #1636) and run it on 51 Common CR
Reference pairs, so the question this note answers is which of the twenty-one
shapes belong to lanes we run, and under which gate.

Vendor facts, read from `docs.typesafe.ai` on 2026-09-20: one endpoint
(`POST /v1/systemone`); three primitives (choice, score, noul), every question
evaluated in parallel against one `state`; `jev-1.13.0` at $0.042 per million
input tokens with output free; 64k tokens of context; rate limits "adjusting
dynamically"; a Data Processing Agreement with a commitment not to train on
customer data, and zero data retention offered to enterprise customers only.
The vendor's own jaggedness page lists nine failure modes for this version:
literal reading, arithmetic, dates, indirection, large state, adversarial
content, contradictory criteria, structural invariants, and generation.

## The three tests that decide fit, and a fourth on data

1. **Cheap to verify.** `CLAUDE.md`'s effort-level rule (Sam, 2026-08-08) fans
   out where a hit is cheap to recognize and stays single-threaded where the
   risk is being wrong. A System One call is fan-out at the grain of one
   decision, so the same test applies. A Jev answer a curator confirms in
   seconds is a fit. A Jev answer nobody can check is a liability with a
   probability attached.
2. **It ranks; it does not filter.** S279 measured 0 of 51 pairs below 0.32.
   Until a question is reframed so that a no is as easy to say as a yes, and
   re-measured, the usable signal is the top of the range: p ≥ 0.85 suggests,
   and everything below is a curator's afternoon. Sam's 51 verdicts bore this out: 25 of 25
   folded above the gate, and below it his verdicts did not follow the number.
3. **One more signal, under the TOP posture.** A probability from a model is a
   `*_source` like `top_code`: it displays, it corroborates, and it is held out
   of any identity fold until a second independent signal or a curator agrees
   (Rule 7). Nothing Jev says merges, re-keys, or gates.
4. **What leaves the building.** Every `state` goes to a third party that
   retains it on the plan we are on. Public catalog text and MAP exhibit
   wordings are fine to send. A row that carries a student, a curator's email,
   or an unpublished decision is never sent, and a new state shape is a new
   write surface for Rule 10(a3)'s governance map and the privacy ADRs.

## The map

| Thread use case | The shape in this repo | Verdict | Gate | The labeled set that already exists |
|---|---|---|---|---|
| 9 · confidence-based human queues | The 51-pair decision sheet: p ≥ 0.85 suggests, the rest is REVIEW, a care score per pair | Built (S279); verdicts landed (S280) | Sam's verdicts; the decision-sheet ruling of 2026-08-30 | Sam's 51 verdicts: 41 fold, 10 keep, `kb/receipts/cr_reference_decisions_2026-09-20_s280.json` |
| 10 · first-pass judge | Sierra's smoke and A/B assertions are string matches, and *a guard pinned to a quotation is not a guard* (2026-09-18). A noul per rendered answer: does it state a catalog absence as a fact about a place, does it say COCI, does the first sentence answer the question | **Next** | Runs on the A/B runner as an advisory column; becomes an assertion once it agrees with Sam's rulings | The `chat_interactions` rows Sam has ruled on; the four Sierra defects |
| 13 · reranker, 14 · source verifier | Sierra's false absences and the `%tech%` word filter: a noul on *does this phrase name a college?*; a choice over candidate colleges with a confidence gate that lets her say *I am not sure* | **Next** (To-Do `s279-skykeeper-jev-for-sierra`) | Jev routes and gates; Sierra answers; Jev never writes a sentence a student reads | The smoke suite's 7c and 7s modes |
| 12 · semantic linting | `kb/_docs_audit.py` lints the mechanical floor (spelling, business register). The judgments it cannot regex, the contrastive frame, the mannerly aside, a college *earning* funding, are one noul per sentence | Later | Informational finding, never a merge gate; runs on a runner because the sandbox cannot reach the API | Sam's rulings and the before/after pairs in `reference-cccco-house-voice` |
| 15 · context filter | The `cpl_memory` briefing budget, where about 21% of verified rows fit: score rows against the session's opening line to ORDER the briefing | Later | Reorder only, never cut below what the budget already cuts; an unread rule is the failure Rule 8 was written for | None needed for ordering |
| Entity alignment (vendor cookbook) | Exhibit canonicalization and the CCR: *is this freehand title this unified credential?* | After the CR verdicts calibrate the gate | Block first (S279: the gain was in the blocking); suggest, never merge | `kb_curation`, 34,443 curator-confirmed rows, the largest gold set we own |
| Hierarchical classification (cookbook) | Noncredit CIP categories: a choice over the CO's ten categories | Later | A curator confirms; a corroborator for CDCP eligibility, never the determinant | The CO's own assignments where published |
| Discipline and SUBJ4 | A Jev discipline read is `discipline_source: jev` | Corroborator only | Rule 7's TOP posture, verbatim | `subject_map` |
| 16 to 21 · business triage | The CPL clean-up worklist and the MAP-team queue: who fixes it, how urgent | Later, if the worklist outgrows what a curator orders by hand | Advisory order | The worklist's own dispositions |
| 1 to 5 · the agent loop (retry, done yet, model routing, branch pruning, tool selection) | We do not run our own agent loop. Claude Code runs it with its own classifier, and 2026-09-19 measured that classifier causing the prompt storm it was turned on to stop | No | | |
| 6 to 8 · action gates, permissions, spend | Rule 10's guards are deterministic: the SQL guard, dry-runs, apply gates, `workflow_dispatch`. The doctrine puts the safety inside the workstream. A probabilistic gate is weaker than a regex for the accident case, and no gate is a security boundary | No | Keep the regex | |
| 11 · trace observability | We keep no traces to score; `kb/_context_budget.py` measures the one that matters | No | | |
| The funding model, any count, any date | Jaggedness modes 2 and 3: no arithmetic, no dates. Every figure the model produces stays in code | Never | | |

## What the two posts get wrong

The infographic's first box says Jev "breaks the mission into small,
independent work packets". That is generation, and the thread, the vendor's
jaggedness page and S279's trial agree Jev does none. The thread describes the
model accurately. The infographic repackages TypeSafe's per-decision claim
(launch coverage quotes 40 to 200 times faster and 40 to 400 times cheaper
than a frontier model on decision tasks) as *build agents 200x faster*, which
is a different claim about a different thing.

*Run agents wide, not long* is half of this repo's rule. The other half keeps
a definition, a naming call or a judgment with Sam, because a majority among
agents regresses toward the common intuition. *Merge once* runs against one
concern per branch and the generated-artifact conflicts that taught it.

The cost argument does not transfer. At $0.042 per million input tokens, every
one of the 1.87 million rung-5 pairs at roughly 150 tokens costs about $12 in
total, and the 51-pair trial cost cents. The scarce resource here is curator
attention. Jev's value is ordering that attention, which is use case 9 and a
human-queue argument. On the vendor's own four-workflow benchmark Jev scores
below Opus 5 (67.8% against 73.1%), so where a decision is rare and
consequential, the frontier model or Sam still decides.

## What the thread gets right

Shadow mode first, on decisions with known answers, with thresholds chosen
from measurement. That is this repo's dry-run doctrine, and the sets exist:
Sam's 51 verdicts calibrate the CR gate, `kb_curation` calibrates title
alignment, and the rulings on `chat_interactions` calibrate the Sierra judge.
Record the model version, the question text and the probability beside every
suggestion, in the provenance tiers `map_users.js` established, because a row
whose source names a human may never be superseded by a model's inference
(Rule 8).

## Next concrete step

Sierra's semantic smoke assertions on the A/B runner, as an advisory column
first. They need no verdicts, no data leaves the building beyond answers the
smoke already logs, and Sam verifies each flag by reading the answer. The CR
variable battery waits for the 51 verdicts, which are the only ground truth
that lane has.
