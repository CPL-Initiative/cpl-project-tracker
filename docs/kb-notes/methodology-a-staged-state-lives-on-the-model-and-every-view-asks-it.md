---
title: A staged state lives on the model, and every view asks it
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, skyview, ccr, curation, ui, testing]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/reference/lanes/skyview-ccr-interface]]"
  - "[[docs/skyview_video4_findings]]"
  - "[[docs/kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing]]"
artifacts:
  - prototype/ccr_universe.js
  - tests/ccr_skyview_staged_move.test.js
---

# A staged state lives on the model, and every view asks it

> **One-sentence summary** — when an action is staged rather than saved, put
> the state and its words in one place on the model, and make every surface
> that shows the object ask that place; a surface that decides for itself what
> to say will drift from the others, and the one that says nothing is the one
> the reader is looking at.

## Context

SkyView lets a curator drag a college course from one course identity to
another. Nothing is written from the page: the move is staged as a row for
review. Sam, watching it on a screen recording (2026-09-06): *"It didn't really
change over here, which I would expect it to change and to give me a
confirmation that it was moved and to change this outline to show it was staged
to move."*

The confirmation existed. It printed at the foot of the window, out of his
sight, and it was true. What was missing was the mark on the course itself,
and the reason it was missing is instructive: the model relocated the course
(`movedTo[cn]` changed which identity listed it), so the destination gained a
row and the origin lost one, and each surface then reported its own local
truth. The destination's row said *moved here* (a done word for an unsaved
thing). The origin said nothing, because a course that is no longer a member
is simply absent from a member list. The identity labels, the hovers and the
outline of record counted members and said nothing either. Four surfaces, four
readings, none of them wrong by its own lights, and the reader at the origin
saw no change at all.

## The method

1. **The state is one record with a home.** A staged move is a row
   (`cn · code · college · to · from · home`), and `home` is the identity the
   course began in, so a course moved twice still shows as gone from where it
   started.
2. **The words are written once.** One function returns the phrase for each
   end — *staged here — not saved* at the destination, *staged to move to
   ⟨title⟩ — not saved* at the origin — and no view composes its own.
3. **Every view asks the model, including the ones that used to be silent.**
   The destination's row and star, the origin's ring (the course is still
   drawn there, as a hollow dashed ghost on a ring of its own, labeled with
   where it went), the origin's panel (a *Staged to move away* list with a
   *Put back*), the identity's label and hover (a count), the outline's band
   (a count), and the hint. When the sphere view arrives it reads the same
   three helpers, which is the point of building the mark on the model.
4. **The undo is on the model too.** *Put back* removes the record; every
   surface repaints from the same absence.
5. **The test reads each surface after one real move**, so a surface that
   stops asking the model fails by name, not by a count.

## Why it matters

A staged state is the most easily lost kind: it is real to the reader and
invisible to the data. A surface that derives its own view of it from the
relocated data will say something plausible and wrong (*moved here*) or
nothing at all (the origin). Putting the state and its vocabulary in one place
is what lets a new surface — a sphere, a table, a print — be correct on the
day it is built rather than on the day someone notices.

## Related

- [[docs/kb-notes/methodology-a-rule-that-is-right-for-reading-can-be-wrong-for-writing]]
  — the same surface's earlier lesson: the drop that landed on the wrong circle.
- [[docs/skyview_video4_findings]] — item 7, the ask, with the frame that
  corrected the transcript-only reading.
