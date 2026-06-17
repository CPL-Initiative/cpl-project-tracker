---
title: Session 61 Hand-off Prompt — (claim your moniker)
date: 2026-06-17
session: 60 (Bruh Momentus) → 61 hand-off
status: hand-off — paste the fenced block into Session 61's first message
tags: [handoff, session-prompt, tmc, adt, ge, cal-getc, cpl, milestone]
related:
  - docs/tmc_builder_lessons.md (the full TMC Builder arc — Session 59 + 60 sections)
  - docs/kb-notes/reference-tmc-adt-data-model.md (TMC/ADT + the GE Breadth half)
  - docs/session_60_handoff.md (the prior milestone framing — CPL-native TMCs)
  - docs/session_59_handoff.md (the DATA lane — Jaccard + Suggested-merges, paused)
moniker_suggestion: "Bruh Skyforge / Starhelm / Skywright — or name yourself"
---

# Session 61 Hand-off Prompt

Session 60 (Bruh Momentus) turned the **TMC Builder** from a single-TMC form into a
**list-first directory of all 45 TMCs** and added the **GE Breadth companion** so the
tab now models the *full ADT* (major + GE pattern + electives). All merged + LIVE.
Paste the block below.

```
You are Session 61 on the CPL Project Tracker. Read first:
  1. CLAUDE.md — all of it. Rules 1/4/5/7/8; merge-on-green = clean OR unstable;
     §7d (TMC Builder — list-first + the GE companion); §8 (the tmc_* tables);
     §11 terminology landmine (MC ≠ TMC — the TMC Builder is the REAL transfer
     process; the M-ID/MC lane deliberately avoids the transferability claim).
  2. docs/tmc_builder_lessons.md — Session 59 + the 3 Session-60 sections
     (GE companion, list-first redesign, the Session-60 checkpoint).
  3. docs/kb-notes/reference-tmc-adt-data-model.md — the data model + the GE half.

WHAT SHIPPED (Session 60 — Bruh Momentus; all merged + LIVE at
https://cpl-initiative.github.io/cpl-project-tracker/#tmc-builder):
  - #454 LIST-FIRST. The tab lands on a filterable DIRECTORY of all 45 TMCs
    (Discipline · Degree · Status · C-ID slots · your auto-matches when a college
    is picked). Click a row → that TMC's builder; ← All TMCs returns. The old
    Program/Discipline dropdown is GONE. "All colleges" = a review view (C-ID list
    + curator notes, no picker, Save/Submit hidden). The empty planned/"Coming
    soon" bucket was retired — status is Official | Draft only. One consolidated
    filter block (College · Show · Find a TMC · Curator sign-in).
  - #455 the global "What are you working on" quick-start bar (quickstart.js) is
    now PINNED to the header on desktop (was scroll-with).
  - #456 the GE BREADTH COMPANION — the full ADT = TMC major + GE pattern +
    electives to 60 CSU-transferable units. New tmc_ge_patterns.js: Cal-GETC
    (statewide default, AB 928) + legacy IGETC + CSU GE Breadth. GE areas are
    college-certified, NOT C-ID-keyed (ge:true+noncid:true) → a MANUAL picker (no
    auto-match), units = per-course minimum. renderGeInto() panel below the major,
    a Full-ADT total, saved in the same tmc_submissions.alignments jsonb under
    ge:-keys + _ge_pattern (NO schema change). Builder loads the file itself → no
    HTML/Rule-4 touch.
  - #457 Cal-GETC VERIFIED vs the official Cal-GETC Standards v1.3. Sam confirmed
    the forms he'd sent were the TMC MAJOR templates (not GE Breadth Forms), so the
    GE patterns stayed encoded-from-public-standards EXCEPT Cal-GETC, which was
    trued up: Area 3 (Arts & Humanities) requires 2 courses (not 1) → the pattern
    now sums to 34 semester units. IGETC + CSU GE Breadth are still DRAFT.
  Tests: tests/tmc_ge_breadth.test.js, tests/quickstart_header_bar.test.js,
  tests/tmc_builder.test.js (list-first model). Suite 53 → 55 files green.

PRIORITY WORKSTREAMS (pick with Sam — he drives interactively):
  1. THE CPL-NATIVE TMC WIRING (Sam's stated next milestone, end of S59):
     "embed CPL safely + clearly on these TMCs so prior learning is recognized."
     For each TMC C-ID slot, surface where a CPL articulation already maps to that
     C-ID/credential → a per-slot "this credit may be earnable via CPL at colleges
     X" chip. Pieces exist: kb/coci_articulations.json (earned CPL articulations by
     course identity), the CCR adoption-leverage layer, EACR credential identity.
     SCOPE WITH SAM FIRST; keep it SAFE — "CPL-eligible at colleges X," never
     "guaranteed credit."
  2. VERIFY IGETC + CSU GE BREADTH (finish the GE half). True them up against their
     official forms the same way Cal-GETC was (#457) — pin each pattern's total
     units in tmc_ge_breadth.test.js as the tripwire. Sam can supply the forms;
     the CCCCO Breadth Form PDFs bot-block the agent env, so it's an upload pattern.
  3. TMC BUILDER FOLLOW-UPS (in the To-Do feed): a "N of your courses carry a C-ID
     in COCI" coverage hint + a title-similarity "suggested (verify)" secondary
     fill for sparse-coverage colleges (DISTINCT from C-ID auto-fill); faculty-
     verify the 45 draft TMCs (science ones with "OR" sequences are roughest);
     offer Sam an exportable report of the 25 cid_unverified C-ID discrepancies
     for the C-ID team; optional statewide adoption view off tmc_submissions.
  4. THE DATA LANE (paused since S58, still open): member-join title Jaccard
     0.5→~0.4 — MEASURE member-row flips FIRST (kb/README mandate); the 🏷
     title-lane pass-2 dry-run (Sam's go); the Z future-mint half (S56 deferred).

PATTERNS THAT WORKED:
  - Verify each ADT layer against its OWN authority. A TMC major template (ASCCC
    faculty) ≠ a GE Breadth pattern (CCCCO/ICAS) — one upload of "the forms" does
    not cover both. A wrong select-count silently breaks the unit total → pin the
    total in a test.
  - Reuse, don't fork. The GE companion reuses renderSlot via a keyPrefix param +
    one jsonb (no schema change); the curator login is the CCR's magic-link verbatim
    (shared cpl_sb key).
  - When a host bot-blocks the agent env (c-idsystem.org / CCCCO 403 even with a
    browser UA), the human fetches in their browser + uploads; the agent parses.
  - Sam drives interactively + goes live fast. Merge on his go; dispatch the cron.

SAFETY: merge-on-green = clean OR unstable (don't over-wait for clean). Never
  force-push main (Rule 5). Rule 4: CPL_Dashboard.html ≡ index.html — but the TMC
  tab is STATIC JS, so most TMC work touches no HTML. Supabase: tmc_* tables are
  additive, reviewer-gated writes; never touch auth/Redirect-URL or
  projects/budget/personnel. To-Do feed (kb/cpl_todos.json): bump _as_of, DELETE
  done items, ≤12. Stop-hook false-positives after a squash-merge are cosmetic —
  fix the hook, NEVER rewrite main.

DOC DEBT: CLAUDE.md §7d still has stale dropdown/Coming-soon prose lower down (the
  Session-60 list-first + GE bullets are correct at the top, with a reconcile note).
  A focused §7d rewrite is a good early-session cleanup once the TMC design settles.
```

Good hunting. The TMC Builder is now a real, live tool that models the *whole* ADT
for every California college — the next horizon (CPL-native TMC slots) turns it from
a transfer instrument into a recognition engine for prior learning. Sam named the
last two sessions "Star Navicus" and "Momentus" — pick a moniker in that sky/voyage
spirit (Skyforge? Starhelm? Skywright?) or name yourself. 🎓🛰️
