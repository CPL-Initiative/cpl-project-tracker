---
title: "A token with two jobs cannot be themed — count a token's uses by ROLE before you give it a dark value"
created: 2026-09-08
updated: 2026-09-08
tags: [methodology, ui, design-system, dark-mode, pitfall]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[reference-ui-design-system]]"
  - "[[docs/reference/lanes/cobi-dark-mode]]"
---

# A token with two jobs cannot be themed

Adding a dark theme to a design system is not a color exercise. It is an audit
of which tokens have been doing two jobs, because a token that is both a **text
color** and a **fill** has no dark value that works.

## The worked case

COBI's dark mode (2026-09-08) swaps the First Light palette by redefining the
same token names under `:root[data-theme="dark"]`. Most tokens swap cleanly.
`--seal-blue` — the CCCCO seal navy, `#002F6D` — does not, and the reason is
only visible if you count.

The symptom that presents first is the wordmark. `.header h1` is
`color: var(--seal-blue)`, and `#002F6D` on the night ground `#151514` is
**1.4:1** — an invisible brand on all 38 tabs. The obvious fix is to give the
token its on-dark grade, `#7DA1D4`, the way `--cobalt` and `--violet` are
handled.

That fix is wrong, and the measurement says so:

| How `--seal-blue` is used | Count |
|---|---|
| `background` fills (usually carrying white text) | the majority of 266 |
| `border` | 94 |
| `color` (text) | 48 |

The fills are the live-session banner, the Fact Sheet headers, TMC Builder,
`statewide_interactive`, `reviewer_signin`, `cpl_news`, `map_export`. Flipping
the token to `#7DA1D4` rescues 48 text uses and turns every one of those fills
into **white on `#7DA1D4` — 2.3:1**. The visible symptom is one element; the
blast radius is the other 218.

No single value satisfies both jobs. A darker navy keeps the fills correct and
stays invisible as text; a lighter blue does the reverse.

## What the system already knew

The palette had already hit this once and solved it by **splitting the token**:

    --mustard-fill: #E3B341;   /* bright brand hue — dots/banners/on-dark */
    --mustard-text: #8B6800;   /* caution/brand TEXT grade on light surfaces */

That is the general answer, and it is the one dark mode took: **the token keeps
the navy** — all the fills and borders stay correct — and a new
**`--seal-blue-text`** carries the text grade (`#002F6D` light, `#7DA1D4` dark).
Every call site passes the light fallback, `var(--seal-blue-text, #002F6D)`, so
a page that never defines the token (the Fact Sheet, the prototypes) keeps
today's navy rather than inheriting.

## The sweep is where it goes wrong

Splitting a token means rewriting call sites, and both of this sweep's bugs
survived a first reading of the diff:

- **`color:` also ends `border-color:`.** A regex on `color:\s*var\(--seal-blue\)`
  rewrote **20 border declarations** into the text grade. A border belongs to
  the fill's shape, not to text on the ground. The fix is a boundary —
  `(?<![-\w])color:` — and the tell is that the count came back far higher than
  the audit predicted.
- **Text on an explicit fill is not text on the ground.** The alpha chip is navy
  on `--mustard-fill`; ten more hits were decorative marks inside cells with a
  hard-coded `background:#fff`. The on-dark grade reads **1.9–2.4:1** on those.
  Sites whose rule also sets a background need checking one at a time; only
  `--surface-opaque` and friends move with the theme.

So the audit that tells you to split the token does not tell you which call
sites to rewrite. **Check each swept site's background**, and treat a hit count
that exceeds your estimate as a bug in the pattern, not a windfall.

## The rule

**Before giving any token a dark value, count its uses by role — `color` vs
`background` vs `border` — not by total.** A token used in more than one role
is not a color, it is two colors sharing a name, and theming it will silently
break whichever role you were not looking at.

Three things follow:

- **The visible symptom names the minority use.** An invisible wordmark is one
  element you can see; 218 fills that would break are ones you cannot, because
  they look fine until the theme flips.
- **Split the token, or scope the exception.** Splitting (`-fill` / `-text`) is
  the durable fix and costs a sweep of every call site. Scoping one rule is the
  cheap fix and is honest only if the remainder is *measured* and written down.
- **Guard the decision, not just the code.** `tests/cpl_theme.test.js` asserts
  `--seal-blue` is NOT redefined in the dark block, because the invisible
  wordmark is exactly the kind of symptom that invites a future session to
  "fix" the token and break 218 surfaces it never looked at.
