---
title: A bound is tested by value, not by the model's clamp count
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, funding, allocation, reporting, cpl-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - cpl_funding.js
related:
  - "[[methodology-a-total-that-balances-is-not-a-total-that-is-right]]"
  - "[[cpl_funding_lessons]]"
---

# A bound is tested by value, not by the model's clamp count

> **One-sentence summary** — "held to the maximum" and "receiving the maximum"
> are different populations, and a sentence that counts one while gating on the
> other will contradict itself in front of a reader.

## The situation

An award-range box names the extreme of a distribution. When several institutions
share that extreme, naming one of them reads as a fact about that one rather than
as *"this is the cap"* — so the box should count them instead.

The obvious implementation asks the model which institutions it **clamped**:

```js
if (bound > 0 && model.cappedCount > 1) → "N institutions at the $X maximum"
```

That is wrong, and live data showed it. On the noncredit lane:

- `ncModel().capped` names **2** institutions
- **3** institutions receive exactly `$100,000`

Santa Ana's *unclamped* proportional award solves to exactly **$100,000.00**. A
bounded solve converges with it sitting on the knife edge, so it receives the
ceiling without ever being *held* to it. Both figures are correct. They measure
different things:

| Question | Answer |
|---|---|
| Who did the ceiling bind? | 2 — a fact about the **solver** |
| Who receives the maximum? | 3 — a fact about the **distribution** |

Gate the sentence on the first while counting the second and the box says
*"3 institutions at the $100,000 maximum"* on a run where the model reports two
capped — a disagreement a reader can find and nobody can defend.

## The rule

**Ask the question the reader is asking.** A reader of an award range wants to
know how many receive this figure. So:

- count recipients **at the value**, and
- name the bound only when the extreme **is** the bound — `|extreme − bound| ≤ ε`,
  not "did the solver clamp anyone".

```js
function boundLabel(one, count, bound, word, boundWord) {
  var atBound = bound > 0 && Math.abs(count.value - bound) <= 0.5;
  return (atBound && count.n > 1)
    ? count.n + " " + word + " at the " + fmtMoney(bound) + " " + boundWord
    : esc(dispName(one));
}
```

This also fails correctly when the bound is inactive: with no ceiling set, the
maximum is simply the largest award and gets named, not counted.

## Why it generalizes

Any solver that clamps values maintains **two** populations that are easy to
conflate: the rows it *acted on*, and the rows that *ended up* at the bound. The
second always contains the first and can be strictly larger, because a
redistribution can land an untouched row exactly on the edge.

Reporting surfaces almost always want the second. Diagnostics almost always want
the first. Naming them the same thing in code (`capped`, `floored`) invites the
substitution — so read the variable name as *"clamped by the solver"* every time,
and reach for a value comparison when the sentence is about outcomes.

⚠️ The corollary for tests: assert the **value**, never the count. A test pinned
to `cappedCount` passes on the wrong sentence.
