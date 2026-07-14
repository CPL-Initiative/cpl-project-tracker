---
title: "CIP Crosswalk tab + the CIP site (lessons)"
date: 2026-07-14
tags: [lessons, cobi, org-layer, cip, top-cip, crosswalk, transition, coci, suggest-to-curate, chancellors-office]
artifacts:
  - cip_crosswalk.js
  - cip_crosswalk_data.js
  - kb/_build_cip_crosswalk.py
  - kb/reference/cip_searchable_260708.xlsx
  - kb/supabase_cip_crosswalk_suggestion.sql
  - cobi_orgs.js
  - coci_lookup.js
  - tests/cip_crosswalk.test.js
related:
  - "[[co_platform_orglayer_lessons]]"
  - "[[co_platform_strategy]]"
  - "[[adr-cobi-org-layer]]"
  - "[[CLAUDE]]"
---

# CIP Crosswalk tab + the CIP site

Workstream scratchpad. **SkyNew side-lane, 2026-07-14** — a third COBI area
(**CIP**) added beside CPL and C&I, extending SkyFlyer's org layer. Like the
SkyFlyer/SkyIron side-lanes, this track does **not** touch the numbered
session-handoff chain or `kb/cpl_todos.json` (those are the curation track's
live memory).

## Origin

The Chancellor's Office is transitioning course & program coding from **TOP**
to **CIP** effective **fall 2026** (ESS 26-06). ESS built a searchable Excel
workbook (`CIP_Searchable_260708.xlsx`) to email to faculty in the field. Sam
asked for a COBI tab that **replaces that spreadsheet** — faculty search/filter
the TOP↔CIP crosswalk and, TMC-style, **send suggested changes + notes to the
CO to curate** along the way.

## What shipped

A new top-level **CIP Crosswalk** tab (`#cip-crosswalk`, in the Reference &
Curation nav group) + a new **CIP site** in the org switcher.

- **Data (`kb/_build_cip_crosswalk.py` → `cip_crosswalk_data.js`, `window.CIP_CROSSWALK`).**
  Built from the CO's workbook (committed at `kb/reference/cip_searchable_260708.xlsx`).
  A **normalized** model so long CIP definitions/SOC lists live once, keyed by
  code: **420 TOP codes**, **2,325 CIP codes**, **5,353 crosswalk pairs**, 6,011
  SOC occupation links. The master sheet is *TOP-CIP Data* (the rich one:
  relationship source, colleges-with-pairing + count, noncredit, both CTE flags);
  *CIP Descriptions* adds the definition/examples/cross-refs + the **2020 CIP
  Action** (New / Deleted / Moved) that becomes transition badges; *CIP-SOC Data*
  adds occupations. O*NET URLs are reconstructed client-side from the SOC code
  (`onetonline.org/link/summary/<soc>.00`) — not stored.
- **Tab (`cip_crosswalk.js`, `window.CPL_CIP_CROSSWALK`).** Self-contained lazy
  module (scoped `.cipx` CSS, DOM via createElement — CodeQL-safe). Sticky
  search + filters (group TOP→CIP / CIP→TOP, credit, CTE, TOP sector, CIP family,
  source toggle chips). Fixed-layout table with visual TOP grouping (Sam's
  no-horizontal-scroll rule). Row expands to a 3-column detail: TOP context +
  **"COCI courses with TOP N"** deep-link; full CIP definition + examples +
  cross-refs + transition flag + SOC occupation chips; provenance + the college
  list; and an inline **suggest-to-curate** form. CSV export. A global
  "✍️ Suggest a change" modal (not row-bound) for brand-new mappings.
- **Suggest lane (Supabase `cip_crosswalk_suggestion`).** Open/anon like Quick
  Adopt: anon **INSERT-only** (`check status='new'`, `return=minimal`), **no
  public SELECT** (contact info never publicly readable); the CO reads the queue
  behind the reviewer/team-phrase gate (`is_allowed_reviewer() OR team_pass_ok()`,
  both already deployed). Schema of record: `kb/supabase_cip_crosswalk_suggestion.sql`,
  applied via MCP migration `cip_crosswalk_suggestion_intake` on the *Work Plan*
  project (`hvuwhnbuahrtptokpqfh`).
- **CIP site (`cobi_orgs.js`).** One `ORGS[]` entry — `{id:"cip", tag:"CIP",
  full:"TOP-to-CIP Transition", tabs:["cip-crosswalk","coci-lookup"], home:"cip-crosswalk"}`.
  `?org=cip` deep-links into it; wordmark tag reads **COBI ᶜᴵᴾ**. No gating
  (cosmetic, matching the pilot).
- **COCI cross-link (`coci_lookup.js`).** Added the TOP field to the COCI search
  haystack (one line) so the crosswalk's "COCI courses with TOP N" deep-link
  (sessionStorage `cpl_coci_focus`, the RACI focus pattern) actually filters.

## Decisions / judgement calls

- **CIP is an org site, not just a tab.** Sam said "a CIP site (to be added to
  our current CPL and C&I sites)" — so it's a third area in SkyFlyer's org layer,
  with its day-one tabs = the crosswalk + COCI Lookup (its deep-link target).
- **Submissions open, no phrase.** Faculty *in the field* submit, so no login
  gate — mirror Quick Adopt (`cpl_adoption_interest`). Did **not** mint a
  `cip-team-2026` phrase (the queue-read gate already works via existing cohort
  phrases + reviewers); add one later only if the CO wants a CIP-cohort phrase.
- **Normalized data model.** Definitions/SOC keyed by code, pairs reference them
  → 1.85 MB (vs. ~5× if denormalized). Committed (like `cpl_pathways_data.js`) —
  it is NOT a daily-cron artifact, so there's no cron path to publish it.
- **Source provenance is first-class.** The relationship source (COCI / CCCCO /
  Noncredit / Field-submitted / COE / CIP-file) drives a colored badge + a filter
  — faculty can see which mappings are CO-authoritative vs. field-submitted (the
  ones most in need of curation).

## Bugs caught before shipping

- **Sort sentinel under ICU collation.** Using `"~"` as a high sentinel with
  `localeCompare` did NOT sort null-TOP (CIP-only) rows last — ICU collates the
  tilde *before* digits, so a CIP-only row rendered first and its expand showed
  the wrong panel. Fixed with a deterministic nulls-last plain-string comparator
  (`cmp()`); zero-padded codes compare correctly with `<`. The jsdom test caught
  it.
- **RLS + RETURNING.** An anon INSERT with `RETURNING` fails RLS (the returned
  row is checked against the SELECT policy, which denies anon). The frontend uses
  `Prefer: return=minimal` (no RETURNING), so the real path is fine — verified
  live via MCP with a rolled-back `set local role anon` insert (succeeds) +
  select (0 rows).

## Verification

- `tests/cip_crosswalk.test.js` (jsdom, 36 assertions): wiring in both HTMLs
  (Rule 4), nav group, org registration, render, filtering seam, row expand,
  suggest form, scoped CSS, + failure-mode guards (missing data, null-TOP/orphan-CIP
  rows). `tests/cobi_orgs.test.js` extended to cover the CIP site (33 assertions).
- Real Chromium render (1280px): stats 420/2,325/5,353, "nursing" → 86 rows,
  expand + form work, **zero console errors**.
- Supabase RLS verified live (anon insert OK, anon select denied).

## Continuation (next session on this track)

Everything above is live. Natural follow-ups, none blocking:
1. **A CO curator view** for the `cip_crosswalk_suggestion` queue (there's no
   in-app reader yet — same state as `cpl_adoption_interest`; the CO queries
   Supabase or we build a gated triage tab). A status-transition RPC
   (`_set_status`) like `sierra_feedback_set_status()` when that lands.
2. **Refresh the dataset** when ESS ships a newer workbook cut — drop it at
   `kb/reference/cip_searchable_<date>.xlsx`, bump `SRC`/`BUILT_AT` in
   `kb/_build_cip_crosswalk.py`, rerun.
3. **`cip-team-2026`** cohort phrase if the CO wants a CIP-specific curator
   cohort (one `team_access` row).
4. **Program-level crosswalk** — the workbook is course/discipline TOP↔CIP; the
   COCI *program* inventory could add a program lane later.
5. Consider surfacing the **SOC→CIP** reverse and the **CIP-only (no TOP)** set
   as explicit browse modes if faculty ask.
