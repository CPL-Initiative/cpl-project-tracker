---
title: A snapshot of a live model is a claim that decays
created: 2026-08-23
updated: 2026-08-23
tags: [methodology, publishing, architecture, funding, documentation]
kb-status: published
obsidian-folder: cpl-project-tracker/kb-notes
related:
  - "[[CLAUDE]]"
  - "[[docs/cpl_funding_lessons]]"
artifacts:
  - funding-model/index.html
  - funding_model_payload.js
  - prototype/build_funding_model_explainer.js
---

# A snapshot of a live model is a claim that decays

> **One-sentence summary** — A document that explains a model someone can still
> edit must read that model at load time, because the alternative is a promise
> that a human will remember to rebuild it — and the failure is silent, arrives
> in front of the audience, and looks like confidence.

## What happened

"How this funding model works" was an audience-facing walk-through for the
Chancellor's Office: the pool waterfall, every college's two-year offer, the
priorities. Every figure in it was **computed by the model's own engine** — no
retyping — and published as a static artifact.

That was thought to be careful. It was not enough. The curator changed two dials
in the tab and reported that "the changes didn't propagate". The tab had
recalculated perfectly. The explainer had not, and could not: it was a snapshot
on a host that blocks the outbound call it would need to read the config.

⭐ **Computing a figure correctly once is not the same as the figure being
correct.** Both are true of a snapshot; only the second matters to a reader.

## Why "just rebuild it" is not a fix

The rebuild step existed and was documented. It required a person to notice a
dial had moved, run a script, and republish. Every part of that is a promise
about future attention, and the cost of forgetting is paid by the audience, not
by the person who forgot. A "Recalculate" button is the same promise with a
shorter path.

## The fix, and the one thing it must not break

Serve the document from the same origin as the application and let it read the
live configuration on load, through the application's own engine. Here that
meant a page in the repo, loading the tab's module, subscribing to its
model-change hook and painting from it. Nothing to rebuild.

⚠️ **Keep exactly one payload builder.** A live page and a snapshot script that
each assemble their own figures will drift, and the drift is invisible. Extract
the builder and have both call it — verified byte-identical against the previous
output — so a snapshot can differ from the live page only by *when* it was
taken, never by *how* it was computed.

## When a snapshot is still right

Not never. A figure that moves under a reader mid-conversation is wrong for an
email, a board packet, or anything cited by date. Keep the frozen build for
those, and make the source say plainly which artifact is which — the script's
docstring here names the live page and says explicitly not to repoint the
application's link at the snapshot.

## Two implementation traps

- **A painter written for a page that runs once will accumulate.** Repainting on
  every model change appended a second and third copy of three containers. Every
  container the painter appends into must be emptied first.
- **A failed computation must not leave the placeholder figures standing.** They
  read as current. Say so in a live region instead, and test it by breaking the
  builder.
