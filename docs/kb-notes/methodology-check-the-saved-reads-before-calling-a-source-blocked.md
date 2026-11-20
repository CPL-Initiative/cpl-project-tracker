---
title: Check the saved reads before calling a source blocked
created: 2026-11-20
updated: 2026-11-20
tags: [methodology, collection, college-reads, commons, course-outlines]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/commons_lessons]]"
  - "[[docs/kb-notes/methodology-a-lapsed-name-is-not-a-refusal]]"
  - "[[docs/kb-notes/playbook-runner-as-external-api-proxy]]"
artifacts:
  - docs/reference/blocked_sources.md
  - kb/hand_filed_catalogs/
---

# Check the saved reads before calling a source blocked

> **One-sentence summary**: a test a session makes from its own cloud address says what that address can reach, and
> only the reader's committed captures say what the reader reaches, so read those before advising that a source waits.

## Context

Collection advice decides where a person spends time. When a session tells Sam a source is blocked, he hunts the data
by hand or sets the source aside. A wrong "blocked" costs that work and leaves a readable source unread.

## The claim

A session's own fetch is a different client from the collection reader. It leaves from a cloud address that many
sites challenge or refuse, it sends a different user agent, and it runs without the reader's rules. The reader runs on
a runner under its own name and saves what it read. So the evidence that a source is out of reach is, in order:

1. The reader's committed captures and their runs: did it read this host, when, and did it meet a challenge?
2. The registry's standing for the college (`program_source_registry`) and the `blocked_sources` rows.
3. Only then a fresh probe, and from the reader's runner, never from the session.

A session's fetch failing is a reason to look at those, never a finding by itself.

## How we got here

The plain session of 2026-11-20 first advised Sam to hold the bot-checked catalog sites, on a test made from its own
cloud address. The committed captures said otherwise: the named reader (`CPLInitiativeCatalogCensus/1.0`) had read
North Orange's catalog on 2026-11-13 (run 43342034608) and Southwestern's on 2026-11-19 (run 44529722751) with no
challenge, and since #3536 it stops at a challenge rather than routing around one. The advice was withdrawn the same
hour. The same day, the registry proved stale in the other direction: 3 of the 69 colleges it lists as out of reach
already had outcomes on file by another route (Coastline, Golden West, Orange Coast). Record:
`docs/commons_lessons.md`, *The plain session of 2026-11-20*.

## When this applies (and when it doesn't)

- **Applies** to any claim that a college site, catalog or outline system cannot be read, before it reaches a person
  or a lane.
- **Does not** loosen the reader's rules: a host that refuses or challenges the reader stays refused, and the reader
  never retries under another name or routes around robots.txt (`blocked_sources`).
- **Does not** make a capture current forever: a site can add a challenge after the last capture, so name the capture's
  date beside the advice.

## See also

- [`methodology-a-lapsed-name-is-not-a-refusal`](methodology-a-lapsed-name-is-not-a-refusal.md): a name that does not
  resolve is a DNS fact, not a refusal.
- [`playbook-runner-as-external-api-proxy`](playbook-runner-as-external-api-proxy.md): reach from the runner what the
  sandbox cannot.

---

*Authoring check: durable (every collection lane advises on reach), reusable (any source a reader fetches), distilled
(one concept: the reader's own record outranks the session's probe), self-contained.*
