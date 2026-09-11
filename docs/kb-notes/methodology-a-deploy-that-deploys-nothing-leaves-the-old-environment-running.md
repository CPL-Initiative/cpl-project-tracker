---
title: A deploy that deploys nothing leaves the old environment running
created: 2026-09-11
updated: 2026-09-11
tags: [methodology, deployment, supabase, edge-functions, incident]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - .github/workflows/cpl-chat-deploy.yml
---

# A deploy that deploys nothing leaves the old environment running

> **One-sentence summary** — re-running a workflow on an unchanged commit ships
> byte-identical source, which the platform deduplicates into no new version, so
> the running workers never restart and never re-read the configuration you just
> changed — and both the workflow and the dashboard report success throughout.

## Context

During a live outage, Sierra was reverted to a known-good model by setting a
Supabase secret, and the deploy workflow was re-run to pick it up. Neither took
effect. Two further attempts were made on the belief that the revert had been
applied and had not helped, which sent the diagnosis in the wrong direction for
half an hour. See `docs/cpl_assistant_lessons.md`, 2026-09-11.

## The claim

**Configuration is read at process start, so changing it is inert until something
restarts the process.** For a serverless function the restart is a side effect of
deploying a *new version* — and deploying the *same* version is not a restart.

The chain has three links and each one looks fine on its own:

1. **A re-run is not a new run.** Re-running a workflow re-executes it against the
   original `head_sha`. The source it uploads is byte-identical to what is already
   deployed.
2. **Identical content is deduplicated.** The platform recognizes it, keeps the
   existing version, and returns success. Nothing is wrong and nothing happened.
3. **No new version means no new workers.** The running instances keep the
   environment they booted with, so the secret you changed is never read.

**Every status in that chain is green.** The workflow says success, the dashboard
says the function is ACTIVE, and the only place the truth appears is the version
number and its timestamp.

**So the check is not "did the deploy succeed" — it is "did the version move."**
A deploy whose version did not change did nothing, whatever it reported.

**Corollary: a config-only change needs a source change to land.** If the only
thing you altered is a secret or an environment variable, there is nothing for the
platform to deploy. Either make a real source change, or use a restart mechanism
that does not depend on content differing.

## How we got here

Measured, not inferred. `list_edge_functions` reported the function at
**version 63, `updated_at 2026-09-10T22:35:10Z`** — the *previous day's* deploy —
after a re-run that GitHub recorded as run 40, attempt 2, conclusion success. The
running model was then confirmed independently from the function's own telemetry:
the prompt-cache line showed the same signature as before the "revert", where the
two models differ unambiguously (one cached a 4,476-token prefix on 23 of 23
requests, the other cached nothing on 48 of 48).

## When this applies (and when it doesn't)

**Applies** to any platform where deploying is content-addressed and configuration
is injected at boot: serverless functions, container images pinned by digest,
anything where "redeploy" can become a no-op because the artifact is unchanged.
Also to config reloads generally — a value read once into a module-level constant
is frozen for that process's life however many times you change its source.

**Does not apply** where configuration is read per-request, or where the platform
offers an explicit restart that is independent of content. There, changing the
value is sufficient and this whole failure mode is unreachable.

**The limit:** this note says how to verify a deploy landed, not how to force one.
The forcing mechanism is platform-specific — a real source change is the portable
answer, and it is why an incident fix and a source edit often want to ship
together.

## See also

- `[[docs/cpl_assistant_lessons]]` — the incident that produced this
- `[[docs/kb-notes/methodology-an-error-inside-a-success-is-invisible-to-every-status-check]]`
  — the same family, one layer down: a green status over work that did not happen

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
