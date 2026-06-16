---
title: Session 59 Hand-off Prompt (data lane)
date: 2026-06-16
session: 58 → 59 hand-off (written at the Session-58 checkpoint — Bruh Skyleader)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, consolidation, worklist, jaccard, suggested-merges]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Sessions 56–58 — the full story)
  - docs/kb-notes/adr-level-collapsing-consolidation.md (the over-merge decision)
  - docs/similar_course_family_scope.md (the consolidation loosening + measure-first)
  - docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md (the Supabase re-key tool)
moniker_suggestion: Session 58 was "Bruh Skyleader"; claim your own
---

# Session 59 Hand-off Prompt — the data lane

Session 58 (Bruh Skyleader) shipped three Suggested-merges refinements off Sam's
Algebra-worklist screenshot. The next lever is still the deferred **member-join
Jaccard** measurement, then working/curating the now-bigger worklist. Paste the
block below.

```
You are Session 59 on the CPL Project Tracker (the DATA lane; design lane reads
docs/session_52_handoff.md — coordinate via kb/cpl_todos.json).
Read these first, in order:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR unstable;
     §11 Session 57 + 58 subsections; the "Suggested-merges worklist" bullet
     (now LEVEL-COLLAPSING + SEGMENT-FOLDING) + the unified_courses_suggestions.js
     table row.
  2. docs/ccr_cluster_cleanup_lessons.md — Session 58 section (the full story).
  3. docs/kb-notes/adr-level-collapsing-consolidation.md (why over-merge > under-merge).
  4. docs/similar_course_family_scope.md (the loosening + the deferred Jaccard).

WHAT SHIPPED IN SESSION 58 (one code-only PR, merged + dispatched + LIVE):
  - TASK 1 — override picker repopulates + renames. Picking a NON-official course
    from "⌕ Merge into a different existing course" now pulls its CLEANED title
    into the Proposed-title box, EDITABLE; on Confirm the edited title renames the
    target (unified_title write). Official C-ID/CCN stays read-only/firewalled
    (unchanged; uc_worklist_override_target still proves no write on ANAT 100).
  - TASK 2 — segment-word fold in _sug_sig. Added _SUG_SEGMENT = {part, semester,
    module, half, level, levels} so structural divider words stop fragmenting a
    family: "Algebra 1-2, Semester 1" / "Elementary Algebra, Part 1" / "Algebra
    3-4" now group under one 'algebra' signature. Measured by
    kb/_sug_segment_dryrun.py: 8,491→8,352 groups, +165 identities into families,
    max 44→60; Linear/College/Pre-Algebra correctly STAY apart (distinguishing
    token survives). Suggestions-only / curator-confirmed / reversible.
  - TASK 3 — completion note. New merge_note curation field end-to-end: a popup
    "Completion note" input → _apply_curation.py FIELDS → generator emits r.note →
    consumer ⚑ note chip + "Completion note" line in the ⓘ modal + live overlay
    (fetchOverlay pulls merge_note, replayLiveMerges threads it). Firewalled like
    unified_title (never on an official anchor). For "both parts must be completed
    for full credit" on a segmented 1-2 / A-B mint.
  - Tests 49→50 (tests/uc_worklist_note_rename.test.js). PR code-only; the daily
    cron/dispatch republishes unified_courses_suggestions.js + the data artifacts.

YOUR PRIORITY QUEUE:
  1. THE MEMBER-JOIN JACCARD (deferred since S57, Sam endorsed it). Lower the
     title-match threshold 0.5 → ~0.4 in the member-row forward join so more raw
     college courses attach per identity. kb/README.md MANDATES measuring member-row
     flips FIRST: prototype the title-filtered raw-list join (kb/reference/
     coci_course_list.xlsx, 141k rows — read once, streaming, never cat), count how
     many member rows attach/detach at 0.4 vs 0.5, sample the 0.3–0.5 borderline
     band, present before committing. Higher blast radius than the suggestions-only
     work (changes every identity's membership + unit/discipline aggregation +
     over-merge flags) — measure, then a code-only PR + dispatch.
  2. WORK / WATCH THE BIGGER WORKLIST. If Sam surfaces over-merge cases from the
     segment-fold (e.g. an 'algebra' family pulling in something genuinely
     different), the fix is usually a curator Skip/uncheck — but if a CLASS of
     false-families recurs, tighten ONE token in _SUG_SEGMENT (e.g. drop 'level'
     if it over-pulls) and re-measure with kb/_sug_segment_dryrun.py. Reversible;
     suggestions-only.
  3. TITLE-LANE PASS 2 (still open from S56, Sam's go). `python3
     kb/_auto_merge_worklist.py --pass2-title` (marker automerge-titlelane-v1;
     band-purity/dismissed/contested/≥2-live gates, NO units gate). DRY-RUN, present
     counts, apply only on Sam's go, then supabase-rekey + dispatch.
  4. THE Z FUTURE-MINT HALF (deferred S56): wire kb/_auto_merge_worklist.py mint +
     an excel_to_dashboard.py promote-step to the persisted counter kb/uc_cur_zseq.json
     so NEW merges get clean Z ids; then re-run python3 kb/_row_audit.py + commit
     latest.json (Z rows get audit chips; code already Z-aware).
  5. PER-ROW AUTO-MERGE REVERT (one-click revert for a single auto-merged row;
     whole-cohort = delete reviewer_email='automerge-v1@bot'). MilStudents wiring +
     COCI title-correction campaign (kb/coci_title_corrections.json) when they land.
  6. STANDING: ceramic-tech curator pick (ARTS M1201); C-ID router Phase 2+3b; CER
     statewide bucket; EACR College/System views (privacy ADR first); smog residuals.

PATTERNS THAT WORKED (Session 58):
  - Two axes, not one: Session 57 folded the LEVEL axis; the residual fragmentation
    was the STRUCTURAL divider axis (part/semester/half/level). Fold the words that
    mean "this course is in N pieces," KEEP the words that mean a different course.
  - TIGHT fold set beats broad. Excluded section/unit/course/series/term — each is
    a real content noun somewhere. 6 words got the families with zero mega-group
    cross-contamination (verified in the dry-run's biggest-groups print).
  - A new curation field = ~4 small edits (UI capture → FIELDS → generator emit →
    consumer render) + the live-overlay pull (fetchOverlay + replayLiveMerges) so
    it shows on reload before the daily bake. Reuse the !tgtOfficial firewall.
  - Suggestions-only changes are SAFE to be aggressive — the curator gates every
    merge. Measure for sanity (mega-group guard), not for permission.

SAFETY PATTERNS:
  - merge-on-green = clean OR unstable (don't over-wait for clean). Watch your PR,
    drive it to merged + dispatched + verified. Never force-push main (Rule 5);
    feature branches force-with-lease freely post-squash (auto-delete is ON, so a
    stale local branch ref needs `git fetch --prune` then a fresh push).
  - Supabase kb_curation is LIVE + shared: targeted, non-destructive curation edits
    only; never touch auth/Redirect-URL or the projects/budget/personnel tables.
  - The member-join Jaccard needs a member-flip measurement BEFORE committing
    (kb/README.md) — don't bundle it with a suggestions-only change.
  - To-Do feed (kb/cpl_todos.json): bump _as_of, DELETE done items, ≤12, keep
    counts current. Rule 8 checkpoint ≈ every ~100K tokens.
```

Good hunting — the worklist keeps getting more useful; the Jaccard is the next
measured lever, the override-rename + completion-note round out the popup, and
the curator gates everything. 🛫
