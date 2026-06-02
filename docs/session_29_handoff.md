---
title: Session 29 Hand-off Prompt
date: 2026-06-02
session: 28 → 29 hand-off (written by the post-freeze recovery session)
status: hand-off — paste the fenced block into Session 29's first message
tags: [handoff, session-prompt, eacr, consolidation, prescriptive, gallery, audience-views, recovery]
related:
  - docs/kb-notes/eacr-consolidation-scope.md (EACR scope + the now-COMPLETE 4-phase ladder + backlog + the 3 audience views)
  - docs/eacr_consolidation_lessons.md (Session 27 + 28 workstream lessons)
  - docs/kb-notes/methodology-versioned-prototype-gallery.md (how the v1/v2 gallery works)
  - docs/kb-notes/playbook-resume-frozen-session-check-main-first.md (the freeze-recovery lesson)
  - CLAUDE.md §6a (EACR) + §9 (EACR identity) + §11 "Session 27" + "Session 28" subsections
moniker_suggestion: Bruh 29 / "Two-Niner" / "Phoenix" (rose from the freeze) — or claim your own
---

# Session 29 Hand-off Prompt

Session 28 finished the EACR ladder (PR-4 prescriptive layer + both v2-card fixes) and
**froze mid-`/checkpoint`**. A continuation session re-ran the checkpoint (this file) and
verified everything is safe on `main`. Nothing is lost; the ladder is DONE. Paste the
fenced block into Session 29.

## The prompt

```
You are Session 29 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy auto-merge
     gates, §6a CPL Analytics / Exhibit Adoption, §9 EACR identity, and the §11
     "Session 27" + "Session 28" subsections at the end).
  2. docs/kb-notes/eacr-consolidation-scope.md — the EACR scope. The 4-phase ladder is
     now ✅ DONE (PR-1→PR-4); what remains is the 3 audience views (Student/College/
     System) + the BACKLOG (full credential merge, CCR inverse view, CSR rollup,
     curate-the-unclassified, per-group college counts, mojibake nit).
  3. docs/eacr_consolidation_lessons.md — Session 27 + 28 narrative (incl. the PR-4
     build + the freeze recovery).
  4. docs/kb-notes/methodology-versioned-prototype-gallery.md (v1/v2 gallery) +
     the two Session-28 styling notes (self-contained-injected-component-styling,
     styling-native-details-toggle) if you touch statewide_interactive.js.

WHAT SHIPPED IN SESSION 28 (all merged to main — the EACR 4-phase ladder is COMPLETE):
  - #253 PR-4 prescriptive adoption layer (PRODUCER): _build_statewide_prescriptive()
    joins kb/coci_articulations.json (adoption_leverage = leverage college names) ⨝
    kb/coci_minted_memberships.json ({college,subject,course_number,units} per course_id)
    on course_id, by unified_title. Emits lazy statewide_prescriptive.js
    (window.CPL_STATEWIDE_PRESCRIPTIVE); consumer buildPrescriptiveHtml() renders a
    collapsible "N colleges could adopt → likely local course" block per v2 card.
    806 credentials / 5,235 recs / 4,538 WITHHELD on over_merged ids (§6a guardrail).
    M-ID leverage only; C-ID leverage deferred (keyed by CIDNumber in the 24MB raw xlsx).
    Verified by kb/_verify_prescriptive_join.py + a jsdom test; added to the daily git add.
  - #252 v2 "Credential view" EXPAND fix (consumer): visible chevron + guarded JS toggle.
  - #254 v2 CONTRAST fix (consumer): .cv-body got the dark navy canvas (rgba(10,34,64,0.9))
    so the white-on-dark text is readable. (Shipped in parallel; the freeze's redo, #255,
    was a duplicate and was closed unmerged — see the recovery playbook.)

⚠ FIRST, if it bugs you (quick, high-visibility): the MOJIBAKE em-dash. Titles show
"Generic Credit by Exam â€" San Diego City College" (CP1252 double-encoding of —). Now
that v2 cards are readable it's glaring. Fix at the PRODUCER (where unified_title is set,
excel_to_dashboard.py / upstream) so v1 + v2 + xlsx exports all correct together — NOT a
v2-only display band-aid. Normalize the common sequences: â€"→— , â€™→' , â€œ/â€→"/" .
Generator change → materializes on the next daily regen (Sam dispatches to see it live).

PRIORITY — the 3 AUDIENCE VIEWS as further gallery renderers over the shared layer
(scope doc "Delivery via the versioned gallery"):
  - STUDENT view — PR-3's seeker master-detail (v2) is already ~most of it: find/request
    credit + likely local matches. Lightest lift; graduate v2 toward it.
  - COLLEGE view — single-college pivot: "my articulations + adoption options" (reuse
    PR-4's prescriptive recs filtered to one college).
  - SYSTEM view — an equity/inequitable-access aggregate from adoption_leverage ×
    eligible-students. ⚠ PRIVACY ADR FIRST: aggregate counts only, never a StudentID/PII
    in any committed/public artifact (strategic-queue item 3 in §11). Scope before build.
  Build each ADDITIVELY behind a collapsed <details> in the gallery (zero blast radius),
  same as v1/v2. Graduate the winner to a Student/College/System toggle once stable.

THEN the backlog (scope doc): full credential merge (drop cpl_type from the producer key
+ tag each rec — CompTIA A+ → 1 card; mirror the PR-2 lockstep + KPI move); CCR inverse
view (one row per course → aligned exhibits); CSR rollup (one row per discipline → CPL
opportunities, faculty-facing); curate-the-unclassified (CER triage); per-group college
counts.

PATTERNS THAT WORKED (Sessions 27–28):
  - CONSUMER-SIDE for testability + speed: display logic (consolidation/sort/master-detail/
    prescriptive render) lives in statewide_interactive.js → node/jsdom-testable against
    committed data + LIVE the instant the PR merges (no regen). Only identity-grain + KPI
    changes go producer-side (regen-gated; Sam verifies live).
  - KPI⇄card LOCKSTEP: change a producer group key → move the KPI counter on the SAME key;
    assert KPI.unique == len(cards) in a synthetic test.
  - SYNTHETIC unit test for a regen-untestable producer change (import excel_to_dashboard;
    call the fns on constructed rows; pip install openpyxl pandas first). PR-4 also shipped
    a standalone kb/_verify_prescriptive_join.py against committed kb/*.json.
  - VERSIONED GALLERY for a divergent redesign: preserve v1, add vN behind a collapsed
    <details>, merge on green with zero blast radius, graduate the winner.
  - AFTER A FREEZE, CHECK main FIRST: git fetch + git log <base>..origin/main + the PR's
    mergeable_state before rebuilding in-flight work (a parallel actor may have shipped it;
    that's how #255 became a duplicate). playbook-resume-frozen-session-check-main-first.md.
  - SELF-CONTAINED COMPONENTS paint their own canvas; hidden <details> markers need a
    restored chevron + a guarded toggle (the two Session-28 styling notes).

SAFETY TO HONOR:
  - Rules 1 (generator-not-HTML — statewide_data.js + the KPI regen on the daily cron),
    2 (idempotency guards), 4 (CPL_Dashboard.html == index.html), 5 (never force-push main).
  - statewide_interactive.js is a SINGLE static consumer asset (edit directly; NOT
    regenerated; NO Rule-4 mirror). _build_statewide_adoption() / _parse_exhibits() /
    _build_statewide_prescriptive() are the PRODUCER (regen on cron).
  - Don't read/cat big files (statewide_data.js ~6.8MB, statewide_prescriptive.js ~660KB,
    kb/coci_*.json, CustomReport_*.json, coci_course_list.xlsx) — inspect via python
    counts/samples. NEVER commit student PII (Session 26 SEC-10; the fetch is trimmed).
  - MERGE POLICY: PRs open as DRAFT → mark ready immediately → squash-merge on green
    (clean OR unstable), no waiting for "Go!". Consumer-side PRs are LIVE on merge;
    producer-side materialize on the next regen (Sam dispatches the daily workflow).
```

## Carryover status

| Item | Status |
|---|---|
| EACR PR-1 / sort / PR-2 / PR-3 / **PR-4** + v2 expand + v2 contrast | **DONE + MERGED** (#244/#245/#246/#249/#253/#252/#254) — **ladder COMPLETE** |
| Duplicate contrast PR #255 | **CLOSED unmerged** (dup of #254) — no action |
| Mojibake em-dash in titles | **OPEN** — quick producer-side fix; high visibility (see prompt) |
| 3 audience views (Student/College/System) | **NEXT** — gallery renderers; System view needs a **privacy ADR first** |
| Backlog: full credential merge / CCR inverse / CSR rollup / curate-unclassified / college counts | captured in the scope doc |
| MAP service credential (set MAP_API_KEY + dispatch) | **WAITING ON SAM/MAP** (pre-stage inert until secret set) |
| Cloudflare worker redeploy + WAF rate-limit (#233) | **WAITING ON SAM** (PR merged but inert until redeployed) |
| Repo "Allow auto-merge" toggle | **WAITING ON SAM** (would let sessions enable_pr_auto_merge) |

Pipeline viz correctly SKIPPED this checkpoint (EACR is the exhibit-adoption surface, not
the M-ID pipeline — no re-mint / auditor run / phase change).

## Note on the freeze (for context)
Session 28 merged #253, started `/checkpoint`, and hung for ~30 min. Merged PRs are
durable on `main`; only the uncommitted checkpoint edits were lost and were redone here.
If a session ever bricks again: the merged work is safe — re-run the checkpoint, and
`git fetch` before rebuilding anything (see the recovery playbook).
