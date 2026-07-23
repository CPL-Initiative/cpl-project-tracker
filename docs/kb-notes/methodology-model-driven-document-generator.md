---
title: Methodology — Model-driven house-format document generator (memo/letter/report/brief) with inline edit + Word/PDF export
created: 2026-07-23
updated: 2026-07-23
tags: [methodology, document-generation, docx, memo, funding, contenteditable, no-backend, session-skyfunder]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-three-layer-scenario-config]]"
artifacts:
  - cpl_funding.js (buildMemo / reportViewHtml / exportMemoDocx / memoDocxBlocks)
  - docx.min.js (window.docx — Document/Paragraph/TextRun/Table/Packer)
---

# Methodology — Model-driven house-format document generator

> **One-sentence summary** — when a tab already holds the numbers, generate a
> fixed house-format document (a CO memo, a letter, a brief) *from the live
> model* as an editable page, and export it to Word by walking the edited DOM
> into `docx` — no LLM, no backend, no drift.

## Context

The Implementation Funding tab needed a "Report" button producing a guidance
memo in the exact format of CO memo **ESS 25-82**. The instinct is to reach for
the LLM report generator (`report_generator.js`), but that's the wrong tool: the
memo must match a house format *exactly*, every number already lives in the tab's
model, and hallucinated figures in a funding memo are unacceptable. Full story:
`docs/cpl_funding_lessons.md` (SkyFunder).

## The claim

For a document whose **structure is fixed** and whose **data you already have in
memory**, a structured template generator beats an LLM on every axis — fidelity,
speed, cost, trust. The shape:

1. **`documentModel()`** — pull the values from the live app state (pools,
   totals, deadlines, the priority list, the allocation table). One function,
   pure read.
2. **Shared body-section builders** — `overview()`, `priorities()`,
   `allowableUse()`, `allocation()`, … each returns an HTML fragment from the
   model. Doc-type variants (memo / letter / report / brief) **share the body**
   and differ only in the header/greeting/closing framing.
3. **Editable surface** — render the assembled HTML into a
   `contenteditable="true"` page styled to look like the printed document. The
   user edits any wording inline before exporting. (Document the reset semantics:
   inline edits are export-only; Regenerate rebuilds from the model.)
4. **Export from the *edited* DOM, not the model** — so hand-edits survive:
   - **PDF**: open a print window with the memo's `innerHTML` + print CSS →
     browser Print → Save as PDF (the fact-sheet pattern; literal colors since a
     transient window can't see the app's `:root` tokens).
   - **Word (.docx)**: a small **DOM→docx walker** over the repo's already-loaded
     `docx.min.js` (`window.docx`). Map `h1/h2 → heading Paragraph`, `p → Paragraph`,
     `ul>li → bulleted Paragraph`, `table → docx Table`, `strong/b → bold TextRun`,
     and **recurse into `div/span` containers**; fall back to a text Paragraph for
     anything unrecognized. `ensureDocx(cb)` lazy-loads `docx.min.js` if
     `window.docx` isn't present (mirrors `report_generator.js`'s `ensureDocxLib`).

## When to reuse

Any "generate a formatted deliverable from what's on screen" surface: an
allocation memo, a college award letter, a program brief, a board one-pager. The
test: **is the layout fixed and is every value already in the app?** If yes, this
pattern; if the prose must be *composed* (audience-tuned narrative), that's the
LLM generator's job instead.

## Pitfalls

- **Export from the DOM, not the model** — or inline edits silently vanish from
  the Word/PDF.
- **Verify docx in a real browser, not jsdom** — `Packer.toBlob` needs a real
  environment. A Chromium harness that clicks ⬇ Word and asserts a non-empty
  `.docx` download is the honest test (jsdom covers the HTML structure only).
- **Don't put names/attributions in defaults you can't stand behind** — default
  the FROM/contact/number to editable role-titles/placeholders; the curator fills
  specifics. The document is a draft they own.
- **Keep the body builders shared across doc types** — divergent copies drift.
  Vary only the framing.
