---
title: KB Notes — Lane README
created: 2026-05-27
updated: 2026-05-27
tags: [meta, kb-lane, obsidian-target]
kb-status: internal
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/INDEX]]"
---

# KB Notes — Lane README

This folder is the **proactive KB-contribution lane** for `cpl-project-tracker`.
Every note in here is authored with the assumption it will be **read in Sam's
Obsidian vault** (mirrored via the vault-side clone at
`CPLBrain/COG-second-brain/cpl-project-tracker/`).

## Three lanes — what goes where

| Lane | Path | Purpose | Lifecycle |
|---|---|---|---|
| **Lessons (WIP scratchpad)** | `docs/<workstream>_lessons.md` | Dated session-appended notes per workstream. Rule 8 mandate. | Append-only, lives forever. |
| **Session handoffs** | `docs/session_<N>_handoff.md` | "Fattyfat prompt" capsule for the next session. | One per session, lives forever. |
| **KB notes (this lane)** | `docs/kb-notes/<topic>.md` | **Distilled, durable, reusable.** Methodology, patterns, references, ADRs, glossary cards. | Edited in place over time; promoted via `kb-status` field. |

The lessons docs are where I think out loud during a workstream. KB notes are
where I publish a finding once it's stable enough that *future me / future
sessions / Sam in a quiet moment* should be able to read it cold.

## Frontmatter contract (mandatory)

Every `.md` in this folder MUST carry this frontmatter:

```yaml
---
title: <human-readable, sentence-case>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: [<one-of-the-types>, <topic-tags>]
kb-status: candidate | promoted | archived | internal
obsidian-folder: cpl-project-tracker/kb-notes  # optional vault-side hint
related:
  - "[[wikilink]]"
  - "[[docs/another-note]]"
artifacts:
  - path/to/code-or-data.py                    # optional, when the note documents code
---
```

### Tag taxonomy (start here, grow as needed)

**Type tags** (pick exactly one):
- `methodology` — reusable pattern or framework (e.g. "per-field penalty generalization")
- `reference` — distillation of an external authoritative source (ASCCC, COCI manual, AB 123)
- `adr` — Architecture Decision Record (we picked X over Y because Z)
- `glossary` — single-concept lookup card (terms, agencies, roles)
- `playbook` — step-by-step procedure (re-mints, releases, recovery)
- `meta` — about this lane / about the repo's KB plumbing itself

**Topic tags** (pick as many as fit): `cpl-tracker`, `auditor`, `re-mint`,
`supabase`, `obsidian-target`, `cred-ref`, `quickstart`, `pipeline-ui`,
`canonicalization`, `m-id`, `c-id`, `ccn`, `workplan`, `eacr`, …

### `kb-status` values

- **`published`** — default for new notes. Authored to KB-quality at the time
  of writing; no separate review step required. The vault auto-sync brings
  these into Obsidian on the next pull (per
  [`playbook-vault-sync-setup.md`](playbook-vault-sync-setup.md)).
- **`archived`** — superseded by a newer note. Keep for git history, don't backlink.
- **`internal`** — useful but not for the broader KB (e.g. this README, vault-internal meta).

The `candidate` middle state was retired 2026-05-27, Session 11 — Sam
empowered sessions to author at final quality without a review gate. Old
candidate notes can be re-tagged `published` directly.

## When to author a KB note

A claim is right-sized for this lane when ALL of these are true:

1. **Durable.** Still true a year from now (or someone needs to know it WAS true).
2. **Reusable.** A future session, a peer college, an auditor, or a reviewer benefits from reading it.
3. **Distilled.** One concept per note. If it sprawls, split it.
4. **Self-contained.** Frontmatter + intro sentence tell a stranger what they're about to read.

Examples of good KB notes (none authored yet — these are templates):
- `methodology-per-field-penalty.md` — the auditor scoring pattern
- `reference-cid-vs-ccn.md` — the official numbering scheme distillation
- `adr-display-override-vs-rename.md` — why Cred-Ref PR-4 ships display-only
- `playbook-cron-rebase-recovery.md` — what to do when the daily push collides
- `glossary-tier-criteria.md` — the 3-of-5 college tier classification

## Checkpoint integration

Per `CLAUDE.md` Rule 8 and `.claude/commands/checkpoint.md`, every checkpoint
asks: "what did I learn this run that crosses the durability bar?" Each
crossing learning becomes a new note (or appends to an existing one), with
`kb-status: published`. The checkpoint commit body lists new notes so the
audit trail is clear.

## Vault-side flow

The vault-auto-sync ([`playbook-vault-sync-setup.md`](playbook-vault-sync-setup.md))
keeps `cpl-project-tracker` fresh in Sam's Obsidian vault on a scheduled
pull. New KB notes appear in the vault automatically — no manual `git pull`
needed.

If a note ever needs to be retired:
1. Edit `kb-status: published → archived` in Obsidian (or via this repo).
2. Optionally add a one-line note in the body about why.
3. Don't delete the file — git history matters.

Notes never need an explicit promotion step. They land published and stay
that way unless archived.

## Vault-side conventions

Inside Obsidian, this folder appears as
`CPLBrain/COG-second-brain/cpl-project-tracker/docs/kb-notes/`.

Recommended vault-side filters:
- A saved search `kb-status: published` surfaces every active KB note.
- A graph view filter on `tag:methodology OR tag:reference OR tag:adr` shows the durable knowledge layer.
- Backlinks via `related: [[…]]` connect KB notes into the broader vault graph.

## What's NOT in this lane

- **Generated files** (`*_data.js`, `coci_*.json`, `row_audit/latest.json`) — they live in `kb/` or repo root, not here.
- **Code** (`*.py`, `*.js`) — they live where they live; reference them via `artifacts:`.
- **Session-specific context** — goes in `docs/session_<N>_handoff.md` instead.
- **Workstream WIP** — goes in `docs/<workstream>_lessons.md` instead.

---

See also: [INDEX.md](../INDEX.md) for the auto-maintained landing page.
