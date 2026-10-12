---
title: "An option list read from the page dies with the renderer that printed it"
created: 2026-10-12
updated: 2026-10-12
type: methodology
tags: [methodology, front-end, testing, workplan]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[workplan_annual_goals_lessons]]"
---

# An option list read from the page dies with the renderer that printed it

> **One-sentence summary** — When a control builds its choices by scanning the page for a marker, replacing the renderer that printed the marker empties the choices silently, and a test whose fixture still prints the marker keeps passing.

## The case

The Annual Workplan Goals "Add new row" dialog listed Activities by scanning `[data-kind="activity"]`. A later renderer replaced the table in the same markers and printed `data-activity-title-edit` instead. From then on the dialog said "no Activities exist yet" and refused every sub-activity (found 2026-10-12, when Sam tried to add 3.9). Its sibling, `project_add.js`, had the same shape: it mounted beside `#projectCount`, which no longer exists, so its button never appeared, while its test supplied `#projectCount` and passed.

## The rule

- **Read choices from data, or from every marker the live page prints.** Prefer a data source (`window.CPL_DATA`, a live read); when the page is the source, accept the current marker and the old one, and say in a comment which renderer prints each.
- **Guard the empty case as a failure.** A control whose option list is empty on a page that plainly has options is broken; a test should assert the count against the real page markup, not a fixture written from memory.
- **Assert mount points against the shipped HTML.** A mount test that builds its own anchor proves the code, not the page.

## When this applies

Any static module that hydrates a generated page (this repo's overlays and editors), because the generator and the module change in different PRs.
