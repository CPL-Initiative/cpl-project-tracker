---
title: Reference — Dashboard UI design system (tokens + canonical components)
created: 2026-06-04
updated: 2026-10-09
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

## Controls: underlined words (Sam, 2026-10-09)

Sam, on the funding explainer: *"I think our buttons could be simpler and less
obtrusive. What if we show them without boxes and just underlined text link a
link? Does that violate any AA or do you have a more elegant option?"* Answered
that it meets AA with the underline kept, he ruled: *"Yes, make it a First Light
rule."*

**The rule: a control that acts is an underlined cobalt word, with no border and
no fill.** The lead action too: a filled "primary" button is retired, and the
order of the words carries the lead.

| Requirement | Why it keeps AA |
|---|---|
| Underlined **at rest**, thicker on hover | The underline is the cue that is not color (1.4.1). Underline on hover alone leaves color as the only cue, against First Light's own rule. |
| `var(--cobalt)` text | Clears 4.5:1 on white and on the page ground in both themes (the Fact Sheet's dark `--cobalt` is `#7DA1D4`). |
| `min-height: 24px`, words at least 18px apart | WCAG 2.2 target size, 2.5.8 (AA). The old boxed buttons met the 44px AAA size; AA does not require it. |
| A visible `:focus-visible` ring | Keyboard focus, 2.4.7. Never `outline:none` inline. |
| `<button>` where it acts, `<a>` where it goes | A screen reader names the role from the element, so the look can change without the meaning changing. |

**Not covered:** a form field keeps its outline (a field needs a boundary to be
found); a chip is a category, not a control (the glass-quiet chip spec stands); a
toggle in a set marks its selected state with weight and `aria-pressed`, never
color alone.

**The CSS** (the Fact Sheet's `.btn`, `fact-sheet/factsheet.css`):

```css
.btn { border:0; background:none; color:var(--cobalt); font-weight:600;
  padding:2px 0; min-height:24px; text-decoration:underline;
  text-decoration-thickness:1px; text-underline-offset:3px; }
.btn:hover { text-decoration-thickness:2px; }
```

**Rollout.** The funding explainer (#1940) and the Fact Sheet with its Sierra
launcher went first (S353), and `prototype/first_light_theme_v1.html` is v1.7.
Every other view converts at its UI pass (`/a11y-pass` step 7), measured, rather
than by a blind sweep: COBI's tabs carry hundreds of boxed buttons, and a target
that shrinks from 44px to 24px has to be re-measured where it sits.

## Glyphs: decorative ones are out; state ones stay

**Sam, 2026-08-14:** *"Also want a design rule to not add glyphs to them (as some
have now and should be removed). I'm not a fan of cheesy glyphs. If we use them
they should be muted, simple, a bit ghosted based on CO blue and white."*

**The rule: separate DECORATIVE from FUNCTIONAL before removing anything.**

- **Decorative** — a glyph that merely labels a thing whose name already says
  what it is. `📋 Contracts`, `🎓 CPL Pathways`, `⚖️ Governance`. These go.
  Applied 2026-08-14: **10 of 36 side-menu items** carried one; all ten were
  decorative and all ten were stripped, from both HTMLs (Rule 4).
- **Functional** — a glyph that renders *state*, where removing it would remove
  information. The masthead lock is the worked example: `🔒` vs `🔓` says whether
  you are signed in. That is not decoration, and it stays. It also happens to
  live in JS (`team_phrase.js`, `raci.js`, `budget_editor.js`), not in the nav
  markup, which is why a nav-scoped strip cannot touch it.

**If a glyph survives that test, it goes in as a `var(--token)` — muted, simple,
slightly ghosted CO blue on white — never as an inline emoji.** Per the standing
rule that new CSS uses `var(--token)`, never a raw hex.

⚠️ **A nav label may be pinned by a test.** Six suites asserted the label
*including* its glyph (`/data-tab="governance"[^>]*>⚖️ Governance</`), so a strip
that ignores them turns a deliberate design change into six red checks. Grep the
label, not just the markup, before editing nav text.

⚠️ **In-page headings are a separate surface from the side menu.** `team_phrases.js`
renders `<h2>🔑 Team Phrases</h2>` inside its own tab; that was left alone here
because the ask was specifically about side-menu items. Decide it deliberately
rather than letting a regex reach it.


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
