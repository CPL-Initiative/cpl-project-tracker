---
title: College CPL landing-page link sync — lessons
date: 2026-06-25
tags: [chatbox, cpl-assistant, supabase, scraping, runner-as-proxy, waf]
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
links: clicking one gave "a few redirect attempts and a final error." Example:
San Diego Miramar showed `https://map.rccd.edu/cpl-student-portal/SDMC`, but the
official page's link was `.../SDMIRA`.

The links come from **`chatbox_college_profiles.landing_page_url`**, which the
`cpl-chat` Edge Function joins on the college name and renders in answers. The
stored codes had drifted from the authoritative source.

## What we learned

1. **The authoritative source is a JS blob, not anchors.** `map.rccd.edu/cpllandingpages/`
   is a WordPress page that embeds the canonical list as
   `let mapfyCollegeUrls = {"updated":"2025-08-18","colleges":[{College,
   CollegeLandingURL}]}` — ~116 entries. The college links are **not** `<a href>`
   anchors (the page had 121 `cpl-student-portal` refs but 0 in anchor hrefs), so
   anchor-scraping found nothing. Parse the blob directly (balanced-brace +
   `json.loads`). A couple of entries are placeholders (Allan Hancock → `/test`)
   — skip them so they never overwrite a real URL.

2. **The landing host moved; store the stable redirect link.** The official
   `cpl-student-portal/<CODE>` link 302-redirects to wherever the app currently
   lives. A redirect probe showed it now resolves to a **Vercel app**
   (`cpl-landing-pages-eight.vercel.app/<CODE>`) — `cpldashboardcccco.azurewebsites.net`
   (which Sam remembered) is the **old, stale** host. So we store the official
   `map.rccd.edu/cpl-student-portal/<CODE>` link: it's authoritative, and it
   survives backend moves (a Vercel preview domain is brittle). Sam chose this
   over storing the direct Vercel URL.

3. **map.rccd.edu is double-blocked.** The agent sandbox is egress-blocked from
   it (proxy 403), AND it sits behind an **intermittent Sucuri WAF** (`sgcaptcha`
   meta-refresh challenge). So: runner-as-proxy (a workflow scrapes on a runner),
   and the scraper **retries the plain fetch with a cookie jar** (a clearance
   cookie carries into the retry) + validates it got the *full* page (≥50
   `cpl-student-portal` refs) + falls back to headless Chromium. The WAF let the
   plain fetch through often enough that the cookie-jar retries are usually
   sufficient; Chromium is the last resort.

4. **Path-encode the stored URL.** One source code is literally `EL C` (El
   Camino, with a space) — a raw space breaks a markdown link. `urllib.parse.quote`
   the path → `EL%20C`. The cron must encode too, or it would revert the fix.

5. **Editing the Edge Function doesn't fix these links.** They're table data, not
   code — fixing them is a Supabase write, not a redeploy.

## The routine

`.github/workflows/cpl-landing-pages.yml`: **push** to `claude/**` → dry-run
(commit `chatbox/college_landing_pages.json` for review, no live write);
**weekly cron + `workflow_dispatch`** → `--apply` (PATCHes the table with the
`SUPABASE_SERVICE_KEY`). The committed JSON carries provenance + the
reconciliation report + the redirect probe (so the current backend host is
always recorded). **Long term**, Sam plans to add these links to the MAP Custom
Report so the daily dashboard cron pulls them — at which point this scrape
becomes the fallback.

## How it shipped

40 of 122 rows were corrected (e.g. SDMC→SDMIRA; Cerritos's bogus
`www.cerritos.edu`→`CCC`; several blank rows filled). Applied via a single
`UPDATE … FROM (VALUES …)` after reviewing the dry-run mapping; verified the
key rows; the live `cpl-chat` widget picked them up immediately (live read).
6 blob colleges (Los Medanos, Mendocino, MiraCosta, Mission, North Orange
Continuing Ed, Sacramento City) have no `chatbox_college_profiles` row (no
exhibits in the chatbox dataset) so they can't be synced until they do.
