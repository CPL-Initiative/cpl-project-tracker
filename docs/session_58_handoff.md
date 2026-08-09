---
title: Session 58 Hand-off Prompt (data lane)
date: 2026-06-16
session: 57 → 58 hand-off (written at the Session-57 checkpoint — Bruh Skydriver)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, consolidation, worklist, jaccard, title-lane]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 57 — the full story)
  - docs/similar_course_family_scope.md (the consolidation loosening + measure-first)
  - docs/kb-notes/adr-level-collapsing-consolidation.md (the over-merge decision)
  - docs/kb-notes/playbook-rekey-shared-db-from-alias-map.md (the Supabase re-key tool)
moniker_suggestion: Session 57 was "Bruh Skydriver"; claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 58 Hand-off Prompt — the data lane

Session 57 (Bruh Skydriver) shipped Sam's worklist-review starter tasks and the
big one: the **consolidation loosening** (the worklist now merges across levels by
default). The next lever is the deferred **member-join Jaccard** measurement, then
working/curating the ~10× bigger worklist. Paste the block below.

```
You are Session 58 on the CPL Project Tracker (the DATA lane; design lane reads
docs/session_52_handoff.md — coordinate via kb/cpl_todos.json).
Read these first, in order:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR unstable;
     §11 Session 56 + 57 subsections; the "Suggested-merges worklist" bullet
     (now LEVEL-COLLAPSING) + the unified_courses_suggestions.js table row.
  2. docs/ccr_cluster_cleanup_lessons.md — Session 57 section (the full story).
  3. docs/kb-notes/adr-level-collapsing-consolidation.md (why over-merge > under-merge).
  4. docs/similar_course_family_scope.md (the loosening + the deferred Jaccard).

WHAT SHIPPED IN SESSION 57 (PRs #441 + #442, merged + dispatched + LIVE):
  - Worklist popup polish (#441): "N of M" count moved into the title bar (subtitle
    + "drag to move" gone); proposed title prefers the ★ target's CLEANED name
    (client cleanTitle() strips "(NC)"); per-candidate ⓘ description toggle (lazy
    CPL_UC_DETAILS); Discipline shows inherited / pre-selects modal member disc on a
    mint (generator emits per-member `d`). CCR course-ID column wraps/clips.
  - "(NC)" title cleanup (#441): _normalize_common_titles.py gained a noncredit-paren
    strip (110 singleton titles; meaningful parens kept) — auto-merge auto-cleans
    future mints via regularize_title(); the 13 bot-minted curated unified_titles
    (all automerge-*@bot) stripped in Supabase kb_curation + the snapshot.
  - THE CONSOLIDATION LOOSENING (#442): _sug_sig went level-SAFE → level-COLLAPSING
    (folds level words + roman/word/digit ordinals + a–h section letters). Worklist
    regrouped 229→2,665 anchored, 217→2,519 singleton. Suggestions-only /
    curator-confirmed / reversible. Measure-first: kb/_similar_family_dryrun.py
    (7,849 families, 99% disc-unanimous; receipt gitignored — regenerable).
  - Tests 48→49 (tests/uc_worklist_polish.test.js). Both PRs code-only; cron/dispatch
    republished the artifacts.

YOUR PRIORITY QUEUE:
  1. THE MEMBER-JOIN JACCARD (deferred from S57, Sam endorsed it). Lower the
     title-match threshold 0.5 → ~0.4 in the member-row forward join so more raw
     college courses attach per identity. kb/README.md MANDATES measuring member-row
     flips FIRST: prototype the title-filtered raw-list join (kb/reference/
     coci_course_list.xlsx, 141k rows — read once, streaming, never cat), count how
     many member rows attach/detach at 0.4 vs 0.5, sample the 0.3–0.5 borderline
     band, and present before committing. It changes every identity's membership +
     unit/discipline aggregation + over-merge flags, so it's higher-blast-radius
     than the suggestions-only loosening — measure, then a code-only PR + dispatch.
  2. WORK / WATCH THE BIGGER WORKLIST. The worklist is ~10× bigger now. If Sam
     surfaces over-merge cases from the level-collapse (e.g. Elementary vs College
     Algebra grouping), the fix is usually a curator Skip/uncheck — but if a class
     of false-families recurs, consider a guard refinement in _sug_sig (e.g. keep
     a distinguishing token the collapse drops). Reversible; suggestions-only.
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

PATTERNS THAT WORKED (Session 57):
  - Defense-in-depth on display noise: fix the DATA (normalizer + Supabase source)
    AND the client (cleanTitle at proposal time) — clean regardless of stale data.
  - Curated unified_title is Supabase-synced: editing coci_curation.json alone is
    futile; UPDATE the kb_curation source, the snapshot follows. Scope bot-only
    cleanups to reviewer_email to preserve the cohort revert handle.
  - Suggestions-only changes are SAFE to be aggressive — the curator gates every
    merge. That's what let _sug_sig flip on one go-ahead.
  - Measure against the LIVE residual (post-auto-merge), not the raw catalog.
  - Code-only PRs; revert the regen artifacts; dispatch daily-dashboard.yml to publish.

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

Good hunting — the worklist is wide open for consolidation now; the Jaccard is the
next measured lever, and the curator gates everything. 🛫
