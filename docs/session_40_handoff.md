---
title: Session 40 Hand-off Prompt
date: 2026-06-10
session: 39 → 40 hand-off
status: hand-off — paste the fenced block into Session 40's first message
tags: [handoff, session-prompt, ccr, twin-merge, supabase-mirror, cis-cs, kine, flsp]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 39 section — the arc + learnings)
  - docs/cis_cs_convergence_scope.md (GATED on Sam's §5 sign-off)
  - docs/kb-notes/methodology-fan-in-discipline-convergence.md (now SIX guards — #6 is the Supabase mirror)
  - CLAUDE.md §11 "Session 39" subsection
moniker_suggestion: Session 39 ran as "Lucid Hamilton" (branch name); claim your own
---

<!-- Lineage: … impact columns + FL split (37) → CCR refinements + fan-in
     convergences (38) → Session 39: cron verify + Supabase-mirror fix +
     the KINE/FLSP twin-merge payoff. Pay it forward, 40. 🏅 -->

# Session 40 Hand-off Prompt

Session 39 verified the first post-convergence cron (clean, one defect), fixed
the Supabase-mirror regression at the source, shipped the CSR alternate-name
chip, ran the Sam-authorized KINE/FLSP strict twin-merge (74 folds), and
scoped CIS↔CS (gated). Paste the block below.

```
You are Session 40 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5; Branch-Policy auto-merge
     gates (merge on green = clean OR unstable; never park a PR in draft);
     Rule 7 (two umbrellas + fan-in); §11 + the "Session 39" subsection.
  2. docs/ccr_cluster_cleanup_lessons.md — the Session 39 section (the
     Supabase-mirror regression + the twin-merge arc).
  3. docs/cis_cs_convergence_scope.md — GATED on Sam's §5 answers; do not
     apply anything from it without them.
  4. docs/kb-notes/methodology-fan-in-discipline-convergence.md — six guards
     now; #6 (Supabase mirror) was born this session.

WHAT SHIPPED IN SESSION 39 (all merged to main):
  - #337 — convergence follow-through: the daily sync REBUILDS
    kb/coci_curation.json FROM Supabase, and 6 stale kb_curation rows
    resurrected the dead PHYS M1265 as a ghost "Unified" row. Fixed in
    Supabase itself (5 course_ids re-keyed, 4 merge_into re-points,
    discipline → Kinesiology, reviewer stamps preserved; the whole table
    cross-checked against ALL 77,726 re-mint aliases). Also: both orphaned
    _CANON_SUBJ4 pins deleted ("Theater Arts" + "Physical Education"),
    M-ID THEA 100 anchor → "Drama/Theater Arts", and the CSR "also: …"
    alternate-name chip (consumes kb/discipline_aliases.json; searching
    "physical education" surfaces Kinesiology; tests/csr_alias_chip.test.js).
  - KINE + FLSP strict twin-merge (kb/_apply_kine_flsp_twin_merge.py,
    Sam-authorized): 70 groups / 74 losers folded, 16,217 → 16,143 parents.
    Twin key = discipline + band + STRICT fam + credit_status + typical_units;
    winner = most corroborated. "Elementary Spanish I/…/1" → ONE 59-college
    identity. 6 V-gates + independent re-verify; receipt
    kb/twin_merge_out/2026-06-10/. CSR re-seeded; auditor 16,153 cards,
    collision signal at the 1,076 baseline.
  - docs/cis_cs_convergence_scope.md — measured verdict: CIS↔CS is NOT a
    KIN/PE-style fan-in (10/44 shared families vs 93; already ONE shared
    CISC space). Options A/B/C; recommendation B = guarded CISC twin-merge.

PRIORITY / NEXT (in order):
  1. VERIFY THE CRON FOLDED THE MERGES — first daily run after the twin-merge
     must show in the CCR: FLSP M1272 "Elementary Spanish I" @ 59 colleges,
     no row for any of the 74 losers (spot-check FLSP M1294, KINE M1228),
     ghost "PHYS M1265" row GONE, suggestions worklist shrunk accordingly.
     Rollback inverse if wrong: kb/twin_merge_out/2026-06-10/alias_map.json.
  2. CIS↔CS — get Sam's §5 sign-off on docs/cis_cs_convergence_scope.md
     (AskUserQuestion works well: A/B/C + the single-letter guard + the CIS
     SUBJ4-tail fold). If B: extend kb/_apply_kine_flsp_twin_merge.py to
     CISC scope WITH the single-letter guard (R Programming ≠ C# Programming
     — see scope §3 + trap 4 in the ordinal-rule note). Winner keeps its
     discipline + cross_listed_disciplines records the loser's.
  3. CER _consolidate_arts single-letter audit — the display-only
     within-credential fold shares the fam key; audit its folded groups for
     pairs whose raw titles differ in single-letter tokens (the R/C# class).
     Cheap, read-only, closes the trap class.
  4. WORKLIST QUEUES are the curator lane (KINE 178+107, FLSP 29+13, minus
     the 74 merged) — Sam confirms in the UI; don't auto-apply beyond the
     strict class he authorized.
  5. STANDING: ACE skill-level child-exhibit scope (data-confirmed, Session
     36); College + System EACR views (System needs the privacy ADR
     finished); EACR v2 scope; 5 DSPS disciplines with the stray "53414" in
     the MQ vocab (measure-first; renames ripple to rows carrying the
     garbled string); PEDS M10AE → canonical-SUBJ4-fold queue.

PATTERNS THAT WORKED (Session 39):
  - Verify a re-mint against the NEXT CRON's regenerated artifacts, not just
    the KB files — the V-gates can pass while the regression lives in the
    daily rebuild (coci_curation.json is a rebuild target, not a store).
  - Cross-check curation stores against ALL alias maps (glob kb/*_out/**/
    alias_map.json — note the key is "alias" in some, "alias_map" in others).
  - Sanity-check a zero: the first family-count read 0 everywhere because
    the KB title field is common_title, not title. Calibrate any metric
    against a known case (KIN/PE ≈ 93) before believing it.
  - The strict twin key is domain-sensitive: audit applied merges for
    DIFFERING dropped single-letter tokens (possessive-'s is benign; R/C#
    is not).
  - Supabase writes: kb_curation is in-scope; preserve reviewer_email/
    reviewed_at on re-keys; fresh-read at write-time; mirror the overlay.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs (the pipeline re-mint card was edited in
    BOTH); Rules 1/2 (generator owns regenerated sections); Rule 5 never
    force-push main.
  - Re-mints: measure-first dry-run → review EVERY merge line → --apply with
    V-gates → independent re-verify → re-seed CSR → re-run kb/_row_audit.py
    and COMMIT latest.json → MIRROR any curation re-keys to Supabase (guard
    6). Serialize KB JSON with native indent + original key order; match the
    sync's trailing newline on coci_curation.json.
  - Post-squash: git fetch + reset --hard origin/main, then force-push-with-
    lease the next branch push.

Pipeline viz refreshed this checkpoint (re-mint card → the twin-merge). A
moniker is yours to claim.
```
