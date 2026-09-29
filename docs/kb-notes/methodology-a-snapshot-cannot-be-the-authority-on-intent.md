---
title: A snapshot cannot be the authority on intent
created: 2026-09-07
updated: 2026-09-07
tags: [methodology, ui, state, data-loss]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[methodology-a-snapshot-of-a-live-model-is-a-claim-that-decays]]"
artifacts:
  - prototype/ccr_atlas_v1.html
  - tests/ccr_skyview_search_show.test.js
---

# A snapshot cannot be the authority on intent

> **One-sentence summary** — If you compute a destructive action by subtracting a
> snapshot from current state, everything that happened outside the snapshot
> looks like a decision the user made, and you will silently delete their work.

## Context

SkyView's search dropdown defers its commit: ticking a row writes to a pending
set and Enter applies the whole set at once. The set is seeded once per choosing
session from what is already committed, so a previously-picked row shows ticked
and unticking it is a real removal.

The commit computed its two halves symmetrically, which looked obviously correct:

```js
var have = window.__ccrTokenKeys();
var add  = pendKeys.filter(k => have.indexOf(k) < 0);   // ticked, not yet committed
var drop = have.filter(k => pendKeys.indexOf(k) < 0);   // committed, no longer ticked
```

`add` is sound. `drop` is a data-loss bug.

## The failure

`pendKeys` is a **snapshot**, taken once when the session opened. Any token
committed after that seed — or before a seed that never ran, because the session
was already live — is simply absent from it. And `drop` reads absence as
intent.

Measured on the welding corpus: with `disc:Welding` already committed, tick two
welding courses and press Enter. Both are added **and `disc:Welding` is
destroyed** — a chip the reader never touched, gone with no message anywhere. The
reported symptom understated it badly: not *"a pick is silently lost"* but
*"an already-committed pick is destroyed by a commit the reader believes is
purely additive."*

The asymmetry is the whole lesson. `add` asks *"what did they tick?"* — a
question only the user's actions can answer, so the snapshot is irrelevant to it.
`drop` asks *"what is missing from my snapshot?"* — a question the snapshot
answers confidently and wrongly, because its blind spot is exactly the set of
things that happened while it was not looking.

## The rule

**Never derive a destructive action from the difference between a snapshot and
current state.** Record intent in both directions instead:

```js
// pendItem[k] is written only by an explicit tick; pendOff by an explicit untick
add:  pendKeys.filter(k => have.indexOf(k) < 0 && pendItem[k]).map(k => pendItem[k]),
drop: have.filter(k => pendOff.indexOf(k) >= 0)
```

A key the reader never touched is now **inert in both directions** — which is the
point. Two further properties fall out:

- **One definition, two readers.** `pendingEdit()` is called by the footer
  counter *and* the commit, so the counter cannot promise something the commit
  will not do.
- **A "missing" entry stops being an error.** Under the old model, a key with no
  item was an anomaly to be made loud. Under the new one it means *"seeded, not
  ticked"* — a legitimate state that needs no handling at all. Modeling intent
  correctly deleted the question rather than answering it.

## Guard it by naming the failure, not the count

The existing assertion could only report `1 -> 2`. A later session could satisfy
that by lowering the expectation to `nBefore + 1` and never learn what it had
agreed to. The guard added instead reports:

```
FAIL  (11a) ⭐ …and a pick the reader never touched is NOT removed by the commit
      — destroyed: ["disc:Welding"]
```

Mutation-tested: restore the derived `drop` and it turns red.

## Where else this shape appears

Anywhere a UI holds a working set and writes it back wholesale — a multi-select
that saves on close, a form that PUTs a whole object, a sync that reconciles a
local cache against a server. The narrower the snapshot's window, the more of the
world it silently claims authority over. If the write can delete, the deletions
must be **recorded**, not inferred.
