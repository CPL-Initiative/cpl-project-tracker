---
title: Single source of truth flows via the regenerated snapshot — de-hardcode consumers, and verify the join key
created: 2026-07-27
updated: 2026-07-27
tags: [methodology, single-source-of-truth, de-hardcode, snapshot, drift, adversarial-review, entity-table-overlay]
updated: 2026-07-27
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/workplan_single_source_editor_lessons]]"
  - "[[docs/kb-notes/reference-workplan-activity-project-linking-model]]"
artifacts:
  - raci.js
  - master_report.js
  - generate_reports.js
  - excel_to_dashboard.py
---

# Single source of truth flows via the regenerated snapshot — de-hardcode consumers, and verify the join key

> **One-sentence summary** — When one Supabase field is authoritative, every surface must
> *derive* it from the regenerated `CPL_Data.js` snapshot; the actual work is deleting the
> hardcoded copies that have drifted — and confirming each consumer joins on the right KEY.

## Context

The CPL dashboard has one store (Supabase) that the daily pipeline regenerates into the
`window.CPL_DATA` snapshot + baked HTML. When a value becomes editable in one place (e.g.
an Activity title on the Annual Workplan Goals tab → `workplan_goals.name`), the goal is
that it "flows everywhere." It only flows to consumers that **read the snapshot**; consumers
that keep their own hardcoded copy silently drift.

## The claim

1. **The authoritative place is the store, not a tab.** Everything else (Activities tab, RACI,
   Annual Report, reports, the Element Map) is a *reader* that re-derives from the regenerated
   snapshot on the next pipeline run. So "make X editable and flowing" decomposes into: (a) pick
   one editor UI that writes the store, and (b) **delete every hardcoded copy** so no consumer
   shadows the store.

2. **Drift is usually already live.** Before this pattern was applied, `master_report.js` /
   `generate_reports.js` / `raci.js` hardcoded the 4 Activity titles. The store said "Activity 3:
   Build CPL Data Infrastructure"; the reports still said "Activity 3: Scale CPL Access, Awards,
   and Procedures." Grep for the value literal across `*.js` to find every stale copy before
   claiming an edit "flows everywhere."

3. **A de-hardcode that reads the right SOURCE but joins on the wrong KEY is dead code.** The
   subtle trap: the report generators built a map keyed by the short id `"Activity N"` (from
   `activity_kpis[].activity_id`) but looked it up with the *full* label
   `projects.activity` = "Activity 3: Scale CPL Access…". The keys never matched, `actInfo`
   was always `{}`, and the store override never applied — even though the map was populated
   from the store. **Always verify the lookup key on both sides of the join.** Fix: normalize
   both to the parsed `"Activity N"` (`actName.match(/Activity\s+(\d+)/)`) before indexing.

4. **Separate content stores don't participate.** Not every surface derives from the store.
   The Fact Sheet (`factsheet_overrides` + baked prose) and Sierra (its RAG KB + `sierra_guidance`)
   are independently authored — a store rename neither breaks nor reaches them. Identify these
   up front so you don't chase phantom wiring.

## How to apply

- Enumerate consumers by grepping the value literal AND the field name (`.name`, `.activity`,
  `activity_kpis`) across `*.js`. Classify each: derives-from-snapshot vs holds-own-copy.
- Replace each own-copy with a derive-from-`window.CPL_DATA` helper (with a static fallback for
  offline/stale bundles). Keep genuinely-different content (e.g. a report's formal paragraph)
  local; only flow the shared value (the title).
- **Guard the failure mode with a test**: rename the field in a mocked snapshot and assert it
  reaches the consumer's output. A test that only checks the fallback value can't catch a dead
  join (as `master_report.test.js` didn't, until a rename-flow assertion was added).
- Run an **adversarial review on the diff** — the join-key mismatch here was invisible to
  py_compile + the existing tests and only surfaced when reviewers traced the actual lookup keys.

## Two tables, one tree: make the ENTITY table authoritative, the other a pure overlay (2026-07-27)

The snapshot-flow above is about ONE field with N *consumers*. The sibling failure is one
*concept* split across two **tables** that two consumers iterate independently.

The Annual Workplan Goals tab iterated `workplan_goals` (the year-ladder table); the Activities
tab iterated `projects` (the sub-activity tree). Two tables, two consumers → guaranteed drift: the
#872 reorg re-keyed `projects` but not `workplan_goals`, so 10 projects were missing from Annual
Goals and every Activity-4 row showed the wrong (off-by-one) targets.

**The fix (Path A): pick ONE table as the authoritative entity list, and make the other a by-id
overlay that the authoritative iteration *joins in*, never iterates.**
`build_workplan_goals_from_supabase` now builds the annual-goals rows from the **`projects`** set
(the same set the Activities tab renders) and overlays the `workplan_goals` ladder by id when
present. Consequences:

- The two tabs **cannot diverge** — they enumerate the same table; a new project auto-appears on
  both, and a *left-behind* overlay row degrades to a visible blank ladder instead of a silent id
  mismatch.
- A row reflected from the entity table but with **no overlay row** must be **read-only on the
  fields the overlay owns** — an editable cell that PATCHes a non-existent row is a silent-revert
  trap. Gate the editable attributes on a `has_ladder`/`has_overlay` flag; the entity-owned fields
  (title, description → `projects`) stay editable.
- An all-zero overlay must not inherit truthy defaults from the populated case (the
  `is_pct = bool(vals) and all(… if v)` → `all([])` == True trap — require a non-zero element).

**Rule of thumb:** if two consumers iterate two tables for one concept, one of them is wrong.
Elect the entity table, demote the other to an overlay. Pairs with
`methodology-rekey-every-id-keyed-artifact` (finish the re-key across every keyed table) — Path A
is the structural insurance that makes a missed re-key *visible* instead of silent.

## When NOT to apply

If the value legitimately differs per surface (a dashboard blurb vs a formal report paragraph),
don't collapse them — source the shared part (the title) from the store and keep the divergent
part local.
