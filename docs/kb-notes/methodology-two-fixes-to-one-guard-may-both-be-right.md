---
title: Two sessions fixing one guard may both be right — measure before you pick
created: 2026-09-10
updated: 2026-09-10
tags: [methodology, testing, ci, merge-conflicts, guards]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-a-check-that-cannot-fail-reads-as-a-clean-result]]"
  - "[[methodology-a-guard-on-generated-output-cannot-see-its-source]]"
  - "[[CLAUDE]]"
artifacts:
  - tests/discipline_edge_fill_test.py
---

# Two sessions fixing one guard may both be right — measure before you pick

> **One-sentence summary** — when a merge conflict is two different repairs to
> the same failing check, the resolution is not to pick the better one: run each
> against the failure the other was written for, because a check can be correct
> and still be blind exactly where its rival looks.

## Context

On 2026-09-10 two sessions independently found `tests/discipline_edge_fill_test.py`
red on `main` and fixed it within hours of each other. The merge conflicted.

The check reads the live `unified_courses_data.js`, runs `discipline_edge_fill()`
over it, and asserts something about the result. Its original assertion measured
**yield** — `filled >= blank_before * 0.5` — which was right while the fill was a
post-hoc repair applied to a committed payload. Once the fill moved into
`excel_to_dashboard.py`, the payload began arriving already at the fixed point,
and yield went to zero **on success**.

Two repairs, both sound on their face:

| | asserts | catches |
|---|---|---|
| **A** (the fixed point) | re-running the fill finds nothing to do (`filled == 0`), residue bounded | the **generator** dropping the fill — blanks come back, `filled` jumps off zero |
| **B** (the round trip) | clear the rows the fill itself stamped, re-derive every one | the **function** breaking — measured directly on live data |

## The test that settled it

Neither argument decides this; a falsification does. Break
`discipline_edge_fill()` at its core — empty the `edge` map so the map-based
fill can never match — and run both:

```
PASS  the committed payload is already edge-filled (86 blank, 0 fillable)
PASS  the unfillable residue stays small (86 of 16480)
FAIL  and the edge re-derives every fill it shipped (155 of 196)
```

**A stays green through a completely dead fill function.** It has to: it reads
`filled == 0`, and a function that fills nothing returns 0 against a payload an
earlier run already filled. The zero it asserts and the zero the failure
produces are the same number.

Run it the other way and B is the blind one: B clears and re-derives regardless
of what the payload shipped, so a generator that stopped calling the fill
entirely leaves B green.

So the two are complementary, and the merge keeps both. That is a measurement,
not a courtesy.

## The rule

**On a conflict between two repairs to the same guard, do not reason about which
is better. Break the thing the guard protects, in the way the guard exists to
catch, and run both sides.** Three outcomes:

- **Both fail** → they are the same fix in different words; keep the clearer one.
- **One fails** → keep that one; the other is measuring a proxy.
- **One fails and the other stays green** → keep **both**, and write down which
  failure each one owns, because the next session will otherwise "simplify" the
  redundant-looking pair back down to one.

The third outcome is the common one whenever a guard reads a **generated
artifact**, because there are always two ways for the artifact to be wrong: the
producer stopped producing, or the thing it calls stopped working. A single
assertion over the artifact's end state can usually only see one of them.

## Why this is easy to get wrong

Both repairs arrive with a confident comment explaining the failure, and both
comments are accurate. The conflict markers put them side by side and invite a
judgment call, which is exactly the situation where picking feels like
diligence. The falsification costs one command.

⚠️ **Corollary for the loser of a race.** Finding that `main` already carries a
fix for the failure you were about to fix is not a reason to discard yours
unread. Ask what each catches first.
