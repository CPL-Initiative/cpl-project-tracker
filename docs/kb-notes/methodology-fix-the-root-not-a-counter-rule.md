---
title: "Fix the root, not a counter-rule: decision-tracing a stack of interacting rules"
created: 2026-07-21
kb-status: published
tags: [methodology, rule-interaction, debugging, decision-trace, display-vs-gate, regression-sweep, cip]
related:
  - "[[cip_crosswalk_lessons]]"
  - "[[methodology-grounded-lexical-cip-confidence]]"
  - "[[methodology-top-is-a-last-in-line-signal]]"
---

## The problem shape

A feature accretes rules — each scoring, gating, or display rule reasonable on its own. Then a case comes in
where the output is confusing or wrong, and no single rule looks broken. The instinct is to add ANOTHER rule
to counter the bad case ("don't do X for law courses…"). That's how rule-sets rot: every counter-rule creates
new edge cases, and you spend forever **chasing your tail** — fixes that work for some cases and break others.

The CIP Coder's BUSL 10 case (2026-07-21, #869): "Introduction to Law" displayed a CIP code that wasn't even
in its crosswalk, at a misleadingly-low confidence, with a Confirm button pointing at a *third* code. Four
rules, none individually wrong.

## The method

**1. Build a visual decision-trace over the LIVE engine — don't reason from the code alone.**
Trace a real input through every rule in order, capturing what each rule computed *for that input*, using the
engine's actual seams (not a re-implementation). Include a **working control** (a case that behaves correctly)
and a **contrast control** (a different rule path). Rendering them side by side reveals whether you're facing:
- a **LOOP** (rules genuinely feed back on each other → adding a rule really is tail-chasing), or
- a **CASCADE** (rules run once in a fixed order; one miscalibration at the top trips downstream rules that
  *assumed the upstream output was meaningful*).

Almost always it's a cascade. BUSL 10: a confidence miscalibration (blind to a "Law"≠"Legal" synonym) tripped
a "weak pick" display-default, which tripped a box/confirm mismatch. The working control (a carpentry course)
took the identical rules to a clean result — the *only* difference was a word-stem coincidence upstream.

**2. Fix the top domino, not the symptoms.** In a cascade, correct the earliest miscalibration and the
downstream rules stop firing on their own — no counter-rule needed. Downstream guards become belt-and-suspenders,
not new logic. (BUSL 10: teach the confidence that a sole/authoritative mapping IS the answer → it reads high →
the "weak pick" default never triggers → the box/confirm agree.)

**3. Keep display and gates separate.** When a *number reads wrong* but the *classification is right*, change
the DISPLAY and leave every gate on the raw signal. This is provably non-disruptive — it can't move the
classification counts, the overrides, or the safety flags. (See `methodology-grounded-lexical-cip-confidence`.)

**4. Prove soundness with a deterministic before/after sweep, not opinion.** Snapshot the pre-fix engine
(`git show <base>:file`), run both old and new over real data, and **diff the invariants**: did any
classification change? any output change that ISN'T one you intended? any safety flag lost? A clean diff
(e.g. "0 status changes across 2,136 courses; 0 unexpected output changes; 0 flags lost") is the proof — worth
more than a design review, because it's grounded in the real distribution, not a plausible-sounding argument.

## Why not just ask another model to critique the plan

A fresh design critique tends to *expand* scope ("here's a bigger rework…") — the opposite of what a cascade
needs. The empirical sweep is the right instrument for **soundness**; a critique is for **direction**, which
you usually already have. (Sam, 2026-07-20: skip the Fable pass, let the regression sweep prove it — it did.)

## The tell you're tail-chasing

You're about to add a rule whose only job is to suppress another rule's behavior for a named subset. Stop and
trace: you're almost certainly downstream of a miscalibration you could fix at the source instead.
