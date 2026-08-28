---
title: "Resume a long multi-agent workflow across task death, model swaps, and spend caps"
created: 2026-07-12
kb-status: published
tags: [playbook, workflow, orchestration, resume, spend-cap, ccr, trail-crew, reliability]
artifacts:
  - kb/_ccr_trail.py
  - kb/ccr_out/2026-07-11/
related:
  - "[[playbook-trail-crew-method-magic-audit]]"
---

# Resume a long multi-agent workflow across failures

## The problem (Session 112, CCR wave 3)

A single Workflow run adjudicated 2,000 identities with ~540 agents over
~8 hours. In that window it hit **three** distinct failure modes, none of
which should lose work:

1. **Silent task death.** The background task vanished twice — 0-byte output
   file, gone from the task registry, and **no completion notification**. A
   `TaskOutput` call returned `No task found`. The agent journal on disk was
   intact; only the task *wrapper* died.
2. **Monthly spend cap.** Mid-skeptic-phase (~240 of 486), the session model
   (Fable 5) hit its monthly spend limit and **426 in-flight agent calls
   failed at once** with "You've hit your monthly spend limit."
3. **Model change mid-run.** The user switched the session to Opus 4.8 to get
   past the cap.

## The mechanism that saves it: `resumeFromRunId`

Every Workflow invocation persists its script and journals every agent result.
Relaunch with:

```
Workflow({ scriptPath: "<the persisted script path>", resumeFromRunId: "<runId>" })
```

- Agents whose `(prompt, opts)` are **unchanged** replay from cache instantly —
  zero re-spend, zero re-adjudication.
- Only failed / never-run agents execute live.
- **Workflow agents inherit the session model**, so a resume after a model swap
  runs the *remaining* agents on the new model. Wave 3 finished its last ~246
  skeptics on Opus 4.8 after starting on Fable 5.

## The procedure

1. **Detect death, don't assume completion.** If `TaskOutput` says
   `No task found` AND the journal's `result` count has stalled, the task died.
   Diagnose from the journal (`grep -c '"type":"result"'`), not the task API.
2. **Resume with the persisted `scriptPath` + `resumeFromRunId`** (both are in
   the original launch's tool result). Same script + same args → 100% cache
   hit on completed work.
3. **Re-arm a short self-check-in** (`send_later`, ~45 min) after a death —
   deaths cluster; the completion notification is unreliable when the task
   wrapper is the thing dying.
4. **Assemble from the journal, not the task result.** When all agents are
   done, parse `journal.jsonl` directly (dedup by content key — cache replays
   log duplicate result lines; take latest per batch/id). The task's returned
   blob can be truncated or arrive late; the journal is the source of truth.
5. **Record the model provenance.** If the run spanned models, note it in the
   receipt (`_models` block). For a verify/skeptic phase this is cosmetic —
   skeptics check claims against committed files, so the model boundary doesn't
   bias the verdict set — but provenance is cheap and honest.

## The rules

- **A silent task death is not a completed task.** Always cross-check the
  journal before declaring done or empty.
- **Never re-launch a fresh Workflow to "retry"** — that re-spends everything.
  Resume the run.
- **The journal is the ledger.** Assemble, count, and audit from it; the task
  wrapper is disposable.
- **Capped/failed sub-findings are flagged, never hidden** — if some agents
  never complete even after resume, mark their findings `capped_unverified`
  and report the count (per the Trail Crew playbook). A partial verify is
  honest; a silently-dropped one is not.
