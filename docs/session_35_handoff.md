---
title: Session 35 Hand-off Prompt
date: 2026-06-04
session: 34 → 35 hand-off
status: hand-off — paste the fenced block into Session 35's first message
tags: [handoff, session-prompt, eacr, student-view, pii, audience-views, eligible-dataset]
related:
  - docs/eacr_consolidation_lessons.md (Session 34 section)
  - docs/kb-notes/methodology-standing-pii-guard.md (NEW)
  - docs/kb-notes/adr-cer-student-impact-counts-privacy.md (updated — per-college <2 + guard)
  - docs/kb-notes/eacr-consolidation-scope.md (the 3 audience views + gallery)
  - CLAUDE.md §11 "Session 34" subsection (end of §11)
moniker_suggestion: "Lucid Wozniak" was Session 34 (branch claude/lucid-wozniak-DHj8y) — claim your own
superseded: true
superseded_by: session_132_handoff.md
---

<!-- Lineage: Busy Feynman (32) → Sleepy Goodall (33) → Lucid Wozniak (34, 5 PRs:
     Student view v3 + the data-unblock loop + PII small-cell hardening). Pay it forward, 35. 🏅 -->

# Session 35 Hand-off Prompt

Session 34 ("Lucid Wozniak") shipped the first audience view + ran a long live thread with Sam
who unblocked the authenticated MAP data — which hardened the PII posture and precisely scoped
the one remaining data gap. **5 PRs, all merged + live.** Paste the block below.

## The prompt

```
You are Session 35 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy auto-merge
     gates [merge on green = clean OR unstable; do NOT wait for "Go!"], §6a/§9 EACR,
     §11 framing + the NEW "Session 34" subsection at the end of §11).
  2. docs/eacr_consolidation_lessons.md — the Session 34 section (the arc + 4 learnings).
  3. docs/kb-notes/methodology-standing-pii-guard.md — the 4-layer PII posture (NEW).
  4. docs/kb-notes/adr-cer-student-impact-counts-privacy.md — the privacy ADR (now incl. the
     per-college <2 suppression + the standing guard + the eligible-data gap).
  5. docs/kb-notes/eacr-consolidation-scope.md — the 3 audience views + versioned gallery.

WHAT SHIPPED IN SESSION 34 (all merged to main):
  - #301 EACR Student view (v3): a 3rd gallery renderer (v1 table / v2 credential / v3
    "🎒 Student view") in statewide_interactive.js. Pick a College/District/Region → each
    credential = ✅ available now / 🎯 likely-qualify (names the exact local course from
    statewide_prescriptive.js) / ○ aligned-program, + a "typically ~N units" headline; browse
    mode nudges to pick a college. Consumer-only, v1/v2 untouched. tests/eacr_student.test.js (27).
  - #302/#305 CER students-served: carry-forward (a session live-on-merge regen runs WITHOUT
    the PII CustomReport → was NULLing the public Students column; now carries forward last cron
    values) + robust _to_count() parse (int/float/comma/whitespace — the old int() silently
    zeroed "3.0"/"3,000" strings) + ExhibitID-strip + a detailed roll-up diagnostic line.
  - #303 header restyle: uniform meta row (one font/size/color = var(--light-blue), centered,
    interactive items as pills; h1 untouched). One scoped CSS block, Rule 4 mirrored.
  - #304 PII small-cell hardening (HEADLINE): per-college cohort counts (students/veterans/
    working_adults/apprentices) <2-suppressed ("<2"; Sam's threshold = mask only a singleton);
    34 existing singletons re-masked LIVE in both HTMLs; dropped View_CollegeContacts +
    View_CollegeUsersRoles from the fetch (unused → staff PII never hits the runner, 9→7);
    NEW tests/pii_guard.test.js (standing guard: fails build on a cohort <2 / students_served
    1-4 / out-of-domain email). A read-only PII audit confirmed the pipeline is
    column-selective + aggregate-only → the authenticated pull's new PII columns are never read.
  - THE DATA-UNBLOCK LOOP: Sam revised the MAP report PII-free + ran the daily workflow on main
    (I can't dispatch — session token 403s on actions:write). Verified safe: per-college
    student/veteran data flowed + <2-suppressed + guard green + Rule 4 intact + no NaN.

CURRENT STATE / THE ONE OPEN GAP:
  - The CER per-exhibit "Students" column is still "—". Root cause (confirmed by Sam, not a
    bug): the per-exhibit count he wants is students ELIGIBLE for CPL, which is in NEITHER the
    MAP dashboard NOR the Custom Report (served ≠ eligible; eligibility isn't at exhibit grain
    upstream). The join key is sound (coci_articulations.exhibit_id == raw MAP ExhibitID, 100%
    overlap). Sam is preparing a NEW dataset. The roll-up + suppression + carry-forward + column
    + guard are ALL ready to receive it.

PRIORITY / NEXT (in order):
  1. WIRE THE ELIGIBLE DATASET when Sam sends it. Inspect its shape; key on ExhibitID (the
     MAPICA-* values) or credential (unified_title); one eligible-count column; ANY format
     (CSV/JSON/new view). Plug into the existing students roll-up in
     export_credential_reference() (~line 5318). Decide replace-vs-alongside the served column
     (a "Served | Eligible" pair is reasonable). Same <5 suppression auto-applies; pii_guard
     already covers it. Small PR. (Sam: "you have it in our structure, so it should be easy.")
  2. COLLEGE + SYSTEM audience views (2nd + 3rd of the 3). Reuse the v3 Student-view renderer
     pattern (gallery, additive, v1/v2/v3 untouched, jsdom test). College = my-college lens
     (my articulations + my adoption options); System = statewide inequitable-access map from
     adoption_leverage × eligible-students — System NEEDS the privacy ADR finished first
     (adr-cer-student-impact-counts-privacy is the seed; small-cell-suppress everything).
  3. STANDING CARRYOVER: EACR v2 scope/generated-rec (producer-side → next cron); MID curation
     (CompTIA A+ fragmentation → Suggested-merges worklist); the Signal-B dedup leads (162,
     manual-review — exhibit-canonicalization skill, semantic not lexical).

PATTERNS THAT WORKED (Session 34):
  - "Unexpectedly 0" from a roll-up is a SOURCE question first, a bug question second. Confirm
    the join key + instrument the roll-up (dataset_found/rows/matched/students>0/unparseable)
    before assuming a bug. Here it was a missing input, not a bug.
  - Column-selective + aggregate-only reads are THE PII firewall — new PII columns in an
    authenticated pull are never read, so they can't leak. Back it with small-cell suppression
    + fetch-minimization + the standing guard (methodology-standing-pii-guard.md).
  - Re-mask committed data LIVE (don't wait for the cron) so the public site is immediately
    compliant — and so the guard passes on the currently-committed data.
  - I CAN'T dispatch workflows (403 actions:write) — Sam runs them from the Actions UI. Watch
    for the daily commit with a background `git fetch origin main` until-loop (no webhook for
    main commits; the watcher pings you when HEAD advances).
  - Small coherent PRs, merge on green (clean OR unstable counts), reuse the one session branch:
    after each squash-merge `git checkout -B <branch> origin/main`; force-push-with-lease the next.

SAFETY PATTERNS TO HONOR:
  - Rule 4: CPL_Dashboard.html == index.html (byte-identical). EACR/CER CSS injected from JS;
    the COLLEGE_ACTIVITY_DATA blob + header CSS live in BOTH HTMLs → mirror any edit.
  - Rules 1/2: don't hand-edit regenerated sections; preserve idempotency guards.
  - NEVER commit student/staff PII (SEC-10). Raw CustomReport is gitignored. Public counts =
    aggregate + suppressed (<5 credential / <2 per-college). The pii_guard test enforces it.
  - Feature branch + PR; auto-merge on green (clean OR unstable); never force-push main.
  - Supabase kb_curation/allowed_reviewers only; no destructive migrations w/o sign-off.

Pipeline viz is skippable when the M-ID pipeline doesn't move (it didn't in Session 34 — all
EACR/CER/dashboard/PII). A moniker is yours to claim.
```
