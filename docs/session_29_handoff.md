---
title: Session 29 Hand-off Prompt
date: 2026-06-01
session: 28 → 29 hand-off ("Bruh 28" → next)
status: hand-off — paste the fenced block into Session 29's first message
tags: [handoff, session-prompt, eacr, prescriptive, audience-views, gallery, student-view]
related:
  - docs/kb-notes/eacr-consolidation-scope.md (the EACR scope + 4-phase ladder + 3 audience views + backlog)
  - docs/eacr_consolidation_lessons.md (Session 28 narrative + the PR-4 join lessons)
  - docs/kb-notes/methodology-versioned-prototype-gallery.md
  - docs/kb-notes/methodology-styling-native-details-toggle.md (the v2-toggle fix pattern)
  - CLAUDE.md §6a (EACR) + §9 (EACR identity) + §11 "Session 28" subsection
moniker_suggestion: Bruh 29 / "Two-Niner" / "Nina" — or claim your own
---

# Session 29 Hand-off Prompt

Session 28 ("Bruh 28") cleared Session 27's v2-toggle carryover, shipped the
priority **PR-4 prescriptive layer**, and hot-fixed a v2 contrast bug Sam caught
live — **4 merged PRs** on the Exhibit Adoption tab. The EACR 4-phase ladder
(PR-1→PR-4) is now COMPLETE; the **3 audience views** (Student/College/System)
are the next build. Paste the fenced block into Session 29.

## The prompt

```
You are Session 29 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy
     auto-merge gates, §6a CPL Analytics / Exhibit Adoption, §9 EACR identity,
     §11 + the new "Session 28" subsection at the very end of §11).
  2. docs/kb-notes/eacr-consolidation-scope.md — the EACR scope: the 4-phase
     ladder (PR-1✓ PR-2✓ PR-3✓ PR-4✓ — all DONE), the versioned gallery + the
     3 AUDIENCE VIEWS (Student/College/System — THE NEXT BUILD), and the BACKLOG.
  3. docs/eacr_consolidation_lessons.md — the Session 27+28 narrative + the PR-4
     join lessons (producer-side, keyed by unified_title, over-merge clean-source
     invariant).
  4. docs/kb-notes/methodology-versioned-prototype-gallery.md (how v1/v2/v3 stack)
     + docs/kb-notes/methodology-styling-native-details-toggle.md (the <details>
     gotcha — relevant if you add more collapsibles).

WHAT SHIPPED IN SESSION 28 (all merged to main):
  - #252 v2-TOGGLE FIX: the "🎓 Credential view" <details> wouldn't expand
    (hidden marker + a click-swallow). Fix in statewide_interactive.js: a visible
    ::before chevron + a delegated JS toggle on .sw-gallery-sum with
    preventDefault(). jsdom-tested (12 assertions). Consumer-side, live on merge.
  - #253 PR-4 PRESCRIPTIVE LAYER (producer-side): per credential, the colleges
    that could adopt it + the LIKELY LOCAL COURSE each already teaches. New
    _build_statewide_prescriptive() in excel_to_dashboard.py joins
    kb/coci_articulations.json (adoption_leverage = leverage college NAMES) ⨝
    kb/coci_minted_memberships.json ({college,subject,course_number,units} per
    M-ID course_id) on course_id, AGGREGATED BY unified_title. Emits the committed
    lazy file statewide_prescriptive.js (window.CPL_STATEWIDE_PRESCRIPTIVE);
    consumer buildPrescriptiveHtml() renders a collapsible block per v2 card.
    806 credentials, 5,235 (title,college) recs, 4,538 withheld (over-merged),
    100% of keys match an EACR card. Guardrails: over-merge withheld; M-ID only
    (C-ID's 30.4k slots deferred — keyed by CIDNumber in the 24MB raw xlsx);
    "likely" labels (lossy key). Verified by kb/_verify_prescriptive_join.py
    (CNST M1029 → Rio Hondo CARP 050T spot-check) + a jsdom render test.
  - #254 v2-CONTRAST HOTFIX: the v2 view uses a dark palette but .cv-body was
    transparent → white text on the light page = invisible (Sam caught it live
    once #252 made v2 expandable). Gave .cv-body the same dark navy card the v1
    table (.sw-interactive) has. One CSS rule, consumer-side.

PRIORITY — THE 3 AUDIENCE VIEWS (scoped in eacr-consolidation-scope.md §"Three
audience views"). Same credential-centered data, three framings + default
filters + a distinct call-to-action, delivered as further gallery renderers (v3,
v4…) over the SAME consolidated + prescriptive data (zero data drift):
  - STUDENT (start here — highest-value seeker lens): center the credential;
    surface where to get credit (adopters + award) + likely local matches at
    colleges that haven't adopted (reuse buildPrescriptiveHtml); CTA = find/
    request credit near me (region/near-me filter via CCC_COLLEGE_LOOKUP).
  - COLLEGE: my-college lens — my articulations + my adoption options (my courses
    that match the standard but aren't articulated). The prescriptive layer is
    the spine (filter pres.colleges to one college).
  - SYSTEM (most novel): adoption_leverage aggregated × eligible-students × region
    = an inequitable-access map. ⚠ Leans on eligible-student counts → PRIVACY ADR
    FIRST, aggregate-only, NO StudentID/PII (strategic item 3; see §11 Session 25/26).
  Build as v3+ gallery renderers; keep v1/v2 untouched; graduate the winner into a
  Student/College/System segmented toggle once they stabilize.

THEN the BACKLOG (all in the scope doc): C-ID prescriptive leverage (30.4k slots,
the heavier join via coci_course_list.xlsx CIDNumber); full credential merge (drop
cpl_type from the key too + tag); CCR inverse view (one row per course → aligned
exhibits); CSR rollup (one row per discipline → CPL opportunities, for faculty);
curate-the-unclassified (CER triage — the 105 unclassified EACR cards, e.g. the
"Generic Credit by Exam â€" College" mojibake); per-group college counts; the
mojibake-em-dash data nit (â€" in raw titles).

PATTERNS THAT WORKED (Session 28):
  - CONSUMER-side for display logic = live on merge + jsdom-testable; PRODUCER-side
    only when the consumer can't bridge it (no course_id; one unified_title fans to
    many M-IDs) — and key the emitted file by the consumer's group field.
  - STANDALONE VERIFY SCRIPT for a regen-untestable producer change: build the join
    in kb/_verify_*.py, assert a DOCUMENTED spot-check + the guardrail invariant,
    then port the function verbatim into excel_to_dashboard.py. The over-merge
    guardrail needs a CLEAN-SOURCE invariant (every emitted pair has a non-over-
    merged source), not a naive withheld>0 check.
  - COMMIT THE GENERATED FILE + hand-add the <script> tag (both HTML, Rule 4) so a
    producer change is live on merge, not next-regen. Confirm the inline producer
    header matches the committed file char-for-char → daily regen is a no-op diff.
  - A toggle/visibility bug can HIDE a second bug (the contrast issue was invisible
    until the toggle fix exposed it). Eyeball the feature after a fix-first.

SAFETY TO HONOR:
  - Rules 1 (generator-not-HTML — statewide_data.js + statewide_prescriptive.js
    regen on the daily cron), 2 (idempotency guards), 4 (index.html ==
    CPL_Dashboard.html — but statewide_interactive.js is a SINGLE static asset, no
    mirror), 5 (never force-push main).
  - statewide_interactive.js = STATIC consumer (edit directly). statewide_data.js +
    statewide_prescriptive.js = GENERATED (regen on cron; in the daily git-add).
    _build_statewide_adoption / _parse_exhibits / _build_statewide_prescriptive =
    the PRODUCER.
  - Don't read/cat big files (statewide_data.js 6.4MB, statewide_prescriptive.js
    646KB, kb/coci_*.json, coci_course_list.xlsx) — inspect via python counts/samples.
  - MERGE POLICY: merge on green (clean OR unstable), no waiting for "Go!"; PRs as
    DRAFT → ready immediately → squash-merge same turn. Consumer-side = live on
    merge; producer-side = materializes on the next regen (Sam dispatches the daily
    workflow to see it) OR immediately if you committed the file + tag.

WAITING ON SAM (carry forward): MAP's service credential (then set MAP_API_KEY +
dispatch once — docs/map_api_auth_handoff.md); the Cloudflare worker redeploy + WAF
(Session-26 #233, still inert); repo "Allow auto-merge" toggle. Branch note: Bruh
28 reused the ONE designated session branch (claude/happy-shannon-20V0m) across all
PRs, force-with-lease between merges — works fine; a fresh claude/* branch per PR
is equally fine (the repo's norm).
```

## Carryover status

| Item | Status |
|---|---|
| v2-toggle fix / PR-4 prescriptive layer / v2-contrast fix | **DONE + MERGED** (#252/#253/#254) |
| EACR 4-phase ladder (PR-1→PR-4) | **COMPLETE** |
| **3 audience views (Student/College/System)** | **SCOPED; next build** (Student first) |
| C-ID prescriptive leverage (30.4k slots) | deferred (heavier join via coci_course_list.xlsx CIDNumber) |
| Backlog: full credential merge, CCR inverse, CSR rollup, curate-unclassified, college counts, mojibake | captured in the scope doc |
| Privacy ADR (for the System view's eligible-student counts) | **REQUIRED before the System view** — aggregate-only, no PII |
| MAP service credential / Cloudflare redeploy+WAF / Allow-auto-merge toggle | **WAITING ON SAM** |

Pipeline viz correctly SKIPPED this checkpoint (EACR is the exhibit-adoption
surface, not the M-ID pipeline — no re-mint / auditor run / phase change).
