---
title: The instrument may not live inside the system under test
created: 2026-08-29
updated: 2026-08-29
tags: [methodology, doctrine, testing, evaluation, session-memory]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - docs/kb-notes/methodology-testing-a-rule-without-cueing-the-answer.md
  - docs/scenarios/README.md
artifacts:
  - kb/_docs_audit.py
  - kb/_doctrine_scenarios.py
  - docs/scenarios/README.md
---

# The instrument may not live inside the system under test

> **A test whose answer key is stored inside the thing being tested is not a
> test.** Where a protocol is kept is part of the protocol.

## Context

Session 206 built a probe protocol to answer *"do our always-loaded rules
actually fire?"* — spawn a fresh session, give it `CLAUDE.md` and one realistic
task, score the trace against a rubric committed **before** any probe ran. The
design was careful: disguise the scenario, one probe per session, rubric first,
score the trace not the vibe.

It was still void on first run, for a reason no line of the protocol addressed.

## The claim

The rubric and all five probe prompts were committed to `cpl-project-tracker` —
**the repository a probe session clones.** The control condition was defined as
"`CLAUDE.md`, which auto-loads anyway, plus the repo." That repo contained a
109-line document naming every criterion the probe was about to be scored on,
plus the scorer's advance predictions.

And the leak is not a hypothetical requiring an adversarial probe. **A probe's
most natural first action is to search for the topic it was just handed.** For
probe P5 the phrase `comprehensive-vs-carve-out` matched **exactly one file in
the entire repository — its own probe prompt** — and nothing else. The single
most obvious first move landed on the document describing the test.

P5 found it, recognized it was inside an experiment, and void-flagged its own
result before doing the task it was given.

## Why the previous session's guard did not help

Handoff 207 explicitly warned about leakage:

> *"If P3 or P4 come back clean, the likeliest explanation is **prompt leakage**,
> not doctrine strength — re-read the probe prompt for a cue before believing
> it."*

Correct instinct, wrong location. It searched the **prompt** for the cue. The cue
was in the **repository**, which the protocol had classified as the neutral
control rather than as part of the apparatus.

That is the generalizable error: **the environment was treated as background
rather than as an input.** Anything the subject can read is an input, whether or
not you handed it over.

## What to do

1. **Store the instrument outside the system under test.** The rubric and prompts
   moved to the private vault (`CPLBrain/04-projects/cpl-initiative/doctrine-probes/`),
   which probe sessions do not clone. The experimenter learns the location from
   the handoff — a channel the probe never receives.
2. **Keep the method where it is useful.** `docs/scenarios/README.md` stays in
   the tracker: it explains *why* probes work and names no criterion.
3. **Guard the repair, not just the state.** The natural fix for "the docs
   reference a file that isn't here" is to put the file back, which silently
   re-breaks every future probe. `probe_instrument_leak` in `kb/_docs_audit.py`
   fails if a rubric or prompt reappears.

## Beyond probes

The same shape recurs wherever a check and its subject share a store:

- A **benchmark** committed beside the code it grades.
- An **eval fixture** an agent can read while being evaluated on it.
- A **rubric** in a repo an autonomous reviewer has checked out.
- The narrower cousin already recorded here: a **guard keyed to a file path**
  stops guarding when content moves — same failure to notice that the *location*
  carries meaning.

Ask, before running any evaluation: **what can the subject read that I did not
intend to hand it?**

## Corollaries measured the same day

- **A session spawned with no repository is not a control condition** — it has no
  `CLAUDE.md` at all, so it is a blank session, not a session under doctrine.
  Two probes were wasted this way; one burned $5.04 flailing in an empty
  sandbox. Inheriting a parent session's *environment* does not inherit its
  *repos*: attach the source explicitly.
- **A spawned session's transcript is not readable from inside another session.**
  Any criterion scored on the *order of tool calls* therefore cannot be scored
  that way. A human opens the transcript, or the criterion is recorded
  **unmeasured** — which is not the same as passed, and must never be written up
  as one.
