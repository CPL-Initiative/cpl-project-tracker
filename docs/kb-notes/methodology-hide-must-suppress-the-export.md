---
title: A hide affordance must suppress the item in the report too — reuse the class the export already strips
created: 2026-07-23
updated: 2026-07-23
tags: [methodology, fact-sheet, overlay, export, print, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb-notes/playbook-standalone-dom-to-word-export]]"
  - "[[docs/kb-notes/methodology-stable-dom-keys-exclude-live-text]]"
artifacts:
  - fact-sheet/factsheet_edit.js
  - fact-sheet/factsheet_word.js
  - fact-sheet/factsheet.css
  - tests/factsheet_edit_section_hide.test.js
---

# A hide affordance must suppress the item in the report too — reuse the class the export already strips

> **One-sentence summary** — when you add a "hide" control to a page that also has
> a report/export, "hidden" has to mean hidden **in the report too**; the cleanest
> way is to mark hidden things with the *same class the export already strips*,
> not a fresh mechanism — and never with the `hidden` attribute, because a
> DOM-cloning export deliberately un-hides `[hidden]` and the item reappears.

## Context

The CPL Fact Sheet (`fact-sheet/`) is a standalone page with a reviewer **Curate**
overlay, a **⬇ Word** export (`factsheet_word.js`, DOM-clone → mso `.doc`), and a
**🖨 Print / Save PDF** path (`window.print()`). Two tasks landed a "hide" feature:
first a one-off hide of the Funding section, then a general per-section **Hide
section** toggle. Both had to hide the thing on the page **and** keep it out of
both reports — a hide that still prints/exports isn't a hide.

## The claim

**1. Reuse the report's existing suppression lane; don't build a parallel one.**
The Word export already strips `.fs-ov-hidden` (reviewer-hidden boxes) before
assembling the doc, and Print already has `.fs-ov-hidden{display:none !important}`.
So a *new* whole-section hide just marks the section (and its TOC link)
`.fs-ov-hidden` — page-hide, print-hide, and export-strip all come for free, with
zero new report code. Persist it as a reserved override key (`<sid>|__hidden`)
parallel to the existing box-hide, and the whole feature is ~1 class + 1 key.

**2. Never hide with the `hidden` attribute if a DOM-cloning export exists.**
`factsheet_word.js` intentionally *un-hides* every `[hidden]` element on its clone
(`hid.forEach(h => h.removeAttribute('hidden'))`) to flatten collapsibles into a
flat printed doc. So an element hidden via the `hidden` attribute is **revealed**
in the export — the exact opposite of intent. Hide with a class the export
**strips** instead. (This bit the first Funding hide: `hidden` would have made the
funding table reappear in the Word doc.) When a source-level, always-hidden state
is wanted, use a dedicated stripped class (`.fs-withheld`) — same principle.

## How we got here

- **Funding hide** (#874): used a dedicated `.fs-withheld` class (display:none +
  added to the export's strip list) precisely *because* `[hidden]` gets un-hidden
  by the export. A test guards that a `.fs-withheld` element stays out of the doc.
- **Per-section Hide toggle** (#875): generalized it by reusing `.fs-ov-hidden`
  (the box-hide class the export already stripped) on the `<section>` + its TOC
  link, driven by a reserved `<sid>|__hidden` override. Ghosted + un-hideable in
  Curate mode via the existing `body.fs-curating .fs-ov-hidden` rule — also free.
- **Un-hide** (#876): removing the class restored the section byte-identically.

The tell each time: before shipping a hide, ask "does the export/print honor it?"
and trace the export's own transform — an export that *normalizes* the DOM (opens
`<details>`, un-hides `[hidden]`, expands `.collapsed`) can silently defeat a
naive hide.

## When this applies (and when it doesn't)

- Applies to any page with a **reviewer/curator hide + a report/export**, whenever
  the export clones and *normalizes* the live DOM.
- The "reuse the stripped class" move only works if the export strips by class
  **before** its un-hide/expand pass. If your export un-hides first, either strip
  earlier or gate the un-hide to skip a marker class.
- Doesn't apply to a hide that is *only* visual (e.g. a collapse the export is
  meant to expand) — there the export is right to reveal it.

## See also

- `[[docs/fact_sheet_lessons]]` — the workstream (SkyVeil section, 2026-07-23)
- `[[docs/kb-notes/playbook-standalone-dom-to-word-export]]` — the export whose
  un-hide pass this note warns about
- PRs `#874` (Funding hide), `#875` (per-section toggle), `#876` (un-hide)

---

*Authoring check: durable (the export's un-hide pass is a standing property),
reusable (any curator-hide + export surface), distilled (hide-everywhere via the
already-stripped class), self-contained (frontmatter + opener carry the claim).*
