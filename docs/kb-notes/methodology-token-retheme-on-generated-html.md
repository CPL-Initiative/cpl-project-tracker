---
title: Methodology — retheming a generator-owned HTML monolith via token value-swap
created: 2026-06-12
updated: 2026-06-12
tags: [methodology, design-system, css-tokens, generator, retheme, accessibility]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[methodology-derived-aa-token-palette]]"
  - "[[reference-ui-design-system]]"
  - "[[CLAUDE]]"
artifacts:
  - CPL_Dashboard.html
  - excel_to_dashboard.py
  - prototype/check_contrast.py
  - tests/retheme_tokens.test.js
---

# Methodology — retheming a generator-owned HTML monolith via token value-swap

> **One-sentence summary** — to repaint a dashboard whose HTML is partly
> regenerated daily, flip the `:root` token VALUES (keeping legacy token
> names as remapped aliases), sweep raw hexes contextually in the generator
> and the HTML in the same PR, give non-CSS surfaces (canvas/SVG) resolved
> literals, then prove convergence with a scratch regen and pin the palette
> with a CI lint. (First applied: the First Light retheme, Session 49,
> PRs #407/#408/#410.)

## Context

The dashboard is a ~14.5k-line HTML where `excel_to_dashboard.py` replaces
whole sections daily (Rule 1), plus ~20 static JS assets that inject their
own CSS. The old brand (navy/gold) lived as raw hexes in ~250 emission sites
and a `:root` block. The First Light spec arrived as a standalone prototype
whose token names deliberately mirrored the live `:root`.

## The claim

A spec-to-prod retheme on this architecture is reliable when done in this
order:

1. **Value-swap the `:root`, never rename.** New spec tokens land with their
   real names; every legacy token name stays as an alias remapped onto the
   new palette (`--gold-accent: var(--mustard-on-dark)`). Generated content
   and untouched CSS converge instantly; nothing 404s.
2. **Resolve one-token-two-jobs conflicts with grade pairs.** Any token used
   on both light and dark surfaces (brand gold) or for both chrome and data
   (`--surface`) must split: a bright fill grade + a dark text grade
   (`--mustard-fill` / `--mustard-text`), a glass fill + an opaque fill
   (`--surface` / `--surface-opaque`). Then repoint each consumer to the
   correct side — a blanket swap alone WILL create dark-on-dark or
   bright-on-light failures (our trend-card deltas, the funding DRAFT chip).
3. **Sweep contextually, not blindly.** Classify each legacy-hex site before
   replacing: text-on-light vs text-on-dark vs banner-fill vs interactive.
   Interactive surfaces (buttons, focus, `accent-color`) go to the
   interactive accent regardless of their old color.
4. **Non-CSS color surfaces get literals.** Canvas `fillStyle`/`strokeStyle`,
   SVG presentation attributes (`stroke=`, `fill=`, `stop-color=`), mermaid
   classDefs, and any string a JS lib parses as a color cannot resolve
   `var()` — hand those the resolved hex and note it next to the token table.
5. **Generator and HTML move in ONE PR**, with identical transforms, so the
   committed page and tomorrow's regen are the same pixels. Where a template
   emits one value into two roles (a progress bar's fill **and** its label
   color), split the variable in the template (`bar_color` / `label_color`).
6. **Prove convergence with a scratch regen.** Run the updated generator in
   a temp copy; diff its output against the committed HTML. Data values may
   churn; *style vocabulary* must not. This diff caught both of our real
   mistakes (SVG-attr `var()`, a template-vs-HTML grade mismatch).
7. **Pin the palette in CI.** A lint that re-parses the live `:root` from
   BOTH HTML mirrors, asserts byte-identity (Rule 4), drift-pins every spec
   hex, resolves alias chains, and RE-MEASURES WCAG ratios against
   documented worst-case composites (`check_contrast.py --live`). Plus a
   jsdom test that asserts legacy hexes are extinct in committed artifacts —
   the daily cron run then re-verifies on every push to main.

## Evidence

- 3 PRs, same afternoon, zero visual regressions reported by tests: 35/35
  jsdom files, 33 lint pins, scratch-regen 0 legacy hexes / 629 token refs.
- The two bugs found were exactly the classes steps 4 and 6 exist for.

## Boundaries / gotchas

- **Rebase inverts ours/theirs** — in `git rebase`, `--theirs` is YOUR
  commit. Conflict-resolution scripts must assert which side they're
  holding before transforming.
- A dispatched daily run can race the PR (generated-file conflict): keep
  the side carrying the CSS work; the post-merge dispatch republishes data
  freshness. Never hand-merge regenerated sections.
- Emoji entities (`&#128206;`) are valid hex-pattern matches — only ever
  replace EXACT known hexes, never a generic `#[0-9A-F]{6}` pattern.
- Different media keep their own brand until decided otherwise: Word-report
  docx colors and xlsx export styling were deliberately left navy/gold.
