---
title: A native <details> with a hidden marker needs a restored affordance and a guarded toggle
created: 2026-06-02
updated: 2026-06-02
tags: [methodology, css, javascript, details-summary, dashboard, accessibility, statewide-interactive]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/eacr_consolidation_lessons.md]]"
artifacts:
  - statewide_interactive.js (.sw-gallery-sum — the v2 gallery section summaries)
---

# A native `<details>` with a hidden marker needs a restored affordance and a guarded toggle

> **One-sentence summary** — hiding the `<details>` disclosure triangle for
> styling removes the only click cue, and a JS click handler that *also* toggles
> the element races the browser's native toggle into a no-op; restore a visible
> chevron and `preventDefault()` the native behavior.

## Context

This codebase uses native `<details>`/`<summary>` heavily (the EACR gallery v1/v2
sections, "Also entered as N variants" disclosures, the "How this is calculated"
algo panel). For visual consistency the summaries hide the default marker:

```css
.sw-gallery-sum { list-style:none; }
.sw-gallery-sum::-webkit-details-marker { display:none; }
```

The v2 "Credential view" summary then **wouldn't open on click** (PR #252). Two
failure modes compounded: (1) with the marker hidden there's **no visual cue**
it's expandable, and (2) when a JS click handler is wired on the summary and also
flips `open`, it can **race the browser's native toggle** — both fire, the state
flips twice, and it reads as "nothing happened."

## The claim

When you hide a `<details>` marker, you take on two responsibilities:

1. **Restore an affordance.** Add your own chevron and rotate it on `[open]`:
   ```css
   .sw-gallery-sum::before { content:"▸"; display:inline-block;
                             transition:transform .15s ease; }
   .sw-gallery-sec[open] > .sw-gallery-sum::before { transform:rotate(90deg); }
   ```
2. **Pick ONE toggle owner.** If you add a JS click handler (e.g. a delegated
   listener because the panel is rendered dynamically), it must
   **`preventDefault()`** the native toggle and drive `open` itself — otherwise
   native + JS double-toggle. Scope the handler to the specific summary class so
   nested `<details>` keep their native behavior:
   ```js
   var sum = ev.target.closest(".sw-gallery-sum");
   if (sum) { ev.preventDefault();
     var d = sum.parentElement; d.open = !d.open; }
   ```

The robust fix does **both** — a visible chevron *and* the guarded toggle — so it
works whether the root cause was the missing cue or the toggle race.

## How we got here

Reported as "the v2 cards work now but won't expand." The markup was valid native
`<details>`, so it was a 5-minute browser-devtools diagnosis (does the element
gain `open` on click?). Fixed in PR #252; verified with a jsdom test asserting
v1/v2 toggle, inner-span clicks resolve to the summary, `preventDefault` is
honored, and nested summaries are untouched.

## When this applies (and when it doesn't)

- **Applies** whenever you style away a `<details>` marker, and especially when
  the summary is inside a dynamically-rendered region that needs a **delegated**
  (document-level) click listener — that's exactly where the double-toggle bites.
- **Doesn't apply** if you keep the native marker and add **no** JS handler — then
  the browser owns the toggle and there's nothing to race. Don't add a JS toggle
  "to be safe"; only add one if you genuinely need delegation, and then guard it.

## See also

- PR `#252` — the fix
- `[[docs/eacr_consolidation_lessons.md]]` — Session 28 close-out
- Sibling pattern: `[[docs/kb-notes/methodology-self-contained-injected-component-styling.md]]`

---

*Authoring check: durable, reusable (every hidden-marker `<details>` in the repo),
distilled (one concept), self-contained.*
