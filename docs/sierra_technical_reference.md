---
title: Sierra — technical reference (how the CPL assistant is built)
created: 2026-07-02
updated: 2026-07-02
tags: [reference, sierra, cpl-assistant, chatbot, integration, vendor-facing]
kb-status: published
obsidian-folder: cpl-project-tracker
related:
  - "[[sierra_integration_analysis]]"
  - "[[sierra_integration_guide]]"
  - "[[cpl_assistant_lessons]]"
  - "[[kb-notes/playbook-deploy-shared-supabase-edge-function]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - cpl_chat.js
  - sierra/sierra.js
  - fact-sheet/factsheet_sierra.js
  - chatbox/smoke_test.sh
---

# Sierra — Technical Reference

> **Audience:** developers (including external vendor developers) who need to
> understand how Sierra is built, how the chatbot works end-to-end, and what
> features it currently has. Companion docs:
> [`sierra_integration_analysis.md`](sierra_integration_analysis.md)
> (benefits / risks / challenges of embedding Sierra elsewhere) and
> [`sierra_integration_guide.md`](sierra_integration_guide.md) (the suggested
> implementation plan). Accurate as of **2026-07-02, `cpl-chat` v26**.

---

## 1. What Sierra is — the 30-second version

Sierra is the California Community Colleges **Credit for Prior Learning (CPL)
assistant**: a streaming, retrieval-augmented (RAG) chatbot that answers
questions about CPL — what it is, which colleges offer credit for a given
license/certification/experience, what courses are eligible, live statewide
impact numbers, and where a student should go next.

Architecturally it is **one shared Supabase Edge Function** (`cpl-chat`) plus
a set of thin, dependency-free JavaScript clients. The function does all the
work per question: it runs six parallel data lookups, assembles a
context-grounded system prompt, streams a Claude answer back over
Server-Sent Events (SSE), and logs the turn. The clients are ~20–28 KB of
vanilla JS each — no frameworks, no build step, no external libraries.

**One brain, several faces.** The same function serves four surfaces today:

| Surface | Where | Multi-turn? | Audience field? | Feedback UI? |
|---|---|---|---|---|
| COBI dashboard tab ("CPL Assistant") | `cpl_chat.js` on `cpl-initiative.github.io/cpl-project-tracker/` (`#chatbot`) | yes | yes | yes (`page:'cobi-tab'`) |
| Standalone Sierra page | `sierra/` — `cpl-initiative.github.io/cpl-project-tracker/sierra/` | yes | yes | yes (`page:'sierra'`) |
| Public Fact Sheet drawer | `fact-sheet/factsheet_sierra.js` | yes | no | no |
| **Production widget** | `map.rccd.edu` (not in this repo) | **no** (omits `history`) | no | no |

Because the function is shared, **every redeploy and every prompt/guidance
change is a production change for all four surfaces at once** — this is the
single most important operational fact about Sierra.

A naming note: the user-facing brand is **Sierra** (Mt Whitney mark, "Your
CPL Sherpa"), but the system prompt persona still reads "the CPL Chatbox" —
the persona rename is deliberately deferred (planned to land with the CPL
Student Portal).

---

## 2. System architecture

```
                Browser (any allowed origin)
   cpl_chat.js / sierra.js / factsheet_sierra.js / map.rccd.edu widget
                          │
                          │  POST {query, session_id[, history, audience]}
                          ▼
        Supabase Edge Function  cpl-chat   (Deno, verify_jwt:false)
        project hvuwhnbuahrtptokpqfh · rate-limit 20/min/IP · CORS allowlist
                          │
        ┌─────────────────┼──────────────────────────────────────┐
        │   6 PARALLEL LOOKUPS (Promise.all)                     │
        │ 1 pgvector RAG      match_document_sections            │
        │     (gte-small embed, threshold .5, k=5)               │
        │ 2 college detect →  chatbox_college_profiles           │
        │ 3 live metrics   →  live_metrics.json (GitHub raw)     │
        │ 4 topic search   →  search_exhibits_by_topic (limit 200)│
        │ 5 offerings      →  search_college_offerings (limit 150)│
        │     + college_geo proximity                            │
        │ 6 team guidance  →  sierra_guidance (newest 10 active) │
        └─────────────────┬──────────────────────────────────────┘
                          │  route: general | college | topic | college_topic
                          │  buildSystemPrompt(...)
                          ▼
             Anthropic API  claude-sonnet-4-6  (stream, max_tokens 2048)
                          │
                          ▼  SSE:  event:sources → event:text* → event:done
                Browser renders token-by-token (escape-first markdown-lite)
                          │
                          ▼  after stream
                chat_interactions INSERT (Q, A, sources, similarity, tokens, audience)
```

Key properties:

- **Stateless server.** The function holds no conversation memory. All
  multi-turn state is supplied by the client via the `history` field.
- **Service-role data access.** The function connects to Postgres with the
  service-role key, so its own reads bypass Row-Level Security. RLS gates
  protect the *browser-side* paths (feedback, guidance, logs), not the
  function's internal lookups.
- **Public-by-design front door.** The browser ships only the public anon
  key. The function itself validates no auth header — its gates are the CORS
  allowlist (browser-enforced) and the per-IP rate limit.

---

## 3. The API contract

### 3.1 Endpoint

```
POST https://hvuwhnbuahrtptokpqfh.supabase.co/functions/v1/cpl-chat
```

Headers (convention used by all first-party clients):

```
Content-Type:  application/json
apikey:        <Supabase anon key>
Authorization: Bearer <Supabase anon key>
```

The anon key is the project's public, RLS-gated publishable key (the same one
shipped in `cpl_chat.js:29` and other public JS in this repo). `OPTIONS`
returns a 204 preflight; any method other than `POST`/`OPTIONS` returns 405.

### 3.2 Request body

| Field | Type | Required | Behavior |
|---|---|---|---|
| `query` | string | **yes** | Trimmed; empty → HTTP 400. Silently truncated to **1,000 chars**. |
| `session_id` | string | no | Opaque client-generated id, used only for log correlation (`chat_interactions`). Not auth, not server-side state. |
| `history` | array | no | Prior turns as `{role:'user'\|'assistant', content:string}`. **Sending the field at all (even `[]`) opts the client into multi-turn mode.** Server keeps the last 6 valid turns, caps each `content` at 2,000 chars, and forces the array to start on a `user` turn. Omit it entirely to stay single-turn (this is what the production widget does). |
| `audience` | string | no | One of `student`, `faculty`, `administrator`, `employer`, `civic`. Anything else is treated as absent (default voice) — never an error. Appends a per-audience tone/content rule to the prompt and is logged. |

Unknown extra fields are ignored.

### 3.3 Response — Server-Sent Events

On success: HTTP 200, `Content-Type: text/event-stream`. Exactly three event
types, in this order:

1. `event: sources` — once, first. `data:` is a JSON array of RAG hits:
   `[{id, heading, similarity}, …]`. (Available for "sources" UI; the current
   first-party clients parse but don't render it.)
2. `event: text` — repeated. `data:` is `{"text":"<delta>"}` — concatenate
   the deltas in order to build the answer.
3. `event: done` — once, last. `data:` is `{}`.

Frames are delimited by a blank line (`\n\n`). There is **no `error` SSE
event**: errors are returned as plain JSON *before* the stream starts (see
3.4), so clients can branch on `resp.ok` / first byte. If the upstream model
call fails mid-stream, the stream simply ends (possibly with partial text)
and `done` is still emitted — treat an empty accumulated answer as a soft
failure.

### 3.4 Error responses (non-SSE JSON)

| Status | Body | Meaning |
|---|---|---|
| 400 | `{"error":"Query is required"}` | Missing/blank `query` |
| 405 | `{"error":"Method not allowed"}` | Non-POST/OPTIONS |
| 429 | `{"error":"Rate limit exceeded. Try again in a minute."}` | Per-IP limit hit |
| 500 | `{"error":"Search failed", …}` or `{"error":"Internal server error", …}` | RAG RPC error / uncaught exception |
| 502 | `{"error":"AI response failed", status, details}` | Anthropic upstream error (historically: a retired model id) |

### 3.5 CORS and rate limiting

- **`ALLOWED_ORIGINS`** (in `index.ts`): `https://map.rccd.edu`,
  `https://cpl-initiative.github.io`, `http://localhost`,
  `http://localhost:3000`, `http://localhost:8000`, and `"null"` (file:// —
  flagged in-code for removal before wider production use). Matching is
  currently prefix-based. A disallowed origin is not rejected server-side —
  the response simply lacks the `Access-Control-Allow-Origin` header, so the
  *browser* blocks it. Non-browser callers are unaffected (CORS is not a
  security boundary; see §8).
- **Rate limit:** 20 requests/minute/IP, tracked in an in-memory `Map` inside
  the function isolate (fixed 60s window; resets on cold start; not shared
  across scaled-out isolates). IP comes from `x-forwarded-for` /
  `cf-connecting-ip`.

### 3.6 Companion RPC — feedback (optional, browser-called)

The 👍/👎 bar on first-party surfaces upserts through a `SECURITY DEFINER`
PostgREST RPC (the table itself has no public read/write policies):

```
POST https://hvuwhnbuahrtptokpqfh.supabase.co/rest/v1/rpc/sierra_feedback_upsert
{ p_turn_id, p_rating:'up'|'down', p_session_id, p_page,
  p_audience, p_question, p_response, p_note }
```

One client-generated UUID per assistant turn (`p_turn_id`); rating clicks and
a later note upsert the same row. Client-side clamps: question ≤4,000 chars,
response ≤12,000, note ≤2,000. Anon can execute the RPC but cannot read the
table back (SELECT is reviewer/team-gated — that's the Sierra Training tab's
review queue).

---

## 4. What happens on a turn (server pipeline)

1. **Gate:** CORS headers computed; rate limit checked (429); method and
   `query` validated (405/400); `query` trimmed/truncated; `history`
   sanitized; `audience` validated.
2. **Refinement fold (multi-turn only):** if the current turn has fewer than
   2 topic keywords of its own after stripping place/continuation words
   (`REFINE_NOISE`), the recent conversation's user turns are folded into the
   *retrieval* text — so "How about West LA?" still searches "real estate."
   (The message actually sent to the model is still just the current query;
   the fold affects retrieval only.)
3. **Embed:** the retrieval text is embedded in-runtime with Supabase's
   native `gte-small` (384-d, mean-pooled, normalized) — no external
   embedding service.
4. **Six parallel lookups** (one `Promise.all`):
   | # | Lookup | Source | Folded into prompt as |
   |---|---|---|---|
   | 1 | pgvector RAG | `match_document_sections` RPC over `cpl_document_sections` (threshold 0.5, k=5) | "--- Source N (similarity: X%) ---" blocks |
   | 2 | College detection | ~110-alias map + fuzzy `ilike` over `chatbox_college_profiles` | "--- College Profile: X ---" (totals, disciplines, contacts, landing page URL) |
   | 3 | Live metrics | `live_metrics.json` from this repo's `main` via GitHub raw (5s timeout, fails soft) | "--- LIVE CPL Dashboard Metrics ---" (numbers that override anything older) |
   | 4 | Topic exhibits | `search_exhibits_by_topic` RPC over `chatbox_exhibits` (limit 200; relevance-ranked tsvector, title weighted A) | "--- Topic Search Results ---" (statewide CCC standards deduped by title, then local results grouped by college with eligible-course lines) |
   | 5 | Offerings catalog | `search_college_offerings` RPC over `coci_college_offerings` (limit 150) + `college_geo` proximity | "--- Course Catalog: WHICH COLLEGES TEACH THIS ---" (core-vs-tangential match, same-county/region ranking) |
   | 6 | Team guidance | `sierra_guidance` (newest 10 active rules, ~2,500-char cap, fails soft) | "TEAM GUIDANCE" block appended last — wins on conflict |
5. **Route:** the detected college + topic hits pick a search mode —
   `general`, `college`, `topic`, or `college_topic` — each with its own
   special instruction block. An ambiguous college match (e.g. "west" → 5
   colleges) is narrowed to the candidate that actually has topic hits.
6. **Prompt assembly** (`buildSystemPrompt`): persona → RAG sources → live
   metrics → college context → topic context → offerings context → standing
   rules (§5) → mode instruction (+ follow-up rule if multi-turn) → audience
   rule → team guidance.
7. **Model call:** `claude-sonnet-4-6` (deliberately an unversioned alias —
   a pinned dated snapshot caused a 4-day outage when Anthropic retired it),
   `max_tokens: 2048`, streaming. Messages = sanitized history + the current
   query.
8. **Stream out:** `sources` event, then `text` deltas, then `done`.
9. **Log:** best-effort INSERT into `chat_interactions` — `session_id`,
   `question`, `response`, `source_sections`, `top_similarity`,
   `response_tokens`, `topic_match`, `audience`. (This is why the UI warns
   users not to enter personal information.)

---

## 5. Behavior rules (the prompt contract)

These standing rules are baked into the system prompt as module-level
constants and define Sierra's answer discipline. Integrators should know them
because they are product guarantees, not suggestions:

| Rule | Behavior |
|---|---|
| `STATEWIDE_RULE` | Statewide Collaborative (CCC) credit recommendations are system-wide standards — never attributed to a single college; the visitor is routed to *their own* college's CPL landing page. |
| `CREDIT_LIST_RULE` | Never a bare count ("6 credit recs") — list actual course titles + units; "…and more" rather than inventing names. |
| `OFFERINGS_RULE` | The course catalog says what a college *teaches*, which is **not** a CPL articulation. Teaches-but-no-exhibit = adoption opportunity; doesn't-teach = route to the nearest teaching college. Never conclude a college does NOT teach a subject merely because it's absent from a top-N result list. |
| `LANDING_PAGE_RULE` | If a college has no CPL landing page URL configured, never invent a link — say so, suggest the college set one up, offer MAP@rccd.edu. |
| `FOLLOWUP_RULE` (multi-turn only) | Before dumping a >~6-college list, ask a focusing question ("any particular part of California?"). |
| `AUDIENCE_RULES` | Per-audience tone. The sharpest: **students never get system inside-baseball** — no "exhibits", TOP codes, COCI, C-ID, or apportionment jargon; plain words + a concrete next step. |
| Live-metrics precedence | Numbers from the live dashboard feed override anything in retrieved documents. |
| Team guidance | Up to 10 active team-authored directives are appended to *every* prompt and win on conflict — the team's same-minute tuning knob (no redeploy). |

Retrieval-side vocabularies that shape matching: `COLLEGE_ALIASES` (~110
college name aliases), `TOPIC_SYNONYMS` (real-estate, NCCER/construction,
CPR/First-Aid, firefighter families), `TOPIC_STOP_WORDS` (including
continuation words like "check", "already", "again"), `REFINE_NOISE`
(place/region words for the multi-turn fold).

---

## 6. Data layer

All tables live in Supabase project `hvuwhnbuahrtptokpqfh`. The function
reads them with the service-role key (RLS-bypassing); browser paths are
RLS-gated as noted.

| Table | What it holds | Scale | Refresh |
|---|---|---|---|
| `cpl_documents` / `cpl_document_sections` | The RAG prose corpus + 384-d `gte-small` embeddings | 41 docs / 344 chunks | External indexer (currently sourced from a private Obsidian vault; a re-point to the public `cpl-knowledge-base` repo is planned) |
| `chatbox_exhibits` | The earned-exhibit set — CPL articulations colleges have already set up (≈ the EACR card set); `collaborative_type='CCC'` marks statewide standards | ~2,397 rows | External MAP-derived extract (no committed pipeline in this repo; known staleness — see §11) |
| `chatbox_college_profiles` | Per-college profile: totals, CPL-type mix, ~8 sample exhibits, contacts, credit distribution, **`landing_page_url`** | 128 rows | Landing-page URL synced weekly (Mondays) from the MAP College Landing Page API via a GitHub Actions runner |
| `coci_college_offerings` | What each college *teaches*: college × TOP-program rollups with FTS blob | 16,097 rows | Rebuilt from a fresh COCI extract (`chatbox/build_coci_offerings.py` → `sync_coci_offerings.py`, workflow-triggered) |
| `coci_college_programs` | Active/approved awards per college | 22,335 rows | Same sync |
| `college_geo` | Curated college → region/county (proximity ranking) | 120 colleges | Hand-curated seed (`_seed_college_geo.py`) |
| `chat_interactions` | Per-turn log (Q, A, sources, similarity, tokens, audience) | grows per use | Written by the function; anon-INSERT / reviewer-SELECT |
| `sierra_feedback` | 👍/👎 + note per answer, triage status (`new/triaged/addressed`) | grows per use | Written via the `sierra_feedback_upsert` RPC; reviewed in the Sierra Training tab |
| `sierra_guidance` | Team-authored prompt directives (active flag, no-delete audit trail) | ≤10 sent per turn | Authored in the Training tab's 🧭 pane |

**RPCs:** `match_document_sections` (pgvector search),
`search_exhibits_by_topic` (weighted-tsvector relevance rank — schema of
record `chatbox/supabase_search_exhibits_by_topic.sql`),
`search_college_offerings`, `sierra_feedback_upsert`,
`sierra_feedback_set_status`.

A useful operational property: **table-backed content updates take effect
with no redeploy** — landing-page fixes, offerings refreshes, and guidance
rules are all read live at query time.

---

## 7. Client surfaces — implementation notes

All three first-party clients are framework-free vanilla JS (IIFE), each
self-configured by a small CONFIG block (Supabase URL + anon key + endpoint).
They share byte-identical core logic (asserted by tests):

- **SSE consumption:** `resp.body.getReader()` + `TextDecoder`; buffer split
  on `\n\n`; `event:`/`data:` line parsing; the accumulated full text is
  re-rendered through the markdown renderer on every delta.
- **Rendering safety (escape-first):** the *entire* model output is
  HTML-escaped **before** the markdown-lite pass, so model output can never
  inject live HTML. The renderer then supports headings (h3–h5), GFM tables,
  horizontal rules, ordered/unordered lists, bold/italic/inline-code, and
  links — **http(s) URLs only** (a `javascript:` URL can never become an
  anchor), always `target="_blank" rel="noopener noreferrer"`. Any
  third-party client should replicate this discipline or reuse the reference
  renderer (exported for tests as `window.CPL_CHAT.renderMarkdown` etc.).
- **Session:** `crypto.randomUUID()` per browser tab, persisted in
  `sessionStorage` (per-surface keys: `cpl_chat_session`,
  `cpl_sierra_page_session`, `cpl_sierra_session`).
- **Multi-turn:** clients keep the last 8 history entries (4 turn pairs) and
  send prior turns as `history`; the server re-trims to 6.
- **Audience selector** (tab + standalone page): 5 chips, required before the
  first send, persisted in localStorage `cplSierraAudience.v1` (shared across
  same-origin surfaces).
- **Feedback bar** (tab + standalone page): per-turn 👍/👎 + optional note via
  the `sierra_feedback_upsert` RPC; best-effort (failures swallowed).
- **Error UX:** friendly messages for network failure, non-OK status, 429
  ("I'm getting a lot of questions right now…"), and empty streams; a `busy`
  flag prevents concurrent submits; typing indicator until the first token.
- **Branding:** the `SIERRA_MARK` inline SVG (Mt Whitney east-face ridge on a
  navy roundel) is the avatar on all surfaces; the standalone page adds the
  CPL Initiative logo, a ghosted Whitney wordmark, and the "Your CPL Sherpa"
  tagline. Palette anchors: CCC seal navy `#0b3d61`, cobalt `#0047ab`.

**Self-containment status (matters for embedding):**

- `sierra/` (standalone page) is **fully self-contained**: its own HTML, CSS,
  JS, and image assets; system font stack; zero external dependencies. This
  is the artifact to link or iframe.
- `cpl_chat.js` is self-contained *behind its CONFIG block* and injects its
  audience/feedback/markdown CSS at runtime, **but** its base chat-layout CSS
  currently lives in the host dashboard's `<style>` block, and it mounts only
  into a `#tab-chatbot` container. Embedding it on a third-party page today
  requires shipping that base CSS and providing the mount node (details in
  the integration guide).

---

## 8. Security model — what actually gates what

| Layer | Mechanism | What it protects |
|---|---|---|
| Browser → function | CORS allowlist | Which *web pages* can call the endpoint from a browser. **Not a security boundary** — non-browser clients bypass CORS entirely. |
| Any caller → function | Rate limit 20/min/IP (in-memory) | Basic flood protection (per-isolate; resets on cold start) |
| Function → Anthropic | `ANTHROPIC_API_KEY` Edge Function secret | Never exposed to the browser; the model bill rides on this key |
| Function → Postgres | Service-role key (Edge Function secret) | Function reads bypass RLS — treat *everything the function can query* as public-equivalent |
| Browser → feedback/guidance/logs | RLS + `SECURITY DEFINER` RPCs | Anon can write feedback (write-only) and read nothing back; guidance/log reads are gated to the reviewer allowlist or the shared team phrase |
| Output → DOM | Escape-first rendering, http(s)-only links | XSS from model output |
| `verify_jwt` | **Must stay `false`** | The function does its own gating; flipping it to true 401s every existing caller (including the production widget). Deploy tooling defaults it to true — it must be passed `false` explicitly on every deploy. |

The anon key is public by design (it appears in the repo's public JS).
Consequently the chat endpoint is *effectively public*: anyone can script
against it. The data it can surface is public-facing CPL information; the
real exposure of an unauthenticated flood is **cost** (see the integration
analysis, which recommends a durable rate limit + daily budget breaker before
scale-out).

---

## 9. Operations

- **Deploys** are one-shot pushes of `index.ts` to the shared function
  (via the Supabase management API / MCP `deploy_edge_function`) — *not*
  part of any cron. Discipline (from
  [`playbook-deploy-shared-supabase-edge-function.md`](kb-notes/playbook-deploy-shared-supabase-edge-function.md)):
  capture the running version first (that's the rollback), smallest possible
  diff, **pass `verify_jwt:false` explicitly**, byte-verify after, then
  smoke-test.
- **Smoke tests** run on a GitHub Actions runner
  (`chatbox/smoke_test.sh` + `.github/workflows/cpl-chat-smoke.yml`) because
  the dev sandbox is egress-blocked from `*.supabase.co`. 13 modes cover
  general/college/topic/college+topic answers, the multi-turn fold, the
  offerings/adoption cases, audience handling, the feedback RPC, and
  regression guards for every past production bug. A separate
  `preflight_bgca.sh` battery eyeballs answer *quality* on real user
  questions.
- **Secrets** (names only): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
  `ANTHROPIC_API_KEY` as Edge Function secrets; `SUPABASE_SERVICE_KEY` as a
  GitHub Actions secret for the data-sync workflows. The Anthropic key Sierra
  uses is distinct from the Cloudflare Worker key used by the dashboard's
  Custom Reports feature — two keys, two billing surfaces.
- **Observability:** every turn is logged to `chat_interactions`
  (similarity + token counts included); the Sierra Training tab mines it for
  low-similarity turns and punt-signature answers; `sierra_feedback` is the
  human signal. Supabase function logs are available via the management API.

---

## 10. Version timeline (condensed)

| Version | Date | Change |
|---|---|---|
| v13 | (baseline) | Captured into this repo: 4 parallel lookups, streaming SSE |
| v14 | 2026-06-01 | CORS: added `cpl-initiative.github.io` — the dashboard tab went live |
| v15 | 2026-06-19 | Model swap to alias `claude-sonnet-4-6` after the pinned snapshot was retired (4-day 502 outage) |
| v16–v17 | 2026-06-25 | Statewide/credit-list rules; **multi-turn** via opt-in `history`; follow-up focusing rule |
| v18–v19 | 2026-06-25 | Multi-turn retrieval fold; ambiguous-college fix (array match no longer discards topic results) |
| v20–v21 | 2026-07-01 | **Offerings catalog** (what colleges teach) + geo proximity; never-assert-absence rule; result cap 80→150 |
| v22–v23 | 2026-07-01 | **Audience-aware voice** (5 populations); `sierra_feedback`; landing-page never-invent rule |
| v24 | 2026-07-01 | Topic search re-ranked by relevance (`ts_rank_cd`, title weighted A) — fixed the "CPR miss" long-tail bug |
| v25–v26 | 2026-07-02 | **Team guidance layer** (live prompt directives, no redeploy); v26 restored `verify_jwt:false` after the deploy-tool footgun; full markdown + Sierra mark on the clients |

---

## 11. Known limitations and sharp edges (honest list)

- **Shared blast radius:** one function, four surfaces — no per-surface
  versioning or staging tier. Every change ships everywhere at once.
- **Rate limit is porous at scale:** in-memory, per-isolate, resets on cold
  start. Fine for current traffic; needs a durable counter or WAF before a
  high-traffic embed.
- **No cost ceiling:** there is no daily token/spend breaker on the function.
  A scripted flood is an open Anthropic bill. (Flagged as the mandatory
  guardrail before wider exposure.)
- **CORS list contains `"null"`** (file:// origins) and uses prefix matching
  — both flagged for tightening before broader production use.
- **RAG corpus provenance:** the 41 indexed docs currently come from a
  private working vault; roughly half are internal notes. A re-point to the
  curated public knowledge base is planned but not yet executed.
- **`chatbox_exhibits` staleness:** the topic corpus is an external extract
  with no committed refresh pipeline in this repo; known near-duplicate rows
  and at least one missing exhibit. The durable fix (unified-title re-point)
  is on the roadmap.
- **College detection resolves one college per query** via the alias map;
  multi-college questions rely on the global search paths (a documented
  refinement candidate).
- **Persona wording:** the prompt self-describes as "on map.rccd.edu" — worth
  a one-line change (or a guidance rule) before Sierra fronts another host.
- **Answers are never a credit guarantee** — Sierra routes students to their
  college for the actual review; this is by design and must be preserved in
  any embed's surrounding copy.

---

## 12. File map

| Path | What |
|---|---|
| `chatbox/supabase/functions/cpl-chat/index.ts` | The Edge Function (source of record, captured from live) |
| `chatbox/README.md` | Deploy notes (⚠ partially stale — v13-era body schema; trust this doc + the playbooks) |
| `chatbox/smoke_test.sh`, `.github/workflows/cpl-chat-smoke.yml` | 13-mode smoke battery (runner) |
| `chatbox/preflight_bgca.sh`, `.github/workflows/sierra-preflight.yml` | Real-question QA battery |
| `chatbox/supabase_sierra_feedback.sql`, `chatbox/supabase_sierra_guidance.sql`, `chatbox/supabase_search_exhibits_by_topic.sql` | Schemas of record for the feedback/guidance/topic-search layers |
| `chatbox/build_coci_offerings.py`, `chatbox/sync_coci_offerings.py`, `chatbox/_seed_college_geo.py` | Offerings/geo build + sync |
| `chatbox/scrape_landing_pages.py`, `.github/workflows/cpl-landing-pages.yml` | Weekly landing-page URL sync |
| `cpl_chat.js` | COBI dashboard tab client |
| `sierra/` (`index.html`, `sierra.js`, `sierra.css`, `whitney-mark.svg`, `cpl-initiative-logo.png`) | The standalone, fully self-contained Sierra page |
| `fact-sheet/factsheet_sierra.js` | Fact Sheet drawer client |
| `sierra_training.js` | The team-only Sierra Training tab (feedback queue, gap miner, guidance pane) |
| `tests/sierra_*.test.js`, `tests/cpl_chat_audience.test.js` | Committed jsdom test suites |
| `docs/cpl_assistant_lessons.md` | The full narrative history (v13→v26) |
