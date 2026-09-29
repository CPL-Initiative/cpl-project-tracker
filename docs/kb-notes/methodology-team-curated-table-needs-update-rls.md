---
title: A team-curated Supabase table needs team_pass_ok() on UPDATE too, not just SELECT + INSERT
created: 2026-07-26
updated: 2026-07-26
tags: [methodology, supabase, rls, security, team-phrase]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_memory_tab_lessons]]"
  - "[[docs/kb-notes/adr-cobi-org-layer]]"
artifacts:
  - team_phrase.js
  - kb/supabase_cpl_memory.sql
  - kb/supabase_map_data_quality.sql
---

# A team-curated Supabase table needs team_pass_ok() on UPDATE too

> **One-sentence summary** — If a phrase-gated tab lets team members *edit* rows,
> the table's RLS **UPDATE** policy must include `team_pass_ok()` (not just SELECT +
> INSERT), or every team edit silently updates zero rows, the client reads that as a
> 403, drops the phrase, and locks the curator out.

## Context

The 🧠 Memory curate pane let a team-phrase curator click a status chip; it snapped
back and demanded the phrase again, repeatedly (Sam, 2026-07-26). Root cause was an
RLS **asymmetry**, not an expired phrase. This is the standing rule for every
team-curated table on the dashboard.

## The claim

For a table curated behind the shared team phrase, set the same predicate on the
three write-adjacent commands the curate UI exercises:

- **SELECT** — `is_allowed_reviewer() OR team_pass_ok()`
- **INSERT** — `is_allowed_reviewer() OR team_pass_ok()`  (+ any status/visibility guard)
- **UPDATE** — `is_allowed_reviewer() OR team_pass_ok()`  ← the one that gets forgotten
- **DELETE** — reviewer-only is fine (the pane should supersede via UPDATE, not hard-delete)

A **reviewer-only UPDATE** under a team-phrase pane is the trap: the pane offers
edit/status affordances the phrase can't actually perform.

## Why the failure is a *lockout*, not a visible error

PostgREST + RLS: a PATCH whose target rows are filtered out by the policy's USING
clause returns **HTTP 200 with an empty `[]`** (zero affected rows) — **not** 401/403.
`team_phrase.js` `checkWrite()` correctly treats an ok-but-empty `return=representation`
as the **RLS zero-row trap** and reports it as a 403-shaped failure; `handleWriteFailure()`
then clears the stored phrase on that "403". So a missing UPDATE grant presents to the
user as *"your team phrase may have expired — re-unlock"* and an edit that changed
nothing — indistinguishable from a real expiry, and it repeats forever.

## The rule

1. When you add an edit/status/supersede affordance to a phrase-gated tab, grant
   `team_pass_ok()` on **UPDATE** at the same time you grant SELECT + INSERT.
2. Keep any `visibility <> 'public'` (or status) guard in the `with check` so a team
   curator can't escalate a row's exposure.
3. Keep hard-**DELETE** reviewer-only; model destructive actions as a status change
   (`superseded` / `wontfix`) so history survives.
4. New tables: bake this in from the first migration (done for `map_data_quality`).

## How we got here

Fixed live on `cpl_memory` (#896) by widening its reviewer-only UPDATE to
`reviewer OR team`; the `map_data_quality` register (#897) shipped with the correct
policy set from its first migration. Recorded as `cpl_memory` pitfall `p8`.

## When this applies (and when it doesn't)

- **Applies:** any Supabase table whose dashboard tab lets team-phrase users edit
  rows (curate panes, registers, worklists).
- **Doesn't apply:** anon INSERT-only *intake* tables (suggestions/interest) with no
  public SELECT and no team edit — those deliberately keep UPDATE reviewer-only.
