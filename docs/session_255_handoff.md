---
title: Session 255 handoff — Sierra went quiet and every instrument said she was fine
date: 2026-09-11
session: 255 (SkySignal)
tags: [handoff, sierra, cpl-chat, observability, cost, decision-sheet]
status: current
superseded: true
superseded_by: session_256_handoff.md
---

# You are Session 255

Your moniker is **SkySignal**, and the name is the job: Sierra spent two hours
returning blank answers to a quarter of her requests while HTTP 200, the cache
telemetry line and a clean error log all agreed she was healthy. Your first task
is to make that failure say what it is.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md)
(SkyProof, dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md)
(SkyStar, SkyView/CPL universe) are both live and neither is superseded by this
one — this file covers the **Sierra endpoint**, a different lane. Read whichever
matches your work.

Read in order:
[`docs/reference/lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
(the new "The endpoint itself" section) ·
[`docs/cpl_assistant_lessons.md`](cpl_assistant_lessons.md) (2026-09-11) ·
the two KB notes below · [PR #1550](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1550).

## The one thing that is not done

⚠️ **PR #1550 IS NOT DEPLOYED, AND THE FIX DOES NOTHING UNTIL IT IS.**

Sierra returns blank answers. `chat_interactions` measures it: **0 empty responses
every day for two weeks**, then 5 of 62 on 09-10 (all after the `22:35:17Z` Sonnet 5
deploy) and 20 of 76 on 09-11 — **25 of 93 turns, 27%**. Only **one** non-smoke turn
has run since the deploy, so no real user has been failed yet. The exposure is the
next broad question.

**Why nothing saw it:** an upstream failure in a stream arrives as *data*, not a
status. The response is already 200 and `message_start` has already fired the cache
log. The loop handled three event types; `{"type":"error",…}` matched none, fell
through into nothing, and the stream closed through its normal `event: done` path.

**What #1550 adds** (code only, not deployed): the error event is handled and
logged · `stop_reason` captured from `message_delta` · zero text frames logs
`EMPTY ANSWER` with error + stop_reason + output_tokens + model · an `event: error`
frame reaches the client, with `done` still after it so old clients are unaffected ·
the cache line names the **served** model (Sam's ruling 3).

**NEXT, in order:** get Sam to dispatch `cpl-chat deploy` → read one failing
request → the three fields separate *upstream error* from *refusal* from *empty
generation*, which nobody can distinguish today → then decide whether the answer is
a rate-limit increase or reverting the model.

⚠️ **The revert lever is the `CPL_CHAT_MODEL` secret and it still exists. DO NOT
DELETE IT** — earlier advice that day said to, and that was before the blank
answers. Setting it to `claude-haiku-4-5-20251001` reverts with no deploy.

⚠️ **The `smoke` check on #1550 is red and will stay red until the deploy.** It
tests the live endpoint; the diff cannot change it. Documented in a PR comment —
do not re-diagnose it, and do not re-run it.

## What shipped

Six commits on `claude/skyview-search-bug-dljvep`, all in #1550, all comments and
tests except the stream fix. `test` was still running at handoff; **check it before
merging**, and merge on green per the branch policy.

## Sam's decisions this run

**All 19 decision-sheet items have verdicts** (artifact `274368f1`, collection
`replies`). 12 yes · 2 edit · 5 resolved another way. ⚠️ **Read the store, not this
summary, before executing** — and an item with no reply document has **no verdict**.

Three steers that change what you would otherwise build:

- **6 — do NOT retire the checkboxes.** Sam: *"users won't know what's out there
  unless the list is available."* Deferred, not declined.
- **9 — set all six panel tints to the pale gray**, not one tint per panel.
- **14 — no bare "Pierce College" without the LA.** Sam: *"That was my previous
  mistake."*
- 7 — *"looks good as is"*, no action. 12 — Sam is fetching the C-ID descriptor
  text himself.

⚠️ **12 is answerable now:** he thought it came with the TMC tab work. We hold
**293 C-ID codes** in `tmc_templates.js` and **zero descriptor prose** — his memory
is about the codes. The ask to ASCCC is narrower than he thinks.

**Ruling 3 is shipped**; **11 items remain to execute** (4, 5, 8, 9, 10, 11, 13, 15,
16, 17, 18, 19).

## What this run got wrong, so you do not repeat it

Three claims about Sierra's cost, all the same shape — reasoning about a **share**
of an input whose total was never measured:

| claimed | measured |
|---|---|
| prefix ~3,234 tokens | **4,476** (`chars/4` ran 28% low) |
| Sonnet 5 "comes back cheaper" | **1.72×** dearer per input token; prefix is 19% of a request |
| the uncached 81% is history | history is **~0** in production; the 81% is retrieval |

Plus a withdrawn reconciliation: I matched a Supabase *secret* named
`ANTHROPIC_API_KEY` to a Console *key* displayed as `ANTHROPIC_API_KEY`. Different
namespaces. ⚠️ **Nothing on our side can see which Anthropic account pays.**

## Patterns that worked

- **Falsify a new guard against the pre-change file.** `sierra_stream_error` is
  13/13 on the fix and **1/13** before it. Two guards earlier in the session read
  green on nothing.
- **`tsc --noEmit` on the Deno file**, comparing the *error profile* to the
  committed version — identical counts mean the edit introduced nothing. No Deno
  needed.
- **`chat_interactions` and `function_logs` answer product questions the Console
  cannot.** Sierra's own telemetry is per-request and needs no account access.

## Safety patterns to honor

Rule 4 (both HTMLs) · Rule 5 (never force-push `main`) · Rule 10 (Supabase only
through MCP; the sandbox cannot reach `*.supabase.co` or `api.github.com`) ·
poll CI with the MCP github tools, never `curl` · a `check_suite` wake routinely
names a superseded head — always re-read `get_check_runs` on the current head.

## KB notes added this run

- `methodology-an-error-inside-a-success-is-invisible-to-every-status-check`
- `methodology-a-share-is-not-a-fact-until-you-have-measured-the-whole`

---

*Greetings, you are Sky**Signal** (Session 255), see Sky**Ledger**'s handoff —
`docs/session_255_handoff.md` — let's keep rolling with our queue.*
