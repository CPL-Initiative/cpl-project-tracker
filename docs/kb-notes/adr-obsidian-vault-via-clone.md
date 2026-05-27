---
title: ADR — Obsidian sync via vault-side clone (not edge function)
created: 2026-05-27
updated: 2026-05-27
tags: [adr, obsidian-target, vault-wiring, knowledge-base]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/INDEX]]"
  - "[[docs/kb-notes/README]]"
artifacts:
  - docs/kb-notes/
  - docs/INDEX.md
  - .claude/commands/checkpoint.md
---

# ADR — Obsidian sync via vault-side clone (not edge function)

> **One-sentence summary** — Sam's Obsidian vault sees this repo's docs by
> having a local git clone of `cpl-project-tracker` mounted inside the vault
> path; no edge function, no cross-repo Supabase push, no MCP-mediated write.

## Context

Session 11 surfaced that "sync to Obsidian via the repo" (as written in
CLAUDE.md Rule 8) was incomplete: the `cpl-project-tracker` repo wasn't
actually cloned into Sam's Obsidian vault, so Obsidian had no way to see
session-authored docs. Two architectural options on the table:

1. **Vault-side clone** — clone this repo into
   `CPLBrain\COG-second-brain\cpl-project-tracker\`, parallel to the
   already-vault-cloned `cpl-knowledge-base/`. Obsidian indexes
   automatically.
2. **Edge-function push** — write a Cloudflare Worker (or similar) that
   accepts inbound KB-note payloads from this repo and writes them into
   the `cpl-knowledge-base` repo's structure via the GitHub API. Sam's
   vault pulls from cpl-knowledge-base; no in-vault clone of this repo
   needed.

## The claim

**Vault-side clone wins for this repo's KB-contribution use case.** Reasoning:

1. **Parity with established pattern.** `cpl-knowledge-base` is already
   vault-cloned. Doing the same thing for `cpl-project-tracker` keeps Sam's
   mental model consistent — every CPL-related repo lives in the vault, full
   stop. New patterns introduce cognitive cost without buying anything.

2. **Zero new infrastructure.** Vault clone is `git clone` once + `git pull`
   as desired. Edge functions need: a worker, an auth shape, payload schema
   versioning, a CI step in this repo to invoke the push, and a recovery
   story for failures. All of that is project surface; the clone is one
   command.

3. **Obsidian sees the FULL repo, not just curated outputs.** With the
   clone, Sam can browse `CLAUDE.md`, lessons docs, session handoffs,
   AND KB candidates in one place. Edge-function approach only ships
   the curated `docs/kb-notes/` subset; the rest stays invisible to the
   vault.

4. **Edge functions have a real-world risk we don't need.** The
   cpl-knowledge-base Supabase project (`mdxutmbpoqjtdcwjscux`) is shared
   with the live legislative campaign per `docs/letter_curator_handoff.md`.
   A poorly-scoped edge-function write into that repo could collide with
   campaign content, or trip RLS, or require schema migration on a
   sensitive shared resource. The clone has none of that risk.

5. **Promotion-to-cpl-knowledge-base remains a future option.** A future
   bridge can lift `published` KB notes into the cpl-knowledge-base
   structure (manual cp, or eventually automated). The vault-side clone
   doesn't preclude this; it's a strictly wider foundation.

## How we got here

- Session 11 (Bruh El) recommended the vault-side clone after extracting
  Sam's directory tree from an uploaded docx (`20260527 Obsidian and CPL
  KB.docx`).
- Sam executed the clone the same session:
  `git clone https://github.com/CPL-Initiative/cpl-project-tracker.git`
  in `CPLBrain\COG-second-brain\`, 364 MB checkout.
- Excluded-paths recommendation accompanied the clone to keep Obsidian's
  graph clean (heavy JSON/JS files filtered out via Settings → Files &
  Links → Excluded files).

## When this applies (and when it doesn't)

**Applies:**
- Any repo whose docs should appear in Sam's Obsidian vault.
- Any "sync source markdown to the vault" use case where the source repo
  is git-public.

**Does NOT apply:**
- Live-data push (live metrics, KPI snapshots) — those flow through the
  daily cron + GitHub Pages, not through Obsidian.
- Sensitive content that shouldn't appear in a vault git clone (none in
  scope today).
- The cpl-knowledge-base bridge for `promoted` notes — that's a
  separate, future, opt-in path that doesn't replace the clone.

## See also

- `[[CLAUDE]]` — "Obsidian vault wiring" section captures the canonical
  paths.
- `[[docs/kb-notes/README]]` — the lane contract this ADR established.
- `[[docs/INDEX]]` — the auto-maintained landing page Obsidian sees first.

---

*Authoring check: durable (vault-wiring won't change on a per-workstream
basis), reusable (future sessions, peer projects, anyone setting up a
similar Claude-Code-+-Obsidian workflow), distilled (one decision, one
rationale), self-contained.*
