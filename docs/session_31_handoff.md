---
title: Session 31 Hand-off Prompt
date: 2026-06-02
session: 30 → 31 hand-off
status: hand-off — paste the fenced block into Session 31's first message
tags: [handoff, session-prompt, cer, unclassified-triage, college-short-names, audience-views]
related:
  - docs/exhibit_canonicalization_lessons.md (Session 30 section — CER economize + triage)
  - docs/kb-notes/methodology-kb-curation-synthesized-namespace.md (NEW this session)
  - docs/kb-notes/reference-college-short-names.md (the #264 dataset)
  - CLAUDE.md §11 "Session 30" subsection
moniker_suggestion: Bruh 31 / "Thirty-One" / "Treinta-y-Uno" — or claim your own
---

# Session 31 Hand-off Prompt

Session 30 added a curator dataset (college short-names), economized the CER tab,
and built the **CER unclassified-triage worklist** (PR-1 + PR-2). 4 PRs merged.
Paste the fenced block into Session 31.

## The prompt

```
You are Session 31 on the CPL Project Tracker. Read these first, in order:
  1. CLAUDE.md (all of it — esp. Critical Rules 1/2/4/5, the Branch Policy
     auto-merge gates [merge on green = clean OR unstable, no waiting for "Go!"],
     §6a CPL Analytics / Exhibit Adoption, §9 EACR identity, §11 + the new
     "Session 30" subsection at the very end of §11).
  2. docs/exhibit_canonicalization_lessons.md — the Session 30 section.
  3. docs/kb-notes/methodology-kb-curation-synthesized-namespace.md (NEW) — the
     zero-migration curation-surface pattern (used 4× now).
  4. docs/kb-notes/reference-college-short-names.md — the short-name dataset/resolver.

WHAT SHIPPED IN SESSION 30 (all merged to main):
  - #264 COLLEGE SHORT-NAME DATASET — kb/_seed_college_short_names.py → KB source
    kb/college_short_names.json + on-page college_short_names.js
    (window.cplCollegeShort(name[,style]) resolver: exact → normalized fallback
    folding Credit/Non-Credit, Community/Junior, Cañada/CaÃ±ada mojibake, West
    Hills→Coalinga/Lemoore). Title Case default. CCR/EACR/CER chips wired via a
    lazy SHORT() helper. Committed, NOT Supabase (static reference data).
  - #265 CER ECONOMIZE (cosmetic, credential_reference.js) — Curate panel behind a
    collapsed ✎ button; "Scope" column folded into title-level 🏛CCC/🏠Local/⚙Generated
    + CPL-type chips (col 12→11); identity rows collapse to ONE row/identity (codes
    inline, college short-name union); Unified Title left-justified. jsdom 20/20.
  - #266 CER UNCLASSIFIED-TRIAGE WORKLIST (PR-1) — "⚠ Triage unclassified (194)"
    button → worklist over the raw MAP titles the exhibit auditor flagged
    `unclassified_in_map` (lazy-fetched from kb/exhibit_audit/latest.json). Assign
    each an existing/new unified title (datalist over 1,969 creds) + optional issuer
    → Supabase kb_curation `_UNCLASSIFIED::<raw>` namespace (no schema migration).
    In-place row updates; progress; clear. jsdom 18/18.
  - #267 TRIAGE DAILY SYNC (PR-2) — kb/_apply_unclassified_triage.py syncs the
    namespace → git-canonical overlay kb/unclassified_assignments.json (idempotent;
    no empty-overlay churn) + daily-workflow step + git-add. Synthetic 9/9.

PRIORITY OPTIONS FOR SESSION 31 (Sam picks):
  - CER TRIAGE PR-3 (the FOLD) — the natural next step: a dry-run-first apply that
    promotes confirmed kb/unclassified_assignments.json entries into
    kb/unified_titles.json + kb/credentials.json so the raw titles leave the
    unclassified queue and render as credential rows. KB-mutation (ripples into
    coci_articulations.json's inlined unified_title) → V-gates + its own PR. NOTE:
    the overlay is empty until a curator actually assigns titles in the worklist,
    so PR-3 is testable via synthetic injection but no-ops on real data until then.
  - THE 3 AUDIENCE VIEWS (Student/College/System) — still the headline. v3+ gallery
    renderers over the EACR consolidated + prescriptive data. Student first (reuse
    buildCredentialView + buildPrescriptiveHtml + a near-me/region filter). System
    needs a PRIVACY ADR first (aggregate eligible-student counts only, NO PII).
  - EACR v2 scope/generated-rec treatment (producer-side statewide_data.js → NEXT
    CRON, not live-on-merge — see methodology-ship-generator-changes-live-on-merge).
  - MID curation passes (CompTIA A+ fragmentation → Suggested-merges worklist).

PATTERNS THAT WORKED (Session 30):
  - kb_curation SYNTHESIZED-NAMESPACE = zero-migration curation surface (new prefix +
    field on the generic course_id/field/value table). Copy saveOverride() + an
    _apply_*.py verbatim, swap the prefix. (methodology-kb-curation-synthesized-namespace)
  - RUNTIME-FETCH A COMMITTED SNAPSHOT (audit latest.json) to drive a worklist —
    single-file MVP, no producer/cron coupling.
  - IN-PLACE DOM ROW UPDATES on save so unsaved sibling input isn't wiped (vs a
    full re-render).
  - jsdom NEEDS url: in the constructor or sessionStorage throws SecurityError
    (opaque origin). Load college_short_names.js into the jsdom window if you test
    chips. NODE_PATH=node_modules; jsdom is npm-installed (node_modules gitignored).
  - MEASURE FIRST — the unclassified count was 194 (committed latest.json), not the
    handoff's stale "105"; CustomReport_latest.json is PII-purged/absent but unneeded.

SAFETY TO HONOR:
  - Rules 1 (generator not HTML), 2 (idempotency guards), 4 (index.html ==
    CPL_Dashboard.html — but the curator-tab JS files [unified_courses.js,
    canonical_subj4.js, credential_reference.js, statewide_interactive.js] are
    SINGLE static assets, no mirror), 5 (never force-push main).
  - Don't read/cat big files (statewide_data.js 6.4MB, unified_courses_data.js 7.5MB,
    credential_reference_data.js, kb/coci_*.json, kb/exhibit_audit/latest.json 1.2MB,
    coci_course_list.xlsx 24MB) — inspect via python counts/samples.
  - MERGE POLICY: PR draft → ready immediately → squash-merge on green (clean OR
    unstable) in the SAME turn. After each merge: git reset --hard origin/main, then
    git push --force-with-lease (the reused session branch's remote head is the
    pre-squash commit → non-fast-forward is expected, not an error).

WAITING ON SAM (carry forward): MAP service credential (then set MAP_API_KEY +
dispatch once — docs/map_api_auth_handoff.md); Cloudflare worker redeploy + WAF
(Session-26 #233, inert until redeployed); repo "Allow auto-merge" toggle.
```

## Carryover status

| Item | Status |
|---|---|
| College short-name dataset + chip resolver (#264) | **DONE + MERGED** (verified sound) |
| CER economize cosmetic (#265) | **DONE + MERGED** |
| CER unclassified-triage worklist PR-1 (#266) + daily sync PR-2 (#267) | **DONE + MERGED** |
| **CER triage PR-3 (the FOLD into unified_titles.json)** | **NEXT — not started** (KB-mutation; dry-run-first; no-ops until a curator assigns) |
| 3 audience views (Student/College/System) | **SCOPED; headline.** System needs a privacy ADR |
| EACR v2 scope/generated-rec treatment | deferred (producer-side → next cron) |
| MID curation passes (CompTIA A+ fragmentation) | backlog → Suggested-merges worklist |
| MAP credential / Cloudflare redeploy+WAF / Allow-auto-merge toggle | **WAITING ON SAM** |

Pipeline viz correctly SKIPPED this checkpoint — Session 30 was college-chip +
CER reference/curation surfaces, NOT M-ID pipeline movement (no re-mint / auditor
run / phase change).
