---
title: "ADR — live notes sit alongside the curated register, with a promotion path"
created: 2026-08-05
updated: 2026-08-05
tags: [adr, supabase, curation, rls, notes, promotion]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-register-is-the-spine-narrative-cites-it]]"
  - "[[docs/noncredit_cpl_lessons]]"
artifacts:
  - kb/supabase_nc_partner_notes.sql
  - nc_learning_partners.js
---

# ADR — live notes sit alongside the curated register, with a promotion path

> **One-sentence summary** — Let users add insight instantly in a live store, keep the
> curated spine version-controlled, and move between them through explicit promotion —
> never by having the UI rewrite the committed file.

## Status

**Accepted** — 2026-08-05. Implemented as `public.nc_partner_notes` behind the
Noncredit & Learning Partners tab.

## Context

The tab surfaced items explicitly labeled **"Needs Input."** A list of things needing
input that you *can't answer in place* is a to-do list that can't be completed — so a
write layer was needed.

The tempting implementation is to let the UI write into the curated JSON that already
drives the tab. Two rulings from the curator shaped the decision instead:

1. **"Answering never closes, just revises."**
2. The curated register must stay reviewable.

## Decision

**Notes live in a separate Supabase table, keyed by item ID. They never rewrite the
curated file. A note reaches the register through explicit promotion.**

### Why not write into the curated JSON

- It puts a **live-edited file into the PR flow and the daily cron's path** — the
  class of conflict that is never resolvable by picking sides.
- You lose the **audit trail**: who changed what, when, and why.
- Review disappears. The point of a version-controlled spine is that a human can see
  a diff.

### Why not keep notes only in the live store

Notes that only accumulate become a graveyard. Without a path *out*, the durable
insight stays trapped in a table nobody reads — which is the exact failure the
workstream was created to fix.

### So: both, with a gate between them

```
✎ user note ──► live store (instant, revisable, gated)
                     │
                     └─ ↑ promotion packet ──► human commits ──► curated register
                                                              └─► KB note
```

The promotion packet is a generated markdown artifact: each pending note with its
source item and a per-note decision — *register field / KB note / both / hold*.

## Consequences

**Keyed by item ID, not by section.** `Q-1`, `OPP-3`, `M2`, `UC-7` all live in one
table, so one affordance covers questions, opportunities, modes and use cases. Adding
a section later needs no schema change.

**"Never closes" is enforced in the schema, not by convention:**

- A revision goes through an RPC that inserts the new note and links
  `supersedes` / `superseded_by` **in one round trip** — the pair can't be left
  half-linked by a failed second call.
- The predecessor is **retained**; only rows with `superseded_by is null` render.
- **There is no `DELETE` policy on the table at all**, and no delete grant. A ruling
  that lives only in a code comment gets violated by the next contributor; one that
  has no policy backing it cannot be.

**Reads are gated too, not just writes.** The tab is private and notes carry internal
thinking, so `SELECT` requires the team phrase or a signed-in reviewer — no blanket
anon read. Verify this by *seeding a row and confirming the anon role reads zero*,
rather than by reading the policy and assuming.

**Promotion is recorded on the row** (`promoted_at` / `promoted_to`), so a promoted
note isn't re-offered and you can see what it became.

## Boundary worth stating explicitly

"Get it into the knowledge base" can mean more than one destination. Here it targets
the **internal** lanes — the curated register and the tracker's `docs/kb-notes/`.

It deliberately does **not** reach the public knowledge base, which changes only
through its own human-reviewed curation pipeline — that review *is* the sensitivity
audit. **The generated packet states this boundary in its own text**, so the
constraint travels with the artifact instead of living only in a commit message
nobody will read again.

## See also

- `kb/supabase_nc_partner_notes.sql` — schema of record, with the applied stamp
- [`methodology-register-is-the-spine-narrative-cites-it`](methodology-register-is-the-spine-narrative-cites-it.md)
- [`playbook-cpl-memory-auto-write-at-checkpoint`](playbook-cpl-memory-auto-write-at-checkpoint.md)
  — the same supersede-don't-delete discipline, applied to session memory
