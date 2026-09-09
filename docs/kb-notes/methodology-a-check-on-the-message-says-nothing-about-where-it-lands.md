---
title: A check on the message says nothing about where it lands
created: 2026-09-09
updated: 2026-09-09
tags: [methodology, testing, ui, accessibility, skyview]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - prototype/ccr_universe.js
  - prototype/ccr_atlas_v1.html
  - tests/ccr_skyview_ask.test.js
---

# A check on the message says nothing about where it lands

> **One-sentence summary** — A suite that asserts the STRING a control emits can
> be complete, starred and green while the control is silent to the person using
> it, because the one thing it never asks is whether the message is anywhere the
> reader is looking.

## Context

SkyView's *Ask* shipped with sixteen checks, several of them starred and each
falsified by reverting its own line. Every one passed. The first time Sam used
the feature he reported it did nothing at all.

The feature was working. It ran, stopped the sky, and printed a complete
explanation of why it could not answer — into `#u-hint`, a strip at the foot of
the window. Measured in Chromium at 1440×900: **36 pixels tall, 850 pixels below
the search box, under three lines of legend.** He typed at the top and watched
the map.

## The claim

**A check of the form `assert(/text/.test(hintEl.textContent))` proves the string
was produced. It proves nothing about whether a human receives it.** The gap
between those two is where a control goes silent while its suite stays green.

The distance is not a detail of this page. Any surface with a status line far
from its input has it, and the further the two sit apart the larger it gets. It
also survives every refactor, because nothing in the test mentions position.

**What to assert instead, in rough order of value:**

1. **That the output is in the same region as the control that produced it.**
   `msearchEl.contains(statusEl)` is a one-line check and it is the whole
   claim — output that lives inside the form follows the form wherever the form
   is moved or borrowed.
2. **That it is announced, not only painted** — `role="status"` and
   `aria-live`. A live region is the only version of "the reader was told" that
   does not depend on where their eyes are.
3. **That it is visible at all** — not `hidden`, not inside a collapsed
   container. ⚠️ In this repo `#u-hint` sits inside `#u-foot`, which the legend
   toggle sets to `display:none`; folding the legend takes every message with it.
4. **That the partial case says so where the whole case does.** When some of a
   request resolved and some did not, the map MOVES — so the reader believes
   they were understood, and the part they were not given is precisely the part
   they will never scroll to the footer to read.

**jsdom cannot do step 3 and can do steps 1, 2 and 4.** Containment, roles and
`hidden` are DOM facts; geometry is not. So write the containment check in the
unit suite and leave the pixels to the browser pass.

## How we got here

This repo had already written the rule down. `docs/reference/skyview_invariants.md`
carries it as an invariant:

> ⚠️ **A REFUSAL THAT PRINTS OUT OF SIGHT IS A DEAD CONTROL.** `#u-hint` sits at
> the foot of the window; `#u-writes` is inside `#u-below`, which `body.u-solo` —
> the default — never paints. Anything that can say *no* says it where the hand is.

The feature shipped against it anyway, three weeks after it was written. **The
invariant existed in prose and nothing mechanical held it**, so it could only
fire if the author happened to remember it while writing the sixteenth check
about a string.

Found by driving the served page in Chromium and reading the rect, not by
reading code: the code is correct, and every reading of it agrees the message is
produced. Fixed in PR
[#1532](https://github.com/CPL-Initiative/cpl-project-tracker/pull/1532), which
adds a `role="status"` panel inside the search form and the checks above as
(15)–(15f).

## When this applies (and when it doesn't)

**Applies** to any control whose only output is text: a refusal, a validation
message, a "nothing matched", an async result, a permissions explanation. The
risk rises with the distance between input and output, and it is highest on
full-screen and canvas surfaces, where the thing the reader is watching is not
the DOM.

**Does not apply** where the output IS the state change — a filter that visibly
narrows a list needs no message and no check for one. It also does not replace
the geometry pass: containment proves the message travels with its control, not
that the control is on screen. That is still `npm run a11y` and a real browser.

⚠️ **It is not an argument for moving the message.** Both surfaces were kept
here: the footer keeps the long form for a reader who is looking there, and the
panel carries the short form to the hand. Relocating output can lose a reader
who had learned where to find it.

## See also

- `[[docs/ccr_atlas_lessons]]` — the run that produced this (2026-09-09, SkySight)
- `[[docs/reference/skyview_invariants]]` — the invariant this note gives teeth to
- `[[docs/kb-notes/methodology-a-control-can-be-live-on-a-surface-that-draws-nothing]]` —
  the sibling failure: the control works and the surface it acts on is empty
- PR `#1532` — the implementation and checks (15)–(15f)

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
