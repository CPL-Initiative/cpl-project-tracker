---
title: Mock up a UI change with the running code, then port it
created: 2026-09-28
updated: 2026-09-28
tags: [methodology, ui, mockup, first-light]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[ui_mockup_lessons]]"
  - "[[reference-ui-design-system]]"
artifacts:
  - cpl_funding.js
  - sierra_training.js
---

# Mock up a UI change with the running code, then port it

> **A mockup the product's own code drew can be changed round by round in front
> of the owner, and each locked change ports back as markup and class names the
> code already uses.**

## Context

Sam directs UI work by reacting to what he sees ("Show, don't describe"). On
2026-09-28 he locked a seven-round redesign of the funding tab's College
Dashboard in about two hours this way. Lessons from that run:
[`ui_mockup_lessons`](../ui_mockup_lessons.md).

## The claim

Build the round-0 mockup from the live DOM, never from a redraw:

1. **Render the real tab** from a local server in headless Chromium. Seed the
   sign-in state the tab checks, and answer the data calls from fixtures read
   once through the MCP, so the figures match what the owner sees.
2. **Capture the section's markup and every CSS rule that matches it**
   (`document.styleSheets`, filtered by `Element.matches`). Drop the host
   page's layout and dark-theme blocks; commit the replica to one look.
3. **Publish one page holding two copies**, Mockup and Today, with a round
   number, an update time, and a numbered change list in the owner's words.
4. **Apply each round as a script** over the captured base, so a fresh capture
   re-runs every change in order.
5. **Map the consumers before porting**: every surface that reuses the markup,
   every test that pins it. Then port with the mockup as the spec and verify the
   port against it with the same capture harness.

## Why it holds

- The owner sees his real numbers, so reactions are about the design, never
  about unfamiliar sample data.
- Changes land on real class names, so the port is edits to known functions
  rather than a translation from a drawing.
- The Today copy is always one click away, which makes every change visible as
  a difference.

## Limits

- Interactions the capture does not include (other rows' drill-ins, forms) need
  their own capture or a note on the page saying they are inert.
- A mockup shows one data state. Name the sample on the page (a sample
  attestation, a trimmed list) so no one reads it as live.
