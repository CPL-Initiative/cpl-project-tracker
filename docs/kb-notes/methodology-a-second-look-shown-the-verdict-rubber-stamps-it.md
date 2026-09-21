---
title: "A second look shown the verdict rubber-stamps it — ask the negative instead"
created: 2026-09-21
updated: 2026-09-21
kb-status: published
tags: [methodology, adjudication, ai, trail-crew, jev, verification]
artifacts:
  - kb/_jev_adjudicate.py
  - tests/jev_adjudicate_test.py
related:
  - "[[playbook-trail-crew-method-magic-audit]]"
  - "[[methodology-a-typed-answer-is-not-a-boolean]]"
---

# A second look shown the verdict rubber-stamps it

An AI adjudication pass that proposes merges needs a check, because a wrong
merge destroys a real distinction and nothing downstream recovers it. The
obvious check is to hand the model its own proposal and ask it to find fault.

**That check measures almost nothing.** A model shown a conclusion and asked to
critique it is being asked to disagree with a plausible statement it has just
been told is the answer. Agreement is the cheap response and it looks exactly
like verification.

## What works instead

Put the **same evidence** to the **opposite question**, in a **separate call**,
with the first answer **withheld**.

    positive:  "Are these the same recommendation?"          -> p = 0.93
    negative:  "Is there a difference in level, scope, units,
                lab against lecture, or vendor specificity
                that means these should stay separate?"      -> p = 0.04

Two independent looks at one body of evidence. They can disagree, and when they
do that is information — it is the pile worth a curator's time first. Agreement
between a question and its own restatement would have been information about
nothing.

## Three rules that fall out of it

- **A refuted proposal never reaches the plan, however confident the first look
  was.** The Trail Crew playbook states it as *"a refuted merge falls back to
  the judgment queue instead of the plan"*. Confidence alone never promotes.
- **The gate is symmetric.** The negative has to be as sure to overturn as the
  positive was to propose. A 0.5 "maybe" is not a refutation and must not read
  as one; treat it as contested.
- **Spend the second call only where it can change the outcome.** Below the
  gate the curator sees the finding regardless, so a second look there costs a
  call and changes nothing.

## Where this came from

The `playbook-trail-crew-method-magic-audit` runs of 2026-07-10 had working
skeptics, and the note recorded why they worked: *"Skeptics must re-derive the
numbers, not re-read the claim. Both kills this run came from skeptics
recomputing variant counts / re-key targets from the registry and catching
factual errors in otherwise-plausible proposals."*

Re-derivation is the real principle; recomputing from a registry is one way to
achieve it. A model that cannot reach the registry — a hosted classifier given
only the state you hand it — reaches the same place by being asked the negative
from the same evidence. What must never happen is the second look inheriting the
first one's conclusion.

⚠️ **The failure is silent.** A rubber-stamping skeptic produces a clean report
with a high confirmation rate, which is indistinguishable from a pass that
worked. `tests/jev_adjudicate_test.py` asserts that the skeptic's call does not
contain the first verdict, because nothing in the output would ever reveal it.
