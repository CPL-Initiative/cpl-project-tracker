---
title: A lane file is a summary of a measurement, not the measurement
created: 2026-09-13
updated: 2026-09-13
tags: [methodology, documentation, measurement, implementation-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[consult-doctrine]]"
artifacts:
  - docs/reference/lanes/implementation-funding.md
  - scripts/funding_effective.js
  - kb/_docs_audit.py
---

# A lane file is a summary of a measurement, not the measurement

> **One-sentence summary** — This repo's rules already say *never read the config, call
> the accessors*; the gap they leave is that a **doc quoting a number is not a source for
> that number**, and a session reading a lane file top-to-bottom cannot tell a proposed
> value from a live one.

## Context

`CLAUDE.md` Rule 11 says, of the funding model: **NEVER READ THE CONFIG — CALL
`_effective()` / `_alloc()` / `_prios()`**, and `scripts/funding_effective.js` enforces it
at the tool level, refusing to run without a live config:

```
REFUSING: no config supplied.
  The baked defaults in cpl_funding_data.js are STALE BY DESIGN — the live
  model is the Supabase overlay.
```

Both guards point at the same failure: *don't take the model's numbers from a static
artifact*. Neither anticipated the variant that actually happened.

## What happened (2026-09-13, S260)

Asked to prototype a change to the funding tab, a session took the priority shares from
the lane file's own `NEEDS SAM ⓪` line — *"starting set Eligible 40% · Accepted 25% ·
Transcribed 35%"* — and published them in a design artifact for the decider.

The live config was **33 / 33 / 34**, with titles **Outreach · Completion · Awards** at
factor 0.5. The line in the lane was a **proposal that had never been applied**.

Sam caught it in one question: *"Did you read the values and metrics from config or the
live funding tab — they don't seem to line up to me."*

Reading the live config then produced two more corrections that no amount of re-reading
the lane could have:

- `pac`/`pac_u` were described as *"OMITTED since 2026-09-08"*. They had been back in the
  daily bake since 2026-09-10 — 24,777.95 units statewide across 110 college rows.
- Goal (C) was described as carrying three designated projects. The config carried four.

## The mechanism

A lane file is written by a session that **did** measure. It records the finding in prose.
Later sessions read that prose as state. Three things then go wrong on their own:

1. **A proposal and a live value look identical in prose.** "Starting set X" and "the
   shares are X" are one careless sentence apart, and the careless version is the one that
   survives compaction.
2. **The doc does not move when the system does.** The `pac_u` line was correct when
   written and false three days later. Nothing about reading it reveals which.
3. **Freshness is invisible.** A lane's `updated:` field says when someone edited the
   file, never when any particular claim inside it was last checked.

## The rule

**Before publishing a number, run the thing that produces it.** A doc may tell you a
number *exists* and what it *means* — that is what docs are for. It is never the source
for the number's *current value*.

Concretely, for anything a reader will act on:

| Kind of claim | Source |
|---|---|
| Dials, shares, factors, metrics | the live config, via `scripts/funding_effective.js --config <live.json>` |
| Per-college or statewide figures | the engine's accessors, never hand-arithmetic |
| Whether a feed is delivering | the artifact's own `as_of`, not a lane's note about it |
| What a rule *means* | the lane file or KB note — this is what they are good at |

## Corollary for the writer

When a lane file records something **not yet true** — a proposal, a recommendation, a
pending dial — mark it in the text, not just by section. `NEEDS SAM` as a heading was not
enough; the sentence inside it read like fact. Write *"proposed, never applied"* into the
sentence a future session will quote.

## Why the existing guards did not catch it

- `scripts/funding_effective.js` refuses baked defaults — but it was never invoked,
  because the session did not believe it needed a config dump to quote a share.
- `consult-doctrine` triggers on *"how many / % / measured / compared against the live
  set"* — a design prototype did not read as a measurement claim, though every number in
  it was one.
- `kb/_docs_audit.py` lints size, spelling, staleness of *handoffs* — nothing checks
  whether a claim inside a doc still matches the system.

The cheap repair is the habit, not a new lint: **if a number is going in front of someone,
it came from the system this session, or it does not go.**

## See also

- [`docs/reference/lanes/implementation-funding.md`](../reference/lanes/implementation-funding.md) — the `NEEDS SAM ⓪` line now states live-vs-proposed explicitly
- `cpl_memory` → `counselor-step-is-the-only-campus-measure-for-goal-c`
