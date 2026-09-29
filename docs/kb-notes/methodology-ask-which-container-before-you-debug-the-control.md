---
title: Ask which container the control is in before you debug the control
created: 2026-09-05
updated: 2026-09-05
tags: [methodology, ui, debugging, accessibility, fullscreen]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/kb-notes/methodology-the-first-run-of-a-new-instrument-measures-the-instrument]]"
artifacts:
  - prototype/ccr_universe.js
  - prototype/check_ccr_atlas.js
---

# Ask which container the control is in before you debug the control

> **One-sentence summary** — When a control cannot be reached in one mode of a
> page but works in another, the bug is almost never in the control; it is that
> the mode changed which subtree is rendered, and the control is outside it — so
> the first question is *what is my parent*, not *what is wrong with me*.

## The claim

A bug report names the thing the reporter can see. "The search box does not let
me click into it" names the search box, and that is the natural place to start:
its CSS, its z-index, whether something overlays it, whether the handler fired.
All of that can be perfectly healthy while the report is completely accurate.

**Certain page modes redefine what exists rather than what is styled.** The
browser's Fullscreen API is the sharpest example: `requestFullscreen()` paints
*one element and its descendants*, and everything else in the document is simply
not rendered. Nothing is hidden, overlapped or disabled — the rest of the page is
not in the picture. The same shape appears in an iframe (the parent's chrome is
another document), in a portal or dialog with `inert` outside it, and in a
virtualized list (the row exists in your data and not in the DOM).

So the diagnostic is structural, and it is one question: **which subtree is being
rendered in the mode where the control fails, and is the control inside it?**

## What happened

SkyView's map section (`#u-full`) is what goes full screen. The page's one search
field lived in the page masthead, above it. In normal view the two sit inches
apart and the search works; in full screen the masthead is not painted at all, so
the reader saw controls with a gap where the box should be and reported a box
that would not take a click.

Every instinct about a *stuck input* was wrong, and would have cost real time:
z-index, pointer-events, a stray overlay, the suggestion list intercepting the
pointer — this repo had in fact hit that last one two days earlier, which made it
the most plausible cause and the wrong one. The fix was not to the box. It was to
move the form inside `#u-full`.

⚠️ **The measurement that would have found it fastest was not a click test.** A
harness clicking the box in normal view passes. The question that separates the
two hypotheses is *"is `#gq` a descendant of the element that goes full screen"*,
and it is answerable in one line without reproducing the failure at all.

## Why it matters

The two hypotheses — "the control is broken" and "the control is not there" —
predict the same user report and completely different fixes. Time spent on the
first is unrecoverable, and the styling changes it tempts you into (raising a
z-index, adding `pointer-events`) stay in the codebase as confusing residue after
the real fix lands.

There is a corollary for tests: **a guard written against the old symptom can
block the new fix.** Here an earlier check asserted no title in the control row,
because a title had once pushed the links under the masthead's dropdown. The
correct fix for this bug — moving the search into that row — made the title safe,
and the guard would have failed on it. Re-pin the *invariant* (the dropdown and
the links share a positioning context) rather than the artifact of one past
failure.

## What to do

- **On any "works here, not there" report, name the two modes and diff the
  rendered subtree**, before reading a single line of the control's CSS.
- **Fullscreen, iframes, dialogs and virtualization all answer to this.** The
  test is `container.contains(el)` in the failing mode, not a click.
- **Move the element, do not copy it.** Two copies of one control means two ids,
  two sets of listeners and a state divergence; and remember that `innerHTML =`
  detaches rather than destroys, so a borrowed node needs an owner to give it
  back to before its host is replaced.
- **When a fix invalidates an old guard, replace the guard with the invariant it
  was protecting** — never delete it, and never keep it as-is.
