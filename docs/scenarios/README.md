---
title: Doctrine probes — testing the rules without cueing the answer
date: 2026-08-29
tags: [methodology, doctrine, testing, session-memory]
artifacts:
  - docs/scenarios/rubric.md
  - docs/scenarios/probes/
  - kb/_doctrine_scenarios.py
related:
  - docs/kb-notes/methodology-push-what-cannot-be-asked-for-pull-everything-else.md
---

# Doctrine probes

## The problem this solves

We keep asking "do our rules actually fire?" and answering it from inside a
session that already knows the answer. Sam named it exactly:

> *"you're operating off some rich context right now that I don't know how you
> can temporarily forget to test as if you were a fresh session"*

and then again, more precisely:

> *"Can your handoff set up the next session to check our scenarios against
> rules only rather than cueing up the next session with cheater context?"*

He is right, and the fix is **not a thinner handoff**. A handoff exists to make
the next session productive; deliberately degrading it to serve a test would
cost us the thing that works to measure the thing that might not.

## The separation

The tension dissolves once two roles stop being the same session:

| Role | Gets | Job |
|---|---|---|
| **Experimenter** (the next numbered session) | the full rich handoff, all context | runs the probes, scores them against the rubric, fixes what fails |
| **Probe** (a disposable spawned session) | `CLAUDE.md` only — which auto-loads in *every* session anyway — plus one realistic task prompt | just does the task |

⚠️ **The instruments — the rubric and the probe prompts — are deliberately NOT
in this repository.** They live in the private vault, which probe sessions do
not clone; the handoff tells the experimenter where. See "The instrument may not
live inside the system under test", below.

`CLAUDE.md` is the honest control condition. It is what a session gets **for
free**, before anyone hands it anything. The handoff is the extra. So "rules
only" means: auto-loaded doctrine plus whatever the session chooses to pull.
That is precisely the question we care about — not whether a context-starved
session can work, but whether **the always-loaded layer steers correctly**.

## Four rules for a probe that measures anything

1. **Disguise the scenario.** Never *"you are being tested on whether you
   checkpoint."* Say *"You are Session 208. Start on the ESS 25-82 tab."* A
   verbatim scenario cues its own answer and measures nothing but comprehension.
2. **One probe, one scenario.** A probe asked six questions learns from the
   first. Fresh session per scenario.
3. **Rubric first, and committed.** Write the pass criteria and commit them
   BEFORE the probe runs — **in the vault, not here**. This is the actual guard
   against a contaminated scorer: without it, whatever the probe does becomes
   what we expected.
4. **Score the trace, not the vibe.** Every criterion is a thing that either
   appears in the transcript / repo or does not.

## Evidence is asymmetric — plan for it

A probe that **passes** is weak evidence: a capable session can arrive at good
behavior without the rule, so a pass cannot distinguish "the rule fired" from
"it would have done that anyway."

A probe that **fails** is strong evidence: the rule was loaded, the situation
called for it, and it still did not fire.

So probes are for **finding holes, not certifying coverage.** Do not report
"5/6 passed" as a coverage number. Report which holes were found.

## What cannot be probed cold

Two scenarios are properties of a *late* session, and a probe is by definition
early:

- **Context pressure at 600K.** Not probeable — a fresh session has none. This
  is why it is handled mechanically instead, by `kb/_context_budget.py` and the
  PostToolUse hook (CLAUDE.md Rule 9a), whose own guard replays the real
  2026-08-29 compaction.
- **Sign-out staleness.** Probeable ONLY by staging the repo so
  `checkpoint_overdue` already fires, then ending a short task naturally. The
  staleness lives in the repo, not in the session's length.

Recording this is the point: a scenario nobody can run is not a passing
scenario, it is an unmeasured one.


## ⚠️ The instrument may not live inside the system under test

**Added 2026-08-29 (Session 208), after this protocol's first real run.**

The rubric and all five probe prompts were committed to `cpl-project-tracker` —
the repository a probe clones. So the control condition included, for free, a
109-line document naming every criterion the probe was about to be scored on,
plus the advance predictions.

The leak is not subtle. A probe's most natural first action is to search for the
topic it was just handed, and for P5 the phrase `comprehensive-vs-carve-out`
matched **exactly one file in the entire repository — its own probe prompt**, and
nothing else. P5 found it, recognized it was inside a test, and void-flagged its
own result. Two probe runs were discarded.

Handoff 207 anticipated leakage but located it in the *prompt*: *"re-read the
probe prompt for a cue before believing it."* The leak was in the **repository**.
A probe protocol is not a document; it is a document **plus where it is kept**.

The instruments now live in
`CPLBrain/04-projects/cpl-initiative/doctrine-probes/`. This file — the method —
stays, because it names no criterion and is reusable knowledge.
`probe_instrument_leak` in `kb/_docs_audit.py` fails if a rubric or prompt
reappears here, because the natural repair for a broken link is to put the file
back, and that silently re-breaks every future probe.

### Also learned, mechanically

- **A probe spawned with no repository is not a control condition** — it is a
  blank session with no `CLAUDE.md` at all. Two were wasted that way; one burned
  $5.04 flailing in an empty sandbox before it was stopped. Always attach the
  source explicitly; inheriting the parent session's environment does not
  inherit its repos.
- **A spawned session's transcript is not readable by the experimenter** from
  inside a session, so any criterion scored on *the order of tool calls* (P3)
  cannot be scored this way. Either a human opens the transcript, or the
  criterion is recorded as unmeasured. It is not a pass.
