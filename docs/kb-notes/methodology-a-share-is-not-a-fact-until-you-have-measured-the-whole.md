---
title: A share is not a fact until you have measured the whole
created: 2026-09-11
updated: 2026-09-11
tags: [methodology, reasoning, cost, measurement]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# A share is not a fact until you have measured the whole

> **One-sentence summary** — three wrong claims in two days, all the same shape:
> reasoning confidently about what fraction of something a part represents,
> without ever having measured the total, when the total was sitting in a file or
> a log the whole time.

## Context

Sierra's cost header carried three assertions written across 2026-09-10/11. Each
was stated as a conclusion, each drove a real decision, and each was wrong:

| claimed | measured | how far off |
|---|---|---|
| the cached prefix is ~3,234 tokens | **4,476** | chars/4 ran 28% low |
| moving model "comes back cheaper" on the cached prefix | **1.72× dearer** per input token | the prefix is 19% of a request, not most of it |
| conversation history is the uncached 81% | history is **~0** in production | capped at 6 turns × 2,000 chars, and the main client sends none |

## The claim

**An estimate of a part, divided by an unmeasured whole, is not a share — it is
two guesses multiplied.** Each of the three failures above is the same move: take
a number that is roughly known (or roughly estimable), treat it as dominant,
and reason about the system as though the part were the thing.

Three specific traps, each independently sufficient:

**1. A proxy for a quantity is not the quantity.** `characters / 4` is a
convention for estimating tokens. It ran 28% low here — fine as a sanity check,
fatal as a premise when the number is being compared against a threshold it sits
near. **The moment an estimate is load-bearing against a boundary, it has to
become a measurement.**

**2. A lever on a part is bounded by that part's share.** Caching the prefix
cannot offset a doubling of the total when the prefix is a fifth of the total.
This is arithmetic, and it was knowable before any measurement — which is why it
is the most embarrassing of the three. **Before claiming an optimization pays,
state what fraction of the cost it touches, and check the ceiling that implies.**

**3. A component's configured cap bounds it, and the cap is in the code.** The
conversation history could not be 81% of the input because the code truncates it
to about 3,000 tokens and the production client omits it. One `grep` away, three
thousand lines below the comment asserting otherwise.

**The unifying test: name the denominator, say where you got it, and say whether
you measured it or assumed it.** A claim that cannot answer those three is not
ready to be written down, let alone acted on.

## How we got here

By committing all three and being corrected by data each time. The repair that
generalizes is not "be more careful" — it is **instrumentation**: the reason the
shares were guessable-at rather than knowable was that the log line reported one
number (`uncached_input`) for a quantity with four distinct components. A system
that reports a total but never its composition invites exactly this error, and
will keep inviting it.

⚠️ The file *already warned about this*. The header said "3,234 IS AN ESTIMATE …
the decisive evidence is `usage.cache_read_input_tokens` on a live request." The
warning was correct, was read, and was reasoned past anyway. **A caveat next to a
number does not stop the number being used as a fact.** Only replacing it does.

## When this applies (and when it doesn't)

**Applies** wherever a decision turns on proportion rather than magnitude: cost
attribution, performance optimization ("where is the time going"), capacity
planning, deciding which of several contributors to fix first, and any argument
of the form "X dominates, so improving X improves the system."

**Does not apply** to order-of-magnitude reasoning where the conclusion survives
a large error in the estimate. If the answer is the same whether the part is 20%
or 80%, the estimate is doing no work and measuring it is waste.

**Boundary worth naming:** measuring the denominator is sometimes the expensive
part. The honest move then is not to guess quietly — it is to state the
assumption in the claim itself, so the claim fails loudly when the assumption
does.

## See also

- `[[docs/cpl_assistant_lessons]]` — the workstream that produced this
- PR `#1550` — the corrections and the measurements
- `[[docs/kb-notes/methodology-a-guard-on-generated-output-cannot-see-its-source]]`
  — the same session's other failure of instruments that cannot see their subject

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
