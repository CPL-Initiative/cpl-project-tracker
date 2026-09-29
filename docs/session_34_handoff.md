---
title: Session 34 Hand-off Prompt
date: 2026-06-04
session: 33 → 34 hand-off
status: hand-off — paste the fenced block into Session 34's first message
tags: [handoff, session-prompt, cer, ge-area, student-impact, canonicalization]
related:
  - docs/eacr_consolidation_lessons.md (Session 33 section)
  - docs/kb-notes/reference-ap-credit-ge-area-canonicalization.md (NEW)
  - docs/kb-notes/adr-cer-student-impact-counts-privacy.md (NEW)
  - CLAUDE.md §11 "Session 33" subsection + docs/roadmap_archive.md (NEW museum annex)
moniker_suggestion: "Sleepy Goodall" was Session 33 (branch claude/sleepy-goodall-E7dW1) — claim your own
superseded: true
superseded_by: session_132_handoff.md
---

<!-- Lineage: Legend 32 ("Busy Feynman", 8 PRs) → Legend 33 ("Sleepy Goodall", 6 PRs:
     the CLAUDE.md trim + the whole CER intelligence layer). Pay it forward, 34. 🏅 -->

# Session 34 Hand-off Prompt

Session 33 ("Sleepy Goodall") ran a marathon off Sam's live AP-card review + the
AP/IB/CLEP credit-policy docs he supplied: the staged CLAUDE.md trim + a full CER
prioritization/canonicalization layer. **6 PRs, all merged + live.** Paste the block below.

## The prompt

```
You are Session 34 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy auto-merge
     gates [merge on green = clean OR unstable; do NOT wait for "Go!"], §6a/§9 EACR,
     §11 framing + the NEW "Session 33" subsection at the end of §11). Note CLAUDE.md
     was TRIMMED — completed roadmap rows + Sessions ≤31 narratives now live in
     docs/roadmap_archive.md.
  2. docs/eacr_consolidation_lessons.md — the Session 33 section (the arc + 4 learnings).
  3. docs/kb-notes/reference-ap-credit-ge-area-canonicalization.md — THE canonicalization
     model: AP/IB/CLEP credit = a GE-AREA mapping (system-level), NOT a course fold.
  4. docs/kb-notes/adr-cer-student-impact-counts-privacy.md — aggregate-only + small-cell
     suppression <5 for any public student counts (SEC-10 lineage).

WHAT SHIPPED IN SESSION 33 (all merged to main):
  - #291 CLAUDE.md history→archive trim: 1908→1514 lines. 84 DONE roadmap rows + the
    Session 26-31 narratives moved to docs/roadmap_archive.md (one-line pointers left).
  - #292 CER R1 noise suppression: COMM M1038 "Group Communication" (Clovis) articulates
    to 61 credentials, all generic "Elective Course Credits." Producer flags elective-
    bucket identities (~100%-elective + ≥5 creds + ≤3 colleges → exactly COMM M1038) →
    consumer DEMOTES to a collapsed disclosure; subject-outliers get a visible review badge.
  - #293/#294 GE-Area exam-credit layer: AP credit is system-level (AB 1985 / AA 17-20;
    IB+CLEP title 5 §55052.5; current charts ESLEI 24-35). The canonical anchor is the
    GE Area + min units, NOT a course-identity fold (course-to-course = a LOCAL decision).
    kb/reference/ccc_ge_exam_credit.json (programs:{AP,IB,CLEP}; alias + char-prefix rules
    collapse the CER's legacy IB names) → per-row ge_credit; CER headlines it via
    renderGeApCredit(). 147/154 exam credentials joined. 4 source docs in docs/reference/.
  - #295 GE-Area grain view: a "Group: GE Area" CER mode (multi-bucket via groupKeysOf) —
    the CER/CCR/CSR grain family's exam-credit rollup; non-exam catch-all collapsed.
  - #296 CER "Students" impact column (PATH 1): per-credential students-served = SUM of
    MAP View_ArticulatedCollegeCourses.Students rolled up exhibit_id→unified_title;
    sortable column. PRIVACY: aggregate-only, suppress <5 (1-4 → "<5", exact never baked),
    test colleges excluded. Cron-only data → no-ops locally, lights up on the daily pull.
  - #297 Rule-8 checkpoint (docs).
  - #298 GE-Area COHERENCE CHECK (#3): discipline_ge_areas map baked as disc_ge_areas;
    consumer "⚠ off GE Area" badge + callout note. AUDIT FINDING: data already
    GE-coherent (1 non-bucket residual) — a future-proof cue.
  - #299 + apply — CPL-TYPE-DUPLICATE DETECTOR (#4): read-only kb/_detect_cpl_type_dupes.py
    (Signal A = &/and + punctuation collisions; Signal B = same-exhibit leads, manual only).
    APPLIED the 18 Signal-A groups (19 pairs) via credential_merges.json +
    _merge_credentials.py --apply (V1-V4 green); CER rows 2013 → 1994.

CURRENT STATE / HOW THE CER SHIPS:
  - CER ships LIVE-ON-MERGE: regen credential_reference_data.js locally
    (`python3 -c "import excel_to_dashboard as m; m.export_credential_reference()"`,
    needs `pip install openpyxl pandas`) + commit. The students-served roll-up reads the
    CustomReport (cron-only, gitignored for PII) → bakes null locally, populates on cron.
  - 6 committed CER jsdom test files now (npm test): cer / cer_geap / cer_gearea /
    cer_noise / cer_students / cer_ge_coherence = 77 assertions. ALWAYS whitelist new
    baked fields in adaptBakedRow (the Session-29 omitted-field trap bit twice).
  - Producer cron-path verified by kb/_verify_students_served.py (synthetic CustomReport).
  - Credential dedup tool: kb/_detect_cpl_type_dupes.py (read-only detector) →
    kb/credential_merges.json (decisions) → kb/_merge_credentials.py --apply (V1-V4).

REMAINING WORK (recommended-order #1-#4 ALL shipped — keep pushing or pick):
  - ELIGIBILITY side of student impact: blocked on Sam supplying an exhibit-keyed MAP
    eligibility export (today eligibility is only college×CPL-type, not per-exhibit). Same
    privacy ADR applies. He may send it — if so, add a "students eligible" column alongside.
  - SIGNAL-B DEDUP LEADS (162, manual-review): kb/_detect_cpl_type_dupes.py Signal B
    surfaces same-exhibit-different-phrasing pairs, but mixes true dupes (FAA "Airframe
    Mechanic Certification" vs "Mechanic Certificate — Airframe Rating") with sibling
    credentials (Airframe vs Powerplant, Calc AB vs BC). Lexical heuristics can't separate
    → needs a human who knows the credentials (exhibit-canonicalization skill domain).
  - THE 3 AUDIENCE VIEWS (Student/College/System) — the standing headline carryover.
    System needs the privacy ADR (now half-written in adr-cer-student-impact-counts-privacy).
  - Standing carryover: EACR v2 scope/generated-rec (producer-side → next cron); MID
    curation (CompTIA A+ fragmentation → Suggested-merges); the long-tail ~50 NEW-credential
    mints (exhibit-canonicalization skill).

PATTERNS THAT WORKED (Session 33):
  - DIAGNOSE IN THE DATA before building: the COMM bucket + the GE-Area reframe both came
    from grounding the screenshot in coci_articulations + the raw COCI list, not guessing.
  - Let the AUTHORITATIVE policy reframe the layer: Sam's Title-5 docs turned a course-fold
    re-mint (wrong) into a GE-Area reference layer (right + additive). Capture as a KB note.
  - Small coherent PRs, merge on green (unstable counts), reuse the one session branch:
    after each squash-merge `git checkout main && git fetch origin main && git reset --hard
    origin/main`; for the next PR work on main then `git stash` → `git checkout -B
    <branch> origin/main` → `git stash pop` → commit → `git push --force-with-lease`.

SAFETY PATTERNS TO HONOR:
  - Rule 4: CPL_Dashboard.html == index.html. CER CSS is injected from credential_reference.js
    → no HTML edit, no mirror. The CER data file + JS are single files (no mirror).
  - Rules 1/2: don't hand-edit regenerated sections; preserve idempotency guards.
  - NEVER commit student PII (SEC-10). Public student counts = AGGREGATE + suppress <5.
  - Feature branch + PR; auto-merge on green (clean OR unstable); never force-push main.
  - Supabase kb_curation/allowed_reviewers only; no destructive migrations w/o sign-off.

Pipeline viz is skippable when the M-ID pipeline doesn't move (it didn't in Session 33 —
all CER consumer/producer/reference layer). A moniker is yours to claim.
```
