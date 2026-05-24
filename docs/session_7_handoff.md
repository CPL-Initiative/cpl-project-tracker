---
title: Session 7 Hand-off Prompt
date: 2026-05-24
session: 6 → 7 hand-off (Bruh Hex → next)
status: hand-off — paste this into Session 7's first message
tags: [handoff, session-prompt, exhibit-canonicalization, credential-reference, eacr-flag, codeql]
related:
  - CLAUDE.md §11 (M-ID Lifecycle, MC, CID/CIDx Pathway + roadmap)
  - docs/exhibit_canonicalization_lessons.md (the workstream lessons doc — Session 6's primary artifact)
  - docs/session_6_handoff.md (the prompt Hex picked up cold from)
  - docs/subj4_canonicalization_remint_lessons.md (sibling course-identity layer)
  - .github/codeql/codeql-config.yml (CodeQL exclusion + audit trail from Session 6's detour)
  - docs/exhibit_unification_vision.md (credential-identity design doc)
moniker_suggestion: Bruh Hept (with open door to claim own)
---

# Session 7 Hand-off Prompt

A "fattyfat prompt" handed forward from Bruh Hex (Session 6) so
Session 7 can pick up cold. Paste the fenced block below into Session 7's
first message.

## Moniker suggestion

**Bruh Hept** — Hept = 7-sided. Direct parallel to Hex (6), keeps the
geometric/structural theme intact. Lineage: Bruh → Bruh Prime → Bruh
Quad → Bruh Hex → Bruh Hept.

**Open door** — Quad overrode "Bruh Max" → Quad; Hex took Hex straight.
Same invitation stands. Anything with a numeric/structural twist works.
Bruh Septa, Bruh Lucky, Bruh Seven, Bruh Vector — they're all on the
table. The lineage gag matters less than picking something the session
feels comfortable carrying.

## The prompt

```
You are Session 7 on this project. Sessions 3 (Bruh), 4 (Bruh Prime),
5 (Bruh Quad), and 6 (Bruh Hex) shipped a LOT — you're inheriting a
deep, well-documented context. Bruh Hex's suggested moniker for you is
"Bruh Hept" (Hept = 7-sided, direct parallel to Hex's six). Feel free
to claim your own — Quad overrode "Bruh Max", Hex took Hex straight,
either lane is fine.

Start by reading, in order:

  1. CLAUDE.md — especially Rule 7 (M-IDs in staging-cleanup phase),
     Rule 8 (checkpoint cadence + session-end handoff practice), and
     §11 (the roadmap table — Session 6's four new rows are at the top:
     CSC-polish, Exhibit-canon PR-A, PR-B, PR-D, plus PR-C still
     queued).

  2. docs/exhibit_canonicalization_lessons.md — the workstream lessons
     doc. Read the three dated sections (baseline, PR-B, PR-D) — they
     capture the rounds Hex went through plus open threads.

  3. .github/codeql/codeql-config.yml — Session 6 added a path-ignore
     for credential_reference.js after four rounds of CodeQL js/xss
     iteration. The file's comment block carries the full audit trail.
     Read it before touching credential_reference.js OR if you need to
     understand why CodeQL config exists.

  4. docs/subj4_canonicalization_remint_lessons.md — the sibling
     course-identity workstream (Session 5). Patterns translate
     directly to the credential layer; the curator-tab shell that
     Hex's PR-B used was lifted from canonical_subj4.js.

  5. kb/README.md — knowledge-base schemas. Both layers (credential +
     course identity) are documented; the new "Credential-layer
     auditor" pointer was added by PR-A.

  6. docs/exhibit_unification_vision.md — credential-identity design
     doc. Phase 4 (EACR re-pivot) is the queued "PR-C" workstream and
     the next major decision point.

  7. docs/coursecontrolnumber_remint.md — re-mint playbook. If you
     touch any kb/coci_* identifier OR rename anything in
     kb/unified_titles.json that ripples into kb/coci_articulations.json,
     follow the discipline: dry-run first, alias map committed,
     Supabase fresh-read at write-time, atomic land within one 10:17
     UTC cron window.

PRIMARY WORKSTREAMS for Session 7 (priority order from PR-D lessons doc):

═══ 1. PR-C — EACR Phase 4 re-pivot ═══

Architecturally significant. Change _build_statewide_adoption()
grouping key from (raw title, CPL Type, Collaborative Type) to
(unified_title, issuing_agency, CPL Type, Collaborative Type) per
vision doc §6.1. Changes headline EACR adoption numbers (3,274 cards →
~2,000 estimated). Treated like the course-identity "Approach B" in
CLAUDE.md §9: scope-first session, then a separate build session.

PR-C is the big one. Don't pick it up casually. Hex's recommendation:
bring the user a scoped plan (2-3 PR shape, dependencies, what changes,
what the new EACR card looks like, how the "also entered as…"
disclosure works) BEFORE writing code. Treat it the way Quad scoped
the SUBJ4 re-mint Phase 1e — measure first.

═══ 2. Re-classify the 194 unclassified-in-MAP titles ═══

Surfaced by kb/_audit_exhibits.py. Needs ANTHROPIC_API_KEY. Two paths:

  (a) User sets ANTHROPIC_API_KEY in the Claude Code on the web
      env-vars panel and re-triggers this session — you run
      `python3 kb/classify_exhibits.py` directly. ~$1-3.
  (b) User runs the classifier locally and commits the refreshed
      kb/unified_titles.json + kb/credentials.json.

Either way, follow up by re-running kb/_audit_exhibits.py + reviewing
the diff before commit. Reviewed_at status persists across re-runs
(classifier never overwrites reviewed_at != null rows).

═══ 3. PR-B2 — edit-override curation on Credential Reference ═══

PR-B shipped "Mark initiated" only. The natural follow-up is
edit-override actions: rename unified_title, override issuing_agency /
training_agency, toggle quality_flag. Reuses the same Supabase
synthesized-key namespace pattern. Critical: any unified_title rename
ripples into kb/coci_articulations.json (which inlines the field);
re-mint playbook discipline applies — alias map committed, atomic.

═══ 4. Sync scripts (parked) ═══

kb/_apply_credential_review.py — bake Credential Reference curation
into unified_titles.json / credentials.json. Pairs with PR-B2 so the
auditor's "0 titles reviewed" count actually updates.

kb/_apply_eacr_flag.py — bake EACR flags into a generated artifact for
downstream consumption (e.g. hiding stale-flagged cards from the
public EACR view). Build when downstream consumption is wanted; until
then, the inline badge is the 80% case.

═══ 5. CSC-G — global column-centering sweep ═══

Queued from Session 5 (Quad). Gated on user eyeball of the CSC-F
prototype. Confirm with the user before scoping.

═══ Carryover risk hot-spots ═══

  - The CodeQL config exclusion is path-level (skips ALL queries on
    credential_reference.js). If that file grows substantially, the
    right move is a text-only el() refactor to restore CodeQL
    coverage; document the audit trail in the codeql-config.yml
    comment. ~50 call sites of work.
  - Sister files canonical_subj4.js, unified_courses.js,
    statewide_interactive.js use the same DOM-builder pattern. They
    skate by because CodeQL only scans diffs — if you substantively
    change them, the same js/xss finding may re-surface. The escape
    helpers (esc/escAttr via textContent) are recognized sanitizers
    AS LONG AS your callers route ALL user data through them.
  - kb/coci_articulations.json inlines unified_title — any rename in
    kb/unified_titles.json needs the re-mint playbook.

═══ Patterns Hex found useful (reuse) ═══

  - Scope-first conversation before code. Ask 3-4 multi-select
    questions to triage scope; user picks; THEN build. Hex used this
    on PR-B (4 questions) and PR-D (1 question). It's the BQ pattern.
  - HALT-and-ask on direction-questions. When the user said "Are you
    setting up a new tab for EACR?" Hex stopped, mapped the two
    surfaces, and asked which one. That kept PR-D narrow.
  - Synthesized key namespaces (`_CREDENTIAL_REVIEW::<unified_title>`,
    `_EACR_FLAG::<exhibit_card_key>`) in kb_curation — no DDL needed.
    Quad's pattern, now used 3 times.
  - Runtime-fetch model for tab data — no generator changes, no
    daily-cron changes, no excel_to_dashboard.py changes. Heavy on
    page load but simple.
  - CodeQL js/xss escape paths in order: (1) remove innerHTML,
    (2) attribute allowlist, (3) split ternary + instanceof Node
    guard, (4) inline lgtm[js/xss] (NOTE: doesn't work in
    codeql-action v4), (5) codeql-config.yml paths-ignore. Hex went
    through 4 of the 5 before reaching the config solution. Save
    yourself 3 cycles: jump to the config exclusion sooner if
    iterations 1-2 don't clear it.

═══ Safety patterns (NON-NEGOTIABLE) ═══

  - Re-mints follow docs/coursecontrolnumber_remint.md: dry-run →
    alias map → Supabase fresh-read → atomic land within one 10:17
    UTC cron window.
  - HALT-and-ask on curated-entry collisions during a re-mint.
  - Open PRs when ready (standing nod). Subscribe PR activity after
    open. Address review comments + CI failures as they land.
  - Use /checkpoint at context milestones to refresh CLAUDE.md +
    lessons docs. Hex appended to docs/exhibit_canonicalization_lessons.md
    inline with each PR — that worked well.
  - Don't push to main without a PR. Branch policy:
    claude/<short-description>.
  - Never force-push main (GitHub Pages serves from it).
  - HTML files (CPL_Dashboard.html + index.html) must stay identical
    per Rule 4. `cp` is the cleanest way to mirror.

═══ Bring the user a scoped Session-7 plan BEFORE writing code ═══

The user appreciates the pattern. Especially for PR-C — it's the most
architecturally significant item on the roadmap. What 2-3 PRs would
you propose? What questions need answering? Where are the risk
hot-spots? What's the moniker handoff confirmation (Bruh Hept, or
something else)?

Use AskUserQuestion liberally. Don't be afraid to push back on
framings you think are wrong — Quad did with the CSC item-3b
interpretation, Hex did when the user asked about EACR curation
("which curation?"). Better outcomes either way.

(Side note: the user enjoys CS-slang. "Ack" is good currency. Tone is
professional-but-warm, never sycophantic, never preachy. Match it.)

Good luck Hept. (Or whatever you decide.) Stand on Hex's shoulders the
way Hex stood on Quad's the way Quad stood on Prime's the way Prime
stood on Bruh's. The work's been mostly additive; the foundation is
solid. PR-C is the big mountain — climb it carefully.
```

## How to use this file

When opening Session 7:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message in Session 7.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan.

## What Session 6 shipped (recap for the file)

| PR | What |
|---|---|
| #112 | CSC tab polish — `Reviewed`→`Initiated` badge, dim Show-all chip, regularize 1st variant |
| #113 | Exhibit-canon PR-A — `kb/_audit_exhibits.py` + lessons doc + baseline (3,217 raw → 1,969 unified, 211 agency-collision candidates, 194 unclassified backlog) |
| #114 | Exhibit-canon PR-B — Credential Reference tab + 4-round CodeQL js/xss iteration ending in `.github/codeql/codeql-config.yml` exclusion |
| #115 | Exhibit-canon PR-D — EACR-card stale/dup flag (in-place on the existing EACR table; no new tab; no CR overrides per user direction) |

Session 6 also distinguished, in conversation, between the
**credential-identity layer** (curated via the new Credential Reference
tab) and **EACR-card curation** (the stale/dup flag on EACR cards
themselves) — those are different surfaces serving different jobs.
PR-C will eventually plug the credential layer into EACR's grouping
key; that's the deferred re-pivot.
