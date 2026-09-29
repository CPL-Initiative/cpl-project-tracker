---
title: Reorder by permutation, not by rewriting the config
created: 2026-08-20
updated: 2026-08-20
tags: [methodology, ui, config, data-integrity, funding, cobi]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
  - "[[docs/kb-notes/methodology-a-count-gate-cannot-see-a-reorder]]"
artifacts:
  - cpl_funding.js
  - tests/cpl_funding_reorder.test.js
---

# Reorder by permutation, not by rewriting the config

> **One-sentence summary** — when a curator can drag stored, individually
> overridable items into a new order, store the ORDER as a separate permutation
> and translate display→source at one seam; permuting the stored records
> themselves silently loses whatever field the rewrite forgot.

## Context

Sam asked to drag the Implementation Funding priorities into a new order —
Priority 3 into the Priority 1 position — instead of retyping both years' worth
of content. Each priority is a stored record with a partial override layered
over a baked default, and its numbers drive real money.

## The claim

### Storing the order is not the same as storing the items in order

The obvious implementation is to permute the stored array and save it. That
requires **materialising every field of every item** — and a field the rewrite
forgets does not vanish, it **falls through to the record now sitting at that
index**. The item silently inherits a *different* identity's default.

Store instead a permutation beside the data:

    priorityOrder: [2, 0, 1]     // display position i shows source item order[i]

Nothing stored moves. The reorder is reversible by deleting one key, and every
derived figure is byte-identical before and after — which is a property you can
assert in a test, and "I enumerated all the fields" is not.

### Translate at ONE seam, not at each call site

Everything above the seam speaks **display** index; everything below speaks
**source** index. In practice the seam is small: the functions that actually
index the stored list (here: read one field, read its provenance, read its unit,
write one field) plus the list builder. Emitters and event handlers keep passing
the display index they already had.

Per-emitter translation is the alternative, and it fails the same way every
time: the failure mode is **an edit landing silently on the wrong item**, and
one missed call site produces exactly that with no error anywhere.

### Position drives the label; identity drives everything else

The ordinal ("Priority 1") is a *position*. The key every downstream consumer
joins on is an *identity*. Derive the first from the display index and keep the
second attached to the record, or a per-item value computed elsewhere will
attach itself to a column number.

Watch the defaults too: a fallback list indexed by position (`DEFAULT_TITLES[i]`)
must be indexed by the SOURCE index, or an item with no override adopts the
default belonging to the slot it was dragged into.

### A malformed order is a fallback, never a dropped item

Validate the stored value as a permutation of `0..n-1` and fall back to the
natural order when it is not. Hand-edited config, a list that changed length, a
half-written save — all of them must render every item exactly once rather than
throw or drop one off the page.

## How we got here

The live config made the risk concrete rather than theoretical. The overrides
were **partial** — one scenario set `metric` and `share` on two priorities and
neither `factor` nor `title` — so a rewrite that dropped `factor` would have
re-pointed those priorities at another priority's baked default and moved the
money. The stored shape was also an **object keyed by index string**, not an
array, so "just permute the array" was not even available.

Implementation and the 69-assertion guard: PR `#1268`. The assertions that
matter are the two a rewrite cannot make: the statewide total is unchanged after
a reorder, and an edit typed into position 1 lands on the priority *shown* there.

## When this applies (and when it doesn't)

Applies wherever a **user-visible order** sits over **stored records with
per-record state**: dashboard cards, menu items, form sections, pipeline stages,
report sections.

Does **not** apply when the order IS the data — a ranked list whose position
carries meaning (a priority queue, a waterfall of rules evaluated in sequence).
There, position is a field of the record and rewriting it is correct.

Also does not apply to a purely cosmetic, per-browser arrangement with no stored
per-item state; a plain saved list of keys is simpler and sufficient (see
`kpi_reorder.js`).

## See also

- `[[docs/cpl_funding_lessons]]` — the workstream that produced this
- `[[docs/kb-notes/methodology-a-count-gate-cannot-see-a-reorder]]` — what the
  reorder broke downstream, and why the existing guard could not see it
- PR `#1268` — the implementation

---

*Authoring check: durable (still true a year out), reusable (peer
sessions/projects benefit), distilled (one concept), self-contained
(frontmatter + opener tell a stranger the claim).*
