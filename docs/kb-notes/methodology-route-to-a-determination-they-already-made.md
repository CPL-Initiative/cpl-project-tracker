---
title: "Methodology — when you can't decide for someone, route to a determination they already made"
type: methodology
kb-status: published
created: 2026-08-05
updated: 2026-08-05
session: 120 (SkyMail)
tags: [governance, autonomy, defaults, contacts, data-quality, cpl, map]
related:
  - "[[docs/kb-notes/adr-surface-dont-edit-readonly-system-of-record]]"
  - "[[docs/map_users_lessons]]"
---

# When you can't decide for someone, route to a determination they already made

## The situation

You hold a field that must be filled for a system to work, and it's empty for
some population. Filling it would help them. But the population is **autonomous**
— locally governed institutions, independent teams, separate business units —
and choosing a value on their behalf is a decision you don't have standing to
make.

The reflex is to pick a sensible default and tell them. That reflex is what
produces the objection: *"we can't make determinations for them."*

## The move

**Look for a determination they already made, and route to that.**

Almost always there is one, sitting unused in a system somewhere. You are then
not choosing a value — you're propagating a choice that already exists, into a
field that happens to be empty. That reframes the action from *deciding* to
*routing*, which is a thing you generally do have standing to do.

Worked example: 25 of 123 colleges had no Primary Contact email in the MAP
platform, which is the address a student's credit-for-prior-learning request gets
sent to. So a student asking those colleges reached nobody. The first design
preferred a shared role inbox (`cpl@college.edu`) because it survives staff
turnover. It was rejected: adopting an inbox convention for a locally-governed
college is a determination. The rule that replaced it —

> Every proposal must be a person the **college itself** already designated in
> MAP.

— resolved 17 of the 25 from the colleges' own data, and is **easier to defend
than the version it replaced**, because the outbound message can say exactly what
happened: *"we routed your page to X, who your college already lists as its
Articulation Officer. If that's wrong, it's your call."*

## Three properties that make it work

1. **The cascade is ordered by how close each source sits to the actual job.**
   CPL-specific designations first, then adjacent operational roles. Not by how
   well-populated each field is — populated-ness is a tiebreak, not a
   justification.

2. **Anything that isn't their determination is an ASK, never a default.** The
   temptation is to extend the cascade until it covers 100% — there's always
   *some* address on file. Resist it at exactly the point where the source stops
   being their choice about *this* question. Leadership contacts were on file for
   5 of the 8 remaining colleges; using them would have hit 22/25 instead of
   17/25 and would have quietly routed student requests into vice presidents'
   inboxes. A cascade that covers everything has stopped being a cascade and
   become a guess with extra steps.

3. **The message states the provenance.** "You already named this person" is the
   whole warrant. If the recipient can't see that sentence, you're back to
   deciding for them and merely not saying so.

## The check that tells you you've drifted

For any rung, ask: **did they choose this person for something reasonably like
the thing I'm using it for?** An Articulation Officer designated for articulation
work is a fair route for a credit question. A CEO listed for institutional
contact is not a route for a student inquiry — nobody at that college ever
decided the president should answer student CPL mail.

When the answer is no, the honest output is an empty cell with a reason attached,
not a filled cell. **An empty field that says why is more useful than a full one
that's wrong**, because it can be worked; a wrong one just looks finished.

## Why the empty cells still matter

Splitting the population into *resolved* and *must be asked* is not a partial
failure — it's the deliverable doing its job. The 8 unresolved colleges turned
out to be two genuinely different problems (5 "leadership only" = a designation
gap; 3 "no MAP presence" = institutions with no footprint at all, an onboarding
problem wearing a routing problem's clothes). Forcing a default would have hidden
both under a filled column.

## See also

- The sibling constraint when the source system is read-only:
  [`adr-surface-dont-edit-readonly-system-of-record`](adr-surface-dont-edit-readonly-system-of-record.md).
  Together they bound the space: you may not *edit* their system, and you may not
  *decide* for them — so you propose from their own data and let them act.
