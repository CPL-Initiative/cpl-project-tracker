---
title: A status lane must link to the remedy lane, or "done" measures attention
created: 2026-08-12
updated: 2026-08-12
tags: [methodology, workflow-design, instruments, triage, governance, accountability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_training_tab_scope]]"
  - "[[docs/kb-notes/methodology-a-governance-artifact-must-measure-itself]]"
artifacts:
  - sierra_training.js
---

# A status lane must link to the remedy lane, or "done" measures attention

> **One-sentence summary** — When a workflow has one lane for *what state an item
> is in* and another for *the thing that actually fixes it*, the status lane must
> either link to the remedy or refuse to close without it; otherwise "done"
> records that a human looked, the queue reports itself clear, and nothing has
> changed.

## The shape

Sierra Training had two panes on one screen:

- **A feedback queue** — every answer a person rated, advancing `new → triaged →
  addressed`.
- **An instruction composer** — the plain-English rules Sierra actually follows.

Only the second one changes anything. The first one changes a label.

Nothing connected them. A curator could read a bad answer, click **addressed**,
and move on — and the tab would then report the queue clear while Sierra went on
giving the identical answer. The buttons were not broken; they were doing exactly
what they said. The problem was that what they said was mistaken for progress.

Sam's reaction on first using it is the whole diagnosis: *"When I click Triage,
there's no prompt for me to add any adjustments — not sure what it or Addresses
is doing."* He expected the status click to be the entry point to the fix. That
is the correct instinct, and the tab had no answer for it.

## Why it survives review

This is invisible from inside the build. Whoever wrote the queue knew that
"addressed" meant *a human dealt with this somehow, elsewhere* — an accurate
private meaning that never made it onto the button. Every reviewer who already
holds that model reads the tab as fine.

It also passes every test you would naturally write. The status advances. The RPC
is called. The row re-renders. Nothing asserts that the *world* changed, because
the status lane genuinely has no opinion about the world.

## The rule

**Name the two lanes, then wire them.** For any queue:

1. Which control changes the *state of the record*?
2. Which control changes the *thing the record is about*?

If those are different controls, the first must lead to the second. Three ways,
in increasing strength:

- **Label honestly** — say on the status control that it is bookkeeping and does
  not change the underlying thing. Cheapest, and it stops the misreading.
- **Link** — put the remedy action beside the status buttons, pre-seeded with the
  item's context so starting it costs nothing. This is what shipped: *"✍️ Write
  an instruction about this"* seeds the composer from the question and scrolls to
  it, but writes nothing on its own, because only a human knows the right answer.
- **Gate** — refuse to close without a remedy reference. Right when closure is a
  claim someone will rely on; too rigid when "no action needed" is a legitimate
  and common outcome (it is, here — plenty of thumbs-down are fine as-is).

## The generalisation, and why it keeps recurring

**Attention is not outcome, and only one of them is easy to record.** Systems
drift toward measuring the recordable thing. The same shape, three times in this
codebase:

- **The disposition rate** on the $50k work — colleges were being measured on
  credit *uploaded* rather than credit *applied*, and the Veteran Star taught them
  that uploading was the finish line.
- **`contact-refresh-cadence-never-run`** — a cadence decided in June with an
  instrument built for it, and zero rows to show it ever fired. Deciding is the
  recordable half; running is the half that matters.
- **This queue** — triaged is recordable; a changed answer is not, unless you
  wire it.

The diagnostic question is short: **if every item in this queue were marked done
tomorrow, what would be different in the world?** If the honest answer is
"nothing necessarily," the status lane is measuring attention, and it needs a
link to the lane that isn't.
