---
title: CPL Chatbox → Dashboard integration + cpl-knowledge-base re-point (Scope)
date: 2026-06-01
kb-status: published
kb-type: playbook
tags: [chatbox, rag, supabase-edge-function, cpl-knowledge-base, student-portal, scope]
related:
  - CLAUDE.md §8 (Supabase) + §3 (Cloudflare Worker proxy) + §7b (tab layout)
  - quickstart.js (Claude-via-proxy precedent + DOM scaffolding to reuse)
  - budget-support/web/curator.html (Letters tab — iframe-embed precedent)
  - the uploaded cpl-chatbox SKILL.md (system-of-record for the chatbox today)
artifacts:
  - "Supabase edge function: cpl-chat (project hvuwhnbuahrtptokpqfh, v13, ACTIVE)"
  - "Supabase tables: cpl_documents, cpl_document_sections, chat_interactions, chat_analysis, chatbox_college_profiles, chatbox_exhibits"
  - unified_courses.js (already embeds SUPABASE_URL + anon key the chat panel reuses)
  - CPL_Dashboard.html / index.html (tab nav + panes — Rule 4 mirror)
---

# CPL Chatbox → Dashboard integration + cpl-knowledge-base re-point (Scope)

> **One-sentence summary** — the chatbox's entire RAG backend already lives in
> the *same* Supabase project the dashboard uses (`hvuwhnbuahrtptokpqfh`), so
> "migrating it into the dash" is mostly a front-end tab + one CORS line +
> version-controlling the source; re-pointing content from the private CPLBrain
> vault to the public `cpl-knowledge-base` repo is a clean, independent swap
> because content lives in tables, not in the function.

## Context

Sam wants to (1) bring the existing CPL Chatbox (RAG widget currently live on
map.rccd.edu) into the project-tracker dashboard as a tab so it can be developed
in-repo, (2) re-point its knowledge source from the private `samueltlee/CPLBrain`
vault to the public `CPL-Initiative/cpl-knowledge-base` repo, and (3) keep it
portable for a future Student CPL Portal embed in MAP. This doc is the
feasibility verdict + the per-PR scope + the locked decisions. **No code ships from
this doc** — it's the contract reviewed before any build PR.

**STATUS: APPROVED 2026-06-01.** Sam green-lit the initiative and accepted all
six fork recommendations ("Your picks are fine!"). Forks A–F below are now
*locked decisions*, not open questions. The one residual sub-decision is fork F's
Phase-2 isolation choice (does the live map.rccd.edu bot flip to KB content at
the same time?) — resolved when Phase 2 starts, not now.

## Feasibility verdict: HIGH — most of the expensive work is already done

Verified live against Supabase project `hvuwhnbuahrtptokpqfh` (the dashboard's
own project per CLAUDE.md §8):

| Chatbox component | State today | Implication |
|---|---|---|
| `cpl-chat` Edge Function | **ACTIVE, v13**, `verify_jwt:false` | Publicly callable with the anon key — no port needed |
| `cpl_documents` / `cpl_document_sections` | 41 docs / 344 RAG chunks (pgvector) | RAG corpus already indexed (from CPLBrain) |
| `chatbox_exhibits` | **2,397 rows** | Topic search corpus already loaded |
| `chatbox_college_profiles` | **122 colleges** (landing URLs) | College-profile corpus already loaded |
| `chat_interactions` / `chat_analysis` | 25 / 0 | Logging + feedback loop already wired |
| Embeddings | `gte-small` (384d) native in the Edge runtime | No embedding infra to add |
| Anthropic key | `ANTHROPIC_API_KEY` already a project secret | No new key/billing to provision |
| Live KPI feed | Edge Function fetches `live_metrics.json` from **this repo's** `main` | The bot already reads project-tracker data |

**The chatbox is not a separate system to stand up — it's already co-resident
with the dashboard's data.** The only backend gap is CORS (below).

## What "migration" actually means here (re-frame)

Four small, mostly-independent pieces — not a port:

1. **One CORS line.** The Edge Function's `ALLOWED_ORIGINS` =
   `["https://map.rccd.edu","http://localhost","http://localhost:3000","http://localhost:8000","null"]`.
   It must add **`https://cpl-initiative.github.io`** to be callable from the
   deployed dashboard. (Good moment to also drop the `"null"` file:// origin its
   own comment flags as "REMOVE before production.")
2. **A chat panel (front-end).** A new static `cpl_chat.js` that POSTs
   `{query, session_id}` to `…/functions/v1/cpl-chat`, reads the SSE stream
   (`event: sources` → `event: text` deltas → `event: done`), and renders it.
   Reuses the `SUPABASE_URL` + anon key already embedded in `unified_courses.js`
   and the DOM/markdown-lite scaffolding already in `quickstart.js`.
3. **A tab.** Per CLAUDE.md §7b / `tabs.js`: drop a `<button class="cpl-tab"
   data-tab="chatbot">` + a `<div class="cpl-tab-pane" data-tab="chatbot">` +
   the script tag. `VALID_TABS` auto-derives. Add a `quickstart.js` `TABS` row so
   the router knows it. Mirror to `index.html` (Rule 4); CSS into
   `EXHIBIT_ANALYSIS_CSS` so the daily regen preserves it (Rule 1/2).
4. **Re-point content (independent).** Stop indexing CPLBrain; index
   `cpl-knowledge-base` into the *same* `cpl_documents`/`cpl_document_sections`
   tables. The bot answers from the new corpus instantly — content lives in
   tables, the function is content-agnostic.

## Precedents already in-repo (nothing novel to invent)

- **`quickstart.js`** — calls Claude through the Cloudflare proxy, has the exact
  DOM helpers + JSON/markdown handling a chat panel needs. (It is *non*-streaming
  and goes through the Worker; the chat panel instead hits the Edge Function
  directly for SSE — but the UI scaffolding transfers.)
- **`report_generator.js` / `college_report_generator.js`** — Claude-via-proxy
  feature precedent.
- **Letters tab** (`budget-support/web/curator.html`, iframe) — precedent for
  embedding a Supabase-backed feature as a tab. Notably it points at
  cpl-knowledge-base's *own* Supabase project (`mdxutmbpoqjtdcwjscux`), proving
  the multi-project pattern — but the chatbox needs **no** second project; it's
  already on `hvuwhnbuahrtptokpqfh`.

## ⚠ The one non-obvious risk: the backend is SHARED, so a content swap is GLOBAL

Because the dev tab and the live map.rccd.edu widget call the **same** Edge
Function + **same** tables, re-pointing content (Phase 2) changes the **live
map.rccd.edu bot too** — it's not isolated to the dashboard. That is arguably
desirable (one consistent bot on the public KB), but Sam must choose:

- **(F-shared)** Develop against the shared live backend. Phase 1 (UI) is safe.
  Phase 2 (content swap) flips both surfaces at once.
- **(F-isolated)** True sandbox for content: a parallel sections table
  (e.g. `cpl_document_sections_kb`) + a `cpl-chat-dev` function the dev tab
  points at, promoted to the live function once happy.

**Rec:** Phase 1 against shared (safe). For Phase 2, default to **F-shared**
unless Sam wants the live bot left on CPLBrain while trialing the KB — the public
KB is the *better* source for a public bot, so flipping both is usually the goal.

## Locked decisions (approved by Sam, 2026-06-01 — "Your picks are fine!" + "Go for it!")

All recommendations accepted. The "Decision" column is now binding.

| # | Fork | Decision |
|---|---|---|
| A | Content source | **Replace** CPLBrain with cpl-knowledge-base (privacy win — see below) |
| B | UI shape | **Native `cpl_chat.js` panel** — themeable + the literal artifact the Student Portal will embed |
| C | Source-of-truth for widget+function code | **Into this repo** (`cpl-project-tracker/chatbox/`); deploy function via Supabase MCP/workflow |
| D | Indexer location | **cpl-knowledge-base repo** — re-indexes on its own push, no cross-repo PAT; build touches 2 repos |
| E | Widget source | **Rebuild fresh** from quickstart scaffolding (~300–400 lines). Reuse the existing widget only if Sam drops the file in |
| F | Isolation | **Shared backend for Phase 1.** Phase-2 isolation sub-decision (flip the live bot too?) deferred to Phase 2 start |

## Privacy: the content swap is a privacy *upgrade*, not just a feature

This dashboard is a **public** GitHub-Pages repo and the bot is public-facing.
Today it RAGs over `CPLBrain` — Sam's **private personal** second brain (daily
notes, personal, competitive folders are allowlist-excluded, but the risk
surface is a private vault feeding a public bot). `cpl-knowledge-base` is the
**public** curated KB — the correct corpus for a public/student bot. So the
re-point should be treated as part of making it safe to surface in the dash, not
a later nicety. Keep `chat_interactions` RLS at **anon-INSERT / no-SELECT**, and
add a "don't enter personal info" line to the panel (visitor questions are
logged).

## Phased plan

**Phase 0 — recon / measure-first (no code).** `add_repo` cpl-knowledge-base to
the session; inspect its markdown + frontmatter for RAG-readiness (heading
structure, `public:`/`draft:` flags) and whether an indexing workflow already
exists; snapshot `cpl_documents`/`cpl_document_sections`; confirm the Anthropic
spend cap; lock forks A–F.

**Phase 1 — chatbox live in the dash (still CPLBrain content).**
- *PR-1 (backend):* fold the Edge Function source into `chatbox/supabase/functions/cpl-chat/index.ts`; add `https://cpl-initiative.github.io` to `ALLOWED_ORIGINS` (drop `"null"`); redeploy via `deploy_edge_function`. Only backend change.
- *PR-2 (front-end):* `cpl_chat.js` (SSE reader, sources + streamed answer, `crypto.randomUUID()` session, markdown-lite) + `#tab-chatbot` nav button/pane/script + CSS in `EXHIBIT_ANALYSIS_CSS` + `quickstart.js` TABS row; mirror to `index.html`. Label it **Beta / dev**.
- *Result:* working RAG chatbot tab — answers from current corpus + live KPIs + 2,397 exhibits + 122 college profiles.

**Phase 2 — re-point content to cpl-knowledge-base (independent; see GLOBAL note).**
- *PR-3 (in cpl-knowledge-base repo):* indexing workflow + `index_vault.py` + `chatbox_config.py` (folder allowlist for the KB layout) + `requirements.txt`; manual first run.
- *Data op:* snapshot, then clear `cpl_document_sections` + `cpl_documents`, re-index from the KB. `chatbox_exhibits`/`chatbox_college_profiles` untouched (they're MAP-derived, not vault-derived).
- *Verify:* ask the bot something only the KB answers.

**Phase 3 — Student-Portal readiness.**
- Make `cpl_chat.js` self-contained behind a tiny config block (Supabase URL/anon, function URL) so the same panel drops into the Student Portal with just a CORS origin add for that domain.
- Confirm rate-limit + spend cap suit a wider audience (consider Haiku for the dev tab to cut cost).
- *Optional enhancement:* regenerate `chatbox_exhibits`/`chatbox_college_profiles` from the project-tracker daily pipeline (it already has all the MAP data) so the bot's exhibit/college corpus tracks the dashboard instead of a separate extract.

## Effort estimate

- Phase 1: **~1 session, 2 PRs** (1 backend line + 1 self-contained JS module + tab wiring). Low risk.
- Phase 2: **~1 session**, touches 2 repos + one snapshotted data op. Medium (the GLOBAL-swap decision is the gate, not the code).
- Phase 3: **small**, mostly config + an optional pipeline enhancement.

## When this applies (and when it doesn't)

Applies because backend + dashboard are the **same Supabase project** and the
function already reads this repo's `live_metrics.json`. If the chatbox had been
on a separate Supabase project (as the Letters/cpl-knowledge-base feature is),
this would be a heavier cross-project integration. Re-validate the live state
(`list_edge_functions`, `list_tables`) before building — versions move (it was
v12 in the SKILL.md, v13 live).

## See also

- Uploaded `cpl-chatbox` SKILL.md — current chatbox system-of-record.
- CLAUDE.md §3 (Cloudflare proxy), §7b (tabs), §8 (Supabase).
- `quickstart.js` / `budget-support/web/curator.html` — the two build precedents.
