# CPL News lane

Automated CPL news aggregation behind the dashboard's **CPL News** tab.

## How it flows

```
                 .github/workflows/cpl-news.yml  (cron 13:17 UTC + dispatch + push)
                          │  curls, with the service-role key
                          ▼
   Supabase Edge Function  cpl-news-harvest   (chatbox/supabase/functions/cpl-news-harvest/index.ts)
                          │
   ┌──────────────────────┼───────────────────────────────────────────┐
   │ FREE adapters (no key, fetched on the function runtime):          │
   │   • Google News RSS   (CA-first + national + adjacent + budget)   │
   │   • GDELT DOC 2.0      (breadth)                                   │
   │   • CalMatters RSS     (education / higher-ed)                     │
   │   • CCCCO press releases (official)                               │
   │   • Bluesky public search (the one open social API)              │
   │   • cpl_news_requests  (manual "suggest a story" — how LinkedIn / │
   │     X / Facebook / Instagram links enter, via their OpenGraph     │
   │     preview; their APIs are closed/paywalled in 2026)            │
   └──────────────────────┬───────────────────────────────────────────┘
                          │  dedup (url + normalized title) → Claude triage
                          │  (claude-sonnet-4-6: on-topic? scope? summary?)
                          ▼
              Supabase table  public.cpl_news   (insert-once per url)
                          │  public READ (anon)         reviewer feature/hide
                          ▼
   Dashboard tab  cpl_news.js  (#tab-cpl-news)  +  CPLBrain digest workflow
```

## Why this shape (and why it stays fresh)

The previous "CPL News" section died because it was **hand-curated**. This one is
**unattended**: a daily cron harvests, Claude does the relevance triage that used
to be manual, and the tab reads the table **live** — so there is no artifact to
regenerate and nothing to keep fresh by hand. Curation is **optional** (a reviewer
can feature/hide), never required.

## Scope priority

1. **California** CPL (primary)
2. **National** CPL (secondary)
3. Adjacent CA systems: Career Passport, the California Master Plan for Education,
   workforce/upskilling/earn-and-learn, military/veterans credit (JST), and
   **California budget/apportionment items** that touch CPL.

## Files

| File | Role |
|------|------|
| `chatbox/supabase/functions/cpl-news-harvest/index.ts` | The harvest+analyze Edge Function (source-of-record is the LIVE function; this is the in-repo capture). |
| `.github/workflows/cpl-news.yml` | The scheduler that invokes the function. |
| `news/sources.json` | Human-readable mirror of the adapter/query list (the function holds the authoritative copy; edit there + redeploy). |
| `news/.harvest-run` | Touch + push to trigger an on-demand harvest from a `claude/**` branch. |
| `cpl_news.js` | The dashboard tab renderer (static, lazy-loaded; reads `cpl_news` live). |
| `tests/cpl_news.test.js` | jsdom test for the tab (sort, filters, failure modes). |

## Social media — the honest design

X (no free tier, pay-per-read), LinkedIn (closed API + ToS ban on scraping), and
Meta/Facebook/Instagram (no public search API) **cannot be auto-harvested for free
in 2026**. So those platforms enter through the **suggest-a-story** box on the tab:
a human pastes a post URL, and the next harvest reads its public OpenGraph preview
(`og:title`/`og:description`/`og:image`) and analyzes it like any other item.
Bluesky (open AT Protocol API) IS auto-harvested. Paid social adapters can be
added later behind the same `Candidate` interface if funded.

## Re-deploy / edit

Edit `chatbox/supabase/functions/cpl-news-harvest/index.ts`, then redeploy via the
Supabase MCP `deploy_edge_function` (project `hvuwhnbuahrtptokpqfh`, slug
`cpl-news-harvest`, `verify_jwt:false` — it does its own service-key auth). To add
a query/source, edit the adapter arrays at the top of the function (and mirror into
`news/sources.json`). To force a run, `touch news/.harvest-run` + push, or dispatch
the workflow.
