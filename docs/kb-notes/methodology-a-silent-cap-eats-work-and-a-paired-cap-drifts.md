---
title: A limit nobody can see eats work, and a limit enforced twice drifts
created: 2026-08-12
updated: 2026-08-12
tags: [methodology, ux, validation, silent-failure, sierra, guidance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_training_tab_scope]]"
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
artifacts:
  - sierra_training.js
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_training_plain.test.js
---

# A limit nobody can see eats work, and a limit enforced twice drifts

> **One-sentence summary** — `maxlength` silently stops accepting keystrokes, so
> a user's text is cut without a word; and when the same cap is enforced on both
> the client and the server, raising one side only relocates the silent
> truncation, which is why the two must be tested as a *pair*.

## What happened

Sierra's instruction composer carried `maxlength="500"`. The edge function that
sends those instructions to the model independently sliced each one to 500 too.

On 2026-08-12 the curator wrote three instructions. All three were cut:

| Length | Ends |
|---|---|
| 499 | mid-table — `\| ASE A1 –` |
| 500 | `…noting CCR is a work in progress` |
| 500 | `…program of study and transfer destination` |

Nobody was told. He only discovered it because he asked, separately, why his
instructions did not seem to be taking effect. **Two rules landing on exactly
500 characters is not a coincidence — it is a fingerprint**, and it is worth
learning to recognise: when several independent inputs share an identical
length, they were cut, not written that way.

## Why `maxlength` is the wrong instrument alone

`maxlength` does not reject, warn, or truncate visibly. It stops the keypress
from registering. From the writer's side that is indistinguishable from a stuck
keyboard, a lost focus, or a frozen page — so the natural reaction is to try
again, not to shorten the text. And once the field is submitted, the record
looks deliberate: there is no marker distinguishing "they wrote 500 characters"
from "they wrote 900 and we kept 500."

**The fix is not a bigger limit. It is a visible one.** Raising 500 → 1500 only
moves where the cliff is; a live counter (`n / max`, warning as it fills, saying
outright that more will not be saved) is what stops it being silent. Do both:
the limit should be generous enough to be rarely hit, and visible enough that
hitting it is an event.

## The paired-cap trap

The same number lived in two files that ship separately — a browser asset and an
edge function. Four failure modes follow, and only the first is obvious:

1. Raise the client only → truncation moves server-side, still silent.
2. Raise the server only → the user still cannot type past the old cap.
3. Deploy them out of order → a window where one is right and one is wrong.
4. Someone edits one later for a good local reason → silent drift, indefinitely.

So the test does not assert two numbers. It asserts **equality between them**,
reading the constant out of each file:

```js
const uiMax  = api.GUIDANCE_RULE_MAX;                                 // client
const fnPer  = /GUIDANCE_MAX_CHARS_PER_RULE = (\d+)/.exec(FN);        // function
check("THE PAIR: UI cap === function slice", Number(fnPer[1]) === uiMax);
```

Also assert the server slices **by the named constant**, not a bare literal —
otherwise the constant can be raised while the slice quietly keeps the old
number. And deploy the *server* side first: a server that accepts more than the
client offers is harmless; the reverse truncates.

## The budget below the cap

A per-item cap is usually not the only limit. Here the function also capped the
*total* across all instructions and the *count* it would send — and past either,
it simply stopped adding, dropping the **oldest** rules. Those were the
longest-standing and most load-bearing ones. That failure has no cliff a user
can feel at all: nothing is refused, the instruction just stops being obeyed.

If a limit governs a *set* rather than one item, render the set's consumption
(`used of total`) beside the composer, and warn before it binds.

## Generalisation

Any cap that can be reached by ordinary use needs three things:

1. **Visible** while the user is still typing — not at submit, not never.
2. **Single-sourced, or asserted equal** if it must exist in two places.
3. **Reported when it binds.** Silently keeping part of someone's input is a
   data-integrity fault, not a UI nicety. If you cannot show it, do not truncate
   — reject with a reason.

The related failure in the same tab: marking an item "addressed" recorded that a
human looked at it, while nothing on the page connected the finding to the
action that would fix it. **A queue that tracks attention but not remedy will
report itself complete while nothing has changed** — see the sibling lesson in
`docs/sierra_training_tab_scope.md`.
