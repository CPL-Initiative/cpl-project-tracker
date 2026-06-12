---
title: Session 47 Hand-off Prompt
date: 2026-06-12
session: 46 → 47 hand-off (written at the Session-46 checkpoint — the AUTO/smog over-mint case)
status: hand-off — paste the fenced block into Session 47's first message
tags: [handoff, session-prompt, ccr, title-lane, smog, guards, worklist]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 46 section — the full story)
  - docs/kb-notes/methodology-title-similarity-merge-guards.md (the durable lesson)
  - docs/session_46_handoff.md (Session 45's queue — most items still standing)
moniker_suggestion: Session 46 ran overnight on Sam's "trust you to autopilot" brief; claim your own moniker
---

# Session 47 Hand-off Prompt

Session 46 was Sam's "tear into the auto overmints, particularly smog I and
II" night — the case study became the 🏷 title-evidence lane (the worklist's
6th section) + the shared guard suite. One PR (#385). Paste the block below.

```
You are Session 47 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5/7; Branch-Policy
     auto-merge gates (merge on green = clean OR unstable; never park a PR
     in draft); §11 + the "Session 45" and "Session 46" subsections at the
     end (44 and earlier → docs/roadmap_archive.md).
  2. docs/ccr_cluster_cleanup_lessons.md — the Session 46 section.
  3. docs/kb-notes/methodology-title-similarity-merge-guards.md — the
     guard suite + the licensure-spec lesson.

WHAT SHIPPED IN SESSION 46 (1 PR, #385):
  - The AUTO/smog case study: one California BAR Smog Check spec (~5 real
    course types) = 52 identities (10 M-IDs + 42 stand-alones); all
    existing lanes combined surfaced 3 trivial pairs. Root causes, each
    now a rule: the desc lane can't see singletons; units gates are WRONG
    for externally standardized curricula (same spec at 1-7u per college
    — POST modules run 7-21.5u); agency/geo title decorations ("BAR",
    "Bureau of Automotive Repair", "California State") break signature
    equality but lose to IDF weighting; cardinal word-numbers ("Level
    Two") weren't folded anywhere.
  - kb/_title_consolidation_dryrun.py — IDF-weighted title cosine >= 0.62
    over dark M-IDs + 54k stand-alones; credit + discipline-OR-TOP-
    division corroboration + >=2 shared content tokens; NO units gate
    (spread reported); CLIQUE-CONSISTENT components (every cross-pair must
    pass guards before two components unite — unmarked titles can't chain
    Level 1 + Level 2). Receipt kb/title_consolidation_out/candidates.json:
    5,662 groups (4,376 cross-college; 2,255 mixed M-ID+stand-alone).
    Smog: 52 fragments -> 9 coherent families.
  - kb/_consolidation_guards.py — the guard suite extracted to a SHARED
    module (desc + title lanes both import it): TWO-AXIS level marks
    (word-levels vs digit-levels — "Elementary Portuguese 2" no longer
    pairs with "Intermediate Portuguese - Level 1", both {1,2} flat),
    STRICT-EQUALITY variant marks (refresher/update/supplemental/
    instructor/supervisor/module/modular/bridge/honors — a variant never
    pairs with its base), year-edition marks (15xx-20xx), context-marked
    session letters ("Session C" != "Session A"), gender + sport.
    Word-numbers also folded into _sug_sig + _fam_key (generator) and the
    desc lane's sig — keep every sig function in LOCKSTEP.
  - Desc receipt re-run under the new guards: 474 -> 446 groups; all 37
    removals were real conflations (Honors-vs-base, "to 1877"/"Since
    1877", Fire Module chimeras). ECED marquee family intact.
  - Consumer: 🏷 "Title evidence · near-duplicate course titles" section
    (after 📝, before 🧾); units-spread note in the explainer; same-college
    amber; mixed groups merge into the M-ID, all-singleton groups mint a
    new unified course. tests/uc_title_lane.test.js (21 assertions, incl.
    both smog marquee families). Suite 30/30.
  - Artifact policy honored: only unified_courses_suggestions.js committed
    (the jsdom tests read it in CI); heavy artifacts checked out for the
    cron; post-merge dispatch fired.

PRIORITY / NEXT (in order):
  1. SAM'S CURATOR QUEUE (standing, now FOUR dark-evidence lanes): the new
     🏷 title lane (5,662 — cross-college first; the smog families are the
     showcase: L1&2 = AUTO M1001+M1002+M1217+M10AG; L2 = 10 colleges incl.
     the mis-keyed AUTB M1037), 📝 desc (446), 🧾 evidence (155), title/
     family lanes. NEVER auto-apply; FLSP M1379 stays the marquee SPLIT.
  2. VERIFY the next cron no-ops on the #385 artifacts (suggestions joins
     TWO static receipts now — byte-stable mod the generated_at stamp;
     hash with stamps normalized, never trust --stat). The cron will also
     legitimately publish the _fam_key word-number fold's CER regrouping
     (credential_reference_data.js) — that diff is EXPECTED once.
  3. THE CANONICAL-SUBJ4 FOLD is riper still: collision-signal 1,210, and
     Session 46 surfaced mis-keyed rows the homonym audit can't see (AUTB
     M1037 "SMOG CHECK II" under Auto Body via apprenticeship code APPR;
     AVIA M10KE "BAR Emissions Update" under aviation) — apprenticeship-
     style subject codes (APPR/ATECH/APRN) aren't subject_map entries, so
     #381's auditor never graded them. Consider extending the audit to
     TOP-vs-SUBJ4-discipline disagreement at the IDENTITY grain before the
     fold. Rule 7 playbook applies: dry-run, alias map, promotions re-key,
     atomic within a cron window.
  4. C-ID ROUTER PHASE 2 + 3b (scope §8): ccn_equiv bridge; termly refresh
     procedure; curation surfaces for the held classes (76 coci_conflict,
     285 multi-descriptor, 3,976 unmatched).
  5. TERMLY RECEIPT REFRESH procedure: desc + title receipts re-run
     together (both import the shared guards — upgrade once, re-run both),
     alongside the c-id.net refresh. Not yet written as a playbook; small
     doc if a refresh actually happens.
  6. STANDING: statewide-category review bucket (State Bar + HRCM 001);
     activity-grid reorder product call; CIS↔CS scope §5 sign-off (GATED);
     ACE skill-level child-exhibit scope; College + System EACR views
     (System needs the privacy ADR); EACR v2; 5 DSPS "53414" strays;
     PEDS M10AE; Sam-only Cloudflare worker re-paste; CCR perf watch
     (get the SPECIFIC action from Sam before touching).

PATTERNS THAT WORKED (Session 46):
  - Read the over-mint corpus BEFORE designing the merge rule — the smog
    52 dictated every gate (singletons in, units out, discipline-OR-TOP,
    word-numbers). Schema-only design would have kept the units gate and
    missed 80% of the corpus.
  - Let the naive run's output design the guards (two-axis levels, variant
    marks, session letters all came from reading real damage — same as
    Session 45's #381/#382).
  - Clique-consistency at union time beats size caps for chained
    components (vacuous-pass semantics make unmarked titles bridges).
  - Extract the shared module the day the SECOND consumer appears — the
    desc lane's guard had already drifted from what the title lane needed.
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs (this checkpoint touched the pipeline
    recent-apply card in BOTH); Rule 5 never force-push main; C-IDs/CCNs
    verbatim; official targets get NO curation writes; merge != verify.
  - Worklist lanes NEVER auto-apply; same-college groups rank last with
    the amber banner; precision/recall posture: gate only what reliably
    marks a DIFFERENT course (levels/variants/years), REPORT what merely
    warrants attention (units spread, same-college).
  - Sig functions in lockstep: _sug_sig (generator) == sig() in BOTH
    receipt builders. A sig-equal pair belongs to the exact-title lane;
    enrich one sig, enrich all three, or pairs double-queue.
  - The inference chain order matters: pass 1 (lexicon, retracts) -> desc
    -> TOP -> TOP-division -> re-seed CSR -> re-run row audit. After
    lexicon edits ALWAYS run kb/_audit_subject_map.py first.
  - Don't cat the big kb/coci_*.json or unified_courses_*.js into
    context; parse with scripts that print counts/samples.

Pipeline viz: refreshed this checkpoint (the recent-apply card headlines
the smog case + title lane in BOTH HTMLs). A moniker is yours to claim.
```
