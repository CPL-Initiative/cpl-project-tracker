---
title: A JavaScript catalog is data; read what its own scripts fetch
created: 2026-10-10
updated: 2026-10-10
tags: [methodology, program-requirements-harvest, curriqunet, scraping]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_college_page_read.py
  - kb/_program_requirements_college.py
  - kb/college_reads/rccd_curriqunet_outline.json
---

# A JavaScript catalog is data; read what its own scripts fetch

> **When a page draws itself with JavaScript, the browser has already asked the server for the data in a clean shape;
> record those requests once, then read that data directly instead of clicking through the page.**

## Context

Twenty-seven California community colleges publish their catalogs on curriQunet, whose views draw every menu from
scripts and carry no links. The pilot reached each program by clicking through menus and reading a PDF export, one
program at a time, and the college read could not list a curriQunet catalog at all (lessons doc, S357).

## The claim

A page built by scripts fetches its content from its own host. Loading it once with the browser's responses recorded
shows those calls and their shapes. At Riverside City two free reads (`"network": true` on the college page read, four
page loads, no model calls) found `_getNavigation`, which lists a section's entries (229 programs in one call), and
`_getPage`, which returns one program's page with each award's requirements as HTML. The college read then needed one
call per list and one per program, with no rendering, no clicking and no PDF export.

## How to apply

- Before writing a clicker or a PDF parser for a script-built site, load one page with `"network": true` and read the
  calls it makes. Keep to the page's own host and to calls the browser made for it.
- Read the data calls under the same rules as pages: robots first, the census delay before each call, the census
  user agent (`cq_json`).
- Calls that need a sign-in answer with a redirect; read nothing behind them.
- Keep the catalog's own words: turn the HTML into the lines a reader sees (`cq_text`) and match them exactly as a page.

## Evidence

Runs 38075620248 and 38076194967 (the probes), run 38077405309 (Riverside City capture: 435 entries, 228 of 262 programs
given a page, no errors), cpl-project-tracker #1960 and #1961, memory row `roep-curriqunet-catalog-json-2026-10-10`.
