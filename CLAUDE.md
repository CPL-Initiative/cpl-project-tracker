# CPL Project Tracker — Claude Code Project Memory

This file is auto-loaded at the start of every Claude Code session in this
repo. Keep the **Critical Rules** section tight — move deep reference material
into the Pipeline Reference below or into dedicated docs.

---

## Critical Rules (do not violate)

1. **The daily GitHub Actions workflow regenerates the dashboard.**
   `.github/workflows/daily-dashboard.yml` runs at 14:00 UTC daily. It executes
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

`.github/workflows/daily-dashboard.yml` — runs at 14:00 UTC (6 AM PT) daily,
and on manual dispatch.

Steps:
1. Checkout `main`
2. Fetch CustomReport JSON (`fetch_custom_report.py`)
3. Scrape live metrics via Cloudflare Worker
4. Run `excel_to_dashboard.py`
5. `cp CPL_Dashboard.html index.html`
6. Commit + push to `main` (rebase-retry loop for concurrent pushes — see
   commit `679c5ef`)

Commits as `github-actions[bot]` with message `Daily dashboard update — YYYY-MM-DD`.

### 7. Custom Report Generator

- **UI**: Modal with audience picker, metric checkboxes, format selection
- **Backend**: POSTs to Cloudflare Worker → Anthropic API
- **Model**: `claude-sonnet-4-5-20250929`
- **Output**: in-browser preview or downloadable .docx (via local `docx.min.js`)
- **Config**: `window.CPL_REPORT_PROXY_URL` set in HTML before
  `report_generator.js` loads

### 8. Supabase Database (Separate System)

- **Project**: `hvuwhnbuahrtptokpqfh.supabase.co`
- **Tables**: projects, budget_expenditures, personnel, workplan_goals
- Separate from live metrics scraping; handles project-level data storage.

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
