---
title: Methodology — Versioned prototype gallery (preserve v1, stack v2 below, graduate the winner)
type: methodology
kb-status: published
created: 2026-06-01
updated: 2026-06-01
session: 27
tags: [methodology, ui, prototyping, playground, iteration, eacr, dashboard]
related:
  - "[[docs/kb-notes/eacr-consolidation-scope.md]]"
  - "[[docs/eacr_consolidation_lessons.md]]"
---

# Methodology — Versioned prototype gallery

## The concept
When iterating on a **divergent redesign** of an existing view (not a strict
improvement, but a genuinely different paradigm), don't refactor the live view in
place — **preserve it as "v1" and stack the new version "v2" below it**, both
rendering the **same underlying data**. Iterate v2 freely; when a version wins,
**graduate it** (the also-rans collapse-by-default or get archived) so the page
doesn't become a museum.

This is the in-page analogue of a feature flag: the proven surface stays untouched
and always available; the experiment lives beside it, zero-risk.

## Why it works
- **Zero blast radius.** v1 is byte-for-byte unchanged, so merging v2 on green is
  safe even when v2 is browser-untestable in-session. Put v2 behind a collapsed
  `<details>` (opt-in) and a glitch can't degrade the primary experience.
- **One data layer, many renderers.** Every version reads the *same* committed data
  (`statewide_data.js` etc.) — they differ only in rendering. New version = a small
  additive render function + a container, **no data drift** between versions.
- **Side-by-side is the sell.** Stakeholders compare "before vs after" on the live
  page (e.g. CompTIA A+ as a wall of 4 fragmented cards in v1 vs. one consolidated
  master-detail card in v2). The comparison *is* the argument for graduating it.
- **Cheap iteration.** Because each version is a renderer over shared data, throwing
  one away costs nothing.

## When to use it
- A redesign that changes the *paradigm* (flat table → master-detail), not just a
  field. (A strict de-clutter — nobody wants the old way back — should land **in
  place**, not as a gallery version. Reserve the gallery for genuine alternatives.)
- The "playground" pattern: prototype on a low-stakes surface (here, the project
  dashboard), graduate the winner to the heavyweight system (here, MAP) later.
- Audience-specific variants that may *all* survive (e.g. Student / College / System
  lenses) — they graduate into a **segmented toggle**, not a permanent vertical stack.

## Guardrails
1. **Graduation rule** — decide up front that once a version wins, the losers
   collapse-by-default / archive. Without it the gallery accretes forever.
2. **Iteration-stack vs audience-toggle.** Comparing iterations of *one* idea → a
   vertical collapsible stack. Distinct *audiences* that all survive → a segmented
   toggle (a user picks one lens, doesn't scroll past the others).
3. **Shared filters/state.** Have the versions read the same filtered set (e.g.
   `getFiltered()`) so a filter/search narrows all of them — otherwise they drift
   and the comparison is apples-to-oranges.
4. **Self-contained styling.** Inject the new version's CSS from the static asset
   (a one-time `<style>`), so the generator / daily regen never has to carry it.

## Worked example (Session 27, EACR)
The Exhibit Adoption table got a master-detail "Credential view." Rather than
rewrite the tightly-wired flat table, `statewide_interactive.js` now renders two
collapsible sections from the same `getFiltered()` set: **📋 Adoption table (v1)**
(the original, untouched) and **🎓 Credential view (v2 · beta)** (one card per
credential, CCC standard on top, variants sub-listed). v2 reuses v1's consolidation
helper (`buildCreditRecsHtml`). Merged on green with confidence because v1 was
untouched and v2 was opt-in behind a collapsed `<details>`.
