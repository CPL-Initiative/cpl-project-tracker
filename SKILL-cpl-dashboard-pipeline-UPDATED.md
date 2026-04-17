---
name: cpl-dashboard-pipeline
description: >
  Technical knowledge and operational procedures for the CPL Initiative Dashboard pipeline — the automated system that scrapes live KPI data from the CCCCO MAP CPL Dashboard, processes it through a Python pipeline with Excel project data, and publishes to GitHub Pages. Use this skill whenever working on the dashboard scraper, Cloudflare Worker proxy, live_metrics.json, excel_to_dashboard.py pipeline, daily scheduled task, KPI card rendering, college tier classification, GitHub Pages deployment, or any debugging of the CPL Project Tracker data flow. Also trigger when the user mentions dashboard not updating, stale data, scrape errors, tier criteria, Active Colleges KPI, or the cpl-proxy worker. This skill is the single source of truth for how every piece of the pipeline connects.
---

# CPL Dashboard Pipeline — Technical Reference

This skill documents the complete data pipeline that powers the CPL Initiative Project Tracker dashboard, from live data scraping through HTML generation to GitHub Pages publishing.

---

## 1. Architecture Overview

```
CCCCO MAP CPL Dashboard (Azure)
        │
        ▼  /api/potential-savings (JSON)
Cloudflare Worker (cpl-proxy.slee-548.workers.dev)
        │
        ▼  GET /scrape?secret=...
live_metrics.json (saved locally)
        │
        ├── CPL_Initiative_Project_List_v3.xlsx (project data, budget, workplan)
        ▼
excel_to_dashboard.py (Python pipeline)
        │
        ├── CPL_Dashboard.html (rendered with KPI cards, project cards, charts)
        ├── CPL_Data.js (JSON data for filters/search)
        └── reports/ (Word doc reports)
              │
              ▼  copy to cpl-project-tracker repo
GitHub Pages (cpl-initiative.github.io/cpl-project-tracker/)
```

### Key Principle
The Cloudflare Worker calls the CCCCO Dashboard's REST API directly — no browser automation or Chrome extension needed. This was a deliberate design decision after Chrome-based scraping proved unreliable across sessions.

---

## 2. File Inventory

All source files live in: `CPL Projects/CPL Project Tracker/`

| File | Purpose |
|------|---------|
| `cloudflare-worker-proxy.js` | Dual-purpose Cloudflare Worker: POST / for Claude API proxy (Custom Reports), GET /scrape for KPI scraping |
| `excel_to_dashboard.py` | Main pipeline script — reads Excel + live_metrics.json → generates HTML, JS, Word reports |
| `CPL_Initiative_Project_List_v3.xlsx` | Master project data: projects, budget, personnel, workplan goals |
| `live_metrics.json` | Latest scraped KPI data from CCCCO Dashboard |
| `CPL_Dashboard.html` | The dashboard HTML template (pipeline replaces KPI cards, project cards, data sections) |
| `CPL_Data.js` | Exported project data for client-side filtering |
| `dashboard_filters.js` | Client-side filter/search/sort logic |
| `report_generator.js` | Custom Report Generator (Claude API via proxy) |
| `docx.min.js` | Local copy of docx@8.0.4 UMD build for report generation |
| `supabase_data_loader.html` | HTML loader for Supabase DB (separate from live metrics) |

GitHub repo folder: `cpl-project-tracker/`
- `CPL_Dashboard.html` → renamed to `index.html` when copied to repo
- Published at: `https://cpl-initiative.github.io/cpl-project-tracker/`

---

## 3. Cloudflare Worker (cpl-proxy)

**URL**: `https://cpl-proxy.slee-548.workers.dev`

### Environment Variables (encrypted in Cloudflare dashboard)
- `ANTHROPIC_API_KEY` — for Claude API proxy (Custom Reports)
- `SCRAPE_SECRET` — shared secret for scrape endpoint (currently `CPL_SCRAPE_2026`)

### Endpoints

**POST /** — Claude API Proxy
- Forwards requests to `https://api.anthropic.com/v1/messages`
- Used by `report_generator.js` for Custom Report generation
- CORS restricted to `cpl-initiative.github.io`, `localhost`, `127.0.0.1`

**GET /scrape?secret=SCRAPE_SECRET** — KPI Scraper
- Calls: `https://cpldashboardcccco.azurewebsites.net/api/potential-savings?cpltype=0&indExcludeSA=0`
- Returns JSON with 6 KPI metrics + college tier classification
- The API returns ~117 rows: a Count row (Sorder=-1), an ALL COLLEGES aggregate (Sorder=1), and ~115 individual colleges (Sorder=2)

### Data Source: CCCCO CPL Dashboard API

The CCCCO CPL Dashboard is a Next.js application. Its server-rendered HTML is just a shell — all data loads via API routes. The key endpoint:

```
GET /api/potential-savings?cpltype=0&indExcludeSA=0
```

Returns per-college JSON with these fields:
- `Sorder` (row type: -1=Count, 1=ALL COLLEGES, 2=individual)
- `College`, `CollegeID`
- `Students`, `Units`, `TranscribedUnits`
- `Savings`, `YearImpact`, `Combined` (=Savings+YearImpact)
- `AverageUnits`, `TranscribedAverage`
- `MilitaryStudents`, `NonMilitaryStudents`, `AprenticeStudents` (note: typo in API)
- `MilitaryCredits`, `NonMilitaryCredits`, `ApprenticeshipCredits`
- `TranscribedMilitaryUnits`, `TranscribedNonMilitaryUnits`, `TranscribedApprenticeshipUnits`
- `StarCollegeCount`, `EnrolledMilitaryStudents`, `VeteransWithJSTs`, `EnrolledToJSTRatio`

### 6 KPI Metrics Output

1. **STUDENTS SERVED** — total with Military/Workforce/Apprentice breakdowns
2. **ELIGIBLE UNITS** — total with avg per student, Military/Workforce/Apprentice breakdowns
3. **TRANSCRIBED UNITS** — total with avg per student, Military/Workforce/Apprentice breakdowns
4. **SAVINGS** — dollar value, breakdowns proportional to credit ratios
5. **20-YEAR IMPACT** — dollar value, breakdowns proportional to credit ratios
6. **ACTIVE COLLEGES** — count with Leading/Advancing/Inactive tier breakdowns + criteria footnote

### 3-Tier College Classification

Colleges are classified using a **"3 of 5" criteria model** that balances volume and effectiveness, allowing small colleges with strong implementation to reach Leading status:

| # | Criterion | Threshold | What It Rewards |
|---|-----------|-----------|-----------------|
| 1 | Student Volume | Students ≥ 500 | Scale of program |
| 2 | Articulation Depth | Eligible Units ≥ 3,000 | Breadth of credit recommendations |
| 3 | Avg Eligible Units/Student | AverageUnits ≥ 5 | Per-student benefit depth |
| 4 | Transcription Rate | TranscribedUnits/Units ≥ 25% | Back-end follow-through in MAP |
| 5 | Avg Transcribed Units/Student | TranscribedAverage ≥ 3 | Verified per-student benefit |

**Tier assignments:**
- **Leading**: Meets at least 3 of 5 criteria
- **Advancing**: Not Leading and not Inactive (active, building capacity)
- **Inactive**: Students < 10 AND Units = 0

**Design rationale:**
- Transcription Rate reflects the MAP "Transcribe" checkbox — a manual step colleges are being encouraged to adopt. Under-reported today, but included to incentivize adoption.
- Eligible Units per Student indicates how well a college has articulated CPL credit recommendations on the front end.
- The 3-of-5 model means a small college like Palo Verde (14 students) can reach Leading through effectiveness metrics alone (high avg units + high transcription rate + high avg transcribed), while a large college like Chaffey (2,300+ students) stays Advancing if it only has volume without depth.

**As of April 2026**: 13 Leading, 82 Advancing, 20 Inactive (95 active total, 115 total colleges).

---

## 4. Python Pipeline (excel_to_dashboard.py)

### What It Does
1. Reads `CPL_Initiative_Project_List_v3.xlsx` (projects, budget, workplan goals, update log)
2. Reads `live_metrics.json` (scraped KPI data)
3. Merges live metrics into headline KPIs (replaces static values with live ones, adds LIVE badges)
4. Generates the full dashboard HTML:
   - KPI Summary Cards (with breakdowns, notes, footnotes)
   - Activity KPI Cards (per workplan sub-activity)
   - Project Cards (grouped by workplan goal)
   - Workplan Progress Chart
   - Budget section
   - Vision 2030 section
5. Exports `CPL_Data.js` for client-side filtering
6. Generates Word reports (master + per-project)

### Live Metrics Merge
The `merge_live_metrics()` function maps scraped metric titles to KPI keys:

```python
title_map = {
    "STUDENTS SERVED": "cumulative_students",
    "ELIGIBLE UNITS": "eligible_units",
    "TRANSCRIBED UNITS": "transcripted_units",
    "SAVINGS": "estimated_savings",
    "20-YEAR IMPACT": "twenty_year_impact",
    "ACTIVE COLLEGES": "active_colleges",
}
```

It preserves `note` fields on breakdowns (rendered as parenthetical descriptions) and `footnote` arrays (rendered as small text at bottom of KPI card).

### Running the Pipeline
```bash
cd "CPL Projects/CPL Project Tracker"
python3 excel_to_dashboard.py
```

Output confirms: merged live metrics, rendered KPI cards, rendered project cards, exported data, generated reports.

---

## 5. Dashboard Deployment (GitHub Pages)

### Repository
- GitHub org: `cpl-initiative`
- Repo: `cpl-project-tracker`
- URL: `https://cpl-initiative.github.io/cpl-project-tracker/`
- Local clone: `cpl-project-tracker/` folder

### File Copy (Source → Repo)
| Source (CPL Project Tracker/) | Destination (cpl-project-tracker/) |
|---|---|
| CPL_Dashboard.html | **index.html** (renamed!) |
| CPL_Data.js | CPL_Data.js |
| live_metrics.json | live_metrics.json |
| dashboard_filters.js | dashboard_filters.js |
| report_generator.js | report_generator.js |
| docx.min.js | docx.min.js |
| cloudflare-worker-proxy.js | cloudflare-worker-proxy.js |

### Push Process
The user pushes via **GitHub Desktop** (git is not on PATH in their terminal). Steps:
1. Open GitHub Desktop
2. It detects changed files in the cpl-project-tracker repo
3. Write a commit message and commit
4. Click Push

### Known Issues
- **git index.lock**: Windows can leave stale `.git/index.lock` files. Delete via File Explorer (show hidden files). Cannot be deleted from Cowork sandbox (Operation not permitted).
- **PowerShell**: `&&` doesn't work as a command separator. Use `;` or run commands separately.
- **CMD**: `git` may not be on PATH. Use GitHub Desktop instead.

---

## 6. Scheduled Daily Task

A Cowork scheduled task named `cpl-dashboard-scraper` runs daily at 7:06 AM.

### Task Steps
1. Scrape live metrics via the Cloudflare Worker (`GET /scrape?secret=CPL_SCRAPE_2026`)
2. Save response to `live_metrics.json`
3. Run the Python pipeline (`python3 excel_to_dashboard.py`)
4. Copy updated files to the GitHub repo folder (with CPL_Dashboard.html → index.html rename)
5. Git commit and push to GitHub
6. Create attachment subfolders for any new projects

### Important
The scheduled task MUST include the git commit + push step, otherwise the dashboard won't update on GitHub Pages even though the local files are regenerated.

---

## 7. Supabase Database (Separate System)

The dashboard also has a Supabase backend for persistent storage:
- **Project**: `hvuwhnbuahrtptokpqfh.supabase.co`
- **Tables**: projects, budget_expenditures, personnel, workplan_goals
- **Loader**: `supabase_data_loader.html` — HTML interface for pushing data to Supabase
- This is separate from the live metrics scraping pipeline and handles project-level data storage.

---

## 8. Custom Report Generator

The dashboard includes a Claude-powered report generator:
- **UI**: Modal with audience picker, metric checkboxes, format selection
- **Backend**: Sends requests to the Cloudflare Worker POST endpoint, which proxies to Anthropic's API
- **Model**: `claude-sonnet-4-5-20250929`
- **Output**: Can generate in-browser preview or downloadable .docx (using local docx.min.js)
- **Config**: `window.CPL_REPORT_PROXY_URL` set in HTML before `report_generator.js` loads

---

## 9. Troubleshooting

### Dashboard not updating
1. Check if scheduled task ran (Cowork → scheduled tasks)
2. Check if `live_metrics.json` has a recent `scraped_at` date
3. Check if files were copied to the GitHub repo folder
4. Check if git push happened (most common failure point)
5. If index.lock exists, delete it via File Explorer

### Scrape returning errors
1. Test directly: `https://cpl-proxy.slee-548.workers.dev/scrape?secret=CPL_SCRAPE_2026`
2. If "Invalid or missing secret" → check SCRAPE_SECRET in Cloudflare dashboard
3. If "CPL API returned 502" → CCCCO Dashboard may be down
4. If "ALL COLLEGES row not found" → API response structure may have changed

### KPI values stale but date updated
- The pipeline updates the "Updated" date but only refreshes KPIs if `live_metrics.json` has newer data
- Check `live_metrics.json` → `scraped_at` timestamp
- If old, the scrape step failed — test the worker endpoint directly

### Custom Report button not showing
- Verify `id="filterButtons"` exists on the filter buttons div in the HTML
- Verify `report_generator.js` script tag is present after `dashboard_filters.js`
- Verify `window.CPL_REPORT_PROXY_URL` is set before the script loads

### docx library errors
- The docx library is hosted locally as `docx.min.js` (v8.0.4 UMD build, 334KB)
- CDN versions were unreliable — do not switch back to CDN
- If the file is missing, get it via: `npm pack docx@8.0.4`, extract, copy `umd/docx.min.js`
