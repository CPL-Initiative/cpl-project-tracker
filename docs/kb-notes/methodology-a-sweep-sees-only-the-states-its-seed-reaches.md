---
title: A sweep sees only the states its seed reaches — seed through the code that paints them
created: 2026-10-09
updated: 2026-10-09
tags: [methodology, accessibility, testing, verification, sierra]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/sierra_page_redesign_lessons]]"
  - "[[docs/kb-notes/methodology-a-blocked-path-hides-the-defects-behind-it]]"
  - "[[docs/kb-notes/methodology-the-measuring-browser-can-hide-the-defect]]"
artifacts:
  - a11y.config.js
  - scripts/a11y.js
  - cpl_chat.js
---

# A sweep sees only the states its seed reaches

> **One-sentence summary** — an accessibility sweep passes every state it never
> paints, so a view's interactive states need a seed, and the seed should drive the
> code that paints them rather than write the markup by hand.

## Context

`npm run a11y` measures every COBI tab at nine widths and had passed the docked
Sierra on My College and Program Requirements for weeks. S349 added a target for the
docked Sierra expanded to full screen, seeded with a conversation, and its first run
failed on every answer: the Copy, Helpful and Not helpful pills under each answer
were 23.4px tall (the floor is 24) and faded to 2.48:1 by an `opacity: .75`, with
their label in a decorative gray at 3.24:1. None of it was new.

## The claim

**A view measured empty is measured empty.** The COBI sweep opens each tab as a
reader first sees it. Sierra's box at rest holds the intro, the role chips and the
starters; the feedback row exists only after an answer, so no run had ever painted it.
Green on that target said nothing about the controls every reader uses after the first
answer, on every COBI surface that mounts the widget.

**Seed through the real path, and stub only the boundary.** The new seed confirms the
role on its chip, replaces `fetch` for the chat function alone with a canned stream,
and asks six questions through the widget's own `ask()`. The widget then writes every
row, bar and pill itself, and the first send expands the dock exactly as a reader's
would. A seed that hand-writes the markup measures what its author typed: correct on
the day it is copied, blind to the next change in the code that paints it.

**Skip what cannot take focus, and say why.** The sweep's focus-ring pass focuses
every control and reports any without a ring. Behind a modal dialog the page is
`inert`, so 56 controls read as "no ring" for a reason that is not a defect. The
engine now skips inert subtrees beside disabled controls, with the reason in the code,
since those controls are measured live on their own routes.

## How we got here

The full-screen dock (Sheet 54) needed its own targets because it is a state the tab
never shows at rest. Seeding it through `CPL_CHAT.ask()` instead of copying markup was
chosen so the expansion itself was exercised; the feedback-row defect came along free.
The fix (text-muted, no fade, a 24px floor) covers every COBI surface at once, since
the row is the widget's.

## How to apply

- For any view with states a reader reaches by acting (an answer, an open dialog, a
  selected record), ask which of them a seed paints, and add a target for each that
  matters, light and dark.
- Drive the view's own code in the seed. Stub the network at the narrowest point
  (one URL), and match it by a pattern if a literal would read as a dependency edge.
- When a measurement fails for a structural reason (disabled, inert, a closed
  `<details>`), teach the engine the reason in one place, with the reason written down,
  rather than exempting the target.
