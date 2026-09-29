---
title: A curator ruling must be attributed data, not a code branch
created: 2026-08-21
updated: 2026-08-21
tags: [methodology, curation, provenance, governance, identity]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/kb-notes/methodology-a-provenance-label-must-say-why-not-what]]"
artifacts:
  - kb/reference/college_identity_rulings.json
  - kb/_build_college_identity_crosswalk.py
---

# A curator ruling must be attributed data, not a code branch

> **One-sentence summary** — When a human resolves something a matcher could not,
> store the decision with **who** and **when** beside a rebuildable artifact —
> because a ruling hard-coded into a generator is one refactor away from being
> silently reversed, and a ruling with no name on it cannot be re-litigated.

## Context

A crosswalk lint surfaced four `X Credit` / `X Non-Credit` sibling names and
could not decide whether each pair was two organizations or one spelled twice.
Nothing in the data answers it — the distinction lives in how the upstream
platform is administered. Sam ruled: *"Calbright and LAUNCH get 2 entities—one
credit, one noncredit. San Diego and North Orange are one entity."*

Two obvious places to put that were both wrong.

## The claim

### Not in the generator

A `if name in (...)` branch inside the builder makes the ruling invisible to
everyone who does not read the builder, and a later refactor that "tidies" the
special cases reverses a human decision with no signal. The same reasoning made
`cr_reference_decisions` a table rather than a derived value.

### Not in the output either

The crosswalk output is **regenerated**. Anything written only there is lost on
the next run.

### In a committed, attributed input the builder reads

```
kb/reference/college_identity_rulings.json
  { ruling, decided_by, decided_on, entities, reason }
```

The builder consults it and a rebuild cannot lose it. `decided_by` matters as
much as the ruling: six months on, the question is not only *what was decided*
but *who is authoritative to change it*.

### A ruling outranks the heuristic

Once a human resolves a name, it must stop appearing as a finding. A curator who
is asked the same question twice learns the queue is not listening. The lint
class `credit_twin` therefore disappears entirely: three names became resolved
`spelling` entries, two became a new class with a *different* blocker.

## The corollary: do not mint an identity to close a gap

Sam's ruling created two entities that need an id — and the id belongs to the
upstream platform, which is read-only to us. Minting one locally would put a
fabricated identifier into the table every other system treats as authoritative,
and it would look exactly like a real one.

⭐ **Record the blocker as a state, not a blank.** `awaiting_map_id` says: this is
a real organization, a human confirmed it, and one specific external party owes
one specific value. That is a to-do with an owner. A blank is a mystery.

## How we got here

PR #1278, 2026-08-21. Measured before asserting: both credit arms appear in the
assistant's corpus, one with its own landing page, and **neither has a row in
`map_colleges` nor an id in `map_college_users`** — so the id genuinely does not
exist anywhere we hold.
