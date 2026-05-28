---
title: Snapshot-with-stamp fallback for live-data dependencies
created: 2026-05-28
updated: 2026-05-28
tags: [methodology, supabase, resilience, fallback, daily-cron]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/excel_to_supabase_lessons]]"
  - "[[docs/kb-notes/playbook-measure-first-supabase-migration]]"
artifacts:
  - kb/_load_workplan_goals.py
  - kb/workplan_goals_snapshot.json
---

# Snapshot-with-stamp fallback for live-data dependencies

> **One-sentence summary** — When the daily generator depends on an external data source (Supabase, scrape API, MCP), write a git-committed snapshot on every successful fetch + fall back to it on failure + render a subtle "as of YYYY-MM-DD" stamp from the snapshot's stored timestamp so users can see staleness without being alarmed.

## Context

`excel_to_dashboard.py` runs daily at 10:17 UTC. After Phase 1 of the
Excel→Supabase migration, the Workplan Goals tab depends on Supabase as
source-of-truth. Supabase isn't five-nines — a 30-second blip at the wrong
moment, a key-rotation race, or a transient network issue would otherwise
fail the regen.

This pattern keeps the regen alive without silent data loss, AND surfaces
the staleness in the rendered output so curators don't trust stale numbers
without realizing they're stale.

## The claim

Live-data dependencies in the daily generator should follow this three-state chain:

### State 1 — Fresh fetch (the happy path)

```
fetch from live source (e.g. Supabase REST)
  └─ success
     ├─ write snapshot to kb/<topic>_snapshot.json with:
     │     - _fetched_at: today's YYYY-MM-DD
     │     - _source_table: the upstream identifier (audit trail)
     │     - row_count: sanity-check count
     │     - rows: the actual data (raw, unmunged)
     ├─ render with stamp = today's date
     └─ commit the snapshot back to main via the daily workflow
```

The snapshot envelope (not just the raw rows) is critical. The `_fetched_at`
field is what the renderer reads to populate the stamp on fallback paths.

### State 2 — Live failure, snapshot present (graceful degradation)

```
fetch fails (exception, non-2xx, missing env var)
  ├─ log the failure to stdout: "[topic] Supabase fetch failed: <reason>;
  │                              falling back to snapshot at <path>"
  ├─ read kb/<topic>_snapshot.json
  ├─ render with stamp = snapshot's _fetched_at
  └─ return rows from the snapshot, with source="snapshot"
```

The stamp date is the snapshot's, not today's. Users see "Data as of
2026-05-26" while it's actually 2026-05-28 — that's the signal. Pair with
a subtle visual treatment (small grey text under the section header — not
a banner; alarming users for a one-day blip is worse than the blip).

### State 3 — Both fail (loud failure)

```
fetch fails AND snapshot file missing or unreadable
  └─ raise RuntimeError("<topic>: live source down AND no snapshot. Cannot render.")
```

No silent rendering of nothing. The generator's exit code reflects the
failure; the daily workflow's commit step sees no rendered HTML and either
skips the commit or fails the run. A human investigates.

## How we got here

Phase 1 of the Excel→Supabase migration (Workplan Goals tab, Session 13,
PR #166) shipped this pattern as `kb/_load_workplan_goals.py`. The
implementation is ~80 lines including the auth + snapshot envelope.

Sam picked the "subtle staleness signal" UX (small grey "Data as of …"
line under the section header) over the louder "banner across the top"
option, citing the false-positive cost: a 30-second Supabase blip during
the daily cron is normal; alarming users every time would erode trust in
the signal. The conditional option (subtle when fresh, loud when stale
≥1 day) was considered but the simpler subtle-always shipped first.

The first daily cron after PR-4 merged exercised the fresh-fetch path
cleanly: snapshot written at `kb/workplan_goals_snapshot.json` (~54 rows,
2 KB), committed by the daily workflow, rendered tab carried "Data as of
2026-05-28" under the description.

## When this applies (and when it doesn't)

**Applies:**
- The generator depends on a single live source whose data fits in a
  small committable JSON file (KB range: ~10 KB - 1 MB)
- The data is read-heavy + write-light (a snapshot represents a useful
  approximation of the live state for read consumers)
- Brief outages are common enough that failing the regen is worse than
  briefly serving slightly-stale data
- The git-committed snapshot doubles as an audit trail (the daily commit
  history captures each day's snapshot)

**Doesn't apply:**
- Data sources too large to commit daily (use a separate cache file +
  `.gitignore` + manual periodic refresh instead)
- Write-heavy systems where users edit during the read window (the
  snapshot is stale at write time; the live source must be authoritative)
- Sources where stale data is dangerous (real-time pricing, security
  posture, etc.) — fail loud rather than render stale
- Systems where the upstream guarantees high availability and the
  fallback complexity isn't worth carrying

## Implementation notes

- Envelope keys to include: `_about` (one-line description), `_fetched_at`
  (YYYY-MM-DD), `_source_table` (for audit trail), `row_count` (sanity
  check), `rows` (the actual data).
- Use `urllib.request` (stdlib, no extra dependencies) over `requests`.
- Add the snapshot file to the daily workflow's `git add` list — without
  this, the fresh snapshot writes happen each run but never persist.
- Pass `SUPABASE_SERVICE_KEY` (or equivalent secret) explicitly to the
  generator step in CI. Don't rely on it being in the global env.
- Test the fallback by running the generator with the env var unset +
  a synthetic snapshot file present. Should render + log the fallback.

## See also

- `[[docs/excel_to_supabase_lessons]]` — Phase 1 workstream notebook
  (the Session 13 end-state section captures the snapshot pattern in
  context)
- `[[docs/kb-notes/playbook-measure-first-supabase-migration]]` — step 5
  of the playbook explicitly invokes this fallback pattern
- PR `#166` — `kb/_load_workplan_goals.py` reference implementation
- PR `#168` — daily workflow integration (git-add the snapshot)

---

*Authoring check: durable (Phases 2-4 + future workstreams all need this
pattern), reusable (the same envelope shape applies to every Supabase
table), distilled (one concept: three-state fetch chain), self-contained
(frontmatter + opener tell a stranger the playbook).*
