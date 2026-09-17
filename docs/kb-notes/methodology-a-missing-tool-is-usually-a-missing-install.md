---
title: A tool the sandbox lacks is usually one install away, and a boot test is cheaper than a preview deploy
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, sierra, deno, edge-function, sandbox, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-monitor-that-is-not-a-browser-cannot-see-a-browser-failure]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - .github/workflows/cpl-chat-preview-ab.yml
---

# A tool the sandbox lacks is usually one install away, and a boot test is cheaper than a preview deploy

> **One-sentence summary** — "There is no Deno in the sandbox" was a missing install rather than a missing capability: `npm install deno@2` gives a working binary in four seconds, `deno check` then reports the edge function's type errors, and `deno run --no-check` with dummy environment variables proves the module boots — the check that catches a boot-time `ReferenceError` before any deploy.

## Context

Two handoffs in a row said the shared Edge Function could not be typechecked
locally, so the only evidence that a change boots was to deploy it to the
preview slug and run the full smoke suite twice (about 14 minutes and double
the model calls). Story: `docs/cpl_assistant_lessons.md` (2026-09-17, S273).

## The claim

**1. Install before you conclude.** The sandbox has Node and npm and outbound
HTTPS through the proxy. Deno ships on npm: `npm install deno@2` in a scratch
directory puts `node_modules/.bin/deno` (2.9.x) in place. Set `DENO_CERT` to the
proxy's CA bundle so `jsr:` and `npm:` fetches verify.

**2. Typecheck with the edge runtime's types resolvable.** `deno check` on the
bare file fails resolving `npm:openai` types that the Supabase edge-runtime
`.d.ts` references. A `deno.json` of `{"nodeModulesDir":"auto"}` beside a copy of
the file lets Deno auto-install them; then `deno check --no-lock` runs.

**3. Attribute errors against `main` before reading them.** The function has
**15 pre-existing strict-mode errors on `main`** (implicit `any` on callback
parameters, a nullable array passed to a non-null parameter). Check the branch
and `main` both, strip line numbers, and diff the error sets: identical sets
mean the branch adds none. The Supabase CLI deploy does not typecheck, which is
why production runs with them; they are worth clearing, not a blocker.

**4. Boot-test the module.** `deno run --no-check --allow-env --allow-net
--allow-read` with dummy `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`SUPABASE_ANON_KEY` and `ANTHROPIC_API_KEY`, under `timeout 12`, evaluates the
module top to bottom and starts `Deno.serve`. Exit 124 means it was still
serving when the timeout fired — it booted. A const referenced before its
declaration (the TDZ class the file's own header warns about) throws here in
one second instead of after a deploy.

## How we got here

S273 needed evidence that #1603's function booted before recommending a
deploy, tried the install instead of accepting the handoff's line, and had the
typecheck and the boot test inside two minutes. The preview A/B still ran — it
is the only instrument that reads Sierra's real answers — but it is no longer
the only way to learn whether the function starts.

## When this applies (and when it doesn't)

The boot test proves module evaluation and nothing about behavior: the sandbox
is egress-blocked from `*.supabase.co`, so no retrieval runs and no answer is
produced. It cannot replace the preview A/B for answer quality, and the A/B in
turn cannot see a route that fails safe — read the function logs after it
(`methodology-a-retrieval-route-costs-what-the-synonym-table-decides`).

## See also

- `docs/cpl_assistant_lessons.md` — 2026-09-17 (S273)
- `.github/workflows/cpl-chat-preview-ab.yml`
