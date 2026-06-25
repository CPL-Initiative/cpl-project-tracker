---
title: College CPL landing-page link sync — lessons
date: 2026-06-25
tags: [chatbox, cpl-assistant, supabase, api, scraping, runner-as-proxy]
artifacts:
  - chatbox/scrape_landing_pages.py
  - .github/workflows/cpl-landing-pages.yml
  - chatbox/college_landing_pages.json
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/playbook-runner-as-external-api-proxy]]"
  - "[[docs/cpl_assistant_lessons]]"
---

# College CPL landing-page link sync

## The problem (Session 73, 2026-06-25)

Sam reported the **CPL Assistant** handing out broken college landing-page
links — "a few redirect attempts and a final error." Example: San Diego Miramar
showed `…/SDMC`, but the real code is `SDMIRA`. The links come from
**`chatbox_college_profiles.landing_page_url`**, which the `cpl-chat` Edge
Function joins on the college name and renders. The stored codes had drifted.

## The source-of-truth chase (three layers, two wrong)

The map.rccd.edu/cpllandingpages/ page is deceptively layered. Getting this right
took three tries:

1. **Inline `mapfyCollegeUrls` blob (WRONG — stale).** The static HTML embeds a
   JSON blob `{College, CollegeLandingURL}` — but it's a **2025-08-18 fallback**
   with wrong/placeholder codes (Allan Hancock=`/test`, Los Medanos=`/LOSC`).
   The first build scraped this and applied ~40 changes — several of which were
   **regressions** (e.g. it broke Long Beach `LBCC`→`LONC`). Lesson: a JSON blob
   with an `"updated"` field that's months old is a **fallback**, not the source.

2. **JS-rendered buttons (RIGHT, but heavy).** The page's script fetches fresh
   data and renders `<a class="mapfy-linkbtn" href="https://cpldashboardcccco.
   azurewebsites.net/<code>" aria-label="Open <College> CPL page…">` buttons.
   Rendering with headless Chromium and reading the buttons (href + aria-label)
   gave the **true** links for all 116 — Allan Hancock=`/allan`,
   Los Medanos=`/losmedanos`. This works but needs a browser.

3. **The underlying API (RIGHT + clean).** Sam found the API the page's script
   actually calls:
   `POST https://map-collegelanding-pages-….azurewebsites.net/api/mapcollegelanding/GetData`
   with body `{}` (no auth) → the full `{College, CollegeLandingURL}` list (120
   records — *more* than the 116 rendered buttons). It returns the **fresh**
   codes; the page rewrites the base `map.rccd.edu/cpl-student-portal/<code>` →
   `cpldashboardcccco.azurewebsites.net/<code>`. A plain JSON POST — **no
   browser, no WAF**. This is the final source.

**How to tell layer 1 from layer 3:** they share a shape, but layer 1 is a
static `"updated":"2025-08-18"` blob in the HTML, layer 3 is a live POST. When a
page embeds *both* a static list and fetches one at runtime, the runtime one
wins — scrape that (or its API), never the inline copy.

## What we store, and why

The official `cpldashboardcccco.azurewebsites.net/<code>` link (path-encoded, so
El Camino's raw `EL C` → `EL%20C`). That's exactly what the page's buttons use
and what Sam confirmed works. Mirroring the page is self-correcting: the weekly
sync re-reads the API, so if MAP changes a code or host it follows within a week.
(An earlier detour stored the `map.rccd.edu/cpl-student-portal` form — but the
page doesn't use that host; its JS rewrites it away. Don't store an intermediate
the page itself discards.)

## Egress + the runner

The agent sandbox is egress-blocked from **both** `map.rccd.edu` (also behind an
intermittent Sucuri WAF) **and** the Azure API host. So the sync runs on a GitHub
Actions runner (runner-as-proxy). With the API, the runner step is a trivial
`POST` — the Chromium/WAF machinery from the render era is gone.

## The routine

`chatbox/scrape_landing_pages.py` + `.github/workflows/cpl-landing-pages.yml`:
**push** → dry-run (commit `chatbox/college_landing_pages.json` receipt, no
write); **weekly cron + dispatch** → `--apply` (PATCH existing rows + INSERT
colleges new to the table, via the service key). Guards: never applies off a
truncated response (`MIN_RECORDS`); skips placeholder slugs (`/test`); flags
page-side data errors (Cerritos=`www.cerritos.edu`, East LA=`elac.edu` — bad data
on MAP's side, mirrored + reported, not invented).

**⚠ INTERIM.** Sam is adding these URLs to the **MAP Custom Report** so the daily
dashboard cron can publish them with no separate call ("ever-fresh, no scraping").
When that lands: retire this scraper + workflow and source `landing_page_url`
from the Custom Report (`fetch_custom_report.py` → a small builder).

## How it shipped

122 → 128 rows. All 116 page colleges mirror their official `cpldashboardcccco`
link; the 6 colleges that had landing pages but no chatbox row (Los Medanos,
Mendocino, MiraCosta, Mission, North Orange Continuing Ed, Sacramento City) were
added as landing-page-only rows (`cpl-chat` surfaces them by name even with 0
exhibits); the API also added Futuro Health + Launch Apprenticeship. The
`cpl-chat` widget reads `landing_page_url` live, so every fix took effect with no
redeploy.
