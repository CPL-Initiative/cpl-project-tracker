---
title: "Methodology: dark→light recolor mapping (COBI tokens)"
created: 2026-06-30
updated: 2026-06-30
kb-status: published
tags: [methodology, ui, theme, color, contrast, cobi, accessibility]
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/cobi_lessons]]"
  - "[[docs/kb-notes/reference-ui-design-system]]"
artifacts:
  - excel_to_dashboard.py
  - statewide_interactive.js
  - college_activity_template.html
  - kb/_test_light_theme.py
---

# Methodology: dark→light recolor mapping (COBI tokens)

When flipping a dark-navy data surface (table/card) to COBI's light/glass look,
apply this **contrast-aware, token-based** mapping. It's recolor-ONLY — never
touch layout, selectors, class names, or logic. (Used Session 87 to flip the KPI
Trends card, the CPL Analytics + EACR `.exhibit-*`/`.sw-*` families, the College
Activity card, and `statewide_interactive.js`.)

## The mapping

**Backgrounds**
- card `var(--navy-primary)` → `var(--surface-opaque)` (+ `border:1px solid var(--border)`; gold top accent kept; dark `box-shadow rgba(0,0,0,…)` → `0 8px 30px rgba(20,20,30,0.08)`)
- dark header / sticky `rgba(28,28,26,.9+)` / `#2A2A26` → header band `var(--surface-muted)`; dropdown/popover `var(--surface-opaque)` + `box-shadow 0 6px 20px rgba(20,20,30,0.12)`
- nested dark panel `rgba(0,0,0,.2)` → `var(--surface-subtle)`
- dark-surface input/button fills `rgba(255,255,255,.04–.15)` → inputs `#fff`+`var(--border)`; subtle fills `var(--surface-subtle)`

**Text** (the contrast-critical part)
- gold text `var(--gold-accent)` (#E3B341) → **`var(--mustard-text)`** (#8B6800) — `--gold-accent` is a FILL/dot hue, **never** text on light
- `#fff` / `rgba(255,255,255,.8–1)` → `var(--text-body)` (big/bold → `var(--text-strong)`)
- `rgba(255,255,255,.3–.7)` → `var(--text-muted)`
- `--hunter-on-dark` → `--hunter` · `--crimson-on-dark` → `--crimson` · `--cobalt-on-dark`/light-blue → `--cobalt`
- `var(--navy-primary)` **as text** (e.g. on a gold button) → KEEP

**Borders / tints**
- white borders `rgba(255,255,255,.04–.2)` → `var(--border)`; gold borders `rgba(227,179,65,X)` → KEEP
- KEEP light tint backgrounds (`rgba(44,96,26,X)` green, `rgba(125,161,212,X)`/`rgba(0,71,171,X)` blue, `rgba(227,179,65,X)` gold) — flip only their **text** to `--hunter`/`--cobalt`/`--mustard-text`

**Trend graphics**
- sparkline stroke/fill `#E3B341` → **`#8B6800`** (a light-gold line on white is too faint); muted `rgba(227,179,65,.5)` → `rgba(139,104,0,.55)`
- bar/progress *track* `rgba(255,255,255,.1)` → `rgba(28,28,26,.08)` (a white track vanishes on white)

## Gotchas

- **Generator-injected CSS publishes on the cron, not the sandbox.** `EXHIBIT_ANALYSIS_CSS` is injected only
  when MAP exhibit data is present (`if exhibit_tables:`), which the agent sandbox can't fetch — so a sandbox
  regen leaves the stale baked copy. **Guard the SOURCE** (a `_test_light_theme.py`-style assertion that no dark
  surface remains) rather than relying on a rendered diff; the daily cron strips+injects the light version.
- **Shared classes flip everywhere.** `.exhibit-*`/`.sw-*` are used by both CPL Analytics and the EACR — one
  base-rule flip covers both (that's the *consistent* outcome). Scope-override only if you deliberately want one
  surface to differ.
- **JS that builds inline styles uses raw hex, not `var(--token)`** — match the file's existing pattern (e.g.
  `#8B6800`=`--mustard-text`, `#2C601A`=`--hunter`, `#0047AB`=`--cobalt`).
- **The `:root` light tokens already exist** — don't invent hexes; the palette is in
  [`reference-ui-design-system`](reference-ui-design-system.md).
