---
title: Session 53 Hand-off Prompt (data lane)
date: 2026-06-12
session: 51 → 53 hand-off (written at the Session-51 close — Bruh Photonicus; 52 is the design lane's — docs/session_52_handoff.md)
status: hand-off — paste the fenced block into the next DATA-lane session's first message
tags: [handoff, session-prompt, ccr, csr, kin-pe-pass2, athletics, title-normalization, merge-curation]
related:
  - docs/ccr_cluster_cleanup_lessons.md (Session 51 section — the full story)
  - docs/kb-notes/methodology-fanin-alias-lexicon-contamination.md (the durable lesson)
  - kb/kin_pe_pass2_out/2026-06-12/ (alias map, merging analysis, HS fold, Supabase ops)
moniker_suggestion: Session 51 was "Bruh Photonicus" (Sam's christening, 2026-06-12 20:54 UTC); claim your own
superseded: true
superseded_by: session_132_handoff.md
---

# Session 53 Hand-off Prompt — the data lane

Session 51 was Sam-interactive all night: the PEDU dissolution + TOP-aware
athletics carve-out, the title normalization, 205 curation merges, the
lost-worklist-saves fix, and grouped Subject dropdowns on CCR + CSR. Paste
the block below.

```
You are Session 53 on the CPL Project Tracker (the DATA lane; the design
lane reads docs/session_52_handoff.md — coordinate via kb/cpl_todos.json).
Read these first, in order:
  1. CLAUDE.md — all of it. Critical Rules 1/2/4/5/7; merge-on-green =
     clean OR unstable; §11 + the Session 50/51 subsections.
  2. docs/ccr_cluster_cleanup_lessons.md — Session 51 section.
  3. docs/kb-notes/methodology-fanin-alias-lexicon-contamination.md.
  4. kb/kin_pe_pass2_out/2026-06-12/athl_family_analysis.md + hs_title_fold.md
     (what was auto-merged vs FLAGGED — the flags are the curator queue).

WHAT SHIPPED IN SESSION 51 — Bruh Photonicus (PRs #412 data · #413 test repins · #414 CSR ·
#415 CCR, all 2026-06-12 night):
  - KIN/PE PASS 2 (kb/_kin_pe_pass2.py, receipts kin_pe_pass2_out/): the
    fan-in convergences had never re-pointed the inference lexicons, so
    re-derivation resurrected "Physical Education" (605 rows → Sam's PEDU
    parking pin) + "Theater Arts" (147). Lexicons re-pointed; bare
    'intercollegiate' keyword DROPPED; kb/_alias_canon.py guards all four
    passes; 1,057 ids re-keyed (G1–G8 PASS), PEDU dissolved, refined
    athletics rule = modal TOP 0835.50 minus instruction-exceptions →
    133 KINE parents + 419 singles to ATHL; 20 fam-twin merges; flips
    stamped MANUAL (no discipline_source) so passes can't clobber them.
    Chain green; fold-verify re_key 0; Supabase pins for the two alias
    disciplines DELETED; CSR back to 146 disciplines.
  - TITLE NORMALIZATION (kb/_normalize_common_titles.py): 19,739 titles —
    Title Case (acronym-safe), romans→digits (clinical-IV/Title-V/pronoun-I/
    Malcolm-X guards), "(formerly …)" stripped, mojibake fixed. Display-only;
    re-runnable; idempotent.
  - MERGE CURATION (205 kb_curation rows, mirrored + SELECT-back verified):
    26 ATHL roster families (frozen contract — per sport+gender in-season
    team; season/level/positional/coed lanes FLAGGED not merged); Sam's
    fitness set (core → KINE M1596 "Physical Fitness"; Walking kept its
    lane; noncredit M9017 kept its band); 35 "High School X" folds into
    de-HS'd same-band same-SUBJ4 twins (Sam: articulation agreements are
    the equivalence backstop; HS-Equivalency/Diploma phrases protected;
    19 cross-SUBJ4 twins flagged only).
  - LOST-SAVES BUG FIXED (#415): fetchOverlay pulled only discipline rows;
    Sam's worklist merges saved to Supabase but never replayed on reload.
    Now: combined overlay fetch + applyMergeLocal replay + "Keep as-is"
    button (merge_dismissed rows; signature-keyed, membership change
    re-offers) + CCR Subject optgroups. CSR (#414): white non-bold header,
    one-line CTE, needs-4-letter chip moved to the Common SUBJ cell,
    SUBJ filter with optgroups. Generator: substantive_curation() so a
    dismissal-only row can't fake-Verify (#412).
  - TESTS (#413): 6 post-fold-stale files re-pinned mechanism-style → 35/35.

PRIORITY / NEXT (in order):
  1. VERIFY THE REGEN: the post-merge dispatch published new artifacts —
     CCR Kinesiology view should show ATHL athletics + the merged roster
     families + normalized titles; audit chip count == latest.json; suite
     35/35 against the NEW artifacts (mechanism pins should hold — confirm).
  2. THE FLAGGED QUEUES (curator demand-driven): unmarked-gender rosters
     ("Intercollegiate Wrestling/Badminton/Golf…"), Fall/Spring section
     lanes, conditioning/theory/fundamentals families, the 19 cross-SUBJ4
     HS twins, the 118 no-twin "High School X" rows (fold when twins
     appear), kb/kin_pe_pass2_out/2026-06-12/*.md.
  3. CLEANUPS: ARTS M1201 "Ceramic Technology" → re-curate to an MQ name
     (skip_unknown_disc); add "HS" to the title-casing ACRONYM_KEEP next
     normalization run; discipline_title_mismatch grew 712→757 (sports
     titles vs Kinesiology — honest noise; consider a sports-title
     suppression on that rule if Sam tires of the flags).
  4. STANDING: smog residuals + 🏷/📝 queues; CIS↔CS scope close-out;
     C-ID router Phase 2+3b; termly receipt cadence; CER statewide bucket;
     EACR College/System views (privacy ADR).

PATTERNS THAT WORKED (Session 51):
  - Measure-first dry-runs on EVERY mutation (the pass-2 dry-run caught
    the 3 instruction-exception yoga/karate/kickboxing rows; the family
    analyzer caught coed "(Men and Women)" + positional Defense/Offense
    rows before apply).
  - Frozen rule sets in the receipt (rules{} in alias_map.json) — the
    auditable contract for every future "why is this row here?".
  - Manual-state stamping (value, no discipline_source) as the ONLY
    pass-proof discipline state — the durable fix the original convergence
    lacked.
  - Sam-interactive curation: his screenshots → rules, his hand-merges →
    automation (the HS fold replicated + flattened his own Arithmetic-2
    chain).
SAFETY PATTERNS TO HONOR:
  - Rule 4 byte-identical HTMLs; Rule 5 never force-push main; C-IDs/CCNs
    verbatim; merge ≠ verify; bands never cross in merges.
  - Curation re-keys mirror to Supabase in the same operation, fresh-read
    at write time (Sam curates LIVE — check for his rows before assuming).
  - An alias map is a simultaneous permutation; register every apply in
    kb/_rekey_promotions.py ALIAS_MAPS (pass 2 is registered).
  - Don't cat the big kb/coci_*.json; pipe long applies to a FILE, not
    head (a SIGPIPE killed a write mid-apply this session — caught).
  - The To-Do feed: bump _as_of, DELETE done items, ≤12.
```
