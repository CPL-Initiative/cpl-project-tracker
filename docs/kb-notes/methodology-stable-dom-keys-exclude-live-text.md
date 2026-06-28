---
title: Stable DOM keys must exclude live (data-bound) text
created: 2026-06-28
updated: 2026-06-28
tags: [methodology, overlay, supabase, fact-sheet, curation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/fact_sheet_lessons]]"
  - "[[docs/kb-notes/playbook-curate-editable-standalone-page]]"
artifacts:
  - fact-sheet/factsheet_edit.js
  - tests/factsheet_edit_sections.test.js
---

# Stable DOM keys must exclude live (data-bound) text

> **One-sentence summary** — when an override/overlay keys DOM boxes by a slug of
> their text, exclude any live (`[data-bind]`) values from the slug, or the key
> churns every time the data refreshes and orphans every saved edit/order/hide.

## Context

Several CPL surfaces overlay reviewer edits onto a baked page by walking the DOM,
assigning each editable "box" a **stable key** from its section id + a slug of its
text (`data-fsk`), and storing overrides under that key. This works perfectly for
static prose. It breaks the moment you start keying boxes that contain **live
data** — KPI cards, the Veteran-Sprint stats — whose visible text changes on every
daily refresh (`48,029` today, `48,200` tomorrow). A text-derived key then becomes
a *different* key tomorrow, so yesterday's saved hide/reorder/edit no longer matches
any box and silently disappears.

## The claim

**Derive the stable key from the box's NON-live text only.** Clone the element,
remove every `[data-bind]` subtree, and slug *that*. The key is then anchored to the
box's static label/caption (which doesn't change), not its volatile value.

```js
function stableText(el) {
  if (el.hasAttribute('data-bind')) return '';
  if (!el.querySelector('[data-bind]')) return el.textContent || '';   // fast path: no live text
  var clone = el.cloneNode(true);
  clone.querySelectorAll('[data-bind]').forEach(n => n.remove());
  return clone.textContent || '';
}
function blockSig(el) { return slug(stableText(el).slice(0, 80)) || 'blk'; }
```

Two properties make this safe to retrofit:

1. **Boxes with no live text are unchanged** — `stableText === textContent`, so the
   existing keys for all static boxes are byte-identical. No migration, no orphaned
   overrides for the content that was already editable.
2. **Only newly-keyed live boxes get the new (stable) key** — and they had no
   overrides before (they were excluded), so there's nothing to migrate.

The same principle generalizes: a content-keyed overlay over **any** layer that
mutates text at runtime (i18n, A/B copy, live metrics, relative timestamps) must key
off the part of the DOM that the runtime layer does NOT touch.

## How we got here

Session 82 (SkyFlyer) extended the Fact Sheet Curate overlay to the KPI grid and the
live Veteran-Sprint stats. The first cut keyed them by full text and the
`tests/.../keys are stable across reloads` guard still passed (the test reloads the
*same* HTML, so the fallback numbers are identical both times) — the bug only bites
in production when `factsheet.js` swaps in the live value after the keys are stamped.
Caught it by reasoning about the daily-refresh lifecycle, not the test. Fixed by the
`stableText` exclusion; the stable-across-reloads guard still holds, and a new guard
asserts KPI/Vet-Sprint blocks are collected with stable keys.

## When NOT to use

If the live value is the box's *only* identity (no static label at all), excluding it
leaves an empty slug — fall back to a positional/ordinal key, or require the producer
to stamp an explicit `id`. In practice every well-formed card has a static label, so
this is rare.
