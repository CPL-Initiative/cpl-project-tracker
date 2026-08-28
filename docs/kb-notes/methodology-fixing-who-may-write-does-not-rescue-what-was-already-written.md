---
title: Fixing who may write does not rescue what was already written
created: 2026-08-28
updated: 2026-08-28
tags: [methodology, auth, ui, data-loss, local-first, cpl-funding]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_lane_switch.test.js
related:
  - "[[methodology-a-client-gate-must-mirror-its-own-rls-policy]]"
  - "[[cpl_funding_lessons]]"
---

# Fixing who may write does not rescue what was already written

> **One-sentence summary** — when a surface falls back to a private local layer
> while a credential is missing, restoring the credential is only half the
> repair: the work already sitting in that layer stays there, masking the shared
> record, and the screen cannot tell the two apart.

## The shape

A tab that lets people edit before they authenticate needs somewhere to put
those edits. A per-browser overlay is the humane answer, and it has two
properties that combine badly:

1. **It wins the render.** That is the point — you should see what you typed.
2. **It survives authentication.** Nothing about signing in moves it.

So the moment the credential arrives, the surface is *writable* and *still
showing an overlay*. Every subsequent read looks correct. Every subsequent write
of the same value is a no-op, because the field already displays that value and
no `change` event fires. The person concludes it saved. It did not.

## How it actually played out

A curator relabeled three items, signed in, and re-typed them — **three times
across two days**, each time watching the labels appear correctly, each time
with nothing reaching the database.

The first repair made the client's gate match its RLS policy, so a signed-in
reviewer could write. It changed nothing for him, because his labels were
already in the overlay.

⭐ **The promotion step already existed and exactly one path reached it.** The
team-phrase unlock row merged the overlay into the shared scenario on unlock —
*"what you were exploring becomes the team's model"*. A magic-link sign-in never
passes through that row: the gate flips, the row disappears, and the overlay is
stranded permanently.

Two credentials, one of which carried the rescue and the other of which did not.

## The rule

**Any transition that grants write access must also decide the fate of work done
before it.** Three viable answers, and silence is not among them:

| | |
|---|---|
| **Promote automatically** | Right when the credential is a deliberate act (typing a shared phrase) |
| **Offer to promote** | Right when the credential is incidental (a magic link clicked for some other reason) — asking beats assuming |
| **Discard, loudly** | Only if the overlay is genuinely disposable, and say so before doing it |

And regardless of which: ⚠️ **work that exists in only one browser must say so on
screen, unprompted.** Not in a menu, not on hover. The whole failure is that a
private save is visually identical to a published one.

## What to check in your own code

- Find every fallback store (`localStorage`, an in-memory overlay, a draft
  buffer) that a UI writes to when a permission check fails.
- For each, ask: **what moves this into the real store, and is it reachable from
  every way a user can become permitted?** If the answer names one path and
  there are two, you have this bug.
- Then ask: **would a reader know?** If the overlay renders over shared data with
  no marker, the answer is no.

## Testing it

The assertion that catches it is not "can a signed-in user write" — that passes
on the broken code. It is:

> after signing in **with a non-empty local overlay**, is the overlay called out,
> and is there something that publishes it?

Construct the overlay first, *then* supply the credential. A test that
authenticates on a clean slate cannot see this.

⚠️ And when the fix adds new copy, re-check assertions that match on prose: a
new "sign in again to save for everyone" message collided with an existing
`/save for everyone/` unlock assertion here. Key on structure (a class the
unlocked branch alone emits), not on wording.
