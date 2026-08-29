---
title: Testing a rule without cueing the answer
created: 2026-08-29
updated: 2026-08-29
tags: [methodology, doctrine, testing, session-memory, evaluation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - docs/kb-notes/methodology-context-pressure-is-measurable.md
  - docs/kb-notes/methodology-freshness-tracks-conditionality-not-intent.md
  - docs/kb-notes/methodology-the-instrument-may-not-live-inside-the-system-under-test.md
artifacts:
  - docs/scenarios/README.md
  - kb/_doctrine_scenarios.py
---

# Testing a rule without cueing the answer

## The problem

We kept asking *"do our rules actually fire?"* and answering it from inside a
session that already knew the answer. Sam named it twice, and the second time
precisely:

> *"you're operating off some rich context right now that I don't know how you
> can temporarily forget to test as if you were a fresh session"*

> *"Can your handoff set up the next session to check our scenarios against rules
> only rather than cueing up the next session with cheater context?"*

A session that has read the handoff knows what the handoff wanted it to do. Its
success proves the handoff works, not the rules.

## The fix is not a thinner handoff

The obvious move — write a sparser handoff so the next session is less primed —
trades away the thing that works to measure the thing that might not. A handoff
exists to make the next session productive. Degrading it is a real cost paid for
a test result.

**Split the roles instead.**

| Role | Gets | Job |
|---|---|---|
| **Experimenter** | the full rich handoff, all context | spawns probes, scores them, fixes what fails |
| **Probe** | the auto-loaded doctrine file plus one realistic task prompt | just does the task |

⭐ **The always-loaded file is the honest control condition.** It is what a session
gets **for free**, before anyone hands it anything. So "rules only" is not
context-starvation — it is exactly the question worth asking: *does the
always-loaded layer steer correctly on its own?*

## Four rules for a probe that measures anything

1. **Disguise the scenario.** Never *"you are being tested on whether you
   checkpoint."* Say *"You are Session 208, start on the X tab."* A verbatim
   scenario cues its own answer and measures reading comprehension.
2. **One probe, one scenario.** A probe asked six things learns from the first.
3. **Rubric first, and committed.** Write the pass criteria and commit them
   *before* the probe runs. This is the real guard against a contaminated scorer:
   without it, whatever the probe does becomes what you expected.
4. **Score the trace, not the vibe.** Every criterion is something that either
   appears in the transcript or does not.

## Evidence is asymmetric — say so out loud

- A **pass is weak evidence.** A capable session can reach good behavior without
  the rule, so a pass cannot separate *"the rule fired"* from *"it would have
  done that anyway."*
- A **fail is strong evidence.** The rule was loaded, the situation called for it,
  and it still did not fire.

⚠️ **Therefore probes report HOLES, not a coverage score.** "5 of 6 passed" is not
a coverage number and writing it as one manufactures false confidence.

## Record what cannot be probed, instead of counting it as passing

Some rules are properties of a *late* session, and a probe is by definition early
— context pressure at 600K is the clean example: a fresh session has none. Those
either get a mechanical guard instead, or get staged (put the repo in the state
that fires the trigger, then run a short ordinary task).

**A scenario nobody can run is not a passing scenario. It is an unmeasured one**,
and the distinction disappears the moment you write it as a fraction.

## Also: state your predictions before you look

The rubric carries the author's advance expectations, marked explicitly as **not
criteria**. Being wrong about them costs nothing, and it makes a surprise legible
*as* a surprise rather than something quietly absorbed into the write-up. It also
sets a tripwire: if a scenario the author expected to fail comes back clean, the
first hypothesis is **prompt leakage**, not doctrine strength.

## ⚠️ Update, 2026-08-29 (Session 208) — the protocol was void on first run

This note described the design correctly and it was still not testable, because
of something the design did not treat as part of itself: **the rubric and all
five probe prompts were committed to the repository the probes clone.**

The control condition was defined as "`CLAUDE.md`, which auto-loads anyway, plus
the repo" — and the repo held a 109-line document naming every criterion, plus
the advance predictions. For probe P5 the topic phrase `comprehensive-vs-carve-out`
matched **exactly one file in the whole repository, its own prompt**. The probe
searched for what it had been handed, found the test, and void-flagged itself.

The warning in handoff 207 — *"the likeliest explanation is prompt leakage; re-read
the probe prompt for a cue"* — looked in the right spirit and the wrong place.
**The instrument may not live inside the system under test**; the instruments now
live in the vault, and `probe_instrument_leak` fails if they come back. See
[`methodology-the-instrument-may-not-live-inside-the-system-under-test`](methodology-the-instrument-may-not-live-inside-the-system-under-test.md).

Two further mechanics, both measured rather than reasoned:

- A session spawned with **no repo** has no `CLAUDE.md` and is a blank session,
  not a control. Attach the source explicitly.
- A spawned session's **transcript is not readable** from another session, so
  P3's criterion (the order of the first six tool calls) is **unmeasured**, not
  passed.
