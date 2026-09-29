---
title: "Playbook: unattended news aggregation into a live dashboard tab"
kb-status: published
tags: [playbook, news, supabase, edge-function, claude, automation, rss, gdelt]
created: 2026-06-21
related:
  - docs/cpl_news_lessons.md
  - docs/kb-notes/playbook-runner-as-external-api-proxy.md
  - docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md
---

# Playbook: unattended news aggregation into a live dashboard tab

How to add a **self-refreshing** news/feed surface to a static dashboard without
the hand-curation that makes such features go stale. Built for the COBI "CPL
News" tab; reusable for any topical feed.

## The shape

```
GH Actions cron ──curls (service key)──▶ Supabase Edge Function
                                            │ harvest adapters + manual queue
                                            │ dedup → Claude triage → upsert
                                            ▼
                                   public.<feed> table  ──live read (anon)──▶ static tab JS
```

Three properties that keep it fresh **with zero hand-work**:
1. **Cron harvest** — a daily workflow, not a person.
2. **Claude does the triage** that used to be manual (on-topic? scope? summary?).
3. **The tab live-reads the table** — no committed artifact to regenerate, so
   "fresh" is automatic. Curation (feature/hide) is *optional*, never required.

## Source adapters — what's actually free in 2026

| Source | Free? | Notes |
|---|---|---|
| **Google News RSS** | ✅ | Workhorse. `news.google.com/rss/search?q=…&hl=en-US&gl=US&ceid=US:en`; `when:30d`, quotes, `OR`. 100-item cap/feed. URLs are opaque redirects (still resolve). |
| **GDELT DOC 2.0** | ✅ | `api.gdeltproject.org/api/v2/doc/doc?query=…&format=json&timespan=45d`. Breadth; real URLs. |
| **Publisher RSS** (CalMatters, EdSource…) | ✅ | WordPress `…/feed/`. Don't republish bodies — link out + summarize. |
| **Org press pages** (e.g. CCCCO) | ✅ | No RSS → scrape the listing `<a>`s; Claude filters relevance. |
| **Bluesky** | ✅ | The one open social API: `public.api.bsky.app/xrpc/app.bsky.feed.searchPosts` (no auth). |
| **X / LinkedIn / Facebook / Instagram** | ❌ | Closed/paywalled. X = pay-per-read, no free tier; LinkedIn closed API + ToS ban; Meta no public search. **Enter via a manual queue** (below). |

### Closed socials → a "suggest a story" queue
Add a `<feed>_requests` table (anon INSERT). A human pastes any URL (incl. a
LinkedIn/X/FB/IG post); the next harvest fetches it and reads its **OpenGraph**
preview (`og:title`/`og:description`/`og:image` — present even behind soft
walls) and analyzes it like any other item. No scraping, no ToS violation.

## Auth: capability-probe, not key-equality

Don't gate the function by `bearer === SUPABASE_SERVICE_ROLE_KEY` — the GH
Actions secret and the function's auto-injected key are often **different but
both-valid** service credentials (different format/rotation), so equality 401s.
Instead **probe capability**: have the function GET an RLS-protected table that
only a service role can read (e.g. `allowed_reviewers`, RLS on + no policies →
anon gets 0 rows, service role bypasses). If the caller's bearer returns ≥1 row,
it's a service key — then use *that same bearer* for all DB ops. No new secret,
robust to key format.

```ts
async function isServiceCred(bearer: string): Promise<boolean> {
  const r = await fetch(`${URL}/rest/v1/allowed_reviewers?select=email&limit=1`,
    { headers: { apikey: bearer, Authorization: `Bearer ${bearer}` } });
  const rows = r.ok ? await r.json() : [];
  return Array.isArray(rows) && rows.length >= 1;
}
```

## Triage prompt — be strict, structured, link-out

One Claude call per batch (~12 items) → strict JSON array. Per item: `cpl_related`
(gate), `scope` (CA-first), `related_system`, `topics`, `relevance` (0–1, drop
< 0.4), `summary` (ONE neutral sentence — never copy article text). Tell it to
default to `cpl_related:false` when unsure. Use an **unversioned model alias**
(`claude-sonnet-4-6`) — a dated snapshot is a latent outage on its retirement
date.

## Idempotency + dedup
- `insert … on conflict (url) do nothing` (PostgREST `Prefer:
  resolution=ignore-duplicates`, `?on_conflict=url`). Rows are insert-once →
  reviewer curate columns are never clobbered.
- Dedup within-batch AND against existing rows by `url` + a normalized
  `title_key` (same story, different outlet/URL).

## Gotchas
- The agent sandbox egress-blocks Google/GDELT/Supabase; the Edge Function
  runtime + GH runners don't. **Verify via the workflow + `execute_sql`**, not a
  local curl.
- `deploy_edge_function` needs the full source inline — keep a condensed,
  proven-escaped copy for redeploys; the verbose in-repo file is the human
  source-of-record.
- Isolate each adapter in try/catch + `Promise.allSettled` + per-fetch timeout so
  one bad source can't kill the run.
- Bound new candidates per run (cap ~80) to keep Claude cost/time predictable;
  let the manual queue bypass the cap.

## Knowledge flow + the curation boundary
Pipe the analyzed feed into the **private vault** automatically (a tiny Python
builder reads the public table and commits a digest **within the vault repo** —
no cross-repo token). Do **NOT** auto-write the **public** KB: that stays the
human-gated curation pipeline. A rolling feed is a poor fit for a curated public
KB anyway.
