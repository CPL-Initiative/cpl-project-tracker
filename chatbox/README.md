# CPL Chatbox — backend source (Phase 1)

Version-controlled copy of the RAG backend that powers the **CPL Assistant** tab
(and the live map.rccd.edu widget). Scope + plan:
[`docs/kb-notes/cpl-chatbox-integration-scope.md`](../docs/kb-notes/cpl-chatbox-integration-scope.md).

## What's here

| Path | What |
|---|---|
| `supabase/functions/cpl-chat/index.ts` | The `cpl-chat` Edge Function — RAG (pgvector) + college detection + live-metrics fetch + topic exhibit search → streamed Claude Sonnet answer (SSE). |

This is the function captured from the **live** deployment (Supabase project
`hvuwhnbuahrtptokpqfh`, slug `cpl-chat`) with **one change**: `cpl-initiative.github.io`
added to `ALLOWED_ORIGINS` so the dashboard can call it.

> **Fork D/C note:** the *canonical* source of this function historically lives
> in the `cpl-chatbox` repo. Until that repo is added to a session and its copy
> reconciled here, treat the **live function as the source of record** and this
> file as a faithful capture. Re-capture with the Supabase MCP `get_edge_function`
> before editing if in doubt.

## The only change vs. live v13

```diff
 const ALLOWED_ORIGINS = [
   "https://map.rccd.edu",
+  "https://cpl-initiative.github.io",
   "http://localhost",
   "http://localhost:3000",
   "http://localhost:8000",
   "null",  // file:// origins for local testing — REMOVE before production
 ];
```

(The `"null"` file:// origin is kept for now to avoid changing local-test
behavior; dropping it is a Phase-3 hardening item per the scope doc.)

## Deploy

The Edge Function is **not** deployed by the daily GitHub Actions pipeline — it's
a one-shot deploy when the source changes. Deploy via the Supabase MCP:

- tool: `deploy_edge_function`
- `project_id`: `hvuwhnbuahrtptokpqfh`
- `name`: `cpl-chat`
- `entrypoint_path`: `index.ts`
- **`verify_jwt`: `false`** ← MUST preserve (the function does its own anon-key +
  rate-limit gating; flipping this to `true` would break the live widget)
- `files`: `[{ name: "index.ts", content: <this file> }]`

⚠ This redeploys the **shared, live** function — the map.rccd.edu production
widget uses it too. Deno validates syntax at deploy time (a bad deploy fails
*closed*, leaving the running version up). After deploying, smoke-test all four
modes (general / college / topic / college+topic) before considering it done.

## Request / response contract (what `cpl_chat.js` speaks)

**Request** — `POST https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat`

```
headers: { Content-Type: application/json, apikey: <anon>, Authorization: Bearer <anon> }
body:    { "query": "<user question>", "session_id": "<uuid>" }
```

**Response** — `text/event-stream` (SSE), three event types:

```
event: sources
data: [{ "id", "heading", "similarity" }, …]   // RAG hits (not surfaced in Phase 1 UI)

event: text
data: { "text": "<token delta>" }              // repeated; concatenate in order

event: done
data: {}
```

Rate limit: 20 requests / minute / IP (HTTP 429 on exceed). Every turn is logged
to `chat_interactions` (anon-INSERT, no SELECT) — **don't put PII in queries.**

## Secrets (already set on the project — not in this repo)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` are Edge Function
secrets on the Supabase project. The browser only ever sends the public anon key.
