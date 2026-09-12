---
title: Verify a queue item against the code before it reaches the decider
created: 2026-09-12
updated: 2026-09-12
tags: [methodology, governance, sierra, checkpoint]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - docs/reference/lanes/sierra-retrieval-corpus.md
  - kb/cpl_todos.json
  - chatbox/supabase/functions/cpl-chat/index.ts
---

# Verify a queue item against the code before it reaches the decider

> **One-sentence summary** — A lane or handoff line that says "not built, blocked
> on a go" is one session's reading of the code on one day; re-derive it from
> the code the day it becomes a question to the decider, because the decider
> cannot tell a stale question from a live one and will answer it anyway.

## Context

On 2026-09-12 Sam answered three open questions by number. The third, as the
handoff and the memory row recorded it, was *"build the Sierra `surface`
field"*. The first grep of the next session found the field already shipped on
2026-08-22 as v56 — `KNOWN_SURFACES` on the request, `sierra_guidance.surface`
with its CHECK constraint, the Training-tab picker, two guard suites, and two
live rules already scoped to the My College tab. The lane file had carried
*"RECOMMENDED, NOT BUILT … blocked on Sam's go"* for three weeks after that.
Story: [`cpl_assistant_lessons`](../cpl_assistant_lessons.md) (2026-09-12).

## The claim

Three stores describe the same fact at different ages: the code (now), the lane
file (when someone last wrote it), and the queue item (when someone last read
the lane file). A session that builds from the queue item inherits both delays.
A session that puts the queue item to the decider exports both delays to a
person who has no way to check.

So the rule is narrow and mechanical: **before a queue item goes into a decision
sheet, a NEEDS SAM list, or a "say yes or no" message, grep the code for the
thing it claims is missing.** One command. If the thing exists, the question
changes or disappears; if it does not, the grep is the citation the item was
missing anyway.

The cost of skipping it is not the wasted question. It is what happens after
the answer: the ruling gets recorded against the wrong object (here, four
artifacts said "surface field"), the next session either builds a duplicate or
spends its opening on archaeology to recover what was actually asked, and the
decider's "yes" is now attached to something they did not rule on.

## How we got here

The question Sam actually read was on the To-Do feed and asked something else:
*"Say whether to build the Sierra scope flag … whether Sierra may read
non-public data has to be decided by the server from your sign-in, not claimed
by the page."* His "Yes" is a ruling on that flag, which was unbuilt. The
checkpoint that carried the ruling relabeled it with the lane's stale headline,
and the label propagated to the handoff, the lane, the To-Do and `cpl_memory`
in one commit. Recovery took the pre-ruling handoff, the pre-ruling To-Do, the
lane's git history and the live table — about an hour of a session that was
greeted with "let's keep rolling".

The same session's own "patterns that worked" list included *"check the repo
before proposing"*. The pattern was known; it fired for proposals and not for
questions. This note is the extension: **a question to the decider is a
proposal with higher stakes**, so the same check applies and applies first.

## When this applies (and when it doesn't)

**Applies** to any item whose premise is a claim about the code or the data —
"X is not built", "Y has no consumer", "the constraint lacks Z", "no caller
sends W". These have a referent that one grep or one query settles. It applies
with extra force to items that have been carried across sessions, because each
carry is a chance for the premise to have changed.

**Does not apply** to pure judgment calls with no code referent — a naming
choice, a designation only the decider can make, a vocabulary ruling. There is
nothing to grep. It also does not replace reading the memory table first (Rule
8); it is the code-side half of the same discipline.

## See also

- [`cpl_assistant_lessons`](../cpl_assistant_lessons.md) — the session that found it
- [`methodology-verify-an-ask-against-what-the-reader-sees`](methodology-verify-an-ask-against-what-the-reader-sees.md) — the screen-side sibling
- [`methodology-a-guard-that-supplies-its-own-input-tests-only-half`](methodology-a-guard-that-supplies-its-own-input-tests-only-half.md) — the test-side sibling: let the system supply the input
- [`lanes/sierra-retrieval-corpus`](../reference/lanes/sierra-retrieval-corpus.md) — lane state, corrected

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
