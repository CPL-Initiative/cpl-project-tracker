---
title: Playbook — redeploying a shared, live Supabase Edge Function safely
created: 2026-06-01
updated: 2026-06-01
tags: [playbook, supabase-edge-function, deploy, rollback, cors, verify-jwt, sse]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/cpl-chatbox-integration-scope]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - chatbox/supabase/functions/cpl-chat/index.ts
  - chatbox/README.md
  - cpl_chat.js
---

# Playbook — redeploying a shared, live Supabase Edge Function safely

> **One-sentence summary** — when an Edge Function is called by *more than one*
> surface (e.g. a public production widget **and** a new dashboard tab),
> redeploying it is a **global, blast-radius'd** change: capture the running
> version first, preserve `verify_jwt`, lean on Deno's fail-closed deploy, and
> smoke-test every code path before you call it done.

## Context

The CPL Assistant tab (Session 26) reuses the *same* live `cpl-chat` Edge
Function that powers the production map.rccd.edu widget — same function, same
Supabase tables. "Bringing it into the dashboard" needed exactly one backend
change (a CORS origin) + a redeploy. That redeploy is the dangerous step,
because it ships to the live widget too. This note distills the safe procedure
so the next session (or a peer college doing the same) doesn't learn it the hard
way. Workstream: `[[docs/cpl_assistant_lessons]]`.

## The claim

A redeploy of a shared Edge Function is a **production change to every caller**,
not a sandboxed dev push. Treat it like one:

1. **Verify live state first.** Versions drift across docs/sessions
   (SKILL.md said v12, live was v13, we shipped v14). `list_edge_functions` /
   `get_edge_function` is the authoritative read — not the repo, not a note.
2. **Capture the running version → that's your rollback.** `get_edge_function`
   the current source and stash it before you change anything. Deno validates
   syntax at deploy time and **fails closed** (a bad *syntax* deploy leaves the
   prior version running), but a deploy that's syntactically fine yet
   *semantically* broken still needs a known-good artifact to revert to.
3. **Preserve `verify_jwt`.** If the function does its own gating (anon-key
   check + rate limit), it runs with `verify_jwt:false` on purpose. The
   `deploy_edge_function` call must pass `verify_jwt:false` **explicitly** —
   omitting/defaulting it can flip the flag and 401 every existing caller.
4. **Make the smallest possible diff.** For an integration, the change is often
   one line (add a CORS origin). Capture-then-add-one-line keeps the redeploy
   auditable: the deployed function == the live one + a known delta.
5. **Smoke-test every mode after deploy.** A function that branches (RAG /
   college-specific / topic / combined) can pass syntax yet break one branch.
   Exercise each path before declaring done.
6. **The data/content is separate from the function.** If content lives in
   tables (RAG corpus), swapping content is independent of the function deploy —
   but it's *also* global (every caller sees the new corpus). Sequence and gate
   the two changes independently.

## How we got here

Phase 1 of the chatbox integration (PR #230): captured live v13, added
`https://cpl-initiative.github.io` to `ALLOWED_ORIGINS`, redeployed v13 → **v14**
via the Supabase MCP `deploy_edge_function` (`project_id`,
`name: cpl-chat`, `entrypoint_path: index.ts`, `verify_jwt: false`,
`files:[{name,content}]`), confirmed v14 ACTIVE via `list_edge_functions`, and
Sam smoke-tested the live tab ("Works fantastically!"). The captured-v13
artifact + the fail-closed property were the two things that made redeploying a
shared production function low-risk. Deploy mechanics + the request/response
(SSE) contract live in `chatbox/README.md`.

## When this applies (and when it doesn't)

- **Applies** whenever an Edge Function (or any deployed serverless endpoint) is
  shared by ≥2 surfaces, or is public-facing, or holds its own auth/rate-limit
  logic — i.e. a redeploy isn't isolated to your dev surface.
- **Doesn't apply** to a single-consumer, sandboxed, or branch-isolated function
  (Supabase branches give you a true sandbox). If you can deploy to a `*-dev`
  function the dev surface points at, and promote later, you don't need this
  discipline — but you trade it for a promotion step.
- The **content swap** (re-indexing the RAG corpus) is a *different* global
  change with the same "shared backend" caveat — see the scope note's GLOBAL
  warning; gate it separately from the function deploy.

## See also

- `[[docs/cpl_assistant_lessons]]` — the workstream that produced this
- `[[docs/kb-notes/cpl-chatbox-integration-scope]]` — the Phase-0 scope + the
  shared-backend GLOBAL-swap finding
- `chatbox/README.md` — deploy fields + the SSE request/response contract
- PR `#230` — the Phase 1 implementation (backend redeploy + front-end tab)
- CLAUDE.md §7c — the CPL Assistant operational invariants

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
