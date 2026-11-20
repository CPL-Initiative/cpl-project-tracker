---
title: A bot wall answers each network on its own, so the reader's own capture is the record of access
created: 2026-11-20
updated: 2026-11-20
tags: [methodology, program-requirements-harvest, blocked-sources, catalog-harvest, sandbox, github-actions]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/blocked_sources]]"
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/kb-notes/playbook-runner-as-external-api-proxy]]"
artifacts:
  - kb/_college_page_read.py
  - .github/workflows/college-page-read.yml
---

# A bot wall answers each network on its own, so the reader's own capture is the record of access

> **A web application firewall scores the network a request comes from. On 2026-11-20 the same catalog addresses
> served the GitHub runner HTTP 200 with every course on the page and served a cloud session HTTP 202 with an AWS WAF
> check. A probe from the session answers for the session; the reader's own capture on the runner, with its run id,
> its status and its headers, is the record of what the reader can read.**

## Context

Sam's go of 2026-11-20 (relayed by COBIx on #3584, comment 7042043701) asked the collection wave to read sixteen
catalogs that block the nightly script reader with a plain, browser-like page read. That morning a plain session
measured North Orange Continuing Education's catalog from its cloud sandbox: a plain request got 202 with an empty
body, for the course page and `robots.txt` alike, and a browser load got the same 202 with AWS WAF's check page. It
proposed holding the five checked hosts. The conductor, S690, ran the census Reader on the runner, which got 200
with content. The run: [`program_requirements_harvest_lessons`](../program_requirements_harvest_lessons.md), *S690*.

## The claim

1. **The answer belongs to the network.** A bot wall (AWS WAF, Cloudflare, a bot-management check) decides each
   request, and the network it comes from weighs in. The runner and a cloud session's sandbox, its proxy and its
   browser, asked the same five hosts (`catalog.nocccd.edu` and four CourseLeaf catalogs) and got different answers:
   200 on the runner, 202 with a check in the sandbox.
2. **Only the reader's own request says whether the reader is served.** A session's probe, either way, says what the
   session was served.
3. **The record of access is the reader's capture.** The committed capture names the run, the status and headers the
   reader got, and that it asked `robots.txt` first. A lane line, a `blocked_sources` row or a card for Sam cites that
   capture. Here the committed captures had answered the question before anyone probed: North Orange's census run
   43342034608 (2026-11-13, sitemap 200, 135 pages read) and Southwestern's 44529722751 (2026-11-19, 451 pages, no
   challenge recorded), as the plain session found when it re-read them (#3584, comment 7042730508).
4. **The reader keeps the same rules on every network.** It names the CPL Initiative, asks `robots.txt` first, stops
   on an `x-amzn-waf-action` header or a 202, and never retries. A host that challenges the runner stays blocked and
   goes to the by-hand route (`kb/hand_filed_catalogs/`). A page the host serves the runner is a page served, with no
   check passed. COBIx's reading of the go (#3584, comment 7042639554): browser-like means an ordinary page request,
   never a browser that completes the check.

## How we got here

- The sandbox: 202 with an empty body, then AWS WAF's check page in a browser, its script from `token.awswaf.com`;
  the session's permission check refused a browser run that would pass it (#3584, comment 7042523337).
- The runner: `college-page-read.yml` got 200 at `catalog.nocccd.edu` (runs 44755984932, 4 pages, and 44756513382, 41
  pages) with no WAF header in either log (comment 7042630940), then at Southwestern, Cerritos, Long Beach City and
  Monterey Peninsula.
- The result: 17,341 printed courses at 16 colleges filed in one night, with no paid extraction.

## When this applies (and when it doesn't)

- It applies to a host whose block is a scored challenge: a WAF, a bot-management check, a 403 that serves a script.
- A rule binds every network alike: `robots.txt`, a sign-in, a paywall, or a block that names the CPL Initiative on
  purpose. Each stops the read wherever it runs ([`blocked_sources`](../reference/blocked_sources.md), *What still
  goes to Sam*).
- It grants no change of user agent, no retry of a challenge, and no browser that passes a check. The runner reads
  what the host serves it.
- The answer can change overnight. Each night's capture is the record for that night.

## See also

- [`blocked_sources`](../reference/blocked_sources.md), step 1 (name the kind of block): read the kind from the
  reader's own capture.
- [`playbook-runner-as-external-api-proxy`](playbook-runner-as-external-api-proxy.md): the runner as the route for
  what the sandbox's own proxy refuses.
- `cpl_memory`: `f-waf-answers-runner-and-session-apart-s690`; Sam's go, `r-plain-page-read-blocked-catalogs-sam-2026-11-20`.
