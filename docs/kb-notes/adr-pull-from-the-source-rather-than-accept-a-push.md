---
title: Pull from the source rather than accept a push
created: 2026-08-19
updated: 2026-08-19
tags: [adr, architecture, security, map, itpi, cron, supabase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/auth_and_repo_posture_lessons]]"
artifacts:
  - fetch_custom_report.py
  - .github/workflows/daily-dashboard.yml
---

# Pull from the source rather than accept a push

> **One-sentence summary** — When a vendor offers to write data into your
> database on a schedule, the cheaper and safer answer is almost always to ask
> them to expose it and keep pulling it yourself.

## Context

ITPI — the vendor that develops and manages the MAP platform — offered to
automate a daily push of three new Custom Reports directly into our Supabase,
which would have meant editing the daily cron to accommodate an external writer.

The offer was generous and the underlying need is real. The recommendation is
still to decline the *mechanism* while accepting the *help*.

## Decision

**Keep pulling. Ask the vendor for the interface, not the write access.**

Concretely: `fetch_custom_report.py` already POSTs to the MAP Custom Report API
with `MAP_API_KEY` and pulls eight datasets by `viewName`, inside the daily
workflow. Adding three more reports is three entries in `REQUEST_PAYLOAD`. The
integration everyone was about to design **already exists** — what is actually
missing is three `viewName` values and their column lists.

## Why

**A push inverts the trust direction.** Today MAP is a read-only system of
record for us: we reach in and take a copy. An external system writing into our
database on a schedule we do not control is a materially different posture, and
it is one that is hard to walk back once other things depend on it.

**It needs a credential we have to issue**, and the only one that trivially
works is the service key — which bypasses every RLS policy in the project. A
correctly-scoped alternative (dedicated role, table-specific grants) is real
work, and it is work that exists *only* because of the push.

**Failures stop being visible.** Our cron's failures surface in Actions, against
a versioned workflow, next to every other step. A third-party push has no such
surface unless somebody builds one — and nobody builds monitoring for the happy
path they just shipped.

**A pull declares what we take; a push decides what we receive — and we already
rely on that.** `REQUEST_PAYLOAD` names every dataset *and every column*. Session
34 used that to drop `View_CollegeContacts` and `View_CollegeUsersRoles` from the
payload entirely — a deliberate PII data-minimisation decision, so that staff
names, emails and phones **never land on the Action runner at all**. That posture
is not a policy document; it is implemented as the absence of two entries in a
Python list. Hand the write to the other side and it evaporates silently: we
would receive whatever they send, including the things we deliberately chose not
to hold. **This is the argument that decides it** — the others are about risk,
this one is about a control we are actively using today.

**It creates a second writer.** "Who wrote this row" stops having one answer,
which is precisely the property you want when a figure turns out to be wrong.

## Is it worth the efficiency?

Almost none is on offer. The push would save us **three entries in
`REQUEST_PAYLOAD`** — that is the entire build cost on our side. It saves no
runtime (the cron runs regardless), no maintenance (we would still have to
validate what lands, and now without controlling how it got there), and no
schedule (the 06:17/09:17/12:17 UTC ladder exists for reasons of its own).

Set against that: the schedule becomes theirs, the column set becomes theirs, the
transform becomes unreadable to us, and the data-minimisation above is undone.
**The trade is a few lines of config against every control we currently hold over
this pipeline.** It is not close.

The one genuine efficiency case is **volume**, below.

## When a push *is* the right call

Volume is the honest counter-argument: pulling 30 fields across ~537k student
rows through a JSON API has a ceiling. If that ceiling is reached, the shape is:

- a **dedicated Postgres role**, never the service key
- **INSERT-only** grants on **named staging tables**, never the live ones
- a **validated promotion step that we own and run**, so the external system's
  last act is landing raw rows, not publishing them
- an explicit freshness assertion, so a push that silently stops is loud

The distinction is that the vendor delivers *data* to a quarantine we control,
rather than delivering *state* to the tables our users read.

## The generalisation

A collaborator offering to do work for you is offering to take on a
responsibility — but responsibilities in a data pipeline come with write
authority, and write authority is the expensive half. Ask whether the same help
can arrive as **something to read**. It usually can, it usually costs them less
than the automation they offered, and it leaves exactly one system able to
change your data.

## See also

- `cpl_memory` `we-already-pull-from-map-do-not-accept-a-push`
- `CLAUDE.md` §11 — *MAP Custom Reports (3 new) / ITPI automation*
