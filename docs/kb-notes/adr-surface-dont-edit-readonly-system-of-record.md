---
title: Surface, don't edit, a read-only system of record
created: 2026-06-30
updated: 2026-06-30
tags: [adr, architecture, data-integrity, map, nudge]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[map_users_tab_scope]]"
  - "[[cobi_lessons]]"
artifacts:
  - map_users.js
  - map/sync_map_users.py
  - map/supabase_map_contacts.sql
---

# Surface, don't edit, a read-only system of record

> **One-sentence summary** — when COBI can only READ an external system of record (no write API), don't build an editor for that data inside COBI; surface it, deep-link into the source system, and own the *nudge + accountability* instead.

## Context

The MAP Users tab manages the MAP platform's per-college staff roster. Sam asked
whether colleges could click a COBI link that lets them "update only their users"
and have that **feed MAP**. MAP is the **system of record** for users, and the only
MAP integration we have is the **Custom Report API — which is read-only**. There is
no MAP *write* endpoint we can call.

## The claim

**If you can only read an external system of record, do not build a write-back
editor for that data in your app.** A second editing surface immediately becomes a
**second source of truth that drifts** from the authority — and "feeds MAP" silently
degrades to "a human re-keys it into MAP later."

Instead, split the responsibility cleanly:

- **The source system owns the data + the edit UI.** Colleges edit users *in MAP*
  (where the credentials + the authoritative record live). COBI **deep-links** them
  there (`map_college_contacts.landing_page_url`, reused from the CPL Assistant's
  per-college URLs).
- **COBI owns the prompt + the accountability.** The 📣 nudge (a `mailto:`, nothing
  auto-sent), the **last-nudged log** (`map_college_nudges`), and read-only
  *surfacing* of the current roster in the email so leadership has eyes on it. None
  of that mutates MAP — it just drives the human to act in the right place.

The tell that you're about to violate this: you're designing a form whose Save
button has nowhere authoritative to write. If the write target is "email someone to
do it by hand," that's a nudge, not an editor — build the nudge.

## How we got here

Session 87's MAP Users nudge follow-up. The instinct to build a COBI-side "edit your
users" form was rejected for the drift reason; the deep-link + nudge + read-only
roster-in-email shipped instead (PRs #623–#626). If MAP ever exposes a write API, a
true write-back becomes a *separate, scoped* project against that endpoint — not a
parallel store.

## When it does NOT apply

- When **you own the system of record** (e.g. COBI's own Supabase tables —
  `item_raci`, `project_lifecycle`, `kb_curation`): editing in-app is correct.
- When the external system offers a **real write API** with conflict semantics: a
  scoped write-back integration is legitimate (still single-source — you write
  *through* to the authority, you don't keep a shadow copy).

## Consequences

- The roster the nudge shows can be **stale** between syncs — acceptable, it's a
  prompt, not the authority; the staleness signal (a future "Last updated" field)
  drives the cadence.
- "Update your users" stays a one-click trip into MAP, which keeps MAP's access
  gate (only credentialed staff can edit) doing its job for free.

## Related

- `docs/map_users_tab_scope.md` — the MAP Users scope + the parked attestation loop.
- `docs/kb-notes/playbook-runner-as-external-api-proxy.md` — the read path this pairs with.
- `docs/cobi_lessons.md` (S87) — the workstream narrative.
