---
title: Session 62 Hand-off Prompt — (claim your moniker)
date: 2026-06-18
session: 61 (Bruh Skymarker) → 62 hand-off
status: hand-off — paste the fenced block into Session 62's first message
tags: [handoff, session-prompt, tmc, adt, coci, taxonomy, cpl]
related:
  - docs/tmc_builder_lessons.md (the TMC Builder arc — Session 61 is the newest section)
  - docs/kb-notes/adr-reference-data-committed-json-vs-supabase.md (the taxonomy decision)
  - docs/kb-notes/methodology-coded-key-over-freehand-text-join.md (the matching method)
  - docs/session_59_handoff.md (the DATA lane — Jaccard + Suggested-merges, still paused)
moniker_suggestion: "Bruh Skyforge / Skywright — you're building on the Sky* line (Skydriver, Skyleader, Skymarker)"
superseded: true
superseded_by: session_132_handoff.md
---

# Session 62 Hand-off Prompt

Session 61 (Bruh Skymarker) added the **per-college approved-ADT overlay** to the
TMC Builder, end-to-end in one merged PR (#458). Paste the block below.

```
You are Session 62 on the CPL Project Tracker. Read first:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR unstable;
     §7d (TMC Builder — now incl. the per-college ADT overlay) + §2 file
     inventory (tmc_college_adts.js) + §11 terminology landmine (MC ≠ TMC: the
     TMC Builder is the REAL ASCCC transfer process, separate from the M-ID/MC lane).
  2. docs/tmc_builder_lessons.md — the Session 61 section (the ADT overlay).
  3. docs/kb-notes/adr-reference-data-committed-json-vs-supabase.md +
     methodology-coded-key-over-freehand-text-join.md (the two durable learnings).

WHAT SHIPPED (PR #458, merged + LIVE at
https://cpl-initiative.github.io/cpl-project-tracker/#tmc-builder):
  The COCI *program* export (the 2nd COCI principal set — we already had the
  *course* set as coci_course_list.xlsx) is now in the library and is the
  AUTHORITATIVE source for which colleges hold an approved ADT in each discipline.
  - tmc/_build_college_adts.py -> tmc_college_adts.js (window.CPL_TMC_COLLEGE_ADTS,
    lazy): by_college[college][tmc_id] -> {b:bucket,s:status,c:control#,a:date,
    u:units,t:rawTitle} + tmc_totals + extra_tmcs. 3,238 (college,TMC) pairs ·
    115 colleges · 42 ASCCC TMCs + UCTP. Source CSV committed for provenance at
    tmc/source_data/coci_program_export_2026-06-17.csv.
  - The TMC tab (tmc_builder.js) stamps a per-college ADT status onto every TMC:
    a directory ADT column (the college's ✓ Approved / ⏳ In progress / ◐ Teachout
    when one is picked; the statewide approved-college COUNT in review mode), a
    prominent status BANNER on the TMC detail (adtBannerEl), and a "this college's
    approved ADTs / not yet established" Show-filter.
  - UCTP (UC Transfer Pathway — Chemistry/Physics "for UC Transfer", sub-award
    "A.S. UCTP Degree") are their OWN instances (extra_tmcs, kind
    "uc-transfer-pathway", renderPathwayDetail) — NEVER folded into the Chem/
    Physics ADT (Sam's explicit call mid-build).
  - tests/tmc_college_adts.test.js (30 checks): build-correctness invariants on
    the committed artifact + the new UI. Full suite green (56 files).

DECISIONS BAKED IN (Sam, 2026-06-18):
  - "Approved" = COCI STATUS in {Active, Approved}; in-progress + teachout shown,
    Inactive hidden. Dedup per (college,TMC) keeps the most-affirmative bucket.
  - Public Health Science + Elementary Teacher Education (plain) FOLD into their
    nearest TMC; UCTP does NOT (own instance).

THE TAXONOMY THREAD (Sam asked, I recommended, he may want the follow-up):
  Sam floated a Supabase college-name taxonomy ("loose names everywhere — short,
  long, in-between"). My recommendation (now an ADR): KEEP IT COMMITTED JSON —
  kb/college_short_names.json already IS that taxonomy (118 colleges, canonical +
  aliases + normalize()). Promote to a Supabase overlay ONLY if curators edit
  name-variants live (the kb_curation pattern). The clean FOLLOW-UP (offered, not
  yet done): harden college_short_names.json with the COCI-program aliases (the
  13 "L.A. CITY"/"SAN FRANCISCO CITY"-type forms now in
  tmc/_build_college_adts.py's PROGRAM_COLLEGE_ALIASES) + regen
  college_short_names.js, so every loose dataset resolves through one authority.
  If you do it: edit the json, run kb/_seed_college_short_names.py, ONE PR.

PRIORITY WORKSTREAMS (pick with Sam — he drives interactively):
  1. TMC Builder polish: (a) faculty-verify the 45 draft TMCs (then Official
     template + approved ADT sit side by side); (b) the C-ID-coverage hint +
     title-similarity "suggested (verify)" fill for sparse-C-ID colleges
     (DISTINCT from C-ID auto-fill); (c) the taxonomy follow-up above.
  2. ADT overlay refresh cadence: it's a SNAPSHOT. On a fresh COCI program
     extract, drop the CSV in tmc/source_data/, bump SRC_CSV, run
     `python3 tmc/_build_college_adts.py`, commit. (NOT a daily-cron artifact.)
  3. DATA lane (still PAUSED, docs/session_59_handoff.md): member-join Jaccard
     0.5->0.4 (kb/README MANDATES measuring member-row flips FIRST); title-lane
     pass 2 (`kb/_auto_merge_worklist.py --pass2-title`, on Sam's go); the Z
     future-mint half (kb/uc_cur_zseq.json); per-row auto-merge revert.

PATTERNS THAT WORKED (S61):
  - Profile the CODED fields first (AWARD/SUB AWARD/STATUS/TOP), then match.
    TOP code is the bulletproof key; freehand titles only corroborate (93/197
    titles -> 99.9% of rows). See the methodology KB note.
  - Reconcile entity names with an explicit, FAIL-LOUD crosswalk (the build
    exits non-zero on any unresolved college) — a future extract can't silently
    drop a college.
  - Sam drives interactively + sends mid-build refinements (he corrected UCTP
    mid-stream). Surface findings + the 2-3 real decisions early via
    AskUserQuestion, then build. Merge on his green / our merge-on-green norm.
  - Static TMC artifacts are lazy-loaded by tmc_builder.js (ensureScript), need
    NO HTML <script> tag and NO Rule-4 mirror — only the nav button + pane are
    mirrored. Commit the jsdom test (Part A = invariants on the committed
    artifact, Part B = mock-driven UI).

SAFETY: merge-on-green = clean OR unstable; never force-push main (Rule 5);
  Supabase tmc_* + kb_curation are additive/reviewer-gated — never touch auth/
  Redirect-URL or projects/budget/personnel. Model id stays out of commits/PRs.
  To-Do feed kb/cpl_todos.json: bump _as_of, DELETE done items, <=12.

Good hunting. The TMC Builder is now a recognition AND a status mirror: a
college sees its real approved ADTs (from COCI) right next to the C-ID alignment
it would build. Next horizon: faculty-verify the drafts and close the taxonomy.
```

Claim your own moniker (the Sky* line is open — Skyforge, Skywright, Skywarden…).
🎓🛰️
