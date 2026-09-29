---
title: A typed answer is not a boolean, and reading it as one fails silently
created: 2026-09-20
updated: 2026-09-20
tags: [methodology, typesafe, jev, verification, silent-failure]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/common-cr-reference]]"
artifacts:
  - kb/_typesafe_smoke.py
  - kb/_typesafe_cr_trial.py
---

# A typed answer is not a boolean, and reading it as one fails silently

> **One-sentence summary** — a model that returns a calibrated probability
> answers every question, and a caller that tests it for `True` reports zero
> hits whatever the model said.

## Context

TypeSafe's System One model, Jev, answers a yes/no question with a **noul**.
The name suggests a boolean. It is a float:

    {"type": "noul", "noul": 0.89}

Their docs are explicit: *"A Noul answer is a single number representing the
probability that the answer is yes where 0 means no and 1 means yes... The
number is the answer and the certainty in one."* Noul carries **no** separate
confidence field; `choice` and `score` do.

The first cut of `kb/_typesafe_cr_trial.py` collected `answers.same.noul` and
then filtered:

    merges = [r for r in results if r["same"] is True]

A float never satisfies `is True`. The script would have printed **"MERGE on 0
of 55 pairs"** regardless of what Jev returned, and the per-row display would
have shown `p=--` for every line because it also asked for a probability field
that noul does not carry.

## Why this is worse than a crash

The output was **shaped like a finding**. "Jev merged nothing" is a publishable
negative result — it would have gone into a lane file, a handoff, and a
conversation with Sam as evidence that the model is not useful for this
problem. Nothing would have contradicted it. The next session would have
inherited it as settled.

A crash is free. A confident wrong answer costs a decision.

## What caught it

Not a test, and not review. **Network access.** `docs.typesafe.ai` was
egress-blocked from the agent sandbox, so the wire contract had been
reverse-engineered from the vendor's published npm SDK — which gave the
question shapes and the endpoint correctly, but the SDK's dist does not
document the *answer* schema. The moment Sam widened the environment's
allowlist to `*.typesafe.ai`, one `curl` of the docs showed the real shape.

**The cheapest fix for a class of silent failure was a network policy change,
not code.**

## The rule

When a model or API returns a **typed** answer, read its schema before you
branch on it, and treat a probability as a probability:

- Bucket on thresholds **you** choose, in your own code, and say so — that is
  the confidence-gated routing the vendor actually recommends.
- Make the "everything landed in one bucket" case **loud**. `_typesafe_cr_trial.py`
  now prints a warning when every pair scores into a single bucket, because
  that is what "the model is not discriminating" looks like and it is
  indistinguishable from a working run by the counts alone.
- A field you are guessing at is a field you have not read. `same.get("probability",
  same.get("confidence"))` was a guess dressed as a fallback chain.

## See also

`methodology-verify-the-premise-before-you-build-on-it` — the same failure one
level up, where the premise rather than the field was wrong.
