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

## 2026-07-14 (later) — transfer marker + the reference-manual pivot (#771, #772)

Two follow-ups landed the same day, and a **strategic reframe from the CO** reshaped
the tool's purpose.

### Transfer (C-ID) marker — #771
The CO CIP team is prioritizing **transfer courses first**. Examined the COCI course
extract (`kb/reference/coci_course_list.xlsx`, 141,738 rows): **it has no explicit
CSU/UC-transferable flag** — 12 columns, and the only transfer-adjacent signal is
**C-ID (`CIDNumber`)** presence (C-ID = the statewide transfer-model articulation
system). C-ID covers 16,067 courses (11.3%); 292/420 TOP codes have ≥1 C-ID course.
Shipped it as a **clearly-labeled interim floor** (not full transferability), with a
clean seam for a true flag if a fuller export adds one:
`kb/_build_cip_crosswalk.py` rolls a per-TOP `crs` (total COCI courses) + `cid`
(C-ID courses) up from COCI (TopCode `"CODE: Title"` split on `:` to match keys);
`cip_crosswalk.js` adds a Transfer filter + a "🎓 N C-ID" chip. **Lesson: name a
proxy as a proxy** — the chip/tooltip/filter all say "transfer-model (C-ID) … a
floor, not full CSU/UC transferability" so it can't mislead prioritization.

### The strategic reframe (Jenni Abbott, CO AA division) → the reference manual — #772
Sam asked Jenni whether the CO could assume **1 TOP → 1 CIP** and infer it down to
every COCI course (→ add a CIP column to COCI views). Grounded the question in the
data: the crosswalk is strongly **many-to-many** — only **9%** of TOP codes are 1:1
across all sources, **32%** credit-only, **38%** official-only (avg 8–11.6 CIP per
TOP). Jenni confirmed: **it IS one-to-many**; the **Tech Center is building the COCI
CIP-dropdown** where colleges actually pick; and **our tool is the "reference
manual"** — the successor to the CCC **TOP Code Manual** — and should expose the
**full federal CIP list (1,800+)** so colleges "can look at everything."

That killed the planned **canonical-CIP-designation curator surface** (the 1:1
premise is false) and pivoted the build to a **reference manual**:
- **New "Browse all CIP codes" view** (toggle beside the crosswalk) surfacing **all
  2,325** federal CIP codes — including the **181 that had no TOP mapping** and were
  previously unreachable (the tool only showed crosswalk *pairs*). Filters: CIP
  family, CTE, 2020-CIP status (New/Moved/Deleted/Unchanged). Each row expands to a
  CIP reference card (definition, examples, cross-refs, transition note, SOC
  occupations, and the TOP codes that map *from* it — each a jump into the crosswalk).
- **Header repositioned** as the transition reference manual.
- **Lesson: a pivot can be a small superset.** The existing tab already had the CIP
  narrative data + detail machinery; the reference manual was a *view mode* over the
  same normalized dataset, not a rebuild. Measuring the 181-orphan gap first pointed
  straight at the missing capability.

**Curator-surface status: dropped, not parked** — with one-to-many + COCI owning
data entry, there's no "designate the canonical CIP" job here. The
`cip_crosswalk_suggestion` lane (#770) still collects college feedback; a lightweight
CO reader for it is the only remaining curator-ish follow-up.

## Continuation (next session on this track)

Everything above is live (#770 tab, #771 transfer, #772 catalog). Natural follow-ups,
none blocking:
1. **True transfer flag** — if the CO provides a course export with CSU/UC-transferable
   columns, swap the C-ID proxy for the real flag (the `top[code].cid`/`crs` seam +
   the filter/chip are ready; just re-point the generator + relabel).
2. **A lightweight CO reader** for the `cip_crosswalk_suggestion` queue (no in-app
   reader yet — the CO queries Supabase; gate a read view behind
   `is_allowed_reviewer() OR team_pass_ok()` if they want one).
3. **Refresh the dataset** when ESS ships a newer workbook cut — drop it at
   `kb/reference/cip_searchable_<date>.xlsx`, bump `SRC`/`BUILT_AT`, rerun.
4. **Program-level crosswalk** — the workbook is course/discipline TOP↔CIP; the COCI
   *program* inventory could add a program lane.
5. Watch for the **Tech Center's COCI CIP-dropdown** shipping — if it exposes an API,
   this reference could link out to it per TOP code.

## 2026-07-15 — StarCIP: the pivot to a simple "easy button" CIP reference (prototype)

Sam relayed **Jenni Abbott's email feedback** and asked how to pivot to match her
vision. The reframe: **stop recreating the crosswalk** (COE hosts it, needed only a
couple years) — the product is the **full CIP code list as the authoritative
reference** ("the new reference site when designing new programs and courses. Clear,
comprehensive, user-friendly"), the **successor to the TOP Code Manual**. Her two
suggest-lane notes (Supabase `cip_crosswalk_suggestion`, submitter Jenni) confirmed
it: **remove the "source"/provenance column** (it implies the list is "still open for
review") and **don't expose "Suggest a change" to the field**. Sam's operative word:
**simple — faculty want an "easy button."** This replaces the **6-tab Excel workbook**
the CO was going to email out (send a *link*, not a maintenance burden).

**Method (repo practice): prototype in a fast-feedback canvas → lock → port.** Rather
than rewrite the monolith, built a self-contained artifact
(https://claude.ai/code/artifact/cf0085e0-7df8-46e4-87a3-b1eb34c2e880) with the real
2,325-code dataset. Iterated live across several rounds with Jenni. **Nothing ported to
the live dashboard yet** — that's the next step. Prototype + data preserved at
[`docs/cip_prototype/`](cip_prototype/) (rebuild: `python build_proto.py`).

**What the prototype is:** one search box + the full CIP list; each row shows the
**category label (CTE / Non-CTE / Both / Noncredit)** immediately; click → plain-English
definition, examples, CIP family, NCES link. Category pills + family filter + a **🎓
C-ID/CCN** toggle chip (ANDs) + a **plain-English finder** ("describe your program" →
top candidate codes) + a light/dark toggle. Retired/reserved hidden by default.

**Two data findings that MUST carry to the port** (detail in
[`docs/cip_prototype/README.md`](cip_prototype/README.md) + the KB note):
1. **Certified CTE designations, not either workbook tab.** Jenni's 45.0702 catch
   opened it: the workbook's *CIP Descriptions* and *TOP-CIP Data* tabs **disagree on
   244 codes in BOTH directions** — neither is reliable. The CO consultant's certified
   list is the authority (= live tool = searchable file; Descriptions lags since early
   June). Preserved: [`kb/reference/cip_cte_certified_260715.json`](../kb/reference/cip_cte_certified_260715.json)
   (244 codes; 243/244 matched my crosswalk-sourced guess, the 1 diff = a fresher
   update; **0 uncertified conflicts**). Refreshed to the **2026-07-15 cut**
   (`kb/reference/cip_searchable_260715.xlsx`, also fixes 32.0107).
2. **C-ID/CCN = a course-level floor.** `x=1` if any mapped TOP has C-ID or CCN
   coursework (COCI rollup) — 292 TOPs C-ID, 406 CCN → 1,299 CIPs. Name it by the
   identifier, never "Transfer" (Sam's own correction; TOP→CIP is one-to-many).

**Phased AI plan (Sam approved):** Sierra already exists as a grounded RAG edge
function (`/functions/v1/cpl-chat`, SSE, reusable client). Phase 0 = the no-backend
keyword+stem finder shipped here (zero hallucination risk — grounded to real records).
Phase 1 = wire Sierra scoped to the CIP dataset once the CO confirms the
**finder-not-decider** framing.

**Next step:** lock the look with Jenni, then **port into `cip_crosswalk.js`** per the
plan in the prototype README. **Side-lane discipline honored — `cpl_todos.json` + the
numbered handoff left untouched** (the CCR mainline session owns those).
