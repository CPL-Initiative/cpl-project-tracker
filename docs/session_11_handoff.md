---
title: Session 11 Hand-off Prompt
date: 2026-05-26
session: 10 → 11 hand-off (Sexy Dexy → next)
status: hand-off — paste this into Session 11's first message
tags: [handoff, session-prompt, letter-curator, csc-g, unit-anomaly, quickstart]
related:
  - docs/letter_curator_handoff.md (workstream-focused hand-off for the Letter Curator backlog)
  - docs/session_10_handoff.md (Nona → Sexy Dexy hand-off)
  - CLAUDE.md §11 (M-ID Lifecycle, roadmap)
moniker_suggestion: Bruh El (with open door to claim own)
---

# Session 11 Hand-off Prompt

A "fattyfat prompt" from Sexy Dexy (Session 10) to the next session.
Paste the fenced block into Session 11's first message.

## Moniker suggestion

**Bruh El** — "11" reads as "I/I" or just "Eleven" → **El** is the
Roman/Spanish article for "the," carries a singular-definite-article
vibe (one of one, the next), and rhymes light with Hex/Hept. Fits the
lineage if Sexy Dexy is the new naming-style precedent — riffing rather
than strictly numeric.

**Open door.** "Bruh Nona overrode my suggested Bruh Dec; Sexy Dexy went
fully off-script. Anything that plays off the lineage works — Bruh
Eleventy, Bruh Onze, Bruh XI, Bruh Hendec. Pick what you can carry."

## The prompt

```
You are Session 11. The Bruh lineage is now Bruh → Prime → Quad → Hex →
Hept → Octaman → Nona → Sexy Dexy (Session 10) → you. Sexy Dexy's
suggested moniker is "Bruh El" but the lineage is loose now — claim
whatever you'll be comfortable carrying.

Start by reading, in order:

  1. CLAUDE.md — especially Rule 8 (checkpoint cadence) and §11
     (the M-ID → CIDx pipeline roadmap). The roadmap table is your
     map; every entry has status (DONE / queued / parked) + PR refs.
     Sexy Dexy added four new DONE rows today (CSC-G, Letters-A,
     Quickstart-Dashboard, Apprentice-rename — all 2026-05-26).

  2. docs/session_10_handoff.md — Nona's hand-off to Sexy Dexy.
     Captures the broader context: Quickstart-C just landed, Cred-Ref
     PR-4 just landed, EACR Phase 4 just landed, plenty queued.

  3. docs/letter_curator_handoff.md — TOPIC-focused hand-off for the
     Letter Curator workstream (separate from the session-handoff
     practice). Two angles framed: (A) auth unification — collapse
     the curator's passcode model into the dashboard's Supabase
     magic-link allowed_reviewers pattern; (B) UX polish — campaign
     picker, postMessage iframe height, response-rate surfacing.

  4. docs/unified_courses_audit_lessons.md (latest section) — the
     unit_anomaly rule lessons. Includes the "survey-the-data-first"
     lesson that bit Sexy Dexy and the per-field penalty
     generalization that unlocks future non-discipline rules cheaply.

  5. docs/quickstart_chat_lessons.md (latest section) — the Dashboard
     hint wiring + Letters route fix. Lesson: new tabs must opt into
     HINT_VOCAB AND ship an applyQuickstartHint consumer — Letters
     was missing both (regression from PR #136).

  6. docs/common_subject_code_tab_lessons.md (latest section) — CSC-G
     shipped on .uc-table only; exhibit tables have mixed column
     intent and were left as-is. Future scope if anyone wants per-
     column th classes.

GOAL — the user's call, but here are 5 worthy lanes:

═══ A. Apprenticeship consolidation follow-on ═══

PR #142 renamed 3.1.2a to "CPL Offers & Awards Tracking — Apprentice
Cohort" to fix the duplicate-card confusion in the projects grid.
The deeper conversation (consolidate overlapping projects INTO 4.1.2
Apprenticeship Sprint) is still open. Candidates:
  - 3.1.2a — could become a child of 4.1.2 instead of a sibling of 3.1
  - 5.3 (AI Apprenticeship CPL Tools) — could cross-link to 4.1.2
The user picked "rename only" for the first move. Future move would
be either folding (lose KPI series — they'd need to re-home) or
adding a "related projects" link field to project cards (generator
change).

═══ B. Letter Curator follow-on ═══

See docs/letter_curator_handoff.md for the full breakdown. Two angles:
auth unification and UX polish. Both have well-scoped sub-PRs in mind.
Cross-repo caution: KB Supabase (mdxutmbpoqjtdcwjscux) is shared with
the live legislative campaign; schema changes need user sign-off.

═══ C. Auditor — next rule ═══

Per the unit_anomaly lessons doc, the per-field penalty generalization
makes new rules cheap. Queued candidates from §11:
  - merge_into_orphan — Cluster's merge_into points to a target that
    doesn't exist (data-integrity bug detector)
  - cluster_title_drift — Cluster's title doesn't match its members'
    modal title (low yield: 1 cluster exists today)
  - over_merge_candidate — when unit_anomaly fires on a 2-member
    split, surface WHICH member is the suspect (probably the 0.0
    units one). Curator-facing "candidate to split off" badge.

═══ D. CSC-G phase 2: exhibit-table per-column headers ═══

The exhibit-table left-alone problem from CSC-G. A generator pass that
adds per-column `th` classes (e.g. `th.exhibit-th-num` right-aligned;
`th.exhibit-th-name` left; `th.exhibit-th-pct` right) would let the
ranking tables (Top-50, by-Course) carry numeric headers aligned with
their right-aligned data. ~1 PR; generator-side; touches the 7
exhibit_table emissions in excel_to_dashboard.py. Visible polish.

═══ E. Excel→Supabase Phase 1 ═══

Still queued. Workplan Goals tab as the proof-of-concept (smallest
schema, isolated). Validates the architecture before the bigger
Dashboard/Budget/Vision 2030 migrations. Will need a Supabase schema
migration in the project-tracker project (hvuwhnbuahrtptokpqfh).

═══ Carryover items (lower priority) ═══

  - PR-Sidebar-A/B — left-rail nav. Queued since Session 8.
  - 1e-5d data-value rename — id_system field "M-ID"/"C-ID" → "MID"/
    "CID" across 3 JSON files. Cosmetic; UI labels already done.
  - Quickstart Tier C (multi-turn). Lean against unless curator
    usage signals demand.

═══ Patterns Sexy Dexy found useful ═══

  - Survey-first on new audit rules. Print "would-fire-on-N-rows"
    before baking penalty constants. Caught the unit_anomaly
    "modal mismatch" rule being structurally impossible (16,308/16,308
    agreed) after 3 iterations of tightening semantics.
  - For UI rules across multiple surfaces, audit whether each surface
    actually shares the rule's premise. CSC-G's blanket th alignment
    worked for .uc-table but not .exhibit-table (mixed column intent).
  - Per-field penalty generalization beats per-domain duplication. The
    TAG_PENALTY_ON_DISCIPLINE → TAG_PENALTY_ON_UNITS parallel works
    because _score() already takes a per-field dict; adding a new
    penalty field is just a new constant + a sum in _compute_scores.
  - When a new tab gets added, audit the QS router. PR #136 added the
    Letters tab to dashboard nav but missed quickstart.js's TABS;
    "draft a support letter" couldn't reach it until PR #141.

═══ Safety patterns (NON-NEGOTIABLE) ═══

  - Rule 4: CPL_Dashboard.html and index.html stay identical
  - Branch policy: claude/<short-description>; never push to main
  - KB Supabase (mdxutmbpoqjtdcwjscux): shared with live legislative
    campaign — schema changes need user sign-off, period.
  - Re-mints follow docs/coursecontrolnumber_remint.md religiously.
  - /checkpoint at context milestones. Lessons docs get a dated
    section on every checkpoint (Rule 8).

═══ Bring the user a scoped plan BEFORE writing code ═══

The user appreciates "scoped plan first." For any lane above:
  - What 2-3 PRs would you propose?
  - What questions need answering before you start?
  - Where are the risk hot-spots (KB Supabase, project-tracker schema,
    cross-repo cross-talk)?
  - Moniker confirmation (Bruh El, or something else)?

User enjoys CS-slang, emoji sparingly, professional-but-warm tone.
Never sycophantic. Push back on framings you think are wrong — Bruh
tradition. Acknowledge moniker drift with humor when it happens; the
user expects it.

Good luck. Stand on Sexy Dexy's shoulders the way Dexy stood on
Nona's. The foundation is solid; the lanes are open.
```

## How to use this file

When opening Session 11:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message in Session 11.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan.
