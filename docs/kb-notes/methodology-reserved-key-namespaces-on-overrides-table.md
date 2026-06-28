---
title: Reserved-key namespaces extend a key→override table with new block types (no schema migration)
created: 2026-06-28
updated: 2026-06-28
tags: [methodology, supabase, curation, fact-sheet, schema]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[playbook-curate-editable-standalone-page]]"
  - "[[methodology-kb-curation-synthesized-namespace]]"
artifacts:
  - fact-sheet/factsheet_edit.js
  - fact-sheet/supabase_factsheet_overrides.sql
  - fact-sheet/supabase_factsheet_images.sql
---

# Reserved-key namespaces extend a key→override table with new block types (no schema migration)

> **One-sentence summary** — when a `key → {html, hidden}` overlay table already
> stores *edits to existing boxes*, you can add whole new capabilities (reviewer
> **adds** a box, **reorders** boxes, **adds an image**) by minting **reserved
> key namespaces** in the same `key` column — no new columns, no migration — as
> long as the consumer learns to *materialize* the synthetic keys instead of
> matching them to a baked DOM element.

## Context

The Fact Sheet Curate overlay (Session 80, StarMan — see
[[playbook-curate-editable-standalone-page]]) started as a pure **edit/hide**
overlay: one `factsheet_overrides` row per baked box, keyed
`sectionId|slug(text)`, value `{html, hidden}`. The consumer walks the DOM,
computes each box's key, and **applies** any matching override.

Session 81 (StarFarout) had to add three things Sam asked for — **add a box**,
**drag-reorder boxes**, **add/resize/delete images** — without a schema change
(the table is live and shared, and a standalone page wanted a near-zero HTML
diff). The insight: every one of these is still *"a value stored under a key"* —
they just don't correspond to a *baked* element. So mint new key shapes the
consumer recognizes and treats specially.

## The pattern

**1. Carve reserved namespaces into the existing `key` string.** Baked boxes keep
their `sectionId|slug` keys; new capabilities get a distinguishing infix:

| Key shape | Means | `html` payload | Consumer behavior |
|---|---|---|---|
| `<sid>\|slug` | edit/hide a **baked** box | new innerHTML | match a baked element, apply |
| `<sid>\|add\|<kind>\|<token>` | a reviewer-**added** box | the box's inner HTML | **materialize** a new element, then adopt it |
| `<sid>\|__order` | a section's **drag order** | a JSON array of keys | **parse** (don't inject); reorder children |
| `<sid>\|img\|<token>` | a reviewer-**added** image | `<img src=… width=…>` | materialize a `<figure>` |
| `<sid>\|fig\|<basename>` | edit/resize/hide a **baked** figure | `<img …>` | match the baked figure, apply |

The `<token>` is a short random id (so two added boxes never collide); the
infix (`add` / `__order` / `img` / `fig`) is the discriminator.

**2. The consumer must branch on key shape — match vs. materialize vs. parse.**
A plain edit/hide overlay does one thing: *find the element for this key, set its
innerHTML / hide it.* The new shapes need three different verbs:
- **match** (baked `slug` / `fig`): the element exists; apply.
- **materialize** (`add` / `img`): no element exists; **create** one from the
  payload, insert it, then re-collect so it's adopted as a normal block (carrying
  its stable reserved key, not a freshly-slugged one).
- **parse, don't inject** (`__order`): the payload is data (a key array), not
  HTML; never `innerHTML` it — read it and reorder.

Predicate helpers (`isAddedKey`, `isOrderKey`, `isImgKey`, `isFigKey`) keep the
branches readable and testable.

**3. Keep the first collection synchronous; adopt materialized blocks on a
re-collect.** Existing tests (and the first paint) call `blocks()` right after
boot, so `collectBlocks()` must stay synchronous over the *baked* DOM.
Materialization happens in the post-fetch `.then`; a **second** `collectBlocks()`
then adopts the freshly-created elements. Guard that second pass so an added
element keeps its reserved key instead of being re-slugged by its text.

**4. "Delete" is two semantics under one affordance.** A **baked** block can't be
removed (it lives in the committed HTML) → ✕ **hides** it (`hidden:true`). An
**added** block (`add` / `img`) has no baked source → ✕ truly **deletes** the row.
The ✕ handler must treat *both* added namespaces as deletable — `isAddedKey`
(boxes) **and** `isImgKey` (images); missing the second only hides images.

## Where the bytes live (images)

A `key → {html}` table holds *text/markup*, not binary. For images, the override
stores a **public URL**; the bytes go in a **Supabase Storage bucket**
(`factsheet-images`: public-read, writes gated by `is_allowed_reviewer()`, size +
MIME capped). Upload `POST`s with the reviewer JWT; the returned public URL
becomes the `<img src>` in the override `html`. Same reviewer trust boundary as
the table — one gate, two stores.

## Gotchas

- **A nested editable child can double-override its parent.** If `<figcaption>`
  was already an editable text box *and* its `<figure>` becomes an image block,
  you get two overlapping overrides on nested elements — the figure-innerHTML
  override clobbers the caption's. Fix: when a container becomes a block, have
  `collectBlocks` **skip the in-container child** and manage the whole thing as
  one block.
- **Cloning a live template copies the curate chrome.** "Add box" clones the
  section's representative box — but in curate mode every box already carries a ✕
  / drag handle, which lands in the *persisted* HTML. Strip the chrome
  (`.fs-del`/`.fs-add`/the inline bar) from the clone before saving. (Guard it
  with a test asserting the saved html has no chrome class.)
- **Scope an order array to the box CONTAINER, not the whole section.** A
  section-level intro `<p>` is a keyed block too; if it lands in the order array,
  the reorder's `appendChild` shoves it below the grid. Gather order keys from the
  grid container only.
- **Expanding a public-innerHTML sanitizer for `<img>` needs a host allowlist.**
  Allowing `<img>`/`<figure>` means allowing `src` — restrict it to known hosts
  (your Storage bucket / the org domain / `./img/`), **no `data:`**, no foreign
  host, and coerce `width` to a bounded number. Drop an out-of-allowlist `<img>`
  whole.

## Why it beats a schema change

The table stays one shape (`key, html, hidden, …`); RLS, the daily sync, the
fallback semantics (*empty table = page as authored*) all keep working unchanged.
New capability = a new key shape + a consumer branch + a test — reversible, and
nothing downstream of the table needs to know the namespaces exist. Same spirit
as a [[methodology-kb-curation-synthesized-namespace|synthesized kb_curation
namespace]]: overload an existing keyed store instead of migrating it.

## Result

Boxes (add/delete/reorder, PR #576) and images (add/replace/resize/delete,
PR #578) both shipped on the **unchanged** `factsheet_overrides` table (+ one new
Storage bucket for image bytes). `fact-sheet/index.html` stayed untouched (the
overlay injects all chrome and materializes all added blocks). 28 + 25 jsdom
checks guard the namespaces, materialize/parse branches, and the two delete
semantics.
