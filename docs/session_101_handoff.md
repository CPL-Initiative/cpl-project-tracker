---
title: Session 101 handoff — after the CER triage-loop unstick (Session 100)
date: 2026-07-07
tags: [handoff, session-101, cer, exhibit-canonicalization, careeronestop, token-refresh]
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/kb-notes/reference-authority-anchored-credential-naming]]"
superseded: true
superseded_by: session_132_handoff.md
---

# You are Session 101

Session 100 (SkyVault) got Sam UNSTUCK on the Common Exhibit Reference and closed
the triage loop end-to-end. Read in order: CLAUDE.md §11 (Session 100 block),
`docs/exhibit_canonicalization_lessons.md` (2026-07-07 section),
`docs/kb-notes/reference-authority-anchored-credential-naming.md`.

## What shipped (one PR off `claude/cobi-exhibit-reference-fixes-51iazi`)

1. **The "tab stopped working" root cause** — CER never refreshed the magic-link
   token before writes (the pre-Session-77 raci.js bug, CONFIRMED by an
   adversarial 4-lane workflow + jsdom repro). Fixed with `withFreshSession()`
   (single-flight refresh + 401/403 session-drop) on all 5 write fns, an init
   `.catch` retry card, and `tests/cer_token_refresh.test.js` (18 asserts).
2. **The fold grew SUPERSEDE + STALE lanes + `--apply-if-safe`**
   (`kb/_fold_unclassified.py`): curator assignments now beat unreviewed machine
   drafts across whitespace-twin spellings, re-point their articulation rows, and
   prune orphaned machine credential records; stale overlay rows report without
   gating. Applied 2026-07-07: 11 supersedes, 8 art re-points, 7 prunes, triage
   queue → 0. Receipts `kb/unclassified_fold/2026-07-07/`.
3. **The loop self-closes daily**: daily-dashboard.yml now runs the fold
   (apply-if-safe) AND `kb/_audit_exhibits.py` (the exhibit audit had been frozen
   since 2026-05-24 — it was in NO workflow). Pages deploy asserts the 4
   CER-fetched paths. tabs.js loadScript no longer wedges on a once-failed script.
4. **Cx procedure = skill Rule 5c** (Sam's calls): course-content titles for
   single-course Cx/portfolio, `<Discipline> (<CODE>)` for code-only, program
   umbrella for batches, mechanism never in the title, issuer **California
   Community Colleges** (plural — 4 singular records normalized in KB + Supabase).

## What shipped AFTER this handoff was first written (same session, PRs #673/#674 + Phases 1+2)

- **CareerOneStop lane BUILT + merged** (Sam's call; Credential Engine/CTDL
  comes after — the MAP↔CE partnership will CTDL-tag all MAP CPL data, and
  the cos_cert_id anchors become join keys): `kb/_sync_cos_certifications.py`
  + `cos-authority-sync.yml` (probe-first, monthly cron),
  `kb/_match_cos_authority.py` (join ladder w/ level guard + `+`-folding),
  CER ✓/≈ COS chips + required USDOL/DEED attribution
  (`tests/cer_cos_badge.test.js`). **Live-probe finding:
  www.careeronestop.org intermittently 403s runners — the token API is the
  dependable leg.** Sam REGISTERED (owner CCCCO, org URL map.rccd.edu — both
  fine); when his credentials email arrives he adds repo Actions secrets
  `COS_USER_ID` + `COS_API_TOKEN`, then dispatch `cos-authority-sync`
  mode=probe → read log (validates auth, shows the API field shape — fix
  `lane_api` field names if they differ) → mode=apply → badges light up.
- **Rule 5c precedence** (Sam): Cx titles anchor **CCN > C-ID > (M-ID once he
  declares that layer stable) > local course content** — codified in the skill.
- **Rule 5c Phases 1+2 BUILT**: `kb/_suggest_unclassified.py` (COCI (SUBJ,NUM)
  join, membership-hazard guards, AP/IB/CLEP + target-course-parenthetical
  exclusions; first run 28/481 — 5 C-ID incl. ADM JUS 003 → AJ 124) →
  `kb/unclassified_suggestions.json` → worklist 💡 fill chips
  (`tests/cer_wl_suggestions.test.js`); the fold stamps `title_anchor`
  {system,id} on matches. **Phase 3 parked**: flip `--with-mids` when Sam
  declares M-IDs stable — anchors make re-key ripples mechanical.

## Priority queue

1. **COS auth completion** (above) — then consider CA License Finder slice +
   the military COOL/MOC crosswalk lane.
2. **Sam's triage pass on the 481** — in progress. AFTER it: run
   `kb/_merge_credentials.py` cleanup for the **AP Art & Design split** (KB
   already holds 6 families; his 'AP Art Studio 2-D' assignments add more —
   canonical = College Board current names, e.g. 'AP 2-D Art and Design').
   Watch: apprenticeship exhibits should NOT get the CCC issuer (JAC/union
   sponsors); keep level words ('Advanced X' ≠ 'X').
3. **Carryover**: CPL-type-duplicate detector; the 3 audience views; the ~50
   NEW-credential long tail; CCR Convergence voice pass (still Sam's big one).

## Safety patterns to honor

- The fold's supersede lane NEVER touches human-reviewed entries (V1) and only
  auto-re-points articulations for superseded raws — clean-lane ripples still
  block for the methodology-note human call.
- `kb/unclassified_assignments.json` is cron-owned — mid-flight merge hazard per
  the methodology note's Gotcha; rebase takes main's copy.
- Rule 4 untouched this session (no HTML edits; all CER work lives in static JS).

Moniker suggestion: **SkyAnchor** (the authority-anchoring build) — or claim your own.
