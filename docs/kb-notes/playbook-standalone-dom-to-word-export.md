---
title: Export a standalone page to Word (.doc) from the live DOM, no library
created: 2026-06-28
updated: 2026-06-28
tags: [playbook, export, word, standalone, fact-sheet]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb-notes/playbook-standalone-public-page]]"
artifacts:
  - fact-sheet/factsheet_word.js
  - tests/factsheet_word.test.js
---

# Export a standalone page to Word (.doc) from the live DOM, no library

> **One-sentence summary** — to add a "Download as Word" button to a static,
> no-build page, clone the live `<main>`, clean it, and wrap it in mso-namespaced
> HTML served as an `application/msword` Blob — Word opens it natively, no docx
> library, and it reflects whatever the visitor currently sees (live data + edits).

## Context

The CPL Fact Sheet is a standalone, no-build page that renders live (`live_metrics.json`
+ Supabase Curate overrides). It exported to PDF via the browser print dialog; Sam
wanted a Word doc too. Re-authoring the content with `docx@8` would (a) duplicate
~700 lines of HTML, (b) NOT reflect live data / reviewer edits unless you re-walk the
DOM anyway, and (c) add a 334 KB dependency to a page that ships zero libraries.

## The claim

**DOM-to-`.doc` beats docx for a render-live, no-build page.** Word opens the
"filtered HTML" format it emits itself for *Save as Web Page* — an mso-namespaced
HTML document. Build that string from a clone of the rendered DOM and download it as
an `application/msword` Blob. It captures exactly what's on screen (live KPIs, Curate
overrides, added boxes/images), with no dependency. (A *true* editable `.docx` via
docx@8 is a possible follow-up if deep re-editing is ever the deliverable — fidelity
of current content beats OOXML purity for a read/share fact sheet.)

## The recipe

1. **Clone, don't mutate.** `var clone = document.querySelector('main').cloneNode(true)`.
   Operate only on the clone; assert the on-screen DOM is byte-identical before/after.
2. **Strip chrome + hidden content.** Remove `.no-print`, the TOC, all curate controls
   (`.fs-del/.fs-add/.fs-imgbar/.fs-dock/#btn-curate`), the live-data chip, `<script>`,
   `<style>`, and any reviewer-hidden boxes (`.fs-ov-hidden`).
3. **Expand collapsibles.** Remove `.collapsed`, drop `[hidden]`, set every `<details open>`.
4. **Flatten CSS-grid pseudo-tables to real `<table>`s.** Word renders `<table>` well
   and CSS grid poorly; the statewide grid is rebuilt into a `<table class="data">`.
5. **Absolute image URLs.** `new URL(img.src, document.baseURI).href` — Word can't
   resolve `./img/...` relative to a Blob. Clamp oversized inline widths.
6. **Inline a print-like CSS subset** in a `<head><style>` (Word won't fetch an external
   sheet). Convert grid containers to `display:block` (Word's grid support is weak); set
   colors explicitly (`print-color-adjust` is a no-op in Word).
7. **Wrap in the mso shell + BOM:**
   ```
   '﻿<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">'
   + '<head><meta charset="utf-8">'
   + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View></w:WordDocument></xml><![endif]-->'
   + '<style>@page WordSection1{size:8.5in 11.0in;margin:0.4in;}div.WordSection1{page:WordSection1;}'
   +   docCss() + '</style></head><body><div class="WordSection1">' + head + clone.innerHTML
   + '</div></body></html>'
   ```
   The leading BOM (`﻿`) makes Word read UTF-8 (em-dashes, ⭐, curly quotes).
8. **Download:** `URL.createObjectURL(new Blob([html],{type:'application/msword'}))` +
   a temporary `<a download="Name_<date>.doc">`; `revokeObjectURL` after. Keep `<a href>`
   links — Word preserves them as clickable hyperlinks.

## Testing (jsdom)

Expose `buildDoc()` returning `{html, filename}` (pure string — `URL.createObjectURL`
is unimplemented in jsdom, so keep the Blob/download out of the testable path). Guard:
mso namespace present, dated filename, chrome + `.fs-ov-hidden` stripped, `<details>`
expanded / grid → `<table>`, images absolute, a current `innerHTML` edit reflected, and
**the live `<main>` unchanged** (clone-not-mutate).
