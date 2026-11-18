---
title: A dispatch-only feed goes stale without a sound
created: 2026-11-17
updated: 2026-11-17
tags: [methodology, github-actions, scheduling, commons, live-data]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[playbook-github-scheduled-workflow-reliability]]"
  - "[[commons_lessons]]"
artifacts:
  - .github/workflows/harvest-gap-census.yml
  - .github/workflows/workflow-failure-watch.yml
  - kb/status/commons_data.json
---

# A dispatch-only feed goes stale without a sound

> **A workflow that only runs when someone dispatches it, and whose output a page reads, needs a schedule and a
> failure watch; otherwise the page keeps showing its last numbers and nothing tells anyone they are old.**

## Context

College Data Collection on the CPL Commons reads its live counts from `kb/status/commons_data.json`, which
`harvest-gap-census.yml`'s `live-counts` job writes. Until S678 (2026-11-17) that workflow had no schedule.

## The claim

A dispatch-only workflow has no failure mode anyone can see. A scheduled workflow that fails turns red and the
failure watch (`workflow-failure-watch.yml`) reports it; a dispatch-only workflow that nobody dispatches never fails,
so the page that reads it shows the last run's numbers with no sign of their age. When a page reads a workflow's
output, give the workflow a schedule at the cadence the page implies, put it under the failure watch, and let the
page show the read time beside the figures.

## How we got here

The census's live read (#3232) had only a `workflow_dispatch` trigger, and no session dispatched it. The live counts
went unread from Nov 13 to Nov 17. The first dispatch on Nov 17 (run 44184389606) moved objective courses from 2,983
to 10,711. #3465 gave it a daily schedule (17:47 UTC) under the failure watch.

## When this applies (and when it doesn't)

It applies to any workflow whose output a person reads as current: a census, a sync, a status file, a published
JSON. It does not apply to a reviewed apply (a migration, a rename batch, a guarded delete): those stay
dispatch-only on purpose, because running one is the decision, and their output is a receipt read at the time.

## See also

- [`playbook-github-scheduled-workflow-reliability`](playbook-github-scheduled-workflow-reliability.md): when a
  scheduled run is missed.
- [`methodology-a-live-painted-page-still-goes-stale-in-its-prose`](methodology-a-live-painted-page-still-goes-stale-in-its-prose.md).
- `docs/commons_lessons.md`, S678.
