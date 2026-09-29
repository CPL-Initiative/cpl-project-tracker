---
title: Ask a model to translate, not to answer, when the answer is not in its corpus
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, sierra, retrieval, ui]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/ccr_universe.js
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/ccr_skyview_ask.test.js
---

# Ask a model to translate, not to answer, when the answer is not in its corpus

> **One-sentence summary** — When a surface has a question box over data the
> retrieval corpus does not contain, have the model turn the question into a
> query the surface can already run, and let the surface answer; a prose reply
> would be composed, fluently, from the wrong source.

## The case

SkyView's search box was to take questions "like Sierra handles" (Sam,
2026-09-09). The obvious build is to point it at `cpl-chat`, which already serves
six surfaces, and render the reply.

That build is wrong, and the reason is correctness rather than taste.
`cpl-chat` retrieves from the knowledge base. **The knowledge base does not
contain SkyView's payload** — 16,482 course identities, 33,423 stand-alone
courses, 159 disciplines. So *"which welding identities carry no
articulation?"* is a question retrieval **structurally cannot answer** — and a
prose surface answers it anyway, because that is what a language model does with
a question and a context. The failure is silent, confident, and indistinguishable
from a correct answer to a reader who cannot audit the corpus.

## The shape that works

Split the labor at the line where each side is actually strong:

- **The model does what only it can do**: read intent out of an English sentence
  and emit it in a fixed vocabulary. Here, a JSON selection in the token grammar
  the map already speaks — a discipline, a term, a course id, plus the switches.
- **The surface does what only it can do**: resolve those names against the live
  data, count, filter, and render. **The map answers by moving.**

The model is never asked for a fact about the data, so it is never in a position
to invent one.

## The three rules that make it safe

⭐ **Send the vocabulary; never accept a name outside it.** The envelope carries
all 159 discipline names with their counts, so a hallucinated discipline is
impossible rather than merely unlikely — and the client still resolves every name
against the payload before use.

⭐ **Report what does not resolve; never drop it.** A dropped name and an empty
result look identical on a map and mean opposite things. This is the same
argument the alias-chain rule makes about stored ids, in a different costume: a
bad key does not error, it quietly selects nothing.

⭐ **An ambiguous match resolves to nothing.** One forgiving pass is worth having
("Welding" for "Welding Technology"), but only when it is unique. Two candidates
means declining — picking the first is the surface claiming an answer it does not
have.

And one that follows from the shape: **a question that resolves to nothing must
leave the view exactly as it was.** Clearing the user's state punishes them for
asking.

## When this applies

Whenever a question box sits over data the answering service does not hold. The
test is one question: *could the model, from its corpus, be right about this?*
If no, the model's output must be a **query**, not an **answer** — and the
surface's own data is what gets to be right.

## Cost and caveats

⚠️ **The envelope is bigger than a chat message**, because the vocabulary rides
in it: 6,178 characters here against `cpl-chat`'s 6,000-character drafting cap,
so the surface needed its own. An over-cap envelope is truncated **silently**,
and the surviving prefix is still grammatical — there is no ragged edge to
notice.

⚠️ **Send the question, not the envelope, as the retrieval text.** Embedding the
contract searches the knowledge base for the contract, and the similarity score
comes back healthy while pointing nowhere near the subject.

⚠️ **Registering a new surface touches more places than the call site** — in this
repo, five, enforced by three test suites. An undeclared surface does not error;
it normalizes to null and takes the conversational cap.
