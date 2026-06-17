---
title: Session 60 Hand-off Prompt — Bruh Momentus
date: 2026-06-17
session: 59 (Bruh Star Navicus) → 60 (Bruh Momentus) hand-off
status: hand-off — paste the fenced block into Session 60's first message
tags: [handoff, session-prompt, tmc, adt, cpl, curator, milestone]
related:
  - docs/tmc_builder_lessons.md (the full TMC Builder arc — 3 "Session 59 cont." sections)
  - docs/kb-notes/reference-tmc-adt-data-model.md (TMC/ADT data model + auto-match)
  - docs/session_59_handoff.md (the DATA lane — Jaccard + Suggested-merges, paused)
moniker_suggestion: Sam named you "Bruh Momentus" — own it
---

# Session 60 Hand-off Prompt — Bruh Momentus

Session 59 (Star Navicus) built the **TMC Builder** tab end-to-end across PRs
#450 → #452, all merged + LIVE. Sam's next milestone: **embed CPL natively into
the TMCs**. Paste the block below.

```
You are Session 60 (Bruh Momentus) on the CPL Project Tracker. Read first:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR unstable;
     §7d (TMC Builder — now the full story) + §8 (the TMC Supabase tables);
     §11 terminology landmine (MC ≠ TMC — the TMC Builder is the REAL transfer
     process, separate from the M-ID/MC lane).
  2. docs/tmc_builder_lessons.md — the 3 "Session 59 cont." sections.
  3. docs/kb-notes/reference-tmc-adt-data-model.md — the data model + auto-match.

WHAT SHIPPED (PRs #450/#451/#452, all merged + LIVE at
https://cpl-initiative.github.io/cpl-project-tracker/#tmc-builder):
  A new TMC Builder tab. Pick a College + a Transfer Model Curriculum → LEFT
  column = the fixed ASCCC C-ID course list (Required Core / List A/B/C); RIGHT
  column = a searchable picker of THAT college's own COCI courses, AUTO-FILLING
  the local course that already carries each slot's C-ID. Total Units shown;
  exports .docx/print/JSON; Save/Resume to Supabase.
  - ALL 45 official TMCs encoded (tmc/_parse_tmc_pdfs.py, PyMuPDF, from the PDFs
    Sam uploaded to tmc/source_pdfs/; 756 slots, all status='draft'). Verified
    C-IDs use the descriptor's authoritative title. 25 slots flagged
    cid_unverified (a C-ID-discrepancy signal — mostly 2026 TMCs).
  - CURATOR LAYER: a Status filter (All/Official/Draft/Coming soon/New requests);
    "New requests" = the CO-review queue (a tmc_submissions row with
    status='submitted', written by the 📤 Submit-for-CO-review action);
    magic-link login (shared cpl_sb session, allowed_reviewers gate —
    map@rccd.edu now, CCCCO account LATER per Sam) gating per-row global curator
    notes (tmc_curator_notes); each TMC's committed PDF as a 📎 artifact link.
  Files (all STATIC/lazy, NOT cron artifacts): tmc_builder.js (renderer+auth+
  curator UI), tmc_templates.js (45 TMCs, auto-generated), tmc_college_courses.js
  (per-college COCI, 7.5 MB), tmc/source_pdfs/*.pdf (45, provenance + artifacts),
  tmc/_parse_tmc_pdfs.py, tmc/supabase_tmc_submissions.sql + supabase_tmc_curator.sql,
  tests/tmc_builder.test.js (42 assertions).

THE NEXT MILESTONE (Sam, end of S59): "embed CPL safely and clearly on these
TMCs so folks can save money/time and have their workplace/life training
recognized and native to our system."
  - The wiring: for each TMC C-ID slot, surface where a CPL articulation already
    maps to that C-ID/credential, so a student's prior learning satisfies the
    slot natively. The pieces exist: kb/coci_articulations.json (earned CPL
    articulations by course identity), the CCR's adoption-leverage layer, and the
    EACR credential identity. Cross-ref TMC slot C-ID → CPL-articulated identity.
  - Keep it SAFE + CLEAR: CPL recognition is real but must not over-claim; mark
    it as "CPL-eligible at colleges X" not "guaranteed credit." Scope it with Sam
    before building (likely a per-slot CPL chip + a "this credit may be earnable
    via CPL" disclosure).

CARRYOVER (TMC Builder):
  - Faculty-verify the 45 draft TMCs. Humanities/social-science parsed cleanly;
    the SCIENCE TMCs (Biology/Chemistry/Physics) with "OR" sequence-branches are
    rougher — spot-fix from tmc/source_pdfs/ (re-run tmc/_parse_tmc_pdfs.py or
    hand-edit tmc_templates.js, then flip status→'official').
  - The 25 cid_unverified discrepancies: offer Sam an exportable report for the
    C-ID team (he flagged this as valuable).
  - Sparse C-ID coverage (~1/4 of colleges, incl. Riverside): a coverage hint +
    an optional title-similarity "suggested (verify)" fill, DISTINCT from C-ID
    auto-fill. No contact hours in COCI (units+C-ID only for now).

CARRYOVER (DATA lane, still paused — docs/session_59_handoff.md): the member-join
  Jaccard 0.5→0.4 (measure member-row flips FIRST per kb/README); title-lane
  pass 2; the Z future-mint half; per-row auto-merge revert.

PATTERNS THAT WORKED (S59):
  - When a host bot-blocks the agent env (c-idsystem.org 403s curl AND urllib even
    with a browser UA), the human fetches in their browser/desktop + UPLOADS; the
    agent parses. PyMuPDF (fitz) for PDFs — pdfplumber/pypdf hit a broken
    cryptography binding in this container.
  - Validate extracted C-IDs against cid_descriptors.json + use the descriptor's
    authoritative title — PDF table noise then doesn't matter.
  - Reuse infra: the curator login is the CCR's magic-link verbatim (shared
    cpl_sb key). New curation field/table = ~small edits + a jsdom test.
  - Sam drives interactively + goes live fast. Merge on his go; dispatch cron.

SAFETY: merge-on-green = clean OR unstable, BUT GitHub Actions CI was badly
  lagging this session (0 checks for 15+ min) — if it's stuck and Sam says
  "merge it", merge (no branch protection enforces checks; tests are green
  locally). Never force-push main (Rule 5). Supabase: tmc_* tables are additive,
  reviewer-gated writes; never touch auth/Redirect-URL or projects/budget/
  personnel. To-Do feed (kb/cpl_todos.json): bump, DELETE done items, ≤12.
```

Good hunting, Bruh Momentus — the TMC Builder is a real, live tool for every
California college; the next horizon (CPL-native TMCs) turns it from a transfer
instrument into a recognition engine for prior learning. 🎓🛰️
