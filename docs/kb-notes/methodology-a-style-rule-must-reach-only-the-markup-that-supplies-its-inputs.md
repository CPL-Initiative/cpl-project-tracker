---
title: A style rule must reach only the markup that supplies its inputs
created: 2026-09-29
updated: 2026-09-29
tags: [methodology, ui, css, print, first-light]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[ui_mockup_lessons]]"
artifacts:
  - cpl_funding.js
  - funding-model/index.html
  - tests/cpl_funding_college_dashboard.test.js
---

# A style rule must reach only the markup that supplies its inputs

> **A rule that only works with something one element supplies (a colgroup, an inline minimum) must be scoped to that element, and every other context that renders it (print, an embed) must release what the element adds.**

## Context

The College Dashboard (Sam, 2026-09-28) gave the funding tab's institution table a fixed layout. That layout depends on two things `tableHtml()` writes: a `<colgroup>` sized for the visible columns, and an inline `min-width` below which the table scrolls inside its own container. Both ports put the fixed layout on `table.cplfund-table`, the class the table shares with the $50K grants table.

## The two failures (measured in Chromium, 2026-09-29)

- **A shared class carried the rule to a table that writes no colgroup.** The grants table split into five equal 219px columns. Its cells do not wrap, so three recipient names ran over the Grant column ("San Diego College of Continuing Education", 302px in a 219px cell). The fix scopes the rule to a class only `tableHtml()` writes, `.cplfund-coltable`.
- **An inline style outranked the print stylesheet.** The public explainer prints itself, and its print rules set the table to the page's width. The inline `min-width:898px` beat every print rule except an `!important` one, so the printed table ran 898px wide in a 720px page box. The explainer's print rule now releases the minimum: `min-width:0 !important`. COBI's own print copy already did.

## The rule

1. **Name the element that supplies the rule's inputs, and scope the rule to a class only that element writes.** A base class shared across tables is a statement about looks, never about layout.
2. **For every context that re-renders the element, find what it adds and release it there.** Contexts include the print stylesheet, an embed on another page, and the print window's cloned copy. An inline style is the one thing a stylesheet cannot override quietly.
3. **Measure in a browser, not in jsdom.** jsdom returns zero for every rectangle. The commit guards the scope in source (`cpl_funding_college_dashboard` 9a–9c) and the print release (`funding_model_page`). The measurement that found the defects is Chromium's.

## Related

- [`ui_mockup_lessons`](../ui_mockup_lessons.md), S300's section.
- House rule behind the fixed layout: CLAUDE.md, *No horizontal scroll whenever feasible* (use `table-layout:fixed` and an explicit colgroup).
