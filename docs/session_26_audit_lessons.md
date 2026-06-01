---
title: Session 26 — codebase audit + remediation lessons
date: 2026-06-01
tags: [lessons, audit, security, pii, idempotency, session-26]
artifacts:
  - docs/kb-notes/reference-codebase-audit-2026-06-01.md
  - docs/kb-notes/playbook-pii-history-purge.md
  - fetch_custom_report.py
  - excel_to_dashboard.py
  - cloudflare-worker-proxy.js
related:
  - "[[CLAUDE]]"
  - "[[docs/session_27_handoff]]"
---

# Session 26 — codebase audit + remediation (Bruh 26)

Workstream scratchpad for the Session-25 strategic-queue **item 1 (codebase audit)** and
the green-lit remediation that followed. Distilled findings live in the KB-note
[`reference-codebase-audit-2026-06-01.md`](kb-notes/reference-codebase-audit-2026-06-01.md);
this doc captures the *process* learnings + state.

## What shipped (all merged to main, 2026-06-01)

| PR | What |
|---|---|
| **#227** | 🔴 PII forward-stop — untrack `CustomReport_latest.json` + gitignore + drop the workflow `git add` + trim 4 student-identity columns from the fetch |
| **#229** | Audit findings catalog (51 findings, ranked queue) |
| **#231** | Idempotency IDEM-1–5 (4 live whitespace-accretion sites + ALGO CSS hardening) |
| **#232** | SEC-4/5 — `_js_safe_json` on two inline `<script>` blobs |
| **#233** | SEC-1/2/3 — Cloudflare worker hardening (needs Sam's redeploy) |

## Process learnings

1. **The `/workflow` audit = a parallel `Agent` fan-out.** `/workflow` and `/effort`
   aren't available in this environment (ToolSearch confirmed no such tool). The faithful
   implementation is N background `Agent` subagents, one per issue class, then parent
   synthesis. 6 agents (dead-code, idempotency, perf, duplication, security, +bonus
   frontend-correctness) ran concurrently; each returned a structured findings report.
   This IS the textbook use case and it worked well.
2. **Always parent-verify subagent claims before acting.** The dead-code agent (Sonnet)
   said `worker-to-paste.js` "lacks `/trigger`" — wrong (both have it; it's ~99/86-line
   diverged). The security agent flagged SEC-10 as "Likely (didn't open the 91 MB file)" —
   parent verification (cell-population counts, no values read) **confirmed it and made it
   the override-priority finding.** A 5-minute grep/count pass caught a factual error and
   escalated the most important finding.
3. **Count PII without reading PII.** To size the exposure I counted *populated cells* per
   column (`sum(1 for r in rows if r[idx] not in (None,""))`) — never printed a value.
   That's how you quantify a PII exposure safely in a public-repo context.
4. **A "migrate/trim" can be parity-safe by reading the consumer.** The fetch-payload trim
   kept `MAP Internal StudentID` because `_compute_college_military_students` reads it
   (by name) for an aggregate count; the other 4 identity columns are read nowhere, so
   dropping them is output-identical. (Same "verify-consumer-before-migrating" methodology
   as Session 24.)
5. **Idempotency fixes MUST be verified by triple regen, not by reasoning alone.** Running
   the generator 3× (`pip install openpyxl pandas`, snapshot fallbacks) and diffing run2 vs
   run3 is ground truth. It proved IDEM-1–5 collapse the 8-space cruft (329→275, stable) AND
   **surfaced a *separate* empty-line accretion (IDEM-7)** my reasoning hadn't predicted —
   present in the original generator too. **Distinguish line classes:** `grep '^[[:space:]]+$'`
   counts 8-space-indented blanks but NOT zero-width empty lines; measure both.
6. **Don't bundle a risky change into the wrong PR.** IDEM-7 lives at the **Rule-2
   EXHIBIT_ANALYSIS_CSS guard** (the 34-copy-incident guard). Deferring it to a focused PR —
   rather than bundling an under-analyzed change to the most sensitive guard into the IDEM-1–5
   PR — was the right call. Ship verified value; queue the rest.
7. **Project memory overrides an agent suggestion.** IDEM-6 ("delete the dormant legacy
   stripper") conflicts with CLAUDE.md §6a ("keep both strippers for cross-rename
   idempotency"). Followed CLAUDE.md, didn't delete. Always reconcile findings against the
   rules before acting.
8. **Some fixes can't fully land from a merged PR.** The worker hardening (#233) is inert
   until Sam re-pastes it into Cloudflare; SEC-1's real backstop is a CF WAF rate-limit rule
   (config, not code). Flag the human deploy/config step loudly in the PR + handoff.

## Current state / next step

- Forward PII exposure **stopped**; **history purge staged** for Sam's force-push
  (runbook: [`playbook-pii-history-purge.md`](kb-notes/playbook-pii-history-purge.md)).
- Worker hardening **merged but not deployed** — Sam to redeploy + add CF rate-limit.
- **Queued for Session 27:** BUG-1 (quickstart project-nav, broken since PR #206), IDEM-7,
  and strategic-queue items 2–6 (KPI reorder, student-eligibility counts [privacy ADR first],
  contacts panel, EACR↔CER convergence, project→activity consolidation) + sidebar levels.
  Full ranked menu in the audit KB-note; carryover table in
  [`docs/session_27_handoff.md`](docs/session_27_handoff.md).

## Checkpoint 2 — close-out (2026-06-01)

- **BUG-1 shipped (PR #235)** — quickstart project navigation repointed to
  `#tab-activities-projects`. Root cause: the router's hardcoded `TABS` list in `quickstart.js`
  never gained an `activities-projects` entry when PR #206 created the tab, so project picks /
  Activity / search / scroll_to hints all routed to `dashboard`; the `dashboard_filters.js`
  selector + `cpl-qs-hint` consumer key were downstream symptoms. That completes **every**
  Session-26 green-lit fix.
- **Guided Sam through the 3 pending actions** (PII history force-push, Cloudflare worker
  redeploy + WAF rate-limit, "Allow auto-merge" toggle). The history purge force-pushes `main`,
  so I offered to run it step-by-step (one command, confirm output, next).
- **9th process learning — fix the source-of-truth, not just the symptoms.** A "repoint N JS
  sites" bug can hide a missing registry entry: BUG-1's real fix was adding the tab to the
  router's `TABS` list (+ a `HINT_VOCAB` key rename); the selector/consumer edits only mattered
  once the routing pointed at the right tab. Find the authoritative list first.
- **Next concrete step (Session 27):** BUG-2 (Cluster→Unified vocab), then IDEM-7, then the
  audit menu + strategic items 2–6.

## Checkpoint 3 — PII purge executed + cheat-sheet re-created (2026-06-01)

- **PII history purge EXECUTED by Sam** (was staged): `git filter-repo --invert-paths --path
  CustomReport_latest.json` on a fresh clone → force-push to `main` (.git 385→248 MB) →
  deleted the merged `claude/*` session branches → closed PR #238. Verified at each gate
  (file gone from all history; the purge clone == current `main` tip before the force-push,
  so nothing was lost). Data is out of `main` AND its history.
- **10th process learning — after a history rewrite, RE-CREATE open PRs, don't rebase.**
  PR #238 (a cheat-sheet button/modal) was cut from pre-rewrite `main`; a rebase would replay
  the purged history. Closed it + deleted the branch, recovered the work via
  `git fetch origin refs/pull/238/head` + `git show c7140fd -- <files>`, and re-applied the
  exact 149-line diff to a fresh branch off the clean main (#239). Re-verified the PROJ-INFO
  button byte-matches the generator emission (no daily churn) + the static modal survives the
  regen. Captured in `docs/kb-notes/playbook-pii-history-purge.md` ("Open PRs after the rewrite").
- **Session 26 fully closed.** Remaining = 2 Sam-side ops (worker redeploy + WAF rate-limit;
  "Allow auto-merge" toggle). Session 27 queue unchanged.
