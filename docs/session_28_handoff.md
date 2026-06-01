---
title: Session 28 Hand-off Prompt
date: 2026-06-01
session: 27 → 28 hand-off ("Bruh 27" → next)
status: hand-off — paste the fenced block into Session 28's first message
tags: [handoff, session-prompt, eacr, consolidation, master-detail, gallery, prescriptive, map-auth]
related:
  - docs/kb-notes/eacr-consolidation-scope.md (the EACR scope + 4-phase ladder + backlog)
  - docs/eacr_consolidation_lessons.md (Session 27 workstream lessons + the PR-4 scoping verdict)
  - docs/kb-notes/methodology-versioned-prototype-gallery.md
  - docs/kb-notes/playbook-prestage-optional-external-auth.md
  - docs/map_api_auth_handoff.md (MAP auth coordination — sent to MAP)
  - CLAUDE.md §6a (EACR) + §9 (EACR identity) + §11 "Session 27" subsection
moniker_suggestion: Bruh 28 / "Two-Eight" / "Octa-Two" — or claim your own
---

# Session 28 Hand-off Prompt

Session 27 ("Bruh 27") turned Sam's live EACR screenshot review into **5 merged PRs**
on the Exhibit Adoption tab — credit-rec consolidation, a "Typical CPL" headline, a
credential-clustering sort, the Local+CCC merge (KPI in lockstep), and a master-detail
**Credential view (v2)** in a versioned gallery — plus a MAP-auth pre-stage (Sam sent
the spec to MAP). **PR-4 (the prescriptive layer) is fully scoped and is the next
build.** Paste the fenced block into Session 28.

## The prompt

```
You are Session 28 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy auto-merge
     gates, §6a CPL Analytics / Exhibit Adoption, §9 EACR identity, §11 + the new
     "Session 27" subsection at the end of §11).
  2. docs/kb-notes/eacr-consolidation-scope.md — the EACR scope: the 4-phase ladder
     (PR-1✓ PR-2✓ PR-3✓ PR-4 next), the versioned gallery + 3 audience views
     (Student/College/System), and the BACKLOG (full credential merge, CCR/CSR inverse
     views, curate-the-unclassified, college counts, mojibake nit).
  3. docs/eacr_consolidation_lessons.md — Session 27 narrative + the FULL PR-4 scoping
     verdict (producer-side join, the exact files/fields, M-ID-first, over_merge guard).
  4. docs/kb-notes/methodology-versioned-prototype-gallery.md (how v1/v2 gallery works)
     + docs/kb-notes/playbook-prestage-optional-external-auth.md (the MAP-auth pattern).

WHAT SHIPPED IN SESSION 27 (all merged to main):
  - #244 credit-rec consolidation: buildCreditRecsHtml() groups recs by (course title,
    units), local codes inline, "💡 Typical CPL: ~N units (range a–b) · not the sum"
    headline (consumer-side, statewide_interactive.js). + fixed the "undefined (N)"
    Issuing-Agency filter label.
  - #245 sort: cluster a credential's variants together + sink 105 unclassified (4%)
    to the bottom (consumer-side).
  - #246 Local+CCC MERGE (CCC top billing): dropped Collaborative Type from the EACR
    key in _build_statewide_adoption() AND _parse_exhibits() (KPI in LOCKSTEP). Generator
    change — live post-regen: 2,456→2,406 cards, CompTIA A+ 4→2, merged card unions to 21.
    cpl_type KEPT in the key.
  - #249 master-detail "Credential view" (v2): versioned gallery — v1 = the existing
    table (preserved, collapsible), v2 = one card per credential (unified_title+issuer),
    CCC standard on top (or synthesized "⚙ Suggested standard" for the ~94% no-CCC case),
    variants sub-listed. Reuses #244. 2,406→2,114 credential cards. Additive (v2 behind a
    collapsed <details>).
  - #248 MAP-auth pre-stage: optional MAP_API_KEY header in fetch_custom_report.py
    (no-op until the secret is set; Bearer/APIM/x-api-key) + workflow env + the Teams
    spec sheet (docs/map_api_auth_handoff.md). Sam SENT it to MAP. DON'T re-add PII columns.

⚠ FIRST (quick browser fix) — the v2 "🎓 Credential view (v2 · beta)" summary
DOESN'T EXPAND on click (Sam, end of Session 27). The markup is valid native
<details>/<summary> (statewide_interactive.js ~L364-372) and nothing preventDefaults
the summary, so reproduce in a BROWSER w/ devtools: click the summary → does the
<details> gain the `open` attribute?
  - If YES (toggles) but nothing appears → #sw-cv-body is empty: confirm
    buildCredentialView() ran (it's filled in renderRows at ~L578) + check console.
  - If NO (doesn't toggle) → a click interception / CSS overlap from the v1
    .sw-table-wrap or table; inspect what element is topmost at the summary.
  Robust fix either way (~5 lines, low-risk): restore a VISIBLE disclosure chevron
  (the marker is hidden at L205-206 — `list-style:none` + `::-webkit-details-marker
  {display:none}` → no affordance) AND add an explicit JS toggle for `.sw-gallery-sum`
  (click → toggle the parent <details>'s `open`). THEN proceed to PR-4.

PRIORITY — PR-4: the prescriptive layer (SCOPED, producer-side). Per potential-adopter
college, the recommended local course to articulate (turn adoption_leverage's ~48k
"should-articulate" opportunities into a per-college "here's how to adopt" worklist).
  - DATA: join kb/coci_articulations.json (adoption_leverage = college NAMES) ⨝
    kb/coci_minted_memberships.json ({college, subject, course_number, units} per
    course_id) ON course_id. M-ID leverage (17,575 slots) resolves 100% from committed
    JSON (verified on CNST M1029). C-ID leverage (~30.4k, ~63%) is DEFERRED (keyed by
    CIDNumber in the 24MB raw coci_course_list.xlsx — heavier).
  - BUILD: PRODUCER-side (consumer has no course_id; one unified_title fans to ≤89
    course_ids). New lazy file statewide_prescriptive.js (window.CPL_STATEWIDE_PRESCRIPTIVE,
    keyed by unified_title) emitted in _build_statewide_adoption(); render a collapsible
    "Colleges that could adopt → likely matching local course" block per v2 card.
  - GUARDRAILS: honor over_merge (skip emission for any over_merged course_id, §6a);
    (subject,number) membership key is lossy → label recs "likely"; ADD
    statewide_prescriptive.js to the daily-workflow git add (§6). The JOIN is in-session
    testable against committed kb/*.json (write a standalone verify script) even though
    the full regen isn't — mirror the PR-2 pattern (synthetic test → regen-gated → Sam
    verifies live).

THEN: the 3 audience views (Student/College/System) as further gallery renderers, and
the backlog (full credential merge = drop cpl_type too + tag; CCR inverse view; CSR
rollup; curate-the-unclassified). All in the scope doc.

PATTERNS THAT WORKED (Session 27):
  - CONSUMER-SIDE for testability + speed: the raw CustomReport isn't in the container,
    so display logic (consolidation/sort/master-detail) went into statewide_interactive.js
    → node logic-tested against committed statewide_data.js + live the instant the PR
    merges (no regen). Only the identity-grain + KPI change (PR-2) had to be producer-side.
  - KPI⇄card LOCKSTEP: change a producer group key, move the KPI counter on the SAME key;
    assert KPI.unique_exhibits == len(cards) in a synthetic test.
  - SYNTHETIC unit test for a regen-untestable producer change (import excel_to_dashboard;
    call the fns on constructed rows; pip install openpyxl pandas first).
  - VERSIONED GALLERY for a divergent redesign: preserve v1, add v2 behind a collapsed
    <details>, merge on green with zero blast radius, graduate the winner.
  - Background Agent to SCOPE the next PR while checkpointing (read-only; it nailed PR-4's
    data path). "Spawning magic."

SAFETY TO HONOR:
  - Rules 1 (generator-not-HTML — statewide_data.js + the KPI regen on the daily run),
    2 (idempotency guards), 4 (CPL_Dashboard.html == index.html — but statewide_interactive.js
    is a SINGLE static asset, no mirror), 5 (never force-push main).
  - statewide_interactive.js is a STATIC consumer asset (edit directly; not regenerated).
    _build_statewide_adoption() + _parse_exhibits() are the PRODUCER (regen on cron).
  - Don't read/cat big files (statewide_data.js 6.8MB, kb/coci_*.json, CustomReport_*.json,
    coci_course_list.xlsx) — inspect via python counts/samples.
  - MERGE POLICY: merge on green (clean OR unstable), no waiting for "Go!"; PRs as DRAFT →
    ready immediately → squash-merge. Consumer-side PRs are LIVE on merge; producer-side
    materialize on the next regen (Sam triggers a daily-workflow dispatch to see them).

WAITING ON SAM (carry forward): MAP's reply with the service credential (then set the
MAP_API_KEY secret + dispatch once — docs/map_api_auth_handoff.md); the Cloudflare worker
redeploy + WAF (Session-26 #233, still inert); repo "Allow auto-merge" toggle.
```

## Carryover status

| Item | Status |
|---|---|
| EACR PR-1 / sort / PR-2 / PR-3 + MAP-auth pre-stage | **DONE + MERGED** (#244/#245/#246/#249/#248) |
| **v2 Credential-view summary won't expand** | **KNOWN BUG — fix FIRST** (hidden marker / toggle; browser-devtools 5-min fix; see prompt) |
| **PR-4 prescriptive layer** | **SCOPED (producer-side); next build** |
| 3 audience views (Student/College/System) | queued (gallery renderers) |
| Backlog: full credential merge (cpl_type as tag), CCR inverse, CSR rollup, curate-unclassified, college counts, mojibake | captured in the scope doc |
| MAP service credential | **WAITING ON SAM/MAP** (pre-stage inert until secret set) |
| Cloudflare worker redeploy + WAF (#233) | WAITING ON SAM (still inert) |
| Repo "Allow auto-merge" toggle | WAITING ON SAM |

Pipeline viz correctly SKIPPED this checkpoint (EACR is the exhibit-adoption surface,
not the M-ID pipeline — no re-mint / auditor run / phase change).
