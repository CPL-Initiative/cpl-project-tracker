---
title: A blocked path hides every defect behind it — budget for a chain, not a fix
created: 2026-08-24
updated: 2026-08-24
tags: [methodology, curation, ccr, skyview, testing, verification]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/ccr_atlas_lessons]]"
  - "[[docs/skyview_drag_rehome_scope]]"
  - "[[docs/kb-notes/methodology-verify-with-the-instrument-that-can-see-the-defect]]"
artifacts:
  - kb/_build_ccr_universe.py
  - prototype/ccr_universe.js
  - prototype/check_ccr_atlas.js
  - tests/ccr_universe_members_test.py
---

# A blocked path hides every defect behind it

> **One-sentence summary** — when a code path has never been walked end to end, the
> first blocker you remove is not the last one, because no defect downstream of a
> blocker can be observed while the blocker holds.

## Context

SkyView's member re-home — drag a local course from one identity to another,
writing `CN:<control_number>` — shipped in Session 54: tested, reversible, never
re-mints. It had **zero uses**. Session 187 found the reason and named it: the
graph payload carried identities with a member *count* and no member *courses*,
so there was nothing at course grain to pick up. The scope written from that
finding said, in as many words, *expect to find something*.

## The claim

**Removing the known blocker is the first item on a list of unknown length.**
Ship the prerequisite and then keep going, because the defects behind it have
never been observable. On this path there were three, in order of discovery:

1. **The data** — 101,063 member courses had to reach the payload (the known
   blocker, and the only one anybody had written down).
2. **The drop** — `pointerdown` replaced the carried course with a fresh
   node/island/pan grab *before* `pointerup` could read it. So pressing
   "Drag…" and clicking the destination — the only route the hint text
   describes — selected the destination and moved nothing. **The one verb the
   whole view exists for could not be completed with a mouse.**
3. **The list** — the biggest identity carries 850 member courses and the pane
   rendered every one, unbounded and unfiltered.

Nobody could have found (2) or (3) by reading; both need a course on screen, and
(1) is why there was never one.

**The corollary that costs the most time: your CHECK is on the same unwalked
path.** A test written against a path nobody has exercised is itself unexercised,
and its first failures are as likely to be its own. Three of the four failures in
the first run of the browser harness were the harness:

- It cached the canvas center once. Pressing "Drag…" calls `cvs.focus()`, which
  **scrolls the canvas**, so every later click landed on empty space — which the
  page correctly reported as *"nothing moved"*, and which read as a broken drag.
- It asserted that a **drop** changes the selection. It does not, and should not:
  the pane deliberately keeps showing the card you came from. What proves a drop
  landed is the write line naming the destination.
- It clicked the canvas and never asserted **which** identity it had selected.
  Overlapping nodes mean a click can land on a neighbour, so the check would
  happily have measured the previous card and passed.

So: assert what the click actually hit, re-measure geometry per interaction, and
**prove the new check fails when the fix is reverted** before believing a pass.
Both fixes here were perturbed and both went red.

## How we got here

Session 189 (SkyCal), 2026-08-24, building step 1 of the drag re-home scope Sam
approved. Sequence: ship the payload → harness reports four failures → one is the
page (2), three are the harness → fix all four → perturb each fix and confirm red.

Two counts came out of the payload work and both are consumer-facing, not trivia:

- **2 members carry no control number.** The write key *is* the control number,
  so they are dropped and counted. Coercing them to zero would ship a course that
  writes against `CCC000000000`.
- **1,122 control numbers sit under more than one identity** — the forward join
  surfaces an over-merged course on every card claiming it. The write is one row
  per control number, so a move is a **global** statement and the course must
  leave *every* card it was showing on, not the one on screen.

## When this applies

Any feature that is "already built" but has never been used in production: an
unused write verb, a dormant workflow, an export nobody has run, a fallback path
that has never been taken. Treat the first blocker as an entry fee, not a fix.

## When it does not

A path with real usage. There the fix genuinely is the fix — existing traffic has
already found the defects that matter, which is exactly what an unused path lacks.
