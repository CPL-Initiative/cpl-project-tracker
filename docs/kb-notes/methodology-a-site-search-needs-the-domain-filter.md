---
title: A search of one site needs the search tool's domain filter
created: 2026-10-08
updated: 2026-10-08
tags: [methodology, program-requirements-harvest, agents]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/program_requirements_harvest_lessons]]"
artifacts:
  - kb/receipts/program_source_procedure_maps_routes_2026-10-08_s346.sql
---

# A search of one site needs the search tool's domain filter

> **A `site:` operator typed into a WebSearch query is ignored; restrict the search with the tool's `allowed_domains` parameter, or a "found nothing" answer says nothing about that site.**

## Context

S346 asked each of 24 colleges' own websites for a term-by-term program map, one search per college, because each college's mapper refuses the CPL Initiative's reader. Three agents wrote queries such as `"Cuesta College" program map ... site:cuesta.edu`. The lessons doc, S346, has the run.

## What we measured

The search engine returned other colleges' pages for 17 of the 24 queries: Mesa Community College's course sequences, Santa Monica's maps, Las Positas PDFs. The agents reported "none found" for colleges whose own sites were never searched. Rerun with `allowed_domains` set to the college's domain and the same words, the searches returned only that college's pages and found real leads: department map PDFs at College of the Canyons, 2021 sequences at San Diego Miramar, and the PACE program's maps at Moorpark.

## The rule

- Restrict with `allowed_domains`, never with `site:` in the query string.
- Before recording "the college publishes no map" on a procedure record, check that the results came from the college's domain. A result list with none of them is a failed search, and a failed search settles nothing.
- Name the filter in the record's `tried` line (*one web search restricted to cuesta.edu*), so a later reader can tell a real search from a failed one.

## Why it matters beyond the harvest

Any agent fan-out that searches many named sites (colleges, issuers, agencies) can return plausible negatives in bulk. The negatives look like evidence and are cheap to file, so they get filed. The domain filter costs nothing and turns them back into evidence.
