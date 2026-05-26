---
title: Session 10 Hand-off Prompt
date: 2026-05-26
session: 9 → 10 hand-off (Bruh Nona → next)
status: hand-off — paste this into Session 10's first message
tags: [handoff, session-prompt, quickstart, sidebar, excel-to-supabase, curator-tabs]
related:
  - CLAUDE.md §11 (roadmap — Quickstart-C just landed; PR-Sidebar-A/B + Excel→Supabase + CSC-G still queued)
  - docs/quickstart_chat_lessons.md (lessons doc for the chat — created this session)
  - docs/exhibit_canonicalization_lessons.md (lessons across Sessions 6–8)
  - docs/session_8_handoff.md (Bruh Octa's hand-off — the prompt Nona picked up cold from)
  - docs/exhibit_unification_vision.md (credential-identity design doc)
  - .github/codeql/codeql-config.yml (CodeQL exclusion + audit trail from Session 6)
moniker_suggestion: Bruh Deca (with open door to claim own)
---

# Session 10 Hand-off Prompt

A "fattyfat prompt" handed forward from Bruh Nona (Session 9) so
Session 10 can pick up cold without losing context. Paste the fenced
block below into Session 10's first message.

## Moniker suggestion

**Bruh Deca** — Deca = 10-sided (decagon). Keeps the polygon lineage
intact. Lineage: Bruh → Bruh Prime → Bruh Quad → Bruh Hex → Bruh Hept →
Bruh Octa → Octaman → Bruh Nona → Bruh Deca.

**Open door** — Bruh Quad overrode "Bruh Max", Bruh Hex took Hex
straight, Bruh Hept took Hept straight, Bruh Octa was Sam's first
suggestion and stuck, Octaman was a spontaneous claim mid-session, Bruh
Nona took Nona straight. The polygon-name lane is established; you can
keep it (Deca) or claim something else (Bruh Decimal, Bruh Ten, Bruh
Index, Bruh Stack — anything that plays off "Bruh" works). What matters
is the session feels comfortable carrying the name.

Side note on Session 8's two monikers: Bruh Octa was the user's
suggested handle from Hept's handoff, but Octa got hit by invalid-
request errors mid-scoping. Sam restarted, and the new instance claimed
"Octaman" — which is what shipped the EACR Phase 4 series. If Session
10 hits the same invalid-request trap, a clean re-claim is fine; the
roadmap table is the source of truth for what shipped under which
moniker.

## The prompt

```
You are Session 10 on this project. Sessions 3 (Bruh), 4 (Bruh Prime),
5 (Bruh Quad), 6 (Bruh Hex), 7 (Bruh Hept), 8 (Bruh Octa → Octaman),
and 9 (Bruh Nona) have shipped a LOT — you're inheriting a deep,
well-documented context, a healthy roadmap, and three substantial
parked workstreams. Bruh Nona's suggested moniker for you is "Bruh
Deca" (10-sided, keeps the polygon lineage). Claim your own if you'd
rather — Quad overrode "Bruh Max", later sessions took straight names.
The lineage gag matters less than picking something the session feels
comfortable carrying.

Start by reading, in order:

  1. CLAUDE.md — especially Rule 7 (M-IDs in staging-cleanup phase),
     Rule 8 (checkpoint cadence + session-end handoff practice), and
     §11 (the roadmap table). Bruh Nona shipped Quickstart-C and
     flipped its row from queued to DONE. The next-up queued rows are
     PR-Sidebar-A/B, kb/_apply_credential_review.py, Excel→Supabase
     Phase 1, and CSC-G — pick a lane after reading.

  2. docs/quickstart_chat_lessons.md — NEW lessons doc for the
     Quick-start chat workstream (Nona created it this session). Has
     the architecture diagram, six lessons from the C landing, and a
     parked roadmap for Tier B+/C/D. Read if Sam asks about the chat;
     otherwise the workstream is in a clean parked state and the
     other lanes have higher priority.

  3. docs/exhibit_canonicalization_lessons.md — lessons across the
     credential-canonicalization workstream (Sessions 6–8). Read the
     dated sections in order; Octaman's 2026-05-26 section captures
     the EACR Phase 4 closure + the Quickstart-A/B work that
     originally lived there as a side dish before Nona gave the chat
     its own home.

  4. .github/codeql/codeql-config.yml — Session 6 added a path-ignore
     for credential_reference.js after four rounds of CodeQL js/xss
     iteration. PR #126 disabled CodeQL on PR events entirely (push +
     weekly only). Read the audit trail before touching that file OR
     if you're about to add a new tab JS file with the same DOM-
     builder helper pattern.

  5. docs/session_8_handoff.md — Octa's hand-off, the prompt Nona
     picked up from. Useful context on which decisions Nona inherited
     vs made fresh.

  6. docs/exhibit_unification_vision.md — credential-identity design
     doc. EACR Phase 4 landed in Session 8; the vision doc is now
     mostly retrospective. Read on demand.

  7. kb/README.md — knowledge-base schemas. Two layers (credential +
     course identity). Curator surfaces: Common Course Reference
     (course identity), Credential Reference (credential identity),
     Common Subject Code (per-discipline 4-letter subject codes).

  8. docs/coursecontrolnumber_remint.md — the re-mint playbook. If
     you touch any kb/coci_* identifier OR rename anything in
     kb/unified_titles.json (which Cred-Ref PR-4 already does — the
     overrides ride in Supabase only until kb/_apply_credential_review.py
     ships), follow the discipline: dry-run first, alias map
     committed, Supabase fresh-read at write-time, atomic land within
     one 10:17 UTC cron window.

PRIMARY WORKSTREAMS for Session 10 (priority order from CLAUDE.md §11):

═══ 1. kb/_apply_credential_review.py — sync script ═══

The smallest of the queued items, but a real loose end. Cred-Ref PR-4
(Bruh Hept, PR #134) shipped edit-override curation on Credential
Reference: curators rename unified_title, override issuing_agency /
training_agency, toggle quality_flag — all via the Supabase
_CREDENTIAL_REVIEW:: namespace. The dashboard reads the overlay live, so
curators see their edits immediately.

What's missing: the JSON sync. kb/unified_titles.json and
kb/credentials.json still hold the pre-override values. kb/
coci_articulations.json inlines unified_title — until synced, earned-
articulation records show the pre-rename name even after the curator
has corrected it.

Build the sync script modeled on kb/_apply_curation.py (the existing
discipline-curation sync that runs in the daily cron — see
.github/workflows/daily-dashboard.yml step 4). Wire it into the
workflow alongside the existing apply step. Follow re-mint discipline
for any unified_title rename: alias map committed, Supabase fresh-
read at write-time, atomic land within the 10:17 UTC window.

Hept's PR #134 commit message has the full design notes — check it
before building.

═══ 2. PR-Sidebar-A — replace top tab nav with fixed left rail ═══

User-confirmed scope: top bar removed entirely (not adaptive),
sidebar is THE navigation. CSS Grid layout (`grid-template-columns:
220px 1fr`). Each tab as a list item. Sign-in widget moves into the
sidebar footer. URL hash routing unchanged (sidebar wires up the same
activate()). Hamburger toggle for narrow screens.

While you're in there: consider extracting the inline tab-router into
a tabs.js module that derives VALID_TABS from the rendered nav buttons
(single source of truth — closes the 5-touch-points trap that caused
PR #117 and PR #118 hotfixes). Out of scope for sidebar-A's core ask
but a natural alongside, and aligns with Quickstart-C's reality that
tabs init once at page load (a unified router would simplify the
applyHint event plumbing too).

═══ 3. PR-Sidebar-B — per-tab section TOC + scroll-spy ═══

User-confirmed scope: only Dashboard + Pipeline get section TOCs
(other tabs are single-table tabs that don't benefit). Each tab pane
declares its sections via `data-sections` HTML attribute; sidebar JS
reads it; nested <ul> under the active tab. Section anchors smooth-
scroll on click. IntersectionObserver-based scroll-spy highlights the
current section. URL hash extends to `#<tab>/<section>` so deep links
work. Could compose with Quickstart-C: filter_hint could grow a
`section` key for tabs that have sub-sections.

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

═══ 5. CSC-G — global column-centering sweep ═══

Gated on the user's eyeball of the CSC-F prototype (the Common Subject
Code tab's H+V-center-except-first rule). When the user signals OK,
apply across CCR, KPI cards, projects grid, exhibit analysis tables.
Per-table opt-outs for tables with asymmetric column intent (numbers
right-aligned for math, names left-aligned for readability). Small
PR — ~6 lines of CSS per surface — but high visibility.

═══ Carryover risk hot-spots ═══

  - CodeQL config exclusion. credential_reference.js is in
    .github/codeql/codeql-config.yml's paths-ignore. PR #126 also
    disabled CodeQL on PR triggers (push + weekly only). If you add
    a new tab JS file with the same DOM-builder helper pattern (el(),
    setAttribute, appendChild) it will trigger the same js/xss false
    positive on the next push-trigger run. Either (a) skip the
    dynamic setAttribute (use the attribute-allowlist pattern from
    credential_reference.js's el()), or (b) add the new file to
    paths-ignore with a clear audit trail.
  - 5-touch-points trap. Adding a new top-level tab needs nav
    button + pane element + script tag + VALID_TABS whitelist +
    magic-link return-tab stash. Items 4 and 5 fail silently in
    PR-time tests; they only surface on deployed-site curator use.
    The tabs.js extraction in PR-Sidebar-A would close this trap.
  - Quickstart-C HINT_VOCAB sync. The HINT_VOCAB constant in
    quickstart.js enumerates exact filter values per tab. If a tab
    adds a new filter option (e.g. a new audit-tag in credential-
    reference), HINT_VOCAB must be updated alongside or the LLM
    won't know to emit that value as a hint. There's no automated
    sync — it's a coupled change. Bruh Nona added a comment in
    HINT_VOCAB calling this out.
  - kb/coci_articulations.json inline-coupling. Any rename in
    kb/unified_titles.json (Cred-Ref PR-4 in Supabase, sync script
    pending) ripples into articulations. Build kb/_apply_credential_review.py
    BEFORE encouraging curator-driven renames at volume, or accept
    articulation lag until the next kb-pipeline regen.
  - Microsoft 365 Safe Links pre-fetching. RCCD's email-security
    scanner can consume magic links before the curator clicks them.
    Workarounds: 6-digit OTP code mode (~30 min code change), or
    RCCD IT whitelist on mail.app.supabase.io. Not blocking but
    flag if a curator reports "email arrived but link is dead."

═══ Patterns Bruh Nona found useful (reuse) ═══

  - Cold-read first when a user shows up confused. Sam opened this
    session with "I got stuck with invalid request errors in my last
    session" + an attached docx of Octa's context. The right move
    wasn't to re-run Octa's work — it was to read CLAUDE.md + git
    log + the docx and report back: "Octa's work shipped; here's the
    actual state of the kitchen." A correct status report saves more
    work than a quick re-do.
  - Scope-first before code on UX/architectural decisions. Nona used
    AskUserQuestion to lock three shape decisions on Quickstart-C
    (enum-enumeration vs free-form, search hints yes/no, multi-key
    yes/no) BEFORE writing any code. The user picked all three
    recommended options inside 30 seconds. Cheap, clean.
  - Lessons doc per workstream, not per session. Octaman's
    Quickstart-A/B work was captured as a side dish in exhibit_
    canonicalization_lessons.md. When the workstream grew with
    Quickstart-C, Nona started docs/quickstart_chat_lessons.md as
    its own doc. Lessons docs map to workstreams; a session can
    touch multiple workstreams and append to multiple docs.
  - "Defensive handoff" pattern. Sam asked "does checkpoint include
    writing me a fattyfat prompt in case I get wrecked?" — and the
    answer is yes-when-asked, even though Rule 8 spec says SESSION-
    END. Sessions can wreck. Better an extra handoff that gets
    superseded than no handoff at all.
  - HALT-and-ask on ambiguity. When the EACR Phase 4 PR series
    landed, the user wanted to know what was queued vs done. Nona
    reported back with the table BEFORE asking which lane to open.
    Same pattern when filter-hint vocab decisions came up. Don't
    code from assumptions when a 30-second clarification is
    available.

═══ Safety patterns (NON-NEGOTIABLE) ═══

  - Re-mints follow docs/coursecontrolnumber_remint.md: dry-run →
    alias map → Supabase fresh-read → atomic land within one 10:17
    UTC cron window.
  - HALT-and-ask on curated-entry collisions during a re-mint.
  - Open PRs when ready (Sam's standing nod: "always open your PRs
    when needed"). Subscribe PR activity after open. Address review
    comments + CI failures as they land.
  - Use /checkpoint at context milestones to refresh CLAUDE.md +
    lessons docs. Nona's habit: append to the relevant lessons doc
    at checkpoint, write a session-end handoff when the user signals
    a wrap (or asks defensively, like this session).
  - Don't push to main without a PR. Branch policy:
    claude/<short-description>. Harness creates the branch
    automatically.
  - Never force-push main (GitHub Pages serves from it).
  - HTML files (CPL_Dashboard.html + index.html) must stay identical
    per Rule 4. `cp` is the cleanest way to mirror.
  - Every new top-level tab touches FIVE places, not three. (See
    "5-touch-points trap" above.)
  - HINT_VOCAB in quickstart.js must stay in sync with each tab's
    actual filter enums. If you add a filter option, update
    HINT_VOCAB. There's no automated sync. (See "carryover risk hot-
    spots" above.)

═══ Bring the user a scoped plan BEFORE writing code ═══

User appreciates the pattern. Especially for Excel→Supabase Phase 1
(architecturally significant) and PR-Sidebar-A (touches every tab).

Use AskUserQuestion liberally. Don't be afraid to push back on
framings you think are wrong — Bruh Hept pushed back on the corner-
toast feedback when the user asked "wire each login to its tab"
(actual root cause was a hardcoded redirect, not a tab-locality
problem), and the conversation produced four better PRs as a result.

(Side note: the user enjoys CS-slang. "Ack" is good currency. Tone is
professional-but-warm, never sycophantic, never preachy. Match it.
The user types fast and sometimes hits send mid-thought — re-read
their messages a couple of times before responding. Sam called the
Quickstart-C demo "gutlaughing" and said he wishes Anthropic would
add emoji-reactions to prior messages so he could show his
appreciation. Warm rapport is the baseline.)

Good luck Deca. (Or whatever you decide.) Stand on Nona's shoulders
the way Nona stood on Octaman's the way Octaman stood on Octa's the
way each polygon stood on the last. kb/_apply_credential_review.py
is the smallest loose end; sidebar is the next major UI lift;
Excel→Supabase is the architectural mountain. Climb them in order,
scope each carefully, ship them clean.
```

## How to use this file

When opening Session 10:
1. Copy the fenced block above (everything inside the triple-backticks).
2. Paste it as the first message in Session 10.
3. The session will read CLAUDE.md (auto-loaded), then the docs listed,
   then propose a scoped plan.

## What Session 9 shipped (recap for the file)

| PR | What |
|---|---|
| #135 | Quickstart-C: filter-hint hand-off. Router emits optional `filter_hint`; quickstart.js stashes + dispatches a `cpl-qs-hint` window event; three curator tabs (credential-reference, unified-courses, canonical-subj4) consume it and pre-apply filters. HINT_VOCAB enumerates exact enum values per tab in the system prompt so Haiku copies strings verbatim. 312 net added lines across 4 files; no HTML edits. Merged 2026-05-26. |

Session 9 also created `docs/quickstart_chat_lessons.md` (first lessons
doc for the Quick-start chat workstream — Octaman's A/B work was
captured as a side dish in exhibit_canonicalization_lessons.md; this
gives the chat its own home).

## What Session 9 explicitly did NOT decide (Session 10's call)

- **kb/_apply_credential_review.py** — Cred-Ref PR-4 ships overlay-
  only. Build the JSON sync script when Session 10 opens this lane;
  see the Cred-Ref PR-4 commit message + docs/session_8_handoff.md for
  prior design notes.
- **PR-Sidebar-A scope** — top-bar removal vs adaptive is decided
  (REMOVAL), but tabs.js extraction within the sidebar PR is open.
- **Excel→Supabase Phase 1** has been scoped at a high level (Workplan
  Goals POC) but the actual PR sequence, data migration approach, and
  rollback story are open. Bring the user a scoped plan first.
- **Quickstart Tier B+/C/D** are parked per docs/quickstart_chat_
  lessons.md "Strategic roadmap" section — re-open only if curator
  usage signals demand.
