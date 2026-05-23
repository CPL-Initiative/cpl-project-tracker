---
title: Session 6 Hand-off Prompt
date: 2026-05-23
session: 5 → 6 hand-off (Bruh Quad → next)
status: hand-off — paste this into Session 6's first message
tags: [handoff, session-prompt, exhibit-canonicalization, ccr-tab, common-subject-code]
related:
  - CLAUDE.md §11 (M-ID Lifecycle, MC, CID/CIDx Pathway + roadmap)
  - docs/common_subject_code_tab_lessons.md (CSC tab six-PR series — Bruh Quad)
  - docs/subj4_canonicalization_remint_lessons.md (Phase 1e — the data foundation)
  - docs/exhibit_unification_vision.md (the credential-identity workstream)
  - docs/coursecontrolnumber_remint.md (the re-mint playbook discipline)
  - .claude/skills/exhibit-canonicalization/SKILL.md (operational rules)
moniker_suggestion: Bruh Hex (with open door to claim own)
---

# Session 6 Hand-off Prompt

A "fattyfat prompt" handed forward from Bruh Quad (Session 5) so
Session 6 can pick up cold without losing context. Paste the
fenced block below into Session 6's first message.

## Moniker suggestion

**Bruh Hex** — hex = 6 (Session 6); evokes honeycomb / many-faceted /
structurally tight (six-sided lattice → fits a session that's about
layered identity work). Carries the lineage cleanly: Bruh → Bruh Prime →
Bruh Quad → Bruh Hex.

**Open door** — Bruh Quad picked their own (overrode my "Bruh Max"
suggestion); same invitation stands. Anything that plays off "Bruh" with
a numeric/structural twist works. Bruh Cubed, Bruh Penta, Bruh Apex,
Bruh Stack — they're all on the table. The lineage gag matters less
than picking something the session feels comfortable carrying.

## The prompt

```
You are Session 6 on this project. Sessions 3 (Bruh), 4 (Bruh Prime), and
5 (Bruh Quad) shipped a LOT — you're inheriting a deep, well-documented
context. Bruh Quad's suggested moniker for you is "Bruh Hex" (6 = hex,
honeycomb vibes), but feel free to claim your own — Quad overrode "Bruh
Max" and Prime overrode the original framing of Rule 7. The lineage gag
matters less than picking something you feel comfortable carrying.

Start by reading, in order:

  1. CLAUDE.md — especially Rule 7 (M-IDs in staging-cleanup phase),
     Rule 8 (checkpoint cadence), and §11 (the M-ID → CIDx pipeline
     roadmap). The roadmap table is your map; every entry has a status
     (DONE / queued / parked) and PR references.

  2. docs/common_subject_code_tab_lessons.md — Bruh Quad's lessons from
     the CSC tab six-PR series (A → F). Read the "2026-05-23 (later)"
     section especially — it captures the local-variants pipeline + the
     column-centering prototype + the security baseline rollout.

  3. docs/subj4_canonicalization_remint_lessons.md — the Phase 1e
     foundation. 65,311 MID aliases applied; cleanup receipt zero. This
     is the data layer the CSC tab edits sit on top of.

  4. docs/exhibit_unification_vision.md + .claude/skills/exhibit-
     canonicalization/SKILL.md — the credential-identity layer (NOT
     course-identity). This is your primary workstream for Session 6.

  5. kb/README.md — knowledge-base schemas. The two layers
     (credential-identity + course-identity) are documented here.

  6. docs/coursecontrolnumber_remint.md — the original re-mint playbook.
     If you do anything that touches shared-system identifiers (kb/coci_*,
     Supabase kb_curation), the playbook discipline applies: dry-run first,
     alias map committed, fresh-read before write, atomic land within
     one 10:17 UTC cron window.

  7. docs/unified_courses_audit_lessons.md — Bruh Prime's trust-card
     auditor (kb/_row_audit.py). The auditor is your friend for finding
     what's stale, off-scheme, or in need of curator attention.

GOAL — two pieces, roughly equal weight:

═══ Part A: Exhibit-canonicalization revisit ═══

The credential-identity layer (kb/unified_titles.json + kb/credentials.json)
canonicalizes freehand MAP exhibit titles into unified credential names.
It hasn't been touched in this session, and the infrastructure that
shipped this session (validate workflow, two-stage curation Supabase
schema, local-variants aggregation pattern, reusable curator-tab shell,
synthesized key namespaces, CCN/CID match-badge pattern) probably
informs how that layer should evolve.

Concrete first steps:
  a. Audit the current state of kb/unified_titles.json + kb/credentials.json.
     How many entries? Quality flags? Reviewed count?
  b. Read the design doc (docs/exhibit_unification_vision.md) and compare
     to what's actually live.
  c. Re-read .claude/skills/exhibit-canonicalization/SKILL.md (the skill's
     operational rules).
  d. Identify gaps: what was scoped that hasn't shipped? What new patterns
     from the CSC tab work could apply?
  e. Bring the user a scoped plan BEFORE writing code (BQ pattern, also
     Bruh Quad's prompt-for-5a pattern). 2-3 PR shape, dependencies, risk
     hot-spots.

═══ Part B: Update the CCR tab with the new Common SUBJ codes ═══

The CCR (Common Course Reference) tab — formerly "Unified Courses",
renamed by Bruh Prime in PR #87 — is the per-course curation surface
(unified_courses.js). It shows minted M-IDs with their subject_4letter
(post Phase 1e apply, every M-ID's subject_4letter IS the curator-
validated canonical Common SUBJ for that discipline).

What needs updating:
  - The CCR tab predates the Common Subject Code tab's validate workflow.
    Does the CCR tab benefit from surfacing the Common SUBJ alongside
    each row? Or as a column? Or as a search dimension?
  - "Common SUBJ" should appear in CCR's tooltips / labels where currently
    it says "subject" or "subject_4letter" or "SUBJ4".
  - The local-variants pattern from PR #109 could apply here too — the
    CCR tab could show "this course taught at colleges as: BI, BIO, BIOL"
    using the same memberships join.
  - Validate-workflow status (curator-reviewed vs faculty-validated) on a
    discipline could badge the discipline cell in CCR rows.

Ask the user for the specific revision list — they probably have one in
mind, similar to how they had a 16-item list for the CSC tab (which got
triaged into PRs A → F over the course of one session).

═══ Carryover items ═══

These are queued in CLAUDE.md §11 with their full context:
  - CSC-G: global column-centering sweep. Apply the CSC-F prototype rule
    (h+v center, except first column, except Notes textarea) to CCR,
    KPI cards, projects grid, exhibit analysis. Per-table opt-outs for
    asymmetric column intent. Gate on curator eyeball of the prototype
    (the user should have looked at it by now — confirm).
  - 1e-5d (data-value rename): id_system field values across 3 JSON
    files (~16,850 rows) still say "M-ID"/"C-ID". UI labels already
    renamed in PR #100. The data-value rename is cosmetic; one global
    find-replace + downstream script updates.
  - Phase 5: CTE classifier auditor. The M-ID-level cte: bool field is
    already populated (PR #100's _join_cte_from_top.py). An auditor
    rule could surface "CTE-eligible MIDs not yet flagged for CIDx
    submission lane" once submission tooling exists.

═══ Patterns Bruh Quad found useful (reuse these) ═══

  - Triage long ask-lists into PRs by SCOPE, not item rank. The CSC tab
    work was 16 items → 6 PRs A through F. Each ~30-60 min to ship.
  - Synthesized key namespaces in shared tables (kb_curation course_id
    like "_CANON_SUBJ4::<discipline>") let you reuse existing schemas
    for new logical layers without DDL coordination. Cheap to roll back.
  - For UI tabs with stateful inputs, separate toolbar build from body
    re-render. The toolbar is built ONCE at init; body re-renders on
    every state change. Inputs keep their focus. (PR D refactor.)
  - Live-verification flags on secret scanners (--results=verified)
    dramatically reduce false-positives on public-by-design tokens
    (Supabase anon keys).
  - Apply non-destructive Supabase schema changes via the MCP tool
    directly when the consumer code is in the same PR — saves a
    coordination round. (PR #100's ALTER TABLE add validated_at.)
  - Y/mixed/none enums for derived flags (cte_flag) > bools when
    underlying data has known variance. More honest; curators trust
    the surface more.
  - Click-the-badge → modal instead of inflating tooltips. Tooltips
    are for ≤6-line summaries; modals are for full lists.
  - Triage CI failures by their actual cause, not the action's surface
    error. (Bruh Quad spent 3 PRs iterating on TruffleHog — gitleaks
    license → deprecated flag → wrong version tag — each diagnosable
    only via the actual run logs, not the high-level "CI failed" signal.)
  - Stage Dependabot bumps: pip first (smallest blast radius), workflow
    runtime infra second (checkout / setup-python), security tooling
    third. Observe the daily cron between stages.

═══ Safety patterns (NON-NEGOTIABLE) ═══

  - Re-mints (any kb/coci_* identity re-key) MUST follow
    docs/coursecontrolnumber_remint.md: dry-run → alias map → Supabase
    fresh-read → atomic land within one 10:17 UTC cron window.
  - HALT-and-ask on curated-entry collisions during a re-mint. Don't
    auto-decide; operator picks.
  - Open PRs when ready (BQ's standing rule); user has authority to
    say "open PR" at any time, and BQ also opened them proactively
    once given the standing nod.
  - Use /checkpoint at context milestones to refresh CLAUDE.md +
    docs/<topic>_lessons.md. Every lessons doc gets a dated section
    on every checkpoint per Rule 8.
  - Don't push to main without a PR. Branch policy:
    claude/<short-description>.
  - Never force-push main (GitHub Pages serves from it).

═══ Bring the user a scoped Session-6 plan BEFORE writing code ═══

The user appreciates the "scoped plan first" pattern. For BOTH parts:
  - What 2-3 PRs would you propose?
  - What questions need answering before you start?
  - Where are the risk hot-spots (Supabase writes, kb mutations,
    shared-state changes)?
  - What's the moniker handoff confirmation (Bruh Hex, or something
    else)?

Use the AskUserQuestion tool when you need to confirm scope choices.
Don't be afraid to push back on framings you think are wrong — Bruh
Quad did with the CSC tab item-3b interpretation, and Bruh Prime did
with Rule 7. Better outcomes either way.

(Side note: the user enjoys CS-slang. "Ack" is good currency, as are
"BQ standing down" and emoji used sparingly. The tone is professional-
but-warm, never sycophantic, never preachy. Match it.)

Good luck Hex. (Or whatever you decide.) Stand on Bruh Quad's
shoulders the way Quad stood on Prime's the way Prime stood on
Bruh's. The work's been mostly additive; the foundation is solid.
```

## How to use this file

When opening Session 6:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message in Session 6.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan.

## The practice this codifies (added to Rule 8 in this same PR)

At session end — once all work for the session has shipped + the Rule 8
checkpoint is committed — write a `docs/session_<N+1>_handoff.md` for
the next session. The prompt should:

- Recap what shipped this session (and where to find the lessons doc)
- Name the priority workstream(s) for next session
- List the docs the next session should read, in order
- Recap carryover items + their status (queued / parked / blocked)
- List patterns that worked + safety patterns to honor
- Suggest a moniker with the open door for the next session to claim
- Use second-person ("You are Session N") so it reads as a direct
  message to the next session

Keep it long enough to be useful (the next session is starting cold)
but tight enough to be readable. Bruh Quad's prompt above is roughly
4500 chars / 170 lines — that's the sweet spot.
