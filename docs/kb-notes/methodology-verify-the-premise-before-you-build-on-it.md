---
title: Verify the premise before you build on it
created: 2026-09-19
updated: 2026-09-19
tags: [methodology, handoff, measurement, git]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/auth_and_repo_posture_lessons]]"
  - "[[docs/ccr_atlas_lessons]]"
artifacts:
  - docs/reference/approval_prompt_hooks.md
  - scripts/check_hooks_live.py
---

# Verify the premise before you build on it

> **One-sentence summary** — a handoff written under context pressure is where
> a confident wrong claim gets passed forward, and the cost is not a wasted
> hour but a correct solution to the wrong problem.

## Context

Session 278 acted on two inherited claims without checking either. Both were
stated plainly, both came from a trusted source, and both were wrong. They cost
roughly half the session between them.

## Case 1 — a stale ref made a working gate look broken

Attributing a browser-sweep failure, the session ran a baseline against
`origin/main` without fetching. The ref was hours old (`d89ddec`) and predated
the feature under test entirely, so the baseline page carried none of it. The
comparison concluded that a shipped gate did not work on the live site — and
that conclusion was reported before it was checked.

`git fetch` moved `origin/main` `d89ddec → f66659c` as a **forced update**, and
the re-run against the true parent showed the gate holding exactly as designed.

⚠️ **The tell was in the output and went unread.** A probe reported
`CPL_TEAM_PHRASE.get() = "no module"` — a fact about the *page*, not about the
gate. **A baseline missing the module under test is not a baseline.**

## Case 2 — a handoff's central claim, repeated into a design

The prior session's handoff stated that `permissions.allow` cannot stop auto
mode's approval prompts, because a separate classifier judges each call on its
content. It was specific, it explained an observed symptom, and it named a
mechanism. Three guard scripts were built on it.

The classifier's documented decision order begins: *"Actions matching your
allow, ask, or deny rules resolve immediately."* Allow rules work. The
allowlist had never failed — it had never **loaded**, for an unrelated reason.
One cause, not two, and a third of the work was unnecessary.

## Why a handoff is the high-risk source

A handoff is written at the end of a session, often under context pressure —
the emergency checkpoint that produced this one was taken at 31,860 tokens
remaining. That is precisely when a session compresses "I observed X and infer
Y" into "Y", loses the measurement, and keeps the confidence. The next session
reads Y as established fact, because the handoff's whole purpose is to carry
established facts.

⚠️ **Prose confidence does not decay with distance from the evidence, but
accuracy does.**

## The practice

- **A claim that will shape the design gets one measurement.** Not a literature
  review — one command. `git fetch` before trusting a ref; one doc lookup
  before building on how a tool behaves; one probe before accepting that a
  mechanism is broken.
- **Prefer the primary source over the summary of it.** Both errors here were
  settled in minutes by reading the official docs and by running the baseline.
- **Read your own probe output for facts you did not ask for.** `"no module"`
  answered a question nobody posed and invalidated the whole run.
- **When you record an inference, record the measurement with it.** A handoff
  line reading *"permissions.allow does not stop these (measured: #1617
  allowlisted five tools, prompts unchanged)"* invites the next session to
  check whether the measurement supports the claim. It does not — the tools
  were allowlisted in a file that never loaded.
- **State confidence honestly in the artifact.** Where this session could not
  verify something (whether a local-path plugin marketplace auto-loads), the
  doc says *promising, unverified* rather than recommending it.

## Related

[`methodology-a-single-decider-guard-is-only-as-wide-as-the-files-it-reads`](methodology-a-single-decider-guard-is-only-as-wide-as-the-files-it-reads.md)
is the same failure in a test: a correct assertion over an unstated scope.
