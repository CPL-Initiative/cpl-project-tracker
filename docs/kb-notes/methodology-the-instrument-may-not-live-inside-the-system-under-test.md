---
title: The instrument may not live inside the system under test
created: 2026-08-29
updated: 2026-08-30
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
probe P5 the phrase P5's topic phrase (vault-only) matched **exactly one file in
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

## The leak scales with how good the disguise is

Measured across the two probes that actually ran, searching `main` as a probe
would:

| probe | its distinctive topic phrase | files matched | its own prompt among them |
|---|---|---:|---|
| **P5** | (its own, vault-only) | **1** | **yes — the only hit** |
| **P2** | (a tab name) | 24 | yes, 1 of 24 |
| **P2** | (a table name) | 5 | no |

P5 leaked catastrophically and P2 barely at all, and the reason is uncomfortable:
**P5 was the better-designed probe.** Its scenario was specific, novel, and
phrased in vocabulary the corpus did not already contain — exactly what the
protocol's own first rule ("disguise the scenario") asks for. P2 described a
surface documented in 24 other files, so its prompt was buried in real content.

So the effort that makes a probe realistic and novel is the same effort that
makes its prompt the **unique** match for its own topic. **The better the
disguise, the louder the leak** — which means this failure gets worse, not
better, as the protocol improves. It cannot be mitigated by writing more careful
prompts; only by moving the instrument out.

⚠️ It also means **contamination is not all-or-nothing, and a contaminated run is
not uniformly worthless.** A *pass* under leak is void. A *failure* under leak is
**stronger** evidence than a clean failure would be: the session had the criteria
available and still did not meet them. Score contaminated runs asymmetrically,
and say which they are.

## Three things the leaked probe saw that the experimenter did not

The void run was not worthless. P5 recorded its own findings and three go beyond
the analysis above.

**1. The leak selects AGAINST the sessions worth measuring.** The path in was not
cleverness, it was diligence: the prompt asserts *"the fix is in and tests pass,"*
so the first correct move is to verify that claim instead of accepting it — and
the search that verifies it also returns the probe file. A session that took the
premise on faith would have stayed blind and scored clean. **So the leak's bias
is toward false HITs**, and it is worst on exactly the sessions whose behavior we
most wanted to observe. That is sharper than "a better disguise leaks louder":
it is the *checking* that trips it.

**2. A probe must not be able to write to the memory it is testing.** The P5
premise is false — no such rework exists at that commit; *"tests pass"* is true
only because nothing changed. But the repo's doctrine answers a learning like
that with a lessons section, a `docs/kb-notes/` note and `cpl_memory` rows. So
**a probe that fully passes P5 fabricates durable memory about work nobody did**,
and `cpl_memory` promotes `proposed` → `verified` on second-session
corroboration — meaning a second P5 run is a plausible route to a *verified
fiction* in the store Rule 8 exists to protect. Give a probe a premise that is
TRUE at its commit, or run it with memory writes disabled.

**3. The criterion rewards the wrong half.** Rubric 5.5 credits *writing* a lint
for a mechanically-checkable lesson. Here the guard already existed
(`purpose_carve_outs_skipped`, plus a test asserting both that no carve-out was
re-banded *and* that carve-outs were seen so the guard can fire), so the correct
answer was **write nothing — it is a duplicate.** As written, 5.5 scores that
identically to missing the point. It should reward **checking whether the guard
already exists**, which is this repo's own standing advice.

⚠️ Recorded as a dated addendum beside the rubric, **not** as an edit to 5.5. The
rubric's value is that it was fixed before any probe ran; retrofitting a
criterion to a result destroys exactly that.

## And then the post-mortem re-leaked it

Within the hour, the write-ups *explaining* this leak had put a probe's topic
phrase back on `main` in four files — in documents that also say what the probe
is scored on, which is worse than the bare prompt was. The lint written to catch
the leak **contained the leaked phrase in its own explanatory comment**, and only
a self-check (*"the lint stores hashes, never the phrases"*) caught it.

This is the third instance of one recursive shape in this repo: the first cut of
`presentation_doctrine` was satisfied by the **post-mortem about losing the rule
it guards**, and the American-spelling sweeper **corrupted the word list that
documented it**. The general form: **a document about a failure tends to
reproduce the failure's material, and a checker keyed on that material cannot
tell the description from the thing.** Store the material as hashes, or scope the
check so the description is out of range — never rely on remembering not to quote.

## Corollaries measured the same day

- **A session spawned with no repository is not a control condition** — it has no
  `CLAUDE.md` at all, so it is a blank session, not a session under doctrine.
  Two probes were wasted this way; one burned $5.04 flailing in an empty
  sandbox. Inheriting a parent session's *environment* does not inherit its
  *repos*: attach the source explicitly.
- ⛔ **The blast-radius guard destroyed the only channel a probe has back.** Both
  probes were told *"no push credentials — leave your work in the working tree."*
  That was false (they had credentials), and it was also the **wrong instruction**:
  a spawned session's transcript is unreadable from another session, and so is
  its working tree. **A probe's only channel back to the experimenter is a PR.**
  The probe that ignored the guard and pushed produced the best findings of the
  run; the probe that complied produced **nothing scoreable at all** — $17.44,
  idle, unreadable. Tell a probe to commit and open a PR; the diff and the PR
  body *are* the result. If blast radius is the worry, remove the **merge**
  capability, not the push.
- **A spawned session's transcript is not readable from inside another session.**
  Any criterion scored on the *order of tool calls* therefore cannot be scored
  that way. A human opens the transcript, or the criterion is recorded
  **unmeasured** — which is not the same as passed, and must never be written up
  as one.

## The fourth instance: the subject's REQUIRED READING is a location too (2026-08-30)

Moving the instruments out of the subject's repository closed the storage
leak — and the next void arrived anyway, through scheduling. A realistic
scenario says "pick up the priority work"; the subject correctly reads the
authoritative handoff; the handoff's queue, correctly, lists the instrument
lane's own next step and points at the instruments' home; the subject,
correctly, follows. **Three correct moves, and the subject is inside the
answer key.** The instrument had been moved out of the subject's *store* but
not out of the subject's *path*.

The generalization tightens: the earlier rule said *anything the subject can
read is an input*. This instance adds: **anything the subject's task will make
it read is part of the apparatus** — and a task defined as "whatever is
currently most important" inherits whatever the queue currently holds. An
evaluation whose subject is pointed at a live work queue is only clean while
the queue's top item is not the evaluation itself. Check that as a staging
condition, or sequence the runs so instrument work is never the top of the
queue while a run is possible, or give the subject a pinned task instead of a
pointer to the queue — each fixes it; relocation alone does not.
