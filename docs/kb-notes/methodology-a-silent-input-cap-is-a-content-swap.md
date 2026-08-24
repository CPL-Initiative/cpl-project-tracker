---
title: A silent input cap is a content swap, and the model fills the vacuum with its own instructions
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, llm, prompting, cpl-chat, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - cpl_memory.js
  - tests/cpl_memory_autogen.test.js
---

# A silent input cap is a content swap, and the model fills the vacuum with its own instructions

> **One-sentence summary** — When a shared model endpoint truncates its input, a
> caller whose payload is *instructions + subject* can lose the subject entirely,
> and the model will answer confidently about the loudest thing left in its
> context, which is usually the system prompt.

## Context

The Memory tab's ✨ Autogenerate researches a typed topic and drafts a
`cpl_memory` row. Sam pasted an 870-character note about which kind of credit a
college should award — course credit first, then GE area, then elective — and got
back a polished entry titled *"Answer Structure for CPL Responses"*, about how
Sierra should separate colleges that have articulated a credential from colleges
that merely teach the subject. Correct English, right schema, wrong subject, no
error anywhere. PR #1320.

## The claim

### 1. A cap on a shared field is a per-caller contract, not a number

`cpl-chat` capped `query` at 1,000 characters. For a chat question — a sentence —
nobody ever felt it. The drafting caller's `query` was an *envelope* (the JSON
key list, the kind vocabulary, "reply with ONLY a single JSON object") **plus**
the curator's subject, and the envelope alone measured **984 of the 1,000**. The
subject arrived as the sixteen characters `When responding `.

Same field, same cap, two entirely different meanings. The cap has to be a
function of the caller, and the caller has to be named server-side — a client
that can widen its own cap has no cap.

### 2. The truncation is invisible because the survivor is still grammatical

Nothing threw. Nothing logged. The retrieval even reported a healthy **0.86**
similarity, because the envelope is itself full of CPL words, so the search
looked confident while pointing nowhere near the subject. A cap that lands
mid-sentence leaves no ragged edge to notice; it leaves a shorter sentence.

Contrast a cap that removes a *closing brace* — that fails loudly on the next
parse. Which half survives truncation decides whether the failure is loud.

### 3. Therefore: the SUBJECT leads, the INSTRUCTIONS follow

Order the payload so anything a cap ever eats is the recoverable half. With the
subject first, losing the tail costs the output contract, the parse fails, and
the user is told. With the subject last, losing the tail costs the subject, and
the user is told nothing at all.

### 4. An LLM handed no subject writes about its own instructions

This is the part worth internalizing. The model was not confused and did not
hallucinate: given `TOPIC: When responding` and ~9 KB of answer-shaping doctrine,
it wrote about the doctrine. The draft's own words —

> *"Blending the two bands sends students to counters where nobody is expecting
> them"*

— are `STATEWIDE_RULE`'s phrase, verbatim, out of the system prompt. **An empty
subject is not a null result; it is an invitation to answer about the context.**
So a surface that borrows a conversational model to draft text needs its own
governing block that (a) says this is not a conversation, (b) forbids
substituting a subject found in the retrieved material, and (c) *replaces* the
answer doctrine rather than listing exceptions to it — an instruction that says
"ignore rule 3" must be re-read every time rule 3 changes, and it will not be.

### 5. What we SEARCH on is not always what we SEND

Retrieval keyed on the whole `query`, so the vector search, college detection and
topic search all ran over the boilerplate: 99 extracted keywords, exactly **one**
of which belonged to the curator's note. Any caller whose message is envelope-
plus-payload needs a separate retrieval field. This is a seam, not a special
case — the moment a caller's prompt is not its subject, one field cannot serve
both jobs.

### 6. The check must read both files

A test that restates the cap passes happily while the real cap moves. The guard
that works reads `QUERY_CAP_DRAFTING` out of the edge function, builds the actual
envelope from the client, and measures one against the other. Same shape as
pinning a TypeScript vocabulary against its SQL `CHECK` constraint.

⚠️ And every such assertion must hard-depend on the value it measures. The first
cut derived its fixture from the client's declared budget; against a client that
declares none, the budget was `undefined`, the fixture built an **empty** topic,
and `indexOf("")` returned 0 — so three assertions passed vacuously against
exactly the code they existed to catch. See
[[docs/kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it]].

## How we got here

Measured rather than reasoned. Rebuilding the client's prompt in Node and slicing
it at 1,000 characters printed the exact string the model received, which is what
turned "the AI got it wrong" into a two-line arithmetic problem: envelope 984,
cap 1,000, topic 16. Lifting `extractTopicKeywords` out of the edge function and
running it on the same string printed the 99 boilerplate keywords. Grepping the
system prompt for the draft's own wording found `STATEWIDE_RULE` and closed the
loop on where the content came from.

None of that needed the live service, which the sandbox cannot reach anyway.

## When this applies (and when it doesn't)

Applies to any shared LLM endpoint with more than one kind of caller — a chat
widget and a drafting tool, a summarizer and an extractor. The tell is a single
input field carrying different *kinds* of content depending on who called.

Does **not** apply where every caller sends the same shape (one cap is then a
real cap), and it is not an argument for removing caps: the fix here raised the
limit for one named surface and left every conversational caller at 1,000.

It also does not generalize into "always put the payload first" for a chat
surface — there the question *is* the payload, and nothing else is competing for
the budget.

## See also

- PR `#1320` — the implementation (per-surface cap, `retrieval_query`, the
  drafting block, the cross-file budget test)
- `chatbox/supabase/functions/cpl-chat/index.ts` — `queryCapFor`, `DRAFTING_BLOCK`
- [[docs/kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it]]
- [[docs/kb-notes/methodology-commit-the-test-harness]]

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
