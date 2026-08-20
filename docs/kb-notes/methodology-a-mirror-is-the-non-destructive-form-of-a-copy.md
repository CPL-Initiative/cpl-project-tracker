---
title: A mirror is the non-destructive form of a copy
created: 2026-08-20
updated: 2026-08-20
tags: [methodology, ux, config, data-integrity, cobi]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - cpl_funding.js
---

# A mirror is the non-destructive form of a copy

> **One-sentence summary** — when someone asks for "keep B in sync with A",
> resolve B from A at read time instead of writing A over B, and never fire the
> write from a toggle that is about something else.

## Context

Sam asked for each funding priority's detail to be auto-copied from Year 1 to
Year 2 "whenever the Front-load funding is selected". The intent was sound — the
two years are deliberately identical — but the mechanism had three problems, and
the fix for all three was to change *when and how* rather than *whether*.

## The claim

### A copy is a write; a mirror is a resolution

Copying flattens A over B: B's own values are gone, there is no undo, and the
two are only identical until the next edit to A. Mirroring resolves B **from A
at read time** — nothing is written, editing either edits the one shared set,
and clearing the switch hands B's own values back untouched.

Both satisfy "keep them in sync". Only one is reversible, and only one keeps
working after the next edit.

Implementation is usually smaller than the copy, too: one seam that rewrites the
lookup key (`slot → "1"` when mirroring), rather than an enumeration of every
field to be written.

### Never hang a destructive write off an unrelated control

The proposed trigger was a **disbursement-timing** toggle. A user flipping it is
thinking about cash flow, not about overwriting a year of policy text — so the
data loss arrives as a side effect of something that looks unrelated, which is
the shape of an accident nobody attributes correctly afterwards.

If the destructive version is genuinely wanted, make it its own button, name what
it will overwrite, and confirm.

### Check the trigger against the states it will actually meet

The same click was a **no-op** in one live scenario (the years were already
byte-identical) and a **silent policy edit** in the other (they differ on
purpose). A trigger whose effect ranges from nothing to irreversible, decided by
state the user is not looking at, is not a feature they can reason about.

Worse, the chosen trigger fired where it mattered *least*: under front-loading,
the later year already carries no money and its metrics are never scored. The
drift the request was really about bites under the *other* setting.

### Ship the sync OFF, and say which state you are in

Default off changes nothing on deploy, which matters when the config is shared
and someone else may be mid-edit. Then show the state plainly — "the years
currently hold the same priorities" versus "Year 2 differs from Year 1" — and
label a mirrored view AS mirrored, or an edit made there silently lands on both
and the screen never admits it.

## How we got here

Implementation and the round-trip test (mirror on → later years resolve to
Year 1's set; mirror off → their own values return unchanged): PR `#1268`.
Full reasoning in `docs/cpl_funding_lessons.md`.

## When this applies (and when it doesn't)

Applies to "make B match A" in configuration, templates, per-year or per-region
variants, and any place a UI offers a sync between two editable copies of the
same thing.

Does **not** apply when B must be a **snapshot** — an audit record, a published
version, anything whose whole job is to stop tracking A. There the copy is the
feature, and a mirror would quietly destroy the record's meaning.

Also does not apply when the resolution cost is real: mirroring adds a hop to
every read, which is free at config scale and is not free over large data.

## See also

- `[[docs/cpl_funding_lessons]]` — the workstream that produced this
- PR `#1268` — the implementation

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
