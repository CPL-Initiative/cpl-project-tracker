---
title: "TypeSafe (Jev) — the key, the wire contract, and the two blockers"
date: 2026-09-20
session: 279 (SkyKeeper)
tags: [reference, typesafe, jev, secrets, integration, tooling]
kb-status: internal
obsidian-folder: cpl-project-tracker/reference
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/approval_prompt_hooks]]"
  - "[[docs/reference/dependency_map]]"
---

# TypeSafe (Jev)

Sam asked to integrate TypeSafe on 2026-09-20. **Jev** is TypeSafe's first
"System One" model: it answers small typed questions about a piece of state and
returns a structured answer with a probability, rather than prose. One endpoint
serves all of it.

**Status: plumbing only.** The client, the smoke test and the CI guard are in.
No MAP data goes to TypeSafe, and the governance gate below is why.

## The wire contract (verified 2026-09-20)

⚠️ **Read off `@typesafe-ai/sdk@0.6.0`'s published dist, not off the docs.**
`docs.typesafe.ai` is egress-blocked from the agent sandbox, and
`registry.npmjs.org` is reachable, so the SDK is the only source a session can
actually check. Re-verify against a newer SDK before assuming it still holds.

| Thing | Value |
|---|---|
| Auth | `Authorization: Bearer <key>` |
| Endpoints | `POST /v1/systemone` · `GET /v1/models` |
| Base URL | `https://api.typesafe.ai` (override: `TYPESAFE_BASE_URL`) |
| Key | `TYPESAFE_API_KEY` |
| Model | `TYPESAFE_DEFAULT_MODEL`, default `jev-latest` |
| Log level | `TYPESAFE_LOG_LEVEL` |
| Body | `{state, questions, model}` |
| Response | `{answers: {<name>: {...}}}` — keyed by the caller's question name |

Three question shapes, discriminated by `type`:

- **`noul`** — yes/no. `noul(instructions, criteria=None)`.
- **`choice`** — named alternatives. `criteria` is a **map** of label to
  description; a list raises.
- **`score`** — an ordered rubric. `criteria` is a **list** of at least two
  descriptions indexed from zero; a map raises.

⚠️ **A web-search summary claimed the key variable was `TYPESAFE_AI_API_KEY`.**
The SDK says `TYPESAFE_API_KEY`. A wrong name fails silently as "no key
configured" while a good secret sits in the repo unread, so
`tests/typesafe_client_test.py` pins it.

## Where the key lives

**A GitHub Actions repository secret named `TYPESAFE_API_KEY`**, matching the
existing `MAP_API_KEY` / `SUPABASE_SERVICE_KEY` pattern (Sam's call, 2026-09-20).

**A session cannot create it** — no MCP tool exposes secret writes, which is
correct. Sam runs one of:

    gh secret set TYPESAFE_API_KEY --repo CPL-Initiative/cpl-project-tracker

(it prompts for the value and never echoes it), or Settings → Secrets and
variables → Actions → New repository secret.

⚠️ **The key belongs in no file in any of the three repos**, and no session
should ever be handed the value in chat — a key in a transcript is a key to
rotate. Checked 2026-09-20: no TypeSafe string appears in any working tree or
in history across every ref in all three repos.

## Two blockers a session cannot clear

1. **`typesafe.ai` is egress-blocked from the agent sandbox.** The proxy gateway
   answers 403 to CONNECT on `api.`, `docs.` and the apex. A session can neither
   call Jev nor read its docs. **The workaround is the runner** — the same
   runner-as-proxy pattern `map-users-schema-probe.yml` uses for the Azure MAP
   API. Clearing it for good means changing the environment's network policy
   where the environment was created.
2. **The skill does not reach cloud sessions.** Account plugins and skills both
   read empty here, and both synced buckets on disk are empty. A
   `claude plugin install` on a local machine stays on that machine — the
   boundary `approval_prompt_hooks.md` documents for settings applies to plugins
   installed by CLI. The persistence routes in the S279 handoff apply unchanged;
   the **cloud environment setup script** remains the recommended one.

## Verifying the key

Dispatch **TypeSafe (Jev) smoke test** (`.github/workflows/typesafe-smoke.yml`).
Dispatch-only on purpose: a `pull_request` trigger hands the secret to any fork
that opens a PR, and each run spends a real API call.

- default: auth plus `GET /v1/models`
- `full: true`: also spends one System One call end to end

It prints the key's presence and length, never its value, and flags surrounding
whitespace — a pasted trailing newline is the usual cause of a key that "is set"
and still 401s. `kb/typesafe_client.py` redacts the key out of error bodies
before raising, because this repo's Actions logs are readable by anyone who can
read the repo.

## The gate before Jev sees MAP data

Typed judgments fit several open lanes — discipline and SUBJ4 inference against
the Rule 7 TOP problem, exhibit and CR title canonicalization, local course to
CR alignment scoring. Each one sends course, credential or articulation text to
a third party.

**Route the first real use through Governance before it ships**, the way
Rule 10(a3) routes a new write surface: name what leaves, check it against the
student-detail disclosure boundary
([`adr-student-detail-aggregate-disclosure-control`](../kb-notes/adr-student-detail-aggregate-disclosure-control.md)),
and record the decision. Course and credential titles carry no student PII,
which makes this a gate to walk rather than a wall — walk it anyway, and write
down the answer.

## Files

| File | What |
|---|---|
| `kb/typesafe_client.py` | The client. The one place the key is read. Import it, never copy it. |
| `kb/_typesafe_smoke.py` | The probe. Exit 0 pass · 1 failure · 2 no key. |
| `.github/workflows/typesafe-smoke.yml` | Dispatch-only runner-as-proxy verification. |
| `tests/typesafe_client_test.py` | 22 checks, in `js-tests.yml`. Pure stdlib, no network. |
