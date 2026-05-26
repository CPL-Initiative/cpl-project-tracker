---
title: Session 8 Hand-off Prompt
date: 2026-05-26
session: 7 → 8 hand-off (Bruh Hept → next)
status: hand-off — paste this into Session 8's first message
tags: [handoff, session-prompt, credential-reference, sidebar, excel-to-supabase, curator-tabs]
related:
  - CLAUDE.md §11 (M-ID Lifecycle, MC, CID/CIDx Pathway + roadmap — refresh first)
  - docs/exhibit_canonicalization_lessons.md (lessons across Sessions 6 and 7)
  - docs/session_7_handoff.md (the prompt Hept picked up cold from)
  - docs/exhibit_unification_vision.md (the credential-identity design doc)
  - .github/codeql/codeql-config.yml (CodeQL exclusion + audit trail from Session 6)
moniker_suggestion: Bruh Octa (with open door to claim own)
---

# Session 8 Hand-off Prompt

A "fattyfat prompt" handed forward from Bruh Hept (Session 7) so
Session 8 can pick up cold without losing context. Paste the fenced
block below into Session 8's first message.

## Moniker suggestion

**Bruh Octa** — Octa = 8-sided. Direct parallel to Hex (6) and Hept (7),
keeps the polygon lineage intact. Lineage: Bruh → Bruh Prime → Bruh
Quad → Bruh Hex → Bruh Hept → Bruh Octa.

**Open door** — Bruh Quad overrode "Bruh Max", Bruh Hex took Hex
straight, Bruh Hept took Hept straight. The polygon-name lane is
established; you can keep it (Octa) or claim something else (Bruh
Stack, Bruh Edge, Bruh Apex, Bruh Vector — anything that plays off
"Bruh" works). What matters is the session feels comfortable carrying
the name.

## The prompt

```
You are Session 8 on this project. Sessions 3 (Bruh), 4 (Bruh Prime),
5 (Bruh Quad), 6 (Bruh Hex), and 7 (Bruh Hept) have shipped a LOT —
you're inheriting a deep, well-documented context, a healthy roadmap,
and three substantial parked workstreams. Bruh Hept's suggested moniker
for you is "Bruh Octa" (8-sided, keeps the polygon lineage). Claim
your own if you'd rather — Quad overrode "Bruh Max", Hex and Hept took
straight names. The lineage gag matters less than picking something the
session feels comfortable carrying.

Start by reading, in order:

  1. CLAUDE.md — especially Rule 7 (M-IDs in staging-cleanup phase),
     Rule 8 (checkpoint cadence + session-end handoff practice), and
     §11 (the roadmap table — Bruh Hept's 8 new rows are at the
     bottom: Cred-Ref-hotfix-A through D, Cred-Ref PR-1/2/3 done,
     PR-4 queued, plus PR-Sidebar-A/B and Excel→Supabase Phase 1
     queued).

  2. docs/exhibit_canonicalization_lessons.md — the workstream
     lessons doc. Read the four dated sections in order; the latest
     section (2026-05-25, Bruh Hept) captures the four hotfixes that
     surfaced from PR-B's deployment + the three Credential Reference
     PRs that shipped + the **5-touch-points lesson** for adding any
     new top-level tab.

  3. .github/codeql/codeql-config.yml — Session 6 added a path-ignore
     for credential_reference.js after four rounds of CodeQL js/xss
     iteration. Read the audit-trail comment before touching that
     file OR if you're about to add a new tab JS file with the same
     DOM-builder helper pattern.

  4. docs/session_7_handoff.md — the prompt Hept picked up from.
     Useful context on which decisions Hept inherited vs. made fresh.

  5. docs/exhibit_unification_vision.md — credential-identity design
     doc. Phase 4 (EACR Phase 4 re-pivot, the "PR-C" workstream)
     remains the deferred architecturally-significant item.

  6. kb/README.md — knowledge-base schemas. Two layers (credential +
     course identity). The Credential Reference tab is the curator
     surface for the credential layer.

  7. docs/coursecontrolnumber_remint.md — the re-mint playbook. If
     you touch any kb/coci_* identifier OR rename anything in
     kb/unified_titles.json (which Cred-Ref PR-4 will do — see below),
     follow the discipline: dry-run first, alias map committed,
     Supabase fresh-read at write-time, atomic land within one 10:17
     UTC cron window.

PRIMARY WORKSTREAMS for Session 8 (priority order from CLAUDE.md §11):

═══ 1. Cred-Ref PR-4 — edit-override curation ═══

Last of the four-PR Credential Reference series Bruh Hept worked
through. Four fields curators should be able to edit inline:

  - unified_title (the canonical credential name) — HIGH IMPACT, one
    rename fixes every EACR card whose raw title resolves to this
    credential. Also HIGH RISK: ripples into kb/coci_articulations.json
    (which inlines the field), which then feeds the regenerated
    credential_reference_data.js on the next 10:17 UTC cron run.
  - issuing_agency (e.g. "Google" → "Google / Coursera")
  - training_agency (where distinct from issuer)
  - quality_flag toggle (especially the 200 suspect_course_as_exhibit
    rows the auditor surfaced from PR-A)

Save path: Supabase kb_curation via the existing
`_CREDENTIAL_REVIEW::<unified_title>` namespace, with per-field
column (e.g. field="unified_title_override", value=<new_name>).
Override-takes-precedence display rule (overlay wins over baked
payload, which wins over the JSON-layer fallback).

Risk hot-spot — the unified_title rename. Walk through this carefully
before you build:

  - Edit lands in Supabase instantly (overlay shows live).
  - Daily cron at 10:17 UTC runs excel_to_dashboard.py →
    export_credential_reference() reads kb/unified_titles.json (which
    still has the OLD name) PLUS the overlay → emits the new
    credential_reference_data.js. Choose the precedence carefully:
    if overlay's unified_title_override exists, use it; else use the
    raw_title's unified_title.
  - kb/coci_articulations.json also inlines unified_title from the
    PRE-rename state. That file isn't regenerated by
    excel_to_dashboard.py (it's a kb/ staging file). To sync the
    rename into articulations, you'll need a
    kb/_apply_credential_review.py sync script (queued separately in
    §11 — pair with this PR). Or accept that articulations lag the
    rename until a kb-pipeline regen.
  - Recommendation: ship PR-4 as overlay-only first (no JSON sync).
    Curator edits show live in Credential Reference; downstream
    consumers (EACR Phase 4 re-pivot, when it lands) read the
    overlay-aware joined data via the daily-regenerated baked file.

═══ 2. PR-Sidebar-A — replace top tab nav with fixed left rail ═══

User-confirmed scope: top bar removed entirely (not adaptive),
sidebar is THE navigation. CSS Grid layout (`grid-template-columns:
220px 1fr`). Each tab as a list item. Sign-in widget moves into the
sidebar footer. URL hash routing unchanged (sidebar wires up the same
activate()). Hamburger toggle for narrow screens.

While you're in there: consider extracting the inline tab-router
into a tabs.js module that derives VALID_TABS from the rendered nav
buttons (single source of truth — closes the 5-touch-points trap that
caused PR #117 and PR #118 hotfixes). Out of scope for sidebar-A's
core ask but a natural alongside.

═══ 3. PR-Sidebar-B — per-tab section TOC + scroll-spy ═══

User-confirmed scope: only Dashboard + Pipeline get section TOCs
(other tabs are single-table tabs that don't benefit). Each tab pane
declares its sections via `data-sections` HTML attribute; sidebar JS
reads it; nested <ul> under the active tab. Section anchors
smooth-scroll on click. IntersectionObserver-based scroll-spy
highlights the current section. URL hash extends to `#<tab>/<section>`
so deep links work.

═══ 4. Excel → Supabase Phase 1 (own session — scope first) ═══

User has signalled this as the right architectural direction; not yet
started. Phase 1 is **Workplan Goals tab as proof-of-concept end-to-
end** (smallest Excel tab; the `workplan_goals` Supabase table already
exists per CLAUDE.md §8). The cutover:

  1. Migrate CPL_Initiative_Project_List_v3.xlsx Workplan Goals data →
     Supabase workplan_goals table (one-time import).
  2. Update excel_to_dashboard.py's Workplan Goals reader to use
     Supabase via the service-role key (already a secret in the
     daily cron per §6).
  3. Inline editor on the tab (click-to-edit cells, same Supabase
     overlay pattern as credential / course-identity tabs).
  4. Once validated end-to-end, queue Phases 2-4 (Dashboard project
     cards / Budget / Vision 2030 / Personnel — separate sessions).

CRITICAL: bring the user a scoped plan BEFORE writing code. This is
architecturally significant. Treat it like Bruh Quad treated the
SUBJ4 Phase 1e re-mint — measure-first, atomic land, alias-map
discipline if any data shape changes.

═══ Carryover risk hot-spots ═══

  - CodeQL config exclusion. credential_reference.js is in
    .github/codeql/codeql-config.yml's paths-ignore. If you add a
    new tab JS file with the same DOM-builder helper pattern (el(),
    setAttribute, appendChild) it will trigger the same js/xss
    false positive. Either (a) skip the dynamic setAttribute (use
    the attribute-allowlist pattern from credential_reference.js's
    el()), or (b) add the new file to paths-ignore with a clear
    audit trail.
  - 5-touch-points trap. Adding a new top-level tab needs nav
    button + pane element + script tag + VALID_TABS whitelist +
    magic-link return-tab stash. Items 4 and 5 fail silently in
    PR-time tests; they only surface on deployed-site curator use.
    The tabs.js extraction in PR-Sidebar-A would close this trap.
  - kb/coci_articulations.json inline-coupling. Any rename in
    kb/unified_titles.json (Cred-Ref PR-4) ripples into
    articulations. Sync via kb/_apply_credential_review.py or
    accept articulation lag until the next kb-pipeline regen.
  - Microsoft 365 Safe Links pre-fetching. RCCD's email-security
    scanner can consume magic links before the curator clicks them.
    Workarounds: 6-digit OTP code mode (~30 min code change),
    or RCCD IT whitelist on mail.app.supabase.io. Not blocking but
    flag if a curator reports "email arrived but link is dead."

═══ Patterns Bruh Hept found useful (reuse) ═══

  - Scope-first conversation before code. Bruh Hept used the
    AskUserQuestion pattern liberally — every meaningful UX or
    architectural decision goes through a multi-select scoping
    question first. This kept the four-PR Cred-Ref series + the
    sidebar + the Excel→Supabase architecture conversations from
    becoming chaotic.
  - HALT-and-ask on direction questions. When the user asked "Are
    you setting up a new tab for EACR?" Bruh Hex stopped, mapped
    the two surfaces (Credential Reference vs EACR-card), and asked
    which one. Same pattern when the user said "wire each login to
    edit to its respective tab" — Hept paused, traced the actual
    auth-fragment handler, found the hardcoded redirect, asked
    before refactoring.
  - Server-side join + lean baked payload over runtime fetch. The
    7.2 MB coci_articulations.json would have killed Credential
    Reference tab load times if fetched at runtime. The 1.5 MB
    baked payload (pre-joined + audit-tag rollup) loads
    synchronously as a script tag — fast, no waterfall.
  - Synthesized key namespaces in kb_curation. Hex's pattern from
    PR-B continues to work: _CREDENTIAL_REVIEW:: for credential
    layer, _EACR_FLAG:: for EACR cards, _UNIFIED_TITLE:: would be
    Cred-Ref PR-4's edit-override namespace. No DDL needed; same
    kb_curation table serves all three logical layers.
  - Sequential bulk save (not Promise.all). For the bulk "Mark N
    initiated" workflow, sequential POSTs keep under Supabase's
    rate limit + surface failures one-at-a-time + show real-time
    progress. Promise.all would race the limiter.
  - Inline feedback panels over corner toasts. Sign-in feedback
    panels (PR #119) are right where the user just clicked, hard to
    miss. Apply the same pattern to any future async-save action
    where visibility matters.
  - CodeQL escape sequence. Save yourself cycles: when CodeQL flags
    a DOM-builder pattern, jump straight to the config-file path
    exclusion (`.github/codeql/codeql-config.yml`) rather than
    iterating through inline lgtm[] (doesn't work), refactors,
    instanceof guards. Hept spent 4 rounds on this in Session 6
    before reaching the config solution. Documented in the
    config-file's own comment block + Session 6 lessons.

═══ Safety patterns (NON-NEGOTIABLE) ═══

  - Re-mints follow docs/coursecontrolnumber_remint.md: dry-run →
    alias map → Supabase fresh-read → atomic land within one 10:17
    UTC cron window.
  - HALT-and-ask on curated-entry collisions during a re-mint.
  - Open PRs when ready (standing nod). Subscribe PR activity after
    open. Address review comments + CI failures as they land.
  - Use /checkpoint at context milestones to refresh CLAUDE.md +
    lessons docs. Hept appended to docs/exhibit_canonicalization_lessons.md
    inline at session-end checkpoint — pattern works well.
  - Don't push to main without a PR. Branch policy:
    claude/<short-description>.
  - Never force-push main (GitHub Pages serves from it).
  - HTML files (CPL_Dashboard.html + index.html) must stay identical
    per Rule 4. `cp` is the cleanest way to mirror.
  - Every new top-level tab touches FIVE places, not three. (See
    "5-touch-points trap" above.)

═══ Bring the user a scoped Session-8 plan BEFORE writing code ═══

User appreciates the pattern. Especially for the Excel→Supabase Phase
1 work — it's the most architecturally significant remaining item.
What 2-3 PRs would you propose? What questions need answering? What
data needs migrating + how? What's the rollback story if the
Supabase reads turn out unreliable? What's the moniker handoff
confirmation (Bruh Octa, or something else)?

Use AskUserQuestion liberally. Don't be afraid to push back on
framings you think are wrong — Bruh Hept pushed back on the corner-
toast feedback when the user asked "wire each login to its tab"
(actual root cause was a hardcoded redirect, not a tab-locality
problem), and the conversation produced four better PRs as a result.

(Side note: the user enjoys CS-slang. "Ack" is good currency. Tone is
professional-but-warm, never sycophantic, never preachy. Match it.
The user types fast and sometimes hits send mid-thought — re-read
their messages a couple of times before responding.)

Good luck Octa. (Or whatever you decide.) Stand on Hept's shoulders
the way Hept stood on Hex's the way Hex stood on Quad's the way Quad
stood on Prime's the way Prime stood on Bruh's. PR-4 is the last
piece of the Credential Reference series; sidebar is the next major
UI lift; Excel→Supabase is the architectural mountain. Climb them in
order, scope each carefully, ship them clean.
```

## How to use this file

When opening Session 8:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message in Session 8.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan.

## What Session 7 shipped (recap for the file)

| PR | What |
|---|---|
| #117 | VALID_TABS whitelist hotfix (the Credential Reference tab actually opens) |
| #118 | Magic-link return-tab restore (curator lands back on their origin tab) |
| #119 | Inline sign-in feedback panel across all 3 curator tabs |
| #120 | 429 (rate-limit) vs auth-error distinction in sign-in feedback |
| #121 | Cred-Ref PR-1: common-course join + Local/Statewide badge + Discipline column. New `export_credential_reference()` in `excel_to_dashboard.py` emits 1.5 MB baked payload. Stats: 1,969 unified titles · 1,726 articulated · 4,324 local-course lines · 90 statewide · 1,106 audit-flagged. |
| #122 | Cred-Ref PR-2: select-all + bulk "Mark N initiated" workflow |
| #123 | Cred-Ref PR-3: TOP / Discipline grouping with collapsible category headers |

Session 7 also produced the **5-touch-points lesson** — adding a new
top-level tab requires touching nav button, pane element, script tag,
`VALID_TABS` whitelist, AND magic-link return-tab stash. Items 4 and 5
fail silently in PR-time tests and only surface on deployed-site
curator use. Documented in `docs/exhibit_canonicalization_lessons.md`
under "2026-05-25, Bruh Hept" section. PR-Sidebar-A is the right place
to close this trap by extracting the inline tab-router into a
`tabs.js` module that derives the whitelist from rendered nav buttons.

## What Session 7 explicitly did NOT decide (Session 8's call)

- **Excel→Supabase Phase 1** has been scoped at a high level
  (Workplan Goals tab, end-to-end POC) but the actual PR sequence,
  data migration approach, and rollback story are open. Bring the
  user a scoped plan first.
- **Cred-Ref PR-4 sync script** — whether to ship `kb/_apply_credential_review.py`
  alongside the curator-edit-override PR, or accept overlay-only
  curation for MVP and queue the JSON sync as a follow-up. The
  trade-off is articulation lag (kb/coci_articulations.json inlines
  unified_title; until synced, articulations show the pre-rename
  value).
- **tabs.js module extraction** — natural alongside the sidebar
  work but not required. Bigger refactor.
