---
title: Alt text a program wrote is no alt text
created: 2026-10-29
updated: 2026-10-29
tags: [methodology, accessibility, alt-text, remediation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - library_remediate.js
  - library.js
---

# Alt text a program wrote is no alt text

> **A picture whose description is its file name or Office's own guess has not been described; and a QR code's
> description says where it leads, not what it looks like.**

## Context

The Library's remediation (see `docs/library_lessons.md`, *Each picture with its slide (S517, Sam's session)*)
checks every picture in a deck, document or workbook for alt text. A check that asks only whether alt text exists
passes pictures nobody described.

## The claim

### Two kinds of alt text are written by a program

- **A file name.** python-pptx writes each picture's file name into its description (`padlet.png`), and some
  exports do the same.
- **Office's own description.** PowerPoint and Word mark what they wrote: *Description automatically generated*
  (older) or *AI-generated content may be incorrect.* (newer). For a QR code it reads *A qr code on a white
  background*, which Sam called *"a generic long, useless description of the qr code leading to somewhere."*

Treat both as missing. Keep Office's words as a draft, without its notice, for a person to read.

### A QR code says where it leads

Read the code (jsQR in the browser) and write the label beside it on the slide and the address, without the
scheme: *QR code to MAP Website, map.rccd.edu*. A model cannot read a code reliably; the page can, exactly.

### A picture is described from its slide

The words nearest a picture (a label just below a QR code, a caption beside a photo), the slide's title and the
picture's own name in the file say what it is for. A video's poster frame is named a video, from its name.

## How we got here

Sam's first live run of remediation on the Summit's welcome deck, 2026-10-29: PowerPoint's own QR description was
useless, and a test deck built with python-pptx passed every picture because each carried its file name.

## Where it applies

Any accessibility check of Office files, the CO's review included: WCAG 2.2 success criterion 1.1.1 (Non-text
Content) asks for a text alternative that serves the same purpose, which a file name or a pattern description does
not.
