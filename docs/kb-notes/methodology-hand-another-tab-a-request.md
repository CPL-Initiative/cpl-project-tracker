---
title: Hand another tab a request, never load its module
created: 2026-10-21
updated: 2026-10-21
tags: [methodology, cobi, admin-surface, governance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[college_action_page_lessons]]"
artifacts:
  - cpl_pathways.js
  - program_requirements.js
  - kb/_build_cobi_admin_surface.py
  - tests/cpl_pathways_college_status.test.js
---

# Hand another tab a request, never load its module

> **One-sentence summary** — when one COBI tab opens a view in another, it leaves a request the other tab takes on activation, because loading the other tab's module makes the code-derived surface map credit its tables to the first tab.

## Context

CPL Pathways' college line (2026-10-21) opens the Program Requirements tab's Records view filtered to a college. The first build loaded `program_requirements.js` from CPL Pathways to call its `goTo`. The admin surface (`kb/_build_cobi_admin_surface.py`) and the dependency map derive each tab's reads from the code, loadScript names included, so CPL Pathways was credited with reviewer verdicts and addenda it never reads, and the Admin tab could no longer say its data is public. Story: `docs/college_action_page_lessons.md`, S442.

## The claim

A tab's code is the evidence for what it reads. Loading another tab's module to reach its API is a read of everything that module reads, as far as every derived map can tell, and the map is what the Admin tab and Rule 10's blast-radius checks consult. So a cross-tab action names the destination and leaves the work to it:

1. If the destination's module is already on the page, call its exported function after navigating.
2. Otherwise set a one-shot request on `window` (CPL Pathways uses `CPL_PROGRAM_REQUIREMENTS_GOTO`) and navigate. The destination's `activate()` takes the request and clears it.

The boot that loads a tab's module (`CPL_TABS.onActivate`) runs on the first visit only, so step 1 covers every later visit.

## How to apply

- Before a loadScript of another tab's module, ask whether the surface map should list that module's tables under your tab. When it should not, use the request.
- After any cross-tab change, regenerate `cobi_admin_surface.js` and `kb/dependency_map.json` and read their diff: a table you never query appearing under your tab is this failure.
- Test both paths: the module present (a direct call) and absent (the request set, then taken once on activation).
