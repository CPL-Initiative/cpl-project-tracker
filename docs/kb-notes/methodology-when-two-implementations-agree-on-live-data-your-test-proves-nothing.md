---
title: When two implementations agree on your live data, your test is not distinguishing them
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, testing, mutation-testing, guards]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-commit-the-test-harness]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - tests/cpl_funding_statutory_goals.test.js
---

# When two implementations agree on your live data, your test is not distinguishing them

> **One-sentence summary** — a guard written against production data can pass
> under both the correct implementation and the one you rejected; only a case
> where the two **diverge** proves which one is running.

## Context

The funding tab derives each priority's statutory goal from its **measure's
milestone**, deliberately not from its **title**, because titles are
curator-editable prose that drifts (the same failure mode that once collapsed
three noncredit metrics onto one credit measure).

A new suite asserted the derivation landed correctly on all three priorities.
Then a mutation replaced milestone-reading with title-matching — the exact
design error the code was written to avoid — and **every assertion still
passed.**

Not because the assertions were weak in an obvious way. Because on the live
config, the titles happen to agree with the milestones: the two Access
priorities are *titled* "Access…" and *measured* at eligible/applied; the
Completion priority is titled "Completion" and measured at transcribed. Both
implementations produce identical output on every row that exists.

## The rule

**If you cannot name an input where the correct implementation and the rejected
one give different answers, you have not tested the distinction — you have
tested that today's data is self-consistent.**

Write the divergent case explicitly, even when it is not a state your data is
in. The guard here became:

> Rename the *transcribed* priority to `"Access: renamed by a curator"` and
> assert it still funds goal **(B)**.

Title-matching sends it to (A); milestone-reading leaves it at (B). The
assertion now fails under the mutation, which is what makes it worth its lines.

## How to spot it before shipping

Mutation-test the *design decision*, not only the behavior. For any rule of the
form "derive X from A, not B":

1. Check whether A and B currently agree across your whole dataset. If they do,
   no natural test can separate them.
2. Construct the divergent input yourself — usually by driving the UI or fixture
   into a state a curator could reach but has not.
3. Confirm the mutation fails *that* assertion specifically.

## The sibling failure: a graceful path that asserts nothing

The same suite claimed a finding about the CPL story corpus. The test harness
does not load `window.CPL_STORIES`, so the code took its no-corpus branch —
which correctly makes **no claim at all** — and the assertion passed by matching
against an absent claim. The absence rendered exactly like the success.

This is the metric-with-no-feed trap in test clothing: **a guard that passes
because the feature did not run is indistinguishable from a guard that passes
because the feature worked.** Load the real input, or assert explicitly on the
degraded path — never let one stand in for the other silently.

## See also

- [`methodology-commit-the-test-harness`](methodology-commit-the-test-harness.md)
- [`docs/cpl_funding_lessons.md`](../cpl_funding_lessons.md)
