---
title: A monitor that is not a browser cannot see a browser's failure
created: 2026-09-17
updated: 2026-09-17
tags: [methodology, monitoring, deploys, cors, sierra, reliability]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
artifacts:
  - chatbox/health_check.sh
  - tests/sierra_cors_contract.test.js
  - tests/sierra_health_probe.test.js
---

# A monitor that is not a browser cannot see a browser's failure

> **One-sentence summary** — when a page and the function it calls ship on
> different triggers, the source can be perfectly self-consistent while
> production is broken, and a `curl` probe is structurally incapable of
> noticing, because the failure lives in a request `curl` never makes.

## The claim

Two halves of one feature that deploy on different triggers will eventually be
live at different versions. When the mismatch is in the CORS preflight, the
symptom is total for one class of reader and invisible to every automated check
that is not a browser.

## What happened

PR #1568 (2026-09-12) taught the COBI widget to send `x-team-pass` and added
that header to `cpl-chat`'s `Access-Control-Allow-Headers` **in the same
commit**. The source was never inconsistent for a moment.

But the page deploys on merge to `main` and the Edge Function deploys only when
someone dispatches `cpl-chat-deploy.yml`. Nobody did. For five days the live
function was **v65**, whose allow-list predates the header, while the live page
sent it.

A browser answers that mismatch by **refusing to send the request at all**. The
`fetch` rejects after the preflight; the function logs no POST. So every COBI
reader holding the team phrase — the MAP team — saw a dead assistant, while the
public Sierra page, the Fact Sheet drawer and map.rccd.edu answered normally,
because they carry no credential and send no custom header.

## Why nothing caught it

`chatbox/health_check.sh` is `curl`, and `curl` puts the POST straight on the
wire. The preflight is a request it never makes. The probe ran every three
hours and passed **about forty times** through the outage — a green tick over a
dark widget, which is the exact failure the script's own header warns about,
arrived at from the other direction.

⚠️ **#1568's own comment predicted the wrong failure.** It says a preflight that
does not list the header "drops the header silently and every phrase holder
reads as public" — a *degradation*. A browser does not drop the header. It
drops the request. A comment that names the wrong symptom is worse than no
comment: it tells the next reader to look for a permissions bug.

## What the outage cost, and what found it

Sam reported it as a billing problem — the Anthropic credit balance behind
Sierra had genuinely run dry twice in August, so it was the right first guess,
and two colleagues were already checking the auto-reload tokens. The logs ruled
it out in one read: the last successful POST was the health probe, and the only
subsequent traffic was two `OPTIONS 204` from one browser with **no POST after
either one**. An exhausted balance produces a POST carrying an error body. It
cannot produce a preflight with nothing behind it.

## The rule

- **A liveness probe must make the request its users make.** If real callers
  send a custom header from a browser, the probe preflights too, and asserts
  the deployed allow-list covers every header any caller can attach.
- **Check the deployed thing, not the source.** A source-side test proves the
  repo agrees with itself. It says nothing about what is running.
  `tests/sierra_cors_contract.test.js` is the cheap half and says so in its own
  header; the live probe is the half that was actually wrong.
- **When two halves of a feature deploy on different triggers, the one that
  does not deploy itself is the one that will be stale.** Ship the server half
  first, or make the client tolerate both.
- **Scope an alert to who is affected.** The outage issue said "every Sierra
  surface is affected at once" — true while the only failure was the model
  call, false for this one, and it would send a reader hunting a total outage.
  The probe now emits the blast radius alongside the reason.

## Guards

`tests/sierra_health_probe.test.js` runs the real script against a mock whose
allow-list is settable, and a shape serving v65's exact string beside a
perfectly healthy SSE answer **reports DOWN**. Before #1595 it reported UP,
which is what production did.
