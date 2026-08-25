---
title: A write key must name exactly one thing, and you have to check
created: 2026-08-25
updated: 2026-08-25
tags: [methodology, data-quality, curation, identity, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/kb-notes/methodology-a-fold-at-the-label-layer-is-not-a-fold]]"
artifacts:
  - kb/_audit_control_number_claims.py
  - prototype/ccr_universe.js
---

# A write key must name exactly one thing, and you have to check

> **One-sentence summary** — an identifier that is *supposed* to be unique is a
> claim about the world, and every layer that writes against it inherits the
> claim silently, so measure it before you build a verb on top.

## Context

SkyView's member re-home writes `CN:<control number>` and nothing else. A
CourseControlNumber is supposed to name one course. Measured against the COCI
source, **1,814 of 139,834** resolve to more than one course as the artifacts
build them. Every layer below the key had quietly assumed otherwise.

## The shape of the failure

Nobody chose the wrong behavior. Each layer independently did the only thing it
could when handed an ambiguous key: **pick the first match.**

- the generator resolved `CN:` through `cn_rows[cn][0]`
- the page rendered a moved course from `byCn[cn]`, its first-seen record
- the removal was keyed on the bare number, so the write took **every** course
  sharing it out of its native identity

So a curator dragging one of a collided pair moved whichever course the raw read
order happened to put first, and the one they *did* drag could disappear. The
receipt line named the right course, the destination showed a different one, and
the server would have moved a third possibility. Three layers, one root cause.

None of this had ever fired: zero `CN:` rows existed. **A latent key defect is
invisible precisely while the verb is unused, which is the window you have to
find it in.**

## What to do

1. **Measure the key against its source, not its artifact.** The artifact may
   have folded, deduped or truncated in ways that hide or invent collisions. The
   audit reports both figures because they answer different questions: what a
   consumer sees, and what the data says.
2. **Split by required repair, never report one headline.** 1,814 reads as one
   crisis; it is four unrelated conditions, three of which are not defects. The
   real worklist was 73 rows across 12 institutions, 93 of them at one college —
   which is small, specific, and has somebody who can fix it.
3. **Refuse what the key cannot express.** When the write has no way to say
   *which*, the honest verb is a refusal with the reason, not a best guess.
   Widening the key is a schema decision; guessing is not a decision at all.
4. **Say it before the action, not only at it.** A user who picks something up,
   goes looking for a destination and is refused on arrival has done the hard
   part for nothing.

## The verification trap this surfaced

Guarding at two levels is right — but **two guards where only one is reachable
through the UI means the deeper one is untested.** Neutering the inner guard
left every check green, because the outer one short-circuited before it was ever
reached. If you cannot drive a guard through the interface, assert it directly;
otherwise a future path that starts the action another way walks straight past
it. Perturb each guard **on its own** and confirm each goes red alone.

## Signals you have this problem

- an id described as "unique" anywhere in a comment or a schema note, with no
  test asserting it
- a lookup that ends in `[0]`, `.find(...)`, or "first seen wins" on a key the
  caller believes is unique
- a delete or extract keyed on that id, which will take the collisions with it
- a display layer that re-derives the record from the key rather than carrying
  the one the user actually acted on
