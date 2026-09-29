---
title: An auto-triggered smoke test validates the version it is replacing
created: 2026-08-11
updated: 2026-08-11
tags: [methodology, ci, deploy, verification, sierra, operations]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-commit-the-test-harness]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - .github/workflows/cpl-chat-deploy.yml
  - .github/workflows/cpl-chat-smoke.yml
---

# An auto-triggered smoke test validates the version it is replacing

> **One-sentence summary** — if the smoke test fires on push but the deploy is a
> manual dispatch, the green smoke result describes the code being replaced, and
> the timestamps are the only place that shows it.

## Context

`cpl-chat-smoke.yml` triggers automatically on any push touching
`chatbox/supabase/functions/cpl-chat/index.ts`. `cpl-chat-deploy.yml` is
`workflow_dispatch` only, gated behind typing `DEPLOY` — a deliberate production
guard.

Merging the CRED·VOLUME work therefore produced this sequence:

```
23:35  smoke test runs on the merge commit   -> success   (function is v37)
23:47  deploy dispatched, function -> v38
```

The smoke test passed, on the merge commit, against the **previous** function.
Nothing in the run's name, its commit sha, or its conclusion reveals that; only
comparing its timestamp against the function's `updated_at` does.

## The claim

**A post-deploy check must be ordered after the deploy, or it is a pre-deploy
check wearing the wrong label.**

A smoke test that exercises a *live* service is testing whatever is deployed at
the moment it runs — not the commit that triggered it. When deployment is
decoupled from merge (as it should be for a production assistant), the automatic
trigger fires at the wrong moment by construction. The signal is not merely
weak; it is **systematically about the wrong artifact**, and it is green, which
is why it never prompts a second look.

Every prior deploy in this repo carried the same shape.

## Why it survived unnoticed

The failure mode is silent in the direction that feels safe: the check passes.
A red smoke run would have been investigated immediately; a green one against
stale code reads as confirmation. This is the same asymmetry as a violated
permission versus a violated prohibition — only one of them complains.

## How to apply it

- After any manually-dispatched deploy, **dispatch the smoke test too** and
  confirm it ran *after* the function's `updated_at`. Do not accept the
  push-triggered run as evidence.
- Better: have the deploy workflow invoke the smoke job as a final step, so the
  ordering is structural rather than remembered.
- When reading a green post-deploy check, compare its `created_at` to the
  deployed artifact's timestamp before believing it.
- Generally: for any check that probes a live system, ask *what was deployed
  when this ran?* — the triggering commit does not answer that question.
