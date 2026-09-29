---
title: A model switch carries its defaults with it, not just its price
created: 2026-09-11
updated: 2026-09-11
tags: [methodology, sierra, cpl-chat, llm, model-choice]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-an-error-inside-a-success-is-invisible-to-every-status-check]]"
  - "[[a-cache-breakpoint-must-lead-the-prompt]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_model_choice.test.js
---

# A model switch carries its defaults with it, not just its price

> **One-sentence summary** — a request is the union of the fields you send and
> the fields the model assumes, so changing the model id silently re-decides
> every field you never set; the outage that follows looks like the model's
> fault and is a default's.

## Context

Sierra (the `cpl-chat` Edge Function) moved from Haiku 4.5 to Sonnet 5 on
2026-09-10. Within minutes a quarter of her answers came back blank while every
instrument read healthy. Two diagnoses were written before the cause was seen:
an unhandled upstream error, then "the output cap is too small for this
model." Neither was it. See `docs/cpl_assistant_lessons.md` (2026-09-11).

## The claim

**A request that omits a field is not the same request on a different model.**
On Sonnet 5 a request with no `thinking` field runs adaptive thinking; on Haiku
4.5 and Sonnet 4.6 the same request runs none. Thinking tokens are output tokens
under the same `max_tokens` cap. So the request Sierra had always sent — model,
cap, prompt, question — asked the new model for something the old one never
did, and on a question the model chose to reason about it spent the whole
2,048-token budget before the first word of the answer.

Three things follow.

1. **The checks that pin a model switch guard what is written down, and a
   default is an absence.** The file pinned the price, the context window and
   the cache floor to the model id, and every one held. Nothing checked what
   the model does when a field is missing, because there was no line to check.
   The guard that closes this asks, per model id, what the configured model
   assumes when the field is absent, and fails closed on an id it does not
   know (`tests/sierra_model_choice.test.js`, block 5).

2. **Send the field.** Where a model-dependent behavior exists, the request
   should say what it wants rather than inherit it: `thinking: { type:
   "disabled" }` is the request Sierra always made, spelled out. The same
   discipline applies to any parameter whose default is a property of the
   model rather than of the endpoint.

3. **The vendor's migration notes for the exact pair of models are a primary
   source, and they are cheaper before the switch than after.** Anthropic's
   Sonnet 5 guide names this case in one sentence: *"a workload that ran
   thinking-off on Sonnet 4.6 by omission may now truncate. Either set
   `thinking: {type: "disabled"}` explicitly to keep the old behavior, or
   revisit `max_tokens`."* It also names the second change that the numbers had
   already shown: the tokenizer counts about 30% more tokens for the same text,
   which is why the cached prefix measured 4,476 tokens against the 3,234 that
   chars/4 predicted, and why the same output cap now holds about a quarter
   less text.

**The symptom is the tell.** A blank answer with `stop_reason: max_tokens` and
`output_tokens` at exactly the cap, on a model that thinks by default, is
thinking that consumed the budget — not an error, and not a cap that was fine
for weeks on the previous model.

## How we got here

`chat_interactions` held the answer before anyone read it as one: 35 of 35 blank
turns at `output_tokens=2048` with zero text, 28 of 98 real answers also at the
cap, and zero blanks in the fourteen days before the switch. The first
diagnosis reasoned from the shape of the stream loop; the second from the cap
alone; the third from what the model does with a missing field, which is the
only one of the three that explains all four numbers. The fix is one field and
was falsified against the pre-change file (20/20 after, 18/20 before, both reds
naming the defect). PR #1551.

## When this applies (and when it doesn't)

- **Applies** to any API where an omitted field takes a model-specific default:
  thinking and reasoning modes, sampling parameters, tokenizers, output caps
  sized in tokens. Also to a *secret* that overrides the model id at runtime —
  the guard reads the committed default, so a secret pointing at a model with a
  different default reintroduces the gap.
- **Does not apply** to fields the request already sends explicitly; those
  survive a model switch by construction.
- **Does not decide whether thinking should be on.** That is a product call —
  latency before the first word, output spend, answer style — and if it is
  made, `max_tokens` must rise in the same change.

## See also

- `docs/cpl_assistant_lessons.md` — the 2026-09-11 sections
- `[[methodology-an-error-inside-a-success-is-invisible-to-every-status-check]]`
  — the instrumentation that now names a blank turn's `stop_reason`
- `[[a-cache-breakpoint-must-lead-the-prompt]]` — the cache floor, the first
  model-keyed guard in the same file
