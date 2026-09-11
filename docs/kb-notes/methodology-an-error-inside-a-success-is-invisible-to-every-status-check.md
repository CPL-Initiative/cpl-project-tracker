---
title: An error that arrives inside a successful response is invisible to every status check
created: 2026-09-11
updated: 2026-09-11
tags: [methodology, observability, streaming, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - tests/sierra_stream_error.test.js
---

# An error that arrives inside a successful response is invisible to every status check

> **One-sentence summary** — when a failure is delivered as *data inside* a
> response that already returned 200, nothing that watches statuses, logs or
> exceptions will ever see it, and the caller receives a well-formed empty result
> that looks exactly like a correct one.

## Context

Sierra returned blank answers to 27% of requests for two hours and every
instrument said she was healthy: HTTP 200 on every call, a prompt-cache telemetry
line on every call, no exception, no error log. The only thing that noticed was a
CI check asserting on answer *content*, and its report said "empty answer" without
saying why. See `docs/cpl_assistant_lessons.md`.

## The claim

**A streaming protocol moves the failure boundary inside the success path.** The
status code is committed the moment headers are sent — before the work is done —
so everything after it must report failure *in band*, as an event. Any consumer
that branches on the events it knows and ignores the rest will treat a failure
event as silence.

The shape is specific and worth recognizing:

1. The response opens successfully and the status is now fixed at 200.
2. Early events arrive and are handled, so the usual telemetry fires and the call
   looks normal in every log.
3. A failure event arrives, matches no branch, and falls through into nothing.
4. The stream closes through its ordinary completion path.
5. The caller gets a well-formed, empty, successful result.

**The defect is not the failure. The defect is that step 3 is a silent default.**
An unhandled event type in a stream loop is not an edge case to tidy up later; it
is the one place where a failure can be delivered and discarded.

**Corollary: absence of output is a distinct outcome and must be reported as
one.** "Zero units of content produced" is not the same as "content produced that
happens to be empty", and no downstream consumer can tell them apart unless the
producer says which. A completion path that cannot distinguish them will report
both as success.

## How we got here

A red CI check on a diff that was comments only. The stream loop handled exactly
three event types; an upstream `{"type":"error",…}` matched none of them. Because
the first event had already fired the cache log, the edge log showed a normal
successful request. Two runs reproduced it with overlapping but non-identical
failing subsets, which ruled out content and pointed at an intermittent upstream.

The fix is not a cure — it does not stop the upstream failing. It makes the cause
recordable: handle the failure event and log it, capture the producer's own
terminal reason, and on zero content log that fact with all of it. Those separate
the three causes (upstream error, producer refusal, genuinely empty generation)
that had been collapsing into one indistinguishable blank.

⚠️ **The test for this was falsified against the pre-fix file before being
trusted** — 1 of 13 checks passed there, and the one that passed was a
precondition asserted on purpose. A guard written against code you just wrote
will pass on anything.

## When this applies (and when it doesn't)

**Applies** to anything where the result is delivered progressively and the status
precedes the work: SSE and streaming APIs, chunked responses, websockets,
long-running jobs that return a handle, batch pipelines that report per-item
outcomes inside a successful run. Also to any consumer loop with a bare
`default`/`else`/silent `catch` over a protocol someone else defines and can
extend.

**Does not apply** where the status genuinely follows the work — an ordinary
request/response that computes fully before replying. There a non-2xx is
sufficient, and adding in-band error reporting is redundant.

**The limit of the remedy:** logging makes a failure legible, not rarer. Deciding
*what to do* about it — retry, fall back, surface it to the user — is a separate
question, and this note does not answer it.

## Correction, later the same day

The Sierra case that motivated this note was **not** an upstream error. The
blank answers were adaptive thinking spending the 2,048-token output cap: on
Sonnet 5 a request that omits `thinking` runs adaptive thinking, thinking tokens
count against `max_tokens`, and the loop collects only text. See
`[[methodology-a-model-switch-carries-its-defaults-not-just-its-price]]`.

The claim above stands and the instrumentation stays. What caught this class in
the end was the corollary, not the error branch: **zero text frames is a
distinct outcome**, and the `EMPTY ANSWER` line now carries `stop_reason` and
`output_tokens`, which is exactly the pair that separates an upstream error
(no `stop_reason`) from thinking that ran out the cap (`max_tokens` at exactly
the cap) from a model that chose to say nothing (`end_turn`). Naming a cause
from the shape of the code, before reading what the failed turns recorded, is
the mistake this correction exists to remember.

## See also

- `[[docs/cpl_assistant_lessons]]` — the workstream that produced this
- PR `#1550` — the implementation and the measurements
- `[[docs/kb-notes/methodology-a-check-that-cannot-fail-reads-as-a-clean-result]]`
  — the same family: an instrument reporting green about nothing

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
