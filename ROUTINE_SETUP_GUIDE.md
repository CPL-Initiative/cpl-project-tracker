# CPL Dashboard Pipeline — Cloud Routine Setup Guide

This guide walks you through migrating the daily CPL Dashboard pipeline from a local Cowork scheduled task to a Claude Code Routine that runs on Anthropic's cloud infrastructure.

**Result:** The dashboard updates daily at 6:00 AM Pacific, even when your laptop is off.

---

## What You'll Set Up

1. A Claude Code Routine at claude.ai/code/routines
2. The `cpl-project-tracker` GitHub repo as the Routine's workspace
3. A cloud environment with Python dependencies
4. A daily schedule trigger

---

## Step 1: Go to claude.ai/code/routines

Open your browser and navigate to: **https://claude.ai/code/routines**

Click **New routine**.

---

## Step 2: Configure the Routine

### Name
```
CPL Dashboard Daily Update
```

### Model
Select **Claude Sonnet** (faster, cheaper — this is a scripted pipeline, not a creative task).

### Prompt
Copy and paste this entire prompt:

```
Daily CPL Dashboard Pipeline — fetch fresh data, regenerate dashboard, and deploy to GitHub Pages.

## Step 1: Fetch CustomReport JSON from API

Run the fetch script that's already in the repo:

    python fetch_custom_report.py --output CustomReport_latest.json

This calls the MAP Custom Report Builder API directly and saves ~91MB of JSON with 9 datasets. If it fails (API down, timeout), log the error and continue — the pipeline will use the last committed CustomReport file.

## Step 2: Scrape live metrics from Cloudflare Worker

Use curl to fetch live KPI data:

    curl -s "https://cpl-proxy.slee-548.workers.dev/scrape?secret=CPL_SCRAPE_2026" -o live_metrics.json

Verify the JSON is valid and contains scraped_at, metrics, and raw fields. If the scrape fails, log the error and continue with the existing live_metrics.json.

## Step 3: Run the Python pipeline

    python excel_to_dashboard.py

This reads the Excel project data, live_metrics.json, and the newest CustomReport JSON, then generates:
- CPL_Dashboard.html (the full dashboard)
- CPL_Data.js (project data for filters)
- statewide_data.js (exhibit data for the interactive card)
- kpi_history.json (appends today's metrics)
- Word reports in reports/

Verify it completes without errors.

## Step 4: Prepare files for GitHub Pages

Copy the dashboard HTML to index.html (GitHub Pages entry point). IMPORTANT: lowercase "index.html" — Linux is case-sensitive and GitHub Pages expects lowercase.

    cp CPL_Dashboard.html index.html

## Step 5: Commit and push

Stage all changed files and commit:

    git add index.html CPL_Dashboard.html CPL_Data.js live_metrics.json kpi_history.json CustomReport_latest.json statewide_data.js statewide_interactive.js dashboard_filters.js report_generator.js college_lookup.js docx.min.js cloudflare-worker-proxy.js excel_to_dashboard.py fetch_custom_report.py
    git commit -m "Daily dashboard update — $(date +%Y-%m-%d)"
    git push origin main

## Step 6: Verify

After pushing, the dashboard should be live at:
https://cpl-initiative.github.io/cpl-project-tracker/

Check that the page loads and KPI cards show today's date.

## Error Handling

- If Step 1 fails: Continue with existing CustomReport JSON in the repo
- If Step 2 fails: Continue with existing live_metrics.json
- If Step 3 fails: STOP and report the error — do not commit broken files
- If Step 5 fails: Report the git error

## Output

At the end, provide a brief summary:
- CustomReport: [success/fallback] — X datasets, Y total rows
- Live metrics: [success/fallback] — students, colleges, savings
- Pipeline: [success/error]
- Deploy: [pushed/failed]
- Dashboard URL: https://cpl-initiative.github.io/cpl-project-tracker/
```

### Repository
Select: **CPL-Initiative/cpl-project-tracker**
- Enable **Allow unrestricted branch pushes** (so it can push to main)

### Environment
Click **Create new environment** or select an existing one, then configure:

**Setup script:**
```bash
pip install openpyxl
```

**Environment variables:** (none needed — the Cloudflare Worker secret is in the prompt)

**Network access:** Limited — see "Known Limitation: Network Allowlist" below. The Routine cannot reach custom API hosts. Steps 1 and 2 will use fallback data already committed in the repo.

### Trigger
Select: **Schedule → Daily**
Set time to: **6:00 AM** (your local Pacific time)

### Connectors
Remove all connectors (not needed for this pipeline — it uses direct API calls).

---

## Step 3: Save and Test

1. Click **Create**
2. On the routine detail page, click **Run now** to test immediately
3. Watch the session live to verify each step completes
4. Check https://cpl-initiative.github.io/cpl-project-tracker/ after the run

---

## Known Limitation: Network Allowlist (as of 2026-04-16)

Claude Code Routines (research preview) restrict outbound network access to a
platform-managed allowlist. There is no UI setting to add custom hosts. As a result,
the Routine **cannot** reach:

- `mapwebapinew.azurewebsites.net` (MAP Custom Report Builder API)
- `cpl-proxy.slee-548.workers.dev` (Cloudflare Worker live metrics scraper)

Both calls fail with "Host not in allowlist." The pipeline handles this gracefully —
Steps 1 and 2 fall back to whatever `CustomReport_latest.json` and `live_metrics.json`
are already committed in the repo. The Routine still regenerates the dashboard HTML,
commits, pushes, and deploys to GitHub Pages using that committed data.

### Workaround: Cowork Data Refresh

Since Cowork's Chrome browser **can** reach both APIs, you can periodically refresh
the data files from a Cowork session and push them to the repo. The next Routine run
will then pick up the fresh data as its "fallback."

**Manual refresh steps (from Cowork):**

1. Ask Claude to fetch fresh data:
   - `CustomReport_latest.json` from the MAP API (via `fetch_custom_report.py` or Chrome)
   - `live_metrics.json` from the Cloudflare Worker
2. Commit and push both files to the `cpl-project-tracker` repo via GitHub Desktop
3. The next Routine run at 6 AM uses the freshly committed files

**Future automation:** This refresh could become its own Cowork scheduled task that
runs before the Routine, or the Routine prompt could be updated if Anthropic adds
custom network allowlist support.

---

## Future Enhancement: SharePoint Integration

Once you create a SharePoint folder for the team's Excel file, you can add a connector
for Microsoft SharePoint/OneDrive so the Routine downloads the latest Excel before
each run. This replaces the local Excel file in the repo with a team-editable
SharePoint version.

Steps:
1. Create SharePoint folder: `CPL Project Tracker/`
2. Upload `CPL_Initiative_Project_List_v3.xlsx` to it
3. Add the Microsoft OneDrive/SharePoint connector to the Routine
4. Update the Routine prompt to download the Excel from SharePoint before Step 3

---

## Fallback: Local Cowork Pipeline

The original Cowork scheduled task (`cpl-dashboard-scraper`) has been **disabled** as of
2026-04-16. It had two inherent limitations: (1) the sandbox cannot push to GitHub
(no credentials), and (2) directory access approval doesn't persist across scheduled runs.

If the Routine is down, you can still run the pipeline manually from Cowork by asking
Claude to run the pipeline steps. The Chrome-based CustomReport fetch is also still
available for manual runs.

---

## Optional: Cowork Trigger Task

You can create a Cowork scheduled task that opens claude.ai/code/routines in Chrome
and clicks "Run now" — giving you a one-click way to trigger the Routine from Cowork
without navigating to the Routines page yourself.

See `COWORK_TRIGGER_TASK.md` in this folder for the full task prompt and setup instructions.
Create it from a **fresh Cowork session** (not from within a scheduled task session).

---

## Daily Run Limits (Max 20X Plan)

- 15 routine runs per day
- This pipeline uses 1 run per day
- Plenty of headroom for additional routines
