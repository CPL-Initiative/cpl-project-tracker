---
title: Session 27 Hand-off Prompt
date: 2026-06-01
session: 26 → 27 hand-off ("Bruh 26" → next)
status: hand-off — paste the fenced block into Session 27's first message
tags: [handoff, session-prompt, audit, security, pii, idempotency, excel-retirement]
related:
  - docs/kb-notes/reference-codebase-audit-2026-06-01.md (the 51-finding ranked menu)
  - docs/kb-notes/playbook-pii-history-purge.md (Sam's force-push runbook)
  - docs/session_26_audit_lessons.md
  - CLAUDE.md §11 "Session 26" subsection
moniker_suggestion: Bruh 27 / "Two-Seven" / "Lucky 27" — or claim your own
---

# Session 27 Hand-off Prompt

Session 26 ("Bruh 26") ran the codebase audit (6-subagent fan-out → 51 findings) and
shipped **5 merged PRs**, headlined by stopping a **live student-PII exposure on the
public repo**. Two things now wait on **Sam** (a history force-push + a Cloudflare
redeploy), and a build queue is ready. Paste the fenced block into Session 27.

## The prompt

```
You are Session 27 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy auto-merge
     gates, §6/§6a/§6b + §11, and the new "Session 26" subsection at the end of §11).
  2. docs/kb-notes/reference-codebase-audit-2026-06-01.md — the 51-finding catalog with
     the RANKED FIX QUEUE. This is your menu. START HERE.
  3. docs/kb-notes/playbook-pii-history-purge.md — the staged history-purge runbook (Sam
     executes the force-push; you can walk him through it).
  4. docs/session_26_audit_lessons.md — process learnings (fan-out audit, parent-verify,
     triple-regen idempotency proof, count-PII-without-reading-PII).

WHAT SHIPPED IN SESSION 26 (all merged to main):
  - #227 🔴 PII FORWARD-STOP — CustomReport_latest.json (85 MB, ~48k student names / ~30k
    IDs / ~22.8k birthdates) was git-tracked on main + re-committed daily. Untracked it,
    gitignored CustomReport_*.json, dropped the workflow's `git add`, and trimmed the 4
    unused student-identity columns (BirthDate/FirstName/LastName/StudentID) from
    fetch_custom_report.py (KEPT MAP Internal StudentID — aggregate-only). DO NOT re-add
    the trimmed PII columns.
  - #229 Audit findings catalog (51 findings, ranked queue).
  - #231 Idempotency IDEM-1–5 — fixed 4 live whitespace-accretion inject sites (refresh
    button, PROJ-INFO, Vision 2030, the 446-char AWG mega-line) + hardened ALGO_DETAILS_CSS
    with an End marker. Verified by triple regen. IDEM-6 NOT done (CLAUDE.md §6a keeps the
    legacy stripper). Generator-only — the committed cruft clears on the next daily run.
  - #232 SEC-4/5 — _js_safe_json on window.CPL_KB + COLLEGE_ACTIVITY_DATA/_DISCIPLINE_DETAIL.
  - #233 SEC-1/2/3 Cloudflare worker — exact-match CORS, origin gate + 256KB cap on the
    open Anthropic proxy, origin gate on /trigger. ⚠ NEEDS Sam's redeploy (see below).

═══ WAITING ON SAM (surface these early) ═══
  A. PII HISTORY PURGE — forward exposure is stopped; the file still lives in 8 historical
     commits on the public repo. Runbook is ready (playbook-pii-history-purge.md): pause the
     cron → mirror backup → `git filter-repo --invert-paths --path CustomReport_latest.json`
     → force-push main (OVERRIDES Rule 5; re-lock after) → re-clone everywhere + GitHub
     Support to purge cached blobs. Offer to walk him through it / prep the exact commands.
  B. WORKER REDEPLOY — #233 hardened cloudflare-worker-proxy.js but the repo file is NOT
     auto-deployed. Sam must re-paste it into the Cloudflare Worker AND add WAF rate-limit
     rules on /, /scrape, /trigger (the real backstop for forged-Origin curl abuse of the
     API key). Remind him.
  C. Repo Settings → Pull Requests → "Allow auto-merge" still OFF (tried on #220 earlier).
     Flipping it on lets a session enable_pr_auto_merge(squash) instead of manual merges.

═══ BUILD QUEUE (green-lit; pick in this order unless Sam redirects) ═══
  1. BUG-2 (XS, quickstart vocab desync) — HINT_VOCAB['unified-courses'] still advertises the
     retired 'Cluster' enum (kind/source/triage), so CCR hints get dropped; swap Cluster→Unified
     + add the 'Cross-discipline over-merge (member TOP)' triage. Match the EXACT consumer enum
     strings in unified_courses.js (QS_KIND/QS_SOURCE/QS_TRIAGE). Static JS, no regen.
     (BUG-1 — the quickstart project-nav routing — was DONE in PR #235 this session: added the
     missing 'activities-projects' router entry + moved HINT_VOCAB/routing/selector/consumer.)
  2. IDEM-7 (NEW, from the triple-regen) — a SEPARATE pre-existing empty-line accretion
     (+3–4/run) at the EXHIBIT_ANALYSIS_CSS guard region (~94 empties already) + the
     CPL-Analytics-HTML inject. It's at the Rule-2 guard, so analyze carefully + verify by
     triple regen (run2==run3, ALGO/EXHIBIT copy-count==1). Likely fix: make the leading
     strip consume ALL newlines (\n* not \n?) + a deterministic re-inject.
  3. Other audit fixes from the menu (Sam green-lights which): the rest of dead-code
     (DEAD-1/2/4/5/6/7, one cleanup PR), perf (PERF-1 double 85MB load is XS + high-value;
     PERF-5 set-rebuild; PERF-7 compact json), correctness (BUG-3 pipeline section-nav,
     BUG-4 workplan total rollback, BUG-5 CER bulk-mark, BUG-7 double-save), and the
     duplication refactors (DUP-1 shared cpl_auth.js is the big one, ~300 lines × 8 files).
  4. STRATEGIC QUEUE items 2–6 (still approved from Session 25): KPI card reorder
     (localStorage, login-free, Activity-KPI grid), student-eligibility counts on EACR
     (PRIVACY ADR FIRST — aggregate only, no StudentID/PII ever committed), contacts panel
     (WIRE View_CollegeContacts), EACR↔CER convergence, project→activity consolidation
     (playbook first). + sidebar levels (data-sections on CCR/CER/CSR/Exhibit-Adoption).

PATTERNS THAT WORKED (Session 26):
  - The audit = parallel Agent fan-out (no /workflow tool here). One agent per issue class,
    Opus for the subtle ones (security/idempotency/correctness), then PARENT-VERIFY headline
    claims before acting (caught a wrong dead-code claim + escalated the PII finding).
  - Count PII without reading values (populated-cell counts). Public repo = hard no on PII.
  - Idempotency: triple regen is ground truth. Measure empty AND 8-space lines separately.
    Generator-only diff (Rule 1): prove the regen, then `git checkout` the regenerated
    artifacts so the commit is just the generator; the daily run clears committed cruft.
  - One PR per fix; squash-merge on green (TruffleHog is the only required PR check). After
    merge: `git fetch origin main && git reset --hard origin/main` (untracked files survive),
    then the next fix. The feature branch needs --force-with-lease after the reset since the
    remote branch still points at the pre-merge commit.

SAFETY TO HONOR:
  - Rules 1 (generator-not-HTML), 2 (idempotency guards — esp. EXHIBIT_ANALYSIS_CSS, the
    34-copy guard; IDEM-7 lives there), 4 (CPL_Dashboard.html == index.html), 5 (never
    force-push main — the ONE sanctioned exception is the PII history purge, cron-paused +
    backed-up, then re-lock).
  - Live Supabase shared; snapshot before a data fix; schema/destructive ops need Sam's nod.
  - Don't read/cat the big files (CustomReport_latest.json 85MB [now gitignored, still on
    disk for the generator], coci_*.json, unified_*.js, coci_course_list.xlsx) — inspect via
    scripts/counts.
  - MERGE POLICY: merge on green (mergeable_state clean OR unstable) WITHOUT waiting for a
    comment/"Go!"; hold (ready, never draft) ONLY with a concrete reason. Sam merges fast.
  - Feature branch claude/<desc>; PR as DRAFT → ready immediately → squash-merge on green.
```

## Carryover status

| Item | Status |
|---|---|
| PII forward-stop (#227) | **DONE + MERGED** |
| Audit catalog (#229), IDEM-1–5 (#231), SEC-4/5 (#232), worker SEC-1/2/3 (#233) | **DONE + MERGED** |
| **PII history purge** | **STAGED — Sam force-pushes** (runbook ready) |
| **Worker Cloudflare redeploy + WAF rate-limit** | **WAITING ON SAM** (PR merged, not deployed) |
| Repo "Allow auto-merge" | Sam-side toggle, still off |
| BUG-1 quickstart project-nav | **DONE + MERGED** (#235) |
| BUG-2 quickstart Cluster→Unified vocab desync | queued (next, XS) |
| IDEM-7 empty-line accretion (Rule-2 guard) | queued (analyze + triple-regen) |
| Rest of audit menu (dead-code / perf / correctness / DUP-1 auth refactor) | queued — Sam green-lights from the KB-note |
| Strategic queue items 2–6 + sidebar levels | queued (approved Session 25) |
| over-merge re-mint apply (Session 18) | STAGED, gated on Sam's dispatch (separate track) |

Pipeline viz correctly SKIPPED this checkpoint (no re-mint / auditor run / M-ID phase
change — the audit + remediation is a separate workstream).
