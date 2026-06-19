---
title: Playbook — a live Edge Function 502 is often a RETIRED model id (diagnose via logs, fix via model swap)
date: 2026-06-19
updated: 2026-06-19
kb-status: published
type: playbook
tags: [cpl-assistant, cpl-chat, supabase-edge-function, anthropic-api, model-retirement, incident, playbook]
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts   # the shared Edge Function
  - docs/kb-notes/playbook-deploy-shared-supabase-edge-function.md
related:
  - CLAUDE.md §7c (CPL Assistant — shared+live invariants)
  - docs/cpl_assistant_lessons.md (Session 64 incident narrative)
---

# Playbook — a live Edge Function 502 is often a retired model id

**Incident (Session 64, 2026-06-19):** the CPL Assistant tab (and the production
`map.rccd.edu` widget — same shared `cpl-chat` function) returned *"Sorry —
something went wrong (error 502)."* on **every** question. Root cause: the function
called **`claude-sonnet-4-20250514`** (Claude Sonnet 4.0), which **Anthropic retired
2026-06-15** — 4 days earlier. A request to a retired model 404s; the function's
`if (!anthropicRes.ok) { … status: 502 }` guard turned that into the user-facing 502.

## Why this recurs

Anthropic retires dated model snapshots on a schedule (≈12+ months after release).
Any long-lived service that **pins a dated model id** (`claude-*-YYYYMMDD`) is on a
clock — it works until the retirement date, then 404s with no code change on your
side. Edge Functions are especially prone because they're deployed once and rarely
re-touched, so the pinned id silently ages out.

## Fast diagnosis (≈2 min, all read-only)

1. **`get_logs` (service `edge-function`).** A retired-model failure looks like:
   **POST → 502 in ~1–1.5 s** (fast — it's a quick 404 from Anthropic, *not* a
   timeout or a broken stream), with **OPTIONS → 204** healthy alongside. A boot/
   import error would 502 on *every* method including OPTIONS; a timeout would be
   slow (10s+). Fast POST-only 502s point at a downstream call.
2. **Read the function source** and find where it emits 502. In a RAG/LLM function
   there's usually exactly one such branch — the `!response.ok` check right after
   the Anthropic `fetch`. That localizes it to the model call.
3. **Confirm the model.** Grep the source for `model:`/`"model"`. Cross-check the id
   against the **`claude-api` skill's retired-models table** (invoke the skill —
   it's the source of truth; don't trust memory). `claude-sonnet-4-20250514`,
   `claude-opus-4-20250514` retired 2026-06-15; the 3.x snapshots earlier.
4. *(Optional, when egress allows)* reproduce with the public anon key — the
   function helpfully echoes the real Anthropic error in its 502 `details` field.

## The fix

Swap the dated id for the **active replacement** from the skill's table
(`claude-sonnet-4-20250514` → **`claude-sonnet-4-6`**). For a plain streaming call
with no thinking/sampling/prefill params, it's a **one-token drop-in** — none of the
Claude 4.x breaking changes apply, and the SSE `content_block_delta` / `message_delta`
event shapes the streaming loop parses are unchanged across the family. Then redeploy
per the shared-function playbook (capture the running version, `verify_jwt` stays
`false`, smoke-test all modes). The deploy is a one-shot via the Supabase MCP — **not**
the daily cron.

## Prevention

- **Prefer an unversioned alias** (`claude-sonnet-4-6`, not a dated snapshot) wherever
  the platform supports it — it tracks the active model and won't age out on a fixed
  date.
- **Sweep for siblings after any model-retirement fix.** Grep the whole repo for
  retired ids — other features may pin the same dead snapshot. (Session 64: the report/
  portal generators were on `claude-sonnet-4-5-20250929` = still active; quickstart on
  Haiku 4.5 = active. Only the chatbot was dead.)
- **Mind the calendar.** When you see a dated model id in long-lived code, note its
  retirement date; it's a latent outage.

## Generalizes to

Any always-on service calling a dated LLM snapshot — Edge Functions, Cloudflare
Workers, cron jobs, server backends. The signature (fast downstream-only 5xx, healthy
preflight, a single `!ok` branch) and the fix (skill-confirmed active id + careful
redeploy) are the same.
