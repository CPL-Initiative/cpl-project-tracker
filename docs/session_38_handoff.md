---
title: Session 38 Hand-off Prompt
date: 2026-06-09
session: 37 → 38 hand-off
status: hand-off — paste the fenced block into Session 38's first message
tags: [handoff, session-prompt, ccr, impact-columns, subj4-remint, foreign-languages, cer, signal-b]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 37 — the CCR cleanup arc)
  - docs/fl_subj4_remint_scope.md (the FL SUBJ4 split scope + dry-run)
  - docs/kb-notes/methodology-umbrella-discipline-subj4-split.md
  - docs/kb-notes/methodology-rank-cleanup-by-downstream-impact.md
  - docs/kb-notes/methodology-credential-dedup-triage.md
  - CLAUDE.md §11 "Session 37" + "Session 37 (cont.)" subsections + Rule 7 umbrella refinement
moniker_suggestion: Session 37 ran unnamed; if you want one, claim it — lineage below
---

<!-- Lineage: Lucid Wozniak (34) → CER consolidation (35) → perf+cross-disc (36) →
     Session 37: CER Signal-B dedup, the CCR impact columns, the Foreign-Language
     SUBJ4 re-mint. Pay it forward, 38. 🏅 -->

# Session 38 Hand-off Prompt

Session 37 cleaned up CER duplicate credentials, then pivoted to the CCR: shipped
impact columns that re-rank cleanup by student-credit payoff, which surfaced the
Spanish/foreign-language collision → a Rule-7 SUBJ4 re-mint splitting `FLNG` per
language. A later stretch (branch stoic-bardeen) disciplined the **whole ~5.9k
orphan tail** so it shows on the CSR (#330) and made the FL splits **searchable +
visible** on the CSR (#331). Paste the block below.

## The prompt

```
You are Session 38 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5; the Branch-Policy auto-merge
     gates (merge on green = clean OR unstable); Rule 7 re-mint playbook + the NEW
     "Umbrella-discipline exception" in its structural invariants; §11 framing +
     the "Session 37" and "Session 37 (cont.)" subsections at the end of §11.
  2. docs/ccr_cluster_cleanup_lessons.md — the Session 37 section (the CCR arc).
  3. docs/fl_subj4_remint_scope.md — the Foreign-Language SUBJ4 split (scope+dry-run).
  4. The methodology KB notes: methodology-umbrella-discipline-subj4-split.md +
     methodology-rank-cleanup-by-downstream-impact.md + (stoic-bardeen)
     methodology-coarse-top-division-discipline-fallback.md +
     methodology-surface-derived-layer-on-single-grain-tab.md.
     Lessons: docs/common_subject_code_tab_lessons.md (the 2026-06-09 CSR section).

WHAT SHIPPED IN SESSION 37 (all merged to main):
  - #322/#323/#324 — CER Signal-B dedup: relabel "Students"→"Eligible students";
    merged 21 true-duplicate credentials (162 leads, ~13% real); taught the
    detector to suppress COMM M1038 elective-bucket noise (162→77). Triage taxonomy
    → methodology-credential-dedup-triage.md.
  - #326 — CCR Eligible-units + Students impact columns + 🎯 Cleanup-impact preset.
    export_unified_courses rolls the CER per-credential eligible/students up to each
    course via the articulation crosswalk; 2 sortable columns + over-merge ⚠ badge +
    a login-free preset (auditor-flagged ∩ eu>0, sorted by eligible desc).
    <5-safe by construction; tests/uc_impact_columns.test.js + a CCR `st` PII guard.
  - #327/#328 — Foreign-Language SUBJ4 re-mint (Rule 7). MQ has only "Foreign
    Languages" (no per-language discipline) → the SUBJ4 invariant forced every
    language into one FLNG. Split per language (FLSP/FLFR/FLCH/…), DISCIPLINE STAYS
    "Foreign Languages." Re-prefix kept the unique M-number (collision-free, no
    re-sequence): 1,452 identities → 17 SUBJ4s + 115 articulations re-keyed; 99.5%
    auto-classified by the self-describing CCC TOP-11xx taxonomy. V1–V4 green;
    subject_collision_signal held at 0 via the new UMBRELLA_DISCIPLINES auditor
    exemption. kb/_apply_fl_subj4_remint.py; alias receipt kb/fl_subj4_out/2026-06-09/.
  - #330 (stoic-bardeen) — COARSE TOP-DIVISION discipline fallback: disciplined the
    whole ~5.9k orphan tail (blank because their TOP code is a catch-all the precise
    passes skip) with the 2-digit-division umbrella discipline (49→Interdisciplinary
    Studies, 12→Health, 09→Industrial Technology…). 6,590 fills; blank_discipline
    1,266→73. Reversible, conf 0.4 / ⚙ TOP-div, reviewer-flagged. SIDE-EFFECT:
    subject_collision_signal 0→1,076 (coarse fills aren't SUBJ4-canonicalized yet → a
    future fold queue). kb/_infer_disciplines_from_top_division.py + the map; verify
    script; KB note methodology-coarse-top-division-discipline-fallback.md.
  - #331 (stoic-bardeen) — FL splits searchable + visible on the CSR. The #328 splits
    (FLSP/FLFR/…) lived only in foreign_language_subj4.json; the CSR never surfaced
    them (search "Spanish"/"FLSP" → nothing). canonical_subj4.js now shows a ⚯ N splits
    chip + codes line + matches the split names/codes in both search boxes. Static →
    live on merge. tests/csr_fl_split.test.js.

PRIORITY / NEXT (in order):
  1. DRIVE THE SPANISH/FL CONSOLIDATION (the payoff of the re-mint). After the next
     daily cron regenerates unified_courses_*.js with the FL** ids, the CCR impact
     columns + Suggested-merges worklist become per-language-coherent: all FLSP rows
     now consolidate cleanly (no French/Chinese noise). Remaining cleanup: (a) confirm
     the FLSP same-course merges via Suggested-merges. [(b) "fill the blank FL
     disciplines" is DONE — #330 disciplined the whole orphan tail incl. FL.] Use the
     🎯 Cleanup-impact preset to rank by eligible-units. Also: CURATE the coarse
     ⚙ TOP-div fills (the "by TOP division" Generated-by filter isolates them; the
     ~580 no-umbrella residual needs in-tab curation).
  2. CHECK THE CRON LANDED CLEAN — first daily run after #328 should show FLSP/FLFR/…
     rows in the CCR (not FLNG) + the impact columns populated + the audit chips
     attaching (latest.json already FL**). If a row looks off, the alias map is the
     inverse for rollback.
  3. NEXT UMBRELLA? None else identified. If one emerges (a coarse MQ discipline over
     distinct enrollment subjects), the FL pattern + kb/foreign_language_subj4.json
     are the template.
  4. STANDING CARRYOVER (Session 36/37): ACE skill-level child-exhibit scope (the
     long-flagged next-real-work, data-confirmed); College + System EACR audience
     views (System needs the privacy ADR finished); EACR v2 scope; the residual 77
     Signal-B pairs (mostly legitimate Rule-4 splits — leave); the eligible-students-
     per-exhibit dataset wiring when Sam sends it.

PATTERNS THAT WORKED (Session 37):
  - Rank cleanup by DOWNSTREAM IMPACT (eligible-units/students), not just the
    auditor's structural members×(1−trust) — and the impact is one join away from
    data you already bake. It re-ranked the queue to the real target.
  - Scope-first for re-mint-class work: AskUserQuestion to lock the keystone decision
    (the naming scheme), measure-first dry-run (99.5%), then atomic apply with V-gates
    + an alias-map receipt. The self-describing CCC TOP-11xx taxonomy did the
    classifying — let the data's own taxonomy do the work.
  - Re-prefix-keep-the-number when old ids are already unique (collision-free, no
    risky re-sequence). Discipline NEVER changes in a SUBJ4 re-mint (V3 = unchanged).
  - Small PRs, merge on green (clean OR unstable). After each squash-merge:
    git checkout -B claude/<branch> origin/main, force-push-with-lease the next.

SAFETY PATTERNS TO HONOR:
  - Rule 4: CPL_Dashboard.html == index.html byte-identical (the Pipeline tab is
    hand-maintained in BOTH). Rules 1/2: don't hand-edit regenerated sections.
    Rule 5: never force-push main (the "Unverified noreply@github.com" stop-hook nag
    on GitHub's own squash-merge commits is a FALSE POSITIVE — never amend a main
    commit; the canonical scripts/stop-hook-git-check.sh ignores them).
  - Staging KB only (coci_*.json + the map/decisions files). No Supabase, no
    destructive migration. The curated anchor (common_courses/course_crosswalk) is
    firewalled. NEVER commit PII (pii_guard.test.js; <5/<2 suppression).
  - Re-mints: dry-run → V-gates → atomic land within one cron window; alias map is
    the rollback inverse. The auditor (kb/_row_audit.py) is NOT a cron step — commit
    its regenerated latest.json after any identity re-key.

Pipeline viz refreshed this checkpoint (the FL re-mint card). A moniker is yours.
```
