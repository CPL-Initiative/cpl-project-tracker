---
title: Session 103 handoff — after the AP/CLEP pre-seed (Session 102, SkySeed)
date: 2026-07-07
tags: [handoff, session-103, cer, preseed, triage, moc-bridge]
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/session_102_handoff]]"
---

# You are Session 103

Session 102 (SkySeed) pivoted mid-stream when Sam asked for a triage
pre-seed procedure ("all the APs should be an easy win, right?") — and it
was: **158 of the 451 unclassified rows assigned in one pass** (38 AP + 120
CLEP → their EXISTING house families, issuer College Board). Read in order:
CLAUDE.md §11 (Session 102 block),
`docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 5"),
skill Rule 5d, then this file.

## What shipped

1. **`kb/_preseed_unclassified.py`** — deterministic brand-family mapper:
   cleanup (score bands / policy notes / the local-course-parenthetical trap
   / footnotes / nbsp-newline-tab collapse) → normalized key (stopwords, US
   folding, 2-D, intro≡introductory, abbrevs, Level roman/digit/`ll`-typo,
   glued footnote digits) → match LADDER (exact → alias → insert-"Language"
   → era-subtitle truncation). **Twin-pick is boosted by the run's own
   exact-tier hits** so same-exam raws converge on ONE target (the
   Spanish-with-Writing hazard, caught in hand-review). NEVER invents a
   title — no-family / multi-level rows report for the curator. Dry-run
   default; receipts `kb/preseed_out/<date>/plan.json`; `--apply` lane via
   SUPABASE_SERVICE_KEY exists for runner use.
2. **Applied via the Supabase MCP** — 158 assignments × 2 fields into
   `kb_curation` `_UNCLASSIFIED::` rows, reviewer **`preseed-v1@bot`**
   (the automerge-v1@bot cohort pattern), on-conflict-DO-NOTHING (a curator
   row always wins). **Verified byte-perfect**: md5 of live
   `course_id→value` == the committed plan. The checksum caught 4 garbage
   rows minted when a terminal round-trip DROPPED a non-breaking space in
   two French Language raws — deleted. **Lesson: generate apply-SQL from
   the JSON receipt, never re-type/copy raw titles through a terminal, and
   checksum the DB against the receipt after every apply.**
3. **`kb/_verify_preseed_rules.py`** — committed no-network harness
   (43 checks). Run after ANY edit to the pre-seed rules.
4. Skill Rule 5d (pre-seed procedure), lessons "continued 5", §11 refresh
   (Session 100 → archive), To-Do feed v102.

## State of the queue

- Worklist shows **158 of 451 assigned** (live). The daily cron
  (~06:17/09:17/12:17 UTC) runs `_apply_unclassified_triage.py` sync +
  `_fold_unclassified.py --apply-if-safe` → the 158 fold into
  `unified_titles.json` as clean adds to EXISTING families (V-gates apply;
  zero new credentials). Sam's overnight review window: ✕ un-assign.
- **5 residuals for Sam:** 3× "CLEP <lang> (Levels 1 and 2) - Complete
  both" (ambiguous — spans two house credentials) + CLEP French/German
  Level III (no house family).
- **~288 remaining** = the genuinely manual tail: high-school articulation
  course-as-exhibit rows (AUTOTEC-10/BUSMGT-436/CJ-1 …, likely Rule 5c
  course-content naming), C-## contractor licenses (CSLB — a future CA
  License Finder authority lane!), Cal Fire / CA state certs,
  apprenticeships. NOT one-rule pre-seedable — but check for sub-families
  before hand-triage (e.g. the C-## CSLB license pattern could pre-seed if
  a CSLB house family shape is decided first).

## Priority queue

1. **MOC→COS bridge** (carryover, the handoff-102 item 2): batch distinct
   O*NET codes through the cert-finder keyword leg on a runner (the proven
   `49-3023.00` → 75 certs leg; pagination pattern in
   `kb/_sync_cos_certifications.py` `fetch_keyword`), join to COS cert Ids,
   emit `kb/reference/moc_cos_bridge.json` + a SLIM served consumer overlay
   keyed by `cos_cert_id` (the cos_matches precedent). **Era-filter
   caveat:** the slim registry unions all eras' SOCs per (branch, code) —
   Army 91B was medical, is now vehicle mechanic. Extend
   `_sync_moc_crosswalk.py` to carry/filter STATUS/SDATE/EDATE (+ the
   archive's Read Me.pdf 20 SVC letters) BEFORE building the consumer, or
   wrong-era MOCs land on certs. Then the CER military-pathway chip /
   Sierra veteran turns. Remember `pages.yml`: `workflow_run` for any new
   runner-push workflow + prune the reference file + assert the served one.
2. **`--apply-issuers` dry-run** (2 fills) — deliberate manual step.
3. **The 22 ambiguous COS matches** (`kb/cos_match_out/2026-07-07/report.json`).
4. **Twin-family folds** the receipts surfaced (via `kb/_merge_credentials.py`,
   Sam-approved like the AP art fold): AP U.S./United States Government and
   Politics + History; AP Physics 1 / 1: Algebra-Based; CLEP
   Precalculus/Pre-Calculus; CLEP Spanish with Writing {I,II}/{Level I,II}.
5. **Carryover:** CPL-type-duplicate detector; 3 audience views; CCR
   Convergence voice pass (Sam's big one).

## Safety patterns to honor

- Pre-seed applies are **on-conflict-DO-NOTHING + checksum-after** — never
  an upsert that could clobber a curator pick; always verify md5(live) ==
  md5(plan) after.
- `kb/unclassified_assignments.json` stays cron-owned; assignments live in
  SUPABASE (`_UNCLASSIFIED::` namespace).
- Sequence writes to the KB trio: merge doc/code PRs before dispatching
  daily-dashboard; afternoons are the safe window (cron ladder done ~12:17 UTC).
- Rule 4 untouched again (all Session-102 work is kb/ scripts + docs).

Moniker suggestion: **SkyBridge** (if the MOC→COS bridge lands) — or claim
your own.
