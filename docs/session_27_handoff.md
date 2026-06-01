---
title: Session 27 Hand-off Prompt
date: 2026-06-01
session: 26 → 27 hand-off ("Bruh 26" → next)
status: hand-off — paste the fenced block into Session 27's first message
tags: [handoff, session-prompt, audit, security, pii, cpl-assistant, chatbox, idempotency, excel-retirement]
related:
  - docs/kb-notes/reference-codebase-audit-2026-06-01.md (the 51-finding ranked menu)
  - docs/kb-notes/playbook-pii-history-purge.md (Sam's force-push runbook)
  - docs/session_26_audit_lessons.md (audit process learnings)
  - docs/cpl_assistant_lessons.md (CPL Assistant Phase 1 SHIPPED + LIVE; Phase 2/3 next)
  - docs/kb-notes/cpl-chatbox-integration-scope.md (the phased chatbox plan)
  - docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md (redeploy a shared live edge fn safely)
  - CLAUDE.md §7c (CPL Assistant) + §11 "Session 26" subsection
moniker_suggestion: Bruh 27 / "Two-Seven" / "Lucky 27" — or claim your own
---

# Session 27 Hand-off Prompt

Session 26 ("Bruh 26") ran **two** workstreams: (1) the strategic-queue **codebase
audit** (6-subagent fan-out → 51 findings) + green-lit remediation — **6 merged
PRs**, headlined by stopping a **live student-PII exposure on the public repo**;
and (2) bringing the **live CPL chatbox into the dashboard** as the **CPL
Assistant** tab (Phase 1 — `cpl-chat` redeployed v14, LIVE; Sam: "Works
fantastically!"). Two things now wait on **Sam** (a PII history force-push + a
Cloudflare worker redeploy). Paste the fenced block into Session 27.

## The prompt

```
You are Session 27 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy auto-merge
     gates, §6/§6a/§6b, §7c CPL Assistant operational invariants, §11 + the new
     "Session 26" subsection at the end of §11).
  2. docs/kb-notes/reference-codebase-audit-2026-06-01.md — the 51-finding catalog with
     the RANKED FIX QUEUE. This is the audit menu. START HERE for remediation work.
  3. docs/kb-notes/playbook-pii-history-purge.md — the staged history-purge runbook (Sam
     executes the force-push; you can walk him through it).
  4. docs/cpl_assistant_lessons.md — the CPL Assistant workstream (Phase 1 DONE + LIVE;
     Phase 2 content re-point + Phase 3 Student Portal next; the SHARED-BACKEND caveat is
     the gate). Pairs with docs/kb-notes/cpl-chatbox-integration-scope.md (phased plan) +
     playbook-deploy-shared-supabase-edge-function.md (redeploy safely).
  5. docs/session_26_audit_lessons.md — audit process learnings (fan-out, parent-verify,
     triple-regen idempotency proof, count-PII-without-reading-PII).

WHAT SHIPPED IN SESSION 26 (all merged to main):
  -- Audit + remediation (Bruh 26) --
  - #227 🔴 PII FORWARD-STOP — CustomReport_latest.json (85 MB, ~48k student names / ~30k
    IDs / ~22.8k birthdates) was git-tracked on main + re-committed daily. Untracked it,
    gitignored CustomReport_*.json, dropped the workflow's `git add`, trimmed the 4 unused
    student-identity columns from fetch_custom_report.py (KEPT MAP Internal StudentID —
    aggregate-only). DO NOT re-add the trimmed PII columns.
  - #229 audit findings catalog (51 findings, ranked queue).
  - #231 IDEM-1–5 — fixed 4 live whitespace-accretion inject sites (refresh button,
    PROJ-INFO, Vision 2030, the 446-char AWG mega-line) + hardened ALGO_DETAILS_CSS with an
    End marker. Triple-regen verified. IDEM-6 NOT done (CLAUDE.md §6a keeps the legacy
    stripper). Generator-only — committed cruft clears on the next daily run.
  - #232 SEC-4/5 — _js_safe_json on window.CPL_KB + COLLEGE_ACTIVITY_DATA/_DISCIPLINE_DETAIL.
  - #233 SEC-1/2/3 Cloudflare worker — exact-match CORS, origin gate + 256KB cap on the
    open Anthropic proxy, origin gate on /trigger. ⚠ NEEDS Sam's redeploy (see below).
  - #235 BUG-1 FIX — quickstart project-nav repointed dashboard → activities-projects (the
    PR #206 page-move regression). dashboard_filters.js selector + quickstart.js tab/desc/
    scroll_to all fixed. [DONE — the audit handoff queued this; it landed right after.]
  -- CPL Assistant (Phase 1 of the chatbox integration) --
  - #230 — captured the LIVE cpl-chat Edge Function into chatbox/supabase/functions/
    cpl-chat/index.ts, added https://cpl-initiative.github.io to ALLOWED_ORIGINS,
    REDEPLOYED v13 → v14 via Supabase MCP (verify_jwt:false PRESERVED, v13 captured for
    rollback). Self-contained cpl_chat.js (SSE reader, escape-first markdown-lite, starter
    chips, 429/offline) + #tab-chatbot nav/pane/script + CSS in EXHIBIT_ANALYSIS_CSS
    (Rule 1/2) + quickstart.js TABS row + Rule-4 mirror. LIVE + Sam-confirmed.

═══ WAITING ON SAM (surface these early) ═══
  A. PII HISTORY PURGE — forward exposure stopped; the file still lives in 8 historical
     commits on the public repo. Runbook ready (playbook-pii-history-purge.md): pause cron
     → mirror backup → git filter-repo --invert-paths --path CustomReport_latest.json →
     force-push main (OVERRIDES Rule 5; re-lock after) → re-clone everywhere + GitHub
     Support to purge cached blobs. Offer to prep the exact commands / walk him through it.
  B. WORKER REDEPLOY — #233 hardened cloudflare-worker-proxy.js but the repo file is NOT
     auto-deployed. Sam must re-paste it into the Cloudflare Worker AND add WAF rate-limit
     rules on /, /scrape, /trigger (the real backstop for forged-Origin curl abuse). Remind.
  C. Repo Settings → Pull Requests → "Allow auto-merge" still OFF. Flipping it on lets a
     session enable_pr_auto_merge(squash) instead of manual merges.

═══ BUILD QUEUE (green-lit; pick unless Sam redirects) ═══
  1. CPL ASSISTANT PHASE 2 — re-point RAG content CPLBrain → public cpl-knowledge-base
     (a PRIVACY upgrade: a public bot should RAG a public corpus). Touches 2 repos
     (add_repo cpl-knowledge-base; indexing workflow + index_vault.py there) + one
     snapshotted data op (clear + re-index cpl_document_sections/cpl_documents; exhibits/
     college_profiles untouched). ⚠ Backend is SHARED — re-pointing content flips the LIVE
     map.rccd.edu bot too. CONFIRM the GLOBAL-swap decision with Sam BEFORE the data op.
     Phase 3 (Student Portal embed) is small after.
  2. BUG-2 (XS, still open) — quickstart HINT_VOCAB['unified-courses'] still advertises the
     retired 'Cluster' enum (quickstart.js:90/91/103) → CCR hints get dropped. Swap
     Cluster→Unified + add the 'Cross-discipline over-merge (member TOP)' triage; match the
     EXACT consumer enum strings in unified_courses.js (QS_KIND/QS_SOURCE/QS_TRIAGE). Static
     JS, no regen. (BUG-1 — the project-nav routing — is DONE in #235.)
  3. IDEM-7 (NEW, from the triple-regen) — a SEPARATE pre-existing empty-line accretion
     (+3–4/run) at the EXHIBIT_ANALYSIS_CSS guard region (~94 empties) + the
     CPL-Analytics-HTML inject. It's at the Rule-2 guard → analyze carefully + verify by
     triple regen (run2==run3, ALGO/EXHIBIT copy-count==1). Likely fix: leading strip
     consumes ALL newlines (\n* not \n?) + a deterministic re-inject.
  4. Other audit fixes from the menu (Sam green-lights which): dead-code (DEAD-1/2/4/5/6/7,
     one cleanup PR), perf (PERF-1 double 85MB load is XS + high-value; PERF-5 set-rebuild;
     PERF-7 compact json), correctness (BUG-3 pipeline section-nav, BUG-4 workplan total
     rollback, BUG-5 CER bulk-mark, BUG-7 double-save), DUP-1 shared cpl_auth.js (~300 lines
     × 8 files — the big refactor).
  5. STRATEGIC QUEUE items 2–6 (still approved from Session 25): KPI card reorder
     (localStorage, login-free, Activity-KPI grid), student-eligibility counts on EACR
     (PRIVACY ADR FIRST — aggregate only, no StudentID/PII ever committed), contacts panel
     (WIRE View_CollegeContacts), EACR↔CER convergence, project→activity consolidation
     (playbook first). + sidebar levels (data-sections on CCR/CER/CSR/Exhibit-Adoption).
  6. EXCEL RETIREMENT P5 — budget factors/year_labels → kb/dashboard_config.json
     (measure-first + A/B-parity, same shape as P2); then the .xlsx delete is gated only on
     read_projects (KPI ladder + outage fallback), read_budget_plan, read_update_log.
     P3 Update Log is PARKED (Sam dismissed it — don't re-raise).

PATTERNS THAT WORKED (Session 26):
  - AUDIT = parallel Agent fan-out (no /workflow tool here). One agent per issue class, Opus
    for the subtle ones (security/idempotency/correctness), then PARENT-VERIFY headline
    claims before acting (caught a wrong dead-code claim + escalated the PII finding).
  - Count PII without reading values (populated-cell counts). Public repo = hard no on PII.
  - Idempotency: triple regen is ground truth; measure empty AND 8-space lines separately.
    Generator-only diff (Rule 1): prove the regen, then `git checkout` the regenerated
    artifacts so the commit is just the generator; the daily run clears committed cruft.
  - CAPTURE-BEFORE-REDEPLOY for a shared live Edge Function: get_edge_function the running
    version → that's your rollback. Deno fails closed on syntax. Preserve verify_jwt:false
    EXPLICITLY. Smoke-test all 4 RAG modes after deploy. Verify live state
    (list_edge_functions) before building — versions drift (SKILL.md v12 / live v13 / shipped
    v14). Full procedure: playbook-deploy-shared-supabase-edge-function.md.
  - ESCAPE-FIRST in any model-output renderer (cpl_chat.js escapes then applies a tiny
    markdown subset — a crafted answer can't inject markup).
  - One PR per fix; squash-merge on green (TruffleHog is the only required PR check). After
    merge: git fetch origin main && git rebase origin/main (or reset --hard for fix-only
    branches; untracked files survive), then --force-with-lease the feature branch.

SAFETY TO HONOR:
  - Rules 1 (generator-not-HTML), 2 (idempotency guards — esp. EXHIBIT_ANALYSIS_CSS, the
    34-copy guard; IDEM-7 lives there), 4 (CPL_Dashboard.html == index.html), 5 (never
    force-push main — the ONE sanctioned exception is the PII history purge, cron-paused +
    backed-up, then re-lock).
  - §7c: cpl-chat is SHARED + LIVE (a redeploy/content-swap hits the map.rccd.edu widget);
    verify_jwt MUST stay false; deploy is a one-shot via Supabase MCP, NOT the daily cron;
    source-of-record is the live function (captured in chatbox/).
  - Live Supabase shared (kb_curation/allowed_reviewers/workplan_goals/projects/budget*/
    personnel + the chatbox tables cpl_documents/cpl_document_sections/chat_interactions/
    chatbox_*); snapshot before a data fix; schema/destructive ops need Sam's nod.
  - Don't read/cat the big files (CustomReport_latest.json 85MB [now gitignored, still on
    disk for the generator], coci_*.json, unified_*.js, coci_course_list.xlsx) — inspect via
    scripts/counts.
  - MERGE POLICY: merge on green (mergeable_state clean OR unstable) WITHOUT waiting for a
    comment/"Go!"; hold (ready, never draft) ONLY with a concrete reason. Sam merges fast.
  - Feature branch claude/<desc>; PR as DRAFT → ready immediately → squash-merge on green.
    ⚠ Two sessions ran concurrently this checkpoint — expect to rebase + union-merge shared
    docs (CLAUDE.md / INDEX.md / this handoff). Auto-merge handles the non-overlapping hunks;
    the handoff modify/modify needs a manual union.
```

## Carryover status

| Item | Status |
|---|---|
| PII forward-stop (#227) | **DONE + MERGED** |
| Audit catalog (#229), IDEM-1–5 (#231), SEC-4/5 (#232), worker SEC-1/2/3 (#233) | **DONE + MERGED** |
| BUG-1 quickstart project-nav (#235) | **DONE + MERGED** |
| **CPL Assistant Phase 1 (tab + backend v14)** | **DONE + LIVE** (#230) — Sam confirmed |
| **PII history purge** | **STAGED — Sam force-pushes** (runbook ready) |
| **Worker Cloudflare redeploy + WAF rate-limit** | **WAITING ON SAM** (PR merged, not deployed) |
| Repo "Allow auto-merge" | Sam-side toggle, still off |
| **CPL Assistant Phase 2 (content re-point) / Phase 3 (Student Portal)** | queued — GLOBAL-swap decision is the gate |
| BUG-2 quickstart Cluster→Unified vocab desync | queued (next, XS) |
| IDEM-7 empty-line accretion (Rule-2 guard) | queued (analyze + triple-regen) |
| Rest of audit menu (dead-code / perf / correctness / DUP-1 auth refactor) | queued — Sam green-lights from the KB-note |
| Strategic queue items 2–6 + sidebar levels | queued (approved Session 25) |
| Excel retirement P5 (budget factors → JSON; then .xlsx delete) | queued |
| P3 Update Log history | **PARKED** — Sam dismissed; don't re-raise |
| over-merge re-mint apply (Session 18) | STAGED, gated on Sam's dispatch (separate track) |

Pipeline viz correctly SKIPPED this checkpoint (no re-mint / auditor run / M-ID phase
change — both Session-26 workstreams are separate from the M-ID pipeline).
