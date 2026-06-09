---
title: Session 38 Hand-off Prompt
date: 2026-06-09
session: 37 → 38 hand-off
status: hand-off — paste the fenced block into Session 38's first message
tags: [handoff, session-prompt, cer, credential-dedup, signal-b, exhibit-canonicalization]
related:
  - docs/kb-notes/methodology-credential-dedup-triage.md (the triage taxonomy this session produced)
  - docs/kb-notes/playbook-cer-credential-merge.md (the merge mechanism)
  - docs/eacr_consolidation_lessons.md (Session 37 section)
  - CLAUDE.md §11 "Session 37" subsection
  - docs/research_workexp_crossdisc_remint_scope.md (the cross-disc re-mint, the scope-doc template)
moniker_suggestion: Sessions 35-37 ran mostly unnamed; if you want one, claim it — lineage below
---

<!-- Lineage: Lucid Wozniak (34) → CER consolidation (35) → perf + cross-disc
     re-mint + CER Eligible/Students (36) → CER credential dedup, the Signal-B
     leads (37). Pay it forward, 38. 🏅 -->

# Session 38 Hand-off Prompt

Session 37 worked the CER Signal-B dedup leads (162 → 21 real merges, the rest
correctly left split), taught the detector to suppress elective-bucket noise, and
relabeled the student column. Paste the block below.

## The prompt

```
You are Session 38 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — Critical Rules 1/2/4/5, Rule 7 re-mint playbook, the
     Branch Policy auto-merge gates [merge on green = clean OR unstable], §6a/§9
     EACR, §11 framing + the NEW "Session 37" subsection at the end of §11).
  2. docs/eacr_consolidation_lessons.md — the Session 37 section.
  3. docs/kb-notes/methodology-credential-dedup-triage.md — the merge-vs-split
     triage taxonomy (scope-of-competency line; the elective-bucket + distinct-
     credential false-positive classes). Its sibling is
     docs/kb-notes/playbook-cer-credential-merge.md (the merge mechanism).
  4. If you'll pick up ACE skill-level (below):
     docs/kb-notes/reference-cpl-eligibility-and-exhibit-cr-catalog.md +
     docs/research_workexp_crossdisc_remint_scope.md (the scope-doc template).

WHAT SHIPPED IN SESSION 37 (all merged to main):
  - #322 CER "Students" → "Eligible students" (the column is the catalog's
    TotalStudentsForCR = the CPL-eligible cohort; consumer-only relabel +
    tooltip + test). Resolved the Session-36 label-semantics follow-up.
  - #323 merged 21 Signal-B duplicate credentials. Worked ALL 162 Signal-B leads
    from kb/_detect_cpl_type_dupes.py. ~62 were COMM M1038 elective-bucket noise
    (two different exams on one generic-elective course) + most of the rest are
    genuinely-distinct credentials sharing a course (FAA ratings, AWS welding
    processes/codes, AP exams, WSET levels, per-HS articulations) → left split
    per scope-of-competency (skill Rule 4). The 21 real ones (FAA Airframe/
    Powerplant Certification → Mechanic Certificate — {…} Rating; CDCR → Basic
    Correctional Officer Academy; SFT Fire Inspector 1A/1B/1C + instructor; 7×
    AWS Certification→Qualified Welder; spelling/Rule-1 strips) were KB-verified
    (issuer + credit rec) and applied via kb/_merge_credentials.py (V1–V4 green).
    CER credentials 1994 → 1973; credential_reference_data.js regenerated
    live-on-merge (carried forward 543 students + 1726 eligible cron values).
  - #324 added a 3rd Signal-B gate to the detector: suppress pairs sharing ONLY
    an elective-bucket course (mirrors the producer's R1 ≥0.8/≥5/≤3 rule).
    Signal B 162 → 77; the next pass is now tractable.

PRIORITY / NEXT (in order):
  1. ACE SKILL-LEVEL CHILD-EXHIBITS — the standing next-real-work (Session 36
     handoff + the eligibility reference doc "Open/deferred"). Data-confirmed:
     3,013 skill-leveled exhibits, 2,428 multi-level, per-level CR sets differ
     (Navy OS1=6 CRs/OS2=5/OSC=8). SCOPE FIRST (own scope doc, like the cross-
     disc one) before any build — it's an identity change (Rule 7 class): military
     decomposes by SkillLevel (parent ExhibitID + SkillLevel children, derived/
     reversible); non-military stays flat. Don't infer individual eligibility from
     exhibits — that's JST-driven (deferred student-portal tier). Lock the
     mechanism with Sam (AskUserQuestion) before applying.
  2. CER residual Signal-B — 77 pairs remain after the bucket gate; they're
     mostly legitimate Rule-4 splits (leave for a curator). Signal-A queue empty.
     Only revisit if Sam wants the residual hand-reviewed.
  3. STANDING CARRYOVER: the College + System audience views (System needs the
     privacy ADR finished — adr-cer-student-impact-counts-privacy is the seed);
     EACR v2 scope/generated-rec; wire the eligible-students-per-exhibit dataset
     when Sam sends it (key on ExhibitID/credential, same <5 suppression).

PATTERNS THAT WORKED (Session 37):
  - AskUserQuestion to pick the session focus + resolve a pending Sam-decision
    (the label) in one round, when the handoff offers several divergent threads.
  - Triage-then-merge: most "duplicate" detector hits are false positives; decide
    by scope-of-competency, not title similarity; VERIFY borderline pairs against
    the KB (issuer + credit rec) with a tiny read-only probe before merging.
  - Encode the consumer's noise model into the tool (the elective-bucket gate
    mirrors the CER producer's R1 rule) so the queue stays clean for next time.
  - CER ships live-on-merge: kb/_merge_credentials.py --apply, then
    `python3 -c "import excel_to_dashboard as m; m.export_credential_reference()"`
    to regen the baked file (carry-forward keeps the cron-only columns), commit it.
  - Small PRs, merge on green (clean OR unstable). After each squash-merge:
    git checkout -B claude/<branch> origin/main, force-push-with-lease the next.

SAFETY PATTERNS TO HONOR:
  - Staging KB only (unified_titles/credentials/coci_articulations + the merge
    decisions file). No Supabase, no destructive migration. The curated anchor
    (common_courses.json / course_crosswalk.json) is firewalled.
  - NEVER commit PII (SEC-10). pii_guard.test.js enforces it; student headcounts
    are <5-suppressed, credit UNITS are not.
  - Rule 4: CPL_Dashboard.html == index.html byte-identical. Rules 1/2: don't
    hand-edit regenerated sections; preserve idempotency guards. Rule 5: never
    force-push main (the "Unverified noreply@github.com" stop-hook nag on GitHub's
    own squash-merge commits is a FALSE POSITIVE — never amend a main commit).
  - Feature branch + PR; auto-merge on green; commit your verification (jsdom
    test for consumer JS; a _verify_*.py or the run log for kb/ scripts).

Pipeline viz NOT touched this session (no M-ID pipeline movement — correctly
skipped). A moniker is yours to claim.
```
