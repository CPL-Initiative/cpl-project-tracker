---
title: Session 55 Hand-off Prompt (data lane)
date: 2026-06-13
session: 54 → 55 hand-off (written at the Session-54 checkpoint — the auto-merge cohort made reviewable)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, auto-merge, ccr, triage, title-lane]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 54 — the full story)
  - docs/kb-notes/playbook-gated-bulk-autocuration.md (the durable pattern + the second-look surfacing)
  - kb/automerge_out/2026-06-12/ (pass-1 plan · report · apply_log)
moniker_suggestion: Session 54 was "Bruh Spaceranger" (Sam's christening, opening message — "explore new worlds"); claim your own
---

# Session 55 Hand-off Prompt — the data lane

Session 54 was a clean follow-through on Bruh Infinitus's auto-merge night:
verified the overnight regen, then made the 2,272-group cohort **reviewable**
(a ⚙ chip + a one-click Triage lane), shipped + dispatched, and refreshed the
Pipeline tab. The big open lever is the **title-similarity lane (5,457 groups)**
— a gated pass 2, but only on Sam's go. Paste the block below.

```
You are Session 55 on the CPL Project Tracker (the DATA lane; design lane
reads docs/session_52_handoff.md — coordinate via kb/cpl_todos.json).
Read these first, in order:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR
     unstable; §11 Session 53 + Session 54 subsections.
  2. docs/ccr_cluster_cleanup_lessons.md — Session 54 section.
  3. docs/kb-notes/playbook-gated-bulk-autocuration.md (incl. the
     "Surfacing the cohort for second-look" addendum).
  4. kb/automerge_out/2026-06-12/report.md (pass-1 receipt).

WHAT SHIPPED IN SESSION 54 (PR #428, merged + live):
  - ⚙ AUTO-MERGED CHIP + "Auto-merged" TRIAGE LANE in the CCR. The
    generator (export_unified_courses) stamps each surviving merge target
    with `auto_n` = how many of its folded members came from the bot
    (reviewed_by == "automerge-v1@bot"); emitted >0 only, in the single
    merge_members loop. The consumer (unified_courses.js) renders an amber
    ⚙ auto-merged chip (distinct from the cobalt ⛓ merged badge) + a
    ROW-LEVEL Triage lane (r.auto_n>0 — works without sign-in or the audit
    overlay; QS_TRIAGE deep-linkable). Verified end-to-end: 2,272 rows
    (941 UC-CUR-AUTO mints + 1,331 anchored), 3,588 folds, 0 leakage onto
    non-targets — exact match to the apply receipt. jsdom test
    tests/uc_auto_merged_chip.test.js (14 assertions); suite 43/43.
  - Code-only PR per the artifact policy; dispatched daily-dashboard.yml
    post-merge → auto_n is LIVE in unified_courses_data.js on main.
  - Pipeline tab #pl-section-remint refreshed (both HTMLs, Rule 4) — the
    auto-merge pass-1 story is now the "Most recent" card.
  - Verified the post-apply regen: worklist 9,087 → 6,583 groups
    (groups 257 · singleton 308 · family 6 · desc 390 · title 5,457 ·
    evidence 165), all 2,272 folds materialized.

YOUR PRIORITY QUEUE:
  1. TITLE-LANE PASS 2 — Sam's call (he second-looks pass 1 first via the
     new Triage lane). On his go: DRY-RUN ONLY — extend
     kb/_auto_merge_worklist.py with a title-lane config (high title-cosine
     + cross-college + band-purity gates, same planner shape as pass 1),
     emit a receipt under kb/automerge_out/<date>/, present counts. The
     lane is 5,457 groups — propose a high-confidence SUBSET, never the
     whole lane blind. Do NOT apply without sign-off; restamp the receipt's
     _status on apply.
  2. SECOND-LOOK FOLLOW-UPS: a one-click revert affordance for an
     individual auto-merged row (whole-cohort revert is already documented:
     delete reviewer_email='automerge-v1@bot'). Consider the ⚙ chip on the
     CSR/CER if they ever surface merged identities.
  3. CERAMIC-TECH (curator pick — surface to Sam, don't guess): ARTS M1201's
     curated discipline "Ceramic Technology" is a valid MQ name but isn't in
     discipline_canonical_subj4.json (148 names), so the SUBJ4 fold skips it
     (skip_unknown_disc). Fix = add a canonical SUBJ4 for it (_CANON_SUBJ4::
     Supabase pick) OR fold the row into "Art". Sam's domain.
  4. MILSTUDENTS WIRING (when it lands in the Custom Reports module):
     per-college JST-upload universe → upgrade the Veteran card. PRIVACY:
     VeteranID is a student id — aggregates only, never in committed
     artifacts (the ADR pattern).
  5. COCI TITLE-CORRECTION CAMPAIGN: kb/coci_title_corrections.json (395
     rows) — Sam takes it to the colleges; the queue regenerates (shrinks
     as sources get fixed).
  6. STANDING: the FLAGGED family queues (kin_pe_pass2_out), smog
     residuals, CIS↔CS close-out, C-ID router Phase 2+3b, CER statewide
     bucket, EACR College/System views (privacy ADR first).

PATTERNS THAT WORKED (Session 54):
  - Measure the flag against LIVE data before writing generator code (I
    confirmed the auto_n logic yielded exactly 2,272/941/1,331/3,588 from
    kb/coci_curation.json + the committed artifact BEFORE touching .py).
  - Verify the generator end-to-end with an ISOLATED export_unified_courses()
    run (pip install -r requirements.txt; the function is standalone, no
    main()), confirm the new field, then RESTORE artifacts → code-only PR.
  - Edit HTML on POST-REGEN main: I waited for the dispatched cron commit
    to land, reset to it, THEN edited the pipeline tab — no generated-file
    conflict (the To-Do's warning).
  - Row-level Triage lanes that don't depend on the audit overlay:
    special-case the label BEFORE the auditIndex lookup in passes().
  - send_later was NOT available this session; I used a background git-poll
    (sleep loop, run_in_background) to wait for the regen commit, and a
    background timer to re-check CI (webhooks deliver failures, not success).

SAFETY PATTERNS:
  - Auto-curation NEVER writes discipline rows (merge ≠ verify) and NEVER
    overwrites a human row. The cohort marker (reviewer_email) is the
    contract + the revert handle.
  - Bands never cross in merges. C-IDs/CCNs verbatim. Rule 5: never
    force-push main (feature branches may --force-with-lease post-squash).
  - Don't cat the big kb/coci_*.json or unified_courses_*.js — inspect via
    a vm-sandboxed node one-liner that prints counts/samples.
  - Code-only PRs for generator/consumer changes; dispatch the workflow to
    publish artifacts. The To-Do feed: bump _as_of, DELETE done items, ≤12.
```

Good hunting — the cohort is reviewable now; the title lane is the next frontier. 🛰️
