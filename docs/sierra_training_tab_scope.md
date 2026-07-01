---
title: Sierra Training tab — recommendation + phased scope
created: 2026-07-01
updated: 2026-07-01
tags: [scope, sierra, cpl-assistant, training, feedback, rag, guardrails]
kb-status: internal
obsidian-folder: cpl-project-tracker
related:
  - "[[docs/cpl_assistant_lessons]]"
  - "[[docs/kb-notes/cpl-assistant-ccr-cer-recommendation-scope]]"
  - "[[docs/kb-notes/playbook-deploy-shared-supabase-edge-function]]"
artifacts:
  - chatbox/supabase_sierra_feedback.sql
  - chatbox/supabase/functions/cpl-chat/index.ts
  - sierra/sierra.js
  - cpl_chat.js
---

# Sierra Training tab — recommendation + phased scope

**The ask (Sam, 2026-07-01, Session 92):** should COBI get a "Sierra Training"
tab where the team can add artifacts/data to the KB and provide guidance on
response enhancements? Follow-ups the same session: it should be **informed by
log entries to see where gaps might be**, and — down the road — **Malone (MAP
tech director) will need guardrails** (security, IP-based usage limits for cost
control, spam protection) before Sierra ships inside the **CPL Student Portal
("Credit for Being Me")**.

## Recommendation: YES — build it, as a thin console over live tables, in 3 phases

A Training tab earns its place because the improvement loop already exists but
has no working surface: every turn is logged (`chat_interactions`), every answer
is now rateable (`sierra_feedback`, Session 92), and response behavior is tuned
by editing the shared `cpl-chat` Edge Function. What's missing is the place
where a **team member** (not a Claude session) sees the gaps and feeds the fix.
Build it lean — a lazy, static tab renderer (the `map_users.js` pattern:
public-safe default view, reviewer/team-phrase gate for the real data), NOT a
heavyweight app.

**One governance boundary, stated up front:** the Training tab writes to the
**Sierra RAG corpus** (Supabase `cpl_documents` / `cpl_document_sections`) and
to prompt-guidance tables. It must **never** write to the public
`cpl-knowledge-base` repo — that store is reached only through its human-gated
`CURATION.md` pipeline. "Adding an artifact to Sierra's knowledge" and
"publishing to the public KB" are different acts with different gates.

## What Session 92 already laid down (the tab's foundations)

- **`sierra_feedback`** — 👍/👎 + note per answer, with audience, page, and the
  Q/A snapshot. Anon write-only; **SELECT gated** `is_allowed_reviewer() OR
  team_pass_ok()` — i.e. the Training tab can already read its queue.
- **`chat_interactions`** gained an `audience` column AND the same
  reviewer/team-phrase SELECT policy (it was write-only before) — the log-mining
  read path Sam asked for.
- **Audience selector** on both Sierra surfaces → every logged turn now carries
  who was asking, so gaps can be sliced per population.

## Phase 1 — Review queue + gap miner (build first; small)

One tab, two panes, all read-only over the two tables (reviewer/team-phrase
gated, the shared `cpl_sb` session):

1. **Feedback queue** — `sierra_feedback` newest-first; filters rating /
   audience / page / has-note; each row expands to the full Q + A + note.
2. **Gap miner over `chat_interactions`** — the log-informed view:
   - **thumbs-down clusters** (join `sierra_feedback` on question text /
     session) — what people rated down, grouped by recurring keywords;
   - **low-similarity turns** (`top_similarity` below ~0.55 or null) — the RAG
     corpus had nothing close: the single best "what artifact is missing" signal;
   - **"no answer" responses** (response LIKE the "I don't have…/contact
     MAP@rccd.edu" fallbacks) — where Sierra explicitly punted;
   - counts by `audience` so student-facing gaps rank first.

Add a small `status` column (`new / triaged / addressed`) on `sierra_feedback`
(reviewer-writable) so the queue drains instead of re-reading forever.

## Phase 2 — Guidance layer (response enhancements without a redeploy)

A `sierra_guidance` table (short rule text + active flag + author + timestamp;
reviewer/team-phrase write, service-role read). The `cpl-chat` function fetches
the active rows (bounded: top ~10, hard char cap) and appends them to the system
prompt alongside STATEWIDE/CREDIT/OFFERINGS/AUDIENCE rules.

- **Why:** today every wording tweak = a session editing + redeploying the
  shared function. A guidance table gives the team a same-minute knob, with the
  committed rules staying the stable spine.
- **Eyes open:** the function is shared — guidance rows steer the **production
  map.rccd.edu widget too** (that's the point, but the team must know); a
  guidance row is prompt text, so the write gate (reviewer/team-phrase) is the
  security boundary — never widen it to anon; keep an audit trail (no hard
  deletes, `active=false` instead).

## Phase 3 — Artifact ingestion into the RAG corpus (the "add data to the KB" half)

Upload/paste a document in the tab → chunk → embed (`gte-small`, the same model
the function queries with — embeddings must match) → insert into
`cpl_documents` + `cpl_document_sections`, tagged with source + uploader.
Mechanics: an `ingest` Edge Function (service-role, reviewer-gated caller) or a
runner workflow (the KB Portal composer pattern). Include a "test it" box (ask
Sierra a question, see whether the new sections surface) and a per-document
retire/rollback. This is the heaviest phase — build it after Phase 1 proves
which artifacts are actually missing.

## Guardrails / hardening lane (for Malone — pre-"Credit for Being Me")

Current state, honestly assessed (all in `cpl-chat` v22):

| Guard | Today | Gap |
|---|---|---|
| Rate limit | 20 req/min/IP, **in-memory Map** | Per-isolate + resets on cold start — under real load or a multi-instance scale-out it's porous. Needs a durable counter (Postgres table / KV) or an edge WAF in front. |
| Cost ceiling | none | No daily token/request budget. A scripted flood = an open Anthropic bill. Add a global daily counter → friendly 503 "Sierra is resting" past the cap + an alert. |
| CORS | allowlist, but includes `"null"` (file://) | The `"null"` origin was for local testing and is flagged "REMOVE before production" in-code — remove before Portal launch. (CORS never stops curl anyway; the anon key is public by design — the real controls are the two rows above.) |
| Abuse/spam content | 1000-char cap, nothing else | Consider simple heuristics (repeat-identical-query throttle, min interval per session) and, at the Portal layer, Turnstile/em>captcha on the widget boot. |
| Logging | anon `chat_interactions` (now reviewer-readable) | Good enough for forensics; add a weekly usage/cost digest so anomalies get seen. |

Recommended shape: a **`sierra-guardrails` workstream with Malone** — durable
rate limiting + daily budget breaker inside the function (no infra change), CORS
tightening, and Portal-side bot friction. None of it blocks the Training tab;
the budget breaker is the one piece worth landing **before** the Portal
publicizes the endpoint.

## Sequencing + effort (honest sizing)

| Phase | Size | When |
|---|---|---|
| 1 — Review queue + gap miner | ~1 session | On Sam's go |
| Guardrails: budget breaker + durable rate limit | ~1 session (with Malone for thresholds) | Before Portal launch |
| 2 — Guidance table | ~½ session | After the team has used Phase 1 |
| 3 — Artifact ingestion | 1–2 sessions | After Phase 1 shows which artifacts are missing |

**Decision requested from Sam:** green-light Phase 1 (a `#sierra-training` tab,
reviewer/team-phrase gated), and introduce the session to Malone for the
guardrails thresholds (rate, daily budget, launch date).
