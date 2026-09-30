---
title: A sticky header sticks only inside a box that scrolls
created: 2026-09-30
updated: 2026-09-30
tags: [methodology, ui, tables]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[reference-ui-design-system]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
  - funding-model/index.html
---

# A sticky header sticks only inside a box that scrolls

> **`position: sticky` pins a header to its nearest scrolling ancestor, so a table wrap with `overflow-x: auto` and no height holds a header that never sticks.**

## Context

The Implementation Funding tab's College Dashboard carried `position: sticky; top: 0` on its header cells from 2026-08-30, and Sam asked on 2026-09-30 to "freeze top row of college table and add vertical scroll". The rule had been in the stylesheet for a month and had never done anything. The story is in [`cpl_funding_lessons`](../cpl_funding_lessons.md), S306.

## The claim

A sticky element sticks to the scrollport of its nearest ancestor that has any `overflow` other than `visible`. Setting `overflow-x: auto` on a wrap makes the wrap that ancestor for both axes, because a box cannot clip one axis and leave the other visible. A wrap with no height grows to fit its rows, so it never scrolls up and down, and its header scrolls away with the page like any other row.

So a table that must scroll sideways on a phone and keep its header in view needs its wrap to scroll both ways:

- give the wrap a height cap (`max-height: 75vh`) and `overflow: auto`;
- keep the header cells `position: sticky; top: 0`, and pin any row beneath them at an offset measured from the rendered header, never typed;
- release the cap for print (`max-height: none; overflow: visible`), or the PDF carries one screenful of rows;
- give the wrap `tabindex="0"`, a `role="region"` and an `aria-label`, so a keyboard reader can scroll it.

The page-level alternative, a header that sticks to the window, needs the wrap to have no `overflow` at all, which gives up the sideways scroll the mobile rule requires.

## How we got here

Measured in Chromium on 2026-09-30: with the cap, scrolling the wrap 900px left the header's top edge exactly where it started (moved by 0px); without it, the wrap's scroll height equaled its client height and the header left the screen with the page. jsdom cannot show either state, because it returns zero for every rectangle; `npm run a11y` and a Playwright capture are the checks that can.

## Where it applies

Every COBI table wrapped in a scrolling container: the pattern in [`reference-ui-design-system`](reference-ui-design-system.md) ("sticky `<thead>`") holds only when the container scrolls.
