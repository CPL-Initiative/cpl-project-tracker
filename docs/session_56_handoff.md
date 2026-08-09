---
title: Session 56 Hand-off Prompt (data lane)
date: 2026-06-15
session: 55 → 56 hand-off (written at the Session-55 checkpoint — Bruh Nebula)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, uc-cur, z-scheme, remint, worklist, title-lane]
related:
  - docs/uc_cur_zscheme_remint_scope.md (the Z-scheme re-mint scope — your priority)
  - docs/ccr_cluster_cleanup_lessons.md (Session 55 — the full story)
  - docs/coursecontrolnumber_remint.md (the canonical re-mint playbook)
  - docs/kb-notes/methodology-promoted-record-ghosts-in-worklists.md (Session 55 KB note)
moniker_suggestion: Session 55 was "Bruh Nebula"; claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 56 Hand-off Prompt — the data lane

Session 55 (Bruh Nebula) was a fast, Sam-interactive worklist-clarity pass + the
scoping of his next re-mint. Four PRs landed (#434–#437). The big open lever is
the **UC-CUR → Z-scheme re-mint** — Sam approved a FULL re-key; the scope is
written, the dry-run is yours to build. Paste the block below.

```
You are Session 56 on the CPL Project Tracker (the DATA lane; design lane
reads docs/session_52_handoff.md — coordinate via kb/cpl_todos.json).
Read these first, in order:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR
     unstable; §11 Session 54 + Session 55 subsections.
  2. docs/uc_cur_zscheme_remint_scope.md — YOUR PRIORITY (the Z-scheme).
  3. docs/coursecontrolnumber_remint.md — the canonical re-mint playbook
     (Rule 7: dry-run → alias map → fresh-read → atomic land).
  4. docs/ccr_cluster_cleanup_lessons.md — Session 55 section.
  5. docs/kb-notes/methodology-alias-map-resolution-semantics.md.

WHAT SHIPPED IN SESSION 55 (PRs #434–#437, all merged + live):
  - #434 CCR worklist ★ MERGE-TARGET BADGE — the surviving identity (the
    §10 CCN>C-ID>M-ID>Unified pick) is badged + a dynamic note explains the
    "common course" slot + the 2-candidate case. Live as checkboxes toggle;
    reference-equality (NOT id) so duplicate-id rows don't both light up.
  - #435 SELF-MERGE GHOSTS GONE + DISCIPLINE PICKER CLARITY. Generator now
    skips singletons whose id is already a payload row (export_unified_courses
    _sug_row_ids) — a promoted singleton was being re-offered as its own
    ghost (20→0 anchored groups, verified live). Discipline picker now
    DISABLES + explains itself (only written on a fresh mint, ignored on a
    merge-into). KB note: methodology-promoted-record-ghosts-in-worklists.md.
  - #436 "⌕ MERGE INTO A DIFFERENT EXISTING COURSE" search picker — reuses
    the ⚇ Unify index (CPL_UC_INDEX) so a curator can redirect a merge to ANY
    identity the title-signature grouping won't surface (e.g. a real Anatomy &
    Physiology C-ID). Folds the whole group into it; it keeps its
    identity/title/discipline (title "" so doConsolidate won't rename it).
  - #437 UC-CUR → Z-SCHEME SCOPE (docs only, NO code). Sam's decision: FULL
    re-key of the 4,053 UC-CUR-* ids → SUBJ Z<band><seq> (e.g. BIOL Z9001).
  - All three UI PRs are static unified_courses.js (live on merge); #435 also
    touched the generator → dispatched. Suite 44→47.

YOUR PRIORITY QUEUE:
  1. THE Z-SCHEME DRY-RUN (Sam approved the re-key; build the dry-run, do
     NOT apply without his sign-off). Per docs/uc_cur_zscheme_remint_scope.md:
       - kb/_uc_cur_zscheme_dryrun.py: read the 4,053 UC-CUR targets + their
         members from kb/coci_curation.json (fresh-read semantics noted), derive
         (SUBJ4, band) per target [modal member subject_4letter / the canonical
         map kb/discipline_canonical_subj4.json when disciplined; band 9=noncredit
         / 1=credit from credit_status], assign Z<band><seq:03d> by normalized-
         title sort, emit kb/uc_cur_zscheme_out/<date>/alias_map.json +
         report.md + a collision check (Z can't collide with M/C — different CTI
         letter — but assert no two targets share a Z).
       - Decide the persisted-counter question (scope recommends option B —
         a kb/uc_cur_zseq.json counter so the daily auto-merge doesn't renumber).
       - Present counts to Sam. Restamp the receipt _status on apply.
     Re-key surface (measured): 4,053 targets + 4,053 self-keyed title rows +
     10,682 merge_into pointers; 0 articulations/promotions. ALL inside
     kb_curation / kb/coci_curation.json + Supabase (fresh-read at write).
     Code touch points (update on apply, behind ONE shared recognition helper):
     unified_courses.js (UC-CUR mint ~992, UC-CUR-EXT ~1125, /^UC-CUR-/ ~908,
     the #436 override regex), kb/_auto_merge_worklist.py (~199),
     excel_to_dashboard.py _target_identity (~6715), kb/_row_audit.py (~265,
     1095, 1173 — Z is ON-scheme; re-tune cluster_id_off_scheme).
  2. TITLE-LANE PASS 2 — still open (Sam's go). 5,457 title groups; DRY-RUN
     a high-cosine, cross-college, band-gated SUBSET via the same
     kb/_auto_merge_worklist.py planner. Receipt under kb/automerge_out/.
  3. SECOND-LOOK FOLLOW-UPS: per-row revert for an auto-merged row (cohort
     revert = delete reviewer_email='automerge-v1@bot'); ⚙ chip on CSR/CER.
  4. CERAMIC-TECH curator pick (surface to Sam): add a canonical SUBJ4 for
     "Ceramic Technology" OR re-curate ARTS M1201 to "Art".
  5. MILSTUDENTS wiring (when it lands in Custom Reports — privacy: aggregates
     only). COCI title-correction campaign (kb/coci_title_corrections.json).
  6. STANDING: flagged KIN/PE families (kin_pe_pass2_out), smog residuals,
     C-ID router Phase 2+3b, CER statewide bucket, EACR College/System views
     (privacy ADR first).

PATTERNS THAT WORKED (Session 55):
  - Measure against LIVE committed data before writing code (I sized the ghost
    bug at 20/262 and the UC-CUR re-key at 4,053/10,682/0 from the artifacts +
    kb/coci_curation.json BEFORE touching .py).
  - Verify a generator fix on the REPUBLISHED payload, not just locally: after
    #435 merged + the dispatch ran, I confirmed 20→0 ghost groups on main's
    unified_courses_suggestions.js.
  - Three small focused PRs > one big one; sibling branch for the independent
    docs PR (#437) off main.
  - Commit the jsdom test that guards the failure mode (the ghost reproduction
    uses the exact BIOL M90BE shape from Sam's screenshot).
  - Don't cat the big kb/coci_*.json / unified_courses_*.js — inspect via a
    node/python one-liner that prints counts/samples.

SAFETY PATTERNS:
  - Rule 7 governs the Z re-mint: dry-run FIRST, alias map committed, fresh-read
    kb_curation at write, V-validate, atomic land in one cron window (10:17 UTC).
    Bands never cross; C-IDs/CCNs verbatim; only the synthetic Unified tier gets Z.
  - Auto-curation NEVER writes discipline (merge ≠ verify); the cohort marker is
    the revert handle. Rule 5: never force-push main.
  - Code-only PRs for generator/consumer changes; dispatch daily-dashboard.yml
    to publish artifacts. To-Do feed: bump _as_of, DELETE done items, ≤12.
  - merge-on-green = clean OR unstable (don't over-wait for clean; #436 merged
    on unstable while TruffleHog re-queued — diff was plainly secret-free).
```

Good hunting — the worklist is clearer, the cohort's reviewable, and the
Z-scheme is scoped and waiting for its dry-run. 🌌
