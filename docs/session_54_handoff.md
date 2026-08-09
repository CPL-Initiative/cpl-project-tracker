---
title: Session 54 Hand-off Prompt (data lane)
date: 2026-06-12
session: 53 → 54 hand-off (written at the Session-53 checkpoint — the night auto-merge pass 1 applied)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, auto-merge, ccr, mojibake, second-look, title-lane]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 53 — the full story)
  - docs/kb-notes/playbook-gated-bulk-autocuration.md (the durable pattern)
  - kb/automerge_out/2026-06-12/ (plan · report · apply_log)
moniker_suggestion: Session 53 was "Bruh Infinitus" (Sam's christening, 2026-06-12 23:14 UTC — "you have taken to there and beyond"); claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 54 Hand-off Prompt — the data lane

Session 53 was Sam-interactive end to end: his worklist screenshots → popup
chrome; his KPI screenshots → the card batch; his mojibake find → the repair
+ COCI queue; his "auto curate these" → **auto-merge pass 1 APPLIED the same
night** (2,272 groups, 5,838 rows, 0 conflicts). Paste the block below.

```
You are Session 54 on the CPL Project Tracker (the DATA lane; design lane
reads docs/session_52_handoff.md — coordinate via kb/cpl_todos.json).
Read these first, in order:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR
     unstable; §11 Session 51 + Session 53 subsections.
  2. docs/ccr_cluster_cleanup_lessons.md — Session 53 section.
  3. docs/kb-notes/playbook-gated-bulk-autocuration.md.
  4. kb/automerge_out/2026-06-12/report.md + apply_log.json.

WHAT SHIPPED IN SESSION 53 (PRs #418–#424, all merged + published):
  - AUTO-MERGE PASS 1 APPLIED: kb/_auto_merge_worklist.py planned the
    dependable lanes (anchored + cross-college singletons; band-purity gate
    caught 325 credit/noncredit mixes; 214 same-college + 4 dismissals
    honored) → 5,838/5,838 kb_curation rows, 0 conflicts, server-side
    md5-pinned apply. Cohort: reviewer_email='automerge-v1@bot' (2,272
    targets, 941 UC-CUR-AUTO* mints). Revert = delete the cohort.
  - Worklist popup: drag bar + ✕ + proposal framing (#418). 4 artifact-
    pinned test files re-pinned to the normalized-title era (#419).
  - KPI batch (#420): adoption card folded into Statewide Exhibits
    ("Adopting Colleges" breakdown + blank-adopter guard), Veteran ⭐ +
    "JSTs Uploaded" + real colleges-with-a-JST count, quickstart width.
  - Mojibake (#421): decode-loop repair at raw-title ingestion (3 case
    forms incl. the title-caser's own "ã‚â"/"Ã‚â" mangles), 395 member
    titles repaired + queued in kb/coci_title_corrections.json, CCR
    "⚠ fix in COCI" chip, 63 identity titles re-fixed.

YOUR PRIORITY QUEUE:
  1. VERIFY THE POST-APPLY REGEN (a dispatch ran ~22:49 + the next cron):
     CCR shows 2,272 folds (⛓ merged badges), worklist drops the consumed
     groups (~9,087 → ~6,800), suite green against the NEW artifacts —
     artifact-pinned tests (uc_cid_routing/evidence/kinship/title) may
     legitimately shift again; re-pin mechanism-style if so (Session 53
     did this exact exercise — see #419's shape).
  2. ⚙ AUTO-MERGED CHIP + TRIAGE LANE: reviewer_email travels through
     _apply_curation.py into kb/coci_curation.json — emit a per-row flag
     from export_unified_courses() for rows whose merge/title came from
     'automerge-v1@bot', chip them in the CCR, add a Triage mode
     ("Auto-merged") so the second-look queue is one click. jsdom test.
  3. TITLE-LANE PASS 2 DECISION (Sam's call after he spot-checks pass 1):
     the 🏷 title-similarity lane is 5,549 groups — propose a high-cosine
     cross-college gated subset using the same planner (new lane config),
     dry-run first, same receipt discipline.
  4. MILSTUDENTS WIRING (when it lands in the Custom Reports module):
     per-college JST-upload universe → upgrade the Veteran card's Basic
     Training count + solve the P1-style gaps Sam flagged. PRIVACY:
     VeteranID is a student id — aggregates only, never in committed
     artifacts (the ADR pattern).
  5. COCI TITLE-CORRECTION CAMPAIGN: kb/coci_title_corrections.json (395
     rows, Glendale 36 + Canyons 29 top) — Sam takes it to the colleges;
     keep the queue regenerating (it shrinks as sources get fixed).
  6. STANDING: the FLAGGED family queues (kin_pe_pass2_out), smog
     residuals, CIS↔CS close-out, C-ID router Phase 2+3b, CER statewide
     bucket, EACR College/System views (privacy ADR), pipeline-tab refresh
     (#tab-pipeline #pl-section-remint — deferred this checkpoint to avoid
     racing the publish regen; add the auto-merge line in BOTH HTMLs).

PATTERNS THAT WORKED (Session 53):
  - Belt-check assertions before any apply (uniqueness gate caught a payload
    dupe + 20 degenerate groups).
  - Server-side md5-pinned apply (DB fetches the SHA-pinned committed
    receipt; ON CONFLICT DO NOTHING = humans always win; extension dropped
    after). Nothing big transits chat.
  - Fresh-read-at-write-time, every time (live counts + latest timestamp
    vs the plan's input state).
  - Sam's screenshots are the spec; ship small PRs, merge on unstable,
    dispatch the workflow, hard-refresh.

SAFETY PATTERNS:
  - Auto-curation NEVER writes discipline rows (merge ≠ verify) and NEVER
    overwrites a human row. The cohort marker is the contract.
  - Bands never cross in merges. C-IDs/CCNs verbatim. Rule 5: never
    force-push main (feature branches may --force-with-lease post-squash).
  - Don't cat the big kb/coci_*.json. The To-Do feed: bump _as_of, DELETE
    done items, ≤12.
```

Good hunting — the worklist is a third smaller than yesterday. 🧹
