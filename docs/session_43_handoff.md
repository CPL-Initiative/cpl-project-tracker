---
title: Session 43 Hand-off Prompt
date: 2026-06-11
session: 42 → 43 hand-off (written at the Session-42 checkpoint — the slot-fix day)
status: hand-off — paste the fenced block into Session 43's first message
tags: [handoff, session-prompt, ccr, slot-fix, permutation, era-guard, promotions, evidence-lane]
related:
  - docs/kb-notes/methodology-alias-map-resolution-semantics.md (the durable lesson)
  - docs/kb-notes/methodology-witness-kinship-gate.md (the sibling, one layer up)
  - docs/ccr_cluster_cleanup_lessons.md (Session 42 section)
  - CLAUDE.md §11 "Session 42" subsection
moniker_suggestion: Session 42 ran as "Bruh Moonshot" (Sam's coinage mid-session); claim your own
superseded: true
superseded_by: session_132_handoff.md
---

<!-- Lineage: … kinship gate + R4 (41) → Session 42: the handoff's "31
     unresolved keys" item unraveled R1 itself — the resolver had been
     walking slot-occupancy chains, 51% of the evidence index was pinned to
     slot-mates. Permutation semantics + stamps fixed the layer the gate
     couldn't see. Two immune systems now: keying (slot-fix) and content
     (kinship). Keep both honest, 43. 🛡🗝 -->

# Session 43 Hand-off Prompt

Session 42 took the smallest item on the list (31 `_unresolved` promotions
keys) and found it was the visible 3% of a 51% mis-keying: R1's resolver
treated alias maps as graphs when they are simultaneous permutations with
slot reuse. The rebuild moved ~1,100 evidence records home, halved the
curator lane (all of it now kin-backed), doubled R4 folds, and shipped an
era guard for the mixed-era browser joins. Paste the block below.

```
You are Session 43 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5; Rule 7 (promotions
     re-key semantics now in its checklist); Branch-Policy auto-merge gates
     (merge on green = clean OR unstable; never park a PR in draft); §11 +
     the "Session 41" and "Session 42" subsections at the end.
  2. docs/kb-notes/methodology-alias-map-resolution-semantics.md — the
     durable pattern: an alias receipt is a simultaneous PERMUTATION, not a
     digraph; slot reuse makes iteration follow occupancy chains; liveness
     proves nothing about the family; era-stamp re-keyed artifacts; per-row
     provenance stamps are the ground truth; restamp receipt _status at
     apply time.
  3. docs/ccr_cluster_cleanup_lessons.md — the Session 42 section.
  4. docs/official_id_fold_scope.md — status header carries the R1-defect
     addendum; §3/§4 numbers are superseded by the slotfix receipt.

WHAT SHIPPED IN SESSION 42 (one PR):
  - kb/_rekey_promotions.py REBUILT: chronological single-step resolution
    (each apply-confirmed map applied AT MOST once, never iterated, no
    liveness shortcut), era stamping (_rekeyed_through — re-runs apply only
    newly appended maps), abort guard on mixed-era inputs, V5 stamp gate
    (resolutions checked against _subj4_remint_from stamps: 1,954/0), a
    resolver self-test every run. Over-merge plan EXCLUDED from the chain
    (STAGED, never dispatched — when Sam dispatches it someday, append its
    map to ALIAS_MAPS in BOTH the rekey script and
    kb/_analyze_official_fold_evidence.py).
  - kb/promotions.json re-applied from the pre-R1 baseline
    (git 462dd99^): 1,972 re-keyed / 111 unchanged / 0 unresolved / 14
    genuine folds. Receipt: kb/promotions_rekey_out/2026-06-11-slotfix/.
  - kb/subj4_apply/alias_map.json _status corrected in place (was a stale
    DRY-RUN header on an APPLIED map; original preserved as
    _status_original; _semantics field documents the permutation).
  - CCR regenerated + artifacts committed (the #348 precedent — the change
    is data-coupled and the tests assert on committed output): Phase B
    1,155→1,178 folded M-IDs (239 official rows); claims-only 307→193 (114
    officials gained real folds); R4 sfolds 301→610; evidence lane 310→158
    groups, ALL kin-backed (the 187 "stale" groups were mis-keyed, not
    stale — they dissolved into folds); stand-alone payload 55,830→55,521.
  - Marquee corrections: ANTH 120 folds 2→7 (the "APPLIED ANTHROPOLOGY ×40
    stale witnesses" were CORRECT evidence pinned to a slot-mate; home is
    ANTH M1035 "Cultural Anthropology"); AUTO 120 X ← M1065/M1067
    (transmissions), AUTO 150 X ← M1075/76/79 (brakes), both with on-topic
    member tables (21 and 51 rows); SPAN 200/210 rosters byte-identical;
    the 5 chimera rows now carry NO evidence. One curated row folded:
    AGRI M1002 "Agricultural Accounting" → C-ID AG-AB 128 (kin-exact,
    precedented by ARTS M1159; curation rides the overlay).
  - CCR ERA GUARD (unified_courses.js): lazy files fetch with ?v=<era> and
    a >15-min stamp mismatch between the tab's data payload and a lazy file
    surfaces a one-time reload banner (#uc-era-warning). This is the likely
    mechanism behind Sam's "non-argumentation courses in COMM M1006" — every
    committed surface of COMM M1006 is argumentation-pure at every revision;
    a tab held open across a deploy joins old row ids against a new lazy
    file, and slot reuse renders another family's members under a row.
    tests/uc_era_guard.test.js guards it; uc_kinship_gate.test.js updated to
    the post-slotfix world. Suite 23/23.
  - family_groups sort gained a sig tiebreak (same-score pairs flipped
    order run-to-run, churning the artifact daily).

WHAT THIS MEANS FOR THE NUMBERS YOU'LL SEE:
  - The Session-41/handoff lane framing ("~123 kin-backed at top, 187 stale
    below the banner") is OBSOLETE: the lane is now 158 groups, all
    kin-backed, no banner section. FLSP M1379 (SPAN 200 ×8 vs 210 ×6) and
    the 12 stand-alone contested entries are still queued.
  - kb/_analyze_witness_kinship.py reads the corrected promotions.json
    directly — its historical numbers (848 kept / 781 blocked) described
    the MIS-KEYED index and will not reproduce. That's expected.

PRIORITY / NEXT (in order):
  1. VERIFY THE CRON no-ops on the slotfix artifacts (first daily run after
     merge: unified_courses_*.js timestamp-only — the family_groups
     tiebreak should remove the cosmetic churn seen on 06-11; AUTO 120 X
     keeps title + its 2 folds; standalone stays 55,521).
  2. SAM'S CURATOR QUEUE: 158 kin-backed groups, every Confirm now
     trustworthy. FLSP M1379 remains the marquee genuinely-mixed row (the
     bare "Intermediate Spanish" title IS two courses; folding it anywhere
     would be wrong — it's a split candidate, not a merge).
  3. COMM M1006 follow-up with Sam: if he can still reproduce
     non-argumentation members AFTER a hard refresh on the post-merge
     deploy, it's something new — get the exact surface (member table vs
     descriptions vs worklist) and a screenshot WITH the title column.
     Otherwise the era guard + slot-fix close it.
  4. The eu/st impact-join UC_OUT_DIR seam: a /tmp regen lacks eu/st fields
     because the impact join reads an input relative to the out dir
     (in-repo runs are fine — cron unaffected). Small, bounded, worth a
     one-line fix next time someone uses the seam for diffing.
  5. NEAR-MISS RESCUE (carryover, curator-led): semantic synonyms
     ("Multivariate"≈"Multivariable") sit in the lane; tiny synonym map
     ONLY if Sam trips over them; never loosen the 0.5 threshold globally.
  6. STANDING: CIS↔CS scope §5 sign-off (docs/cis_cs_convergence_scope.md,
     GATED); ACE skill-level child-exhibit scope; College + System EACR
     views (System needs the privacy ADR finished); EACR v2; 5 DSPS
     "53414" strays; PEDS M10AE; Sam-only Cloudflare worker re-paste.

PATTERNS THAT WORKED (Session 42):
  - Pull the thread on the smallest anomaly. 31 keys "for investigation"
    were the only VISIBLE part of 1,066 — the unresolved ones errored;
    the mis-routed ones landed on live ids and looked fine.
  - Ground truth beats receipts: per-row stamps (_subj4_remint_from)
    travel WITH the row and are immune to slot reuse. 1,954 checks, 0
    conflicts — that's what let the fix ship same-day.
  - Ask of every gate that passed: WHAT does it conserve? V1-V4 all
    conserve under mis-routing. A gate that can't fail on the failure
    mode is decoration. (V5 exists because of this.)
  - Validate on a family the bug can reach. Spanish was immune by
    construction (FLNG/FLSP postdate the permutation) — perfect-looking
    validation, zero coverage.
  - Sam's screenshots are tracer rounds: AUTO 120X exposed the kinship
    layer (41); COMM M1006 exposed the era-mix layer (42). Chase the
    mechanism, not just the instance.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rule 5 never force-push main; C-IDs/CCNs
    verbatim; official targets get NO curation writes; merge ≠ verify;
    folds are display-level (in-memory, recomputed, reversible).
  - Era discipline: kb/promotions.json now carries _rekeyed_through — a
    future re-mint APPENDS its alias map to ALIAS_MAPS (both consumers)
    and re-runs; never re-introduce iteration or liveness shortcuts; never
    chain a map whose apply isn't confirmed by receipts/stamps.
  - Post-squash: git fetch + reset --hard origin/main, then
    force-push-with-lease the next branch push.
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into context;
    parse with scripts that print counts/samples.

Pipeline viz: unchanged this session (no identity re-key — the fix moved
EVIDENCE records, not course ids; the re-mint card still shows the
promotions re-key). A moniker is yours to claim.
```
