---
title: A search result is a lead, not a source
created: 2026-10-05
updated: 2026-10-05
tags: [methodology, college-page-read, program-requirements, web-search, provenance]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[docs/program_requirements_harvest_lessons]]"
  - "[[docs/reference/lanes/program-requirements-harvest]]"
artifacts:
  - kb/_college_page_read.py
  - kb/college_reads/cerritos_ironworker_ladder_read7.json
  - kb/college_reads/cerritos_ironworker_ladder_read11.json
---

# A search result is a lead, not a source

> **A web search result proves only that a page existed when the index last visited it.** Load the address before you cite it, and record what it answered, so no later reader trusts the snippet again.

## Context

The program requirements harvest reads each college's public pages from a runner, and a session finds those pages by web search. For Cerritos College's list of articulated high school courses, search returned confident results: titled pages, snippets describing a public agreement search, even a page described as listing agreements by district. Three of them were dead. Detail: [the lessons doc](../program_requirements_harvest_lessons.md), S331.

## The claim

A search engine keeps a page's title and snippet long after the page, or the whole host, is gone. So a search result tells a session where to look, and only a load tells it what is there.

- **Load before you write.** Read the address from a runner (or the session's own fetcher) before it reaches a plan, a ladder line, a request to a college or a memory row.
- **Record the answer on the procedure record.** A dead host goes on the college's record as `unreached` or `gone`, with the date and run. The reader skips hosts the record marks that way, so the cost is one load, once.
- **Treat the snippet as a description of the past.** A snippet that says *"you can search all agreements"* describes the site as it was. The site today may not exist.

## How we got here

S331's reads 7 and 11 for the Cerritos Ironworker ladder:

| Address search returned | What a runner found |
|---|---|
| `hsarticulation.cerritos.edu` ("About High School Articulation") | no DNS record |
| `cerritos.ctecourseconnect.com` ("Cerritos College CTE Course Articulation", with a public search) | no DNS record, and the Internet Archive holds no capture |
| `/academics/divisions/epp/Articulation_List.htm` ("Articulation Agreements", described as listing agreements by district) | 404 |

Each looked like the answer. Each cost one runner load, and each now sits on Cerritos's procedure record (v4) so no read repeats it. The answer that held up came from the Internet Archive's dated 2016 capture of the old statewide database, labeled as 2016 rather than as today's list.

## When this applies (and when it doesn't)

It applies to any claim built from web search: a college page, a vendor portal, a statewide database, a news item. It matters most where the claim reaches an outward artifact or a request to a college.

It does not mean search is unreliable for finding things. Search found the leads that mattered: the archive's capture, and the Downey Unified and Columbus High pages. The rule is about the step between finding and citing.

## See also

- `[[docs/program_requirements_harvest_lessons]]`: S331, reads 7-12
- `[[docs/kb-notes/methodology-search-the-awarding-body-not-just-the-name]]`: the other half of searching well
- PR #1860: the reads and the reader's expand and rows steps

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
