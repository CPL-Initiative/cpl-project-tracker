# CPL Project Tracker — Claude Code Project Memory

This file is auto-loaded at the start of every Claude Code session in this
repo. Keep the **Critical Rules** section tight — move deep reference material
into the Pipeline Reference below or into dedicated docs.

---

## Critical Rules (do not violate)

1. **The daily GitHub Actions workflow regenerates the dashboard.**
   `.github/workflows/daily-dashboard.yml` runs daily (cron `17 10 * * *`, ≈10:17
   UTC). It executes
   `python excel_to_dashboard.py`, which reads the existing `CPL_Dashboard.html`
   and **replaces entire sections** (Filter Bar, Activity KPIs, Projects Grid,
   KPI section, exhibit CSS, title/h1). Any hand-edit inside one of those
   regenerated sections is overwritten on the next run. **If something needs to
   change, change the generator — not the HTML.**

2. **CSS-injection idempotency guard (`excel_to_dashboard.py` around line 5093)
   must not be removed.** The generator injects `EXHIBIT_ANALYSIS_CSS` before
   the first `</style>` tag. A guard strips any pre-existing copy before
   re-inserting so repeat runs don't accumulate duplicates. Before this guard
   existed, 34 copies (~6,500 lines) had piled up. See PR #4.

3. **`kpi_history.json` must have no date gaps.** The trend card's "1d" delta
   looks up "yesterday" with a `date <= target` filter, so a missing day causes
   the 1d delta to silently fall back to an earlier date. If a daily run is
   missed, backfill an interpolated entry with `"_interpolated": true`.

4. **`CPL_Dashboard.html` and `index.html` must stay identical.** The workflow
   copies one to the other at the end (`cp CPL_Dashboard.html index.html`).
   Never edit only one.

5. **Never force-push `main`.** GitHub Pages serves from it.

6. **Don't run a separate Cowork scheduled task for the daily dashboard while
   the GitHub Actions workflow is active.** Two schedulers racing to push to
   `main` caused the messy commit chain on 2026-04-19.

## Branch policy

- Work on feature branches; open a PR to `main`.
- Claude sessions: use `claude/<short-description>` branches (the session
  harness handles this automatically).
- **Always watch PRs.** When a Claude session opens a PR, subscribe to its
  activity (CI + review comments) and follow through — fixing small/clear
  issues, asking when ambiguous — until the PR is merged or closed.

## Deployed site

https://cpl-initiative.github.io/cpl-project-tracker/

---

## Pipeline Reference

### 1. Architecture Overview

```
CCCCO MAP CPL Dashboard (Azure)
        │
        ▼  /api/potential-savings (JSON)
Cloudflare Worker (cpl-proxy.slee-548.workers.dev)
        │
        ▼  GET /scrape?secret=...
live_metrics.json
        │
        ├── CPL_Initiative_Project_List_v3.xlsx (project data, budget, workplan)
        ▼
excel_to_dashboard.py (Python pipeline)
        │
        ├── CPL_Dashboard.html (rendered with KPI cards, project cards, charts)
        ├── CPL_Data.js (JSON data for filters/search)
        ├── statewide_data.js
        ├── kpi_history.json (appended daily)
        └── reports/ (Word doc reports)
              │
              ▼  copied to index.html, committed, pushed
GitHub Pages (cpl-initiative.github.io/cpl-project-tracker/)
```

The Cloudflare Worker calls the CCCCO Dashboard's REST API directly — no
browser automation. This was a deliberate design decision after Chrome-based
scraping proved unreliable.

### 2. File Inventory

| File | Purpose |
|------|---------|
| `cloudflare-worker-proxy.js` | Dual-purpose Cloudflare Worker: POST `/` for Claude API proxy (Custom Reports), GET `/scrape` for KPI scraping |
| `excel_to_dashboard.py` | Main pipeline: reads Excel + live_metrics.json → generates HTML, JS, Word reports |
| `CPL_Initiative_Project_List_v3.xlsx` | Master project data: projects, budget, personnel, workplan goals |
| `live_metrics.json` | Latest scraped KPI data |
| `CPL_Dashboard.html` | Generated dashboard HTML |
| `index.html` | Mirror of `CPL_Dashboard.html` served by GitHub Pages |
| `CPL_Data.js` | Exported project data for client-side filtering |
| `kpi_history.json` | Daily KPI snapshots — drives trend sparklines + deltas |
| `statewide_data.js` | Statewide exhibit adoption data |
| `dashboard_filters.js` | Client-side filter/search/sort logic |
| `report_generator.js` | Custom Report Generator (Claude API via proxy) |
| `docx.min.js` | Local copy of docx@8.0.4 UMD build (do **not** switch to CDN) |
| `fetch_custom_report.py` | Fetches CustomReport JSON from the MAP API |

### 3. Cloudflare Worker (cpl-proxy)

**URL**: `https://cpl-proxy.slee-548.workers.dev`

**Env vars (encrypted in Cloudflare dashboard)**
- `ANTHROPIC_API_KEY` — for Claude API proxy (Custom Reports)
- `SCRAPE_SECRET` — shared secret for scrape endpoint (currently `CPL_SCRAPE_2026`)

**Endpoints**
- `POST /` — proxies to `https://api.anthropic.com/v1/messages`. CORS restricted
  to `cpl-initiative.github.io`, `localhost`, `127.0.0.1`.
- `GET /scrape?secret=SCRAPE_SECRET` — calls the CCCCO Dashboard API, returns
  JSON with 6 KPI metrics + college tier classification.

**Data source**: `GET /api/potential-savings?cpltype=0&indExcludeSA=0` on
`cpldashboardcccco.azurewebsites.net`. Returns ~117 rows: Count (`Sorder=-1`),
ALL COLLEGES aggregate (`Sorder=1`), ~115 individual colleges (`Sorder=2`).

**6 KPI metrics output**: STUDENTS SERVED, ELIGIBLE UNITS, TRANSCRIBED UNITS,
SAVINGS, 20-YEAR IMPACT, ACTIVE COLLEGES (with Leading/Advancing/Inactive tier
breakdowns).

### 4. 3-Tier College Classification — "3 of 5" criteria model

| # | Criterion | Threshold |
|---|-----------|-----------|
| 1 | Student Volume | Students ≥ 500 |
| 2 | Articulation Depth | Eligible Units ≥ 3,000 |
| 3 | Avg Eligible Units/Student | AverageUnits ≥ 5 |
| 4 | Transcription Rate | TranscribedUnits/Units ≥ 25% |
| 5 | Avg Transcribed Units/Student | TranscribedAverage ≥ 3 |

- **Leading**: meets ≥ 3 of 5
- **Advancing**: not Leading and not Inactive
- **Inactive**: Students < 10 AND Units = 0

Rationale: the 3-of-5 model lets small colleges like Palo Verde (14 students)
reach Leading through effectiveness metrics, while large colleges with only
volume stay Advancing.

### 5. Python Pipeline (excel_to_dashboard.py)

1. Reads `CPL_Initiative_Project_List_v3.xlsx` (projects, budget, workplan,
   update log)
2. Reads `live_metrics.json`
3. Merges live metrics into headline KPIs (replaces static values, adds LIVE
   badges)
4. Generates the dashboard HTML by **replacing sections in the existing HTML**:
   KPI Summary Cards, Activity KPI Cards, Project Cards, Workplan Progress,
   Budget, Vision 2030, exhibit analysis section
5. Exports `CPL_Data.js`, `statewide_data.js`
6. Appends snapshot to `kpi_history.json`
7. Generates Word reports (master + per-project)

**Live Metrics Merge** — `merge_live_metrics()` maps scraped metric titles to
KPI keys:

```python
title_map = {
    "STUDENTS SERVED":    "cumulative_students",
    "ELIGIBLE UNITS":     "eligible_units",
    "TRANSCRIBED UNITS":  "transcripted_units",
    "SAVINGS":            "estimated_savings",
    "20-YEAR IMPACT":     "twenty_year_impact",
    "ACTIVE COLLEGES":    "active_colleges",
}
```

Preserves `note` fields on breakdowns (rendered as parenthetical descriptions)
and `footnote` arrays (rendered as small text at bottom of KPI card).

**Running locally**
```bash
python3 excel_to_dashboard.py
```

### 6. Daily GitHub Actions Workflow

`.github/workflows/daily-dashboard.yml` — runs daily on cron `17 10 * * *`
(10:17 UTC ≈ 2:17 AM PT) and on manual dispatch. Uses `actions/checkout@v5` +
`actions/setup-python@v6` (Node 24 — earlier v4/v5 were deprecated).

Steps:
1. Checkout `main`
2. Fetch CustomReport JSON (`fetch_custom_report.py`)
3. Scrape live metrics via Cloudflare Worker
4. **Sync curation overlay from Supabase** — runs `kb/_apply_curation.py`
   (folds `public.kb_curation` edits into `kb/coci_curation.json`). Guarded on
   the `SUPABASE_SERVICE_KEY` secret; skips gracefully if it's unset.
5. Run `excel_to_dashboard.py`
6. `cp CPL_Dashboard.html index.html`
7. Commit + push to `main` (rebase-retry loop for concurrent pushes — see
   commit `679c5ef`). The commit list includes `kb/coci_curation.json`,
   `unified_courses_data.js`, `unified_courses_index.js`,
   `unified_courses_details.js`, `unified_courses_standalone.js`,
   `unified_courses_members.js`, and `exports/unified_courses.xlsx` so curation +
   the regenerated Unified Courses dataset, lazy files, and export are captured
   each day. (If you add a new generated `unified_courses_*.js`, add it to this
   `git add` list or the daily run won't publish it.)

Commits as `github-actions[bot]` with message `Daily dashboard update — YYYY-MM-DD`.

**Secret required for the curation sync**: `SUPABASE_SERVICE_KEY` (the Supabase
service-role key) in repo Actions secrets. Without it, step 4 no-ops and
curation only lives in Supabase (still shown live via the tab's overlay).

### 6a. CPL Analytics Section — collapsible card grid

The section previously called "MAP Articulation Analysis" / "Detailed
Articulation Data" was renamed to **CPL Analytics** on 2026-05-18. Key
properties to preserve:

- Collapsible chrome reuses the **KPI Metrics** wrapper classes
  (`.kpi-section-wrapper`, `.kpi-section-header`, `.kpi-section-title`,
  `.kpi-toggle-arrow`) so the two sections feel identical. Body class
  is `.cpl-analytics-body`; the collapse rule is
  `.kpi-section-wrapper.collapsed .cpl-analytics-body { display: none; }`.
- Each card has a header **title-row** with a per-table **Excel export
  button** on the right that links to `exports/<card_id>.xlsx`. The
  xlsx files are pre-generated by `_write_analytics_xlsx_export()`
  during the daily run; no client-side xlsx library is shipped.
- Each of the 5 main tables has a **Total row** styled with class
  `.exhibit-total-row`. The two ranking tables — **Top-50 Most-Articulated
  Exhibits** and **Articulations by Unified Course** — are intentionally
  excluded since rank rows don't sum.
- **Articulations by Unified Course** (added 2026-05-22) is the one card
  driven by the **course-identity layer**, not raw MAP rows: it reads
  `kb/coci_articulations.json` via `_build_articulations_by_course()` and
  groups earned MAP articulations by unified course identity (C-ID/CCN/M-ID),
  so the same course taught at many colleges collapses to one row. Columns:
  unified course, discipline, colleges earned, modal credit recommendation,
  linked credential, **adoption leverage** (peer colleges teaching the same
  identity that haven't earned it). HTML shows the top 50 by leverage; the
  xlsx export carries all ~2,355 identities. **Over-merge guardrail:** leverage
  on identities flagged `over_merged` is **withheld** (rendered as "⚠ flagged",
  exported as "over-merged (withheld)") so a conflated cluster never yields a
  bogus adoption target. Skips gracefully if `kb/coci_articulations.json` is
  absent. (This is item (1) of the EACR-identity open thread — the additive
  card; re-pivoting the interactive EACR table itself is the deferred follow-on.)
- The static CSS in the input template carries TWO historical marker
  blocks that the generator now strips on every run:
  `/* ═══ MAP Articulation Analysis Cards ═══ */` (current) and
  `/* ═══ MAP Exhibit Analysis Cards ═══ */` (legacy). Keep both
  strippers in `main()` near the EXHIBIT_CSS_MARKER block — they're
  what guarantees idempotency across rename events.

### 6b. Workplan Activities & Projects wrapper (Dashboard tab)

The Dashboard tab's Activity Metrics, Filter Bar, and Projects Grid
all collapse together as **one** unit, under the section title
**Workplan Activities & Projects**. The Filter Bar applies to both,
so they share one collapse toggle.

- Outer wrapper id: `#workplanProjectsWrapper` (class
  `kpi-section-wrapper`); body class is `.workplan-projects-body`.
  Collapse rule:
  `.kpi-section-wrapper.collapsed .workplan-projects-body { display: none; }`
  (lives inside `EXHIBIT_ANALYSIS_CSS` so the daily regen restores it).
- Wrapper open/close lives in the **static template** between
  `<!-- ═══ Workplan Activities & Projects Section ═══ -->` and
  `<!-- ═══ End Workplan Activities & Projects Section ═══ -->`.
- The injected **Workplan Activity Metrics** subsection has NO inner
  `kpi-section-wrapper` of its own — the outer wrapper provides the
  only collapse. If you re-add inner collapse chrome, you'll get
  nested collapsibles with confusing UX.
- **Generator anchor change**: KPI Summary Cards replacement, MAP
  Articulation Analysis strip, and CPL Analytics strip/inject all
  end-anchor on `<!-- ═══ Workplan Activities & Projects Section ═══ -->`
  (NOT `<!-- Filter Bar -->`). Filter Bar now lives inside the
  wrapper; using it as the end-anchor would wipe the wrapper opening
  every run. The Workplan Activity Metrics strip/inject still uses
  `<!-- Filter Bar -->` because that subsection sits between the
  wrapper opening and Filter Bar.

### 7. Custom Report Generator

- **UI**: Modal with audience picker, metric checkboxes, format selection
- **Backend**: POSTs to Cloudflare Worker → Anthropic API
- **Model**: `claude-sonnet-4-5-20250929`
- **Output**: in-browser preview or downloadable .docx (via local `docx.min.js`)
- **Config**: `window.CPL_REPORT_PROXY_URL` set in HTML before
  `report_generator.js` loads

### 7a. College Activity Custom Report — Output Style Guidance

`college_report_generator.js` produces the "[College Name] CPL Update" Word
document. The prompt inside `buildPrompt()` enforces a specific tone and
shape — keep these guarantees if you ever rewrite the prompt:

- **Title**: Single-college reports are titled `<College Name> CPL Update`;
  multi-college reports default to `Selected Colleges CPL Update`. The docx
  builder writes the title itself, so the model is instructed NOT to repeat
  it as a `#` heading.
- **Audience assumption**: a busy college CEO, trustee, or board member —
  someone looking for bragging rights to share with constituents.
- **Tone**: CPL is a new endeavor for most CCCs. Be grateful for any
  activity. Never imply that a college is negligent, behind, or failing.
- **Reframe weaknesses as opportunities.** Low transcription rate → "credit
  waiting to be unlocked." Thin discipline coverage → "room to expand."
  Funding is predicated on outcomes, so gently equip the reader with
  awareness of what unlocks more apportionment, but always invitingly.
- **Structure** (in this order, `##` headings):
  1. Executive Summary — 1-2 short paragraphs, high-level, achievements +
     biggest opportunity. No metric dump.
  2. Notable Accomplishments — bullet list of 3-6 wins, each with a real
     number.
  3. Opportunities to Maximize Funding & Student Impact — bullets/short
     paras reframing gaps as opportunities.
  4. Next Steps — 2-4 concrete actions.
- **Length**: target 600-1,000 words. Eliminate redundancies — never
  restate the same metric in multiple sections.
- **Filename**: `<College_Slug>_CPL_Update_<YYYY-MM-DD>.docx`.

If you change the prompt, mirror the change here so the guidance and the
code stay in sync.

### 7b. Top-level Tab Layout (Phase D, 2026-05-18)

The dashboard renders **4 top-level tabs**, navigated via URL hash so they
are linkable and survive a refresh:

| Tab key (hash) | Display label | Content |
|----------------|---------------|---------|
| `dashboard` (default, no hash) | Dashboard | KPI Metrics, CPL Analytics, Workplan Activity Metrics, Filter Bar, Projects Grid, **plus teaser cards** linking to the other three tabs |
| `workplan-goals` | Annual Workplan Goals | The 5-year goals + stretch + current table |
| `budget` | Budget | CPL Budget & Expenditure Plan |
| `vision-2030` | Vision 2030 | Vision 2030 Alignment cards with live progress |

Implementation notes (important — keep in sync with the generator):

- Tab nav, tab panes, and the tab-switch JS live in the **static
  template** (`CPL_Dashboard.html`), not in the generator. Each tab pane
  is wrapped with its own `<div class="main-container">` and ends with a
  `<!-- /tab-<name> -->` close comment.
- Section boundary markers were added on Phase D so generator
  replacements stay inside the right pane on repeat runs:
  `<!-- End Projects Grid -->` and `<!-- End Vision 2030 Section -->`
  delimit those two sections; Budget and Annual Workplan Goals
  already had paired `<!-- End ... -->` markers.
- **Annual Workplan Goals is injected TWICE in main()**
  (`render_workplan_goals_html` + `render_annual_goals_table_html`).
  Both code paths now replace **in place** between the AWG markers
  rather than re-anchoring against `<!-- Vision 2030 Section -->` — if
  you re-anchor against Vision again, the content ends up in the wrong
  tab. (See the bug fixed 2026-05-18.)
- The Dashboard tab carries auto-generated **teaser cards** built in
  the generator and injected at `<!-- TEASER_CARDS_PLACEHOLDER -->`.
  The placeholder lives between main-container close and Dashboard
  pane close, so the cards span full width but stay inside the pane.
- Tab switching JS sits at the bottom of the template (just before
  `</body>`) and uses `history.replaceState` for the default tab so the
  URL stays clean.

### 8. Supabase Database (Separate System)

- **Project**: `hvuwhnbuahrtptokpqfh.supabase.co`
- **Tables**: projects, budget_expenditures, personnel, workplan_goals
- Separate from live metrics scraping; handles project-level data storage.

### 9. EACR Exhibit Identity — current state and future direction

**Current grouping (shipped 2026-05-18):** the Exhibit Adoption & Credit
Recommendations table groups MAP rows by
`(Exhibit Title, CPL Type, Collaborative Type)` rather than raw
`ExhibitID`. This collapses MAP's ID fragmentation (3,451 IDs → 3,274
cards) but does not yet handle **title drift** — the same credential
entered under multiple freehand titles by different colleges still
produces multiple cards.

**Career Cluster filter** uses the `CCC SW Sector` column in
`TOP_Code_Lookup.xlsx` (CCC Strong Workforce 10-sector framework with
an "Academic Transfer & General Education" catch-all).

**TOP code caveat — they vary for the same course.** Colleges assign TOP
codes in COCI with discretion and no definitive guidance for ambiguous
cases, so the *same* course often carries different TOP codes across
colleges (in practice ~52% of consolidated M-IDs have a mixed TOP code).
Anything that picks one TOP code for a consolidated course (e.g. the
`top_code` on a minted M-ID) is choosing a representative, not ground
truth — prefer the modal (plurality) pick and surface the spread
(`top_code_mixed` / `top_code_distribution`) rather than trusting a single
value. For broad grouping, the coarser TOP digits are more stable than the
full 6-digit code.

**Credit status derivation (CreditType rule).** MAP's course list carries a
`CreditType` column (the funding type) and a separate `Non_Credit_Category`
(the CDCP *program* type — Short-term Vocational, ESL, Older Adults, …).
Credit status is derived from **`CreditType`**, not the program category:

| `CreditType` | credit_status |
|---|---|
| `Credit Course` | **Credit** |
| `Other Noncredit Enhanced Funding` | **Noncredit Enhanced** |
| `Workforce Preparation Enhanced Funding` | **Noncredit Enhanced** |
| `Non-Enhanced Funding` | **Noncredit** |
| blank / unrecognized | by `UnitValue`: **>0 → Credit, else Noncredit** |

`Non_Credit_Category` is kept as descriptive metadata in **`noncredit_category`**
(the CDCP program type — Short-term Vocational, ESL, Older Adults, …), not the
funding signal. It is populated only where a member is offered noncredit (null
otherwise), and — like TOP codes — it can differ across colleges, so it carries
`noncredit_category_mixed` + (on the catalog) `noncredit_category_distribution`.
A Credit-status M-ID may still carry a `noncredit_category` if some member
colleges offer the course noncredit. When members of one M-ID disagree on credit
status, store the modal status and set `credit_status_mixed`. The three system
credit statuses are **Credit / Noncredit / Noncredit Enhanced**. Implemented in
`kb/_join_credit_status.py`.

**Future direction — synthetic unified-title layer:** an AI-assisted
canonicalization layer that assigns each MAP exhibit a unified title,
issuing agency, and training agency, so all spelling/format variants
collapse into one card. Design doc:
[`docs/exhibit_unification_vision.md`](docs/exhibit_unification_vision.md).
When that lands, the EACR grouping key will become
`(Unified Title, CPL Type, Collaborative Type)` and a per-exhibit
`also entered as…` disclosure will surface the raw titles underneath.

### 10. C-ID / CCN numbering conventions (authoritative) + M-ID alignment direction

Source docs (ASCCC, uploaded 2026-05-22): the C-ID/CCN one-pager, the CCN
structure infographic, the CID/TMC ADT Handbook (F2022), and the TMC
Development Guidelines (2013). The first two define the **numbering scheme**;
the latter two cover the descriptor/degree-development process (read on demand
if the renumber project needs them).

**The two official systems (leave both VERBATIM as listed in COCI — never relabel):**

- **C-ID** (Course Identification Numbering System) — *faculty-driven,
  descriptor-based, many-to-one*: many local courses map to one C-ID descriptor
  (the descriptor is the **minimum** content; colleges may add more). Format is
  `SUBJ ###` (e.g. `COMP 122`, `POLS 110`) — **no `C` prefix on the number.**
  491 active descriptors; basis for 43 TMCs; ~30k CCC courses aligned.
- **CCN** (Common Course Numbering, AB 1111) — *student-facing, template-based,
  one-to-one*: identical template content statewide (extra content goes in an
  optional "Part 2"). Format `SUBJ C####&&`:
  - `SUBJ` — standardized **4-letter** subject abbreviation (a system-level
    standard list; we do NOT yet hold that authoritative list).
  - `C` — Course Type Identifier = "this is a CCN". **A local course has no `C`.**
  - `####` — 4-digit number with **banded meaning**: `0XXX` non-transferable ·
    `1XXX` 100-level · `2XXX` 200-level · `3XXX` 300-level · `4XXX` 400-level ·
    `9XXX` noncredit. (For CCC only lower-division applies → realistically
    `0/1/2/9` XXX.)
  - `&&` — up to **2** Course Speciality Identifiers, no filler when absent:
    `H` Honors · `L` Lab-only · `S` Support · `E` Embedded Support.
  - Example: `GEOL C1005H` = Geology · CCN · 100-level · Honors.
  Rollout: Phase I (6 templates) student-facing Fall 2025; Phase II (24) Fall
  2026/27; Phase III (55) Fall 2027.

**M-ID alignment direction (PROPOSED — design decisions still open, NOT built):**

Our minted identities (`coci_minted_courses.json`, currently rendered
`M-ID <SUBJ> <num>`) should adopt a CCN-*structured* surrogate format that is
unmistakably **ours, not official**:

- **Lead with `M` in the Course-Type-Identifier position** (`SUBJ M####&&`),
  exactly paralleling CCN's `C`. The `M` (Minted) signals a synthetic MAP
  identity and **prevents any collision with a real CCN `C####`**. This is the
  whole point of the prefix: an M-code must never read as an official CCN.
- **C-IDs and CCNs stay verbatim** (different formats, both authoritative). Only
  the *minted* tier gets the M-scheme.
- **Banded renumber is its own staged project, not a relabel.** Re-keying the
  minted identity space ripples into memberships, `coci_articulations.json`
  `course_id`, curation `merge_into` pointers, dashboard rows, and the
  Articulations-by-Course card — same blast radius as the parked
  **CourseControlNumber re-mint**, so the two should be **bundled** (one
  re-key, not two churns) and carry an **old-M-ID → new-M-ID alias map** so
  curation/articulation pointers survive. Band only on data we can defend
  (`credit_status` → `9XXX` noncredit is solid; `0XXX` non-transferable / `1XXX`
  vs `2XXX` need transferability/degree-applicability data we have not confirmed
  we hold); the 3 trailing digits need a **stable, deterministic, persisted**
  within-(subject,band) sequence or codes churn each daily regen. Always
  document loudly: **M-numbers are CCN-aligned surrogate keys, NOT a claim of
  CCN equivalence.**


---

## Knowledge Base & Unified Courses Curation — Build Status

The `kb/` directory holds the synthetic-identity knowledge base above MAP's
exhibit/course data, plus the data behind the dashboard's **Unified Courses**
curation tab. Full schema/design: `kb/README.md` and
`docs/exhibit_unification_vision.md`. This section is the orientation map for a
session resuming the build — read it before touching `kb/` or the curation tab.

**Two identity layers:**

1. **Credential layer** (which credential an exhibit represents) — built &
   curated across the full dataset.
   - `unified_titles.json` — every distinct raw exhibit title → a unified
     credential name (+ confidence, `quality_flag`). `quality_flag:
     "suspect_course_as_exhibit"` marks ~200 exhibits typed "Industry
     Certification" that are really a course with no credential (data-entry
     pattern, ~half Modesto JC) — a triage backlog, not a verdict.
   - `credentials.json` — per `(unified_title, issuing_agency)` issuer/trainer
     metadata.

2. **Course-identity layer** (which common course a local course is) — staging
   built; the **articulation crosswalk is the current frontier**. Identifier
   precedence is **CCN-ID > C-ID > M-ID** (see the README section).
   - **CURATED ANCHOR — firewalled, do NOT bulk-edit:** `common_courses.json` +
     `course_crosswalk.json` are a small hand-reviewed quality anchor. NEVER
     bulk-merge staging into them; promote individual entries only after review.
   - **Reference authorities (read-only):** `reference/cid_descriptors.json`,
     `ccn_courses.json`, `mq_disciplines.json` (official MQ discipline
     vocabulary), `reference/coci_courses.json` (authoritative C-ID/CCN courses
     + descriptions from the MAP COCI list), `reference/subject_discipline_map.json`.
   - **Staging (operational, machine-built from the COCI course universe):**
     `coci_minted_courses.json` (minted **M-ID** consolidated courses — identity,
     discipline, credit_status, typical_units, top_code, noncredit_category, each
     with `*_mixed` variance flags), `coci_minted_memberships.json` (lean
     M-ID → member `(subject, number)` join index), `coci_minted_singletons.json`
     (deferred single-college courses), `coci_unified_courses.json` (variant-
     unified clusters), `coci_articulations.json` (earned articulations resolved
     to identity + credential, with cross-college **adoption-leverage** lists —
     the payoff layer), `coci_curation.json` (human curation overlay synced from
     Supabase — each entry carries `discipline` + `reviewed_by` + `reviewed_at`).
   - **Discipline inference (re-runnable, AI-assisted draft):**
     `kb/discipline_inference.json` is an **authored, editable lexicon** — a
     `subject_map` (subject code → discipline, for codes whose member titles are
     unambiguously one discipline) + a tight `title_keyword` fallback (terms that
     are unambiguous alone). `kb/_infer_disciplines.py` applies it to the minted
     courses, clusters, and singletons: validates every target against
     `mq_disciplines.json`, **skips reviewed/curated entries**, and stamps each
     fill with `discipline_source` (`subject_map`|`title_keyword`),
     `discipline_confidence`, `discipline_inferred_at`. Re-run after editing the
     lexicon; it only fills entries that are still blank. Passes 1–3 filled the
     lexicon-tractable courses; the long tail (ambiguous catch-all subject codes)
     remains.
   - **Description-aware inference (re-runnable, complementary):**
     `kb/_infer_disciplines_from_desc.py` mines the course *description* for
     courses whose title/subject gave no signal (e.g. "Climate Control" →
     description names HVAC). It uses a **safe, high-precision phrase set** (only
     terms decisive inside long prose — welding, automotive, dental, CNC,
     paramedic, …) with **plurality scoring + unique-winner** (ties skipped),
     since descriptions mention disciplines tangentially. Descriptions come from
     the in-file `description`/`synthesized_description` for parents and from the
     generated `unified_courses_details.js` for singletons (skipped if that file
     is absent → parents-only). Fills are stamped `discipline_source="description"`
     at confidence **0.5** (the lowest tier — surfaced as `⚙ descr` for reviewer
     triage). Pass 4 filled ~941 (850 singletons + 91 parents).
   - **TOP-aware inference (re-runnable, highest-yield):**
     `kb/_infer_disciplines_from_top.py` maps each blank course's `top_code` to an
     MQ discipline via the authored `kb/top_discipline_map.json` (the 6-digit MAP
     TOP program title is a curated category that often names the discipline:
     "0948.00" → Automotive Technology, "1230.10" → Registered Nursing → Nursing).
     **Guardrail:** colleges vary in TOP assignment, so it's an intent signal, not
     ground truth — fills at **confidence 0.5**, `discipline_source="top_code"`
     (surfaced as `⚙ TOP`), reviewer-verifiable. The coarse catch-all codes
     (`4930.xx` Interdisciplinary/Basic-Skills/Guidance, the `*99.00 Other` and
     `* General` buckets) are **deliberately omitted** from the map so they stay
     blank rather than get a misleading lump-discipline (only ESL `4930.86/.87`
     are mapped). Pass 5 filled **~10,344** (the biggest pass — every staging
     course carries a top_code; blanks 17,537 → ~7,193). Edit the map + re-run.

**Generators** (`kb/_seed_*.py`, `_join_*.py`, `_curation_*.py`, `_flag_*.py`)
are one-shot, kept for provenance — curate by editing JSON / via Supabase, not
by re-running them. **Exception:** `kb/_infer_disciplines.py` is intentionally
re-runnable (idempotent — only fills blanks, never overwrites reviewed/curated).

**Unified Courses dashboard tab + Supabase:**
- The **Unified Courses** tab lets allowed reviewers curate disciplines.
  `unified_courses.js` is a **static asset** — edit it directly; it is NOT
  regenerated by `excel_to_dashboard.py`. (Its DATA, `unified_courses_data.js`,
  IS generated by `export_unified_courses()`.)
- Auth is **Supabase GoTrue magic-link** sign-in gated by an `allowed_reviewers`
  list. The magic link's redirect must be passed as a **`?redirect_to=` query
  param** (not a body `options` object) and must match the Supabase **Site URL /
  allowed Redirect URLs** (both currently set to
  `https://cpl-initiative.github.io/cpl-project-tracker/`). Don't re-break that.
  Sessions are kept alive via the **refresh token** (no repeated magic-link
  emails); the stored token is validated as a well-formed JWT before use so a
  garbled token can't silently break saves. Schema setup:
  `kb/supabase_curation_setup.sql`.
- **Curation UX** (all in `unified_courses.js`): click a Discipline cell to set
  it (MQ vocabulary); after a save, an **opt-in subject-code bulk apply** offers
  to fill other *blank* same-subject courses (never overwrites; warns that
  subject codes vary by college). Edits write to `kb_curation` and show live via
  an overlay. **Batch-verify** — a toolbar **"✓ Verify N filtered"** button
  accepts the machine-inferred discipline AS-IS for every currently-filtered
  Generated row that has a discipline (chunked bulk upsert; excludes blanks /
  locked anchors / already-Verified; the confirm surfaces the lower-confidence
  title-keyword/description share so the curator can narrow to "by subject-code"
  first). It clears the Generated backlog in bulk rather than one Verify per row.
  The **⚇ Unify** candidate ranking factors **subject + units** agreement, not
  title alone (title-token Jaccard ≥ 0.5 gates inclusion; same-subject +0.15 and
  same-units +0.10 reorder to the top — `unified_courses_index.js` now carries
  units as a 5th field). **Suggested-merges worklist** — a **"✨ Suggested
  merges"** toolbar button opens a review queue over precomputed same-course
  groups (`unified_courses_suggestions.js`, lazy). The generator groups identities
  by a **level-safe title signature** (parentheticals removed, articles dropped,
  roman numerals → digits, tokens sorted — so "Japanese I"/"Japanese 1" group but
  "Japanese I"/"II" do NOT), ranked by cohesion (subject + units agreement + size).
  The payload has **two sections, anchored first**: `groups` are
  **identity-anchored** (every group has ≥1 main M-ID/Cluster identity, excludes
  `cid_conflict` over-merges, attaches matching orphan singletons) — **Confirm
  MERGES into that existing identity**. `singleton_groups` (V2, done 2026-05-22)
  are **singleton-only** — ≥2 single-college Stand-Alone courses sharing a
  signature but matching NO existing identity (~1,030 groups) — **Confirm MINTS a
  brand-new unified course** (target left blank → `doConsolidate` generates a
  `UC-CUR-*` id, all members get `merge_into` it + the unified title). Each
  singleton group carries a **`same_college`** flag (set by the generator via the
  title-filtered raw-list join: True when every member resolves to one college →
  likely intra-college variant ladders / credit-noncredit / language pairs, NOT
  cross-college duplicates); these are **flagged in the UI** (amber warning) and
  **ranked last** within the section so genuine cross-college candidates surface
  first (~869 cross-college vs ~161 same-college at last build). The curator
  reviews one group at a time, members pre-checked; **Confirm** reuses
  `doConsolidate`, **Skip** advances. **Never auto-applied.** A **pending-sync indicator** ("⟳ N edits awaiting daily sync") +
  **Sync now** link surface edits not yet in git (diffed against the dataset's
  `committed_curation` snapshot). The **curated common-course anchor**
  (`common_courses.json`, C-ID/CCN/M-ID) is shown **read-only** (an "anchor"
  badge; curation disabled — it's firewalled). Filters include **Source**
  (`id_system`), discipline, credit, confidence, adoption, **Generated-by**
  (discipline provenance — `by subject-code` / `by title-keyword` /
  `by description`), flagged-only, blank-only; default sort is **Subject(s)
  then course number**. Subject(s) cells hover to show the course title(s) /
  cluster title variants.
- **Discipline provenance surfacing** (added 2026-05-22). Generated (not-yet-
  verified) rows whose discipline was machine-inferred carry a small
  `⚙ subj-code` / `⚙ title-kw` / `⚙ descr` badge (title-keyword AND description
  use the warn color, since they're the riskier 0.55/0.5-confidence fills) plus
  the **Generated-by** filter, so a reviewer can blast through the safe
  `subject_map` fills with **Verify** and scrutinize the keyword/description
  ones. The data comes from per-row `dsrc`/`dconf` keys emitted by
  `export_unified_courses()` via the `_add_prov()` helper — emitted **only** on
  non-curated rows that carry a `discipline_source` (blank/manual/anchor rows
  stay lean, no extra keys). Curated rows render as Verified, so no badge. The
  four `discipline_source` values are `subject_map` + `title_keyword` (from
  `kb/_infer_disciplines.py`), `description` (from
  `kb/_infer_disciplines_from_desc.py`), and `top_code` (from
  `kb/_infer_disciplines_from_top.py`) — the Generated-by filter has a matching
  option for each (`by subject-code` / `by title-keyword` / `by description` /
  `by TOP code`); only `subject_map` renders ok-colored, the rest warn.
- Supabase is **live and shared**: only the unified-courses curation tables
  (`kb_curation`, `allowed_reviewers`) are in scope. The
  projects/budget/personnel/workplan tables (§8) and the auth/Redirect-URL config
  are off-limits without explicit confirmation, and no destructive migrations
  without sign-off.

**Generated artifacts + lazy files (all from `export_unified_courses()`).** The
tab keeps `unified_courses_data.js` lean by splitting heavy data into files the
client fetches **only on demand**. All are regenerated daily and MUST be in the
workflow `git add` list (§6):

| File | Global | Loaded when | Contents |
|------|--------|-------------|----------|
| `unified_courses_data.js` | `CPL_UNIFIED_COURSES` | always (script tag) | in-browser rows (~16.4k: Course/Cluster + curated C-ID/CCN/M-ID anchors), `colleges[]`, `mq_disciplines`, `committed_curation`, `committed_descriptions`, `topmap` (TOP code→title, ~400, for the list's TOP hover) |
| `unified_courses_index.js` | `CPL_UC_INDEX` | ⚇ Unify dialog | compact `[id,title,subject,kind,units]` search index (units feeds the subject/units-aware ranking) |
| `unified_courses_details.js` | `CPL_UC_DETAILS` | ⓘ details modal | `id → {d:description, s:source}` (~70k incl. stand-alones; ~34MB, lazy/gzipped) |
| `unified_courses_standalone.js` | `CPL_UC_STANDALONE` | "Stand-Alone" kind filter | ~57.7k single-college rows (kept out of the main payload) |
| `unified_courses_members.js` | `CPL_UC_MEMBERS` | row expand caret ▸ | `id → [{c:collegeIdx,n:code,t:title,u:units,p:topcode}]` member college courses + `topmap` (TOP code→title, deduped) |
| `unified_courses_member_desc.js` | `CPL_UC_MEMBER_DESC` | member "Show descriptions" link | `id → [desc,…]` PARALLEL to `members[id]` (each ≤500 chars) — on-demand, ~51MB so loaded only when a curator opens member descriptions |
| `unified_courses_suggestions.js` | `CPL_UC_SUGGESTIONS` | ✨ Suggested-merges worklist | `{groups:[…], singleton_groups:[{sig,n,score,same_college,members:[{id,t,s,u,k,g}]}]}` — `groups` = identity-anchored same-title merges; `singleton_groups` (V2) = singleton-only matches that mint a NEW unified course (`same_college` flags likely intra-college variants). Ranked by cohesion |

**Raw course source — `kb/reference/coci_course_list.xlsx`** (committed, ~24MB,
141,738 rows). Cols: College, CourseControlNumber, Subject, Course_Number,
CourseTitle, UnitValue, CreditType, Non_Credit_Category, TopCode, **CIDNumber**,
**CatalogDescription**, **CommonCourseNumber**. Read **once** (openpyxl
read-only, streaming — never cat it) in `export_unified_courses()` and shared by
the description + member-row builds. If absent, those two artifacts skip
gracefully.

**Member-college rows + the title-filter (important).** Member rows are a
**forward join**: each identity → its member `(subject, course_number)` pairs →
raw college courses. The membership key `(subject, number)` is **globally
ambiguous** (e.g. "MATH 31" is a different course at every college), so the join
**re-applies the minting's title check**: a candidate is kept only if its title
matches the identity's (token-set Jaccard ≥ 0.5; generic/empty titles kept).
**C-ID / CCN joins are authoritative and trusted** (no title filter — join on
`CIDNumber`/`CommonCourseNumber`). Clusters/merge targets filter each constituent
leaf against its own title. The same title-aware candidate set also feeds the raw
description fallback. (Bug history: without the filter, M-ID A 100 "Undergraduate
Research Experience" listed every college's MATH 31 — Plane Trig, Precalc, etc.)

**Descriptions.** ⓘ modal shows the full record + an **editable description**.
Precedence per id: curated (`kb_curation` field **`description`** — added to
`_apply_curation.py` FIELDS) > existing layer (minted "representative/modal",
synthesized cluster, C-ID/CCN reference) > **raw `CatalogDescription` fallback**.
Stand-alones are included so ~54k get a description. The pending-sync badge
counts description edits too (diffed against `committed_descriptions`).

**Source filter now includes `CCN-ID`** — the 58 AB-1111 Common Course Numbers
(`kb/reference/ccn_courses.json`) are emitted as locked read-only anchor rows,
mirroring the C-ID anchor, and are usable as ⚇ Unify merge targets.

**Frontier / open work:**

- **Suggested-merge worklist V2 — DONE (2026-05-22).** The ~1,030
  **singleton-only** merge clusters (single-college courses that match each other
  but no existing identity) now surface as a second `singleton_groups` section in
  `unified_courses_suggestions.js`, reusing the same generator grouping + UI;
  Confirm mints a brand-new `UC-CUR-*` unified course. Same-college groups
  (~161, likely intra-college variants) are flagged + ranked last. See the
  "Suggested-merges worklist" bullet above for the full description.
- **Dashboard analytics by Unified-Course identity — additive card DONE
  (2026-05-22, Approach A).** The **Articulations by Unified Course** card in CPL
  Analytics (`_build_articulations_by_course()` ← `kb/coci_articulations.json`)
  groups earned articulations by unified identity, surfacing cross-college
  adoption leverage with the over-merge guardrail (see §6a). Collapse: 10,853 raw
  MAP articulation rows → 2,355 distinct course identities (4,592 identity×credential
  records). **Deferred follow-on (Approach B):** re-pivoting the *interactive*
  EACR (`statewide_adoption` / `statewide_interactive.js`) table from credential-
  grouping to course-identity grouping — architecturally significant (changes EACR
  semantics + the interactive JS, and over-merge directly affects headline adoption
  numbers); confirm scope before building.
- **Open threads (next sessions), in priority order:** (1) **`CourseControlNumber`
  re-mint** — the root-cause fix that re-keys memberships at the raw
  college-course level (unblocks crosswalk Phase C; scope before build).
  (2) **EACR interactive re-pivot (Approach B above).** (3) **Singleton-only
  worklist follow-up** — consider a `same_college`/blank-disc filter on the
  worklist and extending V2's grouping with a description tie-breaker for the
  borderline cross-college pairs.
- **Crosswalk re-key initiative.** Use the raw list's
  `CIDNumber`/`CommonCourseNumber` to promote minted M-IDs to their real C-ID/CCN
  identity (precedence CCN > C-ID > M-ID). **Phase A — DONE (PR #66):** each row
  carries a `match` field ({`cid`} single agreed C-ID, {`ccn`}, or
  {`cid_conflict`:[…]} when members disagree), surfaced as row badges + an
  "Official ID" filter, computed over the *title-consistent* member set. No
  identity change. In-browser counts: 960 single C-ID, 26 CCN, 235 C-ID
  conflicts (`NULL`/`N/A` sentinels filtered). **Phase B — DONE (2026-05-22,
  decisions: consolidate-by-ID + inline-generator).** Implemented as a
  **post-pass in `export_unified_courses()`** right after the Phase A `match`
  loop: every minted/cluster row whose title-consistent members agree on ONE
  clean official C-ID/CCN is grouped into a single official-identity row —
  **folded under the existing anchor** when one exists, else a **synthesized
  official row** (`id` = the C-ID/CCN, `id_system` accordingly). Last run:
  **896 M-IDs → 173 new official-ID rows + 36 anchor folds** (main payload
  16,442 → 15,719). Each consolidated row carries `consolidated_from` (the
  underlying M-ID keys) and those keys are registered in `merge_into`/
  `merge_members`, so the lazy member/detail joins fold correctly and
  curation/articulation pointers survive. The Unify-dialog index
  (`unified_courses_index.js`) is now built **after** Phase B so consumed M-IDs
  aren't offered as ghost targets and the official rows are searchable. UI:
  rows show a `⛓ N merged` badge (`unified_courses.js`). Regen-safe / no KB
  mutation / reversible. Guardrail honored: only **clean unanimous** matches —
  the 235 `cid_conflict` rows are never touched; a lone M-ID with no anchor
  keeps just its Phase A badge (no synthetic relabel). **Phase C — PARKED
  (2026-05-22, informed decision).** Splitting the `cid_conflict` / no-official-ID
  rows is deferred; conflicts stay safely surfaced via the existing "C-ID
  conflict — do not promote" badge + filter, and Phase B (clean official-ID
  consolidation) remains the automatic stopping point. **Root cause:** the
  membership key is `(subject, number)`, which is **lossy** — the same key is a
  different course across colleges (`ACCT 110` at one, `ACCT 120` at another), so
  conflicts **cannot be split at the generator level**. It's a key-granularity
  problem, not a similarity one, so a description tie-breaker can't fix it.
  **Numbers:** 231 conflicts across 2,274 member pairs; ~60% carry any C-ID,
  ~32% (718) map to >1 C-ID themselves, only ~29% cleanly extractable. **Real
  fix (its own project — scope before any build):** a `CourseControlNumber`-
  grained re-mint that rebuilds memberships at the raw college-course level so
  each member carries its own C-ID (the per-college COCI course list, which
  carries the control number, is the likely input). NOT a generator post-pass.
- Refine + curate the articulation crosswalk — precise title-based
  disambiguation when a `(subject, number)` maps to multiple M-IDs, carry
  confidence/`*_mixed`/over-merge flags onto each record, never emit an adoption
  suggestion off a flagged over-merged cluster. Backlog: fuzzy variant merging +
  subject canonicalization, singleton minting, and the
  `suspect_course_as_exhibit` triage (raise the Modesto pattern with the college).
- **Description-similarity tie-breaker (Phase C candidate).** The member-row
  forward join currently keeps a candidate when its title matches the identity
  (token-set Jaccard ≥ 0.5). Titles are the right *primary* signal, but the
  borderline band (titles differ enough to fail the threshold yet are the same
  course, e.g. "Intro to Programming" vs "Programming Fundamentals", or the
  reverse — same generic title, different course) would benefit from a
  *secondary* check on `CatalogDescription` similarity (TF-IDF/cosine with
  boilerplate like "students will…"/prereqs/repeatability stripped). Scope it to
  the ambiguous middle (~0.3–0.5 title Jaccard), NOT every pair — descriptions
  share boilerplate that inflates naive similarity, and it's heavier (~450 chars
  × 141k rows). Prototype + **measure how many member rows flip** before
  committing. (Motivating case: College of the Desert's MATH 31 genuinely *is*
  "Undergraduate Research Experience" in STEM — title match already keeps it; the
  tie-breaker is for the harder cases the title gate can't settle.)
**Discipline completion — 5 inference passes done (2026-05-22).** Blank
disciplines went from **21,656 → ~7,193** (~67% filled) across: lexicon passes
1–3 (`discipline_inference.json` + `_infer_disciplines.py` — subject_map +
title_keyword), the description pass (`_infer_disciplines_from_desc.py`), and
the highest-yield TOP-aware pass (`_infer_disciplines_from_top.py` +
`top_discipline_map.json`, ~10.3k fills). Each fill is a confidence-tiered,
reviewer-verifiable draft (`discipline_source` ∈
`subject_map`/`title_keyword`/`description`/`top_code`; surfaced via the
Generated-by filter + `⚙` badges + **batch-verify**). **The remaining ~7,193
are mostly the genuinely-ambiguous `4930.xx` academic catch-all** (deliberately
not auto-filled) — best closed by **reviewer curation in the tab** (now
well-tooled), not more heuristics. Re-run any pass after editing its
lexicon/map; all skip reviewed/curated and only fill blanks.

**Guardrails when resuming:**
- The `coci_*.json` files are large (tens of MB). **Never read/cat them into the
  conversation** — it trips `400: text content blocks must be non-empty` /
  context overflow. Inspect via scripts that print counts/samples only.
- Staging only; don't touch the curated anchor or Supabase auth/other tables
  without confirmation. Feature branch + PR; don't push to `main`.

---

## Troubleshooting

### Dashboard not updating
1. Check the GitHub Actions run — Actions tab in GitHub
2. Check `live_metrics.json` → `scraped_at` timestamp
3. Check if commit was pushed (`git log origin/main -5`)
4. If browser shows stale content, hard-refresh (Ctrl/Cmd+Shift+R)

### Scrape returning errors
1. Test: `https://cpl-proxy.slee-548.workers.dev/scrape?secret=CPL_SCRAPE_2026`
2. `Invalid or missing secret` → check `SCRAPE_SECRET` in Cloudflare dashboard
3. `CPL API returned 502` → CCCCO Dashboard may be down
4. `ALL COLLEGES row not found` → API response structure may have changed

### KPI values stale but date updated
- Pipeline updates the "Updated" date but only refreshes KPIs if
  `live_metrics.json` has newer data
- Check `live_metrics.json` → `scraped_at`
- If old, the scrape step failed — test the worker endpoint directly

### "Duplicate sections" / HTML growing on every run
- You've likely removed or broken the idempotency guard in
  `excel_to_dashboard.py`. Verify the block around the
  `EXHIBIT_CSS_MARKER` check still strips existing copies before re-injecting.

### `kpi_history.json` 1d delta shows stale comparison
- Check for date gaps in the JSON. If yesterday is missing, backfill with
  `"_interpolated": true`.

### docx library errors
- Local `docx.min.js` is v8.0.4 UMD, 334KB. CDN versions were unreliable — do
  **not** switch back to CDN. To refresh the local copy:
  `npm pack docx@8.0.4`, extract, copy `umd/docx.min.js`.
