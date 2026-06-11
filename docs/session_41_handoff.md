---
title: Session 41 Hand-off Prompt
date: 2026-06-11
session: 40 → 41 hand-off (written at the Session-40 checkpoint — the evidence-index restoration)
status: hand-off — paste the fenced block into Session 41's first message
tags: [handoff, session-prompt, ccr, promotions-rekey, evidence-lane, official-id-folds, spanish, r4-singletons]
related:
  - docs/official_id_fold_scope.md (the approved + built scope)
  - docs/ccr_cluster_cleanup_lessons.md (Session 40 + 40-cont sections)
  - docs/kb-notes/methodology-rekey-every-id-keyed-artifact.md (the durable lesson)
  - CLAUDE.md §11 "Session 40" subsection + the updated Rule 7 checklist
moniker_suggestion: Session 40 ran as "Vibrant Ride" (branch name); claim your own
---

<!-- Lineage: … live-curation loop (39) → Session 40: Sam's "rules-based
     merging" ask → the severed promotions index found + repaired, the
     plurality rule, the evidence lane, the anchor retirement. The fold
     rule lives again. Pay it forward, 41. 🏅 -->

# Session 41 Hand-off Prompt

Session 40 turned Sam's "why doesn't Intermediate Spanish fold into SPAN 200?"
into a root-cause repair: the automatic Phase A/B official-ID fold had been
silently severed for 53% of its evidence since the post-May re-mints. Paste the
block below.

```
You are Session 41 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5; Rule 7 (its checklist
     now includes the promotions re-key); Branch-Policy auto-merge gates
     (merge on green = clean OR unstable; never park a PR in draft);
     §11 + the "Session 40" subsection at the end.
  2. docs/official_id_fold_scope.md — the approved scope: what R1/R2/R3
     are, the one flagged spec deviation (unanimous single-witness folds
     stay auto), and §7's answered gates.
  3. docs/ccr_cluster_cleanup_lessons.md — the two Session-40 sections.
  4. docs/kb-notes/methodology-rekey-every-id-keyed-artifact.md — the
     durable pattern + the id-keyed artifact registry.

WHAT SHIPPED IN SESSION 40 (all merged):
  - #344 the scope/analysis (root cause: kb/promotions.json keys were 2-4
    re-mints stale; 1,111/2,083 evidence records severed; analyzer
    kb/_analyze_official_fold_evidence.py).
  - #345 the build: R1 kb/_rekey_promotions.py applied (V1-V4 green,
    receipts kb/promotions_rekey_out/2026-06-11/); R2 plurality rule
    (>=80% + >=2 witnesses where dissent exists; match.evidence on rows);
    R3 the worklist 🧾 evidence lane (151 groups; contested members x:1
    start unchecked); a #342 gap fixed (row-less official targets got
    unified_title writes); regen committed live-on-merge — Phase B 455 →
    1,155 M-IDs folded, CCR 16,080 → 15,489 rows; SPAN 200/210 absorbed
    the Intermediate-Spanish family; tests/uc_evidence_lane.test.js (30),
    suite 21/21.
  - The anchor retirement (gate 5): M-ID SPAN 104/106/108 → SPAN
    100/110/200; receipt archive/common_courses_mid_span_anchors_*.json.
  - Playbooks: Rule 7 checklist + re-mint artifact table + fan-in guard 7
    all carry "re-key promotions.json" now.

PRIORITY / NEXT (in order):
  1. VERIFY THE CRON (first daily run after the live ship should be a
     near-no-op on unified_courses_*.js — if it shows a big diff, diagnose
     before anything else; suspect the curation sync re-shaping merges).
  2. R4 SINGLETONS (Sam-approved follow-up PR): 653 evidence-bearing
     stand-alone courses fold/queue under their official ids. Reuse the
     R2 tier rule + the evidence-lane payload; decide fold-vs-queue per
     tier the same way (the lane handles sub-bar). Measure first with
     kb/_analyze_official_fold_evidence.py.
  3. THE 31 _unresolved PROMOTIONS KEYS — investigate where their ids
     went (receipt lists them; several resolve into ids absent from both
     courses and singletons — possibly retired by over-merge splits whose
     plurality branch died later). Small, bounded.
  4. SAM'S CURATOR QUEUE (his, not yours — make sure it works): the 151
     evidence-lane groups (FLSP M1379 "Intermediate Spanish" is the
     marquee contested row — SPAN 200 x8 vs 210 x6, starts unchecked);
     Verify clicks on the newly folded SPAN 200/210 rows.
  5. STANDING: CIS↔CS scope §5 sign-off (docs/cis_cs_convergence_scope.md,
     GATED); ACE skill-level child-exhibit scope; College + System EACR
     views (System needs the privacy ADR finished); EACR v2; 5 DSPS
     "53414" strays; PEDS M10AE.

PATTERNS THAT WORKED (Session 40):
  - Measure the rule before changing it: the strict >=2-witness spec
    would have UNFOLDED 174 established rows — measured first, deviation
    flagged to Sam in the PR instead of discovered in production.
  - Conservation gates catch the repair script's own bugs (V1 failed on
    a shallow-copy aliasing bug before it ever touched data).
  - Validate a new auto-rule against the curator's own hand-merge history
    (11/15 reproduced, 0 contradicted = the approval argument).
  - The committed jsdom test caught a REAL consumer gap (#342 row-less
    official targets) — "commit your verification" pays immediately.
  - Evidence beats lexical similarity in BOTH directions: folds what
    titles can't ("Spanish 3" → SPAN 200), refuses what titles would
    wrongly fold (bare "Intermediate Spanish" = genuinely two courses).
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs (pipeline card edited in BOTH); Rule 5
    never force-push main; C-IDs/CCNs verbatim; official targets get NO
    curation writes; merge ≠ verify (folds stay Generated until Verify).
  - kb/promotions.json is now a Rule-7 checklist artifact — any future
    re-mint MUST run kb/_rekey_promotions.py (fan-in guard 7).
  - Post-squash: git fetch + reset --hard origin/main, then
    force-push-with-lease the next branch push.

Pipeline viz: the re-mint card shows the promotions re-key (current).
A moniker is yours to claim.
```
