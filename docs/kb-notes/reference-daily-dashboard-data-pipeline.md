---
title: Daily dashboard data pipeline — accounting for the whole daily dataset
created: 2026-06-01
updated: 2026-06-01
tags: [reference, data-pipeline, daily-refresh, kpi, data-sources, supabase, map, cccco, custom-report]
kb-status: published
kb-type: reference
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[excel-dependency-audit]]"
artifacts:
  - .github/workflows/daily-dashboard.yml
  - fetch_custom_report.py
  - cloudflare-worker-proxy.js
  - excel_to_dashboard.py
  - live_metrics.json
  - kb/dashboard_config.json
---

# Daily dashboard data pipeline — what's in the daily dataset, and where every piece comes from

> **One-sentence summary** — A complete accounting of the daily dashboard
> refresh: the **7 data sources**, what each contributes (every headline KPI +
> analytics table + project/budget/workplan field), how it's extracted, and the
> committed daily artifacts you can open to see the dataset.

This is the "account for the daily dataset" reference Sam asked for after the
Excel retirement (so the data lineage doesn't live only in code). It is built
from the actual code paths (`.github/workflows/daily-dashboard.yml`,
`fetch_custom_report.py`, `excel_to_dashboard.py`, the Cloudflare worker, the
`kb/_load_*.py` loaders), not from memory.

---

## 1. The 7 data sources at a glance

| # | Source | Where it lives | Auth | How it's pulled | Refresh | Feeds (dashboard surface) |
|---|---|---|---|---|---|---|
| **S1** | **CCCCO MAP CPL Dashboard** | `cpldashboardcccco.azurewebsites.net` → `/api/potential-savings?cpltype=0&indExcludeSA=0` | public API via the worker's `SCRAPE_SECRET` gate | **Cloudflare Worker** `cpl-proxy.slee-548.workers.dev/scrape` → `live_metrics.json` | daily (live) | **6 headline KPIs**, college **tiers** (Leading/Advancing/Inactive), raw population breakdowns |
| **S2** | **MAP Custom Reporting Module** | UI: `customreportingmodule.azurewebsites.net` · API: `mapwebapinew.azurewebsites.net/api/CustomReport/getReport` | open POST (no key today) | **`fetch_custom_report.py`** → `CustomReport_latest.json` (**9 datasets, ~91 MB**) | daily (live) | **CPL Analytics** (exhibits, articulations, credit distribution), **college activity**, EACR / Exhibit Adoption |
| **S3** | **Supabase** (`hvuwhnbuahrtptokpqfh`) | Postgres + PostgREST | service-role key (`SUPABASE_SERVICE_KEY`) for reads; magic-link for in-tab edits | `kb/_load_*.py` REST reads + the step-3 curation sync | daily (live) | **Project cards, Budget, Workplan Goals + Activities, Personnel, curation overlays** |
| **S4** | **`kb/dashboard_config.json`** | committed in-repo (since **P2**, 2026-06-01) | n/a (git) | direct file read (`load_dashboard_config()`) | on edit + commit | dashboard **title / description / attachments URL**, config overrides, KPI-parameter overrides |
| **S5** | **Knowledge Base JSONs** | `kb/coci_*.json`, `kb/unified_titles.json`, `kb/credentials.json`, … (committed) | n/a (git) | direct file reads | rebuilt on demand (one-shot generators), curated via Supabase overlay | **Common Course Reference (CCR)**, **Common Exhibit Reference (CER)**, the articulation crosswalk |
| **S6** | **`kb/reference/coci_course_list.xlsx`** | committed in-repo (~24 MB, 141,738 rows) | n/a (git) | streamed read (openpyxl read-only) | refreshed when a new COCI extract lands | CCR member-college rows + course descriptions |
| **S7** | **`kpi_history.json`** | committed in-repo | n/a (git) | append-one-snapshot-per-day (idempotent) | daily | KPI **trend sparklines + 1d/7d/30d deltas** |

> **Note on the two URLs you gave me:** S1 is `cpldashboardcccco…/insights/dashboard`
> (we hit its REST API, not the page). S2's UI is `customreportingmodule…`, but
> the daily job calls its **backend API directly** (`mapwebapinew…/getReport`) —
> no browser. See §5 for the report inventory + the screenshot gap.

---

## 2. The daily refresh workflow (`.github/workflows/daily-dashboard.yml`)

Runs on **two crons** — `17 10 * * *` (primary) + `17 14 * * *` (backstop, since
GitHub's scheduler drops/delays runs) — plus manual `workflow_dispatch`. The job
is idempotent (concurrency group `daily-dashboard`; same-day `kpi_history`
overwrite; "no staged diff → no commit").

| Step | What it does | Source → artifact |
|---|---|---|
| 1 | **Fetch CustomReport** (`fetch_custom_report.py --output CustomReport_latest.json`) | **S2** → `CustomReport_latest.json` |
| 2 | **Scrape live metrics** (curl the worker `/scrape`) | **S1** → `live_metrics.json` |
| 3 | **Sync curation overlays** from Supabase (`kb/_apply_curation.py` + canonical-SUBJ4 + credential-review) — guarded on `SUPABASE_SERVICE_KEY` | **S3** → `kb/coci_curation.json`, `kb/discipline_canonical_subj4.json`, `kb/credential_review_overlay.json` |
| 4 | **Run the pipeline** (`excel_to_dashboard.py`) — merges S1–S7 → renders | all sources → `CPL_Dashboard.html`, `CPL_Data.js`, `kpi_history.json`, the `unified_courses_*.js` family, `credential_reference_data.js`, `statewide_data.js`, `exports/*.xlsx` |
| 4b | **Row Trust-Card auditor** (`kb/_row_audit.py`) — read-only | S5 → `kb/row_audit/{latest.json,<date>.md}` |
| 4c | **Credential rename dry-run** (`kb/_cred_rename_dryrun.py`) — read-only | overlay → `kb/cred_rename_dryrun/*` |
| 5 | **Mirror** `cp CPL_Dashboard.html index.html` (Rule 4) | → `index.html` |
| 6 | **Commit + push** to `main` (rebase-retry loop) | the committed daily dataset (§6) |

---

## 3. The headline KPIs — exact lineage (S1)

`live_metrics.json` (written by the worker) carries the **6 headline KPIs** the
top of the dashboard shows, plus the tier counts and the raw breakdowns
`merge_live_metrics()` folds in. Today's snapshot:

| Headline KPI | `live_metrics` title | KPI key (`title_map`) | Today's value |
|---|---|---|---|
| Students Served | `STUDENTS SERVED` | `cumulative_students` | 46,126 |
| Eligible Units | `ELIGIBLE UNITS` | `eligible_units` | 205k |
| Transcribed Units | `TRANSCRIBED UNITS` | `transcripted_units` | 96k |
| Estimated Savings | `SAVINGS` | `estimated_savings` | $293M |
| 20-Year Impact | `20-YEAR IMPACT` | `twenty_year_impact` | $1.17B |
| Active Colleges | `ACTIVE COLLEGES` | `active_colleges` | 98 |

Plus `raw`: `Students, Units, TranscribedUnits, Savings, YearImpact,
MilitaryStudents, NonMilitaryStudents, AprenticeStudents, AverageUnits,
TranscribedAverage` — and `tiers` / `college_count` / `active_college_count` /
`star_college_count` for the **3-of-5 college tier model** (CLAUDE.md §4). If the
scrape fails, the pipeline keeps the prior `live_metrics.json` (graceful
degradation) and the headline values fall back to the relevant project's KPI
metric.

---

## 4. The CPL Analytics + project data — exact lineage (S2 + S3)

| Dashboard surface | Source | Specifics |
|---|---|---|
| **CPL Analytics** cards (exhibit-by-college / -discipline / -CPL-type / -MoL / collaborative / top-50) | **S2** `View_ArticulatedMAPExhibits` | grouped + exported to `exports/*.xlsx` |
| **Exhibit Adoption & Credit Recs (EACR)** | **S2** `View_ArticulatedMAPExhibits` + **S5** unified-title layer | `statewide_data.js` / `statewide_interactive.js` |
| **Articulations by Unified Course** | **S5** `kb/coci_articulations.json` | grouped by C-ID/CCN/M-ID identity |
| **College Activity** report | **S2** `View_ArticulatedCollegeCourses` (+ `StudentAggregatedValues` for JST/Military) | `college_activity.js` |
| **Credit distribution** analytics | **S2** `View_CreditDistributionByCollege` | per-college credit breakdown |
| **Adopter matching** (who could adopt an exhibit) | **S2** `View_ProgramsofStudy` | TOP-code match |
| **Project cards** (34) | **S3** `projects` | via `kb/_load_projects.py`; snapshot fallback `kb/projects_snapshot.json` |
| **Budget** (5-Year Funding + Expenditure + Personnel) | **S3** `budget_funding`, `budget_expenditures`, `personnel` | via `kb/_load_budget.py`; snapshot `kb/budget_snapshot.json` |
| **Workplan Goals + Activities** | **S3** `workplan_goals`, `workplan_activity_associations` | via `kb/_load_workplan_goals.py`; snapshot `kb/workplan_goals_snapshot.json` |
| **Curation overlays** (CCR/CSR/CER edits) | **S3** `kb_curation` (+ `allowed_reviewers` for auth) | synced to `kb/coci_curation.json` etc. (step 3) |
| **Common Course / Exhibit Reference** identity rows | **S5** `kb/coci_*.json`, `unified_titles.json`, `credentials.json` | + **S6** raw member rows / descriptions |
| **KPI trend card** (1d/7d/30d deltas) | **S7** `kpi_history.json` | one snapshot/day |

---

## 5. The CustomReport report inventory (S2) — pulled vs consumed

`fetch_custom_report.py` requests **9 datasets**. The daily pipeline
(`read_exhibit_metrics()` + `college_activity.js`) **consumes 7**; two are
**fetched but not yet used** by the dashboard (they're archived in
`CustomReport_latest.json` for other/future use):

| # | Dataset (`viewName`) | Pulled | Consumed daily? | Feeds |
|---|---|:--:|:--:|---|
| 1 | `View_ArticulatedMAPExhibits` | ✅ | ✅ | Exhibit analysis / EACR / CPL Analytics |
| 2 | `View_ArticulatedCollegeCourses` | ✅ | ✅ | Course-level articulation detail, college activity |
| 3 | `View_CollegeCourses` | ✅ | ✅ | College course catalog |
| 4 | `View_CreditDistributionByCollege` | ✅ | ✅ | Per-college credit breakdown |
| 5 | `View_PointInTime_StudentAggregatedValues` | ✅ | ✅ | Student aggregates by year/type |
| 6 | `View_ProgramsofStudy` | ✅ | ✅ | Programs of study (adopter matching) |
| 7 | `View_StudentAggregatedValues` | ✅ | ✅ | Student-level credit data (JST/Military) |
| 8 | `View_CollegeContacts` | ✅ | ⬜ **fetch-only** | (contacts roster — archived, unused) |
| 9 | `View_CollegeUsersRoles` | ✅ | ⬜ **fetch-only** | (users/roles — archived, unused) |

> **⚠ Gap to close — the "all available reports" screenshot.** This table is the
> **9 we pull**. The Custom Reporting Module UI almost certainly offers **more
> views than these 9**. To make the inventory complete ("everything available vs.
> what we use"), drop the screenshot (or the report list) into this section and
> I'll add the available-but-not-pulled rows + flag any worth wiring in.

---

## 6. The committed "daily dataset" — what gets pushed each run

The step-6 `git add` list **is** the daily dataset. To audit "what changed
today," `git show` the daily commit (`Daily dashboard update — YYYY-MM-DD`).

| Artifact | Source(s) | What it is |
|---|---|---|
| `CPL_Dashboard.html` / `index.html` | all | the rendered dashboard (kept identical, Rule 4) |
| `CPL_Data.js` | S2/S3/S4/S7 | project + KPI data for client filters/search |
| `live_metrics.json` | **S1** | the 6 headline KPIs + tiers + raw (today's scrape) |
| `kpi_history.json` | **S7** | daily KPI snapshots (no date gaps — Rule 3) |
| `statewide_data.js` | S2/S5 | EACR / statewide adoption |
| `college_activity.js` + `_template.html` | S2 | per-college activity report |
| `unified_courses_*.js` (data, index, details, standalone, members, member_desc, suggestions) | S5/S6 | CCR dataset + lazy files |
| `credential_reference_data.js` | S5 | CER dataset |
| `exports/unified_courses.xlsx` (+ analytics `exports/*.xlsx`) | S5/S2 | downloadable exports |
| `kb/coci_curation.json` | **S3** | curation overlay (synced from Supabase) |
| `kb/discipline_canonical_subj4.json`, `kb/credential_review_overlay.json` | **S3** | CSR / CER curator overlays |
| `kb/row_audit/{latest.json,<date>.md}` | S5 | Trust-Card auditor output |
| `kb/cred_rename_dryrun/*` | overlay | credential-rename Mode-B preview |
| `kb/{projects,budget,workplan_goals}_snapshot.json` | **S3** | daily Supabase snapshots (outage fallback) |
| `CustomReport_latest.json` | **S2** | the 9-dataset raw pull (~91 MB; added only if freshly fetched) |

---

## 7. How to view / inspect the daily dataset

```bash
# What did today's refresh change?
git show "$(git log --grep='Daily dashboard update' -1 --format=%H)" --stat

# Headline KPIs as scraped today (S1)
python3 -c "import json;d=json.load(open('live_metrics.json'));print(d['scraped_at']);[print(m['title'],'=',m['value']) for m in d['metrics']]"

# Trend history (S7) — confirm no date gaps (Rule 3)
python3 -c "import json;h=json.load(open('kpi_history.json'));print(len(h),'snapshots',h[0]['date'],'→',h[-1]['date'])"

# Which CustomReport datasets came back + row counts (S2)
python3 -c "import json;[print(d['viewName'],d.get('dataCount')) for d in json.load(open('CustomReport_latest.json'))]"

# Dashboard config now sourced from JSON (S4)
cat kb/dashboard_config.json
```

The **GitHub Actions run summary** also prints a per-run `CustomReport` /
`Live metrics` status table (`success` vs `fallback`).

---

## 8. Gaps + open items

1. **Available-reports inventory incomplete** — §5 lists the 9 we pull; the
   Custom Reporting Module screenshot would let me enumerate the full menu +
   flag available-but-unused views. *(Need the screenshot.)*
2. **2 datasets fetched-but-unused** — `View_CollegeContacts` +
   `View_CollegeUsersRoles` are pulled into the 91 MB blob but nothing consumes
   them. Either wire them into a surface or drop them from `REQUEST_PAYLOAD` to
   shrink the pull.
3. **No keys on the two MAP endpoints** — S1 is gated by the worker's
   `SCRAPE_SECRET`; S2's `getReport` is an open POST. Worth confirming that's
   intended.
4. **"View the daily dataset" as a dashboard surface** — this doc is the
   **accounting**. If you want it *visible in the app* too, a small read-only
   **"Data Pipeline" tab** (this §1 source table + §6 artifact list + the live
   `scraped_at` / `dataCount` / `kpi_history` counts) is a clean follow-on —
   flagged for your call.
