---
title: A scheduled workflow runs when GitHub gets to it, so place it where a late start is harmless
created: 2026-10-29
updated: 2026-10-29
tags: [methodology, github-actions, scheduling, sierra, map-custom-reports]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - .github/workflows/map-custom-report-load.yml
  - docs/cpl_assistant_lessons.md
---

# A scheduled workflow runs when GitHub gets to it, so place it where a late start is harmless

> **A cron line in a GitHub workflow names the earliest time it may start, not the time it runs. Choose the time so the job is harmless across its whole real window, late starts included.**

## Context

The MAP Custom Report load was set for 13:40 UTC, after the dashboard's crons, so the jobs would not contend. In the week to 2026-10-29 GitHub started it at 16:55, 17:12, 18:56, 19:04, 19:11 and 19:31 UTC, which is midday Pacific. On 2026-10-29 its promotion to live overlapped Sam's testing of Sierra. Every read of one answer hit its 5-second limit together, and Sierra returned a 500.

## The claim

A schedule's real window is its cron time plus the scheduler's delay, and on GitHub that delay can run to hours. A heavy job (a bulk load, a promotion in one transaction, a rebuild) is safe only where its whole window falls outside the hours people use the system. The ordering a schedule seems to promise ("after the dashboard window") is not a guarantee either: two crons drifting by different amounts can still overlap.

So place a heavy job early in the quiet hours, far enough ahead that a five- or six-hour delay still ends before people arrive. Avoid minute 0, when the scheduler is busiest and runs latest. Where one job depends on another, make it depend on that job's result rather than its clock time.

## How to check it

List the workflow's recent runs and compare each `created_at` with its cron time. A consistent gap is the delay to plan around. For the load, `57 4 * * *` (9:57 PM Pacific in daylight time) puts even a six-hour delay at about 3 AM Pacific.

## Related

A request cut by a client time limit keeps running in Postgres until the statement timeout, so the load a job leaves behind outlasts the reads that gave up on it (`docs/cpl_assistant_lessons.md`, S519).
