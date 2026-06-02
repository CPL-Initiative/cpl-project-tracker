---
title: A self-contained injected component must paint its own canvas, not just its text
created: 2026-06-02
updated: 2026-06-02
tags: [methodology, css, dashboard, dark-theme, statewide-interactive, consumer-asset]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/eacr_consolidation_lessons.md]]"
artifacts:
  - statewide_interactive.js (CV_STYLE / .cv-body — the v2 Credential-view panel)
---

# A self-contained injected component must paint its own canvas, not just its text

> **One-sentence summary** — when a JS module injects its own `<style>` with
> dark-theme text colors, it must also set its own background; inheriting the
> host page's (light) background renders the text invisible.

## Context

The dashboard ships several **self-contained consumer assets** (e.g.
`statewide_interactive.js`) that build a chunk of UI and inject their own
`<style>` block. The EACR "Credential view (v2)" did this: `CV_STYLE` colored
every element white / low-opacity-white (`#fff`, `rgba(255,255,255,0.5)`) —
correct for a **dark** surface. But the panel (`#sw-cv-body` / `.cv-credential`)
had no background of its own, so it rendered on the dashboard's **light** page
background → white-on-white, near-invisible (PR #254). The v1 table in the same
file looked fine only because it's wrapped in `.sw-interactive { background:
rgba(10,34,64,0.85) }`.

## The claim

**A component's injected text colors and its background are one package — ship
them together.** If your `<style>` assumes a dark surface (light text), the
component must paint that surface itself; never rely on a host element you don't
control to provide the contrast. The failure is silent: nothing errors, the
markup is "there," it's just unreadable — and it only shows up by eye, so a
`node --check` / jsdom test won't catch it.

Concretely, the fix was a one-liner: give the panel the **same** canvas the
working sibling already uses —

```js
// before:  '.cv-body{padding:0.4rem 0.8rem 1rem;}'
// after:   '.cv-body{padding:0.8rem 0.9rem 1rem;background:rgba(10,34,64,0.9);
//                     border:1px solid rgba(201,168,76,0.25);border-radius:10px;}'
```

Reusing the established surface value (`rgba(10,34,64,~0.9)` navy + the gold
border) keeps the new component visually consistent with the rest of the tab for
free.

## How we got here

The v2 panel was added (PR #249) as a collapsed `<details>` below the v1 table,
which made the missing-canvas easy to miss in review (collapsed by default; the
reviewer's container happened to be dark). A user screenshot on the live (light)
page made it obvious. Two people independently diagnosed it and applied the
identical dark-canvas fix (#254 merged; #255 was a duplicate). See
`docs/eacr_consolidation_lessons.md` (Session 28).

## When this applies (and when it doesn't)

- **Applies** to any injected/standalone UI fragment in this repo that carries
  its own theme assumptions (the dashboard host page is **light**; most card
  components are styled **dark** and must self-paint). Check new `<details>`
  panels, modals, and lazy-rendered blocks specifically.
- **Doesn't apply** when the component is deliberately a transparent overlay on a
  known surface, or when it inherits a themed container you control on the same
  render path (e.g. content placed *inside* `.sw-interactive`). The discipline is:
  know which surface you're on, and if you can't guarantee it, paint your own.

## See also

- PR `#254` — the fix; `#255` — the closed duplicate
- `[[docs/eacr_consolidation_lessons.md]]` — Session 28 close-out
- Sibling pattern: `[[docs/kb-notes/methodology-styling-native-details-toggle.md]]`
  (the other v2-card styling gotcha from the same session)

---

*Authoring check: durable (still true a year out), reusable (every future injected
dashboard component), distilled (one concept), self-contained.*
