---
title: Session 256 handoff — Sierra is answering again, and the cause was a default
date: 2026-09-11
session: 256 (SkyPulse)
tags: [handoff, sierra, cpl-chat, model-choice, thinking, observability]
status: current
superseded: true
superseded_by: session_257_handoff.md
---

# You are Session 256

Your moniker is **SkyPulse**. The name is the job: Sierra is back, and what is
left on her lane is reading her pulse — the cap-hit count after the deploy, the
probe's cadence, and one decision that is Sam's.

⚠️ **PARALLEL LANES.** [`docs/session_253_handoff.md`](session_253_handoff.md)
(SkyProof, dark mode) and [`docs/session_254_handoff.md`](session_254_handoff.md)
(SkyStar, SkyView / the CPL universe) are still live for their lanes; this file
supersedes only [`docs/session_255_handoff.md`](session_255_handoff.md) (the
Sierra endpoint). Read whichever matches your work.

Read in order:
[`docs/reference/lanes/sierra-retrieval-corpus.md`](reference/lanes/sierra-retrieval-corpus.md)
("The endpoint itself") ·
[`docs/cpl_assistant_lessons.md`](cpl_assistant_lessons.md) (the two 2026-09-11 sections) ·
[`methodology-a-model-switch-carries-its-defaults-not-just-its-price`](kb-notes/methodology-a-model-switch-carries-its-defaults-not-just-its-price.md) ·
[PR #1551](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1551).

## What shipped

- **#1550** (`675c9cc`, merged this run) — the previous session's observability:
  the stream loop handles an upstream `error` event, `stop_reason` is captured,
  zero text frames logs `EMPTY ANSWER` and sends the client an `event: error`
  frame before `done`, the cache line names the SERVED model (Sam's ruling 3).
- **#1551** — **the fix.** `thinking: { type: "disabled" }` in the Anthropic
  request body. On Sonnet 5 a request that omits `thinking` runs adaptive
  thinking, thinking tokens count against `max_tokens`, and the loop collects
  only text — so on a broad question the model spent the whole 2,048-token
  budget before the first word. `MAX_TOKENS` stays 2048. The guard
  (`tests/sierra_model_choice.test.js` block 5) keys the thinking default to the
  model id and fails closed on an unknown one; 20/20 after, 18/20 before.
- **Deployed:** v64 by `cpl-chat deploy` run 41 at 02:03:41Z, byte-identical to `main` (sha256 `0624be54…`), `verify_jwt` false; health probe green at 02:04:49Z.
- **Verified:** 54 turns in the first six minutes on v64: **0 blanks, 0 cap hits** (the two blanks at 02:04 were v63 instances during rollover, cache lines with no `model=` field); the NCCER question that blanked on v63 answered twice on v64 (4,148 and 3,733 chars); output per 4 chars of answer **1.91 → 1.46**, the residual being the tokenizer (Sonnet 4.6 measured 1.14). One 500 at 02:04:23 from Supabase's embedding runtime (`Failed to load model because protobuf parsing failed`) on a cold v64 isolate, not repeated — watch for it. Smoke runs against v64: **169 passed 22/22**; 170 failed only mode 15c, on the assertion — Sierra wrote *"that's different from saying it has awarded 'zero'"*, the correct refusal of a false zero, and the regex matched the negation; 168 started before the deploy and failed on v63 blanks.

## The one thing to carry forward

⭐ **A model switch carries its defaults with it.** Every guard on the switch
pinned a property that was written down — price, context window, cache floor —
and each held. A default is an absence, and nothing checked an absence. Two
sessions named two causes from the shape of the code before reading what the
failed turns had recorded; the vendor's migration guide for the exact pair of
models named the cause in one sentence. Read that guide BEFORE the next switch,
and send every model-dependent field explicitly.

## Sam's decisions this run

From the decision sheet [Two Calls on Sierra](https://claude.ai/code/artifact/79ef62e3-5034-425f-a657-0973f0a92171) (`docs/visuals/2026-09-11-two-calls-on-sierra.html`), replies read from its store:

1. **Reasoning stays off** — verdict Yes: *"Let's keep it off but test for better
   options if they exist. Currently, it's giving fantastic answers!"* Any trial of
   adaptive thinking runs on the preview slug first (`cpl-chat-preview-ab.yml`).
2. **The answer stop is 8,192 tokens** — verdict 8,192 over the proposed 3,072:
   *"Let's make it high for now so folks playing around with it always get a
   complete answer."* `MAX_TOKENS` moved 2,048 → 8,192; a ceiling, not a spend.
   Shipped in #1555 (merged 16:45Z). Deployed as v65 (run 42, 16:41:58Z, from main 05f2b06d); smoke 176 passed 22/22 and health 110 passed on it.
3. **Sierra's page on a phone** — *"the current mobile view is mostly consumed by
   the header text… consolidate all this text to hover overs in the header… and
   fix the ghosted mountain logo so the peak fits."* Shipped as the About Sierra
   control (hover for a mouse, tap or Enter for everyone), the peak unclipped, one
   header row on any phone. Measured at 390×844: the conversation now starts 163px
   down (19%) against 540px (64%) before.
4. **A floating Sierra bubble on every COBI tab** — asked for advice, not built;
   the advice and the open call are in the To-Do feed.
5. **Don't lock a session into a long wait** — Sam, on the CI polling loop:
   *"I really don't like how you can get locked in a long process (30-60 mins or
   more) without a way to interrupt and get you a note--escape doesn't work when
   you're locked in on something."* Now a PUSH bullet in `CLAUDE.md` (Working
   with the MAP team) and a `cpl_memory` decision row: end the turn when the
   next step waits on anything external; one batch of calls per turn while a
   wait is in play; a scheduled wake or the PR webhook brings the session back.
6. **The context meter travels with the repo** — *"make it so"* to the one-line
   fix: the Rule 9a `PostToolUse` hook now lives in `.claude/settings.json`,
   guarded by `tests/context_budget_test.py` (7a–c). Why: this session compacted
   at 785,955 tokens with the meter never having run — its only install was per
   machine, and a remote container is never that machine — while Rule 9's
   commit-count proxy read zero because the handoff had just been touched inside
   a PR and the context had gone to reading and polling (58 PR check reads,
   136,000 tokens). Detail: `docs/reference/context_pressure_hook.md` and the
   correction on `methodology-context-pressure-is-measurable`.

## NEEDS SAM

1. Decided — see above. What remains from the sheet is the follow-up: run the sixteen-row register sweep once on Sonnet 5, and an A/B of reasoning on the preview slug only if a gap appears.
2. Carried from 255: the `sierra_guidance` CHECK constraint lacks `skyview-ask`;
   eleven decision-sheet items settled and waiting to be built (4, 5, 8, 9, 10,
   11, 13, 15, 16, 17, 18, 19 — ruling 3 shipped in #1550).

## Queue

- **Read the cap-hit count** in `chat_interactions` a day after the deploy with
  thinking off. The tokenizer counts ~30% more tokens for the same text, so
  2,048 output tokens hold about 6,000 characters now, not 8,000; if real
  answers are being cut short, raise `MAX_TOKENS` — a measured change, not a
  guess.
- ✅ **Smoke modes 15a and 15c matched Sierra's own correct negations** (*"not a failure to act"*, *"I can't say they've awarded zero"*) — fixed in #1555 by stripping the negated clause before the match (`answer_must_not_match_unnegated`). 16a's roster-lookup rewrite is still the open one.
- **The health probe cannot see this outage class.** It asks one simple question
  and passed straight through two hours of blanks on broad questions. Decide
  whether a second, broader question is worth one more model call per run.
- **Raise the probe to hourly** — `cpl-chat-health.yml`'s own header says to
  once billing moved to the corporate account, which it did on 09-10.
- Carried: `Counselor_Verified` back into the daily fetch; 51 guessed column
  offsets in `excel_to_dashboard.py`; the SkyView ⑩/⑪ queues (S254).

## Patterns that worked

- **Read the vendor's migration notes for the exact model pair** before
  diagnosing from the shape of the code. One sentence in Anthropic's Sonnet 5
  guide explained all four numbers the file already held.
- **Key a behavior guard to the model id and fail closed**, the same shape as
  the cache floor. A permissive default is how the last guard stayed green.
- **Falsify the guard against the pre-change file** — 18/20 before, both reds
  naming the defect — before trusting its green.
- **Stack on the observability PR and merge it first.** #1550's `stop_reason`
  and `EMPTY ANSWER` line shipped in the same deploy as the fix, so the first
  blank turn after it — if there is one — will say why.

## Safety patterns to honor

Rule 4 · Rule 5 (never force-push `main`) · Rule 10 (Supabase only through
MCP; the sandbox cannot reach `*.supabase.co` or `api.github.com`) · the `test`
check green on the current head before every merge · `cpl-chat deploy` is a
production dispatch (confirm `DEPLOY`) and the shared function serves every
Sierra surface at once · MAP read-only · the public KB untouched.

## KB notes added this run

- `methodology-a-model-switch-carries-its-defaults-not-just-its-price`
- `methodology-an-error-inside-a-success-is-invisible-to-every-status-check`
  gained a correction section (the case that motivated it was not an error).

---

*Greetings, you are Sky**Pulse** (Session 256), see Sky**Signal**'s handoff —
`docs/session_256_handoff.md` — let's keep rolling with our queue.*
