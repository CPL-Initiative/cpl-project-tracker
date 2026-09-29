---
title: An RLS-filtered read is not an error — it is an empty answer
created: 2026-08-17
updated: 2026-08-17
tags: [methodology, supabase, rls, auth, testing, disclosure]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/college_action_page_lessons]]"
  - "[[docs/kb-notes/methodology-a-rotating-credential-cannot-be-cached]]"
artifacts:
  - college_briefing.js
  - tests/college_briefing_auth.test.js
---

# An RLS-filtered read is not an error — it is an empty answer

> **One-sentence summary** — When PostgREST filters a `SELECT` by a row-level
> security policy the caller does not satisfy, it returns **200 with `[]`**, not
> 401 — so a credential that never reaches the server is indistinguishable from
> a subject that genuinely has no data, and no amount of looking at the rendered
> page will tell you which happened.

## Context

The My College tab reported *"no figures held"* for **every** college. The
figures existed — 109 of 120 non-test colleges had a credit-summary row. What
had failed was authentication, and it failed **silently and identically to an
honest zero**. Full story: `docs/college_action_page_lessons.md` (2026-08-17).

This repo already knew the write-side half of this — *"an RLS-filtered write
returns 200 + empty body"* is recorded against `map_contact_proposals` and
`sierra_guidance`. The read side is the same fact and is more dangerous, because
a failed write at least has a user waiting for confirmation.

## The shape

```
credential missing  →  policy USING clause false  →  0 rows  →  200 []
subject has no data →  policy USING clause true   →  0 rows  →  200 []
```

The two are **byte-identical at the HTTP layer**. Any consumer that renders "no
rows" as "none" will report a permissions failure as a finding about the data.

It gets worse when a page mixes gated and public reads. On My College the public
reads (`map_colleges`, `chatbox_credentials`, `cpl_funding_config`) kept working,
so the page rendered its pickers, its credential lists and its funding — and
looked entirely healthy with every MAP figure on it blank. **A partially-working
page is more convincing than a broken one.**

## What to do

1. **Never let "0 rows" mean "none" on a gated table.** Distinguish
   *unmeasured* from *measured zero* in the model, not in the copy. (`unmeasured`
   vs `empty` in `waitingBreakdown()` is the worked example — and note that
   function was *right*; the bug was upstream of it.)
2. **Assert the credential on the wire, not the pixels.** There is no rendered
   state to test against. Capture `fetch`'s headers and assert the token or the
   `x-team-pass` header is present on each gated request.
3. **Check what your test signs in AS.** The suite that missed this signed in
   with the team phrase — the broken path — and stubbed `fetch`. It exercised
   the defect on every one of 232 passing checks. A fixture that takes the
   broken route and never inspects the request is not coverage.
4. **Read the storage key you actually ship.** The root cause was a
   `getSession()` reading `localStorage.cpl_team_session` — a string that
   appeared exactly once in the repo, as that read. Grep for a key's *writer*
   before trusting its reader.
5. **Prefer one keeper to N copies.** Delegating to the shared session module
   means a tab benefits from every later fix to it; a private copy is a private
   bug.

## The tell

If a whole surface reads empty **at once**, for **every** subject, suspect the
credential before the data. Real emptiness is uneven — some rows have figures
and some do not. Uniform emptiness across a gated set is an auth signature.

## Applies beyond Supabase

Any API that filters rather than refuses has this property: a scoped search
endpoint, a tenant-partitioned query, a feature-flagged list. The general rule is
that **a permission failure must be distinguishable from an empty result set**,
and if the transport will not distinguish them for you, the client has to prove
it sent a credential.
