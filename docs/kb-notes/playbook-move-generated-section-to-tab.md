---
title: Moving a generator-managed dashboard section to its own tab
created: 2026-05-30
updated: 2026-05-30
tags: [playbook, dashboard, generator, tabs, rule-1, rule-4]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - docs/dashboard_cleanup_lessons.md
artifacts:
  - excel_to_dashboard.py
  - CPL_Dashboard.html
  - tabs.js
  - statewide_interactive.js
---

# Moving a generator-managed dashboard section to its own tab

> **One-sentence summary** — to relocate a dashboard section that
> `excel_to_dashboard.py` regenerates, first classify whether its marker is an
> *end-anchor* for other generator ops; the easy case is a stop-emitting + static
> relocate, the hard case needs a permanent **sentinel marker** so the daily
> regen keeps binding correctly.

## Context

The dashboard is a static template whose sections are partly **regenerated** by
`excel_to_dashboard.py` via regex strip/inject anchored on HTML comment markers
(Rule 1). `tabs.js` auto-derives the tab list from rendered nav buttons, so
*adding* a tab is trivial — the risk is entirely in the generator anchors. Two
section moves in Session 20: #6 (Exhibit Adoption, easy) and #1 (Workplan, hard).

## The claim

**Step 0 — classify the section's marker.** Grep `excel_to_dashboard.py` for the
section's marker string. Count how many generator operations reference it. A
marker is dangerous when it's the **end-anchor** (`(?=<!-- marker -->)` or
`html.find(marker)` as an upper bound) for *other* sections, not just the
delimiter of its own block.

**Easy case (self-contained mount point, e.g. #6 Exhibit Adoption).** The
section is just a mount `<div id="...">` populated by a JS module via
`getElementById` (location-agnostic). To move it:
1. Stop the generator emitting it (delete the built string + its append).
2. Drop a **static** `<div id="...">` in a new `<div class="cpl-tab-pane"
   data-tab="..." ...>` pane + a `<button class="cpl-tab" data-tab="...">`.
3. Verify **exactly one** element with that id survives (a duplicate id =
   `getElementById` returns the wrong one → silent blank tab).
4. The new pane sits *outside* the generator's strip span, so regen never
   touches it. No `VALID_TABS` edit — `tabs.js` derives it from the nav button.

**Hard case (marker is an end-anchor, e.g. #1 Workplan).** The section's marker
bounds *other* regenerated blocks (KPI Summary, CPL Analytics strip…). Moving the
section moves the marker far away in the DOM → the bounded regexes `.*?` gobble
everything in between on the next regen (wipes the dashboard). Fix:
1. Add a **new permanent sentinel marker** (e.g. `<!-- Dashboard Sections End
   -->`) at the section's *current* position, and **leave it in the Dashboard
   tab**.
2. Rewire every generator op that used the old marker as its end-anchor onto the
   sentinel.
3. Move the section (with its own markers + the inject sub-anchors that travel
   *with* its content, e.g. `<!-- Filter Bar -->`) into the new pane.
4. **Run `excel_to_dashboard.py` locally and inspect** — this is non-optional for
   the hard case; the failure mode is catastrophic and not eyeball-detectable in
   the regex.

## How we got here

#6 shipped clean (PR #204) by the easy path — `statewide_interactive.js` finds
`#statewide-interactive-container` by id, so a static mount in the new pane just
works. #1 was scoped but deferred: its marker is the end-anchor for 4 ops
(`excel_to_dashboard.py` lines 8407/8451/8455/8464), exactly the trap CLAUDE.md
§6b documents.

## When this applies (and when it doesn't)

- Applies to any `#tab-*` move of generator-managed content in this repo.
- The **easy path only works for self-contained mount points** populated by id.
  A section whose *content* (not just mount) is injected by the generator needs
  its inject anchor moved with it (still tractable, but verify with a regen).
- Always mirror `CPL_Dashboard.html` → `index.html` after (Rule 4).
- Doesn't apply to the hand-maintained Pipeline tab (not generator-managed).

## See also

- `[[docs/dashboard_cleanup_lessons]]` — the Session 20 workstream
- PR `#204` — #6 easy-case implementation
- CLAUDE.md §6a/§6b — the analytics + workplan strip/inject anchor docs

---

*Authoring check: durable (the anchor mechanics outlast any one move), reusable
(every future tab move hits this), distilled (one decision: end-anchor or not),
self-contained.*
