---
title: Test a reader fix on the page it failed on
created: 2026-10-11
updated: 2026-10-11
tags: [methodology, harvest, capture, testing, fixtures]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/methodology-a-page-can-hide-text-that-names-every-course]]"
  - "[[docs/kb-notes/methodology-a-harness-must-verify-its-own-fixture]]"
artifacts:
  - kb/_program_requirements_pilot.py
  - kb/_college_page_read.py
  - tests/program_requirements_pilot_test.py
---

# Test a reader fix on the page it failed on

> **One-sentence summary** — a fixture built from a description of a failing page tests the description, so a fix to
> a page reader is checked against the real page, or its saved HTML, before any paid read depends on it.

## Context

The program requirements harvest reads each college's catalog pages in a runner the sandbox cannot reach. When a read
fails, the session sees only what the read filed: the text it chose, the field it chose it from, and the records the
model wrote. A fix is then written against what those files imply about the page.

## The claim

A page described secondhand loses the detail that broke the reader. S362 learned that Long Beach City keeps Program
Requirements in a hidden tab, built a page with a hidden tab and a hidden course index, and wrote a tab reader that
passed on it. The real pages keep the tab bar inside `<nav id="tabs">`, and the reader dropped every link inside a
`nav` as a site menu. The built page had no nav around its tabs, because nothing in the evidence said there was one.

So the order is: get the real page first, then fix, then check the fix against that page.

- **Get the page.** Where the sandbox cannot load it, load it in the runner and commit what you need: the HTML, and an
  account of the elements in question (for tabs: each link, its container, the panel it points at, whether that panel
  renders). The repo's page reader does this from a plan file (`kb/_college_page_read.py`, `kb/college_reads/`,
  `college-page-read.yml`), with no model calls.
- **Check the fix against the saved HTML** in a local browser, hiding what the live page hides (the probe records it;
  saved HTML loads without the site's CSS and scripts, so everything shows unless you hide it).
- **Then a small paid trial** (`limit` a dozen programs), read by the field each source came from before its records.

## How we got here

Trial 1 of S362's fix (run 38139252216, $0.85) read `textContent` for all 12 programs; 11 records came back empty, as
the first read had for $22.66. The probe (run 38146508042) showed the nav. The fix (#1986) was checked on the four
saved pages (coverage 0.97 to 1.00 where the visible text alone read 0.00), and trial 2 (run 38147472758) read 11 of 12
from the Requirements tab. One probe and one free local check would have spared one paid trial and an hour of capture.

## What this does not say

A built fixture still belongs in the committed tests: it guards the failure mode once the real page has shown what the
failure is, and the CI suite cannot launch a browser or reach a college. The real page is the check that the fixture
describes the right thing.
