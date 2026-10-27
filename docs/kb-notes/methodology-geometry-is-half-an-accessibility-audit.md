---
title: Geometry is half an accessibility audit
created: 2026-10-26
updated: 2026-10-26
tags: [methodology, accessibility, wcag, public-pages]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[cpl_funding_lessons]]"
artifacts:
  - scripts/a11y.js
  - a11y.config.js
---

# Geometry is half an accessibility audit

> **A sweep that measures what a page paints (contrast, target size, overflow, focus rings) passes pages that a rule engine fails on names, roles, language and landmarks; run both before calling a page accessible.**

## Context

Sam asked, on 2026-10-26, that the public funding page and every view it links to meet "the latest state and federal standards" before the 7th Annual CPL Summit. The repo's `npm run a11y` passed all eight views. An axe-core 4.10.2 sweep of the same views found four WCAG failures it had not measured. Lessons: `docs/cpl_funding_lessons.md`, S492.

## The claim

**The standard.** WCAG 2.2 AA is the working target. It contains WCAG 2.1 AA, which the DOJ's ADA Title II web rule names for public entities, and the WCAG 2.0 AA that Section 508 and California law (Gov. Code 7405, 11135) adopt.

**What `scripts/a11y.js` measures** is what a browser paints: the contrast of every painted pair, 24px targets (2.5.8), horizontal overflow, panels a breakpoint drops, focus rings, heading order, reduced motion, and per-target keyboard behavior. jsdom can measure none of it, which is why the runner exists.

**What it does not measure** is the accessibility tree:

- a page's `lang` (3.1.1);
- links told apart from text by color alone (1.4.1);
- a heading coded `role="button"`, which drops it from a screen reader's heading list (1.3.1);
- two landmarks with one name;
- ARIA attributes a role does not allow.

**A rule engine measures exactly these.** axe-core, pinned, run in the same served page, found all four classes on views the runner passed.

**Some criteria neither tool sees:**

- **A video's meaning carried on screen.** A music-only film needs a text alternative (1.2.1, 1.2.3) and, at AA, audio description (1.2.5).
- **Information kept in `title` tooltips**, which keyboard and touch cannot open. Judge whether each repeats what the page already shows.

## How we got here

- **Funding page:** passed both tools after its header rework.
- **Fact Sheet:** passed the runner but failed axe on 21 color-only links and 16 heading-buttons.
- **Film page:** passed the runner but had no `lang` and nothing outside the picture to read.
- **Memo:** had two scrolling regions that shared one name.

Each fix was re-measured with both tools at 1280 and 390px (#2478, #2479, #2482).

## Implications

- Before a public view ships, run `npm run a11y` **and** an axe pass. Since S494 (#2492) `scripts/a11y.js` runs axe-core 4.10.2 itself, once per route at the widest width, before the focus-ring loop: that loop scrolls tables under their sticky headers, and axe then read an 80x27 caret as obscured.
- The first full run with axe found what geometry never could on COBI: a side menu declared as a tablist that held group heads and links (critical, every route; #2494), unnamed filter selects, a focusable separator with no value, and directory rows that were buttons standing in for list items (#2495).
- A target turns an axe rule off only with a reason (`axeDisable`), and a target that throws fails without ending the sweep.
- A film's transcript should be generated from the scenes' own words, so it cannot drift from the picture.
