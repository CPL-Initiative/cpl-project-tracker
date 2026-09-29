---
title: Session 47 Hand-off Prompt
date: 2026-06-12
session: 46 → 47 hand-off (written at the Session-46 close — the AUTO/smog over-mint case + the statewide twin merge)
status: hand-off — paste the fenced block into Session 47's first message
tags: [handoff, session-prompt, ccr, title-lane, twin-merge, smog, guards, worklist]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 46 + part 2 — the full story)
  - docs/kb-notes/methodology-title-similarity-merge-guards.md (the durable lesson)
  - docs/ccr_rules_brief.md (the amended plain-language contract)
moniker_suggestion: Session 46 ran overnight on Sam's "trust you to autopilot" brief and got his live CCR feedback mid-session; claim your own moniker
superseded: true
superseded_by: session_132_handoff.md
---

# Session 47 Hand-off Prompt

Session 46 was the AUTO/smog over-mint night, in two waves: the 🏷
title-evidence lane (#385), then — after Sam reviewed the CCR live and said
"consolidations that should happen, more rule sharpening" — the STATEWIDE
strict twin merge + the Sam-confirmed smog consolidations (#386). Paste the
block below.

```
You are Session 47 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5/7; Branch-Policy
     auto-merge gates (merge on green = clean OR unstable; never park a PR
     in draft); §11 + the "Session 45" and "Session 46" subsections at the
     end (44 and earlier → docs/roadmap_archive.md).
  2. docs/ccr_cluster_cleanup_lessons.md — Session 46 AND its part 2.
  3. docs/kb-notes/methodology-title-similarity-merge-guards.md.
  4. docs/ccr_rules_brief.md — the amended contract (the twin tier is now
     the ONE title-based auto-merge; keep the brief honest if rules move).

WHAT SHIPPED IN SESSION 46 (2 PRs):
  - #385 — the 🏷 title-evidence worklist lane. One BAR Smog Check spec =
    52 identities; all lanes combined had surfaced 3 pairs. New lane:
    kb/_title_consolidation_dryrun.py — IDF-weighted title cosine >= 0.62
    over dark M-IDs + ~54k stand-alones (the desc lane can't see
    singletons), credit + discipline-OR-TOP-division corroboration + >=2
    shared content tokens, NO units gate (licensure specs pack 1-7u per
    college — spread reported instead), clique-consistent components.
    Shared guard suite kb/_consolidation_guards.py (desc + title + twin
    passes ALL import it): two-axis level marks ("Elementary X 2" !=
    "Intermediate X 1"), STRICT-equality variant marks (refresher/update/
    supplemental/instructor/supervisor/module/bridge/honors/lab),
    year-edition marks (15xx-20xx), context session letters, word-number
    folds (also in _sug_sig + _fam_key + both lane sigs — keep ALL sig
    functions in lockstep or pairs double-queue).
  - #386 — Sam's live CCR feedback ("M1001/M1002 + all the level II
    inspectors should consolidate") became TWO applies:
    (1) kb/_apply_twin_merge_statewide.py — the Session-39 KINE/FLSP twin
        pass UNSCOPED (the #379 statewide-widening move) + the guard
        clique gate (the ordinal-rule fam key drops "1", so "X Level 1&2"
        fam-equals "X Level 2" — level marks block it; 65 groups correctly
        guard-skipped incl. gendered athletics the parens-stripping fam
        key can't see). 589 token-identical twins absorbed (16,143 ->
        15,554 parents), 107 articulations re-pointed, winner defers to
        existing curator merge-targets, V-gates G1-G6 PASS, alias receipt
        kb/twin_merge_out/2026-06-12/ registered in _rekey_promotions
        ALIAS_MAPS + applied (99 re-keyed, 80 folded, V1-V5 PASS).
        Supabase mirrored (9 fulfilled curator merges deleted).
    (2) The smog confirms as kb_curation rows (Supabase + overlay):
        L1&2 -> AUTO M1001 (M1217 + standalone M10AG; M1002 came via the
        twin pass); the 12-member Level-2 family -> AUTO M1007, unified
        title "Smog Check Inspector Training Level 2" (M1005, M1006, the
        mis-keyed AUTB M1037, + 8 explicit-L2 stand-alones). The unmarked
        "Inspection Procedures" rows (M11DC/M11DE/M11NW) + the noncredit
        pair (M9052/M90AK) deliberately stay queued.
    Receipts re-run post-twin (desc 446->416, title 5,662->5,584); CSR
    re-seeded; audit refreshed (seed-untouched 10,513; unit anomalies
    4,194; title-mismatch 687). Suite 30/30 — two marquee pins updated
    (ECED M1099 folded into twin M1098; CER's "folds >=10" loosened to >=5
    because physical twin absorption legitimately shrinks display-level
    fold counts — guard the mechanism, not a high-water mark).

PRIORITY / NEXT (in order):
  1. VERIFY the post-merge dispatch published coherently + the NEXT cron
     no-ops (stamp-normalized hashes; never --stat). The committed repo
     intentionally has 5 fresh artifacts (data/suggestions/members/
     standalone/credential_reference — the tests read them) while the
     heavy ones (details/member_desc/index/aligned/HTMLs) come from the
     dispatch — brief incoherence until it lands is expected.
  2. SAM'S CURATOR QUEUE: 🏷 5,584 title groups (smog residuals: the L1
     family group now carries the unmarked Inspection-Procedures rows —
     curator judgment), 📝 416 desc, 🧾 evidence, anchored/singleton/
     family lanes. NEVER auto-apply beyond the twin tier.
  3. TWIN-MERGE CADENCE: the pass is re-runnable — future inference/
     curation can mint new twins. Re-run dry-run termly WITH the receipts
     refresh (both receipt builders + twin pass import the shared guards —
     upgrade once, re-run all three). Watch Sam's CCR feedback for the
     next tier candidate (e.g. same-key-different-units twins like
     "Smog Level One and Level Two" 5.5u — currently curation-only).
  4. THE CANONICAL-SUBJ4 FOLD (collision-signal 1,206): Session 46 added
     evidence — apprenticeship-style subject codes (APPR/ATECH/APRN/AVIA
     Ford-ASSET) put automotive courses under AUTB/AVIA SUBJ4s; the
     homonym audit can't see them (not subject_map entries). Consider an
     identity-grain TOP-vs-SUBJ4 audit before the fold. Rule 7 playbook.
  5. C-ID ROUTER PHASE 2 + 3b (scope §8): ccn_equiv bridge; termly refresh
     procedure; curation surfaces for held classes.
  6. STANDING: statewide-category review bucket (State Bar + HRCM 001);
     activity-grid reorder product call; CIS↔CS scope §5 sign-off (GATED);
     ACE skill-level child-exhibit scope; College + System EACR views
     (System needs the privacy ADR); EACR v2; 5 DSPS "53414" strays;
     PEDS M10AE; Sam-only Cloudflare worker re-paste; CCR perf watch.

PATTERNS THAT WORKED (Session 46):
  - Read the over-mint corpus BEFORE designing the merge rule; let the
    naive run's output design the guards (lab/laboratory variant marks and
    the curator-target winner rule both came from the twin dry-run's
    damage).
  - A suggestion queue is the WRONG tier for zero-judgment cases — Sam's
    "consolidations that should happen" = promote the deterministic tier
    to an authorized, receipted auto-apply; everything fuzzier stays human.
  - Clique-consistency at union time beats size caps (vacuous-pass
    semantics make unmarked titles bridges).
  - When display-level consolidation becomes physical, downstream fold
    counts legitimately DROP — expect marquee-pin test movement.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rule 5 never force-push main; C-IDs/CCNs
    verbatim; official targets get NO curation writes; merge != verify.
  - The twin tier's conditions are a CONTRACT (docs/ccr_rules_brief.md):
    same-words title + same subj4/discipline/credit/units + guard-clean.
    Don't loosen any leg without Sam + a brief amendment + receipts.
  - Any curation re-key MUST mirror to Supabase kb_curation (the cron
    rebuilds the overlay from it — the Session-39 resurrection lesson).
  - After ANY alias-producing apply: register the map in
    _rekey_promotions.py ALIAS_MAPS + run --apply; re-seed CSR; re-run
    row audit; re-run BOTH consolidation receipts; regen artifacts.
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into context.

Pipeline viz: refreshed (the recent-apply card headlines the twin merge +
smog consolidations in BOTH HTMLs). A moniker is yours to claim.
```
