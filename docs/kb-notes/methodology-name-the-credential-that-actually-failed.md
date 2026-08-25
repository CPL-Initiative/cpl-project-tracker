---
title: Name the credential that actually failed
created: 2026-08-25
updated: 2026-08-25
tags: [methodology, auth, error-messages, ux]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-hiding-a-control-also-hides-the-way-in]]"
  - "[[docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what]]"
artifacts:
  - cpl_memory.js
  - cobi_identity.js
  - team_phrase.js
---

# Name the credential that actually failed

> **One-sentence summary** — when a surface accepts two credentials, an error
> message that names one of them is wrong half the time, and it sends the reader
> to fix something that was never in play.

## Context

COBI accepts two credentials: a **shared team phrase** (no identity, no
per-person revocation) and a **magic-link reviewer session** (a person). Most
tabs take either. `cpl_memory.js` reported every write failure as:

> ⚠ your team phrase may have expired — re-unlock

Sam hit it while signed in **by magic link**. The phrase was irrelevant, and
`handleWriteFailure` — which correctly requires `sess.teamPass` — had touched
nothing. So the message named a credential that was not in play, blamed it for a
failure it had not caused, and told him to re-do something that would not have
helped.

It also pointed at a control that was **not on the page**: `renderAuth` rendered
the unlock row only when there was *no* session, and he had one.

## Two distinctions the message has to make

**1. Which credential is in play.** Read the session and word the message for it.

**2. A refusal is not a miss.** With `Prefer: return=representation`, PostgREST
answers an RLS-filtered write with `200` and an empty array. The house helper
reports that as 403-shaped so the phrase-recovery path engages — but it hands
back an **array** there and `null` on a real HTTP rejection. That is the only
signal separating *"you are not allowed"* from *"nothing matched that key"*, and
they need different words and different remedies:

| state | what to say | control to offer |
|---|---|---|
| ok-but-zero-rows | nothing was saved, nothing was lost | Dismiss |
| 401/403, reviewer session | your sign-in was refused | renew the session |
| 401/403, phrase | your phrase may have expired | the unlock row |

⚠️ **A zero-row write is not an auth failure at all**, and reporting it as one
sends a curator to re-authenticate over what may be a bad row key. In the case
that produced this note it *was* a bad row key.

## The corollary

**Whatever the message asks for must be rendered beside it.** Naming a remedy you
do not offer is worse than naming none — it is the
`hiding-a-control-also-hides-the-way-in` failure arriving through the error text
instead of through a hidden button.

## Checklist

- [ ] The message reads the credential in play, not a default.
- [ ] Zero-row and rejected are told apart, and worded differently.
- [ ] Each state renders the control it names.
- [ ] The recovery for a rotating token is a renewal, not a re-login prompt.
