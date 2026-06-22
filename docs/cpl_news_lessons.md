---
title: CPL News lane — lessons
date: 2026-06-21
tags: [cpl, news, pipeline, supabase, edge-function, automation, lessons]
artifacts:
  - cpl_news.js
  - chatbox/supabase/functions/cpl-news-harvest/index.ts
  - .github/workflows/cpl-news.yml
  - news/supabase_cpl_news.sql
  - news/sources.json
  - tests/cpl_news.test.js
related:
  - docs/kb-notes/playbook-cpl-news-aggregation.md
  - docs/kb-notes/playbook-runner-as-external-api-proxy.md
---

# CPL News lane — lessons

Workstream scratchpad. Append a dated section each checkpoint.

## 2026-06-21 — Skywatch: the lane, built end-to-end

### Why
Sam wanted the long-retired "CPL News" section back, but it died last time
because it was **hand-curated** and went stale. The whole design brief was
therefore *"make it stay fresh on its own."* Plus: include social media, CA
budget items, and adjacent systems (Career Passport, CA Master Plan for
Education, workforce/upskilling); CA-first, national second; and feed the
harvested news into CPLBrain + the KB "like any other doc."

### What shipped (PR #481, tracker; PR #9, CPLBrain)
- **Table** `public.cpl_news` (+ `cpl_news_requests`), `news/supabase_cpl_news.sql`.
  Public READ, reviewer-gated curate, anon suggest-a-story. Insert-once on `url`.
- **Edge Function** `cpl-news-harvest` (new slug; does NOT touch `cpl-chat`).
  Harvest → dedup → Claude triage (`claude-sonnet-4-6`) → upsert.
- **Workflow** `cpl-news.yml` — cron 13:17 UTC + dispatch + push-trigger; calls
  the function with the existing `SUPABASE_SERVICE_KEY`.
- **Tab** `cpl_news.js` (`#cpl-news`) — live-reads `cpl_news`, CA-first,
  filters, suggest-a-story, reviewer feature/hide. Both HTMLs (Rule 4).
- **Vault** (CPLBrain): `tools/build_cpl_news_digest.py` +
  `cpl-news-digest.yml` → `05-knowledge/cpl-news/INDEX.md` daily.

### First harvest (validation)
12 items, **all California**, avg relevance **0.84**: the California Career
Passport launch (Newsom; ~7 outlets), the CCCCO earn-and-learn report (official),
and CA workforce-funding/budget pieces (incl. the exact CalMatters story Sam
linked). `related_system` classified correctly. The strict triage (drop < 0.4)
kept national/Bluesky out this run — quality over volume; they accrue over time.

### Lessons / decisions
1. **The freshness fix is automation, not effort.** Cron harvest + Claude doing
   the relevance triage that used to be manual + a **live-read tab** (no
   committed artifact to regenerate) = nothing to keep fresh by hand. Curation
   is optional (feature/hide), never required.
2. **Social media is mostly closed in 2026.** X (pay-per-read, no free tier),
   LinkedIn (closed API + ToS ban on scraping), Meta/FB/IG (no public search
   API) **cannot be auto-harvested for free.** Honest design: Bluesky (open AT
   Protocol) is auto-harvested; the others enter via the **suggest-a-story**
   queue — a human pastes a URL, the function reads its OpenGraph preview. Paid
   social adapters can slot behind the same `Candidate` interface later.
3. **Edge-Function auth: probe capability, don't string-compare keys.** v1 401'd
   because the GitHub `SUPABASE_SERVICE_KEY` secret and the function's
   auto-injected `SUPABASE_SERVICE_ROLE_KEY` are different-but-both-valid service
   credentials. v2 authenticates by *capability*: can the caller's bearer read
   the RLS-protected `allowed_reviewers`? Only a service key can. Then use that
   same bearer for all DB ops. (KB note:
   `playbook-cpl-news-aggregation.md`.)
4. **Runner/function reaches what the agent sandbox can't.** The agent sandbox
   egress-blocks Google News/GDELT/Supabase; the Edge Function runtime (Deno
   Deploy) and GH runners don't. Same precedent as the First Light
   runner-as-Commons-proxy. Verify via the workflow + `execute_sql`, not local curl.
5. **Deploy is a big inline.** `deploy_edge_function` needs the full source
   inline. Keep a condensed, proven-escaped variant for redeploys; the verbose
   in-repo capture is the human source-of-record (cpl-chat convention).
6. **Curation boundary held.** CPLBrain (private) gets the digest automatically;
   the public `cpl-knowledge-base` is **not** auto-written (human-gated
   `CURATION.md` only). RAG ingestion into `cpl_documents` deferred (needs the
   embedding pipeline) — flagged, not done blind.

### Current state
LIVE: table + function v2 + workflow (run #2 green, 12 rows) + tab + vault
digest. PR #481 (tracker) + #9 (CPLBrain).

### Strategic roadmap / next
- Sam to eyeball the feed; tune `GOOGLE_NEWS_QUERIES` / `RELEVANCE_MIN` (edit the
  function + `news/sources.json`, redeploy).
- ~~Decide the public-KB question~~ — **DECIDED 2026-06-22: leave it private to CPLBrain**
  (Sam: "not sure how much I trust it; will see over time if it should flow to the public
  KB"). Revisit later; until then, never auto-write the public KB.
- Optional: decode Google News opaque redirect URLs → final article links;
  add per-college/CCC official-site adapters; add paid social if funded;
  RAG-ingest summaries into `cpl_documents` so the Assistant cites current news.

### Next concrete step
Watch PR #481 to green + merge (tab goes live on Pages). Then the daily cron
(13:17 UTC) keeps the feed fresh with zero hand-work.
