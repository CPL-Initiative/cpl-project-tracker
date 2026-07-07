---
title: Session 102 handoff — after COS-authority-live + the AP fold (Session 101, SkyAnchor)
date: 2026-07-07
tags: [handoff, session-102, cer, careeronestop, cos, ap-merge, triage-qa]
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
  - "[[docs/kb-notes/reference-authority-anchored-credential-naming]]"
---

# You are Session 102

Session 101 (SkyAnchor) took the CareerOneStop lane from "credentials in an
email" to LIVE badges on the CER, QA'd Sam's triage pass, and applied the AP
art fold. Read in order: CLAUDE.md §11 (Session 101 block),
`docs/exhibit_canonicalization_lessons.md` (2026-07-07 "continued 3"),
`docs/kb-notes/reference-authority-anchored-credential-naming.md`.

## What shipped (PRs #676, #677, + the fold/checkpoint PR)

1. **COS auth complete.** Sam added `COS_USER_ID`/`COS_API_TOKEN` (gotcha he
   hit: GitHub's secret NAME box takes only the bare name — no `=value`).
   Probe validated auth; the probe's contract findings drove #676 BEFORE the
   first apply: `split_name_acronym()` (the API embeds acronyms as a
   `"Name - ACR"` suffix, no Acronym field; level/digit suffixes exempt) in
   BOTH lanes, pagination hardening (advance by actual batch size, stop at
   RecordCount, bail on non-advancing startRecord — the API is now the
   PRIMARY lane; bulk 403s runners). Committed no-network harness:
   `kb/_verify_cos_sync_lanes.py` (23 checks — run it after ANY sync edit).
2. **Apply: 6,490 certifications → 83 CER matches** (44 exact · 8 acronym ·
   31 contains; 22 ambiguous reported; 2 issuer fills possible). Receipts
   `kb/cos_match_out/2026-07-07/`. Registry commit `1015ced`.
3. **Pages serving gap fixed (#677):** runner GITHUB_TOKEN pushes fire no
   push workflows → `pages.yml` gained `workflow_run: cos-authority-sync`,
   the `kb/cos_matches.json` served-path assert, and the registry prune
   (`kb/reference/cos_certifications.json` is tracker-internal per COS
   terms; the browser fetches only the derived overlay).
4. **Triage QA — the retarget-to-existing-family doctrine.** Sam's 33-title
   day hit every handoff watch-item: ASE (3 new shapes, 3 org spellings) →
   the existing `ASE <code> — <content>` family; AP art (4 retired names) →
   College Board current; double-space title fixed; apprenticeship → the
   existing `Carpenters Apprenticeship — Acoustical Installer` family;
   portfolio Cx issuer → CCC. All 10 fixes Sam-approved, applied directly to
   his `_UNCLASSIFIED::` rows in Supabase. **When a house family exists,
   retarget verbatim — consistency beats authority-verbatim; the COS chip
   still lands via the contains tier.**
5. **AP art fold APPLIED** (`kb/_merge_credentials.py`): 5 colon variants →
   3 canonicals; 18 raws + 20 articulations re-pointed; 9 AP art families →
   4; V-gates green; receipt `kb/credential_merges_out/2026-07-07/`.

## Priority queue

1. **Sam's triage continues** (~448 of 481 left). His pass is good — the QA
   items were family-consistency, not judgment errors. Nudge: pick existing
   dropdown families verbatim.
2. **COOL/MOC crosswalk — REGISTRY LIVE (Sam picked it; #679/#680/#681 +
   apply).** `kb/reference/moc_crosswalk.json`: 33,874 MOCs, 17,916 with
   O*NET mappings; bridge leg PROVEN (cert finder takes a dotted O*NET code
   as keyword — `49-3023.00` → 75 certs). **Next: the bridge artifact** —
   batch distinct ONET codes through the cert-finder keyword leg on a runner,
   join to COS cert Ids, emit `kb/moc_cos_bridge.json`, then the consumer
   (Sierra veteran turns / CER military-pathway chip). Caveat: MOC codes are
   REUSED across eras (91B medical→mechanic) — use STATUS/SDATE/EDATE + the
   archive's Read Me.pdf (20 SVC branch letters) to filter current codes.
   CA License Finder stays the queued alternative lane.
3. **`--apply-issuers` dry-run** (2 fills possible) — deliberate manual
   step, never cron.
4. **The 22 ambiguous COS matches** (`kb/cos_match_out/2026-07-07/report.json`)
   — a short curator pass; consider a worklist surfacing later.
5. **Carryover:** CPL-type-duplicate detector; the 3 audience views; the
   ~50 NEW-credential long tail; CCR Convergence voice pass (Sam's big one).

## Safety patterns to honor

- **Sequence writes to the KB trio** (`unified_titles` / `credentials` /
  `coci_articulations`): merge your PR BEFORE dispatching daily-dashboard —
  the fold touches the same files and generated-file conflicts are never
  resolvable by picking sides. Today's cron ladder is done by ~12:17 UTC;
  afternoons are a safe window.
- `kb/unclassified_assignments.json` stays cron-owned; edit assignments in
  SUPABASE (kb_curation `_UNCLASSIFIED::` namespace), never the overlay file.
- The COS registry stays out of the served site (Pages prune) — check the
  assert list before touching pages.yml excludes.
- Rule 4 untouched again this session (all CER work lives in static JS/data).

Moniker suggestion: **SkyCOOL** (if the military crosswalk lane wins) — or
claim your own.
