---
title: A cache breakpoint must LEAD the prompt, and what sits behind it must not move
created: 2026-08-23
updated: 2026-08-23
tags: [methodology, prompt-caching, cost, sierra, cpl-chat, anthropic-api, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/playbook-deploy-shared-supabase-edge-function]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_prompt_cache.test.js
---

# A cache breakpoint must LEAD the prompt, and what sits behind it must not move

> **One-sentence summary** — prompt caching is a *prefix* match on bytes, so it
> constrains prompt ORDER (the stable material has to come first) and it punishes
> "mostly stable" material harder than no caching at all.

## The two facts that decide the design

**1. It is a prefix match, so it dictates order.** Render order is
`tools` → `system` → `messages`, and any byte change invalidates everything after
it. A prompt that opens with volatile retrieval and closes with stable
instructions has **no cacheable prefix**, however much stable text it contains.

**2. There is a minimum, and falling under it fails silently.** Anthropic will
not cache a prefix below ~1024 tokens. It does not error — the request succeeds,
the answer is fine, and `cache_read_input_tokens` sits at zero for ever.

Together these mean: **you cannot add caching to an existing prompt without
looking at its order.** In `cpl-chat` the static preamble was 968 characters —
**242 tokens** — so a breakpoint after it would have been accepted and cached
nothing at all. The ~3,000 tokens of always-on rules that would have made it
cacheable were at the *end* of the prompt, after every retrieved source. Adding
caching therefore required moving them in front of the sources. That is a real
change to what the model reads first, and it should be named as one rather than
sold as a free optimization.

## "Mostly stable" is worse than not caching

A cache **write** costs about **1.25×** the normal input price; a **read** costs
about **0.1×**. So the arithmetic is a bet on the hit rate, and it can lose:

| Breakpoint sits on | Hit rate | Result |
|---|---|---|
| Bytes identical on every request | high | ~90% off that slice |
| Bytes that change with the request | ~0 | **a ~25% surcharge on that slice** |

The dangerous case is the second one, because **nothing about the answers looks
different**. In `cpl-chat` the tempting move was to cache the whole assembled
rule block — one line of code, ~5,900 tokens, obviously "the stable part". But
the block is gated by `appliesWhen` predicates, so a credential question and a
general question produce different bytes, and consecutive questions rarely share
a mode. Caching it would have quietly made every turn more expensive.

The fix was to partition the rules by whether their predicate is literally
`always`, and cache only that half — 2,992 tokens that are byte-identical on
every request regardless of what was asked.

## What to check before you place a breakpoint

1. **Measure the candidate prefix in tokens**, not in "feels big". Under ~1024 it
   is a no-op.
2. **Prove invariance by running the builder, not by reading it.** Generate the
   block across every input combination the code allows and assert the set of
   distinct outputs has size 1. A comment claiming stability is not evidence —
   `tests/sierra_prompt_cache.test.js` exercises all 16 context combinations.
3. **Hunt the silent invalidators**: a timestamp, a `Date.now()`, an unsorted
   `JSON.stringify` over a map, a per-request id, a tool list assembled in
   nondeterministic order, a config re-read that reformats.
4. **Log `cache_read_input_tokens` and `cache_creation_input_tokens`, and say so
   out loud when both are zero.** They arrive on `message_start`, *not* on
   `message_delta` — reading usage from the delta reports zero cache activity for
   ever and looks exactly like a broken cache.
5. **Confirm nothing was dropped in the reorder.** Moving content between blocks
   and deleting it look identical in a diff. Assert every interpolation the old
   single-string template carried still appears in one of the new blocks.

## What this does not fix

Caching cuts the price of *repeated* input. It does nothing for the volatile half
— in a retrieval assistant that is usually the larger half — and nothing for
output. It is the first lever because it is model-neutral: it changes the bill
without changing which model answers or what it is told. **A model downgrade is a
separate decision with a separate risk**, and it should be scored against a
behavioral suite rather than assumed to be "comparable".

## Provenance

Found 2026-08-23 (Session 185) when Sam — funding the Anthropic account
personally after the balance ran dry twice in two days — asked whether Sierra
could run on Haiku for cost. The measured answer was that the model swap is a 3×
cut on both directions, and that caching was the untried lever sitting in front
of it: `cache_control` appeared **zero times** in a 200 KB Edge Function carrying
~7,000 tokens of stable instruction per turn.
