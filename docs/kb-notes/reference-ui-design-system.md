---
title: Reference — Dashboard UI design system (tokens + canonical components)
created: 2026-06-04
updated: 2026-06-04
tags: [reference, ui, design-system, css, dashboard, aesthetics]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - CPL_Dashboard.html
  - index.html
---

# Reference — Dashboard UI design system (tokens + canonical components)

> **One-sentence summary** — new dashboard CSS should reference the `:root`
> design tokens via `var(--token)` (never a raw hex) and reuse the canonical
> component shapes below, so every tab stays visually consistent without each
> session re-inventing colors.

## Context

The dashboard is a single ~14k-line HTML (`CPL_Dashboard.html`, mirrored to
`index.html` — **Rule 4**). It already defines a `:root` token block, but an
audit (Session 32) found **148 distinct hex colors** with the brand navy
`#0A2240` hardcoded **568×** vs only **92 total `var()` uses** — i.e. the token
system existed but new CSS (and Claude's edits) kept hardcoding hex, so the
newer tabs (CCR/CER/CSR) drifted onto an ad-hoc slate scale. This note is the
canonical palette + component reference to converge on.

## The claim

**Rule: new CSS uses `var(--token)`, never a raw hex.** If a needed role isn't
in the palette, add a token to `:root` (in BOTH HTMLs — Rule 4) rather than
inlining a hex.

### Tokens (the `:root` block, ~line 19 of both HTMLs)

**Brand (pre-existing):**
| Token | Hex | Use |
|---|---|---|
| `--navy-primary` | `#0A2240` | primary brand / headers / dark fills |
| `--navy-secondary` | `#163A5F` | secondary navy |
| `--gold-accent` | `#C9A84C` | accent / sticky-header text on navy |
| `--light-blue` | `#9BBCD8` | soft accent / proposed status |
| `--bg-off-white` | `#FAF8F4` | page background |
| `--green-progress` `--status-completed` | `#2A7D4F` | progress / done |
| `--red-alert` `--status-at-risk` | `#C73E3E` | error / at-risk |
| `--yellow-warning` `--status-on-track` | `#D4AF37` | warning / on-track |

**Surface / text / link (added Session 32 — converge new tabs onto these):**
| Token | Hex | Use |
|---|---|---|
| `--surface` | `#FFFFFF` | card / table background |
| `--surface-subtle` | `#F8FAFC` | subtle zebra / header fill |
| `--surface-muted` | `#F1F5F9` | muted chip / hover fill |
| `--border` | `#E5E7EB` | default hairline border |
| `--border-strong` | `#CBD5E1` | input / stronger border |
| `--text-strong` | `#1F2937` | headings / strong body |
| `--text-body` | `#374151` | body text |
| `--text-muted` | `#6B7280` | secondary / meta text |
| `--text-faint` | `#94A3B8` | placeholder / disabled |
| `--accent-link` | `#2563EB` | links / "+N more" affordances |

### Canonical components (reuse these shapes/classes; don't invent new ones)

- **Chip** — `border-radius:10px; font-size:.7rem; font-weight:600; padding:2px 8px`.
  CER's `.cr-chip*` family is the reference (CCC = navy fill; Local = light;
  Generated = gold-bordered amber). A chip = a *category/qualifier* tag.
- **College badge / pill** — `.cr-college-badge` (green = articulated, orange =
  potential). Use short names via `window.cplCollegeShort()` with the full name
  in `title=""`.
- **Audit/severity chip** — `⚠ N` graded by score: red `<0.40`, amber `0.40–0.65`,
  gray `≥0.65` (matches the auditor `READINESS_TIERS`).
- **Data table** — sticky `<thead>` on `--navy-primary` with `--gold-accent`
  text; rows hairline `--border`; long-text identifier columns left-aligned,
  numeric centered/right.
- **Curate affordance** — a collapsed `✎ Curate` button that expands an inline
  panel (CER pattern), not a modal, for per-row edits.

### CSS placement rule (avoids the Rule-4 mirror tax)
Inject tab-scoped CSS **from the tab's JS** (the CER `ensureCerScopeCss()`
pattern: one guarded `<style>` appended to `<head>`) rather than editing the
HTML `<style>` blocks. JS is a single static file → it covers both
`CPL_Dashboard.html` and `index.html` with no mirror. Only edit the HTML
`<style>` for genuinely global things (like the `:root` tokens — which then DO
need the Rule-4 mirror).

### Prototype-first practice
For a new tab or a visual rework, **prototype the look in a fast-feedback canvas**
(a Claude artifact / claude.ai) to iterate on layout + spacing with live preview,
lock the design with Sam, **then** port it into the monolith — instead of
blind-editing 14k lines of HTML. The in-repo analog is the EACR **versioned
prototype gallery** (`docs/kb-notes/methodology-versioned-prototype-gallery.md`):
keep v1, stack v2 beside it, graduate the winner.

## When this applies (and when it doesn't)

- **Applies** to all new/edited dashboard CSS. Adding a token is cheap; do it
  rather than hardcoding.
- **Doesn't replace** the brand palette — `--navy-primary`/`--gold-accent` stay
  the identity; the new tokens are the neutral scaffold around them.
- The **bulk migration** of the 568 existing literals → tokens is a separate,
  parity-verified pass (staged), NOT something to do piecemeal mid-feature.

## See also

- `[[docs/kb-notes/methodology-self-contained-injected-component-styling]]` — inject CSS from JS
- `[[docs/kb-notes/methodology-versioned-prototype-gallery]]` — prototype/graduate
- CLAUDE.md "Engineering & UI practices" — the rule lives there too

---

*Authoring check: durable (the palette + components persist), reusable (every
future tab + Claude edit), distilled (one concept: the design system),
self-contained.*
