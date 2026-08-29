---
title: Context pressure is measurable — the counter was on disk the whole time
created: 2026-08-29
updated: 2026-08-29
tags: [methodology, session-memory, checkpoint, tooling, observability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - kb/_context_budget.py
  - scripts/context-pressure-hook.sh
  - tests/context_budget_test.py
  - CLAUDE.md
related:
  - docs/kb-notes/methodology-freshness-tracks-conditionality-not-intent.md
  - docs/kb-notes/methodology-push-what-cannot-be-asked-for-pull-everything-else.md
  - docs/kb-notes/methodology-a-knowledge-base-needs-a-lint-pass.md
---

# Context pressure is measurable

## The failure

On 2026-08-29 a session auto-compacted at **786,077 tokens** with its last
checkpoint 150K tokens stale. Roughly 778,000 tokens of working context were
dropped. The only warning anyone got was the compaction itself.

Rule 9's trigger had said, for months:

> *"roughly every ~100K tokens… Claude Code doesn't expose an exact counter; use
> proxies"*

We had already flagged this as **a condition nothing can observe** — the same
defect that left `04-projects/` 41 days stale behind *"when the run worked inside
a project folder"*. What we had not noticed is that **its premise was simply
false.**

## The counter exists

Claude Code writes the exact live context size to the session transcript
(`~/.claude/projects/<slug>/<session-id>.jsonl`) on **every turn**:

```
message.usage = { input_tokens, cache_read_input_tokens,
                  cache_creation_input_tokens, output_tokens }
```

Their sum is the context size for that turn. And every compaction writes its own
receipt:

```json
{"subtype": "compact_boundary",
 "compactMetadata": {"trigger": "auto", "preTokens": 786077,
                     "postTokens": 7678, "cumulativeDroppedTokens": 778399}}
```

So the trigger never needed a proxy. It needed a **file read** — 51 ms, pure
stdlib, no API. `kb/_context_budget.py` does it and self-calibrates its ceiling
from whatever compactions the transcript has actually seen, rather than trusting
a constant that is model- and configuration-dependent.

**The transferable lesson: before writing "X is not observable" into a rule, go
look.** The claim had sat unchallenged long enough to become the justification
for a worse trigger. A false impossibility is more expensive than a hard problem,
because nobody re-opens it.

## Thresholds must be a sum of measured costs, not a round multiple

The unit of runway is **one checkpoint**, because a checkpoint is what the
warning exists to buy time for. From the same transcript:

| Quantity | Measured |
|---|---|
| Full Rule 9 checkpoint (13 artifacts) | **49,723** tokens |
| Per-turn growth, last 10 turns | median 9,715 · mean 14,803 · **max 50,425** |

The first draft set WARN at "2× checkpoint" = 100,000. That is wrong, and its own
test caught it by **336 tokens**: a heavy turn (50,425) plus a checkpoint
(49,723) is 100,148. The threshold did not fit the two things it existed to make
room for — you would be warned, spend one turn finishing your thought, and find
the runway gone.

So the thresholds are a **sum**:

- **WARN ≤ 110,000** — worst measured turn + full checkpoint + slack.
- **EMERGENCY ≤ 50,000** — one checkpoint and nothing else.

A round multiple *looks* principled. Only a sum of measured costs actually is.

## A measurement nothing calls is not a measurement

This is the failure mode this repo keeps meeting, and it would have applied here
too. `kb/_context_budget.py` is PULL — you have to know to run it, and a session
deep in a build has no reason to. So the meter is wired to a **PostToolUse hook**
(`scripts/context-pressure-hook.sh`), which fires on every tool call and speaks
with exit code 2 so the text actually reaches the session.

PostToolUse, not UserPromptSubmit, deliberately: the failure mode is a long
agentic run that burns 100K tokens without a single human turn. A per-prompt hook
would sleep straight through it.

Two properties keep it from becoming noise, both pinned by tests:

- **Announce-once per threshold**, keyed by session id, escalating warn →
  emergency. A hook that shouts on every tool call gets tuned out, which is its
  own kind of not-firing.
- **Fail soft, always.** Missing transcript, garbage stdin, absent `jq`, meter
  not found — every path exits 0. A broken meter must never block a session.

## The emergency checkpoint is a different list

At EMERGENCY there is room for one checkpoint and nothing else — and one heavy
turn has been measured at 50,425, so "one more thing first" can cost the entire
margin. The full 13-artifact list does not fit. The reduced list is:

1. `docs/session_<N+1>_handoff.md` — **stating that it was an emergency
   checkpoint and naming which artifacts were skipped**
2. the lane files this run actually moved
3. `cpl_memory` rows for durable learnings
4. commit + push

The naming clause is load-bearing. A partial checkpoint that does not admit it is
partial is worse than none: the next session reads a handoff that looks complete
and never finishes the job.

## Validation: replay the failure you actually had

The threshold was not accepted because it seemed sensible. It was replayed
against the real context values from the session that failed:

| Context | Remaining | Verdict |
|---|---|---|
| 633,409 | 152,668 | ok — Sam had just asked for a checkpoint, and it stays quiet |
| 683,834 | 102,243 | **WARN** — 10 human turns before compaction |
| 753,988 | 32,089 | **EMERGENCY** — 4 turns before |
| 780,941 | 5,136 | EMERGENCY |

Both halves matter. Firing late loses the session; firing right after a
legitimate checkpoint trains everyone to ignore it. `tests/context_budget_test.py`
pins both directions.

## Postscript

The EMERGENCY threshold first crosses at the exact turn where Sam typed:

> *"1. We hit 600k context and in the weeds on a build and haven't done a
> checkpoint yet — imagine you didn't know we are testing for a checkpoint
> prompt — what do you do?"*

He wrote the scenario about running out of context **while running out of
context**, and neither of us noticed, because nothing was watching. That is the
entire argument for the hook in one line.
