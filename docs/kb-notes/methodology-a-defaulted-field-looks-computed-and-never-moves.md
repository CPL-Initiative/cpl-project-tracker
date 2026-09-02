---
title: A field defaulted in the consumer looks computed and never moves
created: 2026-09-02
updated: 2026-09-02
tags: [methodology, testing, data-integrity, ui]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-live-painted-page-still-goes-stale-in-its-prose]]"
artifacts:
  - cpl_funding.js
  - funding_model_payload.js
  - funding-model/index.html
  - tests/funding_model_page.test.js
---

# A field defaulted in the consumer looks computed and never moves

> **One-sentence summary** — `x == null ? DEFAULT : x` in a consumer turns a
> missing field into a confident answer, and the result is indistinguishable
> from a computed one until somebody changes the input and watches.

## Context

The public funding explainer told readers, in a sentence, that all three of the
model's funding factors were set to 1.0. The live Year-1 factors were 0.5.

That much was known: a session had already recorded it, in the handoff and in
`cpl_memory`, as **stale static prose** — text the page's painter cannot reach
because it carries no element id. The remedy that follows from that diagnosis is
to give the sentence an id and paint it.

The diagnosis was wrong, and the real cause is worse.

`_prios()` — the accessor every consumer of the funding model is told to use
instead of reading the config — built a projection carrying `key`, `label`,
`share`, `cap` and `target`, and **omitted `factor`**. The payload builder read:

```js
factor: p.factor == null ? 1 : p.factor,
```

So the page printed 1.0 at *every* setting. Not because the prose was frozen —
the sentence was regenerated on every paint — but because the value flowing into
it was a constant wearing a computation's clothes.

## Why nobody caught it

The chain looked impeccable at every link:

- a **live** page, not a snapshot;
- a payload built **from the engine**, not hand-typed;
- a **defensive default**, which reads as good practice.

And every test passed, because every test asked the same question: *does the page
show what the payload says?* It did. The payload said 1.0.

This is the property that makes the class dangerous. A hard-coded literal is
visible in a diff and greppable. A defaulted field is neither: the code that
produces the wrong answer contains no wrong value, and the surface that displays
it is doing its job correctly.

## The tell, and the guard

**The tell is not the value. It is that the value never changes.**

A reader cannot distinguish a computed 1.0 from a defaulted one by looking, and
neither can a single-paint assertion. What separates them is behavior under
change — so the test has to *make* the change:

1. write a new value through the same layer a curator writes through (not by
   mutating the payload, which would test nothing about the engine);
2. repaint;
3. require the surface to **disagree with itself**.

```js
const before = doc.getElementById("t-factors").textContent;
T._setShared({ yearPriorities: { "1": { "0": { factor: 0.5 }, … } } });
repaint();
check("changing the funding factors moves the figure the page prints",
  before !== doc.getElementById("t-factors").textContent);
```

Mutation-verified in both directions: removing `factor` from the projection
again turns exactly three assertions red, by name.

Add the **mixed** case where one exists. A single-value summary sentence ("all
three are set to N") is a second place the default can hide: with three
different factors there is no "all three", and a page that still says it is
wrong in a way the uniform case never exposes.

## When to look for this

Any time a consumer defaults a field it did not ask the producer to guarantee.
The smell is a ternary against `null`/`undefined` on a value the surface then
states as fact. Two questions settle it:

- **Does the producer actually emit this field?** Read the projection, not the
  type or the docs.
- **If I change the input, does the output move?** If no test answers this, the
  default is load-bearing and nobody knows.

## The related failure, and how they differ

[`methodology-a-live-painted-page-still-goes-stale-in-its-prose`](methodology-a-live-painted-page-still-goes-stale-in-its-prose.md)
covers the neighbouring case: a painted page whose *unpainted* sentences go
stale. Both produce a page that contradicts its own model, and they are worth
holding apart because the fixes differ:

| | stale prose | defaulted field |
|---|---|---|
| Where the wrongness lives | in the markup | in the data path |
| Visible in a diff? | yes — a literal | no — a ternary |
| Fix | give it an id and paint it | make the producer emit the field |
| Guard | lint for unpainted figures | change a dial, require disagreement |

⚠️ The trap is that the first diagnosis fits the second symptom perfectly. A
sentence stating a wrong number on a painted page *looks* like unpainted prose,
and painting it "fixes" nothing — the painter would have written 1.0 too.
**Before painting a wrong figure, check that the payload knows the right one.**

## Provenance

Found 2026-09-02 (Session 219) while revising the explainer's register at Sam's
request; the sentence had to be read closely to be rewritten, which is what
exposed it. Recorded in `cpl_memory` as
`a-defaulted-field-looks-computed-and-never-moves`. PR #1434.
