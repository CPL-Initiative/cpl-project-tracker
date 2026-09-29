---
title: A client cannot see the cap the server enforces, so a two-half feature fails in the half that deployed
created: 2026-08-25
updated: 2026-08-25
tags: [methodology, cpl-chat, deploy, llm, prompting, testing, gr]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-silent-input-cap-is-a-content-swap]]"
  - "[[docs/kb-notes/methodology-name-the-credential-that-actually-failed]]"
  - "[[docs/gr_register_lessons]]"
artifacts:
  - gr_priorities.js
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/gr_deep_analysis.test.js
---

# A client cannot see the cap the server enforces, so a two-half feature fails in the half that deployed

> **One-sentence summary** — When a browser file and an Edge Function ship on
> different rails, the window between them is not "the feature is off"; it is
> "the feature is on and silently wrong", because the client validates against
> the limit *its own repo declares* rather than the one the running server
> applies.

## Context

`cpl-chat` caps the `query` field per surface: a conversational caller gets
1,000 characters, a drafting caller gets several thousand. A caller opts into
the larger cap by **naming itself** — the surface string is validated
server-side against `KNOWN_SURFACES`, and anything unrecognized normalizes to
`null` and takes the conversational cap.

That gate is correct, and it is also the trap. `gr_priorities.js` is a static
file that ships with GitHub Pages the moment its PR merges. The Edge Function
ships only when `cpl-chat-deploy.yml` is dispatched. Between those two events
the client sends a surface the server has never heard of.

## The claim

**A client-side budget check cannot detect a server that has not been deployed
yet.** The client compares its envelope against the constant in its own
repository. The server applies the constant in the *deployed* bundle. During
the deploy window those two numbers differ by an order of magnitude, and the
client's check passes while the request is being cut to a tenth of its length.

Three consequences follow, and only the third is obvious in advance:

1. **The truncation is silent and grammatical.** The surviving prefix is still
   a well-formed request. Nothing errors and nothing logs.
2. **What gets eaten is whatever you put last.** If the envelope is
   *subject → instructions*, the instructions vanish and the model answers in
   its default voice about a real subject. If it is *instructions → subject*,
   the subject vanishes and the model answers confidently about nothing.
3. **CI cannot see it either**, because the smoke workflow tests the *deployed*
   function. A merged-but-undeployed change looks green to everything.

### The three defenses, in order of how much they buy

- **Put the subject FIRST.** This is the only structural fix. It does not
  prevent truncation; it decides *what truncation destroys*, and losing the
  instructions fails loudly (no JSON came back) while losing the subject fails
  invisibly (confident prose about the wrong thing).
- **Make the failure name the deploy.** A non-JSON reply to a JSON-contract
  request has one overwhelmingly likely cause during this window. Reporting
  *"the analysis did not come back as JSON"* sends a curator to argue with the
  model; reporting *"the Edge Function may not know this surface yet — dispatch
  `cpl-chat-deploy.yml`"* sends them to the fix. Same failure, different
  diagnosis, and the diagnosis is the deliverable.
- **Pin the client's budget to the server's constant in a test.** The test reads
  the number out of the function's source rather than restating it, and builds
  the envelope from the longest *real* record. This catches drift in the repo.
  It does **not** catch the deploy window — nothing in CI can.

## How we got here

Session 195 built a drafting surface for the GR register whose envelope measures
5,564 characters on the longest live row. That fit the existing drafting cap
(6,000) with 436 characters to spare — so the obvious move was to reuse it. It
was the wrong move twice over: the register is edited live, so a curator
rewriting one Approach field would silently cross the line; and the number that
would actually be applied on merge day was **1,000**, not 6,000, because the
function had not been deployed.

The prior instance is `a-silent-input-cap-is-a-content-swap`: the Memory tab's
Autogenerate envelope measured 984 characters against a 1,000-character cap and
an 870-character note reached the model as the sixteen characters
`"When responding "`. That note fixed the cap. This one is about the *window*,
which the cap fix does not close.

## What this changes

- A surface-declaring client ships with the failure diagnosis already written,
  not added after someone hits it.
- The deploy order is part of the change, not a follow-up: **merge the client →
  dispatch the function → confirm with the smoke workflow → only then tell
  anyone it works.**
- Before proposing a deploy, diff the deployed bundle against `HEAD`. If they
  are byte-identical, the deploy ships only your change and you can say so with
  a hash instead of a hope. If they are not, the deploy carries somebody else's
  unshipped work and that is the thing to raise first.

## Limits

This is specific to a caller that opts into behavior by naming itself to a
shared server. A client that sends the same request regardless of deployment
does not have this window. The mitigation is also not a fix — the feature really
is broken until the dispatch runs; the point is that it says so instead of
answering.
