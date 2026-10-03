---
title: Write a model's rule as the sentence you want the reader to leave with, because the model will say it
created: 2026-10-03
updated: 2026-10-03
tags: [methodology, sierra, prompt-rules, a-b-testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/reference/lanes/sierra-retrieval-corpus]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_program_courses.test.js
  - chatbox/smoke_test.sh
---

# Write a model's rule as the sentence you want the reader to leave with

> **One-sentence summary** — A rule in a model's prompt is text the model may
> repeat to the reader, so state it as the claim the reader needs.

## Context

Sierra's program-course block (S318) told the model how to read a course list:
*"never call a course required and never add up the units: honors versions and
alternatives appear side by side."* The sentence was true about the data and
written for the model. The first preview A/B of the route (S319, run
37126608238) passed every smoke mode and listed all 27 courses of Mt. San
Antonio's LVN-to-RN A.S. correctly. It then told the student that honors
versions *"appear side by side rather than as substitutes you'd choose
between."* A student reading that takes ENGL C1000 and ENGL C1000H both.

## The claim

**The model turns a description of the data into a claim about the world.**
"Side by side" described where the honors pair sits in the list. The model
restated it for the reader and finished the thought on its own: side by side,
so not substitutes. The rule held no false word; the answer did.

**Write the rule as the sentence a reader should leave with.** The fix states
the claim directly: *"The list holds more courses than one student takes. An
honors version sits beside its standard course, and a student takes one course
of each honors pair. Where other courses look like alternatives, say the
catalog or a counselor confirms which ones count."* The second A/B answer said
*"a student takes one from each pair, not both."*

**Only reading the answer finds this.** The grid was clean on the first run.
Every assertion passed, because none asked about honors pairs. A guard written
after the fact catches the recorded sentence, and the rule test fails if the old
wording returns, but the find came from a person reading the candidate's prose.

## How we got here

S318 wrote the rule to stop "required" and a unit total, the two errors the
data invited. S319's A/B passed and its prose was read before the deploy ask,
per the A/B doctrine (read the grid and the answer, never the run's
conclusion). The rule was rewritten, guarded
(`tests/sierra_program_courses.test.js` block 5, two checks; smoke 7l, one
line), re-run on a second A/B, and deployed (#1832).

## When to apply

Any instruction block a model reads before writing to a person: Sierra's
context blocks, report prompts, drafting rules. Read each rule aloud as if the
model said it to the visitor. If the sentence would mislead a reader, or invite
a conclusion the data does not support, rewrite it as the claim you want made.
