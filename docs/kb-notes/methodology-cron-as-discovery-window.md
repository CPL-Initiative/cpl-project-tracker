---
title: Cron-as-window — reach egress-blocked data via a workflow + run logs
created: 2026-06-09
updated: 2026-06-09
tags: [methodology, ci, github-actions, egress, map, discovery, data-pipeline]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[reference-cpl-eligibility-and-exhibit-cr-catalog]]"
  - "[[reference-claude-code-web-environment-reach]]"
artifacts:
  - kb/_discover_map_datasets.py
  - .github/workflows/discover-map-datasets.yml
---

# Cron-as-window — reach egress-blocked data via a workflow + run logs

> **One-sentence summary** — A Claude session's container can't reach the MAP
> hosts (egress allowlist: *"Host not in allowlist"*), but a GitHub Actions runner
> can — so ship a read-only probe behind `workflow_dispatch`, have the user click
> Run, and read the run log via the GitHub MCP. The run log is your window.

## Context

The MAP Custom Reporting Module (`mapwebapinew.azurewebsites.net`,
`customreportingmodule.azurewebsites.net`) is **not allowlisted** for a Claude
session's sandbox — a `POST`/`GET` returns a 21-byte `403 Host not in allowlist`.
But the **daily-dashboard GitHub runner reaches it fine** (it fetches the ~91 MB
CustomReport every day). So when you need to inspect a new MAP dataset's
schema/grain that you can't pull locally, route through the runner.

## The pattern

1. **A read-only probe script** (`kb/_discover_map_datasets.py`): hits the API
   **on the runner**, computes whatever you need (schema, row counts, grain,
   constancy checks, sample rows), and **prints it to stdout** — the run log.
   **PII-safe**: request no identity columns; mask small headcounts (`<5`); commit
   nothing (the raw pull is gitignored).
2. **A `workflow_dispatch` workflow** (`.github/workflows/discover-map-datasets.yml`):
   `permissions: contents: read`, no secrets (the `getReport` API is open today),
   no commit step, just runs the probe. **It must be merged to `main`** to appear
   in the Actions "Run workflow" UI (`workflow_dispatch` only surfaces from the
   default branch).
3. **The user clicks Run** (a session's integration token 403s on `actions:
   write`, so it can't self-dispatch).
4. **Claude reads the run log** via `mcp__github__get_job_logs` (`return_content:
   true`, `tail_lines: N`) → learns the real schema/grain → wires the producer.

## Why it works / when to reach for it

- **The run log is readable but the data isn't committed** — the perfect PII
  posture for student/staff data: schema + masked samples reach the log; the raw
  blob never lands in the public repo.
- Pair it with **"draft blind, let cron fetch"**: build + verify the consumer
  rollup on a **synthetic** column-oriented payload (`kb/_verify_*.py`), ship with
  **heavy cron-log diagnostics** (`matched_exhibitid=…`, counts), validate from
  the first real cron run, iterate. (This is how the Exhibit-CR Title-bridge bug
  surfaced + got fixed in one cycle — the diagnostic said `matched_exhibitid=0`.)

## Gotchas

- A `_Dataset` vs `_APIDataset` viewName suffix (or any guessed identifier) will
  silently return nothing — get the exact value from the user's report header
  rather than guessing.
- The cron log is large; fetch with `tail_lines` and `grep` for your specific
  diagnostic strings, or use a subagent to extract just those lines so the full
  log stays out of context.
- The same egress wall hides reachability both ways — confirm with a baseline
  (`github.com` 200, the MAP host 403 `Host not in allowlist`) before assuming an
  API is down.
