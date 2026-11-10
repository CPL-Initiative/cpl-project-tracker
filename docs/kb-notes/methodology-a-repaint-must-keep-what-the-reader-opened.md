---
title: A repaint must keep what the reader opened
created: 2026-11-10
updated: 2026-11-10
tags: [methodology, ui, cobi, csm-workspace]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[csm_workspace_lessons]]"
artifacts:
  - csm_workspace.js
  - tests/csm_workspace.test.js
  - tests/csm_workspace_templates.test.js
---

# A repaint must keep what the reader opened

> **A view that redraws itself from state forgets anything the reader opened or positioned unless that is state too:
> a fold, a frame, a caret, a scroll.**

## Context

Most COBI tabs draw a whole region with `innerHTML` whenever data arrives: the contacts finish loading, a log row
saves, a filter changes. On 2026-11-10 the Funding Follow-up Dashboard gained three things a reader opens: a landing
page frame in the review, an *Every field on file* fold, and a template editor. The tests passed for each. A reviewer
(COBIx) found the same defect in all three within the hour.

## The claim

Anything the reader changes that is not data must be kept outside the DOM and drawn back on every repaint.

- **Open and closed.** Keep a `details` element's open state from its `toggle` event (`state.onfileOpen`,
  `state.lpOpen[college|kind]`) and draw `open` when it is set. Keyed to the record when it belongs to one, kept for the
  visit when it does not.
- **What was typed.** Keep a draft on every `input` (`state.tplDraft`), so a repaint redraws the words, and say they are
  unsaved.
- **Where the cursor was.** Before the repaint, read `selectionStart`, `selectionEnd` and `scrollTop` from the focused
  field. After it, focus the field by id and put them back.
- **A frame reloads.** Moving or redrawing an `iframe` reloads it in most browsers, so the reader keeps the page but
  loses the scroll inside it. Draw a frame only when its part shows, and say the limit plainly.

The test that guards it opens the thing, triggers the repaint the real page triggers (the contacts arriving, a filter
change), and checks it is still open, still holding the words, or the caret still in place.

## How we got here

COBIx's reviews on PRs 3066 (the frame closed when the contacts arrived), 3067 (the fold shut when the filter changed)
and 3068 (the template box lost its cursor). Each fix added state and a repaint test. The tests written beside the code
had all passed, because none of them repainted between opening a thing and reading it.

## When this applies (and when it doesn't)

It applies to any view that redraws a region wholesale. A view that patches the DOM in place (the review's check boxes
call `refreshVerdicts()`, which touches only the buttons) does not lose the reader's place, and needs none of this.
Filters are a different case: tabs never remember a filter across visits (CLAUDE.md, Engineering practices), while a
fold or a caret is layout and may last the visit.

## See also

- `[[docs/csm_workspace_lessons]]` — the 2026-11-10 section
- PRs 3066, 3067, 3068 in `CPL-Initiative/cpl-project-tracker`

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
