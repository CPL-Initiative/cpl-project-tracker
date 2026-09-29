---
title: Session 57 Hand-off Prompt (data lane)
date: 2026-06-15
session: 56 → 57 hand-off (written at the Session-56 checkpoint — Star Treader)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, z-scheme, title-lane, auto-merge, remint]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 56 — the full story)
  - docs/uc_cur_zscheme_remint_scope.md (the Z re-mint, now APPLIED)
  - docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md (Session 56 KB note)
  - docs/coursecontrolnumber_remint.md (the canonical re-mint playbook)
moniker_suggestion: Session 56 was "Star Treader"; claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 57 Hand-off Prompt — the data lane

Session 56 (Star Treader) built the UC-CUR → Z dry-run, got Sam's "Go now," and
landed the **full Rule-7 re-mint end-to-end** in one window (PR #439, both
workflows dispatched + md5-verified LIVE). The Z scheme is live everywhere. The
big remaining lever is the **title-lane pass-2** dry-run, plus the deferred Z
future-mint half. Paste the block below.

```
You are Session 57 on the CPL Project Tracker (the DATA lane; design lane reads
docs/session_52_handoff.md — coordinate via kb/cpl_todos.json).
Read these first, in order:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR unstable;
     §11 Session 55 + Session 56 subsections; Rule 7 "Latest instance" (the Z re-mint).
  2. docs/ccr_cluster_cleanup_lessons.md — Session 56 section (the full story).
  3. docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md (the re-key tool).
  4. docs/coursecontrolnumber_remint.md + docs/kb-notes/methodology-alias-map-
     resolution-semantics.md — the re-mint playbook + alias semantics.

WHAT SHIPPED IN SESSION 56 (PR #439, merged + LIVE + verified):
  - UC-CUR → Z-scheme re-mint APPLIED. The 4,053 synthetic UC-CUR-AUTO* ids →
    SUBJ Z<band><seq:03d> (e.g. BIOL Z9001; Z = curator/auto-minted Unified,
    needs attention — parallel to CCN C / minted M). Dry-run 7/7 gates; apply ==
    spec via the shared compute_plan(). Receipts kb/uc_cur_zscheme_out/2026-06-15/.
  - SUBJ4 = canonical of members' modal discipline WITH the umbrella exception
    (FL/KIN keep their split codes, never collapse to FLNG/KINE); band 9/1 from
    credit_status; persisted counter kb/uc_cur_zseq.json (option B).
  - Surface entirely inside kb_curation (4,053 self-keys + 10,682 merge_into; 0
    articulations/promotions), fresh-read md5-verified git↔live before the write.
  - NEW REUSABLE INFRA: kb/_rekey_kb_curation_supabase.py +
    .github/workflows/supabase-rekey.yml — re-key a shared DB from a committed
    alias map (service key, in CI; the map is too large to hand-pass as SQL).
    Use this for EVERY future re-mint's Supabase half.
  - Coupled recognition shipped same PR: unified_courses.js (a Z target had been
    mis-classified as C-ID), kb/_row_audit.py (Z_ID_RE: on-scheme, valid merge
    target, promotion candidate but NOT cluster_id_off_scheme). The generator
    needed NO change (Z disjoint from native ids → _target_identity → Unified).
  - Tests: tests/uc_zscheme_recognition.test.js (8) + tests/uc_cur_zscheme_
    dryrun_test.py (12); suite 48 green. Verified LIVE: Supabase 0 UC-CUR / 4,053
    Z (md5 == alias map), overlay rebuilt, unified_courses_data.js 4,053 Z rows
    all id_system Unified, 0 leakage in lazy files.

YOUR PRIORITY QUEUE:
  1. THE Z FUTURE-MINT HALF (deferred from Session 56 — option B's other half).
     Today NEW synthetic-Unified ids still mint as UC-CUR-* (they WORK via dual
     recognition, but aren't clean Z). Wire:
       - kb/_auto_merge_worklist.py mint (~line 199): UC-CUR-AUTO+md5 → a clean
         Z<band><seq> read+incremented from kb/uc_cur_zseq.json (the counter the
         re-mint seeded). Derive SUBJ4/band the same way the dry-run did
         (compute_plan's derive_subj4 — factor it out / import it).
       - excel_to_dashboard.py: a generator promote-step that turns any surviving
         client-minted UC-CUR-EXT* placeholder into a clean Z via the counter +
         re-keys its pointers (so curators never see churn). Update kb/uc_cur_zseq.json.
       - Then the auditor re-run: python3 kb/_row_audit.py + commit latest.json
         (so Z rows get audit chips + no false merge_into_orphan — the code is
         already Z-aware, just needs the re-run; it's ~9.4MB, heavy but fine).
  2. TITLE-LANE PASS 2 (still open, Sam's go). The planner ALREADY supports it:
     `python3 kb/_auto_merge_worklist.py --pass2-title` (cohort marker
     automerge-titlelane-v1; band-purity/dismissed/contested/≥2-live gates, NO
     units gate per Sam's whole-lane choice). 5,457 title groups. DRY-RUN, present
     counts, apply only on Sam's go (then run supabase-rekey-style apply +
     dispatch). Receipt kb/automerge_out/<date>-titlelane/.
  3. PER-ROW AUTO-MERGE REVERT: a one-click revert for a single auto-merged row
     (whole-cohort revert = delete reviewer_email='automerge-v1@bot'). Consider
     the ⚙ chip on CSR/CER if they surface merged identities.
  4. CERAMIC-TECH curator pick (surface to Sam): ARTS M1201's "Ceramic Technology"
     is a real MQ name but not in discipline_canonical_subj4.json → the fold skips
     it. Add a _CANON_SUBJ4:: pick or re-curate to "Art".
  5. MILSTUDENTS wiring (when it lands in Custom Reports — privacy: aggregates only).
     COCI title-correction campaign (kb/coci_title_corrections.json).
  6. STANDING: C-ID router Phase 2+3b, CER statewide bucket, EACR College/System
     views (privacy ADR first), smog residuals, flagged KIN/PE families.

PATTERNS THAT WORKED (Session 56):
  - Measure against LIVE committed data + the minted catalog BEFORE writing code
    (I sized the re-key at 4,053/10,682/0 and proved the generator needed no
    change — Z is disjoint from native ids — before touching a line).
  - md5 set-equality is the re-key verifier: pre-write git↔live (no drift),
    post-write result↔alias-map (correct). Compact + definitive.
  - compute_plan() shared by dry-run + apply = apply is literally the reviewed spec.
  - Read the alias file in CI; never hand-pass thousands of pairs as SQL.
  - Verify on the REPUBLISHED payload after the dispatch (0 UC-CUR, Z rows Unified).

SAFETY PATTERNS:
  - Rule 7 governs re-mints: dry-run FIRST, alias map committed, fresh-read at
    write, V-validate, atomic land in one cron window (before 10:17 UTC). Bands
    never cross; C-IDs/CCNs verbatim; only the synthetic tier gets re-keyed.
  - Auto-curation NEVER writes discipline (merge ≠ verify); the cohort marker is
    the revert handle. Rule 5: never force-push main.
  - Code-only PRs for generator/consumer; dispatch daily-dashboard.yml to publish
    artifacts. The Supabase half = supabase-rekey.yml (service key in CI).
  - merge-on-green = clean OR unstable. To-Do feed: bump _as_of, DELETE done
    items, ≤12. Watch your PR + drive it to merged + dispatched + verified.
```

Good hunting — Z is live, the re-key infra is reusable, and the title-lane is
the next big curation lever. 🛰️
