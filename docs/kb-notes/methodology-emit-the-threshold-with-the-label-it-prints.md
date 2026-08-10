---
title: Emit the threshold with the label it prints
created: 2026-08-10
updated: 2026-08-10
tags: [methodology, privacy, suppression, disclosure-control, generator, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/adr-student-detail-aggregate-disclosure-control]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/sierra_credential_naming_lessons]]"
artifacts:
  - tests/suppression_floor.test.js
  - excel_to_dashboard.py
---

# Emit the threshold with the label it prints

## The finding

A privacy threshold defined as a named constant is only half a control. If the
**label** that renders it is a literal, the two drift the moment the number
changes — and the drift is silent, because no test compares a label to a
constant.

Raising the CPL small-cell suppression floor from 5 to 10 on 2026-08-10 was a
one-token change in Python. The mask `"<5"` was hard-coded in **eight** JavaScript
call sites. One of them already read:

```js
"counts under " + pf.suppress_below + " read &lt;5"   // → "counts under 10 read <5"
```

It printed the live floor next to a stale label **in the same sentence**, and had
done for however long the floor had been 5.

## Why it matters more than a cosmetic bug

The failure is asymmetric in the dangerous direction. After the change every
public surface would have **understated the protection** (claiming counts 1–4 are
withheld when the real floor is 10) while **overstating precision** (implying a
cell showing `<5` could be 5–9). A reader making a disclosure judgement off the
label would have been reasoning from a number the system stopped using.

Nothing fails. The page renders, the tests pass, the data is correctly
suppressed. Only the sentence describing it is wrong.

## The rule

**The generator emits the threshold into the payload; every consumer renders the
label from that value; no surface hard-codes a mask.**

```python
"_stats": { "served_suppress_below": SERVED_SUPPRESS_BELOW }
```

```js
function servedFloor() {
  var s = (window.PAYLOAD || {})._stats || {};
  return (typeof s.served_suppress_below === "number" && s.served_suppress_below > 0)
    ? s.served_suppress_below : SAFE_FALLBACK;   // fallback = the stricter value
}
function servedMask() { return "<" + servedFloor(); }
```

The fallback matters: a stale cached payload must mask at the *safer* threshold,
never at none.

## Test the failure mode, not the value

A test asserting `mask === "<10"` re-encodes the constant and will fail on the
next change for the wrong reason. Three assertions that survive:

1. **No surface hard-codes a mask** — regex the consumers for quoted `<N` tokens.
2. **The published floors agree** — every generator writing a headcount floor
   reads the same number; two floors for the same anonymous reader is the bug.
3. **Positive control** — feed a payload declaring a *different* floor (25) and
   require the label to follow. This is what actually proves the helper reads
   rather than hard-codes; verify it by re-inlining a literal and confirming the
   guard goes red.

## The corollary that nearly bit twice

The same drift hides in **assertions**. The neighbouring privacy check was
`!/[1-4]/.test(cellText)` — a regex for the sub-floor digits, which silently
stopped covering the real range when the floor moved. That is the more dangerous
of the two, because it is the check meant to catch a leak. Derive test ranges
from the floor as well, or assert the cell equals the mask and nothing else.

Across 195 test files, exactly one noticed the floor change — and only because it
hard-coded the value, which is also why it reported a deliberate change as a
regression.
