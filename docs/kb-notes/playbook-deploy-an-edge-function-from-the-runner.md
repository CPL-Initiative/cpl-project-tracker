---
title: Deploy a Supabase Edge Function from the runner, not by hand
created: 2026-08-07
updated: 2026-08-07
tags: [playbook, sierra, cpl-assistant, supabase, deploy, ci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/kb-notes/methodology-assert-what-retrieval-returns]]"
  - "[[docs/cpl_assistant_lessons]]"
artifacts:
  - .github/workflows/cpl-chat-deploy.yml
---

# Deploy a Supabase Edge Function from the runner, not by hand

> **One-sentence summary** — passing a 66 KB function body inline to the MCP
> deploy tool means re-emitting every byte by hand into a live production
> surface; a dispatch-only workflow ships the exact bytes out of git instead,
> and this note carries the five distinct failures encountered getting there.

## Context

`cpl-chat` is the shared Edge Function behind Sierra: the map.rccd.edu widget,
the standalone Sierra page, the COBI tab, the Fact Sheet drawer and a vendor
iframe — all at once, with **no staging tier**. Every deploy before
2026-08-07 was a Claude session passing the whole file inline to the Supabase
MCP `deploy_edge_function` tool.

## Why the inline path had to go

1. **Size.** A 55 KB payload dropped mid-flight once ("permission stream
   closed", Session 94). `index.ts` reached 66 KB / 1,287 lines.
2. **Transcription.** The file carries non-ASCII (`Cañada`, box rules,
   arrows), tabs inside string literals, and ~9 KB of prompt text **where one
   dropped line changes answer behavior without breaking syntax**. The
   post-deploy byte-verify catches that only *after* it is live.

The runner checks the file out of git and ships those bytes. Neither failure
mode exists by construction.

## The workflow

`.github/workflows/cpl-chat-deploy.yml` — `workflow_dispatch` only, refuses
unless `confirm` is literally `DEPLOY`.

```yaml
- name: Deploy cpl-chat
  working-directory: chatbox        # ← see the trap below
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
  run: |
    test -f supabase/functions/cpl-chat/index.ts || { echo "::error::…"; exit 1; }
    supabase functions deploy cpl-chat \
      --project-ref hvuwhnbuahrtptokpqfh \
      --no-verify-jwt --debug
```

**`--no-verify-jwt` is pinned IN the workflow, not left to a caller.** The MCP
tool defaults `verify_jwt` to `true`, and v25 shipped `true` for ~40 minutes
once, which 401s every first-party surface. Encoded here it cannot be
forgotten — a genuine safety gain over the manual path, not just convenience.

## The five failures, in order

Getting the first successful run took five attempts and **five different
causes**. Worth knowing, because four of them look alike from a distance.

### 1. Secret absent

The guard fired. `SUPABASE_ACCESS_TOKEN:` printed empty in the step env.

### 2. 403 — and it is NOT 401

```
SUPABASE_ACCESS_TOKEN: ***          ← present, non-empty
unexpected list functions status 403
```

**401 = bad token. 403 = credential accepted, identity refused.** That
distinction is the whole diagnosis. A 403 is ambiguous between two very
different fixes, so rule out the credential TYPE first:

| Credential | Where | Deploys? |
|---|---|---|
| `eyJ…` anon / service_role JWT | Project Settings → API | ❌ data-plane only |
| `sb_secret_…` / `sb_publishable_…` | Project Settings → API keys | ❌ data-plane only |
| `sbp_…` **Personal Access Token** | **Account** → Access Tokens | ✅ |

Supabase renamed these, so three credentials look plausible in the dashboard
and **the two wrong ones 403 exactly like an under-privileged role does**.
The account-level token is not under the project at all, which is why people
land on the API Keys page and get stuck.

**Test the prefix in the workflow** — matching a prefix never reveals the
secret, and it converts an ambiguous 403 into a named cause:

```bash
case "$SUPABASE_ACCESS_TOKEN" in
  sbp_*)   echo "✓ correct type — a 403 here is an ORG ROLE problem" ;;
  eyJ*)    echo "::error::JWT, not a PAT"; exit 1 ;;
  sb_secret_*|sb_publishable_*) echo "::error::project key, not a PAT"; exit 1 ;;
esac
```

If it IS `sbp_` and still 403s, the remaining cause is the org role (Owner or
Administrator; Developer/Read-only is refused) or a scoped token.

### 3. GitHub API rate limit

```
##[error]Failed to resolve latest Supabase CLI release: rate limit exceeded
```

`supabase/setup-cli@v1` with `version: latest` resolves the release through
the GitHub API and hits the unauthenticated limit on shared runners. Transient
— retry, or pin a version. Nothing to do with Supabase.

### 4. Wrong working directory — the sneaky one

```
Error: entrypoint path does not exist (…/supabase/functions/cpl-chat/index.ts)
failed to bundle function: exit 1
```

The CLI resolves functions at `<cwd>/supabase/functions/<slug>/index.ts`. In
this repo the `supabase/` tree lives under `chatbox/`, not at the root.

**This surfaces AFTER authentication and AFTER a Docker image pull**, so it
reads like a deploy or permissions failure when it is purely a path problem —
and it stays masked as long as earlier attempts die at auth. Add an explicit
`test -f` so a path change fails immediately with a clear message.

### 5. Success

`version 28 → 29`, `verify_jwt: false`, and the entrypoint path in the
Supabase API response now reads
`…/cpl-project-tracker/chatbox/supabase/functions/cpl-chat/index.ts` —
proof it shipped from the runner's git checkout rather than a pasted blob.

## After a deploy

Dispatch `cpl-chat-smoke.yml` and read the assertions. It exercises the LIVE
function, so a red check before a deploy is telling you about production, not
about your diff.

## Setup (one time)

Repository secret **`SUPABASE_ACCESS_TOKEN`** — a Supabase *personal access
token* from https://supabase.com/dashboard/account/tokens. The existing
`SUPABASE_SERVICE_KEY` cannot be used; it is data-plane only. The project ref
is public and pinned in the workflow.

## Rollback

`git show <pre-change-sha>:chatbox/supabase/functions/cpl-chat/index.ts`,
commit it, re-dispatch. Because the runner ships from git, rollback is a
normal revert rather than a second hand-transcription.
