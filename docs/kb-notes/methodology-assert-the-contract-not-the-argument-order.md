---
title: A static guard should assert the contract, not the argument order
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, testing, ci, static-analysis, maintenance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/sierra_credential_naming_lessons]]"
artifacts:
  - tests/sierra_credit_disposition.test.js
  - tests/sierra_credential_volume.test.js
---

# A static guard should assert the contract, not the argument order

> **One-sentence summary** — a regex guard that pins exact neighbours fails on
> the next unrelated edit, and if the check is non-required nobody notices it has
> been red for weeks.

## Context

Wiring a new route into `cpl-chat` turned CI's `test` check red with two
failures in a *different* test file:

```
✗ 8 creditContext is passed to buildSystemPrompt
✗ 8 creditContext is interpolated into the system prompt
```

Checking them against `origin/main` showed **both were already failing before the
branch existed.** They had been broken by an earlier route (CRED·STD) and had
stayed broken, unnoticed, because `test` is a non-required check that never gates
a merge.

## The claim

**Assert the property whose violation is a real defect. Nothing else.**

The original assertions pinned position and adjacency:

```js
/teamGuidance \|\| "", creditContext\)/       // creditContext must be the LAST argument
/\$\{offeringsContext\}\$\{creditContext\}/   // the two must be ADJACENT in the template
```

Neither property matters. No behavior depends on `creditContext` being last, or
on it sitting immediately after `offeringsContext`. Inserting a sixth context
section between them is a correct, intended change — and it broke both checks.

What *does* matter is the contract: the context reaches the prompt builder, and
the builder emits it. Both failure modes are real (a context built but never
passed, or passed but never interpolated, is silent at author time and fatal to
the answer):

```js
/buildSystemPrompt\([^;]*\bcreditContext\b[^;]*\)/   // it is handed over
/\$\{creditContext\}/                                // it is emitted
```

Now a seventh section can be added without falsely accusing the sixth.

## Why it matters twice over

The brittleness has a compounding cost. A guard that goes red on unrelated edits
trains readers to ignore it — and on a **non-required** check there is no forcing
function at all, so the red simply persists. By the time someone looks, they
cannot tell whether the failure is theirs. Here it cost a full diagnosis cycle
against a prior revision just to establish *"not mine."*

That check-out-the-parent-and-run-it step is the cheap move, and worth making
reflexive: **before fixing an inherited failure, confirm it is inherited.**

## How to apply it

1. Write the regex against the invariant, not the syntax around it.
2. Ask: *"if this pattern stopped matching, would anything actually be wrong?"*
   If the honest answer is no, the guard is measuring formatting.
3. When a static guard fails on a change that looks unrelated, run it against the
   merge base before debugging your own diff.
4. Prefer a slightly loose pattern that only fires on real breakage over a tight
   one that fires on every refactor.
