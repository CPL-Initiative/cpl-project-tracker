---
title: Soft-delete a daily-generated entity via an overlay table + collapsed section
created: 2026-06-29
updated: 2026-06-29
tags: [playbook, supabase-overlay, soft-delete, projects, raci, generator]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[project_lifecycle_lessons]]"
  - "[[methodology-server-enforced-shared-password-gate]]"
artifacts:
  - kb/supabase_project_lifecycle.sql
  - kb/_load_projects.py
  - excel_to_dashboard.py
  - project_lifecycle.js
  - dashboard_filters.js
---

# Soft-delete a daily-generated entity via an overlay table + collapsed section

> **Summary** — to "delete" a daily-baked entity (a project card, an exhibit, a
> college row) reversibly and without touching its core table or losing its
> relational data, add a tiny **overlay table** keyed by the entity id; the
> generator drops overlaid entities from the live priority surfaces and renders
> them in a collapsed "removed" section; a static JS overlay reconciles drift +
> provides the reviewer remove/restore controls.

## Context

COBI projects live in `public.projects` and fan out through `CPL_DATA.projects`
to many consumers (the card grid, the RACI matrix, the Annual Report, custom
reports, the Workplan Goals ladder). Sam wanted to "delete" a project so it stops
showing up as a priority or getting mentioned — but a hard delete would be
irreversible and orphan its `item_raci` / `item_updates` rows. This is the
reusable shape we landed on (Session 84).

## The claim

**Model removal as a separate overlay table, not a column on the core table and
not a `DELETE`.**

1. **Overlay table** — `<entity>_lifecycle(<id> pk, state, reason, updated_by,
   updated_at)`. The **absence of a row = active**. RLS: anon `select`; writes
   gated to your existing reviewer/team gate (`is_allowed_reviewer() OR
   team_pass_ok()`). This keeps the core table (often off-limits / heavily
   consumed) untouched and the relational data intact.

2. **One committed JSON ledger** — the loader folds the overlay into a committed
   `<entity>_lifecycle.json` each daily run. It is BOTH the offline fallback AND
   the human-readable "noted in the KB" record that syncs to the vault. Never let
   the loader raise — a missing overlay must degrade to "everything active."

3. **Two layers, mirroring `card_updates.js` + the generator:**
   - **Generator (durable bake-in):** render removed entities **hidden** in place
     (a `data-lifecycle` attribute + `display:none`, so a live *restore* can
     un-hide them) AND render a collapsed `<details>` "removed" section with the
     reason/date + a Restore control. Crucially, **exclude removed ids from the
     data export** (`CPL_DATA`) — that one filter drops them from *every*
     downstream JS consumer at once.
   - **Static JS overlay:** anon-read the table and **reconcile drift** since the
     last regen (hide a just-removed entity + build its entry; restore one that
     left the overlay), plus the reviewer remove/restore affordance (optimistic
     write + rollback, the `headersFor` anon-bearer + `x-team-pass` pattern).

4. **Guard the client-side filter** so a "clear filters" never un-hides a removed
   entity and never counts it (a 2-line `if (el.getAttribute('data-lifecycle'))
   { hide; continue; }`).

## Why these specific choices

- **Overlay, not a core-table column** — avoids a migration on a hot / off-limits
  table, and absence-of-row is the cleanest "active" default.
- **Hide (don't remove) in the grid** — a removed full card kept hidden in the
  DOM is what makes a same-session **Restore** trivial (you can't reconstruct a
  removed card client-side).
- **Exclude from the data export, not from each consumer** — one lever
  (`CPL_DATA.projects` filter) covers RACI / reports / annual report. Audit which
  surfaces read project *text*: COBI's chatbot was already safe (it only ingests
  `live_metrics.json`).
- **Keep the filter late + display-only** — don't let removal rewrite
  aggregate/rollup/chart inputs (Activity ladders, trend charts). A removed item
  shouldn't retroactively change a parent metric.

## Gotchas

- The live reviewer/team-phrase **write path can't be exercised from the agent
  sandbox** (Supabase egress-blocked → 403). Ship + ask a human to confirm a
  round-trip in a browser.
- Live removal is instant (JS) but only **bakes** (collapsed section + data
  exclusion) on the next daily regen; restore of a baked-removed item reappears
  in the grid on the next regen.
