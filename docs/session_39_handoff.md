---
title: Session 39 Hand-off Prompt
date: 2026-06-10
session: 38 → 39 hand-off
status: hand-off — paste the fenced block into Session 39's first message
tags: [handoff, session-prompt, ccr, fan-in-convergence, kinesiology, drama-theater, subj4, merge-ux]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 38 section — the convergence arc)
  - docs/kin_pe_convergence_scope.md (scope + §8/§9 applied results)
  - docs/kb-notes/methodology-fan-in-discipline-convergence.md (the durable pattern)
  - CLAUDE.md §11 "Session 38" subsection + Rule 7 (two umbrellas + the fan-in bullet)
moniker_suggestion: Session 38 ran as "Trusting Newton" (branch name); claim your own
superseded: true
superseded_by: session_132_handoff.md
---

<!-- Lineage: … CER consolidation (35) → perf+cross-disc (36) → impact columns +
     FL split (37) → Session 38: CCR refinements + the first FAN-IN convergences
     (KIN/PE, Drama/Theater). Pay it forward, 39. 🏅 -->

# Session 39 Hand-off Prompt

Session 38 shipped Sam's 5-item CCR refinement set, then ran the first two
**fan-in discipline convergences** (the mirror of the FL umbrella split):
Kinesiology ⟵ Physical Education and Drama/Theater Arts ⟵ Theater Arts, both
layers (parents + ~56k singletons), with carve-outs, V-gates, alias receipts,
and the auditor/CSR refreshed. Paste the block below.

## The prompt

```
You are Session 39 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5; Branch-Policy auto-merge
     gates (merge on green = clean OR unstable; never park a PR in draft);
     Rule 7 (note the TWO umbrellas + the NEW fan-in-convergence bullet);
     §11 framing + the "Session 38" subsection at the end.
  2. docs/ccr_cluster_cleanup_lessons.md — the Session 38 section (the arc +
     the seven learnings).
  3. docs/kin_pe_convergence_scope.md — §8/§9 applied results (the template
     for any future fan-in).
  4. docs/kb-notes/methodology-fan-in-discipline-convergence.md — the
     distilled pattern + its five apply guards.

WHAT SHIPPED IN SESSION 38 (all merged to main):
  - #333 — CCR refinements, all 5 of Sam's asks: Subject column/filter/sort →
    canonical SUBJ4 (raw codes on hover; subj4Of()); fit-on-open via inner
    .uc-trunc spans (bare-<td> max-width is IGNORED under table-layout:auto —
    the CER-#307 trap); sortable member tables (_oi order-pin for descriptions);
    the surfaced "⚇ Merge" pill (leads the actions cell, disabled signed-out,
    dialog renamed "Merge courses"); units-as-a-range (umin/umax baked by
    export_unified_courses when members disagree; "lo–hi" + >2.0 ⚠ alarm).
    tests/uc_subj4_member_sort.test.js (23 assertions).
  - #334 — Kinesiology ⟵ Physical Education (Rule 7 fan-in #1). Canonical
    Kinesiology; "Physical Education" = ALTERNATE name (discipline_aliases.json).
    Carve-outs: ATHL (299 intercollegiate) + PEDS (41 adapted → new MQ name
    "Physical Education Disabled Students"). 88 level-safe dup merges; PHYS now
    means Physics (the overload vacated). Parents 16,309→16,221.
  - #335 — Drama/Theater Arts ⟵ Theater Arts (fan-in #2; SUBJ4 THEA) + the
    SINGLETON-LAYER extension (2,929 re-keys + 1,187 flips — the parents-only
    gap had kept dead names in the CSR) + auditor refresh (Kinesiology joined
    UMBRELLA_DISCIPLINES → subject_collision_signal back to its 1,076 baseline;
    16,227 cards) + CSR re-seed (148→146 disciplines; THEA/PEDS pinned).

PRIORITY / NEXT (in order):
  1. VERIFY THE CRON LANDED CLEAN — the first daily run after #333/#335 must
     show in the CCR: units-RANGES on ~7.2k rows (e.g. KINE M1371 → 1.0–1.5,
     ⚠ on >2.0 spreads), KINE/ATHL/PEDS/THEA rows (no PHYS-PE, no DRAM, no
     "Physical Education"/"Theater Arts" disciplines), the ⚇ Merge pill on
     live data, audit chips attaching. The alias maps are the rollback
     inverses if anything looks off: kb/kin_pe_out/2026-06-10/,
     kb/drama_theater_out/2026-06-10/, kb/convergence_singletons_out/2026-06-10/.
  2. DRIVE THE KINE DEDUP — the convergence put all the PE/KIN duplicates in
     ONE SUBJ4, so the Suggested-merges worklist + the 🎯 Cleanup-impact preset
     now surface them cleanly (e.g. cross-college "Weight Training" twins).
     Same for FLSP (the Session-37 carryover — Spanish consolidation).
  3. NEXT FAN-IN CANDIDATES (measured, shared title-families): the CIS↔CS↔
     Office-Tech cluster (39/29/26 — PARTLY real distinctions, scope-first +
     AskUserQuestion); Health↔Health Care Ancillaries (16); Commercial
     Music↔Music (12). The visual-arts pairs are mostly real distinctions.
  4. SMALL CARRYOVER: the "also: Physical Education"/"also: Theater Arts"
     alternate-name chip on the CSR rows (consume kb/discipline_aliases.json
     in canonical_subj4.js — mirror of the ⚯ FL-splits chip, #331 pattern);
     5 other DSPS disciplines carry a stray "53414" in the MQ vocab
     (pre-existing); Supabase _CANON_SUBJ4::"Theater Arts" row is an orphan;
     PEDS M10AE stray (raw local code literally "PEDS") → canonical-SUBJ4 fold.
  5. STANDING (Sessions 36/37): ACE skill-level child-exhibit scope; College +
     System EACR audience views (System needs the privacy ADR finished);
     EACR v2 scope; eligible-students-per-exhibit wiring when Sam sends it.

PATTERNS THAT WORKED (Session 38):
  - Fan-in vs fan-out: two MQ NAMES for one field → canonical + alternate-name
    alias; one discipline over many SUBJECTS → umbrella SUBJ4 split. The data
    tells you which (shared-title-family count).
  - NEVER key a re-mint on subject_4letter (PHYS was overloaded) — key on
    discipline. Vacating a code can resolve its overload for free.
  - Check the M-ID band cap in the dry-run (KINE landed 987/999 — merging the
    88 true dups is what made it fit).
  - For an IRREVERSIBLE apply, be stricter than the worklist's _fam_key:
    roman-convert single letters BEFORE the bare-letter drop (Swimming V ≠ I),
    same-band guard, then verify 0 mismatched-family merges.
  - A convergence isn't done at the parent layer — singletons feed the
    CSR/CCR/worklist too. Converge both in one PR window.
  - Foreign patches: verify every hunk against the live tree before applying;
    test-verified ≠ pixel-verified (no Chromium in the container — flag visual
    changes for Sam's eyeball).
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rules 1/2 (generator owns regenerated
    sections; unified_courses.js is hand-maintained, its DATA files are not);
    Rule 5 never force-push main (the stop-hook nag on GitHub's own
    squash-merge commit is a FALSE POSITIVE — install the canonical
    scripts/stop-hook-git-check.sh, never amend a main commit).
  - Re-mints: measure-first dry-run → review the merge list → --apply with
    V-gates → independent re-verify → re-seed CSR → re-run kb/_row_audit.py
    and COMMIT latest.json. Serialize KB JSON with native indent + original
    key order (proportional diffs).
  - Post-squash: git fetch + reset --hard origin/main, then force-push-with-
    lease the next branch push. Don't trust `push | tail` exit codes.

Pipeline viz refreshed this checkpoint (the fan-in re-mint card). A moniker is
yours to claim.
```
