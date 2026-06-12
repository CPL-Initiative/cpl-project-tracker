---
title: Reference — Dashboard UI design system (tokens + canonical components)
created: 2026-06-04
updated: 2026-06-12
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

> **FIRST LIGHT (Session 49, 2026-06-12).** The palette flipped to the
> Sam-blessed First Light spec (`prototype/first_light_theme_v1.html` v1.6).
> Values below ARE the spec; `prototype/check_contrast.py --live` lints the
> live `:root` against them in CI (worst-case-backdrop AA math). Five accents,
> one job each; the base is warm monochrome — **color is meaning**.

**Base — warm monochrome:**
| Token | Value | Use |
|---|---|---|
| `--paper` | `#F4F2ED` | the page background |
| `--text-strong` | `#1C1C1A` | ink — headings / emphasis (15.26:1) |
| `--text-body` | `#3A3A36` | body text (10.21:1) |
| `--text-muted` | `#5C5C55` | secondary / meta text (6.02:1) |
| `--text-faint` | `#87877F` | decorative only — never essential text |
| `--surface` | `rgba(255,255,255,.78)` | **glass CHROME fill** — rail/masthead/hero/modals |
| `--surface-opaque` | `#FFFFFF` | **data** — tables NEVER on glass |
| `--surface-subtle` | `#F7F5F1` | subtle zebra / header fill |
| `--surface-muted` | `#ECE9E2` | muted chip / hover fill |
| `--border` | `rgba(28,28,26,.14)` | default hairline border |
| `--border-strong` | `rgba(28,28,26,.30)` | input / chip outline |

**The five accents — one job each, always glyph-paired (▲▼ ✓ ⚠ ⚙ ✨):**
| Token | Hex | Job |
|---|---|---|
| `--cobalt` (+`--accent-link`, `--focus-ring`) | `#0047AB` | interactive · links · focus · selection |
| `--crimson` (+`--red-alert`) | `#920000` | negative · alerts · audit flags · LIVE dot |
| `--hunter` (+`--green-progress`) | `#2C601A` | positive · savings · human-verified |
| `--violet` | `#6D28D9` | machine-generated · inferred · suggested |
| `--mustard-fill` | `#E3B341` | bright brand hue — dots/banners/on-dark; **NEVER text on light** |
| `--mustard-text` (+`--yellow-warning`) | `#8B6800` | caution/brand TEXT grade on light |

**On-dark grades** (ink cards, dark gradients — the analytics/KPI dark cards):
`--crimson-on-dark #CF8F8F` · `--cobalt-on-dark #7DA1D4` · `--hunter-on-dark
#89A67F` · `--violet-on-dark #B28DEB` · `--mustard-on-dark #E3B341`.

**Legacy aliases (deprecated — still consumed by the generator + older CSS):**
`--navy-primary → #1C1C1A` (ink) · `--navy-secondary → #3A3A36` ·
`--gold-accent → var(--mustard-on-dark)` (bright; for TEXT on light use
`--mustard-text`) · `--light-blue → var(--cobalt-on-dark)` · `--bg-off-white →
var(--paper)` · `--text-gray → var(--text-body)` · status tokens map onto
hunter/mustard-text/crimson/text-muted. New code uses the First Light names.

**Hard-won pairing rules:** bright mustard takes INK text (8.77:1), never
white; white text needs cobalt/crimson/hunter/violet fills; canvas
`fillStyle`/SVG presentation attributes can't resolve `var()` — use the
resolved literal hex there (chart code + `_sparkline_svg`).

### Canonical components (reuse these shapes/classes; don't invent new ones)

- **Chip** — `border-radius:10px; font-size:.7rem; font-weight:600; padding:2px 8px`.
  CER's `.cr-chip*` family is the reference (CCC = navy fill; Local = light;
  Generated = gold-bordered amber). A chip = a *category/qualifier* tag.
- **College badge / pill** — `.cr-college-badge` (green = articulated, orange =
  potential). Use short names via `window.cplCollegeShort()` with the full name
  in `title=""`.
- **Audit/severity chip** — `⚠ N` graded by score: red `<0.40`, amber `0.40–0.65`,
  gray `≥0.65` (matches the auditor `READINESS_TIERS`).
- **Data table** — sticky `<thead>` on `--navy-primary` (now ink) with
  `--gold-accent` (bright mustard) text; rows hairline `--border`; long-text
  identifier columns left-aligned, numeric centered/right. Tables sit on
  `--surface-opaque` — never glass.
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
