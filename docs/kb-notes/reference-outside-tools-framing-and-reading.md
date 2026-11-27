---
title: What PPM, CVC and ASSIST allow a page to frame or read
created: 2026-11-27
updated: 2026-11-27
tags: [reference, connections, ppm, cvc, assist, cpl-pathways, data-sources]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[data_sources]]"
  - "[[commons]]"
artifacts:
  - kb/_college_page_read.py
  - kb/college_reads/outside_tools_frame_check.json
  - tests/college_page_read_frame_test.py
---

# What PPM, CVC and ASSIST allow a page to frame or read

> **One-sentence summary** — before a COBI view opens an outside tool in a bottom bar or a runner reads it, check the
> tool's framing headers and robots rules on a runner, because each of the three priority partners answers differently
> and one of them locks a browser out after a single click.

## Measured 2026-11-27 (S745; runs 46064228996, 46064419390)

`kb/_college_page_read.py` `frame_check` fetches a page and `frame_verdict` reads its `X-Frame-Options` and
`Content-Security-Policy frame-ancestors`.

| Tool | Frame in a bottom bar | Automated reading | Address to open |
|---|---|---|---|
| PPM directory | allowed | allowed | `programmapper.org/ppm-schools/?search=<college>` |
| PPM college map sites | not measured past the refusal | refused (403) | `/pathway/<slug>/?pt=map&year=2026&t[]=1..4`; `&v=1` is Table View |
| CVC students page | allowed | allowed | the students page |
| CVC search | not measured | `search.cvc.edu` robots.txt disallows readers | none |
| ASSIST | forbidden (`X-Frame-Options: SAMEORIGIN`) | public `/api` answers 400 when loaded directly | `assist.org`; its AI tool is a chat with no deep link |

## Two traps

- **PPM's Share and Print answer 403, and afterward every PPM map refuses that browser** until its site data is
  cleared (Sam, Firefox and Edge, 2026-11-27). A link from COBI should open the map by address, never through Share.
- **ASSIST's page reads its own API** (`/api/institutions`, `/api/AcademicYears`, where 2026-27 is 77,
  `/api/agreements?...&categoryCode=major`, `/api/articulation/Agreements?Key=<key>`), so a browser-driven capture can
  read one agreement, but systematic use of agreement keys needs ASSIST's institutional API key.

## What follows

A partner chip on a CPL Pathways card links out (PPM by map address, CVC to its students page) or, for ASSIST, opens
our own summary with a link to assist.org. The register entries and the requests: `docs/reference/data_sources.md`.
