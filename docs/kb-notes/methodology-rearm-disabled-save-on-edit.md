---
title: Re-arm a success-disabled Save button the moment its inputs change
created: 2026-07-08
updated: 2026-07-08
tags: [methodology, ui, in-place-save, cer, triage]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/exhibit_canonicalization_lessons]]"
artifacts:
  - credential_reference.js
  - tests/cer_issuer_lane.test.js
---

# Re-arm a success-disabled Save button the moment its inputs change

> **One-sentence summary** — if a save-success handler disables its button
> while leaving the row's inputs editable, any label-refresh on input turns
> the button into a dead control; re-enable it on the first edit, guarded by
> an in-flight flag.

## Context

The CER Triage issuer lane saves rows in place (no re-render, so unsaved
input in other rows survives). On success the row's button flips to a
disabled "✓ Saved" — but the title/issuer inputs stay live so the curator
can keep working. A separate `oninput` label-sync (`syncLabel()`) relabeled
the button "Save" based on input state. Combined effect: **save a row, then
re-edit it, and the button reads "Save" but is still `disabled`** — a dead,
slightly-faded control (the `:disabled{opacity:.6}` styling is subtle enough
to miss). Sam hit it live on 2026-07-08 ("firearms exhibit is not allowing
me to save — button unresponsive"); a second row (Desserts) in the same
screenshot was in the identical state.

## The failure mode, generalized

Three ingredients, each individually reasonable:

1. Success handler disables the action button (prevents double-submit,
   signals done).
2. Inputs remain enabled (in-place editing is the surface's whole point).
3. Any input listener updates the button's LABEL but not its `disabled`
   state.

The repro needs save-then-re-edit **within one page session** — a fresh
render rebuilds an enabled button, which is why the basic jsdom happy-path
test passed while the live surface failed. Test the *cycle*, not the
first save.

## The fix pattern

In the shared input handler (the same place drafts are noted):

```js
if (saveBtn.disabled && !saveBtn.getAttribute("data-busy")) {
  saveBtn.disabled = false;          // the row is dirty again
  delete state.savedFlags[key];      // bulk-save picks it up again
  tr.classList.remove("done-style"); // visual state follows
}
```

- **`data-busy`** is set when a save goes in-flight and removed in both the
  resolve and reject paths — without it, typing during a pending save would
  re-enable the button mid-flight and invite a double-submit.
- Also drop the row from any "already saved" bookkeeping so bulk actions
  treat the re-edited row as pending again.
- Commit a regression test that exercises **save → edit → re-save** and
  asserts the second write reaches the network layer
  (`tests/cer_issuer_lane.test.js`, the "re-edit trap" block).

## When NOT to disable at all

The unclassified worklist's `applySavedAssignment` never disables its
button (label flips to "✓ Saved" but stays clickable) — re-saving is
idempotent there, so the trap can't occur. If your save is an upsert,
leaving the button enabled is the simpler design; disable-on-success only
when a duplicate write is actually harmful, and then ALWAYS pair it with
the re-arm.
