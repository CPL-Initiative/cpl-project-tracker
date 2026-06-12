---
title: Derive theme tokens from brand seeds with a contrast script — the mock is the spec
created: 2026-06-12
updated: 2026-06-12
tags: [methodology, design-system, accessibility, wcag, tokens, ui]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
  - "[[docs/first_light_lessons]]"
artifacts:
  - prototype/check_contrast.py
  - prototype/first_light_theme_v1.html
  - tests/first_light_prototype.test.js
---

# Derive theme tokens, don't pick them — the mock is the spec

> **One-sentence summary** — When building a palette, write a small script
> that *derives* every token from brand seed hues against documented
> worst-case backgrounds until WCAG targets pass, embed the measured ratios
> in the living mock, and pin the hexes in tests — so every "make it pop"
> design request becomes a measurable yes/no instead of an argument.

## Context

The First Light theme (Session 48) went through four chip redesigns in one
day, two recolors, and a glassmorphism layer — all while claiming WCAG 2.2 AA
(the DOJ Title II rule makes 2.1 AA legally required for public entities like
RCCD since April 2026). Hand-picking hexes per round would have silently
broken compliance several times.

## The claim

Maintain a **derivation script** (`prototype/check_contrast.py`) that:

1. **Documents worst-case backgrounds as composites, not best cases** — e.g.
   glass = white @ .78 over a 10% black art-ghost over paper; a dark scrim =
   its alpha composite over the lightest content behind it. Text on glass is
   checked against the worst composite, never the prettiest screenshot.
2. **Derives each token by nudging a brand seed** toward black (light-bg text
   grades) or white (on-dark tints) until the target ratio passes — and
   **evaluates the ROUNDED hex it will actually return** (rounding nudged a
   borderline mustard from 4.50 to 4.49 — fail).
3. **Knows which background binds**: for dark text, the *darker* light
   surface (paper #F4F2ED) binds, not the lighter glass composite — deriving
   against the wrong one shipped a 4.49:1 token once.
4. **Prints the spec table the mock embeds** (token, hex, role, measured
   ratio, PASS), and a **test pins every spec hex** into the mock file so the
   page and the script can never drift apart. The mock IS the spec; the
   eventual retheme is a token-value swap.

The payoff in practice: "white text on solid chips" → script says crimson/
cobalt/hunter pass unmodified, violet darkens for taste, **mustard cannot work
(~2:1) and becomes a derived deep ochre** — physics delivered as a number, the
trade-off made explicit, the user decides in seconds. Same for the
halo-as-adjacent-color treatment (outline dark enough that fill-vs-halo ≥4.5:1)
and the on-dark tints (derive at 5.5:1, not 4.5 — minimum-pass tints read
dusty on dark).

## How we got here

PRs #391/#393/#395/#397/#398 — every visual round re-ran the script before
the mock changed; tests (`first_light_prototype.test.js`) failed any time the
page's hexes and the script's output diverged. The two traps (rounded-hex
evaluation, binding background) were both caught BY the script printing a
FAIL, not by eyeballing.

## When this applies (and when it doesn't)

- Applies to any token-based theme work where compliance is claimed, and
  especially to translucent/glass surfaces (composite math is unguessable).
- The halo interpretation (outline as the measured adjacent color) is a
  judgment call evaluators accept when the halo fully surrounds glyphs —
  derive the pair anyway so it's defensible. (We ultimately replaced halos
  with solid fills; the derivation made both options comparable.)
- Doesn't replace human eyes: "passes AA" ≠ "looks good" (the dijon mustard
  passed and still needed Sam's call).

## See also

- [[docs/first_light_lessons]] — the workstream that produced this
- PRs #391, #393, #395, #397, #398 — the derivation rounds
- [[docs/kb-notes/reference-ui-design-system]] — the live token registry this
  feeds at retheme time
