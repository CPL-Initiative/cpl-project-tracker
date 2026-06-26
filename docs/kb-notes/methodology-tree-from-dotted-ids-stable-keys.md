---
title: Build a hierarchy from dotted ids without migrating stored keys
created: 2026-06-26
updated: 2026-06-26
tags: [methodology, ui, data-model, raci]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cobi_raci_nudge_lessons]]"
artifacts:
  - raci.js
  - tests/raci.test.js
---

# Build a hierarchy from dotted ids without migrating stored keys

> **One-sentence summary** — When numbered items already encode their hierarchy in dotted ids (`4.1`, `4.1.1`, `3.1.2a`), derive the tree by id-prefix parenting at render time, and keep each row's *persisted* key unchanged so re-tiering the UI never orphans stored data.

## Context

The Team & RACI matrix needed to go from a flat *Activity → project* list to a 3-tier *Activity → sub-activity → project/work item* tree (Session 76, PR #553). The workplan items already carry hierarchy-encoding ids (`1.1`, `4.1`, `4.1.1`, `3.1.2a`) and each row persists a RACI assignment keyed `item_type:item_id`. Two traps: (1) re-deriving the hierarchy server-side (unnecessary — the ids already encode it), and (2) reclassifying a row's `item_type` (e.g. `project`→`subactivity`), which would silently orphan every assignment stored under the old key.

## The pattern

**1. Parent = longest other id that is a non-digit-boundary prefix.** For each item id, the parent is the longest *other* id `cand` such that `id.startsWith(cand)` AND the next char after `cand` is non-numeric (a `.` or a letter). This makes `4.1` parent `4.1.1` and `3.1.2` parent `3.1.2a`, but does **not** make `4.1` parent `4.10` (next char `0` is a digit). Items with no id-parent fall back to a higher root (here: the Activity from a separate field).

```js
function idParent(pid, allIds) {
  var best = "";
  allIds.forEach(function (cand) {
    if (cand === pid || pid.indexOf(cand) !== 0) return;
    var nx = pid.charAt(cand.length);
    if (nx && /[^0-9]/.test(nx) && cand.length > best.length) best = cand;
  });
  return best; // "" → attach to the fallback root
}
```

Emit depth-first, stamping each node with `depth` and an `ancestors` key-array (push the parent's ancestors + the parent). `depth` drives indentation; `ancestors` powers scope filtering + "keep a match's ancestor chain so a deep hit still shows its parents."

**2. Keep the stored key stable — re-tier visually, not structurally.** The persisted identity (`item_type:item_id`) must NOT change when you add hierarchy. Here every non-root row stayed `item_type:"project"`; the sub-activity-vs-project distinction is a render-time flag (`isSub`, from a second data source) that only affects styling + the filter. Result: existing assignments survive, zero migration, fully reversible.

## When to use / not use

- **Use** when ids already encode the tree (dotted/segmented numbering), the data is already client-side, and rows carry persisted state keyed by a stable id.
- **Don't** invent dotted ids just to get a tree; if hierarchy is genuinely new data, model an explicit `parent_id`.
- The non-digit-boundary test matters the moment two-digit segments appear (`4.1` vs `4.10`) — a naive `startsWith` over-nests.

## Gotcha

When the tree's labels also appear in a filter `<select>` (optgroup option text = sub-activity names), a test asserting on `document.body.innerHTML` false-matches via the dropdown. Scope content assertions to the rendered **table**, not the whole document.
