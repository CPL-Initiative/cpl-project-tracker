---
title: Session 42 Hand-off Prompt
date: 2026-06-11
session: 41 → 42 hand-off (written at the Session-41 checkpoint — the witness-kinship gate day)
status: hand-off — paste the fenced block into Session 42's first message
tags: [handoff, session-prompt, ccr, kinship-gate, r4, claims-only-rows, evidence-lane, cron, refresh-button]
related:
  - docs/kb-notes/methodology-witness-kinship-gate.md (the durable lesson)
  - docs/ccr_cluster_cleanup_lessons.md (Session 41 section)
  - docs/official_id_fold_scope.md (R1–R4 now ALL built)
  - CLAUDE.md §11 "Session 41" subsection
moniker_suggestion: Session 41 ran as "Intelligent Ride" (branch name); claim your own
superseded: true
superseded_by: session_132_handoff.md
---

<!-- Lineage: … live-curation loop (39) → severed evidence index repaired (40)
     → Session 41: Sam's AUTO 120X screenshot → HALF of 40's folds were stale
     chimera receipts → the witness-kinship gate, claims-only official rows,
     honest official-row stats, R4 singletons — 852 identities moved to their
     evidence-correct homes in one day, measured twice. The fold rule now has
     an immune system. Keep it honest, 42. 🛡 -->

# Session 42 Hand-off Prompt

Session 41 took Sam's "AUTO 120X has transmission children under an engine
title" screenshot and found the inverse: the *members* were right and **half
of Session 40's restored folds were wrong** — stale receipts from pre-split
chimera families. The witness-kinship gate fixed the class, R4 extended the
rule to stand-alones, and the day closed with the curation queue kin-ranked.
Paste the block below.

```
You are Session 42 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5; Rule 7 (promotions
     re-key is on its checklist); Branch-Policy auto-merge gates (merge on
     green = clean OR unstable; never park a PR in draft); §11 + the
     "Session 41" subsection at the end.
  2. docs/kb-notes/methodology-witness-kinship-gate.md — the durable
     pattern: receipts describe the family that existed when written; ids
     that survive a split keep receipts that no longer describe them; NO
     re-key fixes that — you gate on present-tense kinship instead.
  3. docs/ccr_cluster_cleanup_lessons.md — the Session 41 section.
  4. docs/official_id_fold_scope.md — R1–R4 are now ALL BUILT.

WHAT SHIPPED IN SESSION 41 (all merged):
  - #347 the witness-kinship gate: a promotions witness only drives an
    auto-fold if the remnant's title matches the witness's OWN claimant
    course title OR the official catalog title (J >= 0.5, level-safe).
    Un-folded 565 chimera folds ("APPLIED ANTHROPOLOGY" had 40 unanimous
    STALE witnesses for ANTH 120 — counts are no defense); kept all 7
    SPAN folds; UNLOCKED SOCI M1023 (one chimera witness had been
    poisoning a real unanimous match into a "conflict").
    + Synthesized official rows titled by the OFFICIAL catalog (AUTO 120 X
    now reads "Automatic Transmissions and Transaxles").
    + 307 claims-only official rows (an official id with raw COCI
    claimants gets a row with zero folds; C-ID rows 259 → 456).
    + Official-row stats from the DISPLAYED members (claims ∪ folded
    leaves): members count, modal units + range (the "0–6 ⚠" vs displayed
    4/6/4 bug), modal TOP, credit default Credit. Official member tables
    now include folded-leaf members (SPAN 200 displays its family).
    + Evidence lane kin-aware: tm flags, pre-unchecked, kin-ranked (187
    all-stale groups sink under a banner); "🧾 stale evidence" row badge.
    + UI: Title column wraps (no "…"); member-table headers white-on-navy.
    + tests/uc_kinship_gate.test.js; analyzer kb/_analyze_witness_kinship.py.
  - #347 also carried the Manual-Refresh fix: the deployed worker's
    /trigger reads the secret from the QUERY STRING, the button sent it
    in the body → 403 "Invalid or missing secret". Button now sends both.
    DURABLE FIX IS SAM-ONLY: re-paste cloudflare-worker-proxy.js into the
    Cloudflare dashboard (sessions can't reach Cloudflare; egress).
  - #348 R4 singletons: of 653 evidence-bearing stand-alones, 301
    auto-fold (sfold on the official row, counted in the ⛓ chip), 12
    contested → lane as g:1 entries, 340 all-blocked stale receipts
    deliberately NOT laned (recoverable via the analyzer). SPAN
    intermediate singles landed exactly per the scope §4 table.
  - Cron forensics: the 06-11 primary was DROPPED (documented GitHub
    flakiness); the 14:17 backstop fired and ran with #347's generator.
    Yesterday (06-10) ran fine — Sam's "didn't run yesterday" was the
    3h+ delay pattern. Session self-dispatch still 403s (actions: write).

MID-PR TRAP THAT BIT: the backstop cron pushed to main while #348 was
open → mergeable_state "dirty". For generated-artifact conflicts, NEVER
pick sides: rebuild the branch from the new main, re-apply the CODE
files, regenerate from the cron-fresh inputs, force-push-with-lease.

POLICY CHANGES SHIPPED AT SESSION-41 CLOSE (read before working):
  - CLAUDE.md slimmed 618 lines: Session 26-40 narratives now live in
    docs/roadmap_archive.md — CONSULT IT when a carryover/PR#/decision
    traces to an earlier session (grep an id like "FLSP M1379" there).
  - Your own §11 subsection: <= ~10 lines + pointer to the lessons doc;
    keep <= 2 narratives inline (archive older at checkpoint).
  - Sibling claude/<desc> branches AUTHORIZED for independent PRs (no
    more 3-stacked-PRs-one-branch serialization).
  - Prefer CODE-ONLY PRs; artifacts via cron/dispatch. Actions: Read
    and write is GRANTED + dispatch-confirmed (2026-06-11, 204 on
    daily-dashboard.yml) — post-merge dispatch IS the default; you can
    also self-heal a dropped cron with actions_run_trigger. All three
    repo toggles are set (auto-merge, delete-head-branches, Actions).
  - Rule 5 clarified (feature branches force-with-lease freely; main
    never, except a coordinated PII-scrub with Sam's go).

PRIORITY / NEXT (in order):
  1. VERIFY THE CRON regen (first daily run after #348 should no-op on
     unified_courses_*.js apart from generated_at; AUTO 120 X keeps its
     descriptor title; standalone count stays ~55,830).
  2. SAM'S CURATOR QUEUE (his, not yours — make sure it works): the
     kin-ranked evidence lane (~123 kin-backed groups at the top, incl.
     the 12 stand-alone contested entries like CISC M12PP "Python
     Programming I" COMP 112×1 vs COMP 122×1); the 187 stale groups
     below the banner are Skip material. FLSP M1379 is still the marquee
     contested row (SPAN 200 ×8 vs 210 ×6).
  3. THE 31 _unresolved PROMOTIONS KEYS (small, bounded — now also run
     them through the kinship lens; several may be pure chimera residue
     that wants deletion rather than resolution).
  4. NEAR-MISS RESCUE (optional, curator-led): the gate's borderline band
     holds a few semantic synonyms ("Multivariate"≈"Multivariable"
     Calculus, "Introduction to Soils"≈"Introduction to Soil Science")
     that sit in the lane — consider a tiny synonym map ONLY if Sam
     trips over them; do NOT loosen the 0.5 threshold globally.
  5. STANDING: CIS↔CS scope §5 sign-off (docs/cis_cs_convergence_scope.md,
     GATED — mind the single-letter-token trap); ACE skill-level
     child-exhibit scope; College + System EACR views (System needs the
     privacy ADR finished); EACR v2; 5 DSPS "53414" strays; PEDS M10AE.

PATTERNS THAT WORKED (Session 41):
  - Measure the rule before changing it, TWICE (the gate analyzer before
    #347; the R4 disposition counts before #348). The borderline-band
    eyeball (J 0.3–0.5) is where you earn confidence.
  - A receipt is evidence about the family that existed when it was
    written. Ask of any historical artifact: "can the entity behind this
    key change without the key changing?" If yes, gate on present-tense
    agreement, don't just re-key.
  - Stats must describe what the row DISPLAYS (the 0–6-vs-4/6/4 chip).
    Every display/stat divergence is a curator-trust leak.
  - Blocked ≠ deleted: auto-lane-skip is a three-way split; keep the
    noise out of the queue but committed-analyzer-recoverable.
  - kin == {} vs kin absent (None) carry different meanings — the falsy-
    empty-dict trap in JS/Python both; check `is None`, not `or`.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rule 5 never force-push main; C-IDs/CCNs
    verbatim; official targets get NO curation writes; merge ≠ verify;
    R4/Phase-B folds are display-level (in-memory, recomputed, reversible).
  - Post-squash: git fetch + reset --hard origin/main, then
    force-push-with-lease the next branch push.
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into context;
    parse with scripts that print counts/samples.

Pipeline viz: unchanged this session (no re-key; the fold rule is
display-level) — the re-mint card still shows the promotions re-key.
A moniker is yours to claim.
```
