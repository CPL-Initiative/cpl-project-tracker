---
title: Session 30 Hand-off Prompt
date: 2026-06-02
session: 29 → 30 hand-off ("Two-Niner" → next)
status: hand-off — paste the fenced block into Session 30's first message
tags: [handoff, session-prompt, eacr, cer, ccr, csr, three-grains, audience-views]
related:
  - docs/eacr_consolidation_lessons.md (Session 29 narrative + the three grains)
  - docs/kb-notes/eacr-consolidation-scope.md (EACR scope + 3 audience views + backlog)
  - docs/kb-notes/methodology-ship-generator-changes-live-on-merge.md (NEW this session)
  - docs/kb-notes/methodology-versioned-prototype-gallery.md
  - CLAUDE.md §6a (CPL Analytics) + §9 (EACR identity) + §11 "Session 29" subsection
moniker_suggestion: Bruh 30 / "Thirty" / "Tres-Cero" — or claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 30 Hand-off Prompt

Session 29 ("Two-Niner") opened cold after a bricked/parallel-session scare, ran a
clean **diagnostic** (the "lost work" was a stale `origin/main` ref — never a real
loss), then shipped **4 merged PRs** that complete the **"same data, three grains"**
family on the articulation layer. Paste the fenced block into Session 30.

## The prompt

```
You are Session 30 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy
     auto-merge gates [merge on green = clean OR unstable, no waiting for "Go!"],
     §6a CPL Analytics / Exhibit Adoption, §9 EACR identity, §11 + the new
     "Session 29" subsection at the very end of §11).
  2. docs/eacr_consolidation_lessons.md — the Session 29 section (the three grains +
     the patterns).
  3. docs/kb-notes/eacr-consolidation-scope.md — EACR scope, the versioned gallery,
     the 3 AUDIENCE VIEWS (Student/College/System — still the headline build), backlog.
  4. docs/kb-notes/methodology-ship-generator-changes-live-on-merge.md (NEW) — which
     generated artifacts ship live-on-merge vs next-cron, and how to verify additive.

WHAT SHIPPED IN SESSION 29 (all merged to main, all live):
  - #259 CCR INVERSE VIEW — expand a CCR (Common Course Reference) row → all aligned
    exhibits/credentials that articulate to that course (mirror of the EACR). Producer
    _build_aligned_exhibits_by_course() → committed lazy file unified_courses_aligned.js
    (window.CPL_UC_ALIGNED, 2,355 courses). Consumer in unified_courses.js. jsdom 13/13.
  - #260 CSR ROLLUP — a sortable "CPL opportunities" column on the Common Subjects
    Reference tab + a credential-list modal. Producer _build_cpl_by_discipline() →
    committed kb/discipline_cpl_rollup.json (97 disciplines). Consumer canonical_subj4.js.
    Completes CER/EACR (credential) · CCR (course) · CSR (discipline). jsdom 12/12.
  - #261 EACR FILTER LIFT + DARKER TITLES — filters were inside the v1 <details>; lifted
    to a page-level dark bar above the whole gallery (shared by all views). Darkened
    .sw-gallery-sum gold #C9A84C → navy #0A2240 (was washed out on the light page).
    Consumer-only (statewide_interactive.js). jsdom 13/13.
  - #262 CER ENRICHMENT — per credential's expanded detail: scope chips (🏛 CCC + 🏠
    Local; "⚙ CCC Generated · consideration only" when only Local), CPL-type chips, the
    statewide standard rec (modal CCC) OR a generated suggestion (modal across all,
    labeled NOT official per §11), and green(articulated)/orange(potential, from
    adoption_leverage, over-merged withheld) college badges + "+N more".
    export_credential_reference() emits 5 new fields; consumer renderScopeAndBadges().
    jsdom 17/17.

PRIORITY OPTIONS FOR SESSION 30 (Sam picks):
  - CER UNCLASSIFIED-TRIAGE — the original "CER triage" ask: the 105 unclassified
    exhibit cards (no credential identity) → a reviewer assigns each an existing/new
    unified_title (folds it into a credential). Reuse kb/_audit_exhibits.py's
    unclassified flagging; surface as a CER worklist. Producer regen is live-on-merge.
  - THE 3 AUDIENCE VIEWS (Student/College/System) — still the headline. Build as v3+
    gallery renderers over the SAME consolidated + prescriptive data. Student first
    (reuse buildCredentialView + buildPrescriptiveHtml + a near-me/region filter; keep
    v1/v2 untouched, graduate the winner). System needs a PRIVACY ADR first (aggregate
    eligible-student counts only, NO StudentID/PII).
  - EACR v2 version of the CER scope/generated-rec treatment (producer-side on
    statewide_data.js → materializes NEXT CRON, not on merge — see the live-on-merge note).
  - MID curation passes (CompTIA A+ fragmentation) → the Suggested-merges worklist;
    tightens the CCR/CER/CSR lists automatically as curation lands.

PATTERNS THAT WORKED (Session 29):
  - SHIP GENERATOR CHANGES LIVE-ON-MERGE when the artifact regenerates from committed
    inputs: factor the build behind a callable (export_*/_write_*), regenerate locally,
    commit it, prove additive via a structural old-vs-new diff (same rows, only new keys,
    0 value changes). CER + CCR + CSR data all qualify; EACR's statewide_data.js does NOT
    (raw MAP pull) → next-cron.
  - WATCH THE CONSUMER ADAPTER — adaptBakedRow() (CER) whitelists fields; new producer
    fields are silently dropped until added there. Grep the consumer before assuming flow.
  - DAILY CRON IS A MID-FLIGHT MERGE HAZARD — if it regenerates your artifact on main
    while the PR is open, the PR goes `dirty`. Rebase onto main, RE-RUN THE PRODUCER to
    regenerate (never hand-merge a minified one-liner), re-verify additive, force-push.
  - jsdom-TEST THE REAL CONSUMER — run the actual *.js IIFE in jsdom with a minimal data
    fixture + stubbed fetch. (NODE_PATH=<repo>/node_modules; jsdom is npm-installed,
    node_modules is gitignored.) Caught the CSR grouped-by-default render + a thead-row
    selector quirk + confirmed wiring survived the EACR filter-bar move.
  - DIAGNOSE BEFORE REBUILDING after a freeze: `git fetch origin main` (alone) + compare;
    a stale tracking ref can fake a huge divergence (playbook-resume-frozen-session...).

SAFETY TO HONOR:
  - Rules 1 (generator not HTML), 2 (idempotency guards), 4 (index.html ==
    CPL_Dashboard.html — but the curator-tab JS files [unified_courses.js,
    canonical_subj4.js, credential_reference.js, statewide_interactive.js] are SINGLE
    static assets, no mirror), 5 (never force-push main).
  - Don't read/cat big files (statewide_data.js 6.4MB, credential_reference_data.js
    2.3MB, kb/coci_*.json tens of MB, coci_course_list.xlsx 24MB) — inspect via python
    counts/samples. Loading into python is fine; printing the whole thing is not.
  - MERGE POLICY: PRs as draft → ready immediately → squash-merge on green (clean OR
    unstable) in the SAME turn. Sync local to merged main + force-with-lease the branch
    after each merge. Don't wait for Sam's review on the session's own work.

WAITING ON SAM (carry forward): MAP service credential (then set MAP_API_KEY + dispatch
once — docs/map_api_auth_handoff.md); Cloudflare worker redeploy + WAF (Session-26 #233,
inert until redeployed); repo "Allow auto-merge" toggle. Branch: this session reused the
ONE designated session branch (claude/sweet-cannon-ckarZ), force-with-lease between
merges — works fine.
```

## Carryover status

| Item | Status |
|---|---|
| CCR inverse view / CSR rollup / EACR filter-lift / CER enrichment | **DONE + MERGED** (#259/#260/#261/#262) |
| "Same data, three grains" family (CER/EACR · CCR · CSR) | **COMPLETE** |
| CER unclassified-triage (the original "CER triage" ask) | **NEXT — not started** |
| 3 audience views (Student/College/System) | **SCOPED; headline build.** System needs a privacy ADR |
| EACR v2 scope/generated-rec treatment | deferred (producer-side there → next cron) |
| MID curation passes (CompTIA A+ fragmentation) | backlog → Suggested-merges worklist |
| C-ID prescriptive leverage (30.4k slots) | deferred (heavier join via coci_course_list.xlsx CIDNumber) |
| MAP credential / Cloudflare redeploy+WAF / Allow-auto-merge toggle | **WAITING ON SAM** |

Pipeline viz correctly SKIPPED this checkpoint (the work was the articulation-layer
reference surfaces — CER/EACR/CCR/CSR — not the M-ID pipeline; no re-mint / auditor run
/ phase change).
