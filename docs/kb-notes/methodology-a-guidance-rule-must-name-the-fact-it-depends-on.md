---
title: A guidance rule that references a fact the request does not carry is an instruction to guess
created: 2026-08-22
updated: 2026-08-22
tags: [methodology, sierra, cpl-assistant, guidance, prompt, my-college]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-conversation-is-scoped-state]]"
  - "[[docs/college_action_page_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_host_scope.test.js
---

# A guidance rule that references a fact the request does not carry is an instruction to guess

> **One-sentence summary** — Sierra's `sierra_guidance` table let the team switch
> on the directive *"confine your answers to the selected institution"*, and
> nothing in the request ever said which institution was selected; a rule whose
> subject is absent from its input does not fail loudly, it hallucinates a
> subject.

## Context

The `sierra_guidance` table (v25) is the team's tuning layer: short directives
authored by curators, injected into every prompt, no deploy needed. That is the
right shape — but it means a rule can be **written and switched on** while the
mechanism it names does not exist.

Row `15ec666b`, active:

> *"When using Sierra from the My College COBI tab, confine your answers to the
> selected institution and try not direct users elsewhere."*

The request body carried `query`, `session_id`, `history`, `audience` and `ctx`.
It carried no selected institution — and no indication the caller was that tab.

## The claim

### A rule with a missing input does not degrade to "no rule"

It degrades to **"pick one"**. The model was told to confine its answer to a
selection it was never shown, so it inferred the selection from whatever
institution its context contained. On 2026-08-22 that was the previous scope's
conversation, and Sam got a district-shaped answer about the wrong district.

The instruction was not ignored. It was *followed*, against a guessed subject.

### Two questions to ask of every guidance row

1. **What fact does this rule reference?** ("the selected institution", "the
   reader's college", "this tab")
2. **Does the request carry it?** If not, the rule is not a tuning knob — it is a
   request for a confabulation, and it will be at its most confident exactly when
   it is wrong.

This is the guidance-layer form of a lesson this repo already holds at the data
layer — [`a-filter-needs-a-field`](methodology-a-filter-needs-a-field.md): you
cannot filter by an attribute that is not addressable, and you cannot instruct
against a fact that is not transmitted.

### The fix is a field, not better wording

`scope: { kind, label }` on the request; `normalizeHostScope()` +
`hostScopeBlock()` in the function. Now the rule the team wrote is *followable*,
and it did not need rewording.

### A default, never a filter — and the rule's own example says so

The same directive's worked example is a reader asking *"I took a noncredit
computer class at Cabrillo and got a CompTIA certificate, what credit can I
get?"* — from another college's page. So the scope sets the subject when the
question does not, and yields when it does. A first cut that hard-scoped the
answer would have broken the very reader the rule was written for.

Mechanically: the host scope resolves a profile **only** when the question
resolved none, and it resolves through the same `detectAndFetchCollegeProfile()`
path a typed question uses — a second matcher would be a second thing to keep in
step with `map_colleges`.

## How we got here

Found while tracing why a district answer named the wrong district. The stale
conversation ([`a-conversation-is-scoped-state`](methodology-a-conversation-is-scoped-state.md))
supplied the wrong institution; **this** rule is why the model committed to one
so confidently rather than answering generally. Both had to be fixed: clearing
the thread alone leaves an assistant that still cannot know whose page it is on,
and would answer statewide under a district heading.

## Consequences / how to apply it

- Audit `sierra_guidance` the way you would audit a query: for each active row,
  name the fact it depends on and point at the field that carries it.
- When a directive's subject is a property of the **caller** rather than of the
  question, it needs a request field. Tone and format rules do not; scoping rules
  almost always do.
- A rule that cannot be followed is worse than no rule, because it converts
  "I don't know" into a specific, plausible, wrong answer — and this project has
  repeatedly found that a confident wrong answer costs more than an absent one.
