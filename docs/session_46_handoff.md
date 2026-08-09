---
title: Session 46 Hand-off Prompt
date: 2026-06-11
session: 45 → 46 hand-off (written at the Session-45 checkpoint — the CCR rules day)
status: hand-off — paste the fenced block into Session 46's first message
tags: [handoff, session-prompt, ccr, c-id-router, homonym, description-lane, worklist]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 45 section — the full story)
  - docs/cid_articulation_authority_scope.md (§8/§9 — Phase 3 + what's next)
  - docs/kb-notes/methodology-college-homonym-subject-codes.md (the durable lesson)
moniker_suggestion: Session 45 ran as "Hercules Bruh" (Sam's coinage at close — "powerlifted boulders"; note two Session-44s collided that day, so check git log before claiming a number); claim your own moniker
superseded: true
superseded_by: session_132_handoff.md
---

# Session 46 Hand-off Prompt

Session 45 was Sam's "squat in the CCR" rules-and-procedures day: the C-ID
router went statewide, the CRIM M1003 screenshot became the homonym
machinery, and the dark 86% got a description-evidence worklist lane.
Three PRs (#379/#381/#382), all merged on green. Paste the block below.

```
You are Session 46 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5/7; Branch-Policy
     auto-merge gates (merge on green = clean OR unstable; never park a PR
     in draft); §11 + the "Session 44" and "Session 45" subsections at the
     end (43 and earlier → docs/roadmap_archive.md).
  2. docs/ccr_cluster_cleanup_lessons.md — the Session 45 section.
  3. docs/cid_articulation_authority_scope.md — §8 phase table + §9 (the
     statewide widening + the dual-approval honesty rule).
  4. docs/kb-notes/methodology-college-homonym-subject-codes.md — detect/
     scope/retract for college-homonym subject codes.

WHAT SHIPPED IN SESSION 45 (3 PRs, all squash-merged on green):
  - #379 — C-ID articulation router Phase 3 STATEWIDE (_ROUTE_PREFIXES
    gate removed): 8,377 members display under 454 descriptor rows (was
    329 MATH-only); 174 fully-routed M-IDs + 1,682 stand-alones fold
    (rfold); payload 15,652 → 15,517. Conservation-verified: 0 members
    vanished, 125 previously-INVISIBLE claimants materialized. 4 stats
    courses with MATH 110 ∧ SOCI 125 dual approvals un-routed (Phase 1's
    scoped gate had hidden the SOCI side and auto-picked MATH 110) — RULE:
    scope-gates filter AFTER assembling each course's full approval set.
  - #381 — the CRIM M1003 case ("Introduction to 3D" under Administration
    of Justice). Root cause: subject_map["CADM"] is a COLLEGE HOMONYM
    (Corrections @ Bakersfield ×47, CAD @ Merced ×4), laundered into the
    key by the canonical-SUBJ4 re-key. Built: kb/_audit_subject_map.py
    (TOP-division votes + minority-title grading; receipt
    kb/subject_map_audit.json; curator clearances in the lexicon's
    _subject_map_notes.audit_cleared); COLLEGE-SCOPED subject_map entries
    ({discipline, colleges} — scoping beats removal: flat removal degraded
    Lassen's 118 correct Gunsmithing fills); RETRACTION PROPAGATION in
    _infer_disciplines.py (its own stale fills blank; later passes
    re-fill). 11 homonyms scoped; ~320 rows re-filled honestly (CRIM
    M1003 → Drafting/CADD; LATTC/MiraCosta police courses → AoJ). Audit:
    title-mismatch 773→712, TOP-disagreement 960→926, collision-signal
    1,076→1,210 (re-filled rows AWAIT THE NEXT SUBJ4 RE-MINT — by design).
  - #382 — description-evidence worklist lane for the DARK 86% (13,922
    M-IDs with no official evidence anywhere). kb/_desc_consolidation_
    dryrun.py: TF-IDF cosine, gates = 0.60 + credit + units ±0.5 +
    not-the-title-lane's + LEVEL (FLSP M1379) + GENDER + SPORT guards
    (athletics template descriptions are interchangeable across gender
    and sport — both guards earned by the naive run's output). Receipt
    kb/desc_consolidation_out/candidates.json: 474 groups (135 cross-
    college; marquee = the 8-M-ID infant/toddler ECED family ~20 colleges
    — singular/plural splits the title sig). Generator joins it as
    desc_groups (liveness-validated, sig tiebreak); consumer renders the
    4th worklist section (📝 pink badge; same-college amber); Confirm =
    doConsolidate; NEVER auto-applied. tests/uc_desc_lane.test.js. 29/29.
  - Also: verified the first post-router cron no-op'd (handoff item 2 —
    stamp-normalized hashes byte-stable); Session-43's "Session 44" got
    claimed by a parallel session (#375–#378) — this session is 45.

PRIORITY / NEXT (in order):
  1. SAM'S CURATOR QUEUE (standing, now THREE lanes deep): the new 📝
     description lane (474 groups — cross-college first, the ECED family
     is the showcase), the 🧾 kin-backed evidence lane (158 groups), and
     the title/family lanes. Every Confirm is trustworthy post-slotfix.
     FLSP M1379 stays the marquee SPLIT candidate (never fold it whole).
  2. VERIFY tomorrow's cron no-ops on the #379/#381/#382 artifacts
     (expect stamp-only everywhere; the desc lane joins a STATIC committed
     receipt with a deterministic sort, so suggestions must be byte-stable
     modulo the stamp). Hash with stamps normalized; never trust --stat.
  3. C-ID ROUTER PHASE 2 + 3b (scope §8): the ccn_equiv bridge (COMM 130 /
     COMM C1004 — c-id.net rows whose local number is CCN-shaped ARE the
     equivalence authority); termly refresh procedure; curation surfaces
     for the held classes (76 coci_conflict, 285 multi-descriptor incl.
     the 4 stats duals, 3,976 unmatched).
  4. THE NEXT CANONICAL-SUBJ4 FOLD is getting ripe: subject_collision_
     signal at 1,210 — the Session-37 coarse fills + Session-45 honest
     re-fills all carry SUBJ4 ≠ their discipline's canonical (CRIM M1003
     itself should land under a DRFT-class key). Rule 7 playbook applies:
     dry-run, alias map, promotions re-key (single-step, era-stamped),
     atomic within a cron window.
  5. CCR PERF WATCH (Session 43's open thread): if Sam still feels lag,
     get the SPECIFIC action before touching anything; levers cheapest-
     first = skip the post-audit-load second render, retune colgroup,
     virtualization last.
  6. STANDING: statewide-category review bucket (State Bar + HRCM 001
     parked for Sam, Session 44); activity-grid reorder product call;
     CIS↔CS scope §5 sign-off (GATED); ACE skill-level child-exhibit
     scope; College + System EACR views (System needs the privacy ADR);
     EACR v2; 5 DSPS "53414" strays; PEDS M10AE; Sam-only Cloudflare
     worker re-paste.

PATTERNS THAT WORKED (Session 45):
  - Dry-run against a byte-exact baseline and diff member CONSERVATION,
    not counts — the +94 net decomposed into 125 materialized (a strict
    win) + dedups; counts alone would have hidden both.
  - Let the naive run's output design the guards: scoped entries (#381)
    and the gender/sport gates (#382) both came from reading real damage,
    not speculation.
  - A scoped gate corrupts set-valued evidence (the 4 dual-approval
    courses); assemble the full set, THEN test, THEN scope.
  - Stamp-only artifact churn stays out of commits: hash with both
    generated_at formats normalized, git checkout the stamp-only files.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs (this checkpoint touched the pipeline
    re-mint card in BOTH); Rule 5 never force-push main; C-IDs/CCNs
    verbatim; official targets get NO curation writes; merge ≠ verify;
    folds/routing are display-level + reversible.
  - Worklist lanes NEVER auto-apply; same-college groups rank last and
    carry the amber banner; contested members start unchecked.
  - The inference chain order matters: pass 1 (lexicon, retracts) → desc
    → TOP → TOP-division → re-seed CSR → re-run row audit. After lexicon
    edits ALWAYS run kb/_audit_subject_map.py first.
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into
    context; parse with scripts that print counts/samples.

Pipeline viz: refreshed this checkpoint (roadmap cards + the re-mint
section headline Session 45's three applies). A moniker is yours to claim.
```
