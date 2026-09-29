---
title: A conversation is scoped state — what you send must never exceed what you show
created: 2026-08-22
updated: 2026-08-22
tags: [methodology, sierra, cpl-assistant, my-college, state, retrieval]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-a-guidance-rule-must-name-the-fact-it-depends-on]]"
artifacts:
  - cpl_chat.js
  - college_briefing.js
  - tests/my_college_scope_thread.test.js
---

# A conversation is scoped state — what you send must never exceed what you show

> **One-sentence summary** — An assistant's conversation history is state scoped
> to a subject; when the host page changes subject and the transcript is wiped
> by the re-render, a module-level history silently keeps steering answers about
> the institution the reader navigated away from.

## Context

Sam, 2026-08-22, on the My College tab with **Los Angeles Community College
District** selected: *"she configured her response based on RCCD."* The answer
named Riverside City College, Moreno Valley and Norco, quoted Norco's exhibits
and Moreno Valley's figures, and did it under a heading that read *Welcome, Los
Angeles Community College District*. Story:
[`docs/college_action_page_lessons.md`](../college_action_page_lessons.md).

## The claim

### Two individually correct decisions can compose into a defect

`convo` is module-level in `cpl_chat.js` **on purpose** — the comment above
`mountInto()` says so: *"the thread follows you between the two places"*, meaning
the CPL Assistant tab and the My College box. Correct.

`college_briefing.js`'s `finish()` does `root.innerHTML = h` on every scope
change. That destroys the mount node, so `mountInto()` rebuilds and **the visible
log starts empty**. Also correct.

Neither is wrong. Together they mean that after switching district, the reader
sees a clean conversation and the next question still ships eight turns about the
previous one. **Neither author could have seen it in their own file.**

### The invariant is a comparison, not a rule about clearing

> **What is SENT is never more than what is SHOWN.**

That single sentence decides every case correctly, including the two a
"clear the history on scope change" rule gets wrong:

- Moving to a pane with **no** selected subject (the generic assistant tab)
  clears the *anchor* but keeps the *thread* — the transcript is still on
  screen there, so sending it is honest.
- Coming **back** to the same subject keeps the thread too, which is why the
  code tracks *the last named subject the thread was formed under* rather than
  the previous anchor. Tracking the previous anchor reads a
  tab round-trip as two changes of subject and deletes a live conversation.

### Stale history does not tint the answer — it SOURCES it

The dangerous half is not that the model reads old turns. `cpl-chat` folds prior
user turns into the **retrieval text** when the current question has fewer than
two topic words of its own (`isRefinement`), and that folded string is what
`detectAndFetchCollegeProfile()` and `searchExhibitsByTopic()` are handed. So a
short follow-up **re-detects the previous college out of history** — `riverside`
is in `COLLEGE_ALIASES` — and the entire answer is rebuilt on its data.

A stale thread is therefore not a tone problem to be papered over with a prompt
instruction. It changes which rows are fetched.

### A defect whose every symptom is invisible needs a test on the PAYLOAD

The transcript looked right. The heading looked right. The only place the defect
existed was the request body. Any check that read the rendered log would have
passed against the broken build, which is why
`tests/my_college_scope_thread.test.js` asserts on a `_thread()` seam that
reports what would be sent.

## How we got here

Traced by elimination, not by guessing:

1. `resolveDistrict()` was **deployed** (checked the live function source through
   the Supabase MCP, not the repo) and its own suite was 28/28.
2. All nine LACCD colleges have a `chatbox_college_profiles` row — measured.
3. The district chip's question resolves LACCD correctly: its topic search
   returns 3 rows at Santa Ana, so the ambiguity-narrowing block does not fire
   and the roster survives. The district path was sound.
4. Which left the only carrier of "LACCD is selected" — the question text — and
   the only other institution in evidence: the previous scope's thread.

`window.CPL_CHAT` exposed `mountInto`, `prefill`, `ask` and `setSuggestions` and
**no way at all to say whose page this is**.

## Consequences / how to apply it

- Any module-level state in a widget that can be embedded by a host is scoped to
  something. Name what, and decide what invalidates it.
- When a host re-render silently resets one half of a paired state, the paired
  half is a bug waiting for a witness. Look for the pair.
- Before assuming a retrieval defect is a prompt problem, check whether stale
  input reaches the **retrieval** layer. Here it did.
- Clearing a transcript means removing what the turns created (`.cplchat-msg`,
  `.cplchat-fb`), not `innerHTML = ''` — the suggested-questions row lives
  *inside* the log, and wiping it detached `chipsEl` and cost the assistant every
  starter question. Caught by `my_college_sierra_box.test.js`, not by the new one.

## Open questions

- The generic CPL Assistant pane keeps a thread formed under a My College
  subject. That is consistent with the invariant (the transcript is visible
  there), but nobody has watched a reader do it.
