---
title: A click-outside-closes overlay must test the click TARGET, never walk ancestors
created: 2026-07-02
updated: 2026-07-02
tags: [methodology, ui, modal, event-dispatch, delegated-handlers, project-lifecycle]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/project_lifecycle_lessons]]"
artifacts:
  - project_lifecycle.js (onClick — the fixed handler)
  - tests/project_lifecycle.test.js (checks (j))
---

# A click-outside-closes overlay must test the click TARGET, never walk ancestors

> **One-sentence summary** — in a delegated click handler, "clicked the modal
> backdrop → close" must be `t === e.target`, because an ancestor walk from any
> element *inside* the modal also reaches the backdrop — and the failure can
> stay invisible because the event's dispatch path is precomputed, so a
> Confirm button still "works" even after the handler removed the modal.

## Context

`project_lifecycle.js` handles all its injected controls through one
document-level **capture-phase** click listener that walks `e.target`'s
ancestors looking for known classes (`plc-table-btn`, `tabled-restore`, …).
One branch closed the Table/Archive modal when the walk reached
`.plc-modal-overlay`. Full story: `docs/project_lifecycle_lessons.md`
(2026-07-02 section); fix shipped in PR #652.

## The claim

Two compounding behaviors:

1. **The ancestor walk defeats the backdrop test.** Every element inside the
   modal has the backdrop as an ancestor, so "walk up until
   `.plc-modal-overlay`" fires for *every* in-modal click — picking a radio,
   focusing the reason textarea, anything. The correct test for
   click-outside-closes is identity, not containment:
   `if (t.classList.contains("overlay")) { if (t === e.target) close(); return; }`.

2. **The bug self-conceals via the precomputed dispatch path.** DOM event
   dispatch computes the propagation path when dispatch *begins*; removing
   elements mid-dispatch does not cancel the remaining listeners. So when the
   capture handler removed the modal, the Confirm button's own (later-phase)
   listener **still ran** and saved — always with the form's *default* state,
   because the user never got to change it. The feature looked functional:
   cards tabled fine. What silently never worked was every non-default input
   (the Archive radio, the reason text).

**Diagnostic signature:** a form whose saves all carry the default enum value
and empty optional fields (here: 23/23 rows `state='tabled'`, `reason=null`)
is a modal that users cannot actually interact with — not a user habit.

## How we got here

Sam reported "when I tried to choose archive, it didn't work — only Tabled."
Reading the handler showed the walk; the Supabase rows (all default/empty)
confirmed the dispatch-path subtlety. Regression pinned by
`tests/project_lifecycle.test.js` checks (j): inner clicks keep the modal
open, Confirm saves `archived` + the typed reason, a true backdrop click
still closes.

## When this applies (and when it doesn't)

Applies to any delegated (especially capture-phase) handler that mixes
"which control was clicked" ancestor-walking with a backdrop-close branch —
a common pattern in this repo's static overlay modules. Doesn't apply to
handlers bound directly on the backdrop element (there, `e.target ===
e.currentTarget` is the standard test), or to `<dialog>`-based modals with
native light-dismiss.

## See also

- `docs/project_lifecycle_lessons.md` — 2026-07-02 section (the mixup this bug amplified)
- PR #652 — the fix + tests
